import { MediaItem } from "entities";
import { Tags } from "exiftool-vendored";

// export type TypedResponse<T> = Response & {
//   json: (body: T) => Response;
// };

export type StringToStringLUT = {
  [key: string]: string;
}

export interface FilePathToExifTags {
  [key: string]: Tags;
}

export type StringToMediaItem = {
  [key: string]: MediaItem;
}

