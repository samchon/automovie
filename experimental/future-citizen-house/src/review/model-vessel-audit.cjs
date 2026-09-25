// Verify every authored spouted-vessel attachment against its measured part.
const { randomInt } = require("node:crypto");
const { sections, parse } = require("./model-part-audit.cjs");

/** @param {string} value */
function fraction(value) {
  const match = /^(\d+)\/(\d+)$/.exec(value);
  if (!match || Number(match[2]) === 0) throw Error(`invalid positive fraction ${value}`);
  const result = Number(match[1]) / Number(match[2]);
  if (!(result > 0 && Number.isFinite(result))) throw Error(`invalid positive fraction ${value}`);
  return result;
}

/** @param {string} value */
function range(value) {
  const match = /^(\d+\/\d+)\.\.(\d+\/\d+)$/.exec(value);
  if (!match) throw Error(`invalid fraction interval ${value}`);
  return /** @type {[number,number]} */ ([fraction(match[1]), fraction(match[2])]);
}

/** @param {Map<string,string[]>} all */
function audit(all) {
  /** @type {string[]} */ const errors = [];
  let rows = 0, states = 0, proved = 0;
  for (const [owner, lines] of all) {
    const declarations = lines.filter((line) => line.startsWith("@vessel-attachments"));
    if (lines.some((line) => line.includes("`@vessel-attachments`")) && !declarations.length)
      errors.push(`${owner}: prose names vessel attachments but no row declares them`);
    if (!declarations.length && !lines.some((line) => line.startsWith("@cavity-profile"))) continue;
    let design;
    try { design = parse(lines, owner); }
    catch (error) { errors.push(`${owner}: ${String(error)}`); continue; }
    const seen = new Set();
    for (const line of declarations) {
      rows++;
      const match = /^@vessel-attachments\s+([^:]+):\s*(.+)$/.exec(line);
      if (!match) { errors.push(`${owner}: malformed vessel attachment row`); continue; }
      const cells = match[2].split(",").map((cell) => cell.trim());
      if (cells.length !== 7) { errors.push(`${owner}: vessel attachment needs seven fields`); continue; }
      let spoutY, channel, gripY, holeX, holeY, gripZ;
      try {
        spoutY = fraction(cells[1]); channel = fraction(cells[2]);
        gripY = range(cells[3]); holeX = range(cells[4]); holeY = range(cells[5]);
        gripZ = fraction(cells[6]);
      } catch (error) { errors.push(`${owner}: ${String(error)}`); continue; }
      for (const state of match[1].split(",").map((value) => value.trim())) {
        states++;
        const key = `${state}/${cells[0]}`;
        if (seen.has(key)) { errors.push(`${owner}/${key}: repeated vessel attachment`); continue; }
        seen.add(key);
        const part = design.parts.get(key);
        const profile = design.cavityProfiles.get(key);
        if (!part || !profile || profile.section !== "round") {
          errors.push(`${owner}/${key}: attachment needs a measured round cavity profile`);
          continue;
        }
        const W = part.x[1] - part.x[0], H = part.y[1] - part.y[0], D = part.z[1] - part.z[0];
        const R = Math.min(W, D) / 2, wall = Math.min(W, D) / profile.wallDivisor;
        const shoulder = profile.shoulderNumerator / profile.shoulderDenominator;
        const mouth = profile.mouthRadius, centerZ = part.z[0] + R;
        /** @param {number} y */
        const outerAt = (y) => R + (mouth + wall - R) * (y - shoulder) / (1 - shoulder);
        /** @param {number} y */
        const innerAt = (y) => R - wall + (mouth - (R - wall)) * (y - shoulder) / (1 - shoulder);
        const spoutInner = channel * mouth, spoutOuter = spoutInner + wall;
        const problem = [];
        if (!(W > 0 && H > 0 && D > 0 && wall > 0 && shoulder > 0 && shoulder < 1))
          problem.push("invalid body or shoulder");
        if (!(spoutY > shoulder && spoutY < 1 && spoutInner > 0 && spoutInner < mouth &&
          spoutInner < innerAt(spoutY) && spoutOuter < R &&
          spoutY * H - spoutOuter > 0 && spoutY * H + spoutOuter < H &&
          part.z[1] - (centerZ + R) > 0)) problem.push("spout leaves cavity or measured bounds");
        if (!(shoulder <= gripY[0] && gripY[0] < holeY[0] && holeY[0] < holeY[1] &&
          holeY[1] < gripY[1] && gripY[1] < 1 &&
          0 < holeX[0] && holeX[0] < holeX[1] && holeX[1] < 1 &&
          holeX[0] * R > outerAt(holeY[0]) &&
          R - (outerAt(gripY[0]) - wall / 2) > 0 &&
          gripZ > 0 && centerZ - gripZ * W > part.z[0] &&
          centerZ + gripZ * W < part.z[1] && holeX[0] * R > spoutOuter))
          problem.push("grip hole or finite root leaves measured bounds");
        if (problem.length) errors.push(`${owner}/${key}: ${problem.join("; ")}`);
        else proved++;
      }
    }
    for (const [key, profile] of design.cavityProfiles) {
      const part = design.parts.get(key);
      if (profile.section === "round" && part &&
        part.z[1] - part.z[0] > part.x[1] - part.x[0] + 0.000001 && !seen.has(key))
        errors.push(`${owner}/${key}: round cavity has extra depth but no vessel attachment`);
    }
  }
  return { prototypes: all.size, rows, states, proved, errors };
}

