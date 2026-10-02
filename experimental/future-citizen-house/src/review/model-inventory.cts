// The authored @inventory lines are the model part-ID population. Consumers
// must use this population instead of inferring parts from prose addresses.
import fs from "node:fs";
import path from "node:path";

const files = fs.readdirSync(path.resolve(__dirname, "../../docs/models"))
  .filter((name) => /^(?!000)\d{3}-.+\.md$/.test(name)).sort((a, b) => a.localeCompare(b))
  .map((name) => name.slice(0, -3));

function expand(token: string) {
  const range = /^(.+)-(\d+)\.\.(\d+)$/.exec(token);
  if (!range) return [token];
  const first = Number(range[2]), last = Number(range[3]);
  if (last < first || last - first > 999) throw Error(`invalid inventory range ${token}`);
  return Array.from({ length: last - first + 1 }, (_, i) => `${range[1]}-${first + i}`);
}

function inventory(root: string, overrides: Map<string,string> = new Map()) {
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

export { inventory };