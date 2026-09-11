-- Add Cloudinary public id for product images so assets can be cleaned up on update/delete.

ALTER TABLE `product_images`
  ADD COLUMN `public_id` VARCHAR(191) NULL AFTER `image_url`;
