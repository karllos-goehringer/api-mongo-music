import { Schema, model, Document, Types } from 'mongoose';

export interface IPlaylistTrack {
  songId: Types.ObjectId;
  albumId: Types.ObjectId;
  order: number;
}

export interface IPlaylist extends Document {
  name: string;
  imageUrl?: string | null;
  description?: string | null;
  ownerId: Types.ObjectId;
  followerIds: Types.ObjectId[];
  tracks: IPlaylistTrack[];
  createdAt: Date;
  updatedAt: Date;
}

const PlaylistTrackSchema = new Schema<IPlaylistTrack>({
  songId: {
    type: Schema.Types.ObjectId,
    required: [true, 'O songId da faixa na playlist é obrigatório'],
  },
  albumId: {
    type: Schema.Types.ObjectId,
    ref: 'Album',
    required: [true, 'O albumId da faixa na playlist é obrigatório'],
  },
  order: {
    type: Number,
    required: [true, 'A ordem da faixa na playlist é obrigatória'],
  }
}, { _id: false });

const PlaylistSchema = new Schema<IPlaylist>(
  {
    name: {
      type: String,
      required: [true, 'O nome da playlist é obrigatório'],
      trim: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'O ownerId do dono da playlist é obrigatório'],
    },
    followerIds: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    tracks: {
      type: [PlaylistTrackSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

PlaylistSchema.index({ ownerId: 1 });
PlaylistSchema.index({ followerIds: 1 });
PlaylistSchema.index({ 'tracks.songId': 1 });

export const Playlist = model<IPlaylist>('Playlist', PlaylistSchema, 'playlists');
