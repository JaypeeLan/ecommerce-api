# E-commerce REST API

A RESTful API for an e-commerce platform built with Node.js, Express, and MongoDB.

## Setup and Installation

1. Clone the repository

```bash
git clone https://github.com/JaypeeLan/ecommerce-api.git
cd ecommerce
```

2. Install dependencies

```bash
npm install
```

3. Create .env file

```bash
cp .env.example .env
```

4. Update environment variables in .env

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your_jwt_secret_here
```

5. Run the server

```bash
# Development
npm run dev

# Production
npm start
```

## API Documentation

### Authentication

#### Register a new user

```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "address": {
    "street": "123 Main St",
    "city": "Boston",
    "state": "MA",
    "zipCode": "02101",
    "country": "USA"
  }
}
```

#### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Products

#### Create a product (Admin only)

```bash
POST /api/products
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "name": "iPhone 13",
  "description": "Latest iPhone model",
  "price": 999.99,
  "stock": 50,
  "category": "Electronics",
  "images": [
    "https://example.com/iphone13-1.jpg",
    "https://example.com/iphone13-2.jpg"
  ]
}
```

#### Get all products

```bash
GET /api/products
```

#### Update a product (Admin only)

```bash
PUT /api/products/:id
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "stock": 45,
  "price": 899.99
}
```

#### Delete a product (Admin only)

```bash
DELETE /api/products/:id
Authorization: Bearer <your_token>
```

### Orders

#### Create an order

```bash
POST /api/orders
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "items": [
    {
      "product": "product_id_here",
      "quantity": 2,
      "price": 999.99
    }
  ],
  "totalAmount": 1999.98,
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Boston",
    "state": "MA",
    "zipCode": "02101",
    "country": "USA"
  }
}
```

#### Get user orders

```bash
GET /api/orders
Authorization: Bearer <your_token>
```

#### Get specific order

```bash
GET /api/orders/:id
Authorization: Bearer <your_token>
```

#### Update order status (Admin only)

```bash
PUT /api/orders/:id/status
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "status": "shipped"
}
```

### Customers

#### Get all customers (Admin only)

```bash
GET /api/customers
Authorization: Bearer <your_token>
```

#### Get customer profile

```bash
GET /api/customers/:id
Authorization: Bearer <your_token>
```

#### Update customer profile

```bash
PUT /api/customers/:id
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "name": "John Smith",
  "address": {
    "street": "456 Oak St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

## Response Formats

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Error message here",
    "stack": "Error stack trace (development only)"
  }
}
```

## Testing

Run the test suite:

```bash
npm test
```

## Error Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Security

- All passwords are hashed using bcrypt
- JWT tokens expire after 24 hours
- Admin routes are protected with additional middleware
- Input validation on all routes
- MongoDB injection protection via Mongoose
- CORS enabled
