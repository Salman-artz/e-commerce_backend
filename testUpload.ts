import { productService } from './src/modules/products/product.service';
import fs from 'fs';

async function test() {
  try {
    const buffer = fs.readFileSync('package.json');
    const files = [{
      buffer,
      originalname: 'package.json',
      mimetype: 'application/json',
      size: buffer.length,
      fieldname: 'images',
      encoding: '7bit'
    } as Express.Multer.File];
    
    // Test product 2 upload
    const result = await productService.uploadImages(2, files);
    console.log('SUCCESS:', result);
  } catch (error) {
    console.error('ERROR_CAUGHT:', error);
  }
}
test().finally(() => process.exit(0));
