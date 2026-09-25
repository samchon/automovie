// The authored @inventory lines are the model part-ID population. Consumers
// must use this population instead of inferring parts from prose addresses.
const fs = require("node:fs");
const path = require("node:path");

const files = ["001-seating-and-work", "002-storage-and-sleep", "003-service-fixtures", "004-decor-and-fixtures"];

/** @param {string} token */
function expand(token) {
  const range = /^(.+)-(\d+)\.\.(\d+)$/.exec(token);
  if (!range) return [token];
  const first = Number(range[2]), last = Number(range[3]);
  if (last < first || last - first > 999) throw Error(`invalid inventory range ${token}`);
  return Array.from({ length: last - first + 1 }, (_, i) => `${range[1]}-${first + i}`);
}

/** @param {string} root @param {Map<string,string>} [overrides] */
function inventory(root, overrides = new Map()) {
  const result = new Map();
  for (const name of files) {
    const source = overrides.get(name) ?? fs.readFileSync(path.join(root, "docs/models", `${name}.md`), "utf8");
    let anchor = "";
    for (const line of source.split(/\r?\n/)) {
      const heading = /^## .*\{#([^}]+)\}/.exec(line);
      if (heading) { anchor = heading[1]; result.set(anchor, new Map()); continue; }
      const declaration = /^@inventory\s+([^:]+):\s*(.+)$/.exec(line);
      if (!declaration || !anchor) continue;
      const states = result.get(anchor);
      const state = declaration[1].trim();
      if (states.has(state)) throw Error(`${anchor}/${state}: duplicate inventory`);
      const members = declaration[2].split(",").flatMap((token) => expand(token.trim()));
      if (new Set(members).size !== members.length) throw Error(`${anchor}/${state}: duplicate part`);
      states.set(state, new Set(members));
    }
  }
  return result;
}

module.exports = { inventory };
