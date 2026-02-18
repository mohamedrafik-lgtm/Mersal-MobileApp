/**
 * Generate App Icons from logo.png
 * Resizes the logo into all required Android & iOS icon sizes
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE = path.resolve(__dirname, '..', 'src/logo/logo.png');

// Android mipmap sizes
const ANDROID_ICONS = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

// iOS icon sizes (filename -> pixel size)
const IOS_ICONS = [
  { filename: 'icon-20@2x.png', size: 40 },
  { filename: 'icon-20@3x.png', size: 60 },
  { filename: 'icon-29@2x.png', size: 58 },
  { filename: 'icon-29@3x.png', size: 87 },
  { filename: 'icon-40@2x.png', size: 80 },
  { filename: 'icon-40@3x.png', size: 120 },
  { filename: 'icon-60@2x.png', size: 120 },
  { filename: 'icon-60@3x.png', size: 180 },
  { filename: 'icon-1024.png', size: 1024 },
];

async function generateIcons() {
  console.log('Reading source:', SOURCE);

  // Android
  const androidResDir = path.resolve(
    __dirname,
    '..',
    'android/app/src/main/res',
  );

  for (const { folder, size } of ANDROID_ICONS) {
    const outDir = path.join(androidResDir, folder);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // ic_launcher.png
    await sharp(SOURCE)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(outDir, 'ic_launcher.png'));

    // ic_launcher_round.png (same for now)
    await sharp(SOURCE)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(outDir, 'ic_launcher_round.png'));

    console.log(`  Android ${folder}: ${size}x${size} ✓`);
  }

  // iOS
  const iosIconDir = path.resolve(
    __dirname,
    '..',
    'ios/morasel/Images.xcassets/AppIcon.appiconset',
  );
  if (!fs.existsSync(iosIconDir)) fs.mkdirSync(iosIconDir, { recursive: true });

  for (const { filename, size } of IOS_ICONS) {
    await sharp(SOURCE)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(iosIconDir, filename));

    console.log(`  iOS ${filename}: ${size}x${size} ✓`);
  }

  // Update iOS Contents.json
  const contentsJson = {
    images: [
      { idiom: 'iphone', scale: '2x', size: '20x20', filename: 'icon-20@2x.png' },
      { idiom: 'iphone', scale: '3x', size: '20x20', filename: 'icon-20@3x.png' },
      { idiom: 'iphone', scale: '2x', size: '29x29', filename: 'icon-29@2x.png' },
      { idiom: 'iphone', scale: '3x', size: '29x29', filename: 'icon-29@3x.png' },
      { idiom: 'iphone', scale: '2x', size: '40x40', filename: 'icon-40@2x.png' },
      { idiom: 'iphone', scale: '3x', size: '40x40', filename: 'icon-40@3x.png' },
      { idiom: 'iphone', scale: '2x', size: '60x60', filename: 'icon-60@2x.png' },
      { idiom: 'iphone', scale: '3x', size: '60x60', filename: 'icon-60@3x.png' },
      { idiom: 'ios-marketing', scale: '1x', size: '1024x1024', filename: 'icon-1024.png' },
    ],
    info: { author: 'xcode', version: 1 },
  };

  fs.writeFileSync(
    path.join(iosIconDir, 'Contents.json'),
    JSON.stringify(contentsJson, null, 2),
  );
  console.log('  iOS Contents.json updated ✓');

  console.log('\nDone! App icons generated successfully.');
}

generateIcons().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
