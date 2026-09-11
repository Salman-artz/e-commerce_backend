import 'dotenv/config';
import mysql from 'mysql2/promise';

async function main() {
  const host = process.env.DB_HOST ?? '127.0.0.1';
  const port = Number(process.env.DB_PORT ?? 3306);
  const user = process.env.DB_USERNAME;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_DATABASE ?? 'ecommerce_api_db';

  if (!user) {
    throw new Error('DB_USERNAME is required.');
  }

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password
  });

  await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await connection.end();

  console.log(`Database ready: ${database}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});