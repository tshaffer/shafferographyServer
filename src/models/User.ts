import * as mongoose from 'mongoose';
import { connection } from '../config';

const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    googleId: { type: String, required: true },
    refreshToken: { type: String, required: true },
    expiresIn: { type: String, required: true },
  }
);

export const getUserModel = () => {
  const userModel = connection.model('user', UserSchema);
  return userModel;
}

export default UserSchema;
