import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { modelSections } from "../model-tessellation-census.mjs";
import { implicitWallContactRows } from "../model-wall-contact.mjs";
import { tubeWallClearanceRows } from "../model-tube-clearance.mjs";
import { partContactRows } from "../model-part-contact.mjs";

const section = (file: string, id: string): string => {
  const source = readFileSync(join(__dirname, "../../../docs/models", file + ".md"), "utf8");
  const found = modelSections(source).find((row: { id: string }) => row.id === id);
  assert.ok(found);
  return found.body;
};

void test("wall contact and wall gap follow the named parts' actual Z minima", () => {
  const source = section("fixtures", "niche");
  const rows = implicitWallContactRows("niche", source);
  assert.equal(rows.length, 5);
  assert.ok(rows.every((row: { pass: boolean }) => row.pass));
  const moved = source.replace("`recess`는 X=−0.30~+0.30m, Y=0.75~1.55m, Z=0.02~0.16m",
    "`recess`는 X=−0.30~+0.30m, Y=0.75~1.55m, Z=0~0.16m");
  assert.ok(implicitWallContactRows("niche", moved)
    .some((row: { part: string, pass: boolean }) => row.part === "recess" && !row.pass));
  const restated = source.replace("받침과 머리판의 뒷면(Z=0)은 제실 북쪽 벽과 닿는 가려진 접촉면이고",
    "받침과 머리판의 뒷면(Z=0)은 제실 북쪽 벽과 닿는 숨긴 접촉면이고");
  assert.ok(implicitWallContactRows("niche", restated)
    .every((row: { pass: boolean }) => row.pass));
});

void test("whole 12-segment polygonal handle clears the inner wall", () => {
  const source = section("portable", "bucket");
  const rows = tubeWallClearanceRows("bucket", source);
  assert.equal(rows.length, 2);
  assert.ok(rows.every((row: { pass: boolean }) => row.pass));
  const clearance = rows.find((row: { kind: string }) => row.kind === "inner-wall clearance");
  assert.ok(clearance);
  assert.ok(clearance.measured > 0.0012);
  const original = source.replaceAll("0.1475", "0.145").replaceAll("0.1575", "0.155")
    .replace("약 0.0011m", "약 0.0036m");
  const measured = tubeWallClearanceRows("original", original);
  assert.ok(measured.some((row: { kind: string, pass: boolean, measured: number }) =>
    row.kind === "inner-wall clearance" && !row.pass && row.measured < -0.001));
});

void test("named object faces remain tangent after their source dimensions change", () => {
  const source = section("portable", "portable-lamp");
  const rows = partContactRows("lamp", source);
  assert.deepEqual(rows.map((row: { parts: string }) => row.parts), ["foot/stem", "stem/dish"]);
  assert.ok(rows.every((row: { pass: boolean }) => row.pass));
  const detached = source.replace("Y=0.035~0.23m 원통", "Y=0.035~0.22m 원통");
  assert.ok(partContactRows("lamp", detached).some((row: { parts: string, pass: boolean }) =>
    row.parts === "stem/dish" && !row.pass));
  const stylus = section("portable", "stylus");
  assert.ok(partContactRows("stylus", stylus).some((row: { axis: string, pass: boolean }) =>
    row.axis === "X" && row.pass));
});
