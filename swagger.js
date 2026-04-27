const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const PORT = process.env.PORT || 5000;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NakornKung API Documentation',
      version: '1.0.0',
      description: 'REST API documentation for the NakornKung backend.',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Hotel: {
          type: 'object',
          required: ['name', 'address', 'tel', 'district', 'province', 'img'],
          properties: {
            name: { type: 'string', example: 'Beachview Resort' },
            attraction: {
              type: 'array',
              items: { type: 'string', format: 'objectId', example: '649ed886324b5d58fd835482' }
            },
            address: { type: 'string', example: '123 Coconut Lane' },
            tel: { type: 'string', example: '+66 1234 5678' },
            district: { type: 'string', example: 'Phuket' },
            province: { type: 'string', example: 'Phuket' },
            postalcode: { type: 'string', example: '83000' },
            img: { type: 'string', example: 'https://example.com/hotel.jpg' }
          }
        },
        Attraction: {
          type: 'object',
          required: ['name', 'category', 'address', 'img'],
          properties: {
            name: { type: 'string', example: 'Wat Arun' },
            description: { type: 'string', example: 'A famous temple in Bangkok.' },
            category: { type: 'string', enum: ['museum', 'restaurant', 'landmark', 'nature', 'activity', 'temple', 'park', 'other'], example: 'temple' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string', example: '158 Wang Doem Rd' },
                district: { type: 'string', example: 'Thon Buri' },
                province: { type: 'string', example: 'Bangkok' },
                postalCode: { type: 'string', example: '10600' }
              }
            },
            openingHours: {
              type: 'object',
              properties: {
                monday: {
                  type: 'object',
                  properties: {
                    open: { type: 'string', example: '08:00' },
                    close: { type: 'string', example: '18:00' }
                  }
                },
                tuesday: { $ref: '#/components/schemas/Attraction/properties/openingHours/properties/monday' },
                wednesday: { $ref: '#/components/schemas/Attraction/properties/openingHours/properties/monday' },
                thursday: { $ref: '#/components/schemas/Attraction/properties/openingHours/properties/monday' },
                friday: { $ref: '#/components/schemas/Attraction/properties/openingHours/properties/monday' },
                saturday: { $ref: '#/components/schemas/Attraction/properties/openingHours/properties/monday' },
                sunday: { $ref: '#/components/schemas/Attraction/properties/openingHours/properties/monday' }
              }
            },
            img: { type: 'string', example: 'https://example.com/attraction.jpg' }
          }
        },
        Booking: {
          type: 'object',
          required: ['checkInDate', 'checkOutDate', 'hotel'],
          properties: {
            checkInDate: { type: 'string', format: 'date', example: '2026-05-01' },
            checkOutDate: { type: 'string', format: 'date', example: '2026-05-03' },
            transportation: {
              type: 'array',
              items: { type: 'string', format: 'objectId', example: '649ed886324b5d58fd835482' }
            },
            user: { type: 'string', format: 'objectId', example: '649ed886324b5d58fd835482' },
            hotel: { type: 'string', format: 'objectId', example: '649ed886324b5d58fd835482' }
          }
        },
        Transportation: {
          type: 'object',
          required: ['name', 'type', 'providerName', 'pickUpArea', 'dropOffArea', 'price', 'img'],
          properties: {
            name: { type: 'string', example: 'Bangkok Shuttle' },
            description: { type: 'string', example: 'Airport transfer service' },
            type: { type: 'string', enum: ['car', 'airplane', 'boat', 'bus', 'van', 'shuttle'], example: 'bus' },
            providerName: { type: 'string', example: 'Seaside Travel' },
            pickUpArea: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Suvarnabhumi Airport' },
                address: {
                  type: 'object',
                  properties: {
                    street: { type: 'string', example: '999 Ladkrabang' },
                    district: { type: 'string', example: 'Bangkok' },
                    province: { type: 'string', example: 'Bangkok' },
                    postalCode: { type: 'string', example: '10540' }
                  }
                }
              }
            },
            dropOffArea: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Hotel Drop-off' },
                address: {
                  type: 'object',
                  properties: {
                    street: { type: 'string', example: '123 Beach Road' },
                    district: { type: 'string', example: 'Phuket' },
                    province: { type: 'string', example: 'Phuket' },
                    postalCode: { type: 'string', example: '83000' }
                  }
                }
              }
            },
            price: { type: 'number', example: 120 },
            img: { type: 'string', example: 'https://example.com/transport.jpg' }
          }
        },
        TransportationBooking: {
          type: 'object',
          required: ['user', 'booking', 'transportation', 'departureDateTime', 'passengerNumber'],
          properties: {
            user: { type: 'string', format: 'objectId', example: '649ed886324b5d58fd835482' },
            booking: { type: 'string', format: 'objectId', example: '649ed886324b5d58fd835482' },
            transportation: { type: 'string', format: 'objectId', example: '649ed886324b5d58fd835482' },
            departureDateTime: { type: 'string', format: 'date-time', example: '2026-05-01T08:00:00Z' },
            passengerNumber: { type: 'integer', example: 2 },
            returnDateTime: { type: 'string', format: 'date-time', example: '2026-05-02T18:00:00Z' }
          }
        },
        AuthRegister: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'Jane Doe' },
            tel: { type: 'string', example: '+66 9876 5432' },
            email: { type: 'string', format: 'email', example: 'jane@example.com' },
            password: { type: 'string', format: 'password', example: 'StrongP@ssw0rd' },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' }
          }
        },
        AuthLogin: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'jane@example.com' },
            password: { type: 'string', format: 'password', example: 'StrongP@ssw0rd' }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js', './routes/**/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };