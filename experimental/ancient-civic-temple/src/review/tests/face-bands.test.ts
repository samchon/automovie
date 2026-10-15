/**
 * src/geometry/face-bands.ts: roof-line bands on vertical faces and horizontal-face splitting.
 * Fixtures: a horizontal roof line crossing a face (three convex bands), a
 * sloping roof line crossing the upper edge (extra cut point), omitted empty
 * ownership bands, non-quadrilateral faces (passed through), horizontal faces
 * above, below or within 1e-6 m of a boundary, thin bands (1mm), and determinism.
 * Total area and normal direction must survive. Concavity, holes and open
 * boundaries are outside the domain, which accepts only convex trapezoidal faces.
 */
import assert from "node:assert/strict";
import test from "node:test";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { splitVerticalFace } from "../../geometry/splitVerticalFace";
import { splitAtLevel } from "../../geometry/splitAtLevel";
import { faceArea } from "./faceArea";
import { near } from "./near";
import { v } from "./v";

const owners = { below: "below", within: "within", above: "above" };
/** Prism side-face order [a-bottom, a-top, b-top, b-bottom]; x 0..4, y 0..5, z=0 plane. */
const face = [v(0, 0, 0), v(0, 5, 0), v(4, 5, 0), v(4, 0, 0)];
const normal = (c: readonly IAutoMovieVector3[]) => {
  const u = [c[1]!.x - c[0]!.x, c[1]!.y - c[0]!.y, c[1]!.z - c[0]!.z];
  const w = [c[c.length - 1]!.x - c[0]!.x, c[c.length - 1]!.y - c[0]!.y, c[c.length - 1]!.z - c[0]!.z];
  return Math.sign(u[0]! * w[1]! - u[1]! * w[0]!);
};

void test("level roof line crossing the face: three bands with the exact heights, area and normal kept", () => {
  const bands = splitVerticalFace(face, { x: 0, z: 0, constant: 3 }, 0.2, owners);
  assert.deepEqual(bands.map((b) => b.surface), ["below", "within", "above"]);
  const heights = bands.map((b) => [Math.min(...b.corners.map((c) => c.y)), Math.max(...b.corners.map((c) => c.y))]);
  near(heights[0]![1]!, 2.8);
  near(heights[1]![0]!, 2.8);
  near(heights[1]![1]!, 3);
  near(heights[2]![1]!, 5);
  near(bands.reduce((s, b) => s + faceArea(b.corners), 0), 20);
  for (const b of bands) assert.equal(normal(b.corners), normal(face));
});

void test("sloped roof line crossing the face top adds a cut where the line leaves the face", () => {
  const bands = splitVerticalFace(face, { x: 1, z: 0, constant: 2 }, 0.3, owners);
  near(bands.reduce((s, b) => s + faceArea(b.corners), 0), 20);
  assert.ok(bands.some((b) => b.surface === "above"));
  assert.ok(bands.length > 3, "extra columns where the roof line crosses the face top");
});

void test("empty owner bands are not emitted; non-quad faces pass through as below", () => {
  const bands = splitVerticalFace(face, { x: 0, z: 0, constant: 3 }, 0.2, { below: "b", within: "", above: "a" });
  assert.deepEqual(bands.map((b) => b.surface), ["b", "a"]);
  near(bands.reduce((s, b) => s + faceArea(b.corners), 0), 20 - 4 * 0.2);
  const triangle = [v(0, 0, 0), v(0, 1, 0), v(1, 0, 0)];
  assert.deepEqual(splitVerticalFace(triangle, { x: 0, z: 0, constant: 3 }, 0.2, owners), [{ surface: "below", corners: triangle }]);
});

void test("thin band (1 mm roof thickness) is kept", () => {
  const bands = splitVerticalFace(face, { x: 0, z: 0, constant: 3 }, 0.001, owners);
  near(faceArea(bands.find((b) => b.surface === "within")!.corners), 0.004);
});

void test("splitAtLevel: across, above, below, and within 1e-6 m of an edge", () => {
  const f = { surface: "s", corners: face };
  const two = splitAtLevel(f, 2, "lo", "hi");
  assert.deepEqual(two.map((p) => p.surface), ["lo", "hi"]);
  near(faceArea(two[0]!.corners), 8);
  near(faceArea(two[1]!.corners), 12);
  for (const p of two) assert.equal(normal(p.corners), normal(face));
  assert.deepEqual(splitAtLevel(f, 6, "lo", "hi").map((p) => p.surface), ["lo"]);
  assert.deepEqual(splitAtLevel(f, -1, "lo", "hi").map((p) => p.surface), ["hi"]);
  assert.deepEqual(splitAtLevel(f, 5 - 5e-7, "lo", "hi").map((p) => p.surface), ["lo"]);
});

void test("deterministic and input-preserving", () => {
  const before = JSON.stringify(face);
  const plane = { x: 0.3, z: 0, constant: 2.5 };
  assert.deepEqual(splitVerticalFace(face, plane, 0.2, owners), splitVerticalFace(face, plane, 0.2, owners));
  assert.equal(JSON.stringify(face), before);
});
