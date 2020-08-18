const mongoose = require('mongoose')
const Schema = mongoose.Schema;
// const dishSchema = require('./dishes')
require('mongoose-currency').loadType(mongoose);
const Currency = mongoose.Types.Currency;


const favoriteSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dishes: [{ type: Schema.Types.ObjectId, ref: 'Dishes' }],
    // dishes: [dishSchema]
}, {
    timestamps: true
})

var Favorites = mongoose.model('Favorite', favoriteSchema)

module.exports = Favorites;