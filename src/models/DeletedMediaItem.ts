import { connection } from '../config';

import MediaitemSchema from './MediaItemSchema';

export const getDeletedMediaItemModel = () => {
  const deletedMediaItemModel = connection.model('deletedmediaitem', MediaitemSchema);
  return deletedMediaItemModel;
}
