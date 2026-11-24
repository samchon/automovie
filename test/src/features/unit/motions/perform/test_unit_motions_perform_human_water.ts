import { AutoMovieGravity } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieMotionHumanWater,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanWater } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** The sphere's radius, metres. */
const R: number = 0.1;

/** Its volume, cubic metres. */
const V: number = (4 / 3) * Math.PI * R ** 3;

/** The sphere's drag coefficient (`resolveHydrodynamicForce.DRAG`). */
const DRAG: number = 0.47;

/** No turn. */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/** A body of one sphere on the hips, its mass given. */
const sphere = (mass: number): HumanWater.IBody => ({
  profile: {
    mass,
    segments: [
      {
        bone: "hips",
        neutral: { position: { x: 0, y: 0, z: 0 }, rotation: IDENTITY },
        mass,
        centerOfMass: { x: 0, y: 0, z: 0 },
        inertia: { x: 1, y: 1, z: 1 },
        inertiaRotation: IDENTITY,
        shapes: [
          {
            id: "ball",
            material: "flesh",
            transform: { position: { x: 0, y: 0, z: 0 }, rotation: IDENTITY },
            kind: "sphere",
            radius: R,
          },
        ],
      },
    ],
  },
  massModel: { segments: [{ bone: "hips", point: { x: 0, y: 0, z: 0 } }] },
  measure: { stature: 1.8 },
});

/** The hips at a height, and a foot under the water. */
const posed = (
  height: number,
): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
  new Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>([
    [
      "hips",
      {
        bone: "hips",
        localRotation: IDENTITY,
        worldPosition: { x: 0, y: height, z: 0 },
        worldRotation: IDENTITY,
      },
    ],
    [
      "leftFoot",
      {
        bone: "leftFoot",
        localRotation: IDENTITY,
        worldPosition: { x: 0, y: -1, z: 0 },
        worldRotation: IDENTITY,
      },
    ],
  ]);

/** Still fresh water at height 0. */
const WATER: IAutoMovieMotionHumanWater = { surface: 0 };

/**
 * `HumanWater` sums the water's forces on a posed body, segment by segment as
 * the engine's spheres of their colliders' volume, floats it where its buoyancy
 * meets its weight and glides it under quadratic drag.
 *
 * A body of one 0.1 m sphere on the hips.
 *
 * Scenarios:
 *
 * 1. Centred on the surface, half the sphere is under: buoyancy `ρ g V / 2`, and
 *    moving at 1 m/s along +X its drag is `½ ρ C_d (π r² / 2)` against it.
 * 2. A fin of 0.02 m² on a submerged foot, its blade facing up, adds `½ ρ 1.17 ·
 *    0.02 · 2²` against a 2 m/s sink, and nothing to a level glide.
 * 3. A body of half the sphere's water mass, posed 1 m up, floats once lowered 1
 *    m, to a micrometre; one heavier than its volume of water sinks.
 * 4. A submerged glide from 2 m/s slows as quadratic drag does, `v0 / (1 + k v0
 *    t)` with `k = ½ ρ C_d π r² / m`.
 */
export function test_unit_motions_perform_human_water(): void {
  const g: number = AutoMovieGravity.STANDARD;
  const half: IAutoMovieMotionHumanWater.ISum = HumanWater.sum(
    sphere(2),
    posed(0),
    { x: 1, y: 0, z: 0 },
    WATER,
  );
  TestValidator.predicate(
    "half under",
    nclose(half.volume, V, 1e-12) &&
      nclose(half.submerged, V / 2, 1e-12) &&
      vclose(half.buoyancy, { x: 0, y: (1000 * g * V) / 2, z: 0 }, 1e-9) &&
      vclose(
        half.drag,
        { x: -0.5 * 1000 * DRAG * ((Math.PI * R * R) / 2), y: 0, z: 0 },
        1e-9,
      ),
  );

  const sinking: IAutoMovieVector3 = { x: 0, y: -2, z: 0 };
  const plain: IAutoMovieVector3 = HumanWater.sum(
    sphere(2),
    posed(-1),
    sinking,
    WATER,
  ).drag;
  const finned: IAutoMovieVector3 = HumanWater.sum(
    sphere(2),
    posed(-1),
    sinking,
    {
      ...WATER,
      fins: 0.02,
    },
  ).drag;
  const level: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  TestValidator.predicate(
    "a fin across its face",
    nclose(finned.y - plain.y, 0.5 * 1000 * 1.17 * 0.02 * 4, 1e-9) &&
      vclose(
        HumanWater.sum(sphere(2), posed(-1), level, { ...WATER, fins: 0.02 })
          .drag,
        HumanWater.sum(sphere(2), posed(-1), level, WATER).drag,
        1e-12,
      ),
  );

  const floating: number | null = HumanWater.float(
    sphere((1000 * V) / 2),
    posed(1),
    WATER,
  );
  TestValidator.predicate(
    "floats half under",
    floating !== null && Math.abs(floating + 1) < 1e-6,
  );
  TestValidator.equals(
    "sinks",
    HumanWater.float(sphere(2 * 1000 * V), posed(1), WATER),
    null,
  );

  const mass: number = 4;
  const k: number = (0.5 * 1000 * DRAG * Math.PI * R * R) / mass;
  const glide: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
    HumanWater.glide(sphere(mass), posed(-1), level, 2, 1, WATER);
  TestValidator.predicate(
    "quadratic drag",
    nclose(glide.at(1).x[0]!, 2 / (1 + k * 2), 1e-6) &&
      nclose(glide.at(1).x[1]!, Math.log(1 + k * 2) / k, 1e-6),
  );
}
