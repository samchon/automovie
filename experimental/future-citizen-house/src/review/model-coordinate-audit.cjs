// Scan local-axis coordinates and other model H2 prose numbers. Each needs a
// structural witness. Explicitly named axis claims also bind to their part,
// state and feature; remaining H2-wide witnesses are reported as unbound and
// do not certify the prose/structure relationship.
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const names = fs.readdirSync(path.join(root, "docs/models"))
  .filter((name) => /^(?!000)\d{3}-.+\.md$/.test(name)).sort((a, b) => a.localeCompare(b))
  .map((name) => name.slice(0, -3));
const coordinate = /(?<![A-Za-z])([xyzXYZ])\s*=\s*([±+−-]?\d+\.\d+(?:\.\.[+−-]?\d+\.\d+)?)(?!\d*[WH])/g;
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
  /** @type {Record<"x"|"y"|"z"|"scalar", Set<number>>} */
  const result = {
    x: new Set(),
    y: new Set(),
    z: new Set(),
    scalar: new Set(),
  };
  const measured = new Map();
  for (const line of lines) if (line.startsWith("| @")) {
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells.length === 8 && (cells[0] === "@part" || cells[0] === "@envelope"))
      measured.set(`${cells[1]}/${cells[2]}`, {
        x: cells[4],
        y: cells[5],
        z: cells[6],
      });
  }
  for (const line of lines) {
    if (/^(?:@(?!evidence|address-state|inventory)|\| @)/.test(line)) {
      // Structured part and feature rows provide direct inputs or checked
      // results; scalar-control rows index prose without becoming a second
      // source of the design value.
      // A prose dimension may name a row value or a centre, half-span or full
      // span derived from one measured interval in that same H2.
      for (const match of line.matchAll(/(?<![\w.])[+−-]?\d+\.\d+/g))
        add(result.scalar, Number(match[0].replace("−", "-")));
      for (const match of line.matchAll(
        /([+−-]?\d+(?:\.\d+)?)\.\.([+−-]?\d+(?:\.\d+)?)/g,
      )) {
        const a = Number(match[1].replace("−", "-"));
        const b = Number(match[2].replace("−", "-"));
        for (const value of [(a + b) / 2, (b - a) / 2, b - a])
          add(result.scalar, value);
      }
    }
    const control = /^@axis-control\s+([^:]+):\s*([^,]+),\s*([XYZ]),\s*([+−-]?[\d.]+),\s*(.+)$/.exec(
      line,
    );
    if (control) {
      const row = measured.get(`${control[1].trim()}/${control[2].trim()}`);
      const axis = /** @type {"x"|"y"|"z"} */ (control[3].toLowerCase());
      const value = Number(control[4].replace("−", "-"));
      const limits = row?.[axis]?.replaceAll("−", "-").split("..").map(Number);
      if (!limits || !Number.isFinite(value) || value < limits[0] - 0.000001 ||
        value > limits[1] + 0.000001) throw Error(
          `axis control outside measured part: ${line}`,
        );
      add(result[axis], value);
    }
    if (line.startsWith("| @")) {
      const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
      if (cells.length === 8) for (const [i, axis] of /** @type {const} */ (["x", "y", "z"]).entries())
        interval(result[axis], cells[i + 4]);
    }
    const piece = /^@(piece|void)\s+[^:]+:\s*[^,]+,\s*([^,]+),\s*([^,]+),\s*([^,]+)$/.exec(
      line,
    );
    if (piece) {
      interval(result.x, piece[2]);
      interval(result.y, piece[3]);
      interval(result.z, piece[4]);
    }
    const flat = /^@flat-contact\s+[^:]+:\s*[^,]+,\s*[^,]+,\s*(-Y|-Z),\s*([−-]?[\d.]+),\s*([^,]+),\s*([^,]+)$/.exec(
      line,
    );
    if (flat) {
      add(
        result[flat[1] === "-Y" ? "y" : "z"],
        Number(flat[2].replace("−", "-")),
      );
      interval(result.x, flat[3]);
      interval(result[flat[1] === "-Y" ? "z" : "y"], flat[4]);
    }
    const boreZ = /^@bore-z\s+[^:]+:\s*[^,]+,\s*([−-]?[\d.]+),\s*([−-]?[\d.]+),\s*[\d.]+,\s*(.+)$/.exec(
      line,
    );
    if (boreZ) {
      add(result.x, Number(boreZ[1].replace("−", "-")));
      add(result.y, Number(boreZ[2].replace("−", "-")));
      interval(result.z, boreZ[3]);
    }
    const radial = /^@radial-at\s+[^:]+:\s*[^,]+,\s*([−-]?[\d.]+),\s*([−-]?[\d.]+),/.exec(
      line,
    );
    if (radial) {
      add(result.x, Number(radial[1].replace("−", "-")));
      add(result.z, Number(radial[2].replace("−", "-")));
    }
    const radialZ = /^@radial-z\s+[^:]+:\s*[^,]+,\s*([−-]?[\d.]+),\s*([−-]?[\d.]+),/.exec(
      line,
    );
    if (radialZ) {
      add(result.x, Number(radialZ[1].replace("−", "-")));
      add(result.y, Number(radialZ[2].replace("−", "-")));
    }
    const ellipse = /^@ellipse\s+[^:]+:\s*[^,]+,\s*[\d.]+,\s*[\d.]+,\s*[\d.]+,\s*[\d.]+,\s*([−-]?[\d.]+),\s*([−-]?[\d.]+)$/.exec(
      line,
    );
    if (ellipse) {
      add(result.x, Number(ellipse[1].replace("−", "-")));
      add(result.z, Number(ellipse[2].replace("−", "-")));
    }
    const shear = /^@shear-z\s+[^:]+:\s*[^,]+,\s*([^,]+),\s*([^,]+),\s*([\d.]+)$/.exec(
      line,
    );
    if (shear) {
      interval(result.y, shear[1]);
      interval(result.z, shear[2]);
      add(result.z, Number(shear[3]));
      const centers = shear[2].replaceAll("−", "-").split("..").map(Number);
      const halfDepth = Number(shear[3]);
      for (const center of centers) for (const side of [-1, 1])
        add(result.z, center + side * halfDepth);
    }
    const linear = /^@curve-linear\s+[^:]+:\s*[^,]+,\s*[^,]+,\s*([\d.]+),\s*([\d.]+),\s*([−-]?[\d.]+),\s*([−-]?[\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)$/.exec(
      line,
    );
    if (linear) {
      for (const text of linear.slice(1, 3)) add(result.y, Number(text));
      for (const text of linear.slice(3)) add(result.z, Number(text.replace("−", "-")));
    }
    const layered = /^@curve-layer\s+[^:]+:\s*[^,]+,\s*[^,]+,\s*([−-]?[\d.]+),\s*([−-]?[\d.]+),\s*([−-]?[\d.]+),\s*([\d.]+),\s*([\d.]+)$/.exec(
      line,
    );
    if (layered) for (const text of layered.slice(1)) add(result.z, Number(text.replace("−", "-")));
    const offset = /^@(support|compose)\s+[^:]+:\s*[^,]+,\s*[^,]+,\s*(?:[^,]+,\s*)?([−-]?[\d.]+),\s*([−-]?[\d.]+),\s*([−-]?[\d.]+)$/.exec(
      line,
    );
    if (offset) for (const [i, axis] of /** @type {const} */ (["x", "y", "z"]).entries())
      add(result[axis], Number(offset[i + 2].replace("−", "-")));
  }
  return result;
}

