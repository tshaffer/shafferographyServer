import { Request, Response } from 'express';

import { 
  PhotosToDisplaySpec, 
 } from '../types';
import { createPhotosToDisplaySpecDocument } from "../controllers";
import { isNil } from 'lodash';
import path from 'path';
import { fsLocalFolderExists, fsCreateNestedDirectory } from './fsUtils';

export const createPhotosToDisplaySpec = async (request: Request, response: Response, next: any) => {
  const photosToDisplaySpec: PhotosToDisplaySpec = {
    specifyDateRange: false,
  };
  await createPhotosToDisplaySpecDocument(photosToDisplaySpec);
  response.sendStatus(200);
};

export const valueOrNull = (possibleValue: any, convertToNumber: boolean = false): any | null => {
  if (isNil(possibleValue)) {
    return null;
  }
  if (convertToNumber) {
    possibleValue = parseInt(possibleValue);
  }
  return possibleValue;
}

let shardedDirectoryExistsByPath: any = {};

export const getShardedDirectory = async (mediaItemsDir: string, photoId: string): Promise<string> => {

  const numChars = photoId.length;
  const targetDirectory = path.join(
    mediaItemsDir,
    photoId.charAt(numChars - 2),
    photoId.charAt(numChars - 1),
  );

  return fsLocalFolderExists(targetDirectory)
    .then((dirExists: boolean) => {
      shardedDirectoryExistsByPath[targetDirectory] = true;
      if (dirExists) {
        return Promise.resolve(targetDirectory);
      }
      else {
        return fsCreateNestedDirectory(targetDirectory)
          .then(() => {
            return Promise.resolve(targetDirectory);
          });
      }
    })
    .catch((err: Error) => {
      console.log(err);
      return Promise.reject();
    });
};

