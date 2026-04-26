const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
    street: {
        type: String,
        trim: true
    },
    district: {
        type: String,
        required: true,
        trim: true
    },
    province: {
        type: String,
        required: true,
        trim: true
    },
    postalCode: {
        type: String,
        trim: true
    }
},{ _id: false });

const OpeningHourSchema = new mongoose.Schema({
    open: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    close: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    }
},{_id: false});

const AttractionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        
    },
    description: {
        type: String,
    },
    category: {
        type: String,
        enum: ['museum', 'restaurant', 'landmark', 'nature', 'activity', 'temple', 'park', 'other'],
        required: true
    },
    address: {
        type: AddressSchema,
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
            validate: {
                validator: function(v) {
                    return v && v.length === 2;
                },
                message: 'Coordinates must be [longitude, latitude]'
            }
        }
    },
    openingHours: {
        monday: OpeningHourSchema,
        tuesday: OpeningHourSchema,
        wednesday: OpeningHourSchema,
        thursday: OpeningHourSchema,
        friday: OpeningHourSchema,
        saturday: OpeningHourSchema,
        sunday: OpeningHourSchema
    },
    img: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// for location-based queries
AttractionSchema.index({ 'location': '2dsphere' });
module.exports = mongoose.model('Attraction',AttractionSchema);