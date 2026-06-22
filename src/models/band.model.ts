import { Schema, model, Document, Types } from 'mongoose';

export interface IBandMember {
  artistId: Types.ObjectId;
  name: string;
}

export interface IBand extends Document {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  backgroundImageUrl?: string | null;
  members: IBandMember[];
  createdAt: Date;
  updatedAt: Date;
}

const BandMemberSchema = new Schema<IBandMember>({
  artistId: {
    type: Schema.Types.ObjectId,
    ref: 'Artist',
    required: [true, 'artistId do membro da banda é obrigatório'],
  },
  name: {
    type: String,
    required: [true, 'Nome do membro da banda é obrigatório'],
    trim: true,
  }
}, { _id: false });

const BandSchema = new Schema<IBand>(
  {
    name: {
      type: String,
      required: [true, 'O nome da banda é obrigatório'],
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
    members: {
      type: [BandMemberSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

BandSchema.index({ name: 'text' });
BandSchema.index({ 'members.artistId': 1 });

export const Band = model<IBand>('Band', BandSchema, 'bands');
