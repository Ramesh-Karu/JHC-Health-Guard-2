import fs from 'fs';
import path from 'path';

const src = 'google-services.json';
const dest = 'android/app/google-services.json';

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log('google-services.json copied to android/app/');
} else {
  console.error('google-services.json not found in root directory. Skipping copy.');
}
