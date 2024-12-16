import { Request, Response } from 'express';
import multer from 'multer';

import * as fs from 'fs';

import path from 'path';
import { UploadMediaFilesResponse } from '../types';

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join('public/uploads');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname); // Save file with original name
    },
  }),
});

export const uploadFiles = async (request: Request, response: Response): Promise<UploadMediaFilesResponse> => {
  
  return new Promise((resolve, reject) => {
    upload.array('files')(request, response, (err) => {
      if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        throw err;
      } else if (err) {
        console.error('Unknown error:', err);
        throw err;
      }

      const albumName = request.body.albumName; // Multer parses this now
      console.log('Album Name:', albumName);

      console.log('no error on upload');
      console.log(request.files.length);

      const uploadedCameraFiles: Express.Multer.File[] = (request as any).files;
      console.log(uploadedCameraFiles);

      resolve( { albumName, files: uploadedCameraFiles });
    });
  });
};
