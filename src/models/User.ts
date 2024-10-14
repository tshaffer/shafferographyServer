import mongoose, { Schema, Document } from 'mongoose';

// Define the User schema
interface IUser extends Document {
  googleId: string;
  email: string;
  refreshToken: string;
}

const UserSchema = new Schema<IUser>({
  googleId: { type: String, required: true },
  email: { type: String, required: true },
  refreshToken: { type: String, required: true }, // Encrypted refresh token
});

// Create the User model
const User = mongoose.model<IUser>('User', UserSchema);

export default User;
