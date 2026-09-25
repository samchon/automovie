// Scan every numeric local-axis coordinate in model H2 prose. A measured
// coordinate needs a witness in the same H2's structured design rows. This is
// a necessary condition, not yet a proof that the witness is the right part.
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const names = ["001-seating-and-work", "002-storage-and-sleep", "003-service-fixtures", "004-decor-and-fixtures"];
const coordinate = /(?<![A-Za-z])([xyzXYZ])\s*=\s*([±+−-]?\d+\.\d+(?:\.\.[+−-]?\d+\.\d+)?)/g;
const decimals = /\d+\.\d+/g;
const proseDecimal = /(?<![\w.\-/])(\d+\.\d+)(?![\w.]*[x/])/g;

/** @param {Set<number>} values @param {number} value */
function add(values, value) {
  for (const candidate of [value, -value]) values.add(Math.round(candidate * 100000));
}

/** @param {Set<number>} values @param {string} text */
function interval(values, text) {
  const found = /^([−-]?[\d.]+)\.\.([+−-]?[\d.]+)$/.exec(text.trim());
  if (!found) return;
  const a = Number(found[1].replace("−", "-"));
  const b = Number(found[2].replace("−", "-"));
  if (!Number.isFinite(a) || !Number.isFinite(b)) return;
  for (const value of [a, b, (a + b) / 2, (b - a) / 2, b - a]) add(values, value);
}

