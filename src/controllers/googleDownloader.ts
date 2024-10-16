import * as fse from 'fs-extra';

import { MediaItem } from "../types";
import request from 'request';
import { isNil } from "lodash";
import { AuthService } from "../auth";
import { GooglePhotoAPIs } from "./googlePhotos";
import { getGoogleHeaders, getGoogleRequest, getHeaders, getRequest } from './googleUtils';
// import { getAuthService } from './googlePhotosService';

export const downloadMediaItems = async (googleAccessToken: string, mediaItemGroups: MediaItem[][], mediaItemsDir: string): Promise<any> => {

  let filesDownloaded = 0;

  console.log('downloadMediaItems');

  for (const mediaItemGroup of mediaItemGroups) {
    if (!isNil(mediaItemGroup)) {
      for (const mediaItem of mediaItemGroup) {
        const retVal: any = await (downloadMediaItem(googleAccessToken, mediaItem, false));
        if (retVal.valid) {
          console.log(mediaItem.fileName);
          console.log(retVal.where);
          mediaItem.filePath = retVal.where;
          filesDownloaded++;
        } else {
          debugger;
        }
      }
    }
  }

  console.log('Number of files downloaded: ', filesDownloaded);
};

export const redownloadMediaItem = async (googleAccessToken: string, mediaItem: MediaItem): Promise<any> => {
  return downloadMediaItem(googleAccessToken, mediaItem, true);
}

const downloadMediaItem = async (googleAccessToken: string, mediaItem: MediaItem, overwrite: boolean): Promise<any> => {

  const where = mediaItem.filePath;

  // if file exists at 'where', don't redownload
  if (fse.existsSync(where) && !overwrite) {
    const ret: any = { valid: true, where, mediaItem };
    return Promise.resolve(ret);
  }

  const stream = await createDownloadStream(googleAccessToken, mediaItem);
  return new Promise((resolve, reject) => {
    stream.pipe(fse.createWriteStream(where)
      .on('close', () => {
        // this._setFileTimestamp(where, mediaItem);
        resolve({ valid: true, where, mediaItem });
      }))
      .on('error', (err: any) => {
        resolve({ valid: false, where, mediaItem });
      });
  });
};

const createDownloadStream = async (googleAccessToken: string, mediaItem: MediaItem) => {

  const headers = await getGoogleHeaders(googleAccessToken);
  const url: string = await createDownloadUrl(mediaItem);

  return request(url, { headers });

};

const createDownloadUrl = async (mediaItem: MediaItem) => {

  let downloadParams = '';

  const { width, height } = mediaItem;

  if (isNil(width) || isNil(height)) {
    debugger;
  }

  downloadParams += `w${width}-h${height}`;
  return `${mediaItem.baseUrl}=${downloadParams}`;
};

export const downloadMediaItemsMetadata = async (googleAccessToken: string, mediaItems: MediaItem[]): Promise<void> => {

  if (!isNil(mediaItems)) {

    const mediaItemsById: any = {};
    for (const mediaItem of mediaItems) {
      mediaItemsById[mediaItem.googleId] = mediaItem;
    }

    let url = `${GooglePhotoAPIs.mediaItems}:batchGet?`;

    mediaItems.forEach((mediaItem: MediaItem) => {
      const mediaItemId = mediaItem.googleId;
      url += `mediaItemIds=${mediaItemId}&`;
    });

    const result: any = await getGoogleRequest(googleAccessToken, url);

    const mediaItemResults: any[] = result.mediaItemResults;

    for (const mediaItemResult of mediaItemResults) {
      const googleId = mediaItemResult.mediaItem.id;
      if (!mediaItemsById.hasOwnProperty(googleId)) {
        debugger;
      }
      const mediaItem: MediaItem = mediaItemsById[googleId];
      mediaItem.baseUrl = mediaItemResult.mediaItem.baseUrl;
      mediaItem.productUrl = mediaItemResult.mediaItem.productUrl;
      mediaItem.baseUrl = mediaItemResult.mediaItem.baseUrl;
    }
  };
};
