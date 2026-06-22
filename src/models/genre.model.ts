import { Schema, model, Document } from 'mongoose';

export interface IGenre extends Document {
  name: string;
}

const GenreSchema = new Schema<IGenre>(
  {
    name: {
      type: String,
      required: [true, 'O nome do gênero é obrigatório'],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

export const Genre = model<IGenre>('Genre', GenreSchema, 'genres');
