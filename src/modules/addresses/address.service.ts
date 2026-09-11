import { AppError } from '../../common/app-error';
import { addressRepository } from './address.repository';
import type { AddressCreateInput, AddressUpdateInput } from './address.schemas';

export const addressService = {
  list(userId: number) {
    return addressRepository.findMany(userId);
  },

  async create(userId: number, input: AddressCreateInput) {
    const existingAddresses = await addressRepository.findMany(userId);
    if (existingAddresses.length >= 5) {
      throw new AppError(400, 'MAX_ADDRESSES_REACHED', 'Maksimal 5 alamat diperbolehkan');
    }

    if (input.isDefault || existingAddresses.length === 0) {
      input.isDefault = true;
      await addressRepository.clearDefaultForUser(userId);
    }

    return addressRepository.create(userId, input);
  },

  async update(userId: number, id: number, input: AddressUpdateInput) {
    const address = await addressRepository.findByIdAndUser(id, userId);

    if (!address) {
      throw new AppError(404, 'ADDRESS_NOT_FOUND', 'Address not found');
    }

    if (input.isDefault) {
      await addressRepository.clearDefaultForUser(userId, id);
    }

    return addressRepository.update(id, input);
  },

  async remove(userId: number, id: number) {
    const address = await addressRepository.findByIdAndUser(id, userId);

    if (!address) {
      throw new AppError(404, 'ADDRESS_NOT_FOUND', 'Address not found');
    }

    return addressRepository.delete(id);
  }
};