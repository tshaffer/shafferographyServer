import { connection } from '../config';

import MediaitemSchema from './MediaItemSchema';

export const getMediaitemModel = () => {
  const mediaItemModel = connection.model('mediaitem', MediaitemSchema);
  return mediaItemModel;
}
