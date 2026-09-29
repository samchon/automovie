// Find executable copies of the plan datum's dimensions throughout structural
// consumers. The population and datum values are discovered from the source.
const fs = require("node:fs");
const path = require("node:path");
const house =
  process.argv[2] === "--house" && process.argv[3]
    ? path.resolve(process.argv[3])
    : path.resolve(__dirname, "../house");
const planFile = path.join(house, "plan.ts");

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

// Blank comments and quoted text, retaining line breaks so reports point at
// the executable token. This lexical scan counts numeric expressions,
// including object fields and arithmetic operands.
/** @param {string} source */
const executable = (source) =>
  source.replace(
    /\/\*[\s\S]*?\*\/|\/\/[^\r\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g,
    (match) => match.replace(/[^\r\n]/g, " "),
  );
const numberSyntax =
  /(?<![\w$])[-+]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][-+]?\d+)?(?!\w)/g;
/** @param {string} source */
const numericTokens = (source) => {
  const code = executable(source);
  return [...code.matchAll(numberSyntax)].filter((match) => {
    const start = match.index, end = start + match[0].length;
    // A single dot adjacent to another digit extends a numeric token. Two
    // dots delimit range notation, so both endpoints remain visible.
    return !(code[start - 1] === "." && /\d/.test(code[start - 2] || "")) &&
      !(code[end] === "." && /\d/.test(code[end + 1] || ""));
  });
};
const plan = fs.readFileSync(planFile, "utf8");
const datumDeclaration = plan.match(
  /export const datum\s*=\s*\{([\s\S]*?)\}\s*as const/,
);
if (!datumDeclaration) throw Error("Cannot locate the declared plan datum");
const datumValues = new Set(
  numericTokens(datumDeclaration[1])
    .map((match) => Math.abs(Number(match[0])))
    .filter((value) => value >= 2.5),
);
const upperFloor = Number(
  datumDeclaration[1].match(/floors:\s*\[\s*[^,]+,\s*(-?\d+(?:\.\d+)?)/)?.[1],
);
if (!Number.isFinite(upperFloor))
  throw Error("Cannot locate the upper floor datum");

const consumers = [
  path.join(house, "topology.ts"),
  ...["storeys", "circulation", "envelope"].flatMap((dir) =>
    files(path.join(house, dir)),
  ),
];
let tokens = 0,
  arithmeticDivisors = 0;
/** @type {string[]} */
const copied = [];
for (const file of consumers) {
  const source = fs.readFileSync(file, "utf8");
  for (const match of numericTokens(source)) {
    tokens++;
    if (datumValues.has(Math.abs(Number(match[0])))) {
      // A division count is not an architectural dimension (for example,
      // equally spaced fastening slots). Report this excluded population.
      if (source.slice(0, match.index).trimEnd().endsWith("/")) {
        arithmeticDivisors++;
        continue;
      }
      const line = source.slice(0, match.index).split("\n").length;
      copied.push(`${path.relative(house, file)}:${line} ${match[0]}`);
    }
  }
}
// Room fit-outs use absolute world Y coordinates. Audit every room source,
// including a future room that forgets to import the datum altogether.
const roomConsumers = files(path.join(house, "rooms"));
let roomTokens = 0;
for (const file of roomConsumers) {
  const source = fs.readFileSync(file, "utf8");
  for (const match of numericTokens(source)) {
    roomTokens++;
    if (Number(match[0]) === upperFloor) {
      const line = source.slice(0, match.index).split("\n").length;
      copied.push(`${path.relative(house, file)}:${line} ${match[0]}`);
    }
  }
}
console.log(
  `space-literal-audit: ${datumValues.size} datum scalar values, ${consumers.length} structural consumer files, ${tokens} structural numeric tokens, ${roomConsumers.length} room consumer files, ${roomTokens} room numeric tokens, ${arithmeticDivisors} arithmetic divisors, ${copied.length} repeated datum tokens`,
);
for (const item of copied) console.error("RETYPED " + item);
if (!datumValues.size || !consumers.length || !tokens || !roomConsumers.length || !roomTokens)
  console.error("NOTHING WAS CHECKED");
if (copied.length || !datumValues.size || !consumers.length || !tokens || !roomConsumers.length || !roomTokens)
  process.exitCode = 1;
