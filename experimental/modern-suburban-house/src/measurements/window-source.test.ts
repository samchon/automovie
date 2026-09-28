/** Window source checks across every exterior window opening. */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { Windows } from "../models/windows";

const openings = [
  ["living-front-window", "double-hung", 2.8, 1.6, 3],
  ["bedroom-two-front-window", "double-hung", 2.1, 1.4, 2],
  ["stair-front-window", "fixed", 0.78, 1.1, 1],
  ["bedroom-three-front-window", "double-hung", 2.1, 1.4, 2],
  ["kitchen-rear-window", "double-hung", 1.2, 1.15, 1],
  ["family-rear-window", "double-hung", 2, 1.55, 2],
  ["primary-rear-window", "double-hung", 2.4, 1.4, 2],
  ["living-left-window", "double-hung", 1.2, 1.55, 1],
  ["primary-left-window", "double-hung", 1.6, 1.4, 2],
  ["family-right-window", "double-hung", 1.7, 1.55, 2],
  ["tub-right-window", "awning", 0.9, 0.75, 1],
  ["garage-right-window", "fixed", 1.6, 0.8, 2],
] as const;

const bounds = (positions: number[]): [number, number][] => {
  const result: [number, number][] = [[Infinity, -Infinity], [Infinity, -Infinity], [Infinity, -Infinity]];
  for (let i = 0; i < positions.length; i += 3)
    for (let axis = 0; axis < 3; axis++) {
      result[axis]![0] = Math.min(result[axis]![0], positions[i + axis]!);
      result[axis]![1] = Math.max(result[axis]![1], positions[i + axis]!);
    }
  return result;
};

void test("all twelve window openings receive separate closed members without occupied-volume overlap", () => {
  const builder = new Windows();
  let partCount = 0;
  for (const [id, kind, width, height, columns] of openings) {
    const { model, faceByPart } = builder.build({ id, kind, width, height, columns });
    assert.equal(model.id, `window:${id}`);
    assert.equal(Object.keys(faceByPart).length, model.parts.length);
    const partBounds = model.parts.map((part) => {
      assert.equal(part.geometry.type, "mesh");
      if (part.geometry.type !== "mesh") throw new Error("window part has no mesh");
      const mesh = part.geometry.mesh;
      assert.equal(mesh.positions.length, 72, `${id}/${part.id} must have six independent faces`);
      assert.equal(mesh.normals?.length, mesh.positions.length, `${id}/${part.id} normals`);
      assert.equal(mesh.uvs?.length, mesh.positions.length / 3 * 2, `${id}/${part.id} UVs`);
      assert.equal(mesh.indices?.length, 36, `${id}/${part.id} triangles`);
      assert.ok(faceByPart[part.id], `${id}/${part.id} binding`);
      return bounds(mesh.positions);
    });
    for (let i = 0; i < partBounds.length; i++)
      for (let j = i + 1; j < partBounds.length; j++) {
        const overlap = partBounds[i]!.map((range, axis) =>
          Math.min(range[1], partBounds[j]![axis]![1]) - Math.max(range[0], partBounds[j]![axis]![0]));
        assert.ok(overlap.some((span) => span <= 1e-7), `${id}: ${model.parts[i]!.id} intersects ${model.parts[j]!.id}`);
      }
    const faces = new Set(Object.values(faceByPart));
    assert.ok(faces.has("frame") && faces.has("sash") && faces.has("exterior-trim") && faces.has("interior-sill"));
    assert.equal(faces.has("obscured-glass"), kind === "awning");
    partCount += model.parts.length;
  }
  assert.equal(partCount, 688);
});

void test("sash motion stays in the designed tracks and awning reservation", () => {
  const builder = new Windows();
  const moving = builder.build({ id: "moving", kind: "double-hung", width: 1.2, height: 1.15, columns: 1, lowerTravel: 0.2 });
  const lower = moving.model.parts.find((part) => part.id === "unit-1/lower-sash/sash-bottom");
  assert.equal(lower?.geometry.type, "mesh");
  if (lower?.geometry.type !== "mesh") throw new Error("missing lower sash");
  assert.ok(Math.abs(bounds(lower.geometry.mesh.positions)[1]![0] - 0.26) < 1e-8);
  const awning = builder.build({ id: "tub", kind: "awning", width: 0.9, height: 0.75, columns: 1, awningAngle: Math.PI / 8 });
  const movingParts = awning.model.parts.filter((part) => part.id.startsWith("awning-sash/"));
  const greatestZ = Math.max(...movingParts.flatMap((part) => {
    if (part.geometry.type !== "mesh") throw new Error("awning has no mesh");
    return part.geometry.mesh.positions.filter((_, index) => index % 3 === 2);
  }));
  assert.ok(greatestZ > 0.15 && greatestZ < 0.25, `awning extension ${greatestZ}`);
  assert.throws(() => builder.build({ id: "too-wide", kind: "awning", width: 0.9, height: 0.75, columns: 1, awningAngle: Math.PI / 7 }), /outside reviewed range/);
  assert.throws(() => builder.build({ id: "too-narrow", kind: "fixed", width: 0.35, height: 0.75, columns: 1 }), /below reviewed minimum/);
});
