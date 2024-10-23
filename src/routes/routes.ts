import express from 'express';
import {
  getIndex,
  getCSS,
  getBundle,
  getBundleMap,
  getImage,
  getMediaItemsToDisplay,
  getVersion,
  getPhotosToDisplaySpec,
  setEndDate,
  setStartDate,
  setDateRangeSpecification,
  getAllKeywordData,
  addKeyword,
  addKeywordNode,
  setRootKeywordNode,
  getMediaItemsToDisplayFromSearchSpec,
  addTakeout,
  getTakeouts,
  importFromTakeoutEndpoint,
  initializeKeywordTree,
  updateKeywordNode,
  deleteMediaItems,
  getDeletedMediaItems,
  clearDeletedMediaItems,
  removeDeletedMediaItem,
  redownloadMediaItemEndpoint,
  getLocalDriveImportFolders,
  importFromLocalStorageEndpoint,
  uploadGoogleMediaItem,
  uploadRawMediaEndpoint,
} from '../controllers';
import { createPhotosToDisplaySpec } from '../utilities/utilities';

export const createRoutes = (app: express.Application) => {
  app.get('/', getIndex);
  app.get('/app', getIndex);
  app.get('/index.html', getIndex);
  app.get('/css/app.css', getCSS);
  app.get('/build/bundle.js', getBundle);
  app.get('/build/bundle.js.map', getBundleMap);
  app.get('/images/test.jpg', getImage);

  app.get('/api/v1/version', getVersion);
  app.get('/api/v1/createPhotosToDisplaySpec', createPhotosToDisplaySpec);
  app.get('/api/v1/mediaItemsToDisplay', getMediaItemsToDisplay);
  app.get('/api/v1/mediaItemsToDisplayFromSearchSpec', getMediaItemsToDisplayFromSearchSpec);
  app.get('/api/v1/photosToDisplaySpec', getPhotosToDisplaySpec);
  app.get('/api/v1/allKeywordData', getAllKeywordData);
  app.get('/api/v1/takeouts', getTakeouts);
  app.get('/api/v1/deletedMediaItems', getDeletedMediaItems);

  app.get('/api/v1/localDriveImportFolders', getLocalDriveImportFolders);

  app.post('/api/v1/deleteMediaItems', deleteMediaItems);
  app.post('/api/v1/clearDeletedMediaItems', clearDeletedMediaItems);
  app.post('/api/v1/removeDeletedMediaItem', removeDeletedMediaItem);

  app.post('/api/v1/addKeyword', addKeyword);
  app.post('/api/v1/addKeywordNode', addKeywordNode);
  app.post('/api/v1/updateKeywordNode', updateKeywordNode);
  app.post('/api/v1/setRootKeywordNode', setRootKeywordNode);
  app.post('/api/v1/initializeKeywordTree', initializeKeywordTree);

  app.post('/api/v1/setStartDate', setStartDate);
  app.post('/api/v1/setEndDate', setEndDate);

  app.post('/api/v1/dateRangeSpecification', setDateRangeSpecification);

  app.post('/api/v1/addTakeout', addTakeout);
  app.post('/api/v1/importFromTakeout', importFromTakeoutEndpoint);
  app.post('/api/v1/importFromLocalStorage', importFromLocalStorageEndpoint);

  app.post('/api/v1/redownloadMediaItem', redownloadMediaItemEndpoint);

  app.post('/api/v1/uploadMediaItem', uploadGoogleMediaItem);
  app.post('/api/v1/uploadRawMedia', uploadRawMediaEndpoint);
};

