import { Request, Response } from 'express';

import { CreateMediaItemsResponse, MediaItem, UploadToGoogleResults } from '../types';
import { uploadToGoogle } from './googleUploader';
import { getAlbumNamesWherePeopleNotRetrieved, updateMediaItemFieldsInDb } from './dbInterface';

export type TypedResponse<T> = Response & {
  json: (body: T) => Response;
};

export const uploadToGoogleEndpoint = async (request: Request, response: TypedResponse<CreateMediaItemsResponse>, next: any) => {

  const googleAccessToken = request.body.googleAccessToken;
  const albumName = request.body.albumName;

  console.log('uploadToGoogleEndpoint: ');
  console.log('googleAccessToken: ', googleAccessToken);
  console.log('albumName: ', albumName);
  console.log('mediaItemIds: ', request.body.mediaItemIds);

  const uploadToGoogleResults: UploadToGoogleResults = await uploadToGoogle(googleAccessToken, albumName, request.body.mediaItemIds);

  const { albumId, mediaItemIds, createdMediaItems } = uploadToGoogleResults;

  if (mediaItemIds.length !== createdMediaItems.length) {
    throw new Error('mediaItemIds and createdMediaItems are not the same length');
  }

  for (let i = 0; i < mediaItemIds.length; i++) {
    const mediaItemId = mediaItemIds[i];
    const createdMediaItem = createdMediaItems[i];
    const updates: Partial<MediaItem> = {
      albumId,
      albumName,
      googleMediaItemId: createdMediaItem.id,
      productUrl: createdMediaItem.productUrl,
      baseUrl: createdMediaItem.baseUrl,
    };
    await updateMediaItemFieldsInDb(mediaItemId, updates);
  }
}

export const getAlbumNamesWherePeopleNotRetrievedEndpoint = async (request: Request, response: TypedResponse<string[]>, next: any) => {
  try {
    const albumNames = await getAlbumNamesWherePeopleNotRetrieved();
    response.status(200).json(albumNames); 
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
}