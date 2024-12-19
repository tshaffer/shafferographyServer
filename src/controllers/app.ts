import { Request, Response } from 'express';

import * as fs from 'fs';
import { promisify } from 'util';

import { version } from '../version';
import {
  getMediaItemsToDisplayFromDb,
  getAllKeywordDataFromDb,
  createKeywordDocument,
  createKeywordNodeDocument,
  setRootKeywordNodeDb,
  getMediaItemsToDisplayFromDbUsingSearchSpec,
  createTakeoutDocument,
  getTakeoutsFromDb,
  getTakeoutById,
  updateKeywordNodeDb,
  deleteMediaItemsFromDb,
  getMediaItemFromDb,
  addMediaItemToDeletedMediaItemsDBTable,
  getDeletedMediaItemsFromDb,
  removeDeleteMediaItemFromDb,
  clearDeletedMediaItemsDb,
  getMediaItemsInNamedAlbumFromDb,
  addAutoPersonKeywordsToDb,
  getAutoPersonKeywordNodesFromDb,
  getKeywordsFromDb,
  updateMediaItemFieldsInDb
} from './dbInterface';
import { Keyword, KeywordData, KeywordNode, MediaItem, SearchRule, SearchSpec, Takeout, AddedTakeoutData, UploadMediaFilesResponse, StringToStringLUT } from '../types';
import {
  fsDeleteFiles,
  getJsonFromFile
} from '../utilities';
import { MatchRule } from 'enums';
import { importFromTakeout, redownloadGooglePhoto } from './takeouts';
import path from 'path';
import { importFiles, uploadFiles, uploadPeopleTakeoutFiles } from './uploadImport';
import { isNil } from 'lodash';

export const getVersion = (request: Request, response: Response, next: any) => {
  const data: any = {
    serverVersion: version,
  };
  response.json(data);
};

export const getMediaItemsToDisplay = async (request: Request, response: Response) => {

  const specifyDateRange: boolean = JSON.parse(request.query.specifyDateRange as string);
  const startDate: string | null = request.query.startDate ? request.query.startDate as string : null;
  const endDate: string | null = request.query.endDate ? request.query.endDate as string : null;

  const mediaItems: MediaItem[] = await getMediaItemsToDisplayFromDb(
    specifyDateRange,
    startDate,
    endDate,
  );
  response.json(mediaItems);
};

export const getMediaItemsToDisplayFromSearchSpec = async (request: Request, response: Response) => {

  /*
    path += '?matchRule=' + matchRule;
    path += '&searchRules=' + JSON.stringify(searchRules);
  */

  const matchRule: MatchRule = request.query.matchRule as MatchRule;
  const searchRules: SearchRule[] = JSON.parse(request.query.searchRules as string) as SearchRule[];

  const searchSpec: SearchSpec = {
    matchRule,
    searchRules,
  };

  const mediaItems: MediaItem[] = await getMediaItemsToDisplayFromDbUsingSearchSpec(searchSpec);
  response.json(mediaItems);
};

export const getAllKeywordData = async (request: Request, response: Response, next: any) => {
  const keywordData: KeywordData = await getAllKeywordDataFromDb();
  response.json(keywordData);
};

export const addKeyword = async (request: Request, response: Response, next: any) => {
  const { keywordId, label, type } = request.body;
  const keyword: Keyword = { keywordId, label, type };
  const keywordIdFromDb: string = await createKeywordDocument(keyword);
  response.json(keywordIdFromDb);
}

export const addKeywordNode = async (request: Request, response: Response, next: any) => {
  const { nodeId, keywordId, parentNodeId, childrenNodeIds } = request.body;
  const keywordNode: KeywordNode = { nodeId, keywordId, parentNodeId, childrenNodeIds };
  const keywordNodeIdFromDb: string = await createKeywordNodeDocument(keywordNode);
  response.json(keywordNodeIdFromDb);
}

export const updateKeywordNode = async (request: Request, response: Response, next: any) => {
  const { nodeId, keywordId, parentNodeId, childrenNodeIds } = request.body;
  const keywordNode: KeywordNode = { nodeId, keywordId, parentNodeId, childrenNodeIds };
  await updateKeywordNodeDb(keywordNode);
  response.json(keywordNode);
}

