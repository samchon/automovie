import { AutoMovieSolidVector as V } from "@automovie/engine";
import { AutoMovieHumanTrunkCarrier } from "@automovie/human";
import type {
  IAutoMovieBlendCrossJet,
  IAutoMovieSolidSurface,
  AutoMovieVector3Tuple as Point,
} from "@automovie/interface";
import { strict as assert } from "node:assert";

/**
 * The torso depth line consumes the parent's position, departure and curvature
 * exactly, then reaches the independently defined plane.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the actual projected meridian and the anchor read over its full interval.
 * @evidence contracts/development/testing.md#independent-expectations Uses a known-depth planar chart, with exact control derivatives and interior finite-difference comparison.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks nonzero depth displacement, nonzero depth slope and nonzero depth curvature, and refusal outside the carrier domain.
 * @evidence contracts/development/testing.md#execution-ownership Small analytic case with no reference files and no mesh.
 */
export function test_human_torso_carrier_rail(): void {
  const zero: Point = [0, 0, 0];
  const near: IAutoMovieSolidSurface.IJet = {
    p: [5, 7, 105],
    u: [10, -2, -1],
    v: [0, 1, 0],
    uu: [1, -4, 0.75],
    uv: zero,
    vv: zero,
  };
  const plane = (x: number, y: number): IAutoMovieSolidSurface.IJet => ({
    p: [x, y, 100],
    u: [1, 0, 0],
    v: [0, 1, 0],
    uu: zero,
    uv: zero,
    vv: zero,
  });
  const line = AutoMovieHumanTrunkCarrier.prepare({
    origin: zero,
    reach: 100,
    length: 10,
    rail: near,
  });
  const read = line.bind(plane);
  assert.ok(read !== null);
  const start: IAutoMovieBlendCrossJet = read(0)!;
  const scale: number = 10 / Math.sqrt(105);
  assert.ok(V.norm(V.sub(start.point, near.p)) < 1e-12);
  assert.ok(V.norm(V.sub(start.first, V.scale(near.u, scale))) < 1e-12);
  assert.ok(
    V.norm(V.sub(start.second, V.scale(near.uu, scale * scale))) < 1e-12,
  );

  const end: IAutoMovieBlendCrossJet = read(1)!;
  assert.equal(end.point[2], 100);
  assert.equal(end.first[2], 0);
  assert.equal(end.second[2], 0);
  const h: number = 1e-4;
  const a: Point = read(0.5 - h)!.point;
  const b: IAutoMovieBlendCrossJet = read(0.5)!;
  const c: Point = read(0.5 + h)!.point;
  const first: Point = V.scale(V.sub(c, a), 1 / (2 * h));
  const second: Point = V.scale(
    V.combine([
      [1, a],
      [-2, b.point],
      [1, c],
    ]),
    1 / (h * h),
  );
  assert.ok(V.norm(V.sub(first, b.first)) < 1e-6);
  assert.ok(V.norm(V.sub(second, b.second)) < 1e-5);
  assert.equal(
    line.bind(() => null),
    null,
  );

  const compact = AutoMovieHumanTrunkCarrier.prepare({
    origin: zero,
    reach: 100,
    length: 10,
    anchor: 2.5,
    rail: near,
  }).bind(plane);
  assert.ok(compact !== null);
  assert.ok(V.norm(V.sub(compact(0)!.second, start.second)) < 1e-12);
  assert.equal(compact(0.25)!.point[2], 100);
  assert.equal(compact(0.25)!.first[2], 0);
  assert.equal(compact(0.25)!.second[2], 0);
}
