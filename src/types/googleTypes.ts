export interface GoogleMediaItem {
  id: string;
  filename: string;
  mimeType: string;
  productUrl: string;
  baseUrl: string;
  mediaMetadata: GoogleMediaMetadata;
}

export interface GoogleMediaMetadata {
  creationTime: Date; // or string?
  height: string;
  width: string;
  photo: GooglePhoto;
}

export interface GooglePhoto {
  apertureFNumber: number;
  cameraMake: string;
  cameraModel: string;
  focalLength: number;
  isoEquivalent: number;
}

export type IdToGoogleMediaItemArray = {
  [key: string]: GoogleMediaItem[]
}

export interface GoogleMediaItemsByIdInstance {
  creationDate: string;   // ISO date as string
  googleMediaItemsById: IdToGoogleMediaItemArray;
}

export interface GoogleAlbum {
  id: string;
  title: string;
  mediaItemsCount: string;
  productUrl: string;
  baseUrl: string;
  coverPhotoBaseUrl: string;
  coverPhotoMediaItemId: string;
}

export interface CreateGoogleAlbumResponse {
  id: string;
  title: string;
  productUrl: string;
  isWriteable: boolean;
}

export interface ContributorInfo {
  "profilePictureBaseUrl": string,
  "displayName": string
}

export interface Photo {
  "cameraMake": string,
  "cameraModel": string,
  "focalLength": number,
  "apertureFNumber": number,
  "isoEquivalent": number,
  "exposureTime": string
}

export interface Video {
  "cameraMake": string,
  "cameraModel": string,
  "fps": number,
  "status": any
}

export interface MediaMetadata {
    "creationTime": string,
    "width": string,
    "height": string,
    // Union field metadata can be only one of the following:
    "photo"?: Photo,
    "video"?: Video
  }

export interface BatchCreateGoogleMediaItem {
  "id": string,
  "description": string,
  "productUrl": string,
  "baseUrl"?: string,
  "mimeType": string,
  "mediaMetadata": MediaMetadata
  "contributorInfo"?: ContributorInfo,
  "filename": string
}

export interface Status {
  "message": string,
  "code": number,
  "details": [any],
}
export interface NewMediaItemResult {
  "uploadToken": string,
  "status": Status,
  "mediaItem": BatchCreateGoogleMediaItem,
}

export interface CreateMediaItemsResponse {
  newMediaItemResults: [NewMediaItemResult];
}

export interface UploadToGoogleResults {
  albumId: string;
  mediaItemIds: string[];
  createdMediaItems: BatchCreateGoogleMediaItem[];
}