/** @param {Map<string,string[]>} all */
function fixture(all) {
  const population = [];
  for (const [owner, lines] of all) for (let index = 0; index < lines.length; index++)
    if (lines[index].startsWith("@vessel-attachments")) population.push({ owner, index });
  if (!population.length) throw Error("empty vessel attachment mutation population");
  const selected = population[randomInt(population.length)];
  const fields = [1, 2, 3, 4, 5, 6];
  const results = [];
  for (const field of fields) {
    const lines = [...(all.get(selected.owner) || [])];
    const match = /^(@vessel-attachments\s+[^:]+:\s*)(.+)$/.exec(lines[selected.index]);
    if (!match) throw Error("selected vessel declaration vanished");
    const cells = match[2].split(",").map((cell) => cell.trim());
    cells[field] = field >= 3 && field <= 5 ? "2/1..3/1" : "2/1";
    lines[selected.index] = match[1] + cells.join(", ");
    const changed = new Map(all); changed.set(selected.owner, lines);
    const findings = audit(changed).errors;
    results.push({ field, red: findings.length > 0, first: findings[0] || null });
  }
  const removed = [...(all.get(selected.owner) || [])];
  removed.splice(selected.index, 1);
  const without = new Map(all); without.set(selected.owner, removed);
  const missing = audit(without).errors;
  results.push({ field: "declaration removed", red: missing.some((error) =>
    error.includes("round cavity has extra depth")), first: missing[0] || null });
  const chosen = (all.get(selected.owner) || [])[selected.index];
  const declaration = /^@vessel-attachments\s+([^:]+):\s*([^,]+)/.exec(chosen);
  if (!declaration) throw Error("selected vessel declaration vanished");
  const stateOptions = declaration[1].split(",").map((value) => value.trim());
  const state = stateOptions[randomInt(stateOptions.length)];
  const source = [...(all.get(selected.owner) || [])];
  const profileAt = source.findIndex((line) => line.startsWith(`@cavity-profile ${state}: ${declaration[2].trim()},`));
  const part = parse(source, selected.owner).parts.get(`${state}/${declaration[2].trim()}`);
  if (profileAt < 0 || !part) throw Error("selected vessel profile vanished");
  source[profileAt] = source[profileAt].replace(/[\d.]+$/, String(part.x[1] - part.x[0]));
  const changed = new Map(all); changed.set(selected.owner, source);
  const profileErrors = audit(changed).errors;
  results.push({ field: "random profile mouth", state, red: profileErrors.some((error) =>
    error.startsWith(`${selected.owner}/${state}/`)), first: profileErrors[0] || null });
  const red = results.filter((result) => result.red).length;
  if (red !== results.length) throw Error(`vessel attachment mutations red ${red}/${results.length}`);
  return { population: population.length, statePopulation: stateOptions.length,
    mutations: results.length, red, results };
}

const all = sections();
const result = audit(all);
if (process.argv.includes("--fixture")) console.log(JSON.stringify({ ...result, fixture: fixture(all) }, null, 2));
else console.log(JSON.stringify(result, null, 2));
if (result.errors.length) process.exitCode = 1;