/**
 * Bind an explicit prose axis to the nearest named part in its sentence.
 * The measured host is selected by state, part and axis before a number is
 * compared. A matching number on another row cannot witness the claim.
 * @param {string[]} lines
 * @param {string} owner
 */
function boundCoordinates(lines, owner) {
  /** @type {Array<{state:string;part:string;kind:string;x:number[];y:number[];z:number[]}>} */
  const rows = [];
  for (const line of lines) {
    const cells = line.startsWith("| @") ? line.split("|").slice(1, -1).map((cell) => cell.trim()) : [];
    if (cells.length === 8 && cells[0] === "@part") {
      const axes = cells.slice(4, 7).map((cell) => cell.replaceAll("−", "-").split("..").map(Number));
      rows.push({ state: cells[1], part: cells[2], kind: cells[3], x: axes[0], y: axes[1], z: axes[2] });
    }
    const feature = /^@(void|piece)\s+([^:]+):\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+)$/.exec(line);
    if (feature) {
      const axes = feature.slice(4).map((cell) => cell.replaceAll("−", "-").split("..").map(Number));
      rows.push({ state: feature[2].trim(), part: feature[3].trim(), kind: feature[1], x: axes[0], y: axes[1], z: axes[2] });
    }
  }
  /** @type {string[]} */ const errors = [];
  let bound = 0, unbound = 0;
  const parts = [...new Set(rows.map((row) => row.part))];
  /** @type {Map<string,Set<number>>} */
  const wildcardMinima = new Map();
  for (const [index, line] of lines.entries()) {
    if (!line.trim() || /^\||^@|^<!--/.test(line)) continue;
    for (const clear of line.matchAll(/(\d+\.\d+)m\s+clear/g)) {
      const local = line.slice(Math.max(0, clear.index - 95), clear.index);
      if (!/(?:서랍|drawer)/.test(local) || !/(?:측판|side|divider)/.test(local)) continue;
      const nearby = line.slice(Math.max(0, clear.index - 250), clear.index);
      const selected = [...nearby.matchAll(/`([^`]+)`/g)].map((token) => token[1])
        .filter((name) => rows.some((row) => row.state.startsWith(`${name}/`) && row.part.startsWith("drawer-")));
      const states = [...new Set(rows.filter((row) => row.kind === "piece" && row.part.startsWith("drawer-") &&
        (!selected.length || selected.some((name) => row.state.startsWith(`${name}/`))))
        .map((row) => row.state))];
      const measured = [];
      for (const state of states) {
        const dividers = rows.filter((row) => row.state === state && row.kind !== "piece" &&
          /^(?:side-(?:left|right)|bay-divider-(?:left|right))$/.test(row.part));
        for (const part of new Set(rows.filter((row) => row.state === state && row.kind === "piece" &&
          row.part.startsWith("drawer-")).map((row) => row.part))) {
          const body = rows.filter((row) => row.state === state && row.part === part && row.kind === "piece" &&
            row.z[0] < 0);
          if (!body.length) continue;
          const left = Math.min(...body.map((row) => row.x[0]));
          const right = Math.max(...body.map((row) => row.x[1]));
          const before = dividers.filter((row) => row.x[1] <= left + 0.000001)
            .sort((a, b) => b.x[1] - a.x[1])[0];
          const after = dividers.filter((row) => row.x[0] >= right - 0.000001)
            .sort((a, b) => a.x[0] - b.x[0])[0];
          if (before && after) measured.push(left - before.x[1], after.x[0] - right);
        }
      }
      const asserted = Number(clear[1]);
      if (measured.length && measured.some((gap) => Math.abs(gap - asserted) > 0.000001))
        errors.push(`${owner}: prose line ${index + 1} drawer side clear ${asserted} contradicts measured gaps ${measured.join(",")}`);
    }
    for (const claim of line.matchAll(/([xyzXYZ])\s*=\s*([+−-]?\d+\.\d+)(?:\.\.([+−-]?\d+\.\d+))?/g)) {
      const axis = /** @type {"x"|"y"|"z"} */ (claim[1].toLowerCase());
      const start = line.lastIndexOf(". ", claim.index) + 2;
      const clause = line.slice(start, claim.index);
      const names = [...clause.matchAll(/`([^`]+)`/g)]
        .filter((token) => parts.includes(token[1]) || (token[1].endsWith("-j") &&
          parts.some((part) => part.startsWith(token[1].slice(0, -1)))));
      const after = line.slice(claim.index + claim[0].length);
      const following = /^(?:m|의|에는|에|인|\s|,)*\s*`([^`]+)`/.exec(after);
      const named = following && parts.includes(following[1])
        ? { 1: following[1], index: claim.index - start } : names.at(-1);
      if (!named || claim.index - start - named.index > 80) { unbound++; continue; }
      const prefix = named[1].endsWith("-j") ? named[1].slice(0, -1) : null;
      const stateNames = [...clause.matchAll(/`([^`]+)`/g)].map((token) => token[1]);
      const state = stateNames.reverse().find((name) => rows.some((row) =>
        row.state === name || row.state.startsWith(`${name}/`)));
      const nextMeasure = line.slice(claim.index + claim[0].length).search(/[,;]|[xyzXYZ]\s*=/);
      const tail = line.slice(claim.index + claim[0].length,
        nextMeasure < 0 ? claim.index + claim[0].length + 60 : claim.index + claim[0].length + nextMeasure);
      const opening = (/(?:열린|개구|절삭|빈 )/.test(clause.slice(named.index)) && !/와\s*$/.test(clause)) ||
        /(?:열린\s+bay|개구)/.test(tail);
      const surfaceRegion = /(?:표면 영역|face|고정띠)/.test(line.slice(claim.index, claim.index + 100));
      const eligible = rows.filter((row) => (prefix ? row.part.startsWith(prefix) : row.part === named[1]) &&
        (!state || row.state === state || row.state.startsWith(`${state}/`)) &&
        (!opening || row.kind === "void"));
      if (!eligible.length) { unbound++; continue; }
      bound++;
      const specified = [claim[2], claim[3]].filter(Boolean).map((token) => Number(token.replace("−", "-")));
      if (prefix && (claim[3] || line.slice(claim.index + claim[0].length).startsWith(".."))) {
        const key = `${named[1]}/${axis}`;
        const seen = wildcardMinima.get(key) || new Set();
        seen.add(specified[0]);
        wildcardMinima.set(key, seen);
      }
      const valid = eligible.some((row) => {
        const [lo, hi] = row[axis];
        if (specified.length === 2) return (Math.abs(specified[0] - lo) < 0.000001 &&
          Math.abs(specified[1] - hi) < 0.000001) ||
          ((row.kind === "curved" || surfaceRegion) &&
            specified[0] >= lo - 0.000001 && specified[1] <= hi + 0.000001);
        const value = specified[0];
        if (claim[0].includes("..")) return Math.abs(value - lo) < 0.000001;
        return [lo, hi, (lo + hi) / 2, (hi - lo) / 2, hi - lo]
          .some((candidate) => Math.abs(value - candidate) < 0.000001);
      });
      if (!valid) errors.push(`${owner}: prose line ${index + 1} ${named[1]} ${axis}=${specified.join("..")} contradicts its measured part`);
    }
  }
  for (const [key, seen] of wildcardMinima) {
    const slash = key.lastIndexOf("/");
    const partPrefix = key.slice(0, slash).slice(0, -1);
    const axis = /** @type {"x"|"y"|"z"} */ (key.slice(slash + 1));
    const expected = new Set(rows.filter((row) => row.kind !== "void" && row.kind !== "piece" &&
      row.part.startsWith(partPrefix)).map((row) => row[axis][0]));
    for (const value of expected) if (!seen.has(value))
      errors.push(`${owner}: ${key} variant minimum ${value} has no part-bound prose claim`);
  }
  return { errors, bound, unbound };
}

