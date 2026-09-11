import { AppError } from '../../common/app-error';
import { categoryRepository } from './category.repository';
import type { CategoryCreateInput, CategoryUpdateInput } from './category.schemas';

export const categoryService = {
  list() {
    return categoryRepository.findAll();
  },

  async getById(id: number) {
    const category = await categoryRepository.findById(id);

    if (!category) {
      throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
    }

    return category;
  },

  async create(input: CategoryCreateInput) {
    const existing = await categoryRepository.findByName(input.name);

    if (existing) {
      throw new AppError(409, 'CATEGORY_ALREADY_EXISTS', 'Category name already exists');
    }

    return categoryRepository.create({ name: input.name });
  },

  async update(id: number, input: CategoryUpdateInput) {
    await this.getById(id);

    const duplicate = await categoryRepository.findByName(input.name);

    if (duplicate && duplicate.id !== id) {
      throw new AppError(409, 'CATEGORY_ALREADY_EXISTS', 'Category name already exists');
    }

    return categoryRepository.update(id, { name: input.name });
  },

  async remove(id: number) {
    await this.getById(id);
    return categoryRepository.delete(id);
  }
};