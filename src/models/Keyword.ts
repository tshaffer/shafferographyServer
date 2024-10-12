import * as mongoose from 'mongoose';
import { connection } from '../config';

const Schema = mongoose.Schema;

const KeywordSchema = new Schema(
  {
    keywordId: { type: String, required: true, unique: true },
    label: { type: String, required: true, unique: true },
    type: { type: String, required: true },
  }
);

export const getKeywordModel = () => {
  const keywordModel = connection.model('keyword', KeywordSchema);
  return keywordModel;
}

export default KeywordSchema;
