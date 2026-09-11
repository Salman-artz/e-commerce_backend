import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

const cartInclude = {
  items: {
    include: {
      product: {
        include: {
          category: true,
          images: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  }
} as const;

export const cartRepository = {
  getOrCreate(userId: number) {
    return prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: cartInclude
    });
  },

  findByUser(userId: number) {
    return prisma.cart.findUnique({
      where: { userId },
      include: cartInclude
    });
  },

  findItemById(id: number, userId: number) {
    return prisma.cartItem.findFirst({
      where: { id, cart: { userId } },
      include: {
        product: {
          include: {
            category: true,
            images: true
          }
        },
        cart: true
      }
    });
  },

  findProduct(productId: number) {
    return prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        images: true
      }
    });
  },

  findItemByCartAndProduct(cartId: number, productId: number) {
    return prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId, productId } },
      include: {
        product: {
          include: {
            category: true,
            images: true
          }
        }
      }
    });
  },

  createItem(cartId: number, productId: number, quantity: number) {
    return prisma.cartItem.create({
      data: { cartId, productId, quantity }
    });
  },

  updateItem(id: number, quantity: number) {
    return prisma.cartItem.update({
      where: { id },
      data: { quantity }
    });
  },

  deleteItem(id: number) {
    return prisma.cartItem.delete({ where: { id } });
  },

  getCartWithItems(userId: number) {
    return prisma.cart.findUnique({
      where: { userId },
      include: cartInclude
    });
  },

  getCartWithItemsTx(tx: Prisma.TransactionClient, userId: number) {
    return tx.cart.findUnique({
      where: { userId },
      include: cartInclude
    });
  },

  clearCart(cartId: number) {
    return prisma.cartItem.deleteMany({ where: { cartId } });
  }
};