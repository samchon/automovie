import assert from "node:assert/strict";
import test from "node:test";
import type { ITempleProseDiagnosticRows } from "../ITempleProseDiagnosticRows.mjs";
import { formatTempleProseFailures } from "../formatTempleProseFailures.mjs";

/** Explicit verdicts separate diagnostic policy from geometric acquisition.
 * Failed and passed twins carry identical witnesses. Empty populations, each
 * diagnostic family, unresolved axes and optional shape witnesses are exercised
 * in memory; no source text, file acquisition or CLI is involved.
 */
const empty = (): ITempleProseDiagnosticRows => ({ equations: [], ranges: [],
  bounds: [], unions: [], wallContacts: [], tubeContacts: [], partContacts: [],
  shapeRelations: [], overlaps: [] });

const measured = (pass: boolean): ITempleProseDiagnosticRows => ({
  equations: [{ id: "eq", pass, expression: "2+3", relation: "=", stated: 6, calculated: 5 }],
  ranges: [{ id: "range", pass, axis: "Y", from: 2, to: 2 }],
  bounds: [{ id: "bound", pass, kind: "width/depth/height", dimensions: [5, 2, 3], box: [4, 3, 2] }],
  unions: [{ id: "union", pass, kind: "part union", part: "all", axis: "X", union: 5, box: 4 }],
  wallContacts: [{ id: "wall", pass, part: "back", back: 0.2 }],
  tubeContacts: [{ id: "tube", pass, kind: "clearance", measured: -0.1 }],
  partContacts: [{ id: "contact", pass, parts: "a/b", axis: "Z" }],
  shapeRelations: [{ id: "shape", pass, kind: "annular gap", measured: -0.2 }],
  overlaps: [{ id: "overlap", pass, parts: "a/b", depths: [0.1, 0.2, 0.3] }],
});

void test("empty census produces no invented failures", () => {
  assert.deepEqual(formatTempleProseFailures(empty()), []);
});

void test("passed twins suppress every diagnostic family", () => {
  const input = measured(true);
  assert.deepEqual(formatTempleProseFailures(input), []);
  assert.equal(input.equations[0].pass, true);
});

void test("failed families retain acquisition-independent diagnostic order and witnesses", () => {
  const input = measured(false);
  assert.deepEqual(formatTempleProseFailures(input), [
    "eq: 2+3 = 6m calculates 5m",
    "range: Y range 2..2 has no finite extent",
    "bound: width/depth/height 5,2,3 exceeds occupancy box 4,3,2",
    "union: X 5m differs from occupancy box 4m",
    "wall: back back Z=0.2m misses the wall datum",
    "tube: clearance measured -0.1m contradicts prose",
    "contact: a/b do not touch on Z",
    "shape: annular gap  measured -0.2m contradicts construction",
    "overlap: a/b boxes overlap by 0.1×0.2×0.3m without a declared part relation",
  ]);
  assert.equal(input.overlaps[0].depths[2], 0.3);
});

void test("unresolved axes and named shape relations retain their actual part witnesses", () => {
  const rows = empty();
  rows.unions = [{ id: "unknown", pass: false, kind: "unresolved part axis",
    part: "beam", axis: "Z", union: NaN, box: 2 }];
  rows.shapeRelations = [{ id: "named", pass: false, kind: "clearance",
    parts: "shell/object", measured: -0.3 }];
  assert.deepEqual(formatTempleProseFailures(rows), [
    "unknown: unresolved part axis: beam Z",
    "named: clearance shell/object measured -0.3m contradicts construction",
  ]);
});
