import { PrismaClient, Role, ProductStatus, PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Admin12345!', 10);
  const customerPassword = await bcrypt.hash('Customer12345!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ecommerce.test' },
    update: {},
    create: {
      name: 'Admin Toko',
      email: 'admin@ecommerce.test',
      passwordHash: adminPassword,
      role: Role.ADMIN
    }
  });

  const customers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'buyer1@ecommerce.test' },
      update: {},
      create: {
        name: 'Buyer One',
        email: 'buyer1@ecommerce.test',
        passwordHash: customerPassword,
        role: Role.CUSTOMER
      }
    }),
    prisma.user.upsert({
      where: { email: 'buyer2@ecommerce.test' },
      update: {},
      create: {
        name: 'Buyer Two',
        email: 'buyer2@ecommerce.test',
        passwordHash: customerPassword,
        role: Role.CUSTOMER
      }
    })
  ]);

  const [fashion, electronics, home] = await Promise.all([
    prisma.category.upsert({ where: { name: 'Fashion' }, update: {}, create: { name: 'Fashion' } }),
    prisma.category.upsert({ where: { name: 'Electronics' }, update: {}, create: { name: 'Electronics' } }),
    prisma.category.upsert({ where: { name: 'Home & Living' }, update: {}, create: { name: 'Home & Living' } })
  ]);

  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Classic Cotton T-Shirt',
        description: 'Comfortable everyday t-shirt made from premium cotton.',
        price: 125000,
        stock: 50,
        categoryId: fashion.id,
        status: ProductStatus.ACTIVE,
        images: {
          create: [{ imageUrl: 'https://placehold.co/600x600?text=Classic+Cotton+T-Shirt' }]
        }
      }
    }),
    prisma.product.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Wireless Headphones',
        description: 'Bluetooth headphones with active noise cancellation.',
        price: 875000,
        stock: 20,
        categoryId: electronics.id,
        status: ProductStatus.ACTIVE,
        images: {
          create: [{ imageUrl: 'https://placehold.co/600x600?text=Wireless+Headphones' }]
        }
      }
    }),
    prisma.product.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: 'Minimalist Desk Lamp',
        description: 'Warm light desk lamp for modern workspaces.',
        price: 320000,
        stock: 35,
        categoryId: home.id,
        status: ProductStatus.ACTIVE,
        images: {
          create: [{ imageUrl: 'https://placehold.co/600x600?text=Minimalist+Desk+Lamp' }]
        }
      }
    })
  ]);

  for (const customer of customers) {
    const cart = await prisma.cart.upsert({
      where: { userId: customer.id },
      update: {},
      create: { userId: customer.id }
    });

    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: products[0].id } },
      update: { quantity: 2 },
      create: { cartId: cart.id, productId: products[0].id, quantity: 2 }
    });
  }

  const address = await prisma.address.upsert({
    where: { id: 1 },
    update: {},
    create: {
      userId: customers[0].id,
      recipientName: 'Buyer One',
      phone: '081234567890',
      fullAddress: 'Jl. Melati No. 10, Jakarta Selatan',
      isDefault: true
    }
  });

  const order = await prisma.order.upsert({
    where: { id: 1 },
    update: {},
    create: {
      userId: customers[0].id,
      addressId: address.id,
      status: OrderStatus.PENDING,
      totalAmount: 250000,
      items: {
        create: [
          {
            productId: products[0].id,
            productNameSnapshot: products[0].name,
            priceSnapshot: products[0].price,
            quantity: 2
          }
        ]
      },
      payment: {
        create: {
          method: PaymentMethod.MIDTRANS,
          status: PaymentStatus.PENDING,
          gatewayReference: 'seed-midtrans-ref-001'
        }
      }
    }
  });

  void admin;
  void order;

  console.log('Seed data inserted successfully.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });