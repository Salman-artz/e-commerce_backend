type OpenApiSchema = Record<string, unknown>;

const ref = (name: string): OpenApiSchema => ({ $ref: `#/components/schemas/${name}` });
const json = (schema: OpenApiSchema) => ({ 'application/json': { schema } });
const arrayOf = (schema: OpenApiSchema): OpenApiSchema => ({ type: 'array', items: schema });
const objectSchema = (properties: Record<string, OpenApiSchema>, required: string[] = []): OpenApiSchema => ({
  type: 'object',
  properties,
  required
});

function successResponse(dataSchema?: OpenApiSchema, description = 'OK', pagination = false) {
  const properties: Record<string, OpenApiSchema> = {
    success: { type: 'boolean', enum: [true] },
    message: { type: 'string' }
  };
  const required = ['success', 'message'];

  if (dataSchema) {
    properties.data = dataSchema;
    required.push('data');
  }

  if (pagination) {
    properties.pagination = ref('PaginationMeta');
    required.push('pagination');
  }

  return {
    description,
    content: json({ type: 'object', properties, required })
  };
}

const errorResponse = (description: string) => ({ description, content: json(ref('ErrorResponse')) });
const commonErrors = {
  400: errorResponse('Bad Request'),
  401: errorResponse('Unauthorized'),
  403: errorResponse('Forbidden'),
  404: errorResponse('Not Found'),
  409: errorResponse('Conflict'),
  413: errorResponse('Payload Too Large'),
  500: errorResponse('Internal Server Error')
};

const bearer = [{ bearerAuth: [] }];

