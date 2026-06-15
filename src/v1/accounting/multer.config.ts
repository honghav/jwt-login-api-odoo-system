import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';

export const revenueStorage = diskStorage({
  destination: './storage/uploads/revenues',

  filename: (req, file, cb) => {
    const filename =
      `${randomUUID()}${extname(file.originalname)}`;

    cb(null, filename);
  },
});