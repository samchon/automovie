import type {
  IAutoMovieMotionHumanPerformanceState,
  IAutoMoviePhysicalShape,
  IAutoMovieProjectileFirstContact,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanPropSweepColliders } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { standingPerformanceState } from "../../../internal/fixtures/standingPerformanceState";

/**
 * How far a reach, size or width may stand from its closed form, metres: sums
 * and square roots of decimetre values, far above their rounding.
 */
const SIZE: number = 1e-12;

/**
 * How far a carried point's velocity may stand from its closed form, m/s: the
 * central difference over 1e-6 s cancels to about 1e-16 / 1e-6 = 1e-10 and its
 * truncation, ω³ r h² / 6, is far below.
 */
const VELOCITY: number = 1e-8;

/** No turn. */
const ORIGIN: IAutoMovieRigidTransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
};

/** A shape at a place. */
const at = (
  position: IAutoMovieVector3,
): IAutoMovieRigidTransform => ({ ...ORIGIN, position });

/**
 * `HumanPropSweepColliders` reads what a flight sweep needs of colliders: how
 * far a prop's shapes reach, a collider culled by a distance bound, a carried
 * point's velocity, a shape's least thickness, a hull's inscribed width, and
 * the thinnest collider a flight may meet.
 *
 * Scenarios:
 *
 * 1. A ball of 0.1 m at (0.3, 0.4, 0) reaches 0.6 m; a capsule of half length
 *    0.2 and radius 0.05 at the origin 0.25; a box of half extents (0.1, 0.2,
 *    0.2) at (0, 0, 1) 1.3; a hull whose farthest vertex is 2 m off 2; together
 *    the farthest, 2; nothing, 0.
 * 2. A culled collider answers with the bound where it exceeds the projectile's
 *    radius, without reading the collider, and with the collider's distance or
 *    nearest point within it.
 * 3. A point a metre off a frame turning 2 rad/s about `+Y` moves at (0, 0, -2);
 *    on a frame moving at (3, 0, 0), at (3, 0, 0).
 * 4. A ball's and a capsule's thickness is their diameter, a box's its least full
 *    extent, a unit cube hull's its width, 1; a flat hull, an empty one and a
 *    non-hull have no width.
 * 5. The thinnest collider among props and the people but the launcher is the
 *    least size of the people's non-finger shapes or the props'; with only the
 *    launcher and no prop, no collider is thin.
 */