/** @param {Map<string,string>} [overrides] */
function audit(overrides = new Map()) {
  /** @type {string[]} */
  const errors = [];
  /** @type {Array<{ owner:string; proseDecimals:number; axisValues:number; unwitnessed:number; outsideGrammar:number; scalarValues:number; unwitnessedScalars:number }>} */
  const coverage = [];
  let h2 = 0, claims = 0, values = 0, witnessed = 0, proseDecimals = 0,
    scalarValues = 0, scalarWitnessed = 0, scalarControls = 0,
    partBoundClaims = 0, unboundPartClaims = 0;
  for (const name of names) {
    const source = overrides.get(name) ?? fs.readFileSync(path.join(root, "docs/models", `${name}.md`), "utf8");
    let anchor = "";
    /** @type {string[]} */
    let lines = [];
    /** @param {string} owner @param {string[]} body */
    const check = (owner, body) => {
      if (!owner) return;
      h2++;
      const sourceValues = witnesses(body);
      const binding = boundCoordinates(body, owner);
      errors.push(...binding.errors);
      partBoundClaims += binding.bound;
      unboundPartClaims += binding.unbound;
      const declaredControls = new Set();
      const proseNumbers = new Set(body.filter((line) =>
        line.trim() && !/^\||^@|^<!--/.test(line)).flatMap((line) =>
          [...line.matchAll(proseDecimal)].map((match) =>
            Math.round(Number(match[1]) * 100000))));
      for (const line of body.filter((row) => row.startsWith("@scalar-control"))) {
        const control = /^@scalar-control ([a-z][a-z0-9-]*): ([+-]?\d+\.\d+)$/.exec(line);
        if (!control) { errors.push(`${owner}: malformed scalar control ${line}`); continue; }
        scalarControls++;
        if (declaredControls.has(control[1]))
          errors.push(`${owner}: duplicate scalar control ${control[1]}`);
        declaredControls.add(control[1]);
        if (!proseNumbers.has(Math.round(Number(control[2]) * 100000)))
          errors.push(`${owner}: scalar control ${control[1]} is unused in prose`);
      }
      const before = {
        proseDecimals,
        values,
        witnessed,
        scalarValues,
        scalarWitnessed,
      };
      for (const [index, line] of body.entries()) {
        if (!line.trim() || /^\||^@|^<!--/.test(line)) continue;
        // Count the union of prose decimals and axis values by source span.
        // A range's second endpoint can be excluded by the prose filter's
        // preceding-dot guard even though the axis grammar measures it.
        const proseMatches = [...line.matchAll(proseDecimal)];
        const measuredPositions = new Set(
          proseMatches.map((match) => match.index),
        );
        const axisPositions = new Set();
        for (const match of line.matchAll(coordinate)) {
          claims++;
          const axis = /** @type {"x"|"y"|"z"} */ (match[1].toLowerCase());
          const start = match.index + match[0].indexOf(match[2]);
          for (const decimal of match[2].matchAll(decimals)) {
            measuredPositions.add(start + decimal.index);
            axisPositions.add(start + decimal.index);
            const token = decimal[0];
            values++;
            const number = Math.round(Number(token) * 100000);
            if (sourceValues[axis].has(number) || sourceValues[axis].has(-number)) witnessed++;
            else errors.push(
              `${owner}: prose line ${index + 1} ${axis}=${token} has no measured-axis witness`,
            );
          }
        }
        for (const match of proseMatches) {
          if (axisPositions.has(match.index)) continue;
          scalarValues++;
          const number = Math.round(Number(match[1]) * 100000);
          if (sourceValues.scalar.has(number)) scalarWitnessed++;
          else errors.push(
            `${owner}: prose line ${index + 1} scalar=${match[1]} has no structured witness`,
          );
        }
        proseDecimals += measuredPositions.size;
      }
      const localDecimals = proseDecimals - before.proseDecimals;
      const localValues = values - before.values;
      coverage.push({
        owner,
        proseDecimals: localDecimals,
        axisValues: localValues,
        unwitnessed: localValues - (witnessed - before.witnessed),
        outsideGrammar: localDecimals - localValues,
        scalarValues: scalarValues - before.scalarValues,
        unwitnessedScalars: (scalarValues - before.scalarValues) - (scalarWitnessed - before.scalarWitnessed),
      });
    };
    for (const line of source.split(/\r?\n/)) {
      const heading = /^## .*\{#([^}]+)\}/.exec(line);
      if (heading) {
        check(anchor, lines);
        anchor = heading[1];
        lines = [];
      } else if (anchor) lines.push(line);
    }
    check(anchor, lines);
  }
  const nonAxisDecimals = proseDecimals - values;
  return {
    h2,
    proseDecimals,
    coordinateClaims: claims,
    coordinateValues: values,
    witnessedCoordinateValues: witnessed,
    unwitnessedCoordinateValues: values - witnessed,
    nonAxisDecimals,
    scalarValues,
    witnessedScalarValues: scalarWitnessed,
    scalarControls,
    partBoundCoordinateClaims: partBoundClaims,
    unboundPartCoordinateClaims: unboundPartClaims,
    coverage,
    errors,
  };
}

