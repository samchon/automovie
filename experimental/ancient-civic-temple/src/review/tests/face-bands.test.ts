/**
 * src/geometry/face-bands.ts: 수직 면의 지붕 선 띠 분할과 수평면 분할.
 * fixture: 수평 지붕선이 면을 가로지르는 경우(볼록 세 띠), 경사 지붕선이 면 윗변과 교차하는 경우
 * (추가 절단점), 빈 소유 띠 생략, 네 꼭짓점이 아닌 면(통과), 수평면이 위·아래·경계 1e-6 m 안에
 * 있는 경우, 얇은 띠(1mm 두께), 결정성. 면적 합과 법선 방향이 보존되어야 한다.
 * 오목·구멍·열린 경계는 정의역 밖이다(볼록 사다리꼴 면만 받는다).
 */
import assert from "node:assert/strict";
import test from "node:test";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { splitAtLevel, splitVerticalFace } from "../../geometry/face-bands";
import { faceArea, near, v } from "./fixtures";

const owners = { below: "below", within: "within", above: "above" };
/** prism 옆면 순서 [a아래, a위, b위, b아래]. x 0..4, y 0..5, z=0 평면. */
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
