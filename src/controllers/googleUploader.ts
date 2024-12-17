import axios from 'axios';
import path from 'path';
import * as fse from 'fs-extra';

import { GooglePhotoAPIs } from "./googlePhotos";
import { CreateGoogleAlbumResponse, CreateMediaItemsResponse } from '../types';

// A function to upload a media file
export const uploadMediaItem = async (googleAccessToken: string, filePath: string): Promise<string> => {

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
export const createMediaItem = async (googleAccessToken: string, uploadToken: string, description: string): Promise<CreateMediaItemsResponse> => {
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

    const createMediaItemResponse: CreateMediaItemsResponse = createMediaResponse.data;
    return createMediaItemResponse;
  } catch (error) {
    console.error('Error creating media item:', error.response ? error.response.data : error);
    throw new Error('Failed to create media item');
  }
}

const postGoogleRequest = async (googleAccessToken: string, url: string, fileName: string, data: any): Promise<any> => {

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

export const createGoogleAlbum = async (googleAccessToken: string, albumName: string): Promise<CreateGoogleAlbumResponse> => {

  const url = GooglePhotoAPIs.albums;

  const headers = {
    'Authorization': 'Bearer ' + googleAccessToken,
    'Content-type': 'application/octet-stream',
  };

  const data = {
    album: {
      title: albumName,
    },
  };

  try {
    return axios.post(
      url,
      data,
      {
        headers,
      })
      .then((response: any) => {
        console.log('createGoogleAlbum: ', response);
        console.log('createGoogleAlbum.data: ', response?.data);
        return Promise.resolve(response.data);
      });
  } catch (error) {
    console.error('Error creating album:', error.response ? error.response.data : error);
    throw new Error('Failed to create album');
  }
}

export const addMediaItemsToAlbum = async (
  googleAccessToken: string,
  albumId: string,
  mediaItemIds: string[]
): Promise<any> => {

  const url = `https://photoslibrary.googleapis.com/v1/albums/${albumId}:batchAddMediaItems`;

  try {
    const response = await axios.post(
      url,
      {
        mediaItemIds,
      },
      {
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('addMediaItemsToAlbum: ', response);
    console.log('addMediaItemsToAlbum.data: ', response?.data);
    return response.data;
  } catch (error) {
    console.error('Error adding media items to album:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        `Failed to add media items: ${error.response.status} - ${error.response.data.error.message}`
      );
    } else {
      throw new Error(`Failed to add media items: ${error}`);
    }
  }
};

export const uploadToGoogle = async (googleAccessToken: string, albumName: string, mediaItemIds: string[]): Promise<any> => {
  console.log('uploadToGoogle: ');
  console.log('googleAccessToken: ', googleAccessToken);
  console.log('albumName: ', albumName);
  console.log('mediaItemIds: ', mediaItemIds);
}