// Every prototype with a measured axis supplies one document-only mutation.
// This fixture does not claim that a matching number proves part identity.
function fixture() {
  /** @type {Map<string,string>} */
  const overrides = new Map();
  /** @type {string[]} */
  const mutated = [];
  /** @type {string[]} */
  const noAxisClaim = [];
  for (const name of names) {
    const original = fs.readFileSync(
      path.join(root, "docs/models", `${name}.md`),
      "utf8",
    );
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
            options.push({
              i,
              at: match.index + match[0].indexOf(match[2]),
              token: match[2],
              value,
              axis,
            });
        }
      }
      if (!options.length) {
        noAxisClaim.push(anchor);
        return;
      }
      const hash = [...anchor].reduce(
        (sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0,
        20260925,
      );
      const selected = options[hash % options.length];
      const changed = (selected.value + 0.0137).toFixed(4);
      const line = lines[selected.i];
      const first = selected.token.search(decimals);
      const at = selected.at + first;
      lines[selected.i] = `${line.slice(0, at)}${changed}${line.slice(at + (selected.token.match(decimals) || [""])[0].length)}`;
      mutated.push(
        `${anchor}: prose line ${selected.i - start + 1} ${selected.axis}=${changed}`,
      );
    };
    for (let i = 0; i < lines.length; i++) {
      const heading = /^## .*\{#([^}]+)\}/.exec(lines[i]);
      if (heading) {
        mutate(i);
        anchor = heading[1];
        start = i + 1;
      }
    }
    mutate(lines.length);
    overrides.set(name, lines.join(original.includes("\r\n") ? "\r\n" : "\n"));
  }
  const observed = audit(overrides);
  const missed = mutated.filter(
    (needle) => !observed.errors.some((error) => error.includes(needle)),
  );
  if (missed.length) throw Error(
    `coordinate mutation escaped: ${missed.join(", ")}`,
  );
  return {
    prototypes: mutated.length + noAxisClaim.length,
    mutated: mutated.length,
    red: mutated.length,
    noAxisClaim,
  };
}

