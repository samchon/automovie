import { type IAutoMovieSweep, type IAutoMovieSweepSurface } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieSweepRig } from "../../../../packages/engine/src/geometry/sweep/IAutoMovieSweepRig";
import { rigAutoMovieSweep } from "../../../../packages/engine/src/geometry/sweep/rigAutoMovieSweep";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/**
 * A geometric probe differentiates the same fixed-footprint field as its point writer.
 *
 * Scenarios:
 *
 * 1. On an elliptic sweep whose two axes change oppositely along its spine, check both ends and an interior point against the documented radius quadrature and finite differences, including their clamped endpoint spans.
 * 2. The omitted cell retains the raw normal and axial derivative. The nonzero asymmetric cell changes at least one derivative, distinguishing a silently ignored footprint.
 * 3. Replacing the girth factor immediately refreshes the filtered normal and derivative; invalid cells and registration after sealing are refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs actual sweep sample writers and probe arrays before and after girth correction, comparing all six differential outputs and all three point coordinates.
 * @evidence contracts/testing.md#independent-expectations The public scalar profile, frame, scale and documented trapezoid weights define an independent geometric quadrature; a central difference with the surface's step defines the expected normal and axial derivative. The 5e-9 differential tolerance covers cancellation at a 1e-4 parameter step and does not assert continuous footprint-size interpolation.
 * @evidence contracts/testing.md#distinguishing-cases Covers asymmetric nonzero and omitted cells, u=0/interior/u=1, an active girth change, negative/NaN/infinite reaches and sealed registration. Registry and network tests separately own cell resolution, whole-curve regeneration, bridges, topology and posing.
 * @evidence contracts/testing.md#execution-ownership A portable synchronous test_geometry_sweep_boundary_probe entry; all sweep compilation and assertions run inside the test without a host or renderer.
 */
export function test_geometry_sweep_boundary_probe(): void {
  const sweep: IAutoMovieSweep = {
    spine: { points: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }], normal: { x: 0, y: 0, z: 1 } },
    stations: [
      { at: 0, section: { type: "superellipse", right: 1, left: 1, up: 2, down: 2, exponents: [2, 2, 2, 2] } },
      { at: 1, section: { type: "superellipse", right: 1.5, left: 1.5, up: 1, down: 1, exponents: [2, 2, 2, 2] } },
    ],
  };
  const cell: readonly [number, number, number, number] = [0.125, 0.25, 0.0625, 0.125];
  const v: number = 0.071;
  for (const u of [0, 0.25, 1]) {
    const rig: IAutoMovieSweepRig = rigAutoMovieSweep({ sweep, preserveVolume: false });
    for (const invalid of [-1, NaN, Infinity])
      TestValidator.predicate("invalid probe cell is refused", throwsError((): void => { rig.probe(u, v, [invalid, 0, 0, 0]); }));
    const write: (out: Float64Array, at: number) => void = rig.sample(u, v, cell);
    const filtered: number = rig.probe(u, v, cell);
    const raw: number = rig.probe(u, v);
    rig.seal();
    const rawNormal: ReturnType<IAutoMovieSweepSurface["normal"]> = rig.surface.normal(u, v);
    const rawAlong: ReturnType<IAutoMovieSweepSurface["along"]> = rig.surface.along(u, v);
    const rawExpected: number[] = [rawNormal.x, rawNormal.y, rawNormal.z, rawAlong.x, rawAlong.y, rawAlong.z];
    TestValidator.predicate("omitted footprint preserves raw meaning", rawExpected.every((value: number, i: number): boolean => nclose(value, rig.probes[6 * raw + i]!, 5e-9)));
    TestValidator.predicate("filtered derivative differs from the raw control", rawExpected.some((value: number, i: number): boolean => Math.abs(value - rig.probes[6 * filtered + i]!) > 0.001));
    for (const corrected of [false, true]) {
      function girth(at: number): number { return corrected ? 1 + 0.1 * at : 1; }
      if (corrected) rig.girth(girth);
      const expected: number[] = probe(rig.surface, u, v, cell, girth);
      TestValidator.predicate("probe follows the fixed-cell quadrature", expected.every((value: number, i: number): boolean => nclose(value, rig.probes[6 * filtered + i]!, 5e-9)));
      const actual: Float64Array = new Float64Array(3);
      write(actual, 0);
      const position: number[] = point(rig.surface, u, v, cell, girth);
      TestValidator.predicate("sample follows the same quadrature", position.every((value: number, i: number): boolean => nclose(value, actual[i]!, 1e-12)));
    }
    TestValidator.predicate("a sealed probe cannot register", throwsError((): void => { rig.probe(u, v, cell); }));
  }
}

/** Independent application of the documented quadrature to the scalar surface profile. */
function point(surface: IAutoMovieSweepSurface, u: number, v: number, cell: readonly [number, number, number, number], girth: (u: number) => number): number[] {
  function weights(below: number, above: number): Array<[number, number]> { return below + above === 0 ? [[0, 1]] : [[-below / 2, below / (2 * (below + above))], [0, 0.5], [above / 2, above / (2 * (below + above))]]; }
  let radius: number = 0;
  for (const [du, wu] of weights(cell[0], cell[1])) {
    const at: number = Math.max(0, Math.min(1, u + du));
    for (const [dv, wv] of weights(cell[2], cell[3]))
      radius += wu * wv * surface.profile(at, v + dv) * surface.scale(at) * girth(at);
  }
  const frame: ReturnType<IAutoMovieSweepSurface["frame"]> = surface.frame(u);
  const x: number = radius * Math.cos(2 * Math.PI * v);
  const y: number = radius * Math.sin(2 * Math.PI * v);
  return ["x", "y", "z"].map((axis: string): number => {
    const key: "x" | "y" | "z" = axis as "x" | "y" | "z";
    return frame.origin[key] + frame.x[key] * x + frame.y[key] * y;
  });
}

/** Central differences of the independent geometric quadrature, with the source step. */
function probe(surface: IAutoMovieSweepSurface, u: number, v: number, cell: readonly [number, number, number, number], girth: (u: number) => number): number[] {
  const step: number = surface.step;
  const a: number = Math.max(0, u - step);
  const b: number = Math.min(1, u + step);
  const plus: number[] = point(surface, u, v + step, cell, girth);
  const minus: number[] = point(surface, u, v - step, cell, girth);
  const high: number[] = point(surface, b, v, cell, girth);
  const low: number[] = point(surface, a, v, cell, girth);
  const around: number[] = plus.map((value: number, i: number): number => value - minus[i]!);
  const along: number[] = high.map((value: number, i: number): number => (value - low[i]!) / (b - a));
  const normal: number[] = [around[1]! * along[2]! - around[2]! * along[1]!, around[2]! * along[0]! - around[0]! * along[2]!, around[0]! * along[1]! - around[1]! * along[0]!];
  const size: number = Math.hypot(...normal);
  return [...normal.map((value: number): number => value / size), ...along];
}