export const initializeKeywordTree = async (request: Request, response: Response, next: any) => {

  const rootKeyword: Keyword = {
    keywordId: 'rootKeywordId',
    label: 'All',
    type: 'tbd'
  };
  const rootKeywordId: string = await createKeywordDocument(rootKeyword);

  const rootKeywordNode: KeywordNode = {
    nodeId: 'rootKeywordNodeId',
    keywordId: rootKeywordId,
    parentNodeId: '',
    childrenNodeIds: []
  };

  const peopleKeyword: Keyword = {
    keywordId: 'peopleKeywordId',
    label: 'People',
    type: 'tbd'
  };
  const peopleKeywordId: string = await createKeywordDocument(peopleKeyword);

  const peopleKeywordNode: KeywordNode = {
    nodeId: 'peopleKeywordNodeId',
    keywordId: peopleKeywordId,
    parentNodeId: rootKeywordNode.nodeId,
    childrenNodeIds: []
  };

  rootKeywordNode.childrenNodeIds.push(peopleKeywordNode.nodeId);
  await updateKeywordNodeDb(rootKeywordNode);

  response.status(200).send();
}

export const setRootKeywordNode = async (request: Request, response: Response, next: any) => {
  const { rootNodeId } = request.body;
  await setRootKeywordNodeDb(rootNodeId);
  response.status(200).send();
}

export const getTakeouts = async (request: Request, response: Response, next: any) => {
  const takeouts: any = await getTakeoutsFromDb();
  response.json(takeouts);
};

export const addTakeout = async (request: Request, response: Response, next: any) => {
  const { id, label, albumName, path } = request.body;
  const takeoutIdFromDb: string = await createTakeoutDocument({ id, label, albumName, path });
  response.json(takeoutIdFromDb);
}

export const importFromTakeoutEndpoint = async (request: Request, response: Response, next: any) => {
  const { id, googleAccessToken } = request.body;
  const takeout: Takeout = await getTakeoutById(id);
  const addedTakeoutData: AddedTakeoutData = await importFromTakeout(googleAccessToken, takeout.albumName, takeout.path);
  response.json(addedTakeoutData);
}

export const deleteMediaItems = async (request: Request, response: Response, next: any) => {

  const { mediaItemIds } = request.body;

  const filePaths: string[] = await Promise.all(mediaItemIds.map(async (iterator: string) => {
    const mediaItem: MediaItem = await getMediaItemFromDb(iterator);
    await addMediaItemToDeletedMediaItemsDBTable(mediaItem);
    return mediaItem.filePath;
  }));

  await deleteMediaItemsFromDb(mediaItemIds);
  await fsDeleteFiles(filePaths);

  response.sendStatus(200);
}

export const getDeletedMediaItems = async (request: Request, response: Response, next: any) => {
  const deletedMediaItems: any = await getDeletedMediaItemsFromDb();
  response.json(deletedMediaItems);
};

export const clearDeletedMediaItems = async (request: Request, response: Response, next: any) => {
  await clearDeletedMediaItemsDb();
  response.sendStatus(200);
}

export const removeDeletedMediaItem = async (request: Request, response: Response, next: any) => {
  const { mediaItemId } = request.body;
  await removeDeleteMediaItemFromDb(mediaItemId);
  response.sendStatus(200);
}

export const redownloadMediaItemEndpoint = async (request: Request, response: Response, next: any) => {
  const { id, googleAccessToken } = request.body;
  const mediaItem: MediaItem = await getMediaItemFromDb(id);
  await redownloadGooglePhoto(googleAccessToken, mediaItem);
  response.sendStatus(200);
}

const realpath = promisify(fs.realpath);

export const getSubdirectoriesFromFs = async (dirPath: string): Promise<string[]> => {
  try {
    const realDirPath = await realpath(dirPath);
    const dirents: fs.Dirent[] = await fs.promises.readdir(realDirPath, { withFileTypes: true });
    const files = dirents
      .filter(dirent => dirent.isDirectory())
      // .map(dirent => path.join(realDirPath, dirent.name));
      .map(dirent => dirent.name);
    return files;
  } catch (err) {
    if (err.code === 'EACCES') {
      console.error('Permission denied:', err.path);
    } else if (err.code === 'ENOENT') {
      console.error('Directory does not exist:', err.path);
    } else if (err.code === 'EPERM') {
      console.error('Operation not permitted:', err.path);
    } else {
      console.error('Error reading directory:', err);
    }
    throw err;
  }
}

