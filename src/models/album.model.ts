import { Schema, model, Document, Types } from 'mongoose';

export interface IAlbumCredit {
  type: 'artist' | 'band';
  refId: Types.ObjectId;
  name: string;
}

export interface IAlbumTrack {
  _id: Types.ObjectId;
  title: string;
  duration?: string | null;
  lyrics?: string | null;
  genreId: Types.ObjectId;
  songPath?: string | null;
  trackNumber?: number | null;
}

export interface IAlbum extends Document {
  name: string;
  releaseDate?: Date | null;
  coverImageUrl?: string | null;
  credits: IAlbumCredit[];
  tracks: IAlbumTrack[];
  createdAt: Date;
  updatedAt: Date;
}

const AlbumCreditSchema = new Schema<IAlbumCredit>({
  type: {
    type: String,
    enum: ['artist', 'band'],
    required: [true, 'Tipo de crédito (artist ou band) é obrigatório'],
  },
  refId: {
    type: Schema.Types.ObjectId,
    required: [true, 'refId de referência é obrigatório'],
  },
  name: {
    type: String,
    required: [true, 'Nome do artista/banda creditado é obrigatório'],
    trim: true,
  }
}, { _id: false });

const AlbumTrackSchema = new Schema<IAlbumTrack>({
  _id: {
    type: Schema.Types.ObjectId,
    required: [true, '_id da música é obrigatório'],
    default: () => new Types.ObjectId(),
  },
  title: {
    type: String,
    required: [true, 'Título da música é obrigatório'],
    trim: true,
  },
  duration: {
    type: String,
    default: null,
  },
  lyrics: {
    type: String,
    default: null,
  },
  genreId: {
    type: Schema.Types.ObjectId,
    ref: 'Genre',
    required: [true, 'genreId associado é obrigatório'],
  },
  songPath: {
    type: String,
    default: null,
  },
  trackNumber: {
    type: Number,
    default: null,
  }
});

const AlbumSchema = new Schema<IAlbum>(
  {
    name: {
      type: String,
      required: [true, 'O nome do álbum é obrigatório'],
      trim: true,
    },
    releaseDate: {
      type: Date,
      default: null,
    },
    coverImageUrl: {
      type: String,
      default: null,
    },
    credits: {
      type: [AlbumCreditSchema],
      default: [],
    },
    tracks: {
      type: [AlbumTrackSchema],
      required: [true, 'A lista de faixas (tracks) é obrigatória'],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

AlbumSchema.index({ name: 'text' });
AlbumSchema.index({ 'credits.refId': 1 });
AlbumSchema.index({ 'tracks.genreId': 1 });

export const Album = model<IAlbum>('Album', AlbumSchema, 'albums');
