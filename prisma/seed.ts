import { PrismaClient, Role, ProductStatus, PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ATELIER Apparel & Lifestyle database...');

  // 1. Password hashes
  const adminPassword = await bcrypt.hash('Admin12345!', 10);
  const customerPassword = await bcrypt.hash('Customer12345!', 10);

  // 2. Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@atelier.id' },
    update: {
      name: 'Salman Alfarizy',
      role: Role.ADMIN
    },
    create: {
      name: 'Salman Alfarizy',
      email: 'admin@atelier.id',
      passwordHash: adminPassword,
      role: Role.ADMIN
    }
  });

  // 3. Customers
  const customersData = [
    { name: 'Arya Pratama', email: 'arya.pratama@gmail.com' },
    { name: 'Nadia Safira', email: 'nadia.safira@gmail.com' },
    { name: 'Dimas Setiawan', email: 'dimas.setiawan@gmail.com' },
    { name: 'Clarissa Putri', email: 'clarissa.putri@gmail.com' },
    { name: 'Rizky Ramadhan', email: 'rizky.ramadhan@gmail.com' }
  ];

  const customers = [];
  for (const c of customersData) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: { name: c.name },
      create: {
        name: c.name,
        email: c.email,
        passwordHash: customerPassword,
        role: Role.CUSTOMER
      }
    });
    customers.push(user);
  }

  // 4. Addresses
  const addressesData = [
    {
      userId: customers[0].id,
      recipientName: 'Arya Pratama',
      phone: '081234567890',
      cityId: '152',
      fullAddress: 'Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan 12190',
      isDefault: true
    },
    {
      userId: customers[1].id,
      recipientName: 'Nadia Safira',
      phone: '082198765432',
      cityId: '23',
      fullAddress: 'Jl. Riau No. 108, Citarum, Kota Bandung 40115',
      isDefault: true
    },
    {
      userId: customers[2].id,
      recipientName: 'Dimas Setiawan',
      phone: '081377889900',
      cityId: '444',
      fullAddress: 'Jl. Kertajaya Indah Timur Blok G-12, Sukolilo, Surabaya 60117',
      isDefault: true
    },
    {
      userId: customers[3].id,
      recipientName: 'Clarissa Putri',
      phone: '085611223344',
      cityId: '256',
      fullAddress: 'Jl. Ijen Boulevard No. 85, Klojen, Kota Malang 65112',
      isDefault: true
    },
    {
      userId: customers[4].id,
      recipientName: 'Rizky Ramadhan',
      phone: '087855667788',
      cityId: '501',
      fullAddress: 'Jl. Kaliurang KM 5.2 No. 19, Depok, Sleman, DI Yogyakarta 55281',
      isDefault: true
    }
  ];

  const addresses = [];
  for (const a of addressesData) {
    const addr = await prisma.address.create({
      data: a
    });
    addresses.push(addr);
  }

  // 5. Categories
  const categoriesData = [
    { name: 'Pakaian Pria' },
    { name: 'Pakaian Wanita' },
    { name: 'Aksesoris & Leather' },
    { name: 'Living & Home Goods' }
  ];

  const categoriesMap: Record<string, any> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name }
    });
    categoriesMap[cat.name] = created;
  }

  // 6. Products
  const productsData = [
    {
      name: 'Heavyweight Boxy T-Shirt',
      description: 'T-shirt berbobot 240 GSM berbahan 100% combed cotton dengan potongan loose boxy fit. Serat benang lembut, jahitan rantai ganda yang kokoh, dan kerah rib tebal anti-melar.',
      price: 189000,
      stock: 45,
      categoryName: 'Pakaian Pria',
      images: [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      name: 'Relaxed Linen Overshirt',
      description: 'Kemeja luaran berbahan premium French linen blend yang sejuk dan bertekstur alami. Dilengkapi kancing tanduk alami (horn buttons) dan kantong dada ganda.',
      price: 349000,
      stock: 28,
      categoryName: 'Pakaian Pria',
      images: [
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      name: 'Japanese Selvedge Denim Jacket',
      description: 'Jaket denim selvedge 14.5 oz buatan Okayama dengan teknik rope-dyed deep indigo. Menghasilkan efek fading personal yang semakin berkarakter seiring pemakaian.',
      price: 899000,
      stock: 15,
      categoryName: 'Pakaian Pria',
      images: [
        'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      name: 'Pleated Relaxed Chino Trousers',
      description: 'Celana chino potongan santai dengan detail single-pleat di bagian depan. Menggunakan bahan twill katun stretch tebal yang nyaman dipakai seharian di kantor maupun akhir pekan.',
      price: 429000,
      stock: 32,
      categoryName: 'Pakaian Pria',
      images: [
        'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      name: 'French Terry Raglan Crewneck',
      description: 'Sweater crewneck katun organik dengan bagian dalam loop-knit lembut. Potongan raglan sleeve memberikan siluet santai yang jatuh sempurna di badan.',
      price: 379000,
      stock: 25,
      categoryName: 'Pakaian Wanita',
      images: [
        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      name: 'Linen Wrap Midi Dress',
      description: 'Gaun wrap midi berpotongan A-line dengan aksen ikat pinggang feminin. Menggunakan serat linen murni berwarna terracotta rust yang bernapas dan elegan.',
      price: 489000,
      stock: 18,
      categoryName: 'Pakaian Wanita',
      images: [
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      name: 'Ribbed Knit Button Cardigan',
      description: 'Kardigan rajut tekstur rib halus dengan perpaduan benang wool dan katun bersertifikasi OEKO-TEX. Warna oat warm cream yang mudah dipadupadankan.',
      price: 419000,
      stock: 22,
      categoryName: 'Pakaian Wanita',
      images: [
        'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      name: 'High-Waisted Wide Leg Linen Pants',
      description: 'Celana kulot berpotongan lebar dengan pinggang tinggi berkaret elastis di bagian belakang. Menghadirkan siluet jenjang dan kenyamanan maksimal.',
      price: 369000,
      stock: 30,
      categoryName: 'Pakaian Wanita',
      images: [
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      name: 'Bifold Vegetable-Tanned Leather Wallet',
      description: 'Dompet lipat dua dibuat manual dari kulit sapi nabati (vegetable-tanned leather) kualitas full-grain. Berisi 6 slot kartu dan kompartemen uang kertas bertekstur alami.',
      price: 289000,
      stock: 40,
      categoryName: 'Aksesoris & Leather',
      images: [
        'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1554412933-514a83d2f3c8?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      name: 'Heavyweight Canvas Everyday Tote',
      description: 'Tas jinjing serbaguna dari kanvas katun 16 oz tahan aus. Muat laptop hingga 15 inci dengan saku dalam berseleting dan strap bahu yang kokoh.',
      price: 199000,
      stock: 55,
      categoryName: 'Aksesoris & Leather',
      images: [
        'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1597633425046-08f5110420b5?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      name: 'Solid Brass Key Carabiner & Clip',
      description: 'Gantungan kunci perkakas minimalis dari bahan kuningan padat murni (solid brass) dengan mekanisme pegas presisi dan gantungan ring ganda.',
      price: 119000,
      stock: 60,
      categoryName: 'Aksesoris & Leather',
      images: [
        'https://images.unsplash.com/photo-1541690090176-17d35a190b6c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1678869519831-fc2c8f2a0bfd?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1680832032123-d95f701d23fd?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1679453082119-f7ea421e4370?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      name: 'Structured Cotton Twill Dad Cap',
      description: 'Topi baseball berstruktur 6-panel dengan bahan katun twill washed. Dilengkapi strap gesper kuningan antik yang dapat diatur ukurannya secara leluasa.',
      price: 159000,
      stock: 35,
      categoryName: 'Aksesoris & Leather',
      images: [
        'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1534215754734-18e55d13e346?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      name: 'Speckled Clay Ceramic Mug (350ml)',
      description: 'Cangkir kopi keramik buatan pengrajin lokal dengan glasir matte berbintik alami. Tahan panas microwave dan dishwasher dengan pegangan ergonomis yang nyaman di genggaman.',
      price: 149000,
      stock: 42,
      categoryName: 'Living & Home Goods',
      images: [
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      name: 'Artisan Soy Candle - Cedar & Amber (220g)',
      description: 'Lilin aromaterapi berbahan 100% soy wax murni dengan sumbu kayu alami (crackling wood wick). Menghadirkan aroma hangat cedarwood, amber, dan vanila lembut hingga 45 jam pembakaran.',
      price: 179000,
      stock: 38,
      categoryName: 'Living & Home Goods',
      images: [
        'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      name: 'Stoneware Pour-Over Coffee Dripper',
      description: 'Corong seduh kopi manual dripper V60 berbahan keramik stoneware tebal penahan suhu stabil. Alur spiral internal memastikan ekstraksi rasa kopi yang optimal dan seimbang.',
      price: 239000,
      stock: 20,
      categoryName: 'Living & Home Goods',
      images: [
        'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80'
      ]
    },
    {
      name: 'Organic Waffle Weave Hand Towel Set',
      description: 'Set berisi 2 handuk tangan tenun waffle berbahan perpaduan katun organik dan serat rami. Berdaya serap tinggi, cepat kering, dan semakin lembut seiring pencucian.',
      price: 169000,
      stock: 25,
      categoryName: 'Living & Home Goods',
      images: [
        'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
      ]
    }
  ];

  // Clear existing product images and products
  await prisma.productImage.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();

  const createdProducts = [];
  for (const p of productsData) {
    const prod = await prisma.product.create({
      data: {
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        categoryId: categoriesMap[p.categoryName].id,
        status: ProductStatus.ACTIVE,
        images: {
          create: p.images.map(img => ({ imageUrl: img }))
        }
      }
    });
    createdProducts.push(prod);
  }
  console.log(`Created ${createdProducts.length} aesthetic apparel & lifestyle products.`);

  // 7. Orders & Payments
  const orderConfigs = [
    {
      userIndex: 0,
      addressIndex: 0,
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      items: [
        { productIndex: 0, quantity: 2 },
        { productIndex: 8, quantity: 1 }
      ],
      shippingCost: 24000,
      ref: 'MIDTRANS-SETTLE-882910'
    },
    {
      userIndex: 1,
      addressIndex: 1,
      status: OrderStatus.SHIPPED,
      paymentStatus: PaymentStatus.PAID,
      items: [
        { productIndex: 5, quantity: 1 },
        { productIndex: 9, quantity: 1 }
      ],
      shippingCost: 18000,
      ref: 'MIDTRANS-SETTLE-992314'
    },
    {
      userIndex: 2,
      addressIndex: 2,
      status: OrderStatus.PROCESSING,
      paymentStatus: PaymentStatus.PAID,
      items: [
        { productIndex: 2, quantity: 1 },
        { productIndex: 3, quantity: 1 }
      ],
      shippingCost: 32000,
      ref: 'MIDTRANS-SETTLE-112093'
    },
    {
      userIndex: 3,
      addressIndex: 3,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      items: [
        { productIndex: 12, quantity: 2 },
        { productIndex: 13, quantity: 1 }
      ],
      shippingCost: 15000,
      ref: 'MIDTRANS-PEND-554210'
    },
    {
      userIndex: 4,
      addressIndex: 4,
      status: OrderStatus.PAID,
      paymentStatus: PaymentStatus.PAID,
      items: [
        { productIndex: 1, quantity: 1 },
        { productIndex: 11, quantity: 1 }
      ],
      shippingCost: 20000,
      ref: 'MIDTRANS-SETTLE-332918'
    }
  ];

  for (const oc of orderConfigs) {
    let subtotal = 0;
    const itemsData = oc.items.map(it => {
      const prod = createdProducts[it.productIndex];
      const itemTotal = Number(prod.price) * it.quantity;
      subtotal += itemTotal;
      return {
        productId: prod.id,
        productNameSnapshot: prod.name,
        priceSnapshot: prod.price,
        quantity: it.quantity
      };
    });

    const totalAmount = subtotal + oc.shippingCost;

    const order = await prisma.order.create({
      data: {
        userId: customers[oc.userIndex].id,
        addressId: addresses[oc.addressIndex].id,
        status: oc.status,
        totalAmount,
        shippingCost: oc.shippingCost,
        items: {
          create: itemsData
        },
        payment: {
          create: {
            method: PaymentMethod.MIDTRANS,
            status: oc.paymentStatus,
            gatewayReference: oc.ref,
            paidAt: oc.paymentStatus === PaymentStatus.PAID ? new Date() : null
          }
        }
      }
    });

    // Reviews for completed orders
    if (oc.status === OrderStatus.COMPLETED) {
      await prisma.review.create({
        data: {
          userId: customers[oc.userIndex].id,
          productId: createdProducts[oc.items[0].productIndex].id,
          orderId: order.id,
          rating: 5,
          comment: 'Kualitas bahan katunnya beneran tebal dan potongannya pas banget di badan. Jahitan sangat rapi, bakal repeat order!'
        }
      });
      await prisma.review.create({
        data: {
          userId: customers[oc.userIndex].id,
          productId: createdProducts[oc.items[1].productIndex].id,
          orderId: order.id,
          rating: 5,
          comment: 'Dompet kulit aslinya wangi khas vegetable-tanned, warnanya natural dan tipis pas di saku.'
        }
      });
    }
  }

  // 8. Carts
  for (const customer of customers) {
    await prisma.cart.upsert({
      where: { userId: customer.id },
      update: {},
      create: { userId: customer.id }
    });
  }

  // Put 2 items in customer[0]'s cart
  const buyer1Cart = await prisma.cart.findUnique({ where: { userId: customers[0].id } });
  if (buyer1Cart) {
    await prisma.cartItem.createMany({
      data: [
        { cartId: buyer1Cart.id, productId: createdProducts[1].id, quantity: 1 },
        { cartId: buyer1Cart.id, productId: createdProducts[10].id, quantity: 1 }
      ]
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
