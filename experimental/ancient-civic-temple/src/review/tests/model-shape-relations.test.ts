import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { modelSections } from "../model-tessellation-census.mjs";
import { shapeRelationRows } from "../model-shape-relations.mjs";

const section = (file: string, id: string) => {
  const source = readFileSync(`docs/models/${file}.md`, "utf8");
  const found = modelSections(source).find((item: { id: string }) => item.id === id);
  assert.ok(found);
  return found.body;
};

void test("a repeated torus gap and a layered fold are measured from their paths", () => {
  const rope = section("portable", "rope-coil");
  const nominalGaps = shapeRelationRows("rope", rope).filter((row: { kind: string }) => row.kind === "annular gap");
  assert.equal(nominalGaps.length, 2);
  assert.ok(nominalGaps.every((row: { pass: boolean }) => row.pass));
  const crowded = rope.replace("0.045m·0.075m·0.105m", "0.045m·0.060m·0.105m");
  assert.ok(shapeRelationRows("rope", crowded).some((row: { kind: string; pass: boolean }) =>
    row.kind === "annular gap" && !row.pass));

  const cloth = section("portable", "textile");
  for (const displaced of ["T/8~7T/8", "0.3T~0.7T"]) {
    const changed = cloth.replace("Y=T/4~3T/4의 직사각", `Y=${displaced}의 직사각`);
    assert.ok(shapeRelationRows("cloth", changed).some((row: { kind: string; pass: boolean }) =>
      row.kind.startsWith("fold/") && !row.pass));
  }
});

void test("a vessel interior is checked against payload floor and wall profiles", () => {
  const pot = section("portable", "planter");
  const rows = shapeRelationRows("pot", pot);
  assert.ok(rows.some((row: { kind: string; pass: boolean }) => row.kind === "inner wall clearance" && row.pass));
  const lowSoil = pot.replace("아랫면 Y=0.03m에서 반지름", "아랫면 Y=0m에서 반지름");
  const wideSoil = pot.replace("윗면 Y=0.270m에서 반지름 0.165m인 닫힌", "윗면 Y=0.270m에서 반지름 0.18m인 닫힌");
  assert.ok(shapeRelationRows("pot", lowSoil).some((row: { kind: string; pass: boolean }) =>
    row.kind === "inner floor clearance" && !row.pass));
  assert.ok(shapeRelationRows("pot", wideSoil).some((row: { kind: string; pass: boolean }) =>
    row.kind === "inner wall clearance" && !row.pass));
});
