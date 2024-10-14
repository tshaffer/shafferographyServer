import mongoose from 'mongoose';

export let connection: mongoose.Connection;

async function connectDB() {

  console.log('mongo uri is:');
  console.log(process.env.MONGO_URI);
  connection = await mongoose.createConnection(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  });
  console.log(`MongoDB db connected`);

  mongoose.Promise = global.Promise;
};

export default connectDB;
