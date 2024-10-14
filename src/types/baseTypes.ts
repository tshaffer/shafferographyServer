import { MediaItem } from "entities";
import { Tags } from "exiftool-vendored";

export type StringToStringLUT = {
  [key: string]: string;
}

export interface FilePathToExifTags {
  [key: string]: Tags;
}

export type StringToMediaItem = {
  [key: string]: MediaItem;
}

