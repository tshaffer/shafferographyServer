import * as mongoose from 'mongoose';
import { connection } from '../config';

const Schema = mongoose.Schema;

const KeywordTreeSchema = new Schema(
  {
    rootNodeId: { type: String, required: true, unique: true },
  }
);

export const getKeywordTreeModel = () => {
  const keywordTreeModel = connection.model('keywordtree', KeywordTreeSchema);
  return keywordTreeModel;
}

export default KeywordTreeSchema;
