import { ProductStatus } from '@prisma/client';
import { AppError } from '../../common/app-error';
import { cartRepository } from './cart.repository';
import type { CartItemCreateInput, CartItemUpdateInput } from './cart.schemas';

function serializeCart(cart: Awaited<ReturnType<typeof cartRepository.getCartWithItems>>) {
  return cart;
}

export const cartService = {
  async getCart(userId: number) {
    const cart = await cartRepository.getOrCreate(userId);
    return serializeCart(cart);
  },

  async addItem(userId: number, input: CartItemCreateInput) {
    const cart = await cartRepository.getOrCreate(userId);
    const product = await cartRepository.findProduct(input.productId);

    if (!product) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }

    if (product.status !== ProductStatus.ACTIVE) {
      throw new AppError(400, 'PRODUCT_NOT_AVAILABLE', 'Product is not available');
    }

    const existingItem = await cartRepository.findItemByCartAndProduct(cart.id, product.id);
    const newQuantity = (existingItem?.quantity ?? 0) + input.quantity;

    if (newQuantity > product.stock) {
      throw new AppError(400, 'INSUFFICIENT_STOCK', 'Requested quantity exceeds available stock');
    }

    if (existingItem) {
      await cartRepository.updateItem(existingItem.id, newQuantity);
    } else {
      await cartRepository.createItem(cart.id, product.id, input.quantity);
    }

    return cartRepository.getCartWithItems(userId);
  },

  async updateItem(userId: number, itemId: number, input: CartItemUpdateInput) {
    const item = await cartRepository.findItemById(itemId, userId);

    if (!item) {
      throw new AppError(404, 'CART_ITEM_NOT_FOUND', 'Cart item not found');
    }

    if (input.quantity > item.product.stock) {
      throw new AppError(400, 'INSUFFICIENT_STOCK', 'Requested quantity exceeds available stock');
    }

    await cartRepository.updateItem(item.id, input.quantity);
    return cartRepository.getCartWithItems(userId);
  },

  async removeItem(userId: number, itemId: number) {
    const item = await cartRepository.findItemById(itemId, userId);

    if (!item) {
      throw new AppError(404, 'CART_ITEM_NOT_FOUND', 'Cart item not found');
    }

    await cartRepository.deleteItem(item.id);
    return cartRepository.getCartWithItems(userId);
  }
};