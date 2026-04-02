import fs from 'fs';
import path from 'path';

const manifestPath = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  
  const permissionsToAdd = [
    '<uses-permission android:name="android.permission.CAMERA" />',
    '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />',
    '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />',
    '<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />',
    '<uses-feature android:name="android.hardware.camera" android:required="false" />'
  ];

  let modified = false;
  
  permissionsToAdd.forEach(permission => {
    // Check if permission already exists (ignoring exact whitespace)
    const permNameMatch = permission.match(/android:name="([^"]+)"/);
    if (permNameMatch && permNameMatch[1]) {
      const permName = permNameMatch[1];
      if (!manifest.includes(`android:name="${permName}"`)) {
        manifest = manifest.replace('</manifest>', `    ${permission}\n</manifest>`);
        modified = true;
      }
    }
  });

  if (modified) {
    fs.writeFileSync(manifestPath, manifest, 'utf8');
    console.log('Successfully injected permissions into AndroidManifest.xml');
  } else {
    console.log('Permissions already exist in AndroidManifest.xml');
  }
} else {
  console.log('AndroidManifest.xml not found, skipping permission injection.');
}
