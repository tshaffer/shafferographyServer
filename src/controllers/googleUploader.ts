import axios from 'axios';
import * as fse from 'fs-extra';

import { GooglePhotoAPIs } from "./googlePhotos";
import { BatchCreateGoogleMediaItem, CreateGoogleAlbumResponse, CreateMediaItemsResponse, MediaItem, NewMediaItemResult, UploadToGoogleResults } from '../types';
import { isNil } from 'lodash';
import { getMediaItemFromDb } from './dbInterface';

// A function to upload a media file
export const uploadMediaItem = async (googleAccessToken: string, filePath: string, fileName: string): Promise<string> => {

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

// steps
// 1. create album
// 2. upload media items
// 3. add media items to album
// 4. update records in db
export const uploadToGoogle = async (googleAccessToken: string, albumName: string, mediaItemIds: string[]): Promise<UploadToGoogleResults> => {
  
  console.log('uploadToGoogle: ');
  console.log('googleAccessToken: ', googleAccessToken);
  console.log('albumName: ', albumName);
  console.log('mediaItemIds: ', mediaItemIds);

  try {

    // Create Album
    const googleAlbumResponse: CreateGoogleAlbumResponse = await createGoogleAlbum(googleAccessToken, albumName);
    console.log('googleAlbumResponse: ', googleAlbumResponse);
    // const { id, title, productUrl, isWriteable } = googleAlbumResponse;
    const albumId = googleAlbumResponse.id;

    // Upload Media Items
    const createdMediaItemIds: string[] = [];
    const createdMediaItems: BatchCreateGoogleMediaItem[] = [];
    for (const mediaItemId of mediaItemIds) {
      
      const mediaItem: MediaItem = await getMediaItemFromDb(mediaItemId);
      if (isNil(mediaItem)) {
        console.error('Media item not found in db');
        throw new Error('Media item not found in db');
      }

      const uploadToken: string = await uploadMediaItem(googleAccessToken, mediaItem.filePath, mediaItem.fileName);
      console.log('uploadToken: ', uploadToken);

      const googleMediaItem: CreateMediaItemsResponse = await createMediaItem(googleAccessToken, uploadToken, mediaItem.fileName);
      console.log('googleMediaItem: ', googleMediaItem);
      const newMediaItemResults: [NewMediaItemResult] = googleMediaItem.newMediaItemResults
      const resultToken = newMediaItemResults[0].uploadToken;
      const status = newMediaItemResults[0].status;
      const createdMediaItem: BatchCreateGoogleMediaItem = newMediaItemResults[0].mediaItem;
      const createdMediaItemId = createdMediaItem.id;
      createdMediaItemIds.push(createdMediaItemId);
      createdMediaItems.push(createdMediaItem);
    };

    console.log('completed uploading mediaItems');

    // Add Media Items to Album
    await addMediaItemsToAlbum(googleAccessToken, albumId, createdMediaItemIds);
    console.log('successful uploadToGoogle: ');

    return { albumId, mediaItemIds, createdMediaItems};

  } catch (error) {
    throw new Error('Failed to upload media to Google');
  }

}



