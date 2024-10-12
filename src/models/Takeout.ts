import * as mongoose from 'mongoose';
import { connection } from '../config';

const Schema = mongoose.Schema;

const TakeoutSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    label: { type: String, required: true, unique: true },
    albumName: { type: String, required: true, unique: true },
    // root path for takeouts is public/takeouts
    path: { type: String, required: true, unique: true },
  }
);

export const getTakeoutModel = () => {
  const takeout = connection.model('takeout', TakeoutSchema);
  return takeout;
}

export default TakeoutSchema;
