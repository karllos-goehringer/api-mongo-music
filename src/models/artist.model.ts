import { Schema, model, Document } from 'mongoose';

export interface IArtist extends Document {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  backgroundImageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const ArtistSchema = new Schema<IArtist>(
  {
    name: {
      type: String,
      required: [true, 'O nome do artista é obrigatório'],
      trim: true,
    },
    description: {
      type: String,
      default: null,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    backgroundImageUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, 
  }
);

ArtistSchema.index({ name: 'text' });

export const Artist = model<IArtist>('Artist', ArtistSchema, 'artists');
