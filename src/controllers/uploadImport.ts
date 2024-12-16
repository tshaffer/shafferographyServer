import { Request, Response } from 'express';
import multer from 'multer';

import * as fs from 'fs';

import path from 'path';

export const uploadFiles = async (request: Request, response: Response) => {

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Set upload directory based on the file's relative path
      const uploadPath = path.join('public/uploads', path.dirname(file.originalname));
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
  
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      cb(null, path.basename(file.originalname)); // Save file with its original name
    }
  });

  const upload = multer({ storage });
  upload.array('files')(request, response, async (err) => {
    console.log('upload.array callback');
    console.log(upload);
    if (err instanceof multer.MulterError) {
      console.log('MulterError: ', err);
      throw err;
    } else if (err) {
      console.log('nonMulterError: ', err);
      throw err;
    } else {
      console.log('no error on upload');
      console.log(request.files.length);

      const uploadedCameraFiles: Express.Multer.File[] = (request as any).files;
      console.log(uploadedCameraFiles);
    }
  });
}

