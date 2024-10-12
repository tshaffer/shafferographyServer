import { v4 as uuidv4 } from 'uuid';
import { isArray, isEmpty, isNil } from 'lodash';
import {
  getDeletedMediaItemModel,
  getKeywordModel,
  getKeywordNodeModel,
  getKeywordTreeModel,
  getMediaitemModel,
} from '../models';
import {
  MediaItem,
  PhotosToDisplaySpec,
  Keyword,
  KeywordNode,
  SearchSpec,
  SearchRule,
  KeywordSearchRule,
  DateSearchRule,
  Takeout,
  KeywordData,
} from '../types';
import { Document } from 'mongoose';
import { getPhotosToDisplaySpecModel } from '../models/PhotosToDisplaySpec';
import { DateSearchRuleType, KeywordSearchRuleType, MatchRule, SearchRuleType } from '../types/enums';
import { getTakeoutModel } from '../models';

export const getMediaItemFromDb = async (mediaItemId: string): Promise<MediaItem> => {
  const mediaItemModel = getMediaitemModel();
  const filter = { googleId: mediaItemId };
  const mediaItemDocument: Document = await mediaItemModel.findOne(filter);
  const mediaItem: MediaItem = mediaItemDocument.toObject() as MediaItem;
  return mediaItem;
}

export const getAllMediaItemsFromDb = async (): Promise<MediaItem[]> => {

  const mediaItemModel = getMediaitemModel();

  const mediaItems: MediaItem[] = [];
  const documents: any = await (mediaItemModel as any).find().exec();
  for (const document of documents) {
    const mediaItem: MediaItem = document.toObject() as MediaItem;
    mediaItem.googleId = document.googleId.toString();
    mediaItems.push(mediaItem);
  }
  return mediaItems;
}

export const getMediaItemsToDisplayFromDb = async (
  specifyDateRange: boolean,
  startDate: string | null,
  endDate: string | null,
): Promise<MediaItem[]> => {

  let querySpec = {};

  if (specifyDateRange) {
    querySpec = { creationTime: { $gte: startDate, $lte: endDate } };
  }

  console.log('getMediaItemsToDisplayFromDb querySpec: ', querySpec);

  const mediaItemModel = getMediaitemModel();

  const query = mediaItemModel.find(querySpec).sort( { creationTime: -1 });
  //   const query = mediaItemModel.find(querySpec).limit(8).sort( { creationTime: -1 });

  const documents: any = await query.exec();
  const mediaItems: MediaItem[] = [];
  for (const document of documents) {
    const mediaItem: MediaItem = document.toObject() as MediaItem;
    mediaItem.googleId = document.googleId.toString();
    mediaItems.push(mediaItem);
  }
  return mediaItems;
}

