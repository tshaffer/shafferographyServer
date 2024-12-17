import { Request, Response } from 'express';

import { CreateGoogleAlbumResponse, CreateMediaItemsResponse, MediaItem, UploadToGoogleResults } from '../types';
import { uploadMediaItem, createMediaItem, addMediaItemsToAlbum, createGoogleAlbum, uploadToGoogle } from './googleUploader';
import { getAlbumNamesWherePeopleNotRetrieved, updateMediaItemFieldsInDb } from './dbInterface';

export type TypedResponse<T> = Response & {
  json: (body: T) => Response;
};

export const uploadGoogleMediaItemEndpoint = async (request: Request, response: TypedResponse<CreateMediaItemsResponse>, next: any) => {
  response.sendStatus(200);
  // const googleAccessToken = request.body.googleAccessToken;
  // const filePath = request.body.filePath;
  // const description = request.body.description || 'Uploaded via Shafferography';

  // console.log('uploadGoogleMediaItem: ');
  // console.log('googleAccessToken: ', googleAccessToken);
  // console.log('filePath: ', filePath);
  // console.log('description: ', description);

  // try {
  //   const uploadToken = await uploadMediaItem(googleAccessToken, filePath);
  //   console.log('uploadToken: ', uploadToken);
  //   const mediaItem: CreateMediaItemsResponse = await createMediaItem(googleAccessToken, uploadToken, description);
  //   console.log('mediaItem: ', mediaItem);
  //   response.status(200).json(mediaItem);
  // } catch (error) {
  //   response.status(500).json({ message: error.message });
  // }
}

export const addMediaItemsToAlbumEndpoint = async (request: Request, response: Response, next: any) => {

  const googleAccessToken = request.body.googleAccessToken;
  const albumId = request.body.albumId;
  const mediaItemIds = request.body.mediaItemIds;

  console.log('addMediaItemsToAlbumEndpoint: ');
  console.log('googleAccessToken: ', googleAccessToken);
  console.log('albumId: ', albumId);
  console.log('mediaItemIds: ', mediaItemIds);

  try {
    await addMediaItemsToAlbum(googleAccessToken, albumId, mediaItemIds);
    console.log('successful addMediaItemsToAlbumEndpoint: ');
    response.sendStatus(200);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
}

export const createGoogleAlbumEndpoint = async (
  request: Request,
  response: TypedResponse<CreateGoogleAlbumResponse>) => {

  const googleAccessToken = request.body.googleAccessToken;
  const albumName = request.body.albumName;

  console.log('createGoogleAlbumEndpoint: ');
  console.log('googleAccessToken: ', googleAccessToken);
  console.log('albumName: ', albumName);

  try {
    const googleAlbumResponse: CreateGoogleAlbumResponse = await createGoogleAlbum(googleAccessToken, albumName);
    console.log('googleAlbumResponse: ', googleAlbumResponse);
    response.status(200).json(googleAlbumResponse);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
}

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