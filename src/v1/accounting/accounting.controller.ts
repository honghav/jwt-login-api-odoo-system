import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

import { CreateRevenueDto } from './dto/create-revenue.dto';
import { UpdateRevenueDto } from './dto/update-revenue.dto';
import { AccountingService } from './accounting.service';

@ApiTags('Accounting')
@Controller('accounting')
export class AccountingController {
  constructor(
    private readonly accoutingService: AccountingService,
  ) {}

  @Post('revenue/create')
  @ApiOperation({
    summary: 'Create revenue',
    description: 'Create a new revenue record',
  })
  @ApiBody({
    type: CreateRevenueDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Revenue created successfully',
  })
  create(
    @Body() dto: CreateRevenueDto,
  ) {
    return this.accoutingService.create(dto);
  }

  @Get('revenues')
  @ApiOperation({
    summary: 'Get all revenues',
  })
  @ApiResponse({
    status: 200,
    description: 'List of revenues',
  })
  findAll() {
    return this.accoutingService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get revenue by id',
  })
  @ApiParam({
    name: 'id',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue found',
  })
  @ApiResponse({
    status: 404,
    description: 'Revenue not found',
  })
  findOne(
    @Param('id') id: string,
  ) {
    return this.accoutingService.findOne(id);
  }

  @Patch('revenue/:id')
  @ApiOperation({
    summary: 'Update revenue',
  })
  @ApiParam({
    name: 'id',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdateRevenueDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue updated successfully',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRevenueDto,
  ) {
    return this.accoutingService.update(
      id,
      dto,
    );
  }

  @Delete('revenue/:id')
  @ApiOperation({
    summary: 'Delete revenue',
  })
  @ApiParam({
    name: 'id',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue deleted successfully',
  })
  remove(
    @Param('id') id: string,
  ) {
    return this.accoutingService.remove(id);
  }
}