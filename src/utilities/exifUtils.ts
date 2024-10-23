import { execFileSync } from "child_process";

import {
  exiftool,
  Tags
} from 'exiftool-vendored';

// import { FilePathToExifTags } from '../types';

// export let filePathsToExifTags: FilePathToExifTags = {};

const getExifData = async (filePath: string): Promise<any> => {
  try {
    const tags: Tags = await exiftool.read(filePath);
    return tags;  
  } catch (error: any) {
    console.log('getExifData failed on: ', filePath);
    debugger;
  }
};

export const retrieveExifData = async (filePath: string): Promise<Tags> => {
  const exifData: Tags = await getExifData(filePath);
  return exifData;
  // let exifData: Tags;
  // if (filePathsToExifTags.hasOwnProperty(filePath)) {
  //   exifData = filePathsToExifTags[filePath];
  // } else {
  //   exifData = await getExifData(filePath);
  //   filePathsToExifTags[filePath] = exifData;
  // }
  // return exifData;
}

export const copyExifTags = async (sourceFile: string, targetFile: string, deleteOrientation: boolean) => {
  try {
    const copyOutput = execFileSync('exiftool', ['-TagsFromFile', sourceFile, targetFile]);
    console.log(`stdout: ${copyOutput.toString()}`);

    if (deleteOrientation) {
      const deleteTagOutput = execFileSync('exiftool', ['-Orientation=', targetFile]);
      console.log(`stdout: ${deleteTagOutput.toString()}`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (error.stderr) {
      console.error(`stderr: ${error.stderr.toString()}`);
    }
  }
}