/** @param {string[]} lines */
function witnesses(lines) {
  /** @type {Record<"x"|"y"|"z", Set<number>>} */
  const result = { x: new Set(), y: new Set(), z: new Set() };
  for (const line of lines) {
    if (line.startsWith("| @")) {
      const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
      if (cells.length === 8) for (const [i, axis] of /** @type {const} */ (["x", "y", "z"]).entries())
        interval(result[axis], cells[i + 4]);
    }
    const piece = /^@(piece|void)\s+[^:]+:\s*[^,]+,\s*([^,]+),\s*([^,]+),\s*([^,]+)$/.exec(line);
    if (piece) {
      interval(result.x, piece[2]); interval(result.y, piece[3]); interval(result.z, piece[4]);
    }
    const flat = /^@flat-contact\s+[^:]+:\s*[^,]+,\s*[^,]+,\s*(-Y|-Z),\s*([−-]?[\d.]+),\s*([^,]+),\s*([^,]+)$/.exec(line);
    if (flat) {
      add(result[flat[1] === "-Y" ? "y" : "z"], Number(flat[2].replace("−", "-")));
      interval(result.x, flat[3]); interval(result[flat[1] === "-Y" ? "z" : "y"], flat[4]);
    }
    const boreZ = /^@bore-z\s+[^:]+:\s*[^,]+,\s*([−-]?[\d.]+),\s*([−-]?[\d.]+),\s*[\d.]+,\s*(.+)$/.exec(line);
    if (boreZ) {
      add(result.x, Number(boreZ[1].replace("−", "-")));
      add(result.y, Number(boreZ[2].replace("−", "-")));
      interval(result.z, boreZ[3]);
    }
    const radial = /^@radial-at\s+[^:]+:\s*[^,]+,\s*([−-]?[\d.]+),\s*([−-]?[\d.]+),/.exec(line);
    if (radial) { add(result.x, Number(radial[1].replace("−", "-")));
      add(result.z, Number(radial[2].replace("−", "-"))); }
    const radialZ = /^@radial-z\s+[^:]+:\s*[^,]+,\s*([−-]?[\d.]+),\s*([−-]?[\d.]+),/.exec(line);
    if (radialZ) { add(result.x, Number(radialZ[1].replace("−", "-")));
      add(result.y, Number(radialZ[2].replace("−", "-"))); }
    const ellipse = /^@ellipse\s+[^:]+:\s*[^,]+,\s*[\d.]+,\s*[\d.]+,\s*[\d.]+,\s*[\d.]+,\s*([−-]?[\d.]+),\s*([−-]?[\d.]+)$/.exec(line);
    if (ellipse) { add(result.x, Number(ellipse[1].replace("−", "-")));
      add(result.z, Number(ellipse[2].replace("−", "-"))); }
    const shear = /^@shear-z\s+[^:]+:\s*[^,]+,\s*([^,]+),\s*([^,]+),\s*([\d.]+)$/.exec(line);
    if (shear) {
      interval(result.y, shear[1]); interval(result.z, shear[2]); add(result.z, Number(shear[3]));
    }
    const linear = /^@curve-linear\s+[^:]+:\s*[^,]+,\s*[^,]+,\s*([\d.]+),\s*([\d.]+),\s*([−-]?[\d.]+),\s*([−-]?[\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)$/.exec(line);
    if (linear) {
      for (const text of linear.slice(1, 3)) add(result.y, Number(text));
      for (const text of linear.slice(3)) add(result.z, Number(text.replace("−", "-")));
    }
    const layered = /^@curve-layer\s+[^:]+:\s*[^,]+,\s*[^,]+,\s*([−-]?[\d.]+),\s*([−-]?[\d.]+),\s*([−-]?[\d.]+),\s*([\d.]+),\s*([\d.]+)$/.exec(line);
    if (layered) for (const text of layered.slice(1)) add(result.z, Number(text.replace("−", "-")));
    const offset = /^@(support|compose)\s+[^:]+:\s*[^,]+,\s*[^,]+,\s*(?:[^,]+,\s*)?([−-]?[\d.]+),\s*([−-]?[\d.]+),\s*([−-]?[\d.]+)$/.exec(line);
    if (offset) for (const [i, axis] of /** @type {const} */ (["x", "y", "z"]).entries())
      add(result[axis], Number(offset[i + 2].replace("−", "-")));
  }
  return result;
}

/** @param {Map<string,string>} [overrides] */
function audit(overrides = new Map()) {
  /** @type {string[]} */ const errors = [];
  let h2 = 0, claims = 0, values = 0, witnessed = 0, proseDecimals = 0;
  for (const name of names) {
    const source = overrides.get(name) ?? fs.readFileSync(path.join(root, "docs/models", `${name}.md`), "utf8");
    let anchor = "";
    /** @type {string[]} */ let lines = [];
    /** @param {string} owner @param {string[]} body */
    const check = (owner, body) => {
      if (!owner) return;
      h2++;
      const sourceValues = witnesses(body);
      for (const [index, line] of body.entries()) {
        if (!line.trim() || /^\||^@|^<!--/.test(line)) continue;
        proseDecimals += [...line.matchAll(proseDecimal)].length;
        for (const match of line.matchAll(coordinate)) {
          claims++;
          const axis = /** @type {"x"|"y"|"z"} */ (match[1].toLowerCase());
          for (const token of match[2].match(decimals) || []) {
            values++;
            const number = Math.round(Number(token) * 100000);
            if (sourceValues[axis].has(number) || sourceValues[axis].has(-number)) witnessed++;
            else errors.push(`${owner}: prose line ${index + 1} ${axis}=${token} has no measured-axis witness`);
          }
        }
      }
    };
    for (const line of source.split(/\r?\n/)) {
      const heading = /^## .*\{#([^}]+)\}/.exec(line);
      if (heading) { check(anchor, lines); anchor = heading[1]; lines = []; }
      else if (anchor) lines.push(line);
    }
    check(anchor, lines);
  }
  const nonAxisDecimals = proseDecimals - values;
  if (nonAxisDecimals > 0) errors.push(`${nonAxisDecimals} prose decimals are outside the local-axis coordinate grammar`);
  return { h2, proseDecimals, coordinateClaims: claims, coordinateValues: values,
    witnessedCoordinateValues: witnessed, unwitnessedCoordinateValues: values - witnessed,
    nonAxisDecimals, errors };
}

// Every prototype, rather than a hand-picked sentence, supplies one measured
// coordinate for a document-only mutation. This fixture does not claim that
// non-axis dimensions or part identity have been reconciled.
function fixture() {
  /** @type {Map<string,string>} */ const overrides = new Map();
  /** @type {string[]} */ const mutated = [];
  /** @type {string[]} */ const noAxisClaim = [];
  for (const name of names) {
    const original = fs.readFileSync(path.join(root, "docs/models", `${name}.md`), "utf8");
    const lines = original.split(/\r?\n/);
    let anchor = "", start = 0;
    /** @param {number} end */
    const mutate = (end) => {
      if (!anchor) return;
      const known = witnesses(lines.slice(start, end));
      const options = [];
      for (let i = start; i < end; i++) {
        const line = lines[i];
        if (!line.trim() || /^\||^@|^<!--/.test(line)) continue;
        for (const match of line.matchAll(coordinate)) {
          const axis = /** @type {"x"|"y"|"z"} */ (match[1].toLowerCase());
          const value = Number((match[2].match(decimals) || [])[0]);
          if (known[axis].has(Math.round(value * 100000)))
            options.push({ i, at: match.index + match[0].indexOf(match[2]), token: match[2], value, axis });
        }
      }
      if (!options.length) { noAxisClaim.push(anchor); return; }
      const hash = [...anchor].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 20260925);
      const selected = options[hash % options.length];
      const changed = (selected.value + 0.0137).toFixed(4);
      const line = lines[selected.i];
      const first = selected.token.search(decimals);
      const at = selected.at + first;
      lines[selected.i] = `${line.slice(0, at)}${changed}${line.slice(at + (selected.token.match(decimals) || [""])[0].length)}`;
      mutated.push(`${anchor}: prose line ${selected.i - start + 1} ${selected.axis}=${changed}`);
    };
    for (let i = 0; i < lines.length; i++) {
      const heading = /^## .*\{#([^}]+)\}/.exec(lines[i]);
      if (heading) { mutate(i); anchor = heading[1]; start = i + 1; }
    }
    mutate(lines.length);
    overrides.set(name, lines.join(original.includes("\r\n") ? "\r\n" : "\n"));
  }
  const observed = audit(overrides);
  const missed = mutated.filter((needle) => !observed.errors.some((error) => error.includes(needle)));
  if (missed.length) throw Error(`coordinate mutation escaped: ${missed.join(", ")}`);
  return { prototypes: mutated.length + noAxisClaim.length,
    mutated: mutated.length, red: mutated.length, noAxisClaim };
}

if (require.main === module) {
  if (process.argv.includes("--fixture")) console.log(JSON.stringify(fixture(), null, 2));
  else {
    const result = audit();
    console.log(JSON.stringify(result, null, 2));
    if (result.errors.length) process.exitCode = 1;
  }
}
module.exports = { audit, fixture };