// Mutate one scalar assertion in every H2 with a named scalar control. The
// value must become unwitnessed even though all original design rows remain.
function scalarFixture() {
  /** @type {Map<string,string>} */
  const overrides = new Map();
  /** @type {string[]} */
  const mutated = [];
  for (const name of names) {
    const original = fs.readFileSync(path.join(root, "docs/models", `${name}.md`), "utf8");
    const lines = original.split(/\r?\n/);
    let owner = "", start = 0;
    /** @param {number} end */
    const change = (end) => {
      if (!owner) return;
      const control = lines.slice(start, end).find((line) => line.startsWith("@scalar-control "));
      if (!control) return;
      const value = Number(/^@scalar-control [^:]+: (.+)$/.exec(control)?.[1]);
      const known = witnesses(lines.slice(start, end));
      for (let i = start; i < end; i++) {
        const line = lines[i];
        if (!line.trim() || /^\||^@|^<!--/.test(line)) continue;
        const axisPositions = new Set();
        for (const match of line.matchAll(coordinate)) {
          const at = match.index + match[0].indexOf(match[2]);
          for (const decimal of match[2].matchAll(decimals))
            axisPositions.add(at + decimal.index);
        }
        for (const match of line.matchAll(proseDecimal)) {
          if (axisPositions.has(match.index) || Math.abs(Number(match[1]) - value) > 0.000001)
            continue;
          let next = value + 0.0137;
          while (known.scalar.has(Math.round(next * 100000))) next += 0.0137;
          const replacement = next.toFixed(5);
          lines[i] = line.slice(0, match.index) + replacement + line.slice(match.index + match[1].length);
          mutated.push(`${owner}: prose line ${i - start + 1} scalar=${replacement}`);
          return;
        }
      }
      throw Error(`${owner}: scalar control lacks a non-axis prose assertion`);
    };
    for (let i = 0; i < lines.length; i++) {
      const heading = /^## .*\{#([^}]+)\}/.exec(lines[i]);
      if (heading) { change(i); owner = heading[1]; start = i + 1; }
    }
    change(lines.length);
    overrides.set(name, lines.join(original.includes("\r\n") ? "\r\n" : "\n"));
  }
  const observed = audit(overrides);
  const missed = mutated.filter((needle) => !observed.errors.some((error) => error.includes(needle)));
  if (missed.length) throw Error(`scalar mutation escaped: ${missed.join(", ")}`);
  return { controlledH2: mutated.length, mutations: mutated.length, red: mutated.length };
}

if (require.main === module) {
  if (process.argv.includes("--fixture-scalar")) console.log(JSON.stringify(scalarFixture(), null, 2));
  else if (process.argv.includes("--fixture")) console.log(JSON.stringify(fixture(), null, 2));
  else {
    const result = audit();
    console.log(JSON.stringify(result, null, 2));
    if (result.errors.length) process.exitCode = 1;
  }
}
module.exports = { audit, fixture, scalarFixture };
