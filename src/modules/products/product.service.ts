import { Prisma, ProductStatus } from '@prisma/client';
import { cloudinary, cloudinaryConfigured } from '../../config/cloudinary';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { env } from '../../config/env';
import { AppError } from '../../common/app-error';
import { categoryRepository } from '../categories/category.repository';
import { productRepository } from './product.repository';
import type { ProductCreateInput, ProductQueryInput, ProductUpdateInput } from './product.schemas';

function normalizeImages(images?: { imageUrl: string }[]) {
  return (images ?? []).map((image) => image.imageUrl);
}

function inferCloudinaryPublicId(imageUrl: string) {
  try {
    const url = new URL(imageUrl);
    const uploadIndex = url.pathname.indexOf('/upload/');

    if (uploadIndex < 0) {
      return null;
    }

    const assetPath = url.pathname.slice(uploadIndex + '/upload/'.length);
    const segments = assetPath.split('/').filter(Boolean);

    if (segments.length === 0) {
      return null;
    }

    const versionIndex = segments.findIndex((segment) => /^v\d+$/.test(segment));
    const pathSegments = versionIndex >= 0 ? segments.slice(versionIndex + 1) : segments;

    if (pathSegments.length === 0) {
      return null;
    }

    const lastSegment = pathSegments[pathSegments.length - 1];
    const assetName = lastSegment.replace(/\.[^.]+$/, '');
    const folderSegments = pathSegments.slice(0, -1);

    return [...folderSegments, assetName].filter(Boolean).join('/');
  } catch {
    return null;
  }
}

type UploadedImageAsset = {
  secureUrl: string;
  publicId: string;
};

async function uploadBufferToCloudinary(buffer: Buffer, folder: string, originalName?: string): Promise<UploadedImageAsset> {
  if (!cloudinaryConfigured) {
    // Fallback to local file system
    const safeExt = originalName ? path.extname(originalName) : '';
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt || '.jpg'}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
    
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), buffer);
    
    const baseUrl = `http://localhost:${env.PORT || 3000}`;
    return {
      secureUrl: `${baseUrl}/uploads/${folder}/${filename}`,
      publicId: `local:${folder}/${filename}` // custom publicId for local files
    };
  }

  return new Promise<UploadedImageAsset>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error('Failed to upload image'));
          return;
        }

        resolve({ secureUrl: result.secure_url, publicId: result.public_id });
      }
    );

    stream.end(buffer);
  });
}

