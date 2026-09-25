// Draw source uses at random, replace each with its declared plan value, and
// require the generic duplication audit to reject every copied dimension.
const { spawnSync } = require("node:child_process");
const { randomInt } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const project = path.resolve(__dirname, "../..");
const house = path.join(project, "src/house");
const cache = path.join(project, "node_modules/.cache");
const scratch = fs.mkdtempSync(path.join(cache, "space-literal-fixture-"));
if (!scratch.startsWith(cache + path.sep))
  throw Error("Fixture scratch escaped cache");
/** @param {string} source */
const executable = (source) =>
  source.replace(
    /\/\*[\s\S]*?\*\/|\/\/[^\r\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g,
    (match) => match.replace(/[^\r\n]/g, " "),
  );
/** @param {string} dir @returns {string[]} */
const files = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory()
      ? files(full)
      : entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")
        ? [full]
        : [];
  });
const datum = fs
  .readFileSync(path.join(house, "plan.ts"), "utf8")
  .match(/export const datum\s*=\s*\{([\s\S]*?)\}\s*as const/)?.[1];
if (!datum) throw Error("Cannot read plan datum");
/** @type {Map<string, number>} */
const values = new Map();
for (const entry of datum.matchAll(
  /(\w+)\s*:\s*(\[[^\]]+\]|[-+]?\d+(?:\.\d+)?)/g,
)) {
  if (entry[2].startsWith("[")) {
    entry[2]
      .slice(1, -1)
      .split(",")
      .forEach((part, i) =>
        values.set(`${entry[1]}[${i}]`, Number(part.trim())),
      );
  } else values.set(entry[1], Number(entry[2]));
}
/** @type {{ file:string;start:number;end:number;value:number;key:string }[]} */
const candidates = [];
for (const file of [
  path.join(house, "topology.ts"),
  ...["storeys", "circulation", "envelope", "rooms"].flatMap((dir) =>
    files(path.join(house, dir)),
  ),
]) {
  const stripped = executable(fs.readFileSync(file, "utf8"));
  for (const match of stripped.matchAll(/datum\.(\w+)(?:\[(\d+)\])?/g)) {
    const key = match[1] + (match[2] === undefined ? "" : `[${match[2]}]`);
    const value = values.get(key);
    if (value !== undefined && Math.abs(value) >= 2.5)
      candidates.push({
        file,
        start: match.index,
        end: match.index + match[0].length,
        value,
        key,
      });
  }
}
const roomCandidates = candidates.filter((candidate) =>
  candidate.file.startsWith(path.join(house, "rooms") + path.sep),
);
let red = 0,
  sampled = 0;
try {
  const fixtureHouse = path.join(scratch, "house");
  fs.cpSync(house, fixtureHouse, { recursive: true });
  const pool = [...candidates];
  // Guarantee that the random sample exercises the room fit-out rule too.
  if (roomCandidates.length) {
    const selected = roomCandidates[randomInt(roomCandidates.length)];
    pool.splice(pool.indexOf(selected), 1);
    pool.unshift(selected);
  }
  while (pool.length && sampled < 12) {
    const [candidate] = pool.splice(sampled === 0 ? 0 : randomInt(pool.length), 1);
    const target = path.join(
      fixtureHouse,
      path.relative(house, candidate.file),
    );
    const before = fs.readFileSync(target, "utf8");
    const after =
      before.slice(0, candidate.start) +
      String(candidate.value) +
      before.slice(candidate.end);
    fs.writeFileSync(target, after);
    const run = spawnSync(
      process.execPath,
      [
        path.join(__dirname, "space-literal-audit.cjs"),
        "--house",
        fixtureHouse,
      ],
      { encoding: "utf8" },
    );
    sampled++;
    if (run.status === 1 && run.stderr.includes("RETYPED")) red++;
    else
      console.error(
        `UNDETECTED ${path.relative(house, candidate.file)} ${candidate.key}: ${run.error?.message || run.stderr || run.stdout}`,
      );
    fs.writeFileSync(target, before);
  }
  console.log(
    `space-literal-fixture: ${candidates.length} eligible source uses (${roomCandidates.length} room uses), ${sampled} random substitutions, ${red} red, ${sampled - red} failures`,
  );
  if (!sampled || red !== sampled) process.exitCode = 1;
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}
