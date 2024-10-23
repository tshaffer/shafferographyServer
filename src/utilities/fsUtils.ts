import * as fs from 'fs-extra';
import path from 'path';
import * as nodeDir from 'node-dir';

const imageFileExtensions = ['.jpg', '.JPG', '.jpeg', '.JPEG', '.png', '.PNG', '.heic', '.HEIC'];

// interface MatchedPhoto {
//   imageFilePath: string;
//   exactMatch: boolean;
// }

// type IdToMatchedPhotoArray = {
//   [key: string]: MatchedPhoto[]
// }

const getFilesInDirectory = (rootDirPath: string): string[] => {
  return nodeDir.files(rootDirPath, { sync: true });
}

export const getJsonFilePaths = async (rootPath: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    nodeDir.readFiles(rootPath, {
      match: /.json$/,
    }, function (err, content, next) {
      if (err) throw err;
      // console.log('content:', content);
      next();
    },
      function (err, files) {
        if (err) throw err;
        return resolve(files);
      });
  });
}

export const getImageFilePaths = (rootPath: string): string[] => {
  const imageFiles: string[] = [];
  const files = getFilesInDirectory(rootPath);
  // TEDTODO - use regex?
  for (const file of files) {
    const extension: string = path.extname(file);
    if (imageFileExtensions.includes(extension)) {
      imageFiles.push(file);
    }
  }
  return imageFiles;
}

export const isImageFile = (fileSpec: string): boolean => {
  const extension: string = path.extname(fileSpec);
  return (imageFileExtensions.includes(extension));
}

export const getJsonFromFile = async (filePath: string): Promise<any> => {
  const readFileStream: fs.ReadStream = openReadStream(filePath);
  const fileContents: string = await readStream(readFileStream);
  try {
    const jsonObject: any = JSON.parse(fileContents);
    return jsonObject;
  } catch (error: any) {
    return {};
  }
}

const openReadStream = (filePath: string): fs.ReadStream => {
  let readStream = fs.createReadStream(filePath);
  return readStream;
}

export const readStream = async (stream: fs.ReadStream): Promise<string> => {

  return new Promise((resolve, reject) => {

    let str = '';
    stream.on('data', (data) => {
      str += data.toString();
    });

    stream.on('end', () => {
      return resolve(str);
    });

  })
}

export const openWriteStream = (filePath: string): fs.WriteStream => {
  let writeStream = fs.createWriteStream(filePath);
  return writeStream;
}

export const writeToWriteStream = (stream: fs.WriteStream, chunk: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    stream.write(chunk, () => {
      stream.write('\n', () => {
        return resolve();
      });
    });
  })
}

export const closeStream = (stream: fs.WriteStream): Promise<void> => {
  return new Promise((resolve, reject) => {
    stream.end(() => {
      return resolve();
    });
  })
}

export const writeJsonToFile = async (filePath: string, jsonData: any): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(filePath);
    fs.ensureDirSync(dir)
    const jsonContent = JSON.stringify(jsonData, null, 2);
    fs.writeFile(filePath, jsonContent, 'utf8', function (err) {
      if (err) {
        console.log("An error occured while writing JSON Object to File.");
        console.log(err);
        return reject(err);
      }
      return resolve(true);
    });
  })
}

export function fsLocalFolderExists(fullPath: string): Promise<boolean> {
  return Promise.resolve(fs.existsSync(fullPath))
    .then((exists) => {
      if (exists) {
        return fsLocalFileIsDirectory(fullPath);
      }
      return false;
    });
}

function fsLocalFileIsDirectory(fullPath: string) {
  return fs.stat(fullPath)
    .then((stat) => stat.isDirectory());
}

export function fsCreateNestedDirectory(dirPath: string) {
  return fs.mkdirp(dirPath);
}

export function fsRenameFile(oldPath: string, newPath: string) {
  return fs.renameSync(oldPath, newPath);
}

export const fsDeleteFiles = async (filePaths: string[]) => {

  const promises: Promise<any>[] = [];

  for (const filePath of filePaths) {
    promises.push(fs.remove(filePath));
  };

  return Promise.all(promises);
}

export const fsCopyFile = async (source: string, destination: string): Promise<void> => {
  try {
    await fs.copy(source, destination);
    console.log(`File copied from ${source} to ${destination}`);
  } catch (err) {
    console.error(`Error copying file from ${source} to ${destination}:`, err);
  }
}

export const getConvertibleImageFilePaths = (convertibleImageFileExtensions: string[], rootPath: string): string[] => {
  const imageFiles: string[] = [];
  const files = getFilesInDirectory(rootPath);
  for (const file of files) {
    const extension: string = path.extname(file);
    if (convertibleImageFileExtensions.includes(extension)) {
      imageFiles.push(file);
    }
  }
  return imageFiles;
}

export const checkAndCreateDirectory = async (path: string) => {
  try {
    await fs.access(path);
    console.log('Directory already exists.');
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Directory does not exist, create it
      await fs.mkdir(path, { recursive: true });
      console.log('Directory created successfully!');
    } else {
      throw err;
    }
  }
}
