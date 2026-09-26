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
    if (cells.length === 8 && (cells[0] === "@part" || cells[0] === "@envelope")) {
      const axes = cells.slice(4, 7).map((cell) => cell.replaceAll("−", "-").split("..").map(Number));
      rows.push({ state: cells[1], part: cells[2], kind: cells[3], x: axes[0], y: axes[1], z: axes[2] });
    }
    const feature = /^@(void|piece)\s+([^:]+):\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+)$/.exec(line);
    if (feature) {
      const axes = feature.slice(4).map((cell) => cell.replaceAll("−", "-").split("..").map(Number));
      rows.push({ state: feature[2].trim(), part: feature[3].trim(), kind: feature[1], x: axes[0], y: axes[1], z: axes[2] });
    }
    const grid = /^@grid\s+([^:]+):\s*([^,]+),\s*(\d+),\s*(\d+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([^,]+),\s*[^,]+$/.exec(line);
    if (grid) {
      const columns = Number(grid[3]), count = Number(grid[4]);
      const pitchX = Number(grid[5]), pitchZ = Number(grid[6]);
      const width = Number(grid[7]), depth = Number(grid[8]);
      const y = grid[9].split("..").map(Number);
      for (let row = 0; row < count; row++) for (let column = 0; column < columns; column++) {
        const xCenter = (column - (columns - 1) / 2) * pitchX;
        const zCenter = (row - (count - 1) / 2) * pitchZ;
        rows.push({ state: grid[1], part: `${grid[2]}-${row * columns + column}`,
          kind: "box", x: [xCenter - width / 2, xCenter + width / 2], y,
          z: [zCenter - depth / 2, zCenter + depth / 2] });
      }
    }
  }
  /** @type {string[]} */ const errors = [];
  let bound = 0, unbound = 0, boundDimensions = 0;
  const unresolved = [];
  const derivedScalars = [];
  const parts = [...new Set(rows.map((row) => row.part))];
  const aliases = lines.flatMap((line) => {
    const declaration = /^@prose-part\s+([^:]+):\s*([a-z][a-z0-9-]*\*?)(!void)?$/.exec(line);
    return declaration ? [{ word: declaration[1].trim(), part: declaration[2], kind: declaration[3] ? "void" : "part" }] : [];
  });
  const curves = lines.flatMap((line) => {
    const declaration = /^@curve-linear\s+([^:]+):\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+)$/.exec(line);
    return declaration ? [{ state: declaration[1], host: declaration[2], guest: declaration[3],
      hostDepth: Number(declaration[8]), gap: Number(declaration[9]), guestDepth: Number(declaration[10]) }] : [];
  });
  for (const line of lines.filter((row) => row.startsWith("@prose-bore-diameter "))) {
    const declaration = /^@prose-bore-diameter ([^:]+): ([^,]+), (.+)$/.exec(line);
    if (!declaration) { errors.push(`${owner}: malformed prose bore diameter ${line}`); continue; }
    const [, state, part, phrase] = declaration;
    const bore = lines.map((row) => /^@bore ([^:]+): ([^,]+), ([\d.]+),/.exec(row))
      .find((match) => match && match[1] === state && match[2] === part);
    if (!bore) { errors.push(`${owner}: prose bore diameter names missing @bore ${state}/${part}`); continue; }
    const claim = lines.filter((row) => !/^\||^@|^<!--/.test(row) && row.includes(phrase))
      .flatMap((row) => {
        const rest = row.slice(row.indexOf(phrase) + phrase.length);
        const match = /지름\s*(\d+\.\d+)m/.exec(rest);
        return match ? [Number(match[1])] : [];
      });
    if (claim.length !== 1 || Math.abs(claim[0] - 2 * Number(bore[3])) > 0.000001)
      errors.push(`${owner}: prose bore diameter ${state}/${part} differs from @bore`);
  }
  const radialMeasures = lines.flatMap((line) => {
    const declaration = /^@radial\s+([^:]+):\s*([^,]+),\s*[\d.]+,\s*([\d.]+)$/.exec(line);
    return declaration ? [{ state: declaration[1], part: declaration[2], diameter: 2 * Number(declaration[3]) }] : [];
  });
  const dimensionAliases = [...aliases, ...lines.flatMap((line) => {
    const declaration = /^@prose-dim\s+([^:]+):\s*([a-z][a-z0-9-]*\*?)$/.exec(line);
    return declaration ? [{ word: declaration[1].trim(), part: declaration[2], kind: "part" }] : [];
  })];
  const envelopeAliases = lines.flatMap((line) => {
    const declaration = /^@prose-envelope\s+([^:]+):\s*([a-z][a-z0-9-]*)$/.exec(line);
    return declaration ? [{ word: declaration[1].trim(), state: declaration[2] }] : [];
  });
  for (const line of lines.filter((row) => row.startsWith("@prose-gap "))) {
    const declaration = /^@prose-gap\s+([^:]+):\s*([^,]+),\s*([^,]+),\s*([XYZ]),\s*(.+)$/.exec(line);
    if (!declaration) { errors.push(`${owner}: malformed prose gap ${line}`); continue; }
    const [, state, first, second, axisText, phrase] = declaration;
    const axis = /** @type {"x"|"y"|"z"} */ (axisText.toLowerCase());
    const states = state === "*" ? [...new Set(rows.filter((row) => row.part === first &&
      row.kind !== "piece").map((row) => row.state))] : [state];
    if (!states.length) { errors.push(`${owner}: prose gap names missing measured part ${first}`); continue; }
    const phrasePattern = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const mentions = lines.filter((row) => !/^\||^@|^<!--/.test(row))
      .flatMap((row) => [...row.matchAll(new RegExp(`(\\d+\\.\\d+)m\\s*(?:의\\s*)?${phrasePattern}`, "g"))]);
    if (mentions.length !== 1) { errors.push(`${owner}: prose gap ${phrase} must have one numeric prose claim`); continue; }
    for (const selected of states) {
      const a = rows.find((row) => row.state === selected && row.part === first && row.kind !== "piece");
      const b = rows.find((row) => row.state === selected && row.part === second && row.kind !== "piece");
      if (!a || !b) { errors.push(`${owner}: prose gap ${selected} names missing measured parts ${first}/${second}`); continue; }
      const measured = a[axis][0] - b[axis][1];
      derivedScalars.push(measured);
      if (!(measured > 0) || Math.abs(Number(mentions[0][1]) - measured) > 0.000001)
        errors.push(`${owner}: prose gap ${phrase} ${mentions[0][1]} contradicts ${selected}/${first}.${axis}.min - ${second}.${axis}.max = ${measured}`);
    }
  }
  for (const alias of dimensionAliases) {
    const prefix = alias.part.endsWith("*") ? alias.part.slice(0, -1) : null;
    if (!rows.some((row) => (prefix ? row.part.startsWith(prefix) : row.part === alias.part) &&
      (alias.kind !== "void" || row.kind === "void")))
      errors.push(`${owner}: prose alias ${alias.word} names no measured part ${alias.part}`);
    if (!lines.some((line) => !/^\||^@|^<!--/.test(line) && line.includes(alias.word)))
      errors.push(`${owner}: prose alias ${alias.word} is unused`);
  }
  const envelopes = rows.filter((row) => row.part === "*");
  for (const alias of envelopeAliases) {
    if (!envelopes.some((row) => row.state === alias.state))
      errors.push(`${owner}: prose envelope ${alias.word} names missing state ${alias.state}`);
    if (!lines.some((line) => /^(?:은|는)/.test(line.split(`\`${alias.word}\``)[1] ?? "")))
      errors.push(`${owner}: prose envelope ${alias.word} is unused`);
  }
  let envelopeDimensions = 0, envelopeTriples = 0;
  /** @type {Map<string,Set<number>>} */
  const wildcardMinima = new Map();
  for (const [index, line] of lines.entries()) {
    if (!line.trim() || /^\||^@|^<!--/.test(line)) continue;
    for (const alias of envelopeAliases) {
      const marker = `\`${alias.word}\``;
      const at = line.indexOf(marker);
      if (at < 0) continue;
      const suffix = line.slice(at + marker.length);
      if (!/^(?:은|는)/.test(suffix)) continue;
      const after = suffix.slice(1);
      const end = after.search(/다\.\s/);
      const sentence = after.slice(0, end < 0 ? 160 : end);
      const envelope = envelopes.find((row) => row.state === alias.state);
      if (!envelope) continue;
      for (const [axis, label] of /** @type {const} */ ([
        ["x", "폭"], ["y", "높이"], ["z", "깊이"],
      ])) {
        const claim = new RegExp(`${label}\\s*(\\d+\\.\\d+)`).exec(sentence);
        if (!claim) continue;
        envelopeDimensions++;
        const span = envelope[axis][1] - envelope[axis][0];
        if (Math.abs(Number(claim[1]) - span) > 0.000001)
          errors.push(`${owner}: prose line ${index + 1} ${alias.state} ${axis} span ${claim[1]} contradicts envelope ${span}`);
      }
    }
    for (const gap of line.matchAll(/보다\s+(\d+\.\d+)m\s+앞쪽/g)) {
      const before = line.slice(Math.max(0, gap.index - 160), gap.index);
      const mentioned = aliases.flatMap((alias) => {
        const at = before.lastIndexOf(alias.word);
        return at < 0 ? [] : [{ ...alias, at }];
      }).sort((a, b) => b.at - a.at)[0];
      if (!mentioned) continue;
      const prefix = mentioned.part.endsWith("*") ? mentioned.part.slice(0, -1) : null;
      const measured = curves.filter((curve) => prefix ? curve.guest.startsWith(prefix) :
        curve.guest === mentioned.part).map((curve) => curve.gap);
      if (measured.length && measured.some((value) => Math.abs(value - Number(gap[1])) > 0.000001))
        errors.push(`${owner}: prose line ${index + 1} ${mentioned.part} curve gap ${gap[1]} contradicts measured curve`);
    }
    for (const triple of line.matchAll(/(\d+\.\d+)×(\d+\.\d+)×(\d+\.\d+)m/g)) {
      const before = line.slice(Math.max(0, triple.index - 60), triple.index);
      const named = dimensionAliases.flatMap((alias) => {
        const at = before.lastIndexOf(alias.word);
        return at < 0 ? [] : [{ ...alias, at }];
      }).sort((a, b) => b.at - a.at)[0];
      if (!named || before.length - named.at - named.word.length > 25) continue;
      const prefix = named.part.endsWith("*") ? named.part.slice(0, -1) : null;
      const eligible = rows.filter((row) =>
        (prefix ? row.part.startsWith(prefix) : row.part === named.part) && row.kind !== "void");
      if (!eligible.length) continue;
      for (const [i, axis] of /** @type {const} */ (["x", "y", "z"]).entries()) {
        const claimed = Number(triple[i + 1]);
        if (!eligible.some((row) => Math.abs(row[axis][1] - row[axis][0] - claimed) < 0.000001))
          errors.push(`${owner}: prose line ${index + 1} ${named.part} ${axis} span ${claimed} contradicts measured part`);
      }
    }
    for (const triple of line.matchAll(/(\d+\.\d+)×(\d+\.\d+)×(\d+\.\d+)m\s+점유/g)) {
      const preceding = line.slice(0, triple.index);
      const stateNames = [...preceding.matchAll(/`([^`]+)`/g)].map((token) => token[1]);
      const state = stateNames.reverse().find((name) => envelopes.some((row) => row.state === name));
      const envelope = envelopes.find((row) => row.state === state);
      if (!envelope) continue;
      envelopeTriples++;
      for (const [i, axis] of /** @type {const} */ (["x", "y", "z"]).entries()) {
        const value = Number(triple[i + 1]);
        if (Math.abs(envelope[axis][1] - envelope[axis][0] - value) > 0.000001)
          errors.push(`${owner}: prose line ${index + 1} ${state} envelope ${axis} span ${value} contradicts measured part`);
      }
    }
    for (const length of line.matchAll(/전체\s+하향\s+길이\s+(\d+\.\d+)m/g)) {
      const spans = [...new Set(envelopes.map((row) => row.y[1] - row.y[0]))];
      if (spans.length !== 1) continue;
      envelopeDimensions++;
      if (Math.abs(Number(length[1]) - spans[0]) > 0.000001)
        errors.push(`${owner}: prose line ${index + 1} downward length ${length[1]} contradicts measured envelope ${spans[0]}`);
    }
    for (const measure of line.matchAll(/(?:X\s*)?폭\s*(\d+\.\d+)|(?:Y\s*)?높이\s*(\d+\.\d+)|(?:Z\s*)?깊이\s*(\d+\.\d+)|두께\s*(\d+\.\d+)|(?<!반)지름\s*(\d+\.\d+)/g)) {
      const axis = /** @type {"x"|"y"|"z"|null} */ (measure[1] ? "x" : measure[2] ? "y" : measure[3] ? "z" : null);
      const value = Number(measure[1] || measure[2] || measure[3] || measure[4] || measure[5]);
      const before = line.slice(Math.max(0, measure.index - 70), measure.index);
      const following = line.slice(measure.index + measure[0].length,
        measure.index + measure[0].length + 28);
      const nextAlias = dimensionAliases.find((alias) =>
        new RegExp(`^(?:m|의|\\s)*${alias.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`)
          .test(following));
      const mentioned = nextAlias ? { part: nextAlias.part, kind: nextAlias.kind, at: 0 } : dimensionAliases.flatMap((alias) => {
        const at = before.lastIndexOf(alias.word);
        return at < 0 ? [] : [{ part: alias.part, kind: alias.kind, at }];
      }).sort((a, b) => b.at - a.at)[0];
      if (!mentioned) continue;
      if (measure[5] && before.length - mentioned.at > 32) continue;
      const stateNames = [...before.matchAll(/`([^`]+)`/g)].map((token) => token[1]);
      const declaredState = stateNames.reverse().find((name) => rows.some((row) =>
        row.state === name || row.state.startsWith(`${name}/`)));
      const plainState = [...before.matchAll(/(?:^|[·,\s])([a-z][a-z0-9-]*)(?=[·,\s]|$)/g)]
        .map((match) => match[1]).reverse().find((token) => rows.some((row) =>
          row.state === token || row.state.startsWith(token)));
      const state = plainState ?? declaredState;
      const prefix = mentioned.part.endsWith("*") ? mentioned.part.slice(0, -1) : null;
      const opening = mentioned.kind === "void" ||
        /(?:개구|구멍|절삭|edge)/.test(before.slice(mentioned.at));
      const eligible = rows.filter((row) => (prefix ? row.part.startsWith(prefix) : row.part === mentioned.part) &&
        (!state || row.state === state || row.state.startsWith(`${state}/`) ||
          row.state.startsWith(state)) &&
        (opening ? row.kind === "void" : row.kind !== "void"));
      if (!eligible.length) continue;
      if (measure[5]) {
        const diameters = radialMeasures.filter((radial) =>
          (prefix ? radial.part.startsWith(prefix) : radial.part === mentioned.part) &&
          (!state || radial.state === state || radial.state.startsWith(`${state}/`) ||
            radial.state.startsWith(state))).map((radial) => radial.diameter);
        if (diameters.length) {
          boundDimensions++;
          if (diameters.some((diameter) => Math.abs(diameter - value) > 0.000001))
            errors.push(`${owner}: prose line ${index + 1} ${mentioned.part} diameter ${value} contradicts radial section`);
          continue;
        }
        if (!eligible.some((row) => row.kind === "cylinder")) continue;
      }
      if (measure[4]) {
        const measured = curves.filter((curve) => prefix ? curve.host.startsWith(prefix) :
          curve.host === mentioned.part).map((curve) => curve.hostDepth);
        if (measured.length) {
          boundDimensions++;
          if (measured.some((depth) => Math.abs(depth - value) > 0.000001))
            errors.push(`${owner}: prose line ${index + 1} ${mentioned.part} curve thickness ${value} contradicts measured curve`);
          continue;
        }
      }
      if ((axis === "z" || axis === null) && eligible.every((row) => row.kind === "curved")) continue;
      boundDimensions++;
      const spans = /** @param {typeof eligible[number]} row */ (row) =>
        axis ? [row[axis][1] - row[axis][0]] : measure[5]
          ? [row.x[1] - row.x[0], row.z[1] - row.z[0]] :
          [Math.min(row.x[1] - row.x[0], row.y[1] - row.y[0], row.z[1] - row.z[0])];
      const groups = [...new Set(eligible.map((row) => row.state))].flatMap((key) => {
        const members = eligible.filter((row) => row.state === key);
        return axis ? [Math.max(...members.map((row) => row[axis][1])) -
          Math.min(...members.map((row) => row[axis][0]))] : [];
      });
      if (![...eligible.flatMap(spans), ...groups]
        .some((span) => Math.abs(span - value) < 0.000001))
        errors.push(`${owner}: prose line ${index + 1} ${mentioned.part} ${axis ?? "thickness"} span ${value} contradicts measured part`);
    }
    // A leading prototype description gives dimensions of the complete
    // measured envelope. Only use a state whose own token is named, or a
    // single-state prototype; a child part's dimensions are not an envelope.
    const description = /^`([^`]+)`(?:은|는)\s+/.exec(line);
    if (description && (description[1] === owner || description[1].startsWith(`${owner}/`))) {
      const proseTail = line.slice(description[0].length);
      const sentenceEnd = proseTail.search(/다\.\s/);
      const sentence = proseTail.slice(0, sentenceEnd >= 0 ? sentenceEnd : 180);
      const namedState = description[1].startsWith(`${owner}/`)
        ? description[1].slice(owner.length + 1) : null;
      const candidates = envelopes.filter((row) => !namedState || row.state === namedState);
      for (const [axis, label, pattern] of /** @type {const} */ ([
        ["x", "폭", "(?:^|[,·\\s])(?:X\\s*)?폭"],
        ["y", "높이", "(?:^|[,·\\s])(?:Y\\s*)?높이"],
        ["z", "깊이", "(?:^|[,·\\s])Z\\s*깊이"],
      ])) {
        const claim = new RegExp(`${pattern}\\s*(\\d+\\.\\d+)`).exec(sentence);
        if (!claim || !candidates.length) continue;
        const spans = [...new Set(candidates.map((row) => row[axis][1] - row[axis][0]))];
        if (spans.length !== 1) continue;
        envelopeDimensions++;
        if (Math.abs(Number(claim[1]) - spans[0]) > 0.000001)
          errors.push(`${owner}: prose line ${index + 1} ${label} ${claim[1]} contradicts measured envelope ${spans[0]}`);
      }
    }
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
    for (const claim of line.matchAll(/([xyzXYZ])\s*=\s*([±+−-]?\d+\.\d+)(?:\.\.([+−-]?\d+\.\d+))?(?![WH])/g)) {
      const axis = /** @type {"x"|"y"|"z"} */ (claim[1].toLowerCase());
      const boundary = line.lastIndexOf(". ", claim.index);
      const start = boundary < 0 ? 0 : boundary + 2;
      const clause = line.slice(start, claim.index);
      const names = [...clause.matchAll(/`([^`]+)`/g)]
        .filter((token) => parts.includes(token[1]) || (token[1].endsWith("-j") &&
          parts.some((part) => part.startsWith(token[1].slice(0, -1)))));
      const directSubject = /(?:^|[\s,])([a-z][a-z0-9-]*)(?:는|은|의)?\s*$/.exec(clause);
      const directNamed = directSubject && parts.includes(directSubject[1])
        ? { 1: directSubject[1], index: clause.length - directSubject[0].length }
        : null;
      const lexical = aliases.flatMap((alias) => {
        const index = clause.lastIndexOf(alias.word);
        return index < 0 ? [] : [{ 1: alias.part, index, kind: alias.kind }];
      }).sort((a, b) => b.index - a.index)[0];
      const englishSubject = parts.flatMap((part) => {
        if (part === "*") return [];
        const expression = new RegExp(`(?<![a-z0-9-])${part}(?:은|는|이|가)`, "g");
        const matches = [...clause.matchAll(expression)];
        const index = matches.at(-1)?.index;
        return index !== undefined && clause.length - index <= 35
          ? [{ 1: part, index }] : [];
      }).sort((a, b) => b.index - a.index)[0];
      const after = line.slice(claim.index + claim[0].length);
      const following = /^(?:m|의|에는|에|인|\s|,)*\s*`([^`]+)`/.exec(after);
      const followingWord = /^(?:m|\s)*([a-z][a-z0-9-]*)(?:와|과|은|는|의)/.exec(after);
      const followingPart = followingWord && (parts.includes(followingWord[1])
        ? followingWord[1]
        : parts.some((part) => part.startsWith(`${followingWord[1]}-`))
          ? `${followingWord[1]}-*` : null);
      const preceding = [directNamed, names.at(-1), lexical, englishSubject].filter(Boolean)
        .sort((a, b) => (b?.index ?? -1) - (a?.index ?? -1))[0];
      const named = following && parts.includes(following[1])
        ? { 1: following[1], index: claim.index - start }
        : followingPart ? { 1: followingPart, index: claim.index - start } : preceding;
      if (!named || claim.index - start - named.index > 80) {
        unbound++;
        unresolved.push({ line: index + 1, claim: claim[0], clause: clause.slice(-90), reason: "part" });
        continue;
      }
      const prefix = named[1].endsWith("-j") || named[1].endsWith("*")
        ? named[1].slice(0, -1) : null;
      const stateNames = [...clause.matchAll(/`([^`]+)`/g)].map((token) => token[1]);
      const state = stateNames.reverse().find((name) => rows.some((row) =>
        row.state === name || row.state.startsWith(`${name}/`)));
      const nextMeasure = line.slice(claim.index + claim[0].length).search(/[,;]|[xyzXYZ]\s*=/);
      const tail = line.slice(claim.index + claim[0].length,
        nextMeasure < 0 ? claim.index + claim[0].length + 60 : claim.index + claim[0].length + nextMeasure);
      const opening = ("kind" in named && named.kind === "void") || (/(?:열린|개구|절삭|빈 )/.test(clause.slice(named.index)) && !/와\s*$/.test(clause)) ||
        /(?:열린\s+bay|개구)/.test(tail);
      const surfaceRegion = /(?:표면 영역|face|고정띠)/.test(line.slice(claim.index, claim.index + 100));
      const eligible = rows.filter((row) => (prefix ? row.part.startsWith(prefix) : row.part === named[1]) &&
        (!state || row.state === state || row.state.startsWith(`${state}/`)) &&
        (!opening || row.kind === "void"));
      if (!eligible.length) {
        unbound++;
        unresolved.push({ line: index + 1, claim: claim[0], clause: clause.slice(-90), reason: "state" });
        continue;
      }
      bound++;
      const symmetric = claim[2].startsWith("±");
      const specified = [claim[2], claim[3]].filter(Boolean)
        .map((token) => Number(token.replace("−", "-").replace("±", "")));
      if (named[1].endsWith("-j") && (claim[3] || line.slice(claim.index + claim[0].length).startsWith(".."))) {
        const key = `${named[1]}/${axis}`;
        const seen = wildcardMinima.get(key) || new Set();
        seen.add(specified[0]);
        wildcardMinima.set(key, seen);
      }
      const groups = [...new Set(eligible.map((row) => row.state))].map((state) => {
        const members = eligible.filter((row) => row.state === state);
        return { state, part: named[1], kind: "union",
          x: [Math.min(...members.map((row) => row.x[0])), Math.max(...members.map((row) => row.x[1]))],
          y: [Math.min(...members.map((row) => row.y[0])), Math.max(...members.map((row) => row.y[1]))],
          z: [Math.min(...members.map((row) => row.z[0])), Math.max(...members.map((row) => row.z[1]))] };
      });
      if (prefix && symmetric && specified.length === 1 && /중심/.test(clause.slice(named.index))) {
        const otherHorizontal = axis === "x" ? "z" : "x";
        const relevant = eligible.filter((row) => axis === "y" ||
          row[axis][1] - row[axis][0] <= row[otherHorizontal][1] - row[otherHorizontal][0] + 0.000001);
        const mismatched = relevant.filter((row) =>
          Math.abs(Math.abs((row[axis][0] + row[axis][1]) / 2) - specified[0]) > 0.000001);
        if (mismatched.length)
          errors.push(`${owner}: prose line ${index + 1} ${named[1]} ${axis} symmetric center ${specified[0]} contradicts ${mismatched.map((row) => `${row.state}/${row.part}`).join(",")}`);
        continue;
      }
      const valid = [...eligible, ...(prefix ? groups : [])].some((row) => {
        const [lo, hi] = row[axis];
        if (symmetric && specified.length === 1 && /중심/.test(clause.slice(named.index)))
          return Math.abs(Math.abs((lo + hi) / 2) - specified[0]) < 0.000001;
        if (symmetric && specified.length === 1)
          return [lo, hi, (lo + hi) / 2, (hi - lo) / 2]
            .some((candidate) => Math.abs(Math.abs(candidate) - specified[0]) < 0.000001);
        if (specified.length === 2) return (Math.abs(specified[0] - lo) < 0.000001 &&
          Math.abs(specified[1] - hi) < 0.000001) ||
          ((surfaceRegion || (row.kind === "curved" &&
            (!/(?:외곽|바깥|AABB)/.test(clause.slice(named.index)) ||
              /(?:단면|직사각형)/.test(clause.slice(named.index))))) &&
            specified[0] >= lo - 0.000001 && specified[1] <= hi + 0.000001);
        const value = specified[0];
        if (claim[0].includes("..")) return Math.abs(value - lo) < 0.000001;
        const face = clause.slice(named.index).trim();
        if (/(?:중심|center)(?:\s+높이)?\s*$/.test(face))
          return Math.abs(value - (lo + hi) / 2) < 0.000001;
        if (axis === "y" && (/(?:아래면|밑면|바닥면)\s*$/.test(face) ||
          /^\s*(?:m\s*)?(?:아래면|밑면|바닥면)/.test(tail)))
          return Math.abs(value - lo) < 0.000001;
        if (axis === "y" && (/(?:상면|윗면|윗부분)\s*$/.test(face) ||
          /^\s*(?:m\s*)?(?:상면|윗면|윗부분)/.test(tail)))
          return Math.abs(value - hi) < 0.000001;
        if (axis === "z" && (/(?:전면|앞면)\s*$/.test(face) ||
          /^\s*(?:m\s*)?(?:전면|앞면)/.test(tail)))
          return Math.abs(value - hi) < 0.000001;
        if (axis === "z" && (/(?:뒷면|후면)\s*$/.test(face) ||
          /^\s*(?:m\s*)?(?:뒷면|후면)/.test(tail)))
          return Math.abs(value - lo) < 0.000001;
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
  return { errors, bound, unbound, boundDimensions, envelopeDimensions, envelopeTriples, unresolved, derivedScalars };
}

/** @param {Map<string,string>} [overrides] */
function audit(overrides = new Map()) {
  /** @type {string[]} */
  const errors = [];
  /** @type {Array<{ owner:string; proseDecimals:number; axisValues:number; unwitnessed:number; outsideGrammar:number; scalarValues:number; unwitnessedScalars:number }>} */
  const coverage = [];
  /** @type {Array<{owner:string,line:number,claim:string,clause:string,reason:string}>} */
  const unresolved = [];
  let h2 = 0, claims = 0, values = 0, witnessed = 0, proseDecimals = 0,
    scalarValues = 0, scalarWitnessed = 0, scalarControls = 0,
    partBoundClaims = 0, unboundPartClaims = 0, partBoundDimensions = 0,
    envelopeDimensionClaims = 0, envelopeTripleClaims = 0;
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
      for (const value of binding.derivedScalars) add(sourceValues.scalar, value);
      if (process.env.MODEL_COORDINATE_TRACE)
        unresolved.push(...binding.unresolved.map((claim) => ({ owner, ...claim })));
      errors.push(...binding.errors);
      partBoundClaims += binding.bound;
      partBoundDimensions += binding.boundDimensions;
      unboundPartClaims += binding.unbound;
      envelopeDimensionClaims += binding.envelopeDimensions;
      envelopeTripleClaims += binding.envelopeTriples;
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
        if (!proseNumbers.has(Math.round(Number(control[2]) * 100000)) && !body.some((row) => !row.startsWith("@") && row.includes(`@scalar-control ${control[1]}`)))
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
    partBoundDimensionClaims: partBoundDimensions,
    unboundPartCoordinateClaims: unboundPartClaims,
    envelopeDimensionClaims,
    envelopeTripleClaims,
    ...(process.env.MODEL_COORDINATE_TRACE ? { unresolved } : {}),
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
      const controls = lines.slice(start, end).filter((line) => line.startsWith("@scalar-control "));
      if (!controls.length) return;
      const known = witnesses(lines.slice(start, end));
      for (const control of controls) {
        const value = Number(/^@scalar-control [^:]+: (.+)$/.exec(control)?.[1]);
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
      }
      const symbolic = controls.every((control) => {
        const name = /^@scalar-control ([^:]+):/.exec(control)?.[1];
        return name && lines.slice(start, end).some((line) => !/^\||^@|^<!--/.test(line) &&
          line.includes(`@scalar-control ${name}`));
      });
      if (!symbolic) throw Error(`${owner}: scalar control lacks a non-axis prose assertion or symbolic reference`);
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

function gapFixture() {
  let population = 0;
  for (const name of names) {
    const original = fs.readFileSync(path.join(root, "docs/models", `${name}.md`), "utf8");
    for (const section of original.split(/^## /m).slice(1)) {
      const owner = /\{#([^}]+)\}/.exec(section)?.[1];
      if (!owner) continue;
      for (const declaration of section.matchAll(/^@prose-gap\s+[^:]+:\s*[^,]+,\s*[^,]+,\s*[XYZ],\s*(.+)$/gm)) {
        population++;
        const phrase = declaration[1];
        const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const claim = new RegExp(`(\\d+\\.\\d+)(m\\s*(?:의\\s*)?${escaped})`);
        const match = claim.exec(section);
        if (!match) throw Error(`${owner}: prose gap fixture lacks ${phrase}`);
        const replacement = (Number(match[1]) + 0.001).toFixed(match[1].split(".")[1].length);
        const changed = original.replace(section, section.replace(claim, `${replacement}$2`));
        const observed = audit(new Map([[name, changed]]));
        if (!observed.errors.some((error) => error.includes(`${owner}: prose gap ${phrase}`)))
          throw Error(`${owner}: prose gap mutation escaped`);
      }
    }
  }
  return { population, mutations: population, red: population };
}

if (require.main === module) {
  if (process.argv.includes("--fixture-scalar")) console.log(JSON.stringify(scalarFixture(), null, 2));
  else if (process.argv.includes("--fixture-gap")) console.log(JSON.stringify(gapFixture(), null, 2));
  else if (process.argv.includes("--fixture")) console.log(JSON.stringify(fixture(), null, 2));
  else {
    const result = audit();
    console.log(JSON.stringify(result, null, 2));
    if (result.errors.length) process.exitCode = 1;
  }
}
module.exports = { audit, fixture, scalarFixture, gapFixture };
