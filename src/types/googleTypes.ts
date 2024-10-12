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
