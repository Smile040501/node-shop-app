const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const productSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
});

module.exports = mongoose.model("Product", productSchema);

// const mongodb = require("mongodb");
// const getDb = require("../utils/database.js").getDb;

// class Product {
//     constructor(title, price, description, imageUrl, id, userId) {
//         this.title = title;
//         this.price = price;
//         this.description = description;
//         this.imageUrl = imageUrl;
//         this._id = id ? new mongodb.ObjectID(id) : null;
//         this.userId = userId;
//     }

//     save() {
//         const db = getDb();
//         let dbOp;
//         if (this._id) {
//             dbOp = db.collection("products").updateOne(
//                 { _id: this._id },
//                 {
//                     $set: this,
//                 }
//             );
//         } else {
//             dbOp = db.collection("products").insertOne(this); // collection will be created if it doesn't exists, every mongodb object must have _id field, or it will be added automatically by mongodb
//         }
//         return dbOp
//             .then((result) => {
//                 console.log(result);
//             })
//             .catch((err) => {
//                 console.log(err);
//             });
//     }

//     static fetchAll() {
//         const db = getDb();
//         return db
//             .collection("products")
//             .find() // Returns a cursor, which is an object which allows to go through the documents step by step bcz there can be many documents and not to convert them at all at once
//             .toArray() // Only use this if documents are less, else implement pagination
//             .then((products) => {
//                 return products;
//             })
//             .catch((err) => {
//                 console.log(err);
//             });
//     }

//     static findById(prodId) {
//         const db = getDb();
//         return (
//             db
//                 .collection("products")
//                 .find({ _id: new mongodb.ObjectID(prodId) }) // js object passed acts as filter to queries
//                 // Mongodb stores id as _id and of special ObjectId type, so to compare string with ObjectId, convert string to ObjectId type provided by mongodb
//                 .next() // to get the next document, as it was still a cursor
//                 .then((product) => {
//                     return product;
//                 })
//                 .catch((err) => {
//                     console.log(err);
//                 })
//         );
//     }

//     static deleteById(prodId) {
//         const db = getDb();
//         return db
//             .collection("products")
//             .deleteOne({ _id: new mongodb.ObjectID(prodId) })
//             .then((result) => {
//                 console.log("Deleted!");
//             })
//             .catch((err) => {
//                 console.log(err);
//             });
//     }
// }

// module.exports = Product;
