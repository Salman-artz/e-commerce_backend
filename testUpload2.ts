import { productService } from './src/modules/products/product.service';

async function test() {
  try {
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==', 'base64');
    const files = [{
      buffer,
      originalname: 'test.png',
      mimetype: 'image/png',
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
