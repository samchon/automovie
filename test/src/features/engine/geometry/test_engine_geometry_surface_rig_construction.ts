import { AutoMovieEngineSweep } from "@automovie/engine";
import type {
  IAutoMovieResolvedBone,
  IAutoMovieSurfaceConstruction,
  IAutoMovieSurfaceNetwork,
  IAutoMovieSurfaceRig,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { sweepBranchedBody } from "../../internal/sweepBranchedBody";
import { sweepBranchedSkeleton } from "../../internal/sweepBranchedSkeleton";

/**
 * A surface rig's construction snapshot (`construction` sampling of
 * `rigSurfaceNetwork`) observes without changing the posed cage.
 *
 * Fixture: the branched body at the medium tier without volume preservation,
 * posed with the upper arm turned 30 degrees, the forearm 90 and the shin 60;
 * the observed rig samples 16 stations and lines and 8 features and curves.
 *
 * Scenarios:
 *
 * 1. The observed and plain rigs write identical controls and targets.
 * 2. The pose moves some target by more than 0.05 m.
 * 3. The observed construction keeps its rest coordinates after the pose.
 * 4. The left arm sweep alone (4 rows, 8 medium columns), posed with the arm bent,
 *    preserving volume: the observed and plain rigs write identical cages; the
 *    volume correction is active (targets differ from the unpreserved rig's by
 *    more than 1e-5); the arm moves by more than 0.05 m; the construction
 *    stays at rest.
 */
export function test_engine_geometry_surface_rig_construction(): void {
  const network: IAutoMovieSurfaceNetwork = sweepBranchedBody();
  const skeleton: ReturnType<typeof sweepBranchedSkeleton> = sweepBranchedSkeleton();
  const posed: IAutoMovieResolvedBone[] = skeleton.pose({
    leftUpperArm: { x: 0, y: 0, z: Math.sin(Math.PI / 12), w: Math.cos(Math.PI / 12) },
    leftLowerArm: { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
    leftLowerLeg: { x: 0.5, y: 0, z: 0, w: Math.sqrt(3) / 2 },
  });
  const rig = (observe: boolean): IAutoMovieSurfaceRig =>
    AutoMovieEngineSweep.rigSurfaceNetwork({
      network,
      tier: "medium",
      bindings: skeleton.bindings,
      rest: skeleton.rest,
      preserveVolume: false,
      ...(observe ? { construction: { station: 16, line: 16, feature: 8, curve: 8 } } : {}),
    });
  const plain: IAutoMovieSurfaceRig = rig(false);
  const watched: IAutoMovieSurfaceRig = rig(true);
  const points = (): number[] =>
    watched.construction.flatMap((entry: IAutoMovieSurfaceConstruction): number[] => entry.points);
  const rest: number[] = points();
  const pose = (r: IAutoMovieSurfaceRig): [Float64Array, Float64Array] => {
    const positions: Float64Array = new Float64Array(plain.cage.cage.positions.length);
    const targets: Float64Array = new Float64Array(positions.length);
    r.pose(posed, positions, targets);
    return [positions, targets];
  };
  const [p0, t0] = pose(plain);
  const [p1, t1] = pose(watched);

  // 1.
  TestValidator.equals("controls", [...p1], [...p0]);
  TestValidator.equals("targets", [...t1], [...t0]);

  // 2.
  TestValidator.predicate(
    "moved",
    t0.some((v: number, i: number): boolean => Math.abs(v - plain.cage.targets[i]!) > 0.05),
  );

  // 3.
  TestValidator.equals("rest snapshot", points(), rest);

  // 4.
  const count: IAutoMovieSurfaceNetwork.ICounts = { lowest: 4, low: 4, medium: 4, high: 4 };
  const arm: Parameters<typeof AutoMovieEngineSweep.rigSurfaceNetwork>[0] = {
    network: {
      sweeps: { arm: network.sweeps.sideLeft! },
      patches: [
        {
          type: "sweep",
          name: "arm",
          sweep: "arm",
          u: { start: 0, end: 1 },
          v: { start: 0, end: 1 },
          rows: count,
          columns: { ...count, medium: 8 },
        },
      ],
    },
    tier: "medium",
    rest: skeleton.rest,
    bindings: { sweeps: { arm: skeleton.bindings.sweeps.sideLeft! } },
  };
  const bent: IAutoMovieResolvedBone[] = skeleton.pose({
    leftUpperArm: { x: 0, y: 0, z: Math.sin(Math.PI / 12), w: Math.cos(Math.PI / 12) },
    leftLowerArm: { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
  });
  const settled: IAutoMovieSurfaceRig = AutoMovieEngineSweep.rigSurfaceNetwork({ ...arm, preserveVolume: true });
  const observed: IAutoMovieSurfaceRig = AutoMovieEngineSweep.rigSurfaceNetwork({
    ...arm,
    preserveVolume: true,
    construction: { station: 16, line: 16, feature: 8, curve: 8 },
  });
  const free: IAutoMovieSurfaceRig = AutoMovieEngineSweep.rigSurfaceNetwork({ ...arm, preserveVolume: false });
  const armRest: number[] = observed.construction.flatMap((e: IAutoMovieSurfaceConstruction): number[] => e.points);
  const write = (r: IAutoMovieSurfaceRig): [Float64Array, Float64Array] => {
    const p: Float64Array = new Float64Array(settled.cage.cage.positions.length);
    const t: Float64Array = new Float64Array(p.length);
    r.pose(bent, p, t);
    return [p, t];
  };
  const [sp, st] = write(settled);
  const [op, ot] = write(observed);
  const [, ft] = write(free);
  TestValidator.equals("arm cage", [[...op], [...ot]], [[...sp], [...st]]);
  TestValidator.predicate("volume active", st.some((v: number, i: number): boolean => Math.abs(v - ft[i]!) > 1e-5));
  TestValidator.predicate(
    "arm moved",
    st.some((v: number, i: number): boolean => Math.abs(v - settled.cage.targets[i]!) > 0.05),
  );
  TestValidator.equals(
    "arm construction at rest",
    observed.construction.flatMap((e: IAutoMovieSurfaceConstruction): number[] => e.points),
    armRest,
  );
}