export const openapiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'E-Commerce API',
    version: '1.0.0',
    description: 'OpenAPI documentation for the implemented ecommerce backend.'
  },
  servers: [{ url: 'http://localhost:3000' }],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Categories' },
    { name: 'Products' },
    { name: 'Addresses' },
    { name: 'Cart' },
    { name: 'Orders' },
    { name: 'Payments' },
    { name: 'Docs' }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Check application health',
        responses: { 200: successResponse(undefined, 'OK'), ...commonErrors }
      }
    },
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Check API health',
        responses: { 200: successResponse(undefined, 'OK'), ...commonErrors }
      }
    },
    '/docs/json': {
      get: {
        tags: ['Docs'],
        summary: 'Return the OpenAPI JSON document',
        responses: {
          200: { description: 'OpenAPI JSON', content: json({ type: 'object', additionalProperties: true }) },
          ...commonErrors
        }
      }
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: json(objectSchema({
            name: { type: 'string', minLength: 2, maxLength: 120 },
            email: { type: 'string', format: 'email', maxLength: 191 },
            password: { type: 'string', minLength: 8, maxLength: 100 }
          }, ['name', 'email', 'password']))
        },
        responses: { 201: successResponse(ref('AuthSessionResponse'), 'Registration successful'), ...commonErrors }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login user',
        requestBody: {
          required: true,
          content: json(objectSchema({
            email: { type: 'string', format: 'email', maxLength: 191 },
            password: { type: 'string', minLength: 8, maxLength: 100 }
          }, ['email', 'password']))
        },
        responses: { 200: successResponse(ref('AuthSessionResponse'), 'Login successful'), ...commonErrors }
      }
    },
    '/auth/refresh-token': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        description: 'The controller can read the refresh token cookie, but the current validation middleware expects `refreshToken` in the body.',
        requestBody: {
          required: true,
          content: json(objectSchema({ refreshToken: { type: 'string', minLength: 1 } }, ['refreshToken']))
        },
        responses: { 200: successResponse(ref('AuthSessionResponse'), 'Token refreshed'), ...commonErrors }
      }
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout current user',
        security: bearer,
        responses: { 200: successResponse(undefined, 'Logout successful'), ...commonErrors }
      }
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current profile',
        security: bearer,
        responses: { 200: successResponse(ref('UserProfile'), 'User profile loaded'), ...commonErrors }
      },
      patch: {
        tags: ['Auth'],
        summary: 'Update current profile',
        security: bearer,
        requestBody: {
          required: true,
          content: json(objectSchema({ name: { type: 'string', minLength: 2, maxLength: 120 } }, ['name']))
        },
        responses: { 200: successResponse(ref('UserProfile'), 'Profile updated'), ...commonErrors }
      }
    },
    '/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List categories',
        responses: { 200: successResponse(arrayOf(ref('Category')), 'Categories loaded'), ...commonErrors }
      },
      post: {
        tags: ['Categories'],
        summary: 'Create category',
        security: bearer,
        requestBody: {
          required: true,
          content: json(objectSchema({ name: { type: 'string', minLength: 2, maxLength: 120 } }, ['name']))
        },
        responses: { 201: successResponse(ref('Category'), 'Category created'), ...commonErrors }
      }
    },
    '/categories/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
      get: {
        tags: ['Categories'],
        summary: 'Get category by id',
        responses: { 200: successResponse(ref('Category'), 'Category loaded'), ...commonErrors }
      },
      patch: {
        tags: ['Categories'],
        summary: 'Update category',
        security: bearer,
        requestBody: {
          required: true,
          content: json(objectSchema({ name: { type: 'string', minLength: 2, maxLength: 120 } }, ['name']))
        },
        responses: { 200: successResponse(ref('Category'), 'Category updated'), ...commonErrors }
      },
      delete: {
        tags: ['Categories'],
        summary: 'Delete category',
        security: bearer,
        responses: { 200: successResponse(undefined, 'Category deleted'), ...commonErrors }
      }
    },
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'List products with filters and pagination',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'categoryId', in: 'query', schema: { type: 'integer', minimum: 1 } },
          { name: 'minPrice', in: 'query', schema: { type: 'number', minimum: 0 } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number', minimum: 0 } },
          { name: 'status', in: 'query', schema: ref('ProductStatus') }
        ],
        responses: { 200: successResponse(arrayOf(ref('Product')), 'Products loaded', true), ...commonErrors }
      },
      post: {
        tags: ['Products'],
        summary: 'Create product',
        security: bearer,
        requestBody: {
          required: true,
          content: json(objectSchema({
            name: { type: 'string', minLength: 2, maxLength: 191 },
            description: { type: 'string', minLength: 10 },
            price: { type: 'number', exclusiveMinimum: 0 },
            stock: { type: 'integer', minimum: 0 },
            categoryId: { type: 'integer', minimum: 1 },
            status: { type: 'string', enum: ['ACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED'], default: 'ACTIVE' },
            images: { type: 'array', items: objectSchema({ imageUrl: { type: 'string', format: 'uri', maxLength: 500 } }, ['imageUrl']) }
          }, ['name', 'description', 'price', 'stock', 'categoryId']))
        },
        responses: { 201: successResponse(ref('Product'), 'Product created'), ...commonErrors }
      }
    },
    '/products/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
      get: {
        tags: ['Products'],
        summary: 'Get product by id',
        responses: { 200: successResponse(ref('Product'), 'Product loaded'), ...commonErrors }
      },
      patch: {
        tags: ['Products'],
        summary: 'Update product',
        security: bearer,
        requestBody: {
          required: true,
          content: json(objectSchema({
            name: { type: 'string', minLength: 2, maxLength: 191 },
            description: { type: 'string', minLength: 10 },
            price: { type: 'number', exclusiveMinimum: 0 },
            stock: { type: 'integer', minimum: 0 },
            categoryId: { type: 'integer', minimum: 1 },
            status: ref('ProductStatus'),
            images: { type: 'array', items: objectSchema({ imageUrl: { type: 'string', format: 'uri', maxLength: 500 } }, ['imageUrl']) }
          }))
        },
        responses: { 200: successResponse(ref('Product'), 'Product updated'), ...commonErrors }
      },
      delete: {
        tags: ['Products'],
        summary: 'Delete product',
        security: bearer,
        responses: { 200: successResponse(undefined, 'Product deleted'), ...commonErrors }
      }
    },
    '/products/{id}/images': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
      post: {
        tags: ['Products'],
        summary: 'Upload product images',
        security: bearer,
        requestBody: {
          required: true,
          content: { 'multipart/form-data': { schema: objectSchema({ images: { type: 'array', items: { type: 'string', format: 'binary' } } }, ['images']) } }
        },
        responses: { 201: successResponse(ref('Product'), 'Product images uploaded'), ...commonErrors }
      }
    },
    '/addresses': {
      get: {
        tags: ['Addresses'],
        summary: 'List current user addresses',
        security: bearer,
        responses: { 200: successResponse(arrayOf(ref('Address')), 'Addresses loaded'), ...commonErrors }
      },
      post: {
        tags: ['Addresses'],
        summary: 'Create address',
        security: bearer,
        requestBody: {
          required: true,
          content: json(objectSchema({
            recipientName: { type: 'string', minLength: 2, maxLength: 120 },
            phone: { type: 'string', minLength: 6, maxLength: 30 },
            fullAddress: { type: 'string', minLength: 10 },
            isDefault: { type: 'boolean', default: false }
          }, ['recipientName', 'phone', 'fullAddress']))
        },
        responses: { 201: successResponse(ref('Address'), 'Address created'), ...commonErrors }
      }
    },
    '/addresses/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
      patch: {
        tags: ['Addresses'],
        summary: 'Update address',
        security: bearer,
        requestBody: {
          required: true,
          content: json(objectSchema({
            recipientName: { type: 'string', minLength: 2, maxLength: 120 },
            phone: { type: 'string', minLength: 6, maxLength: 30 },
            fullAddress: { type: 'string', minLength: 10 },
            isDefault: { type: 'boolean' }
          }))
        },
        responses: { 200: successResponse(ref('Address'), 'Address updated'), ...commonErrors }
      },
      delete: {
        tags: ['Addresses'],
        summary: 'Delete address',
        security: bearer,
        responses: { 200: successResponse(undefined, 'Address deleted'), ...commonErrors }
      }
    },
    '/cart': {
      get: {
        tags: ['Cart'],
        summary: 'Get current cart',
        security: bearer,
        responses: { 200: successResponse(ref('Cart'), 'Cart loaded'), ...commonErrors }
      }
    },
    '/cart/items': {
      post: {
        tags: ['Cart'],
        summary: 'Add item to cart',
        security: bearer,
        requestBody: {
          required: true,
          content: json(objectSchema({ productId: { type: 'integer', minimum: 1 }, quantity: { type: 'integer', minimum: 1, maximum: 999 } }, ['productId', 'quantity']))
        },
        responses: { 201: successResponse(ref('Cart'), 'Item added to cart'), ...commonErrors }
      }
    },
    '/cart/items/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
      patch: {
        tags: ['Cart'],
        summary: 'Update cart item quantity',
        security: bearer,
        requestBody: {
          required: true,
          content: json(objectSchema({ quantity: { type: 'integer', minimum: 1, maximum: 999 } }, ['quantity']))
        },
        responses: { 200: successResponse(ref('Cart'), 'Cart item updated'), ...commonErrors }
      },
      delete: {
        tags: ['Cart'],
        summary: 'Remove cart item',
        security: bearer,
        responses: { 200: successResponse(ref('Cart'), 'Cart item removed'), ...commonErrors }
      }
    },
    '/checkout': {
      post: {
        tags: ['Orders'],
        summary: 'Checkout cart into an order',
        security: bearer,
        requestBody: {
          required: true,
          content: json(objectSchema({ addressId: { type: 'integer', minimum: 1 }, paymentMethod: ref('PaymentMethod') }))
        },
        responses: { 201: successResponse(ref('Order'), 'Checkout successful'), ...commonErrors }
      }
    },
    '/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Create order from cart',
        description: 'This endpoint uses the same checkout flow as `POST /checkout`.',
        security: bearer,
        requestBody: {
          required: true,
          content: json(objectSchema({ addressId: { type: 'integer', minimum: 1 }, paymentMethod: ref('PaymentMethod') }))
        },
        responses: { 201: successResponse(ref('Order'), 'Checkout successful'), ...commonErrors }
      },
      get: {
        tags: ['Orders'],
        summary: 'List orders',
        security: bearer,
        parameters: [
          { name: 'status', in: 'query', schema: ref('OrderStatus') },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 } }
        ],
        responses: { 200: successResponse(arrayOf(ref('Order')), 'Orders loaded', true), ...commonErrors }
      }
    },
    '/orders/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
      get: {
        tags: ['Orders'],
        summary: 'Get order by id',
        security: bearer,
        responses: { 200: successResponse(ref('Order'), 'Order loaded'), ...commonErrors }
      }
    },
    '/orders/{id}/status': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
      patch: {
        tags: ['Orders'],
        summary: 'Update order status',
        security: bearer,
        requestBody: {
          required: true,
          content: json(objectSchema({ status: ref('OrderStatus') }, ['status']))
        },
        responses: { 200: successResponse(ref('Order'), 'Order status updated'), ...commonErrors }
      }
    },
    '/payments/webhook': {
      post: {
        tags: ['Payments'],
        summary: 'Process payment gateway webhook',
        description: 'Public webhook endpoint for Midtrans or Xendit. The controller reads signature headers from `x-webhook-signature`, `x-midtrans-signature`, or `x-xendit-signature`.',
        requestBody: {
          required: true,
          content: json(objectSchema({
            orderId: { type: 'integer', minimum: 1 },
            provider: ref('PaymentGatewayProvider'),
            status: { type: 'string', enum: ['PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELLED', 'pending', 'settlement', 'capture', 'deny', 'cancel', 'canceled', 'expire', 'expired', 'paid', 'failed'] },
            gatewayReference: { type: 'string', minLength: 1 },
            eventId: { type: 'string', minLength: 1 },
            method: ref('PaymentMethod')
          }, ['orderId', 'provider', 'status', 'gatewayReference']))
        },
        responses: { 200: successResponse(ref('WebhookResult'), 'Webhook processed'), ...commonErrors }
      }
    },
    '/payments/{orderId}/status': {
      parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
      get: {
        tags: ['Payments'],
        summary: 'Get payment status for an order',
        security: bearer,
        responses: { 200: successResponse(ref('PaymentStatusResponse'), 'Payment status loaded'), ...commonErrors }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    },
    schemas: {
      PaginationMeta: objectSchema({
        page: { type: 'integer', minimum: 1 },
        limit: { type: 'integer', minimum: 1 },
        totalItems: { type: 'integer', minimum: 0 },
        totalPages: { type: 'integer', minimum: 1 }
      }, ['page', 'limit', 'totalItems', 'totalPages']),
      ErrorResponse: objectSchema({
        success: { type: 'boolean', enum: [false] },
        message: { type: 'string' },
        code: { type: 'string' },
        details: { type: 'object', additionalProperties: true, nullable: true }
      }, ['success', 'message']),
      Role: { type: 'string', enum: ['ADMIN', 'CUSTOMER'] },
      ProductStatus: { type: 'string', enum: ['ACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED'] },
      OrderStatus: { type: 'string', enum: ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'] },
      PaymentStatus: { type: 'string', enum: ['PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELLED'] },
      PaymentMethod: { type: 'string', enum: ['MIDTRANS', 'XENDIT'] },
      PaymentGatewayProvider: { type: 'string', enum: ['MIDTRANS', 'XENDIT'] },
      UserProfile: objectSchema({
        id: { type: 'integer' },
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        role: ref('Role')
      }, ['id', 'name', 'email', 'role']),
      AuthSessionResponse: objectSchema({
        user: ref('UserProfile'),
        accessToken: { type: 'string' }
      }, ['user', 'accessToken']),
      Category: objectSchema({
        id: { type: 'integer' },
        name: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }, ['id', 'name', 'createdAt', 'updatedAt']),
      Address: objectSchema({
        id: { type: 'integer' },
        userId: { type: 'integer' },
        recipientName: { type: 'string' },
        phone: { type: 'string' },
        fullAddress: { type: 'string' },
        isDefault: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }, ['id', 'userId', 'recipientName', 'phone', 'fullAddress', 'isDefault', 'createdAt', 'updatedAt']),
      ProductImage: objectSchema({
        id: { type: 'integer' },
        productId: { type: 'integer' },
        imageUrl: { type: 'string', format: 'uri' },
        publicId: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' }
      }, ['id', 'productId', 'imageUrl', 'createdAt']),
      Product: objectSchema({
        id: { type: 'integer' },
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'string', example: '120000.00' },
        stock: { type: 'integer' },
        categoryId: { type: 'integer' },
        status: ref('ProductStatus'),
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        category: ref('Category'),
        images: arrayOf(ref('ProductImage'))
      }, ['id', 'name', 'description', 'price', 'stock', 'categoryId', 'status', 'createdAt', 'updatedAt', 'category', 'images']),
      CartItem: objectSchema({
        id: { type: 'integer' },
        cartId: { type: 'integer' },
        productId: { type: 'integer' },
        quantity: { type: 'integer' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        product: ref('Product')
      }, ['id', 'cartId', 'productId', 'quantity', 'createdAt', 'updatedAt', 'product']),
      Cart: objectSchema({
        id: { type: 'integer' },
        userId: { type: 'integer' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        items: arrayOf(ref('CartItem'))
      }, ['id', 'userId', 'createdAt', 'updatedAt', 'items']),
      OrderUser: ref('UserProfile'),
      OrderBase: objectSchema({
        id: { type: 'integer' },
        userId: { type: 'integer' },
        addressId: { type: 'integer' },
        status: ref('OrderStatus'),
        totalAmount: { type: 'string', example: '150000.00' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }, ['id', 'userId', 'addressId', 'status', 'totalAmount', 'createdAt', 'updatedAt']),
      OrderItem: objectSchema({
        id: { type: 'integer' },
        orderId: { type: 'integer' },
        productId: { type: 'integer' },
        productNameSnapshot: { type: 'string' },
        priceSnapshot: { type: 'string', example: '50000.00' },
        quantity: { type: 'integer' },
        createdAt: { type: 'string', format: 'date-time' }
      }, ['id', 'orderId', 'productId', 'productNameSnapshot', 'priceSnapshot', 'quantity', 'createdAt']),
      OrderPayment: objectSchema({
        id: { type: 'integer' },
        orderId: { type: 'integer' },
        method: ref('PaymentMethod'),
        status: ref('PaymentStatus'),
        gatewayReference: { type: 'string', nullable: true },
        paidAt: { type: 'string', format: 'date-time', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }, ['id', 'orderId', 'method', 'status', 'createdAt', 'updatedAt']),
      Order: objectSchema({
        id: { type: 'integer' },
        userId: { type: 'integer' },
        addressId: { type: 'integer' },
        status: ref('OrderStatus'),
        totalAmount: { type: 'string', example: '150000.00' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        items: arrayOf(ref('OrderItem')),
        payment: ref('OrderPayment'),
        address: ref('Address'),
        user: ref('OrderUser')
      }, ['id', 'userId', 'addressId', 'status', 'totalAmount', 'createdAt', 'updatedAt', 'items', 'payment', 'address', 'user']),
      PaymentWithOrder: objectSchema({
        id: { type: 'integer' },
        orderId: { type: 'integer' },
        method: ref('PaymentMethod'),
        status: ref('PaymentStatus'),
        gatewayReference: { type: 'string', nullable: true },
        paidAt: { type: 'string', format: 'date-time', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        order: ref('OrderBase')
      }, ['id', 'orderId', 'method', 'status', 'createdAt', 'updatedAt', 'order']),
      PaymentStatusResponse: objectSchema({
        orderId: { type: 'integer' },
        orderStatus: ref('OrderStatus'),
        payment: ref('PaymentWithOrder')
      }, ['orderId', 'orderStatus', 'payment']),
      WebhookResult: objectSchema({
        payment: ref('PaymentWithOrder'),
        order: ref('Order')
      }, ['payment', 'order'])
    }
  }
} as const;

