import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildUpperHall } from "../spaces/rooms/upper-hall";
import { STOREYS } from "../spaces/storeys";

type Box = { x: [number, number]; y: [number, number]; z: [number, number] };

const bounds = (positions: number[]): Box => {
  const result: Box = { x: [Infinity, -Infinity], y: [Infinity, -Infinity], z: [Infinity, -Infinity] };
  for (let i = 0; i < positions.length; i += 3) {
    for (const [j, axis] of (["x", "y", "z"] as const).entries()) {
      result[axis][0] = Math.min(result[axis][0], positions[i + j]);
      result[axis][1] = Math.max(result[axis][1], positions[i + j]);
    }
  }
  return result;
};

const containsPlanAndTouchesTop = (floor: Box, member: Box): boolean => {
  const tolerance = 1e-8;
  return floor.x[0] <= member.x[0] + tolerance && floor.x[1] >= member.x[1] - tolerance &&
    floor.z[0] <= member.z[0] + tolerance && floor.z[1] >= member.z[1] - tolerance &&
    Math.abs(floor.y[1] - member.y[0]) <= tolerance;
};

const modelText = readFileSync(new URL("../../docs/models/05-closet-fittings.md", import.meta.url), "utf8");
const xy = /개구부 X=\[([\d.]+),([\d.]+)\] m 전체에서 상층 바닥 위 Y=\[([\d.]+),([\d.]+)\] m/.exec(modelText);
const depths = /뒤 문짝 Z=\[([−\d.]+),([−\d.]+)\], 앞 문짝 Z=\[([−\d.]+),([−\d.]+)\] m/.exec(modelText);
const datum = /world Y=\[([\d.]+),([\d.]+)\] m/.exec(modelText);
assert.ok(xy && depths && datum, "linen rail design must retain plan, depth and world-height intervals");
const number = (value: string): number => Number(value.replaceAll("−", "-"));
const railX: [number, number] = [number(xy[1]), number(xy[2])];
const railY: [number, number] = [number(datum[1]), number(datum[2])];
assert.ok(Math.abs(railY[0] - STOREYS.upperFloor - number(xy[3])) < 1e-8);
assert.ok(Math.abs((railY[1] - railY[0]) - (number(xy[4]) - number(xy[3]))) < 1e-8);
const rails: Box[] = [
  { x: railX, y: railY, z: [number(depths[1]), number(depths[2])] },
  { x: railX, y: railY, z: [number(depths[3]), number(depths[4])] },
];
const floors = buildUpperHall().parts.filter((part) => part.role === "floor")
  .map((part) => ({ id: part.id, box: bounds(part.mesh.positions) }));

void test("both linen rail bottoms contact a source-owned finished floor", () => {
  for (const rail of rails) {
    assert.ok(floors.some(({ box }) => containsPlanAndTouchesTop(box, rail)),
      `no finished floor supports rail ${JSON.stringify(rail)}`);
  }
});

void test("removing the supporting finish makes the same contact check fail", () => {
  const supporting = floors.filter(({ box }) => rails.some((rail) => containsPlanAndTouchesTop(box, rail)));
  assert.equal(supporting.length, 1);
  const remaining = floors.filter(({ id }) => !supporting.some((floor) => floor.id === id));
  assert.ok(rails.every((rail) => !remaining.some(({ box }) => containsPlanAndTouchesTop(box, rail))));
});
