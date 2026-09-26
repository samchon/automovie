import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { occupancyUnionRows } from "./model-occupancy-union.mjs";
import { modelSections } from "./model-tessellation-census.mjs";
import { implicitWallContactRows } from "./model-wall-contact.mjs";
import { tubeWallClearanceRows } from "./model-tube-clearance.mjs";
import { partContactRows } from "./model-part-contact.mjs";
import { shapeRelationRows } from "./model-shape-relations.mjs";

const root = new URL("../../docs/models/", import.meta.url);

/** Evaluate the small arithmetic grammar used by explicit dimensional equations. */
/** @param {string} source @returns {number} */
export const dimensionalExpression = (source) => {
  const input = source.replaceAll("−", "-").replaceAll("×", "*").replaceAll("÷", "/")
    .replace(/(\d|\))√/g, "$1*√");
  const tokens = input.match(/\d+(?:\.\d+)?|[()+*/−-]|√|²/g) ?? [];
  if (tokens.join("") !== input.replaceAll(/\s+/g, "")) throw new Error(`unsupported expression ${source}`);
  let i = 0;
  /** @param {string} token */
  const take = (token) => tokens[i] === token && (++i > 0);
  /** @type {() => number} */
  const primary = () => {
    let value;
    if (take("-")) value = -primary();
    else if (take("√")) value = Math.sqrt(primary());
    else if (take("(")) { value = sum(); if (!take(")")) throw new Error(`unclosed expression ${source}`); }
    else if (/^\d/.test(tokens[i] ?? "")) value = Number(tokens[i++]);
    else throw new Error(`missing operand in ${source}`);
    while (take("²")) value *= value;
    return value;
  };
  /** @type {() => number} */
  const product = () => {
    let value = primary();
    while (tokens[i] === "*" || tokens[i] === "/") {
      const op = tokens[i++], next = primary();
      value = op === "*" ? value * next : value / next;
    }
    return value;
  };
  /** @type {() => number} */
  const sum = () => {
    let value = product();
    while (tokens[i] === "+" || tokens[i] === "-") {
      const op = tokens[i++], next = product();
      value = op === "+" ? value + next : value - next;
    }
    return value;
  };
  const result = sum();
  if (i !== tokens.length || !Number.isFinite(result)) throw new Error(`invalid expression ${source}`);
  return result;
};

