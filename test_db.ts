import { getDb, getUserByEmail } from './server/db';

async function test() {
  console.log('Running database test...');
  const db = await getDb();
  if (!db) {
    console.error('Failed to get database connection.');
    return;
  }
  console.log('Database connection acquired.');
  
  const email = 'test@gmail.com';
  console.log(`Fetching user with email: ${email}`);
  const user = await getUserByEmail(email);
  
  if (user) {
    console.log('User found:', JSON.stringify(user, null, 2));
  } else {
    console.log('User not found.');
  }
}

test();
est();
