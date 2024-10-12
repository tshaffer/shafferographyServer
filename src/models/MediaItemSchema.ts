import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

const MediaitemSchema = new Schema(
  {
    googleId: { type: String, required: true, unique: true },     // album media metadata: id
    fileName: { type: String, required: true },                   // album media metadata: filename
    albumId: { type: String, required: true },                    // google album that contains this mediaItem
    filePath: { type: String, default: '' },                      // path of location where media file was downloaded
    productUrl: { type: String },                                 // album media metadata: productUrl - url of photo at photos.google.com
    baseUrl: { type: String },                                    // album media metadata: baseUrl - tmp url for downloading content
    mimeType: { type: String },                                   // album media metadata: mimeType
    creationTime: { type: String },                               // album media metadata: mediaMetadata.creationTime (string)
                                                                  // or takeout metadata.creationTime (object)
    width: { type: Number },                                      // album media metadata: mediaMetadata.width
    height: { type: Number },                                     // album media metadata: mediaMetadata.height
    orientation: { type: Number, default: 0 },                    // exif - orientation - number
    description: { type: String, default: '' },                   // takeout metadata: description
    geoData: {                                                    // takeout metadata: geoData
      altitude: { type: Number },
      latitude: { type: Number },
      latitudeSpan: { type: Number },
      longitude: { type: Number },
      longitudeSpan: { type: Number },
    },
    people: [{                                                    // takeout metadata: people
      name: String, default: ''
    }],
    keywordNodeIds: [String],
  }
);

export default MediaitemSchema;
