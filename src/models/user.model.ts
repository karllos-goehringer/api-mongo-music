import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email?: string | null;
  passwordHash: string;
  profilePictureUrl?: string | null;
  backgroundImageUrl?: string | null;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'O nome do usuário é obrigatório'],
      trim: true,
    },
    email: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'O hash da senha é obrigatório'],
    },
    profilePictureUrl: {
      type: String,
      default: null,
    },
    backgroundImageUrl: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ email: 1 }, { unique: true, sparse: true });

export const User = model<IUser>('User', UserSchema, 'users');
