import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mongomusic';
    //ignora avisos do moongose
    mongoose.set('strictQuery', true);

    await mongoose.connect(uri);
    console.log('Successfully connected to MongoDB.');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // se falhar encerra o app
  }
};