export const getMediaItemsToDisplayFromDbUsingSearchSpec = async (
  searchSpec: SearchSpec,
): Promise<MediaItem[]> => {
  console.log('getMediaItemsToDisplayFromDbUsingSearchSpec');
  console.log(searchSpec);

  const { matchRule, searchRules } = searchSpec;

  let querySpec = {};
  let dateQuerySpec = {};
  const keywordNodeIds: string[] = [];

  searchRules.forEach((searchRule: SearchRule) => {
    if (searchRule.searchRuleType === SearchRuleType.Date) {
      // only support single Date rule for now
      const dateSearchRule: DateSearchRule = searchRule.searchRule as DateSearchRule;
      switch (dateSearchRule.dateSearchRuleType) {
        case DateSearchRuleType.IsInTheRange:
          const startDate = dateSearchRule.date;
          const endDate = dateSearchRule.date2;
          dateQuerySpec = { creationTime: { $gte: startDate, $lte: endDate } };
          break;
        case DateSearchRuleType.IsBefore:
          dateQuerySpec = { creationTime: { $lt: dateSearchRule.date } };
          break;
        case DateSearchRuleType.IsAfter:
          dateQuerySpec = { creationTime: { $gt: dateSearchRule.date } };
          break;
        default:
          throw new Error('dateSearchRuleType not recognized');
      }
    } else if (searchRule.searchRuleType === SearchRuleType.Keyword) {
      const keywordSearchRule: KeywordSearchRule = searchRule.searchRule as KeywordSearchRule;
      // only support KeywordSearchRuleType.Contains for now
      if (keywordSearchRule.keywordSearchRuleType === KeywordSearchRuleType.Contains) {
        keywordNodeIds.push(keywordSearchRule.keywordNodeId);
      } else if (keywordSearchRule.keywordSearchRuleType === KeywordSearchRuleType.AreEmpty) {
        throw new Error('KeywordSearchRuleType.AreEmpty not supported');
      } else if (keywordSearchRule.keywordSearchRuleType === KeywordSearchRuleType.AreNotEmpty) {
        throw new Error('KeywordSearchRuleType.AreNotEmpty not supported');
      } else {
        throw new Error('keywordSearchRuleType not recognized');
      }
    } else {
      throw new Error('searchRuleType not recognized');
    }
  });

  if (!isEmpty(dateQuerySpec)) {
    querySpec = dateQuerySpec;
  }

  // TEDTODO - need to take matchRule into account when combining dateQuerySpec and keywordQuerySpec
  if (keywordNodeIds.length > 0) {
    if (matchRule === MatchRule.all) {
      querySpec = { ...querySpec, keywordNodeIds: { $all: keywordNodeIds } };
    } else {
      querySpec = { ...querySpec, keywordNodeIds: { $in: keywordNodeIds } };
    }
  }

  console.log('getMediaItemsToDisplayFromDb querySpec: ', querySpec);

  const mediaItemModel = getMediaitemModel();

  const query = mediaItemModel.find(querySpec);
  const documents: any = await query.exec();
  const mediaItems: MediaItem[] = [];
  for (const document of documents) {
    const mediaItem: MediaItem = document.toObject() as MediaItem;
    mediaItem.googleId = document.googleId.toString();
    mediaItems.push(mediaItem);
  }
  return mediaItems;
}

export const createPhotosToDisplaySpecDocument = async (photosToDisplaySpec: PhotosToDisplaySpec): Promise<Document | void> => {
  const photosToDisplaySpecModel = getPhotosToDisplaySpecModel();
  return photosToDisplaySpecModel.create(photosToDisplaySpec)
    .then((photosToDisplaySpecDocument: any) => {
      return Promise.resolve(photosToDisplaySpecDocument);
    }).catch((err: any) => {
      return Promise.reject(err);
    });
}

const updateDateRangeSpecificationSelector = async (photosToDisplaySpecModel: any, specifyDateRange: boolean, startDate?: string, endDate?: string): Promise<any> => {
  const update: any = { specifyDateRange };
  if (startDate) {
    update.startDate = startDate;
  }
  if (endDate) {
    update.endDate = endDate;
  }
  const doc = await photosToDisplaySpecModel.findOneAndUpdate({}, update, { new: true });
}

export const setDateRangeSpecificationDb = async (specifyDateRange: boolean, startDate?: string, endDate?: string): Promise<any> => {
  const photosToDisplaySpecModel = getPhotosToDisplaySpecModel();
  return photosToDisplaySpecModel.find({}
    , (err: any, photosToDisplaySpecDocs: any) => {
      if (err) {
        console.log(err);
      } else
        if (isArray(photosToDisplaySpecDocs)) {
          if (photosToDisplaySpecDocs.length === 0) {
            // throw new Error('photosToDisplaySpecDocs.length === 0');
            createPhotosToDisplaySpecDocument({
              specifyDateRange,
              startDate,
              endDate,
            })
              .then((photosToDisplayDocument: any) => {
                return Promise.resolve();
              });
          } if (photosToDisplaySpecDocs.length === 1) {
            updateDateRangeSpecificationSelector(photosToDisplaySpecModel, specifyDateRange, startDate, endDate);
            return Promise.resolve();
          }
        } else {
          console.log('photosToDisplaySpecDocs is not an array');
          return Promise.reject('photosToDisplaySpecDocs is not an array');
        }
    });
}

