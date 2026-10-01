import { readFileSync, readdirSync } from "node:fs";
import { occupancyUnionRows } from "./model-occupancy-union.mjs";
import { modelSections } from "./model-tessellation-census.mjs";
import { implicitWallContactRows } from "./model-wall-contact.mjs";
import { tubeWallClearanceRows } from "./model-tube-clearance.mjs";
import { partContactRows } from "./model-part-contact.mjs";
import { shapeRelationRows } from "./model-shape-relations.mjs";
import { partOverlapRows } from "./model-part-overlap.mjs";
import { explicitEquationRows } from "./explicitEquationRows.mjs";
import { explicitRangeRows } from "./explicitRangeRows.mjs";
import { declaredBoundRows } from "./declaredBoundRows.mjs";
import { formatTempleProseFailures } from "./formatTempleProseFailures.mjs";

const root = new URL("../../docs/models/", import.meta.url);

/** Acquire authored model files in lexical order and aggregate all prose and
 * geometry checkers in their existing order. This IO owner reports diagnostics
 * and returns every row; its CLI and self-check consumer own exit policy.
 * Parsing owners use explicit immutable inputs and never acquire files. */
export const checkModelProseConsistency = () => {
  const equations = [], ranges = [], bounds = [], unions = [], wallContacts = [], tubeContacts = [], partContacts = [], shapeRelations = [], overlaps = [];
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
      overlaps.push(...partOverlapRows(id, section.body));
    }
  }
  const failures = formatTempleProseFailures({ equations, ranges, bounds, unions,
    wallContacts, tubeContacts, partContacts, shapeRelations, overlaps });
  console.log(`model prose consistency: ${equations.length} dimensional equations, ${ranges.length} explicit axis ranges, ${bounds.length} dimension/box relations, ${unions.length} part bounds/union rows, ${wallContacts.length} wall contacts, ${tubeContacts.length} tube contacts, ${partContacts.length} part contacts, ${shapeRelations.length} shape relations, ${overlaps.length} AABB overlaps, ${failures.length} failures`);
  for (const failure of failures) console.error(failure);
  return { equations, ranges, bounds, unions, wallContacts, tubeContacts, partContacts, shapeRelations, overlaps, failures };
};
