import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFace, FaceVerificationStatus } from './entities/face.entity';
import { FaceVerificationResponseDto, RegisterFaceDto, VerifyFaceDto } from './dto/register-face.dto';
import { UsersService } from '../users/users.service';
import * as crypto from 'crypto';

@Injectable()
export class FaceService {
  private readonly logger = new Logger(FaceService.name);

  constructor(
    @InjectRepository(UserFace)
    private faceRepository: Repository<UserFace>,
    private usersService: UsersService,
  ) {}

  /**
   * Calculate Euclidean distance between two face descriptors
   * Lower distance = more similar (0 = identical)
   */
  private calculateDistance(descriptor1: number[], descriptor2: number[]): number {
    if (descriptor1.length !== descriptor2.length) {
      throw new Error('Face descriptors must have the same length');
    }

    let sum = 0;
    for (let i = 0; i < descriptor1.length; i++) {
      sum += Math.pow(descriptor1[i] - descriptor2[i], 2);
    }
    return Math.sqrt(sum);
  }

  /**
   * Compare face descriptors and return similarity score
   */
  private compareFaces(descriptor1: number[], descriptor2: number[]): {
    distance: number;
    similarity: number;
  } {
    const distance = this.calculateDistance(descriptor1, descriptor2);
    // Convert distance to similarity score (0-1, higher is more similar)
    const similarity = Math.max(0, 1 - distance / 2);
    return { distance, similarity };
  }

