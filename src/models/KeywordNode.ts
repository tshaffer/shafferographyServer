import * as mongoose from 'mongoose';
import { connection } from '../config';

const Schema = mongoose.Schema;

mongoose.Schema.Types.String.checkRequired(v => typeof v === 'string');

const KeywordNodeSchema = new Schema(
  {
    nodeId: { type: String, required: true, unique: true },
    keywordId: { type: String, required: true, unique: true },
    parentNodeId: { type: String, required: true },
    childrenNodeIds: [String],
  }
);

export const getKeywordNodeModel = () => {
  const keywordNodeModel = connection.model('keywordnode', KeywordNodeSchema);
  return keywordNodeModel;
}

export default KeywordNodeSchema;