export async function test_unit_motions_perform_sweep_colliders(): Promise<void> {
  const ball: IAutoMoviePhysicalShape = {
    id: "ball",
    material: "rubber",
    kind: "sphere",
    radius: 0.1,
    transform: at({ x: 0.3, y: 0.4, z: 0 }),
  };
  const capsule: IAutoMoviePhysicalShape = {
    id: "rod",
    material: "wood",
    kind: "capsule",
    radius: 0.05,
    halfLength: 0.2,
    transform: ORIGIN,
  };
  const box: IAutoMoviePhysicalShape = {
    id: "box",
    material: "wood",
    kind: "box",
    halfExtents: { x: 0.1, y: 0.2, z: 0.2 },
    transform: at({ x: 0, y: 0, z: 1 }),
  };
  const corners: IAutoMovieVector3[] = [];
  for (const x of [-0.5, 0.5])
    for (const y of [-0.5, 0.5])
      for (const z of [-0.5, 0.5]) corners.push({ x, y, z });
  const cube: IAutoMoviePhysicalShape = {
    id: "cube",
    material: "wood",
    kind: "hull",
    points: corners,
    transform: ORIGIN,
  };
  const spike: IAutoMoviePhysicalShape = {
    ...cube,
    points: [
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 0, y: 0, z: 0 },
    ],
  };

  // 1. Reach.
  TestValidator.predicate(
    "how far shapes reach",
    near(HumanPropSweepColliders.reach([ball]), 0.6) &&
      near(HumanPropSweepColliders.reach([capsule]), 0.25) &&
      near(HumanPropSweepColliders.reach([box]), 1.3) &&
      near(HumanPropSweepColliders.reach([spike]), 2) &&
      near(HumanPropSweepColliders.reach([ball, capsule, box, spike]), 2) &&
      HumanPropSweepColliders.reach([]) === 0,
  );

  // 2. Culling.
  let reads: number = 0;
  const near5: IAutoMovieProjectileFirstContact.INearest = {
    distance: 0.05,
    point: { x: 1, y: 2, z: 3 },
    normal: { x: 1, y: 0, z: 0 },
  };
  const collider: IAutoMovieProjectileFirstContact.ICollider = {
    id: "wall",
    nearest: () => {
      ++reads;
      return near5;
    },
  };
  const measured: IAutoMovieProjectileFirstContact.ICollider = {
    ...collider,
    distance: (): number => {
      ++reads;
      return 0.07;
    },
  };
  const a: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const far = HumanPropSweepColliders.culled(collider, () => 1, 0.2);
  const close = HumanPropSweepColliders.culled(collider, () => 0.1, 0.2);
  const exact = HumanPropSweepColliders.culled(measured, () => 0.2, 0.2);
  TestValidator.predicate(
    "culled by the bound",
    far.distance!(a, a, 0) === 1 &&
      far.nearest(a, a, 0).distance === 1 &&
      far.nearest(a, a, 0).point === a &&
      reads === 0 &&
      close.distance!(a, a, 0) === 0.05 &&
      close.nearest(a, a, 0) === near5 &&
      reads === 2 &&
      exact.distance!(a, a, 0) === 0.07 &&
      reads === 3,
  );

  // 3. Carried points.
  const spin = (seconds: number): IAutoMovieRigidTransform => ({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: Math.sin(seconds), z: 0, w: Math.cos(seconds) },
  });
  const slide = (seconds: number): IAutoMovieRigidTransform =>
    at({ x: 3 * seconds, y: 0, z: 0 });
  TestValidator.predicate(
    "a carried point's velocity",
    nearV(
      HumanPropSweepColliders.pointVelocity(spin, { x: 1, y: 0, z: 0 }, 0),
      { x: 0, y: 0, z: -2 },
    ) &&
      nearV(
        HumanPropSweepColliders.pointVelocity(slide, { x: 5, y: 1, z: 0 }, 2),
        { x: 3, y: 0, z: 0 },
      ),
  );

  // 4. Sizes.
  const flat: IAutoMoviePhysicalShape = {
    ...cube,
    points: corners.map((p) => ({ ...p, y: 0 })),
  };
  TestValidator.predicate(
    "least thicknesses",
    near(HumanPropSweepColliders.size(ball), 0.2) &&
      near(HumanPropSweepColliders.size(capsule), 0.1) &&
      near(HumanPropSweepColliders.size(box), 0.2) &&
      Math.abs(HumanPropSweepColliders.size(cube) - 1) <= 1e-9 &&
      HumanPropSweepColliders.width(flat) === Infinity &&
      HumanPropSweepColliders.width({ ...cube, points: [] }) === Infinity &&
      HumanPropSweepColliders.width(ball) === Infinity,
  );

  // 5. The thinnest.
  const { state } = await standingPerformanceState();
  const body = state.people.get("actor")!.performer.body;
  let least: number = Infinity;
  for (const segment of body.profile.segments)
    if (!/(Thumb|Index|Middle|Ring|Little)/.test(segment.bone))
      for (const shape of segment.shapes ?? [])
        least = Math.min(least, HumanPropSweepColliders.size(shape));
  const other: IAutoMovieMotionHumanPerformanceState = {
    ...state,
    people: new Map([
      ["actor", state.people.get("actor")!],
      [
        "other",
        {
          ...state.people.get("actor")!,
          performer: { ...state.people.get("actor")!.performer, subject: "other" },
        },
      ],
    ]),
  };
  TestValidator.predicate(
    "the thinnest collider",
    least < Infinity &&
      near(HumanPropSweepColliders.thinnest(other, "actor", []), least) &&
      near(HumanPropSweepColliders.thinnest(other, "actor", [capsule]), Math.min(least, 0.1)) &&
      near(HumanPropSweepColliders.thinnest(state, "actor", [box]), 0.2) &&
      HumanPropSweepColliders.thinnest(state, "actor", []) === Number.MAX_VALUE,
  );
}

/** Whether a length is the expected one. */
function near(actual: number, expected: number): boolean {
  return Math.abs(actual - expected) <= SIZE;
}

/** Whether a velocity is the expected one. */
function nearV(a: IAutoMovieVector3, b: IAutoMovieVector3): boolean {
  return (
    Math.abs(a.x - b.x) <= VELOCITY &&
    Math.abs(a.y - b.y) <= VELOCITY &&
    Math.abs(a.z - b.z) <= VELOCITY
  );
}