/** @param {string} id @param {string} body */
export const explicitEquationRows = (id, body) => {
  const rows = [];
  const exact = /([\d√(][\d.()+−×*\/√²]*[+−×*\/√²][\d.()+−×*\/√²]*)\s*(=|≈)\s*(\d+(?:\.\d+)?)m/g;
  for (const match of body.matchAll(exact)) {
    const [, expression, relation, stated] = match;
    try {
      const calculated = dimensionalExpression(expression);
      // Approximate statements carry two or three printed decimal places.
      const places = (stated.split(".")[1] ?? "").length;
      const tolerance = relation === "≈" ? 0.5 * 10 ** -places + 1e-6 : 1e-6;
      rows.push({ id, expression, relation, stated: Number(stated), calculated, tolerance,
        pass: Math.abs(calculated - Number(stated)) <= tolerance });
    } catch {
      // A number next to a variable or unit is outside this explicit grammar.
    }
  }
  return rows;
};

/** @param {string} id @param {string} body */
export const explicitRangeRows = (id, body) => {
  const rows = [];
  for (const match of body.matchAll(/([XYZ])=([+−-]?\d+(?:\.\d+)?)~([+−-]?\d+(?:\.\d+)?)m/g)) {
    const [, axis, fromText, toText] = match;
    const from = Number(fromText.replace("−", "-")), to = Number(toText.replace("−", "-"));
    // A segment can be authored from its support towards its tip, so either
    // sign of the directed interval is valid. A zero span is not an extent.
    rows.push({ id, axis, from, to, pass: Number.isFinite(from) && Number.isFinite(to) && from !== to });
  }
  return rows;
};

/** Check dimension declarations against the one unambiguous occupancy box of an H2. */
/** @param {string} id @param {string} body @param {number | null} sideThickness */
const declaredBoundRowsInParagraph = (id, body, sideThickness) => {
  const boxes = [...body.matchAll(/점유 상자는 (?:약 )?(\d+(?:\.\d+)?)×(\d+(?:\.\d+)?)×(\d+(?:\.\d+)?)m/g)];
  if (boxes.length !== 1) return [];
  const box = boxes[0].slice(1).map(Number);
  const rows = [];
  const dimensionsInParagraph = [...body.matchAll(/폭 (\d+(?:\.\d+)?)m·깊이 (\d+(?:\.\d+)?)m·높이 (\d+(?:\.\d+)?)m/g)];
  for (const match of dimensionsInParagraph) {
    const dimensions = match.slice(1).map(Number);
    const component = /(?:받침|몸체|꼭대기|석단)(?:은|는|에는)?[^.\n]*$/.test(body.slice(0, match.index));
    const exactWhole = dimensionsInParagraph.length === 1 && !component;
    rows.push({ id, kind: "width/depth/height", dimensions, box,
      pass: exactWhole
        ? Math.abs(dimensions[0] - box[0]) < 1e-6 &&
          Math.abs(dimensions[1] - box[2]) < 1e-6 && Math.abs(dimensions[2] - box[1]) < 1e-6
        : dimensions[0] <= box[0] + 1e-6 && dimensions[1] <= box[2] + 1e-6 && dimensions[2] <= box[1] + 1e-6 });
  }
  for (const match of body.matchAll(/지름 (\d+(?:\.\d+)?)m·높이 (\d+(?:\.\d+)?)m[^\n]{0,35}껍질/g)) {
    const diameter = Number(match[1]), height = Number(match[2]);
    rows.push({ id, kind: "diameter/height", dimensions: [diameter, height], box,
      pass: diameter <= box[0] + 1e-6 && diameter <= box[2] + 1e-6 &&
        Math.abs(height - box[1]) < 1e-6 });
  }
  const heights = [...body.matchAll(/(?:전체 높이|수관 꼭대기) (\d+(?:\.\d+)?)m/g)];
  for (const match of heights.slice(-1)) {
    const height = Number(match[1]);
    rows.push({ id, kind: "overall height", dimensions: [height], box,
      pass: Math.abs(height - box[1]) < 1e-6 });
  }
  for (const range of explicitRangeRows(id, body)) {
    const dimension = box[range.axis === "X" ? 0 : range.axis === "Y" ? 1 : 2];
    rows.push({ id, kind: `${range.axis} interval width`, dimensions: [Math.abs(range.to - range.from)], box,
      pass: Math.abs(range.to - range.from) <= dimension + 1e-6 });
  }
  const shelfInside = body.match(/측판[^\n]*?X=−(\d+(?:\.\d+)?)~\+(\d+(?:\.\d+)?)m/);
  if (shelfInside && sideThickness !== null) {
    const [, left, right] = shelfInside.map(Number);
    rows.push({ id, kind: "paired side panels and clear shelf", dimensions: [left, right, sideThickness], box,
      pass: Math.abs(left - right) < 1e-6 && Math.abs(left + right + 2 * sideThickness - box[0]) < 1e-6 });
  }
  return rows;
};

/** @param {string} id @param {string} body */
export const declaredBoundRows = (id, body) => {
  const sideThickness = body.match(/측판 두께 (\d+(?:\.\d+)?)m/);
  return body.split(/\n\s*\n/).flatMap((paragraph) =>
    declaredBoundRowsInParagraph(id, paragraph, sideThickness ? Number(sideThickness[1]) : null));
};

export const checkModelProseConsistency = () => {
  const equations = [], ranges = [], bounds = [], unions = [], wallContacts = [], tubeContacts = [], partContacts = [], shapeRelations = [];
  const files = readdirSync(root).filter((file) => file.endsWith(".md")).sort((a, b) => a.localeCompare(b));
  for (const file of files) {
    const source = readFileSync(new URL(file, root), "utf8");
    for (const section of modelSections(source)) {
      const id = `${file.slice(0, -3)}#${section.id}`;
      equations.push(...explicitEquationRows(id, section.body));
      ranges.push(...explicitRangeRows(id, section.body));
      bounds.push(...declaredBoundRows(id, section.body));
      unions.push(...occupancyUnionRows(id, section.body));
      wallContacts.push(...implicitWallContactRows(id, section.body));
      tubeContacts.push(...tubeWallClearanceRows(id, section.body));
      partContacts.push(...partContactRows(id, section.body));
      shapeRelations.push(...shapeRelationRows(id, section.body));
    }
  }
  const failures = [
    ...equations.filter((row) => !row.pass).map((row) => `${row.id}: ${row.expression} ${row.relation} ${row.stated}m calculates ${row.calculated}m`),
    ...ranges.filter((row) => !row.pass).map((row) => `${row.id}: ${row.axis} range ${row.from}..${row.to} has no finite extent`),
    ...bounds.filter((row) => !row.pass).map((row) => `${row.id}: ${row.kind} ${row.dimensions} exceeds occupancy box ${row.box}`),
    ...unions.filter((row) => !row.pass).map((row) => `${row.id}: ${row.axis} ${row.union}m differs from occupancy box ${row.box}m`),
    ...wallContacts.filter((row) => !row.pass).map((row) => `${row.id}: ${row.part} back Z=${row.back}m misses the wall datum`),
    ...tubeContacts.filter((row) => !row.pass).map((row) => `${row.id}: ${row.kind} measured ${row.measured}m contradicts prose`),
    ...partContacts.filter((row) => !row.pass).map((row) => `${row.id}: ${row.parts} do not touch on ${row.axis}`),
    ...shapeRelations.filter((row) => !row.pass).map((row) => `${row.id}: ${row.kind} ${row.parts ?? ""} measured ${row.measured}m contradicts construction`),
  ];
  console.log(`model prose consistency: ${equations.length} dimensional equations, ${ranges.length} explicit axis ranges, ${bounds.length} dimension/box relations, ${unions.length} part bounds/union rows, ${wallContacts.length} wall contacts, ${tubeContacts.length} tube contacts, ${partContacts.length} part contacts, ${shapeRelations.length} shape relations, ${failures.length} failures`);
  for (const failure of failures) console.error(failure);
  return { equations, ranges, bounds, unions, wallContacts, tubeContacts, partContacts, shapeRelations, failures };
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  process.exitCode = checkModelProseConsistency().failures.length ? 1 : 0;