export const getPhotosToDisplaySpecFromDb = async (): Promise<PhotosToDisplaySpec> => {

  console.log('getPhotosToDisplaySpecFromDb');

  const photoToDisplaySpecModel = getPhotosToDisplaySpecModel();

  let photosToDisplaySpec: PhotosToDisplaySpec = {
    specifyDateRange: false,
  };

  const documents: any = await (photoToDisplaySpecModel as any).find().exec();
  if (documents.length === 0) {
    console.log('photosToDisplaySpecDocs.length === 0');
  } else {
    photosToDisplaySpec = documents[0].toObject() as PhotosToDisplaySpec;
  }

  return photosToDisplaySpec;
}

export const getKeywordsFromDb = async (): Promise<Keyword[]> => {
  const keywordModel = getKeywordModel();
  const keywords: Keyword[] = [];
  const keywordDocuments: any = await (keywordModel as any).find().exec();
  for (const document of keywordDocuments) {
    const keyword: Keyword = document.toObject() as Keyword;
    keyword.keywordId = document.keywordId.toString();
    keyword.label = document.label.toString();
    keyword.type = document.type.toString();
    keywords.push(keyword);
  }
  return keywords;
}

export const getKeywordNodesFromDb = async (): Promise<KeywordNode[]> => {
  const keywordNodeModel = getKeywordNodeModel();
  const keywordNodes: KeywordNode[] = [];
  const keywordNodeDocuments: any = await (keywordNodeModel as any).find().exec();
  for (const document of keywordNodeDocuments) {
    const keywordNode: KeywordNode = document.toObject() as KeywordNode;
    keywordNode.nodeId = document.nodeId.toString();
    keywordNode.keywordId = document.keywordId.toString();
    keywordNodes.push(keywordNode);
  }
  return keywordNodes;
}

export const getAllKeywordDataFromDb = async (): Promise<any> => {

  const keywords: Keyword[] = await getKeywordsFromDb();
  const keywordNodes: KeywordNode[] = await getKeywordNodesFromDb();
  const keywordRootNodeId: string = 'rootKeywordNodeId';

  return {
    keywords,
    keywordNodes,
    keywordRootNodeId,
  };
}

export const createKeywordDocument = async (keyword: Keyword): Promise<string> => {
  const keywordModel = getKeywordModel();
  return keywordModel.create(keyword)
    .then((keywordDocument: any) => {
      const keyword: Keyword = keywordDocument.toObject() as Keyword;
      return Promise.resolve(keyword.keywordId);
    }).catch((err: any) => {
      return Promise.reject(err);
    });
}

export const createKeywordNodeDocument = async (keywordNode: KeywordNode): Promise<string> => {
  const keywordNodeModel = getKeywordNodeModel();
  return keywordNodeModel.create(keywordNode)
    .then((keywordNodeDocument: any) => {
      const keywordNode: KeywordNode = keywordNodeDocument.toObject() as KeywordNode;
      return Promise.resolve(keywordNode.nodeId);
    }).catch((err: any) => {
      return Promise.reject(err);
    });
}

export const setRootKeywordNodeDb = async (rootNodeId: string): Promise<void> => {
  const keywordTreeModel = getKeywordTreeModel();
  return keywordTreeModel.create({ rootNodeId })
    .then((keywordTreeDocument: any) => {
      return Promise.resolve();
    }).catch((err: any) => {
      return Promise.reject(err);
    });
}

export const createTakeoutDocument = async (takeout: Takeout): Promise<string> => {
  const takeoutModel = getTakeoutModel();
  return takeoutModel.create(takeout)
    .then((takeoutDocument: any) => {
      const dbTakeout: Takeout = takeoutDocument.toObject() as Takeout;
      return Promise.resolve(dbTakeout.id);
    }).catch((err: any) => {
      return Promise.reject(err);
    });
}

export const getTakeoutsFromDb = async (): Promise<Takeout[]> => {
  const takeoutModel = getTakeoutModel();
  const takeouts: Takeout[] = [];
  const takeoutDocuments: any = await (takeoutModel as any).find().exec();
  for (const document of takeoutDocuments) {
    const takeout: Takeout = document.toObject() as Takeout;
    takeout.id = document.id.toString();
    takeout.label = document.label.toString();
    takeout.albumName = document.albumName.toString();
    takeout.path = document.path.toString();
    takeouts.push(takeout);
  }
  return takeouts;
}

