import { Request, Response } from 'express';
import multer from 'multer';

import * as fs from 'fs';

import path from 'path';
import { convertHEICFileToJPEGWithEXIF } from './heicConverters';
import { getMediaItemFromGoogle } from './googlePhotos';

export const uploadRawMediaEndpoint = async (request: Request, response: Response, next: any) => {

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
      return response.status(500).json(err);
    } else if (err) {
      console.log('nonMulterError: ', err);
      return response.status(500).json(err);
    } else {
      console.log('no error on upload');
      console.log(request.files.length);

      const uploadedCameraFiles: Express.Multer.File[] = (request as any).files;
      console.log(uploadedCameraFiles);

      const responseData = {
        uploadStatus: 'success',
      };
      return response.status(200).send(responseData);
    }
  });
}

export const convertHEICFilesEndpoint = async (request: Request, response: Response, next: any) => {
  // Indicate that this feature is not yet implemented
  response.status(501).json({
    message: 'This endpoint is not implemented yet.'
  });
}

export const convertHEICFileEndpoint = async (request: Request, response: Response, next: any) => {
  const { inputFile, outputFile } = request.body;

  const inputFilePath = path.join('public/uploads', inputFile);
  const outputFilePath = path.join('public/uploads', outputFile);

  try {
    // Attempt to convert the file
    await convertHEICFileToJPEGWithEXIF(inputFilePath, outputFilePath);
    // If successful, send a 200 OK response
    response.status(200).send({ message: 'File converted successfully' });
  } catch (error) {
    console.error('Error in convertHEICFileEndpoint:', error);

    // Respond with a 500 Internal Server Error or another appropriate status
    response.status(500).json({
      message: 'Error converting HEIC file',
      error: error.message || error // Return the error message to the client
    });
  }
};

export const getGoogleMediaItem = async (request: Request, response: Response, next: any) => {
  console.log('getGoogleMediaItem');
  console.log(request.query.googleAccessToken);
  console.log(request.query.googleId);
  
  const retVal = await getMediaItemFromGoogle(request.query.googleAccessToken as string, request.query.googleId as string);
  response.json(retVal);
}
