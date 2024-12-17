import { Request, Response } from 'express';

import { CreateGoogleAlbumResponse, CreateMediaItemsResponse } from '../types';
import { uploadMediaItem, createMediaItem, addMediaItemsToAlbum, createGoogleAlbum, uploadToGoogle } from './googleUploader';

export type TypedResponse<T> = Response & {
  json: (body: T) => Response;
};

export const uploadGoogleMediaItemEndpoint = async (request: Request, response: TypedResponse<CreateMediaItemsResponse>, next: any) => {
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
    const mediaItem: CreateMediaItemsResponse = await createMediaItem(googleAccessToken, uploadToken, description);
    console.log('mediaItem: ', mediaItem);
    response.status(200).json(mediaItem);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
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
  const mediaItemIds = request.body.mediaItemIds;

  console.log('uploadToGoogleEndpoint: ');
  console.log('googleAccessToken: ', googleAccessToken);
  console.log('albumName: ', albumName);
  console.log('mediaItemIds: ', mediaItemIds);

  await uploadToGoogle(googleAccessToken, albumName, mediaItemIds);
}