export const getTakeoutById = async (takeoutId: string): Promise<Takeout> => {

  const takeoutModel = getTakeoutModel();

  const filter = { id: takeoutId };
  const takeoutDocument: Document = await takeoutModel.findOne(filter);

  if (!isNil(takeoutDocument)) {
    const takeout: Takeout = takeoutDocument.toObject() as Takeout;
    return takeout;
  }
  return null;
}



export const getMediaItemsInAlbumFromDb = async (albumId: string): Promise<MediaItem[]> => {

  const mediaItemModel = getMediaitemModel();

  const mediaItems: MediaItem[] = [];
  const documents: any = await (mediaItemModel as any).find({ albumId }).exec();
  for (const document of documents) {
    const mediaItem: MediaItem = document.toObject() as MediaItem;
    mediaItem.googleId = document.googleId.toString();
    mediaItems.push(mediaItem);
  }
  return mediaItems;
}

export const updateKeywordNodeDb = async (keywordNode: KeywordNode): Promise<any> => {
  const keywordNodeModel = getKeywordNodeModel();
  const filter = { nodeId: keywordNode.nodeId };
  const updatedDoc = await keywordNodeModel.findOneAndUpdate(filter, keywordNode, {
    new: true,
  }).exec();
}

export const getAutoPersonKeywordNodesFromDb = async (): Promise<KeywordNode[]> => {

  const autoPersonKeywordNodes: KeywordNode[] = [];

  const keywordNodes: KeywordNode[] = await getKeywordNodesFromDb();

  const keywordNodesByNodeId: Map<string, KeywordNode> = new Map<string, KeywordNode>();
  keywordNodes.forEach((keywordNode: KeywordNode) => {
    keywordNodesByNodeId.set(keywordNode.nodeId, keywordNode);
  });

  let peopleKeywordNode: KeywordNode = null;
  keywordNodes.forEach((keywordNode: KeywordNode) => {
    if (keywordNode.nodeId === 'peopleKeywordNodeId') {
      peopleKeywordNode = keywordNode;
      return;
    }
  });

  if (isNil(peopleKeywordNode)) {
    debugger;
  }

  const autoPersonKeywordNodeIds: string[] = peopleKeywordNode.childrenNodeIds;
  autoPersonKeywordNodeIds.forEach((autoPersonKeywordNodeId: string) => {
    autoPersonKeywordNodes.push(keywordNodesByNodeId.get(autoPersonKeywordNodeId));
  });

  return autoPersonKeywordNodes;
}