export const uploadAndImportEndpoint = async (request: Request, response: Response, next: any) => {
  try {
    const uploadedMediaFilesResponse: UploadMediaFilesResponse = await uploadFiles(request, response);
    const { albumName, files } = uploadedMediaFilesResponse;
    const filePaths: string[] = files.map((file: Express.Multer.File) => file.path);

    await importFiles(filePaths);

    response.sendStatus(200);
  } catch (error) {
    console.error('Error in uploadAndImportEndpoint:', error);
    response.status(500).json(error);
  }
}

export const uploadPeopleTakeoutsEndpoint = async (request: Request, response: Response, next: any) => {

  // TEDTODO - should not be hard coded
  const peopleTakeoutFilesDir = '/Users/tedshaffer/Documents/Projects/shafferography/shafferographyServer/public/peopleTakeoutFiles';

  try {
    const uploadedPeopleTakeoutFiles: Express.Multer.File[] = await uploadPeopleTakeoutFiles(request, response);

    let albumName: string = '';

    for (const uploadedPeopleTakeoutFile of uploadedPeopleTakeoutFiles) {
      if (uploadedPeopleTakeoutFile.filename === 'metadata.json') {
        const metadataFilePath: string = uploadedPeopleTakeoutFile.path;
        const metadataFileContents: string = fs.readFileSync(metadataFilePath, 'utf8');
        const metadata = JSON.parse(metadataFileContents);
        albumName = metadata.title;
      }
    }

    if (albumName === '') {
      console.error('Album name not found in metadata.json');
      response.status(500).json('Album name not found in metadata.json');
      return;
    }

    const mediaItemsInAlbum: MediaItem[] = await getMediaItemsInNamedAlbumFromDb(albumName);

    const personKeywordNames: Set<string> = new Set<string>();

    for (const mediaItemInAlbum of mediaItemsInAlbum) {
      const takeoutMetaDataFilePath: string = path.join(peopleTakeoutFilesDir, mediaItemInAlbum.fileName + '.json');
      const takeoutMetadata: any = await getJsonFromFile(takeoutMetaDataFilePath);
      if (!isNil(takeoutMetadata.people)) {
        takeoutMetadata.people.forEach((person: any) => {
          personKeywordNames.add(person.name);
        });
      }
    }

    let addedKeywordData: KeywordData = null;
    const addedMediaItems: MediaItem[] = [];

    if (personKeywordNames.size > 0) {
      addedKeywordData = await (addAutoPersonKeywordsToDb(personKeywordNames));
    }

    const keywords: Keyword[] = await getKeywordsFromDb();

    const autoPersonKeywordNodes: KeywordNode[] = await getAutoPersonKeywordNodesFromDb();

    const personNameToAutoPersonKeywordNodeId: StringToStringLUT = {};
    personKeywordNames.forEach((personName: string) => {
      autoPersonKeywordNodes.forEach((autoPersonKeywordNode: KeywordNode) => {
        const autoPersonKeywordId: string = autoPersonKeywordNode.keywordId;
        const keyword: Keyword = keywords.find((keyword: Keyword) => keyword.keywordId === autoPersonKeywordId);
        if (keyword.label === personName) {
          personNameToAutoPersonKeywordNodeId[personName] = autoPersonKeywordNode.nodeId;
        }
      });
    });

    const keywordIdByKeywordLabel: StringToStringLUT = {};
    keywords.forEach((keyword: Keyword) => {
      keywordIdByKeywordLabel[keyword.label] = keyword.keywordId;
    })

    for (const mediaItemInAlbum of mediaItemsInAlbum) {
      const takeoutMetaDataFilePath: string = path.join(peopleTakeoutFilesDir, mediaItemInAlbum.fileName + '.json');
      const takeoutMetadata: any = await getJsonFromFile(takeoutMetaDataFilePath);

      const keywordNodeIds: string[] = [];

      if (!isNil(takeoutMetadata.people)) {
        takeoutMetadata.people.forEach((person: any) => {
          const name: string = person.name;
          keywordNodeIds.push(personNameToAutoPersonKeywordNodeId[name]);
        })
      }

      const people: string[]| null = takeoutMetadata.people ? takeoutMetadata.people : null;

      const updates: Partial<MediaItem> = {
        people,
        keywordNodeIds,
      };
      await updateMediaItemFieldsInDb(mediaItemInAlbum.uniqueId, updates);

    }

    response.sendStatus(200);
  } catch (error) {
    console.error('Error in uploadPeopleTakeoutsEndpoint:', error);
    response.status(500).json(error);
  }
}