  /**
   * Generate verification token
   */
  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Register a user's face
   */
  async registerFace(registerFaceDto: RegisterFaceDto): Promise<UserFace> {
    this.logger.log(`Registering face for user: ${registerFaceDto.userId}`);

    // Check if user exists
    const user = await this.usersService.findById(registerFaceDto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has a face registered
    const existingFace = await this.faceRepository.findOne({
      where: { userId: registerFaceDto.userId, status: FaceVerificationStatus.VERIFIED }
    });

    if (existingFace) {
      throw new ConflictException('User already has a verified face registered');
    }

    // Validate face descriptor (should be 128-dimensional for FaceNet, etc.)
    if (registerFaceDto.faceDescriptor.length !== 128) {
      this.logger.warn(`Face descriptor length is ${registerFaceDto.faceDescriptor.length}, expected 128`);
    }

    // Create face record
    const face = this.faceRepository.create({
      userId: registerFaceDto.userId,
      name: registerFaceDto.name,
      faceDescriptor: registerFaceDto.faceDescriptor,
      faceDescriptorBackup: registerFaceDto.faceDescriptorBackup,
      faceImageUrl: registerFaceDto.faceImageUrl,
      status: FaceVerificationStatus.PENDING,
      verificationToken: this.generateVerificationToken(),
      metadata: {
        attempts: 0,
      }
    });

    const savedFace = await this.faceRepository.save(face);
    this.logger.log(`Face registered successfully with ID: ${savedFace.id}`);

    return savedFace;
  }

  /**
   * Verify a face against registered faces
   */
  async verifyFace(verifyFaceDto: VerifyFaceDto): Promise<FaceVerificationResponseDto> {
    this.logger.log(`Verifying face with threshold: ${verifyFaceDto.threshold || 0.6}`);

    const threshold = verifyFaceDto.threshold || 0.6;
    let facesToCompare: UserFace[] = [];

    // If specific user ID provided, only compare against that user's face
    if (verifyFaceDto.userId) {
      const face = await this.faceRepository.findOne({
        where: { 
          userId: verifyFaceDto.userId,
          status: FaceVerificationStatus.VERIFIED
        },
        relations: { user: true }
      });
      if (face) {
        facesToCompare = [face];
      }
    } else {
      // Compare against all verified faces
      facesToCompare = await this.faceRepository.find({
        where: { status: FaceVerificationStatus.VERIFIED },
        relations: { user: true }
      });
    }

    if (facesToCompare.length === 0) {
      return {
        success: false,
        verified: false,
        confidence: 0,
        message: 'No registered faces found',
      };
    }

    // Compare against all faces
    const matches: Array<{
      userId: string;
      name?: string;
      userName?: string;
      confidence: number;
      distance: number;
      faceRecord: UserFace;
    }> = [];
    for (const face of facesToCompare) {
      const { distance, similarity } = this.compareFaces(
        verifyFaceDto.faceDescriptor,
        face.faceDescriptor
      );

      matches.push({
        userId: face.userId,
        name: face.name,
        userName: face.user?.name,
        confidence: similarity,
        distance,
        faceRecord: face
      });
    }

    // Sort by confidence (highest first)
    matches.sort((a, b) => b.confidence - a.confidence);
    const bestMatch = matches[0];

    // Check if best match meets threshold
    const verified = bestMatch.confidence >= threshold;

    // Update metadata and attempts
    if (bestMatch?.faceRecord) {
      const metadata = bestMatch.faceRecord.metadata || {};
      metadata.attempts = (metadata.attempts || 0) + 1;
      metadata.lastAttemptAt = new Date();
      
      await this.faceRepository.update(bestMatch.faceRecord.id, { metadata });
    }

    this.logger.log(`Face verification result: ${verified ? 'SUCCESS' : 'FAILED'}, Confidence: ${bestMatch.confidence}`);

    return {
      success: true,
      verified,
      confidence: bestMatch.confidence,
      userId: verified ? bestMatch.userId : undefined,
      userName: verified ? bestMatch.userName : undefined,
      message: verified 
        ? `Face verified successfully with ${Math.round(bestMatch.confidence * 100)}% confidence`
        : `Face verification failed. Best match confidence: ${Math.round(bestMatch.confidence * 100)}%`,
      matchedFaces: matches.slice(0, 3).map(m => ({
        userId: m.userId,
        name: m.name || '',
        confidence: m.confidence
      }))
    };
  }

  /**
   * Verify face for login/authentication
   */
  async verifyAndAuthenticate(verifyFaceDto: VerifyFaceDto): Promise<any> {
    const verification = await this.verifyFace(verifyFaceDto);

    if (!verification.verified || !verification.userId) {
      throw new Error('Face verification failed');
    }

    // Get user details
    const user = await this.usersService.findById(verification.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate JWT token (you can integrate with your auth service)
    return {
      verified: true,
      user,
      confidence: verification.confidence,
    };
  }

  /**
   * Approve face registration (admin function)
   */
  async approveFace(faceId: string): Promise<UserFace> {
    const face = await this.faceRepository.findOne({ where: { id: faceId } });
    if (!face) {
      throw new NotFoundException('Face record not found');
    }

    face.status = FaceVerificationStatus.VERIFIED;
    face.verifiedAt = new Date();
    await this.faceRepository.save(face);

    this.logger.log(`Face approved: ${faceId} for user ${face.userId}`);
    return face;
  }

  /**
   * Reject face registration
   */
  async rejectFace(faceId: string, reason?: string): Promise<UserFace> {
    const face = await this.faceRepository.findOne({ where: { id: faceId } });
    if (!face) {
      throw new NotFoundException('Face record not found');
    }

    face.status = FaceVerificationStatus.REJECTED;
    if (reason) {
      face.metadata = { ...(face.metadata as Record<string, unknown>), rejectionReason: reason } as typeof face.metadata;
    }
    await this.faceRepository.save(face);

    this.logger.log(`Face rejected: ${faceId}`);
    return face;
  }

  /**
   * Get user's face registration
   */
  async getUserFace(userId: string): Promise<UserFace | null> {
    return await this.faceRepository.findOne({
      where: { userId, status: FaceVerificationStatus.VERIFIED },
      relations: { user: true }
    });
  }

  /**
   * Delete face registration
   */
  async deleteFace(faceId: string): Promise<void> {
    const result = await this.faceRepository.delete(faceId);
    if (result.affected === 0) {
      throw new NotFoundException('Face record not found');
    }
    this.logger.log(`Face deleted: ${faceId}`);
  }

  /**
   * Get all pending verifications (admin)
   */
  async getPendingVerifications(): Promise<UserFace[]> {
    return await this.faceRepository.find({
      where: { status: FaceVerificationStatus.PENDING },
      relations: { user: true },
      order: { createdAt: 'ASC' }
    });
  }

  /**
   * Update face descriptor (for better recognition)
   */
  async updateFaceDescriptor(faceId: string, newDescriptor: number[]): Promise<UserFace> {
    const face = await this.faceRepository.findOne({ where: { id: faceId } });
    if (!face) {
      throw new NotFoundException('Face record not found');
    }

    // Store old descriptor as backup
    face.faceDescriptorBackup = face.faceDescriptor;
    face.faceDescriptor = newDescriptor;
    await this.faceRepository.save(face);

    this.logger.log(`Face descriptor updated: ${faceId}`);
    return face;
  }
}