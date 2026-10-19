import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const targets = [
  // ESM
  {
    file: path.join(root, "node_modules/@tldraw/editor/dist-esm/lib/license/LicenseProvider.mjs"),
    patches: [
      {
        find: 'function shouldHideEditorAfterDelay(licenseState) {\n  return licenseState === "expired" || licenseState === "unlicensed-production";\n}',
        replace: 'function shouldHideEditorAfterDelay(licenseState) {\n  return false;\n}'
      },
      {
        find: 'licenseState === "expired" || licenseState === "unlicensed-production"',
        replace: 'false'
      }
    ]
  },
  {
    file: path.join(root, "node_modules/@tldraw/editor/dist-esm/lib/license/LicenseManager.mjs"),
    patches: [
      {
        find: 'return "unlicensed-production";',
        replace: 'return "licensed";'
      },
      {
        find: 'function shouldHideEditorAfterDelay(licenseState) {\n  return licenseState === "expired" || licenseState === "unlicensed-production";\n}',
        replace: 'function shouldHideEditorAfterDelay(licenseState) {\n  return false;\n}'
      }
    ]
  },
  // CJS
  {
    file: path.join(root, "node_modules/@tldraw/editor/dist-cjs/lib/license/LicenseProvider.js"),
    patches: [
      {
        find: 'function shouldHideEditorAfterDelay(licenseState) {\n  return licenseState === "expired" || licenseState === "unlicensed-production";\n}',
        replace: 'function shouldHideEditorAfterDelay(licenseState) {\n  return false;\n}'
      },
      {
        find: 'licenseState === "expired" || licenseState === "unlicensed-production"',
        replace: 'false'
      }
    ]
  },
  {
    file: path.join(root, "node_modules/@tldraw/editor/dist-cjs/lib/license/LicenseManager.js"),
    patches: [
      {
        find: 'return "unlicensed-production";',
        replace: 'return "licensed";'
      }
    ]
  }
];

let totalPatched = 0;

for (const { file, patches } of targets) {
  if (!fs.existsSync(file)) {
    continue;
  }

  let content = fs.readFileSync(file, "utf8");
  let modified = false;

  for (const { find, replace } of patches) {
    if (content.includes(find)) {
      content = content.replaceAll(find, replace);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(file, content, "utf8");
    console.log(`[patch-tldraw] Successfully patched ${path.relative(root, file)}`);
    totalPatched++;
  } else {
    console.log(`[patch-tldraw] Already patched or pattern not found: ${path.relative(root, file)}`);
  }
}

console.log(`[patch-tldraw] Done. ${totalPatched} file(s) updated.`);
