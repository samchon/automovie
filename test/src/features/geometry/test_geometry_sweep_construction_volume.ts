import {
  type IAutoMovieResolvedBone,
  type IAutoMovieSurfaceConstruction,
  type IAutoMovieSurfaceNetwork,
  type IAutoMovieSurfaceRig,
  rigAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { sweepBranchedBody } from "../internal/sweepBranchedBody";
import { sweepBranchedSkeleton } from "../internal/sweepBranchedSkeleton";

/**
 * Observation slots preserve the actual volume-settled resweep of one bent joint.
 *
 * Scenarios:
 *
 * 1. Cold-compile an arm's actual upper/lower-bone sweep with and without observations, preserving volume, and compare every posed control and target.
 * 2. Compare a third cold rig without volume preservation to require an active joint-scale correction; the observed construction stays at rest while the arm moves.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs real joint volume integration, settling and resweep in both observed/unobserved rigs; an uncorrected control distinguishes inactive volume preservation, and the rest snapshot is checked after motion.
 * @evidence contracts/testing.md#independent-expectations Observation must leave the same network's complete volume-corrected output exactly equal; a bent joint's volume scaling must differ from the unpreserved negative control. Existing volume tests independently verify the preserved volume itself.
 * @evidence contracts/testing.md#distinguishing-cases Covers active bound-joint volume correction, observation present/absent, a no-volume negative control and rest snapshot lifetime. The full branched no-volume pose and curve/filter cases have separate entries; simultaneous five-joint integration is retained as a separate campaign integration run.
 * @evidence contracts/testing.md#execution-ownership A portable synchronous test_geometry_sweep_construction_volume entry; fixture extraction, three cold compiles and all poses remain inside its measured operation. No process, browser, renderer or GPU starts.
 */
export function test_geometry_sweep_construction_volume(): void {
  const source: IAutoMovieSurfaceNetwork = sweepBranchedBody();
  const count: IAutoMovieSurfaceNetwork.ICounts = {
    lowest: 4,
    low: 4,
    medium: 4,
    high: 4,
  };
  const network: IAutoMovieSurfaceNetwork = {
    sweeps: { arm: source.sweeps.sideLeft! },
    patches: [
      {
        type: "sweep",
        name: "arm",
        sweep: "arm",
        u: [0, 1],
        v: [0, 1],
        rows: count,
        columns: { ...count, medium: 8 },
      },
    ],
  };
  const skeleton: ReturnType<typeof sweepBranchedSkeleton> =
    sweepBranchedSkeleton();
  const posed: IAutoMovieResolvedBone[] = skeleton.pose({
    leftUpperArm: { x: 0, y: 0, z: 0.25881904510252074, w: 0.9659258262890683 },
    leftLowerArm: { x: 0, y: 0, z: 0.7071067811865475, w: 0.7071067811865476 },
  });
  const common: Parameters<typeof rigAutoMovieSurfaceNetwork>[0] = {
    network,
    tier: "medium",
    rest: skeleton.rest,
    bindings: { sweeps: { arm: skeleton.bindings.sweeps.sideLeft! } },
  };
  const base: IAutoMovieSurfaceRig = rigAutoMovieSurfaceNetwork({
    ...common,
    preserveVolume: true,
  });
  const watch: IAutoMovieSurfaceRig = rigAutoMovieSurfaceNetwork({
    ...common,
    preserveVolume: true,
    construction: { station: 16, line: 16, feature: 8, curve: 8 },
  });
  const plain: IAutoMovieSurfaceRig = rigAutoMovieSurfaceNetwork({
    ...common,
    preserveVolume: false,
  });
  const snapshot: number[] = watch.construction.flatMap(
    (entry: IAutoMovieSurfaceConstruction): number[] => entry.points,
  );
  const positions: Float64Array = new Float64Array(
    base.cage.cage.positions.length,
  );
  const targets: Float64Array = new Float64Array(positions.length);
  const observedPositions: Float64Array = new Float64Array(positions.length);
  const observedTargets: Float64Array = new Float64Array(positions.length);
  const unpreservedTargets: Float64Array = new Float64Array(positions.length);
  base.pose(posed, positions, targets);
  watch.pose(posed, observedPositions, observedTargets);
  plain.pose(posed, new Float64Array(positions.length), unpreservedTargets);
  TestValidator.predicate(
    "observation preserves settled volume pose exactly",
    positions.every((value: number, i: number): boolean =>
      nclose(value, observedPositions[i]!, 0),
    ) &&
      targets.every((value: number, i: number): boolean =>
        nclose(value, observedTargets[i]!, 0),
      ),
  );
  TestValidator.predicate(
    "volume correction is active",
    targets.some(
      (value: number, i: number): boolean =>
        Math.abs(value - unpreservedTargets[i]!) > 1e-5,
    ),
  );
  TestValidator.predicate(
    "joint moves generated points",
    targets.some(
      (value: number, i: number): boolean =>
        Math.abs(value - base.cage.targets[i]!) > 0.05,
    ),
  );
  TestValidator.predicate(
    "construction remains at rest",
    watch.construction
      .flatMap((entry: IAutoMovieSurfaceConstruction): number[] => entry.points)
      .every((value: number, i: number): boolean =>
        nclose(value, snapshot[i]!, 0),
      ),
  );
}
