import { Request, Response } from 'express';
import multer from 'multer';

import * as fs from 'fs';

import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { GeoData, MediaItem, UploadMediaFilesResponse } from '../types';
import { ExifDateTime, Tags } from 'exiftool-vendored';
import { isNil } from 'lodash';
import { fsCopyFile, getShardedDirectory, isImageFile, retrieveExifData, valueOrNull } from '../utilities';
import { DateTime } from 'luxon';
import { addMediaItemToMediaItemsDBTable } from './dbInterface';

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

const uploadPeopleTakeoutFile = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join('public/peopleTakeoutFiles');
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

export const uploadFiles = async (request: Request, response: Response): Promise<UploadMediaFilesResponse> => {

  return new Promise((resolve, reject) => {
    upload.array('files')(request, response, (err) => {
      if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        throw err;
      } else if (err) {
        console.error('Unknown error:', err);
        throw err;
      }

      const albumName = request.body.albumName; // Multer parses this now
      console.log('Album Name:', albumName);

      console.log('no error on upload');
      console.log(request.files.length);

      const uploadedCameraFiles: Express.Multer.File[] = (request as any).files;
      console.log(uploadedCameraFiles);

      resolve({ albumName, files: uploadedCameraFiles });
    });
  });
};

export const uploadPeopleTakeoutFiles = async (request: Request, response: Response): Promise<Express.Multer.File[]> => {

  return new Promise((resolve, reject) => {
    uploadPeopleTakeoutFile.array('files')(request, response, (err) => {
      if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        throw err;
      } else if (err) {
        console.error('Unknown error:', err);
        throw err;
      }

      console.log('no error on uploadPeopleTakeoutFile');
      console.log(request.files.length);
      console.log(request.files);

      const uploadedPeopleTakeoutFiles: Express.Multer.File[] = (request as any).files;
      console.log(uploadedPeopleTakeoutFiles);

      resolve(uploadedPeopleTakeoutFiles);
    });
  });
};


async function getLocalStorageMediaItems(imageFilePaths: string[]): Promise<MediaItem[]> {

  const mediaItems: MediaItem[] = await Promise.all(imageFilePaths.map(async (imageFilePath) => {
    const mediaItem: MediaItem = await getLocalStorageMediaItem(imageFilePath);
    return mediaItem;
  }));

  return mediaItems;
}

async function convertCreateDateToISO(tags: Tags): Promise<string | null> {
  try {
    const createDate = tags.CreateDate; // ExifDateTime | string | undefined
    if (!createDate) {
      throw new Error('CreateDate not found in EXIF tags');
    }

    let isoDateString: string;

    if (createDate instanceof ExifDateTime) {
      // If CreateDate is an ExifDateTime object, use its properties directly and set to UTC
      const dateTime = DateTime.fromObject({
        year: createDate.year,
        month: createDate.month,
        day: createDate.day,
        hour: createDate.hour,
        minute: createDate.minute,
        second: createDate.second,
        millisecond: createDate.millisecond,
        zone: 'utc'
      });
      isoDateString = dateTime.toISO();
    } else {
      // If CreateDate is a string, parse and format it using Luxon and set to UTC
      // Assuming the string format is "yyyy:MM:dd HH:mm:ss"
      const parsedDate = DateTime.fromFormat(createDate, 'yyyy:MM:dd HH:mm:ss', { zone: 'utc' });
      isoDateString = parsedDate.toISO();
    }

    return isoDateString;
  } catch (err) {
    console.error('Error converting CreateDate to ISO format:', err);
    return null;
  }
}

async function extractGeoData(tags: Tags): Promise<GeoData | null> {
  try {
    if (tags.GPSLatitude && tags.GPSLongitude) {
      const geoData: GeoData = {
        latitude: tags.GPSLatitude,
        longitude: tags.GPSLongitude,
        altitude: tags.GPSAltitude || 0, // Default to 0 if altitude is not available
        latitudeSpan: 0, // Adjust based on your needs
        longitudeSpan: 0, // Adjust based on your needs
      };
      return geoData;
    } else {
      console.error('No GPS data found in EXIF tags');
      return null;
    }
  } catch (err) {
    console.error('Error reading EXIF data:', err);
    return null;
  }
}


async function getLocalStorageMediaItem(fullPath: string): Promise<MediaItem> {

  const exifData: Tags = await retrieveExifData(fullPath);
  const isoCreateDate: string | null = await convertCreateDateToISO(exifData);
  const geoData: GeoData | null = await extractGeoData(exifData);

  const mediaItem: MediaItem = {
    uniqueId: uuidv4(),
    googleMediaItemId: '',
    fileName: path.basename(fullPath),
    albumId: '',
    albumName: '',
    filePath: fullPath,
    productUrl: null,
    baseUrl: null,
    mimeType: valueOrNull(exifData.MIMEType),
    creationTime: isoCreateDate,
    width: exifData.ImageWidth, // or ExifImageWidth?
    height: exifData.ImageHeight, // or ExifImageHeight?
    orientation: isNil(exifData) ? null : valueOrNull(exifData.Orientation),
    // description from exifData or from takeoutMetadata? - I'm not sure that what's below makes sense.
    // description: isNil(exifData) ? null : valueOrNull(takeoutMetadata.description),
    description: null,
    geoData,
    people: null,
    peopleRetrievedFromGoogle: false,
    keywordNodeIds: []
  }

  return mediaItem;
}

const addMediaItemsFromLocalStorage = async (localStorageFolder: string, mediaItems: MediaItem[]): Promise<any> => {

  // TEDTODO - should not be hard coded
  const mediaItemsDir = '/Users/tedshaffer/Documents/Projects/shafferography/shafferographyServer/public/images';
  const uploadsDir = '/Users/tedshaffer/Documents/Projects/shafferography/shafferographyServer/public/uploads';

  for (const mediaItem of mediaItems) {
    const mediaItemFileName = mediaItem.fileName;
    if (isImageFile(mediaItemFileName)) {
      const fileSuffix = path.extname(mediaItemFileName);
      const shardedFileName = mediaItem.uniqueId + fileSuffix;

      const baseDir: string = await getShardedDirectory(mediaItemsDir, mediaItem.uniqueId);
      // const from = path.join(takeoutFolder, googleFileName);
      const where = path.join(baseDir, shardedFileName);

      console.log('mediaItemFileName', mediaItemFileName);
      console.log('shardedFileName:', shardedFileName);
      console.log('baseDir:', baseDir);
      console.log('where:', where);

      mediaItem.filePath = where;

      await addMediaItemToMediaItemsDBTable(mediaItem);

      const sourcePath: string = path.join(uploadsDir, mediaItemFileName);
      // const sourcePath: string = mediaItem.filePath;
      console.log('copy file from: ', sourcePath, ' to: ', where);
      await fsCopyFile(sourcePath, where);
    }
  }

  return [];
}

export const importFiles = async (imageFilePaths: string[]): Promise<any> => {

  const localStorageMediaItems: MediaItem[] = await getLocalStorageMediaItems(imageFilePaths);

  // skip step that checks for image file existence in db

  // add the mediaItems to the db
  await addMediaItemsFromLocalStorage('', localStorageMediaItems);

  console.log('localStorageMediaItems:', localStorageMediaItems.length);

  return Promise.resolve();
}

