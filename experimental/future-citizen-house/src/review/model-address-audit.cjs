// Compare prose stable-address roots with the independent parts declared by
// @inventory in every model H2. The table remains the part population; a
// prose address cannot silently invent a second independent part.
const fs = require("node:fs");
const path = require("node:path");
const { inventory } = require("./model-inventory.cjs");

const root = path.resolve(__dirname, "../..");
const names = ["001-seating-and-work", "002-storage-and-sleep", "003-service-fixtures", "004-decor-and-fixtures"];
const populations = inventory(root);
const errors = [];
let addresses = 0;
let owners = 0;
const addressedOwners = new Set();

/** @param {string} token */
function variants(token) {
  const range = /^(.+)-(\d+)\.\.(\d+)$/.exec(token);
  if (range) return Array.from({ length: Number(range[3]) - Number(range[2]) + 1 },
    (_, i) => `${range[1]}-${Number(range[2]) + i}`);
  const sides = /^(.+)-(left|head|upper|negative)\/(right|foot|lower|positive)$/.exec(token);
  if (sides) return [`${sides[1]}-${sides[2]}`, `${sides[1]}-${sides[3]}`];
  return [token];
}

for (const name of names) {
  const source = fs.readFileSync(path.join(root, "docs/models", `${name}.md`), "utf8");
  let anchor = "";
  for (const line of source.split(/\r?\n/)) {
    const heading = /^## .*\{#([^}]+)\}/.exec(line);
    if (heading) { anchor = heading[1]; continue; }
    if (!anchor || /^\||^@|^<!--/.test(line) || !/(주소|안정 part|실제 면을 분리|전 표면을 덮)/.test(line)) continue;
    const members = new Set([...((populations.get(anchor) || new Map()).values())].flatMap((set) => [...set]));
    if (!members.size) continue;
    owners++;
    addressedOwners.add(anchor);
    for (const match of line.matchAll(/`([a-z][a-z0-9.\-/]+)`/g)) {
      const token = match[1];
      if (!token.includes("/") || token.startsWith(`${anchor}/`) || token.startsWith("cabinet/")) continue;
      const prefix = token.split("/")[0];
      // Some owners put a face vocabulary after a separate explicit part
      // inventory sentence; those face-only lists have no local part root.
      if (new Set(["upper", "shaft", "front"]).has(prefix)) continue;
      // This line also cites complete prototype IDs; only local part/face
      // expressions are checked here. The routed child check handles those IDs.
      if (/^(fixed-bed|murphy-bed|work-desk|living-sofa|portable-lamp|potted-plant|laundry-washer|laundry-dryer|book|folded-towel|bedroom-rug|round-rug)$/.test(prefix)) continue;
      for (const part of variants(prefix)) {
        addresses++;
        const symbolic = part.replace(/0\.\.(?:n-1|2n-1)/g, "[0-9]+")
          .replace(/-j(?=-|$)/g, "-[0-9]+")
          .replace(/-i(?=-|$)/g, "-[0-9]+");
        const hasSymbolic = symbolic !== part && [...members].some((member) =>
          new RegExp(`^${symbolic}$`).test(member));
        if (!members.has(part) && !hasSymbolic)
          errors.push(`${anchor}: prose address ${token} has no independent @inventory part ${part}`);
      }
    }
  }
}
for (const anchor of populations.keys()) if (!addressedOwners.has(anchor))
  errors.push(`${anchor}: no prose address line was compared with its inventory`);
console.log(JSON.stringify({ prototypes: populations.size, addressedPrototypes: addressedOwners.size, addressLines: owners, addresses, errors }, null, 2));
if (errors.length) process.exitCode = 1;
