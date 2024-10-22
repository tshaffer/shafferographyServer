import axios from 'axios';
import path from 'path';
import * as fse from 'fs-extra';
import { Request, Response } from 'express';

import { GooglePhotoAPIs } from "./googlePhotos";

// A function to upload a media file
const uploadMediaItem = async (googleAccessToken: string, filePath: string): Promise<string> => {

  const fileName = path.basename(filePath);

  try {
    const mediaBuffer = fse.readFileSync(filePath);

    const url = GooglePhotoAPIs.uploadMediaItem;

    const uploadToken: string = await postGoogleRequest(googleAccessToken, url, fileName, mediaBuffer);
    console.log('uploadToken: ', uploadToken);
    return uploadToken;
  } catch (error) {
    console.error('Error uploading media:', error.response ? error.response.data : error);
    throw new Error('Failed to upload media');
  }
}

// A function to create a media item using the upload token
const createMediaItem = async (googleAccessToken: string, uploadToken: string, description: string): Promise<any> => {
  try {

    const url = GooglePhotoAPIs.batchCreate;

    const createMediaResponse = await axios.post(
      url,
      {
        newMediaItems: [
          {
            description: description,
            simpleMediaItem: {
              uploadToken: uploadToken,
            },
          },
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return createMediaResponse.data;
  } catch (error) {
    console.error('Error creating media item:', error.response ? error.response.data : error);
    throw new Error('Failed to create media item');
  }
}

export const uploadGoogleMediaItem = async (request: Request, response: Response, next: any) => {
  const googleAccessToken = request.body.googleAccessToken;
  const filePath = request.body.filePath;
  const description = request.body.description || 'Uploaded via Shafferography';

  console.log('uploadGoogleMediaItem: ');
  console.log('googleAccessToken: ', googleAccessToken);
  console.log('filePath: ', filePath);
  console.log('description: ', description);

  try {
    const uploadToken = await uploadMediaItem(googleAccessToken, filePath);
    console.log('uploadToken: ', uploadToken);
    const mediaItem = await createMediaItem(googleAccessToken, uploadToken, description);
    console.log('mediaItem: ', mediaItem);
    response.status(200).json(mediaItem);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
}

const postGoogleRequest = async (googleAccessToken: string, url: string, fileName: string, data: any): Promise<string> => {

  const headers = {
    'Authorization': 'Bearer ' + googleAccessToken,
    'Content-type': 'application/octet-stream',
    'X-Goog-Upload-File-Name': fileName,
    'X-Goog-Upload-Protocol': 'raw',
  };

  return axios.post(
    url,
    data,
    {
      headers,
    })
    .then((response: any) => {
      console.log('uploadResponse: ', response);
      console.log('uploadResponse.data: ', response?.data);
      return Promise.resolve(response.data);
    }).catch((err: Error) => {
      debugger;
      console.log('response to axios post: ');
      console.log('err: ', err);
      return Promise.reject(err);
    });

}
