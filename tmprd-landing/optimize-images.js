// scripts/optimize-images.js
//
// Usage:
//   npm i -D sharp
//   node scripts/optimize-images.js                 -> keep each image's own aspect ratio
//   node scripts/optimize-images.js --ratio=16:9    -> crop every image to the same ratio
//
// Reads originals, writes resized AVIF + WebP + JPEG/PNG fallbacks and a manifest.json.
// Originals are never modified or upscaled.

import sharp from "sharp";
import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const CONFIG = {
  inputDir: "Landing_Page_b4_afters",
  outputDir: "assets/optimized",
  publicPath: "/optimized", // URL prefix used inside srcset strings
  widths: [400, 800, 1200, 1600],
  // Tuned for texture-heavy photos (cakes, frosting, crumb). Lower these for simple graphics.
  encoders: {
    avif: { quality: 65, effort: 6, chromaSubsampling: "4:4:4" }, // 4:4:4 keeps pink/red icing edges crisp
    webp: { quality: 82, effort: 5, smartSubsample: true },
    jpeg: { quality: 84, mozjpeg: true },
    png: { compressionLevel: 9 },
  },
  cropPosition: "attention", // used only with --ratio: "centre", "top", "attention", ...
};

const SUPPORTED = new Set([".jpg", ".jpeg", ".png", ".webp", ".tiff", ".avif"]);

/* ---------- pure helpers ---------- */

/** "16:9" -> 1.777..., undefined -> null */
const parseRatio = (value) => {
  if (!value) return null;
  const [w, h] = value.split(":").map(Number);
  return w / h;
};

const getRatioArg = (argv) =>
  parseRatio(argv.find((arg) => arg.startsWith("--ratio="))?.split("=")[1]);

/** Widths to generate: never bigger than the source, always includes the largest usable size. */
const pickWidths = (widths, sourceWidth) => {
  const largest = Math.min(sourceWidth, Math.max(...widths));
  const smaller = widths.filter((w) => w < largest);
  return [...smaller, largest];
};

/** Widest usable width: when cropping to a ratio, the crop can't be wider than height * ratio. */
const usableWidth = (width, height, ratio) =>
  ratio ? Math.min(width, Math.floor(height * ratio)) : width;

const heightFor = (width, ratio) => Math.round(width / ratio);

const fileName = (name, width, format) => `${name}-${width}.${format}`;

const buildSrcset = (variants) =>
  variants
    .map(({ file, width }) => `${CONFIG.publicPath}/${file} ${width}w`)
    .join(", ");

/* ---------- image work ---------- */

const resizeTo = (buffer, width, height, ratio) =>
  sharp(buffer).resize({
    width,
    height,
    fit: ratio ? "cover" : "fill", // no ratio: height already matches, so nothing is distorted
    position: CONFIG.cropPosition,
  });

async function processImage(inputPath, ratioArg) {
  const name = path.parse(inputPath).name;

  // .rotate() applies EXIF orientation so phone photos aren't sideways
  const buffer = await sharp(inputPath).rotate().toBuffer();
  const { width, height, hasAlpha } = await sharp(buffer).metadata();

  const ratio = ratioArg ?? width / height;
  const widths = pickWidths(
    CONFIG.widths,
    usableWidth(width, height, ratioArg),
  );
  const fallback = hasAlpha ? "png" : "jpeg";
  const formats = ["avif", "webp", fallback];

  const variants = Object.fromEntries(formats.map((format) => [format, []]));

  for (const format of formats) {
    for (const w of widths) {
      const h = heightFor(w, ratio);
      const ext = format === "jpeg" ? "jpg" : format;
      const file = fileName(name, w, ext);

      await resizeTo(buffer, w, h, ratioArg)
        .toFormat(format, CONFIG.encoders[format])
        .toFile(path.join(CONFIG.outputDir, file));

      variants[format].push({ file, width: w, height: h });
    }
  }

  const largest = widths.at(-1);
  return {
    name,
    entry: {
      width: largest,
      height: heightFor(largest, ratio), // use these as <img width height> to prevent layout shift
      srcset: Object.fromEntries(
        formats.map((format) => [
          format === "jpeg" ? "jpg" : format,
          buildSrcset(variants[format]),
        ]),
      ),
      fallback: `${CONFIG.publicPath}/${fileName(name, largest, fallback === "jpeg" ? "jpg" : "png")}`,
    },
  };
}

async function main() {
  const ratioArg = getRatioArg(process.argv.slice(2));
  await mkdir(CONFIG.outputDir, { recursive: true });

  const files = (await readdir(CONFIG.inputDir))
    .filter((file) => SUPPORTED.has(path.extname(file).toLowerCase()))
    .map((file) => path.join(CONFIG.inputDir, file));

  const manifest = {};
  for (const file of files) {
    const { name, entry } = await processImage(file, ratioArg);
    manifest[name] = entry;
    console.log(`✓ ${name} -> ${entry.width}x${entry.height}`);
  }

  await writeFile(
    path.join(CONFIG.outputDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  console.log(
    `\nDone: ${files.length} image(s). Manifest written to ${CONFIG.outputDir}/manifest.json`,
  );
}

main();
