import * as mongoose from 'mongoose';
import { connection } from '../config';

const Schema = mongoose.Schema;

const PhotosToDisplaySpecSchema = new Schema(
  {
    specifyDateRange: { type: Boolean, required: true, unique: true },
    startDate: { type: String },
    endDate: { type: String },
  }
);

export const getPhotosToDisplaySpecModel = () => {
  const photosToDisplaySpecModel = connection.model('photostodisplayspec', PhotosToDisplaySpecSchema);
  return photosToDisplaySpecModel;
}

export default PhotosToDisplaySpecSchema;
