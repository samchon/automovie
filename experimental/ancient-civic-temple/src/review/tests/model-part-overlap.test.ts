import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { modelSections } from "../model-tessellation-census.mjs";
import { partOverlapRows } from "../model-part-overlap.mjs";

const section = (file: string, anchor: string): string => {
  const source = readFileSync(join(__dirname, "../../../docs/models", `${file}.md`), "utf8");
  const row = modelSections(source).find((item) => item.id === anchor);
  assert.ok(row);
  return row.body;
};

void test("radial gaps, paired side panels, and separate wheels resolve AABB false positives", () => {
  const fountain = section("fixtures", "fountain");
  assert.ok(!partOverlapRows("fountain", fountain).some((row) => row.parts === "rim/water"));
  assert.ok(partOverlapRows("fountain", fountain.replace("지름 1.64m 원판", "지름 1.70m 원판"))
    .some((row) => row.parts === "rim/water" && !row.pass));

  const shelf = section("fixtures", "display-shelf");
  assert.ok(!partOverlapRows("shelf", shelf).some((row) => row.parts === "side/board"));
  assert.ok(partOverlapRows("shelf", shelf.replace("X=−0.76~+0.76m", "X=−0.78~+0.78m"))
    .some((row) => row.parts === "side/board" && !row.pass));

  const cart = section("portable", "handcart");
  assert.ok(!partOverlapRows("cart", cart).some((row) => row.parts === "deck/wheel"));
  assert.ok(partOverlapRows("cart", cart.replace("(±0.34,0.23,0.10)m", "(±0.32,0.23,0.10)m"))
    .some((row) => row.parts === "deck/wheel" && !row.pass));
});

void test("a bent metal plate uses its authored segments rather than its spanning box", () => {
  const chest = section("fixtures", "chest");
  assert.ok(!partOverlapRows("chest", chest).some((row) =>
    row.parts === "lid/hasp" || row.parts === "lid/strap"));
  assert.ok(partOverlapRows("chest", chest.replace(
    "윗 구간은 Y=0.445~0.505m·Z=+0.26~+0.27m",
    "윗 구간은 Y=0.445~0.505m·Z=+0.25~+0.27m",
  )).some((row) => row.parts === "lid/hasp" && !row.pass));
});

void test("a surface inset has no solid volume and a sloping roof meets its wall", () => {
  const house = section("landscape", "neighbor-house");
  assert.ok(!partOverlapRows("house", house).some((row) =>
    /(?:wall|roof|plinth|recess)\/(?:wall|roof|plinth|recess)/.test(row.parts)));
  assert.ok(partOverlapRows("house", house.replace(
    "앞벽은 Y=4.24m", "앞벽은 Y=4.34m",
  )).some((row) => row.parts === "wall/roof" && !row.pass));
});

void test("cut timber ends are measured at their faces rather than at diagonal hulls", () => {
  const truss = section("entablature", "sanctuary-truss");
  assert.ok(!partOverlapRows("truss", truss).some((row) =>
    /principal|king-post|strut/.test(row.parts)));
  assert.ok(partOverlapRows("truss", truss.replace(
    "그 아랫면 Y≈6.132m", "그 아랫면 Y≈6.152m",
  )).some((row) => row.parts === "principal/strut" && !row.pass));
  assert.ok(partOverlapRows("truss", truss.replace(
    "양 측면 X=±0.09m", "양 측면 X=±0.06m",
  )).some((row) => row.parts === "king-post/strut" && !row.pass));
  assert.ok(partOverlapRows("truss", truss.replace(
    "발끝은 가운데 기둥 측면에 따라 절삭해", "발끝은 가운데 기둥 측면에 따라 고정해",
  )).some((row) => row.parts === "principal/strut" && !row.pass));
});

void test("declared insertion depth is checked against the reconstructed part intersection", () => {
  const tree = section("landscape", "cypress");
  assert.ok(partOverlapRows("tree", tree).some((row) =>
    row.parts === "trunk/crown" && row.pass));
  assert.ok(partOverlapRows("tree", tree.replace(
    "(0,3.0,0)m", "(0,2.9,0)m",
  )).some((row) => row.parts === "trunk/crown" && !row.pass));

  const cart = section("portable", "handcart");
  assert.ok(partOverlapRows("cart", cart).some((row) => row.parts === "axle/wheel" && row.pass));
  assert.ok(partOverlapRows("cart", cart.replace(
    "축은 X=−0.34~0.34m", "축은 X=−0.35~0.35m",
  )).some((row) => row.parts === "axle/wheel" && !row.pass));
});

void test("arched cover feet meet both tile ledges without filling the arch", () => {
  const tile = section("cladding", "roof-tile");
  assert.ok(!partOverlapRows("tile", tile).some((row) => row.parts === "tegula/imbrex"));
  assert.ok(partOverlapRows("tile", tile.replace(
    "두 발의 X는 시작에서 0.115/0.285m",
    "두 발의 X는 시작에서 0.105/0.285m",
  )).some((row) => row.parts === "tegula/imbrex" && !row.pass));
});
