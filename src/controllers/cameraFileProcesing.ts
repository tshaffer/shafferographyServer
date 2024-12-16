import { Request, Response } from 'express';
import multer from 'multer';

import * as fs from 'fs';

import path from 'path';
import { convertHEICFileToJPEGWithEXIF } from './heicConverters';
import { getMediaItemFromGoogle } from './googlePhotos';

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

export const uploadRawMediaEndpoint = async (request: Request, response: Response) => {
  upload.array('files')(request, response, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return response.status(500).json({ error: err.message });
    } else if (err) {
      console.error('Unknown error:', err);
      return response.status(500).json({ error: err.message });
    }

    const albumName = request.body.albumName; // Multer parses this now
    console.log('Album Name:', albumName);

    console.log('no error on upload');
    console.log(request.files.length);

    const uploadedCameraFiles: Express.Multer.File[] = (request as any).files;
    console.log(uploadedCameraFiles);

    response.status(200).send({ uploadStatus: 'success', albumName });
  });
};

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