export const addAutoPersonKeywordsToDb = async (keywordsSet: Set<string>): Promise<KeywordData> => {

  let peopleKeywordNode: KeywordNode = null;
  const keywordNodes: KeywordNode[] = await getKeywordNodesFromDb();
  keywordNodes.forEach((keywordNode: KeywordNode) => {
    if (keywordNode.nodeId === 'peopleKeywordNodeId') {
      peopleKeywordNode = keywordNode;
      return;
    }
  });
  if (isNil(peopleKeywordNode)) {
    throw new Error('peopleKeywordNode not found');
  }

  const existingKeywords: Keyword[] = await getKeywordsFromDb();
  const existingKeywordNames: string[] = existingKeywords.map((aKeyword: Keyword) => {
    return aKeyword.label;
  })
  const existingKeywordsSet: Set<string> = new Set<string>(existingKeywordNames);

  const keywordsToAddToDb: Keyword[] = [];
  const addedKeywordNodes: KeywordNode[] = [];

  for (let keywordLabel of keywordsSet) {
    if (!existingKeywordsSet.has(keywordLabel)) {
      const keyword: Keyword = {
        keywordId: uuidv4(),
        label: keywordLabel,
        type: 'autoPerson',
      };
      keywordsToAddToDb.push(keyword);
    }
  }

  if (keywordsToAddToDb.length > 0) {
    const keywordModel = getKeywordModel();
    try {
      return keywordModel.collection.insertMany(keywordsToAddToDb)
        .then((retVal: any) => {

          const createKeywordNodePromises: Promise<string>[] = [];

          const keywords: Keyword[] = retVal.ops;
          keywords.forEach((keyword: Keyword) => {
            const keywordNode: KeywordNode = {
              nodeId: uuidv4(),
              keywordId: keyword.keywordId,
              parentNodeId: 'peopleKeywordNodeId',
              childrenNodeIds: [],
            };
            createKeywordNodePromises.push(createKeywordNodeDocument(keywordNode));
            addedKeywordNodes.push(keywordNode);
          });
          return Promise.all(createKeywordNodePromises)
            .then((keywordNodeIds: string[]) => {

              keywordNodeIds.forEach((keywordNodeId: string) => {
                peopleKeywordNode.childrenNodeIds.push(keywordNodeId);
              });
              updateKeywordNodeDb(peopleKeywordNode);

              const keywordData: KeywordData = {
                keywords: keywordsToAddToDb,
                keywordNodes: addedKeywordNodes,
                keywordRootNodeId: 'rootKeywordNodeId',
              };
              return keywordData;
            });
        })
        .catch((error: any) => {
          console.log('db add error: ', error);
          debugger;
          return null;
          // if (error.code === 11000) {
          //   return;
          // } else {
          //   debugger;
          // }
        });
    } catch (error: any) {
      debugger;
      return null;
    }
  }
  return null;
}

export const updateMediaItemInDb = async (mediaItem: MediaItem): Promise<any> => {
  const mediaItemModel = getMediaitemModel();
  const filter = { googleId: mediaItem.googleId };
  const updatedDoc = await mediaItemModel.findOneAndUpdate(filter, mediaItem, {
    new: true,
  }).exec();
};

export const deleteMediaItemsFromDb = async (mediaItemIds: string[]): Promise<any> => {
  const mediaItemModel = getMediaitemModel();
  const filter = { googleId: { $in: mediaItemIds} };
  await mediaItemModel.deleteMany(filter);
}

const addMediaItemToDb = async (mediaItemModel: any, mediaItem: MediaItem): Promise<any> => {

  try {
    return mediaItemModel.collection.insertOne(mediaItem)
      .then((retVal: any) => {
        const dbRecordId: string = retVal.insertedId._id.toString();
        return;
      })
      .catch((error: any) => {
        console.log('db add error: ', error);
        if (error.code === 11000) {
          return;
        } else {
          debugger;
        }
      });
  } catch (error: any) {
    debugger;
  }
};

export const addMediaItemToMediaItemsDBTable = async (mediaItem: MediaItem): Promise<any> => {
  const mediaItemModel = getMediaitemModel();
  return addMediaItemToDb(mediaItemModel, mediaItem);
};

export const addMediaItemToDeletedMediaItemsDBTable = async (mediaItem: MediaItem): Promise<any> => {
  const deletedMediaItemModel = getDeletedMediaItemModel();
  return addMediaItemToDb(deletedMediaItemModel, mediaItem);
};

export const clearDeletedMediaItemsDb = async (): Promise<any> => {
  const deletedMediaItemModel = getDeletedMediaItemModel();
  await deletedMediaItemModel.deleteMany({});
}

export const removeDeleteMediaItemFromDb = async (mediaItemId: string): Promise<any> => {
  const deletedMediaItemModel = getDeletedMediaItemModel();
  const filter = { googleId: mediaItemId };
  await deletedMediaItemModel.deleteOne(filter);
}

export const getDeletedMediaItemsFromDb = async (): Promise<MediaItem[]> => {

  const deletedMediaItemModel = getDeletedMediaItemModel();

  const deletedMediaItems: MediaItem[] = [];
  const documents: any = await (deletedMediaItemModel as any).find().exec();
  for (const document of documents) {
    const mediaItem: MediaItem = document.toObject() as MediaItem;
    mediaItem.googleId = document.googleId.toString();
    deletedMediaItems.push(mediaItem);
  }
  return deletedMediaItems;
}

