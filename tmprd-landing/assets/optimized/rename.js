import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directory = __dirname;

const extensions = [".avif", ".webp", ".jpg"];
const widths = [400, 800, 1080];

for (let number = 4; number <= 11; number++) {
  const newNumber = `r${number - 3}`;

  for (const width of widths) {
    for (const extension of extensions) {
      const oldName = `${number}-${width}${extension}`;
      const newName = `${newNumber}-${width}${extension}`;

      const oldPath = path.join(directory, oldName);
      const newPath = path.join(directory, newName);

      if (fs.existsSync(oldPath)) {
        if (fs.existsSync(newPath)) {
          console.warn(`Skipped (destination exists): ${newName}`);
          continue;
        }

        fs.renameSync(oldPath, newPath);
        console.log(`${oldName} → ${newName}`);
      }
    }
  }
}

console.log("Renaming complete!");