async function destroyUploadedImages(publicIds: string[]) {
  await Promise.allSettled(
    publicIds.map(async (publicId) => {
      if (publicId.startsWith('local:')) {
        // Handle local file deletion
        const relativePath = publicId.replace('local:', '');
        const fullPath = path.join(process.cwd(), 'public', 'uploads', relativePath);
        try {
          await fs.unlink(fullPath);
        } catch (e) {
          // ignore if not found
        }
        return;
      }

      return new Promise<void>((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, { resource_type: 'image' }, (error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    })
  );
}

function mapUploadedAssetsToImageInputs(assets: UploadedImageAsset[]) {
  return assets.map((asset) => ({
    imageUrl: asset.secureUrl,
    publicId: asset.publicId
  }));
}

function mapImageInputs(images?: { imageUrl: string }[]) {
  return normalizeImages(images).map((imageUrl) => ({
    imageUrl,
    publicId: null
  }));
}

function collectCleanupPublicIds(images: { imageUrl: string; publicId: string | null }[]) {
  return images
    .flatMap((image) => {
      if (image.publicId) {
        return [image.publicId];
      }

      const inferred = inferCloudinaryPublicId(image.imageUrl);
      return inferred ? [inferred] : [];
    })
    .filter((publicId): publicId is string => Boolean(publicId));
}

export const productService = {
  async list(query: ProductQueryInput) {
    const where = productRepository.getWhereClause({
      search: query.search,
      categoryId: query.categoryId,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      status: query.status
    });

    const sortOption = query.sortBy || query.sort;
    let orderBy: Prisma.ProductOrderByWithRelationInput[] = [{ createdAt: 'desc' }, { id: 'desc' }];

    if (sortOption === 'price_asc' || sortOption === 'price-asc') {
      orderBy = [{ price: 'asc' }, { id: 'asc' }];
    } else if (sortOption === 'price_desc' || sortOption === 'price-desc') {
      orderBy = [{ price: 'desc' }, { id: 'desc' }];
    } else if (sortOption === 'oldest') {
      orderBy = [{ createdAt: 'asc' }, { id: 'asc' }];
    } else if (sortOption === 'newest') {
      orderBy = [{ createdAt: 'desc' }, { id: 'desc' }];
    }

    const [totalItems, items] = await Promise.all([
      productRepository.count(where),
      productRepository.findMany(where, (query.page - 1) * query.limit, query.limit, orderBy)
    ]);

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / query.limit))
      }
    };
  },

  async getById(id: number) {
    const product = await productRepository.findById(id);

    if (!product) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }

    return product;
  },

  async create(input: ProductCreateInput) {
    const category = await categoryRepository.findById(input.categoryId);

    if (!category) {
      throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
    }

    const images = mapImageInputs(input.images);

    return productRepository.create(
      {
        name: input.name,
        description: input.description,
        price: input.price,
        stock: input.stock,
        status: input.status ?? ProductStatus.ACTIVE,
        category: { connect: { id: category.id } }
      },
      images
    );
  },

  async update(id: number, input: ProductUpdateInput) {
    const existing = await this.getById(id);
    const existingImagePublicIds = collectCleanupPublicIds(existing.images);

    if (input.categoryId) {
      const category = await categoryRepository.findById(input.categoryId);

      if (!category) {
        throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
      }
    }

    const images = input.images ? mapImageInputs(input.images) : undefined;

    const updatedProduct = await productRepository.update(
      existing.id,
      {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.stock !== undefined ? { stock: input.stock } : {}),
        ...(input.categoryId !== undefined ? { category: { connect: { id: input.categoryId } } } : {}),
        ...(input.status !== undefined ? { status: input.status } : {})
      },
      images
    );

    if (input.images && existingImagePublicIds.length > 0) {
      await destroyUploadedImages(existingImagePublicIds);
    }

    return updatedProduct;
  },

  async remove(id: number) {
    const existing = await this.getById(id);
    
    // Attempt to delete images from cloudinary or local storage
    if (existing.images?.length > 0) {
      const publicIds = existing.images.map(img => img.publicId).filter(Boolean) as string[];
      if (publicIds.length > 0) {
        await destroyUploadedImages(publicIds);
      }
    }

    return productRepository.remove(id);
  },

  async removeImage(productId: number, imageId: number) {
    const product = await this.getById(productId);
    const image = await productRepository.findImageById(imageId);

    if (!image || image.productId !== product.id) {
      throw new AppError(404, 'NOT_FOUND', 'Image not found');
    }

    if (image.publicId) {
      await destroyUploadedImages([image.publicId]);
    }

    await productRepository.removeImage(imageId);
  },

  async uploadImages(id: number, files: Express.Multer.File[]) {
    const existing = await this.getById(id);

    if (files.length === 0) {
      throw new AppError(400, 'NO_FILES_UPLOADED', 'At least one image file is required');
    }

    const uploadedAssets: UploadedImageAsset[] = [];

    try {
      for (const file of files) {
        const asset = await uploadBufferToCloudinary(file.buffer, `products/${existing.id}`, file.originalname);
        uploadedAssets.push(asset);
      }
    } catch (error) {
      await destroyUploadedImages(uploadedAssets.map((asset) => asset.publicId));
      throw error;
    }

    return productRepository.appendImages(existing.id, mapUploadedAssetsToImageInputs(uploadedAssets));
  }
};