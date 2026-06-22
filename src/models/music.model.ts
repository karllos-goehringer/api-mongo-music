import { Schema, model, Document } from 'mongoose';

export interface IMusic extends Document {
  title: string;
  artist: string;
  album?: string;
  genre: string;
  duration?: number; 
  releaseYear?: number;
  createdAt: Date;
  updatedAt: Date;
}

const MusicSchema = new Schema<IMusic>(
  {
    title: {
      type: String,
      required: [true, 'O título é obrigatório'],
      trim: true,
    },
    artist: {
      type: String,
      required: [true, 'O artista é obrigatório'],
      trim: true,
    },
    album: {
      type: String,
      trim: true,
    },
    genre: {
      type: String,
      required: [true, 'O gênero é obrigatório'],
      trim: true,
    },
    duration: {
      type: Number,
      min: [0, 'A duração não pode ser negativa'],
    },
    releaseYear: {
      type: Number,
      min: [1500, 'Ano de lançamento inválido'],
    },
  },
  {
    timestamps: true, // Gerencia automaticamente createdAt e updatedAt
  }
);

export const Music = model<IMusic>('Music', MusicSchema);
