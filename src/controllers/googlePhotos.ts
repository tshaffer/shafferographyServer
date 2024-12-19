import { GoogleAlbum, GoogleMediaItem } from "../types";
// import { AuthService } from "../auth";
import { isArray, isNil } from 'lodash';
import { getGoogleRequest, postGoogleRequest } from './googleUtils';

export const GooglePhotoAPIs = {
  mediaItem: 'https://photoslibrary.googleapis.com/v1/mediaItems/',
  mediaItems: 'https://photoslibrary.googleapis.com/v1/mediaItems',
  albums: 'https://photoslibrary.googleapis.com/v1/albums',
  album: 'https://photoslibrary.googleapis.com/v1/albums/',
  mediaItemsSearch: 'https://photoslibrary.googleapis.com/v1/mediaItems:search',
  uploadMediaItem: 'https://photoslibrary.googleapis.com/v1/uploads',
  batchCreate: 'https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate',
  BATCH_GET_LIMIT: 49
};

export const getMediaItemFromGoogle = async (googleAccessToken: string, id: string): Promise<GoogleMediaItem> => {

  const url = `${GooglePhotoAPIs.mediaItem}${id}`;

  const googleMediaItem: GoogleMediaItem = await getGoogleRequest(googleAccessToken, url);

  return googleMediaItem;
}

export const getAlbumMediaItemsFromGoogle = async (googleAccessToken: string, albumId: string, nextPageToken: any = null): Promise<GoogleMediaItem[]> => {

  const googleMediaItems: GoogleMediaItem[] = [];

  let url = GooglePhotoAPIs.mediaItemsSearch;

  do {

    try {

      let postData: any = {
        albumId
      };
      if (nextPageToken !== null) {
        postData = {
          albumId,
          pageToken: nextPageToken
        };
      }
      const response: any = await postGoogleRequest(googleAccessToken, url, postData);

      if (!isNil(response)) {
        if (isArray(response.mediaItems)) {
          response.mediaItems.forEach((mediaItem: GoogleMediaItem) => {
            googleMediaItems.push(mediaItem);
          });
        }
        else {
          console.log('response.mediaItems is not array');
        }
        nextPageToken = response.nextPageToken;
      }
      else {
        console.log('response is nil');
      }

    } catch (err) {
      nextPageToken = null;
    }

  } while (nextPageToken != null);

  return googleMediaItems;
}

export const getGoogleAlbumDataByName = async (googleAccessToken: string, albumName: string): Promise<GoogleAlbum | null> => {

  const googleAlbums: GoogleAlbum[] = await getAllGoogleAlbums(googleAccessToken);

  for (const googleAlbum of googleAlbums) {
    if (googleAlbum.title === albumName) {
      return googleAlbum;
    }
  }

  return null;
}

export const getAllGoogleAlbums = async (googleAccessToken: string, nextPageToken: any = null): Promise<GoogleAlbum[]> => {

  const googleAlbums: GoogleAlbum[] = [];

  let url = GooglePhotoAPIs.albums;

  do {

    if (nextPageToken != null) {
      url = `${GooglePhotoAPIs.albums}?pageToken=${nextPageToken}`;
    }

    try {

      const response: any = await getGoogleRequest(googleAccessToken, url);
      if (!isNil(response)) {
        if (isArray(response.albums)) {
          response.albums.forEach((album: any) => {
            googleAlbums.push(album);
          });
        }
        else {
          console.log('response.albums is not array');
        }
        nextPageToken = response.nextPageToken;
      }
      else {
        console.log('response is nil');
      }

    } catch (err) {
      nextPageToken = null;
    }
  } while (nextPageToken != null);

  return googleAlbums;
};

/*
export const getGoogleAlbumData = async (authService: AuthService, albumId: string): Promise<GoogleAlbum> => {

  const url = `${GooglePhotoAPIs.album}${albumId}`;

  const response: any = await getRequest(authService, url);

  const { coverPhotoBaseUrl, coverPhotoMediaItemId, id, mediaItemsCount, productUrl, baseUrl, title } = response;
  const googleAlbum: GoogleAlbum = {
    coverPhotoBaseUrl,
    coverPhotoMediaItemId,
    id,
    mediaItemsCount,
    productUrl,
    baseUrl,
    title,
  }
  return googleAlbum;
}
*/
