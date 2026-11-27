import type { AutoMovieEngineMotionBound } from "@automovie/engine";
import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanArmShapeBox
} from "../../../../../packages/motions/src/posture/internal/HumanArmShapeBox";
import {
  HumanArmSweepGradient
} from "../../../../../packages/motions/src/posture/internal/HumanArmSweepGradient";
import {
  HumanArmTrajectoryClusters
} from "../../../../../packages/motions/src/posture/internal/HumanArmTrajectoryClusters";
import {
  HumanArmTrajectoryLinks
} from "../../../../../packages/motions/src/posture/internal/HumanArmTrajectoryLinks";
import {
  HumanArmTrajectorySweepBound
} from "../../../../../packages/motions/src/posture/internal/HumanArmTrajectorySweepBound";
import { TestValidator } from "@nestia/e2e";

import { armTrajectoryReading } from "../../internal/armTrajectoryReading";
import { nclose } from "../../internal/nclose";

/** Four additions at the three-second scale cover the non-dyadic crossing. */
const TIME_ROUNDING: number = 4 * 3 * Number.EPSILON;

/** Sixteen rounded operations on unit-scale face normals and their weights. */
const FACE_ROUNDING: number = 16 * Number.EPSILON;

/** A picometre of conservative clearance and one rounded distance. */
const BOX_ROUNDING: number = 1e-12 + 3 * Number.EPSILON;

/**
 * An arm's clearance screens use every step's travel and a sphere covering
 * every corner of each obstacle part.
 *
 * Scenarios:
 *
 * 1. Backwards frames at elapsed times 0, 2 and 3 travel 4 and 3 metres on
 *    orthogonal axes. Between 0.5 and 2.5 s the bound travels 4.5 metres.
 * 2. From elapsed second 1 a gap of 3 metres first closes at 2 + 1/3 s.
 *    With one frame there is no travel bound.
 * 3. Corners (-1, 0, 0) and (1, 0, 0) bound their part by a radius-one
 *    sphere at the origin. A different part at x = 7 stays separate. A
 *    probe sphere centred at x = 1.08 with radius 0.05 enters the first
 *    part's nominal 0.05-m reach, whereas one at x = 1.12 stays outside.
 * 4. A chord of length four has its closest point at three. The closest
 *    normal apportions to the two endpoints by one quarter and three
 *    quarters. A half-turn of the second endpoint reverses its local normal.
 *    With a collapsed chord the normal stays entirely on the first point.
 * 5. An eighth-metre ball turns 90 degrees one metre from its pivot. The
 *    obstacle is half a metre from the centre chord, and the probes can
 *    protrude another eighth. The widened gap is `1/4 − 9π²/256` metres,
 *    between the allowances −1/8 and −1/16. Missing material does not certify.
 * 6. A quarter-metre capsule's axis stays an eighth of a metre from a point.
 *    Its signed clearance is −1/8. An allowance of −3/8 must still locate
 *    the separating direction. A point on the axis has no core separation.
 * 7. Inside a unit cube, the chord from (1/2, 1/8, 0) to (1/4, 5/8, 0)
 *    minimizes the two active planes' maximum at (3/8, 3/8, 0). Their
 *    slopes along the chord are −1/4 and 1/2. The stationarity condition for
 *    this epigraph problem gives weights 2/3 and 1/3 on +X and +Y.
 * 8. A fixed hull's local box contains the origin one metre from its nearest
 *    face. The point (3, 6, 4) lies one and two metres past its x and y faces.
 *    Two half-turns and translations put both points in the world while
 *    preserving their signed clearances and the prepared local extrema.
 *
 * @see https://web.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf Boyd and Vandenberghe, §5.5.3, Eq. (5.49).
 */
export function test_motions_posture_arm_clearance_bounds(): void {
  const clock: Parameters<typeof HumanArmTrajectorySweepBound.chords>[0] = {
    times: [1, 2, 4],
  };
  const course: IAutoMovieVector3[] = [
    { x: 4, y: 3, z: 0 },
    { x: 0, y: 3, z: 0 },
    { x: 0, y: 0, z: 0 },
  ];
  const bound: AutoMovieEngineMotionBound.IPrepared =
    HumanArmTrajectorySweepBound.chords(clock, 2, [2, 1, 0], course)!;
  TestValidator.equals("the elapsed times", bound.times, [0, 2, 3]);
  TestValidator.equals("travel through both chords", bound.travel(0.5, 2.5), 4.5);
  TestValidator.predicate(
    "the first non-certified instant",
    nclose(bound.advance(1, 3), 2 + 1 / 3, TIME_ROUNDING),
  );
  TestValidator.equals(
    "no step yields no bound",
    HumanArmTrajectorySweepBound.chords(clock, 2, [2], [course[0]!]),
    undefined,
  );

  const body: Parameters<typeof HumanArmTrajectoryClusters>[0] = [
    { point: { x: -1, y: 0, z: 0 }, part: 0, corner: 0, bone: "chest" },
    { point: { x: 1, y: 0, z: 0 }, part: 0, corner: 1, bone: "chest" },
    { point: { x: 7, y: 0, z: 0 }, part: 1, corner: 0, bone: "head" },
  ];
  const clusters: HumanArmTrajectoryClusters.ICluster[] =
    HumanArmTrajectoryClusters(body);
  TestValidator.equals("each part's bounding sphere", clusters, [
    { start: 0, end: 2, centre: { x: 0, y: 0, z: 0 }, radius: 1 },
    { start: 2, end: 3, centre: { x: 7, y: 0, z: 0 }, radius: 0 },
  ]);
  TestValidator.predicate(
    "retain potentially close spheres and omit separated spheres",
    HumanArmTrajectoryClusters.reaches(clusters[0]!, { x: 1.08, y: 0, z: 0 }, 0.05) &&
      !HumanArmTrajectoryClusters.reaches(clusters[0]!, { x: 1.12, y: 0, z: 0 }, 0.05),
  );

  const start: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const centre: IAutoMovieVector3 = { x: 3, y: 2, z: 0 };
  const normal: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const sphere: Parameters<typeof HumanArmSweepGradient.ends>[0] = {
    pose: { position: centre, rotation: identity },
    shape: armTrajectoryReading.sphere(1),
  };
  const witness: Parameters<typeof HumanArmSweepGradient.ends>[1] = {
    start,
    to: { x: 4, y: 0, z: 0 },
    first: identity,
    turn: { x: 1, y: 0, z: 0, w: 0 },
    near: {
      at: { x: 3, y: 0, z: 0 },
      point: { x: 3, y: 1, z: 0 },
      normal,
      distance: 1,
    },
  };
  TestValidator.equals(
    "the closest-point gradient in the two endpoint frames",
    HumanArmSweepGradient.ends(sphere, witness),
    [{ x: 0, y: -1 / 4, z: 0 }, { x: 0, y: 3 / 4, z: 0 }],
  );
  TestValidator.equals(
    "a collapsed chord reads only its first endpoint",
    HumanArmSweepGradient.ends(sphere, {
      ...witness,
      start: witness.near.at,
      to: witness.near.at,
    }),
    [normal, start],
  );

  const ball: Parameters<typeof HumanArmTrajectoryLinks.certifiesTurn>[0] = [
    { points: [{ x: 1, y: 0, z: 0 }], radius: 1 / 8 },
  ];
  const cast: Parameters<typeof HumanArmTrajectoryLinks.certifiesTurn>[1] = [
    { points: [ball[0]!.points[0]!, { x: 0, y: 1, z: 0 }], radius: 1 / 8 },
  ];
  const diagonal: number = 0.5 + 0.5 / Math.sqrt(2);
  const obstacle: Parameters<typeof HumanArmTrajectoryLinks.certifiesTurn>[4] = {
    points: [{ x: diagonal, y: diagonal, z: 0 }],
    radius: 0,
  };
  const keeps = (floor: number): boolean =>
    HumanArmTrajectoryLinks.certifiesTurn(
      ball,
      cast,
      start,
      Math.PI / 2,
      obstacle,
      1 / 8,
      floor,
    );
  TestValidator.predicate(
    "the physical angular bound respects the existing signed allowance",
    keeps(-1 / 8) && !keeps(-1 / 16),
  );
  TestValidator.equals(
    "a missing endpoint solid cannot certify its part",
    HumanArmTrajectoryLinks.certifiesTurn(
      ball,
      [],
      start,
      Math.PI / 2,
      obstacle,
      1 / 8,
      -1 / 8,
    ),
    false,
  );

  const capsule: Parameters<typeof HumanArmTrajectoryLinks.certifiesTurn>[0] = [
    { points: [{ x: -1, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }], radius: 1 / 4 },
  ];
  const separated = (y: number): boolean =>
    HumanArmTrajectoryLinks.certifiesTurn(
      capsule,
      capsule,
      start,
      0,
      { points: [{ x: 0, y, z: 0 }], radius: 0 },
      0,
      -3 / 8,
    );
  TestValidator.predicate(
    "negative allowance still requires separation of the convex cores",
    separated(1 / 8) && !separated(0),
  );

  const sides: readonly number[] = [-1, 1];
  const cube: Parameters<typeof HumanArmSweepGradient>[0] = {
    pose: { position: start, rotation: identity },
    shape: {
      id: "cube",
      material: "skin",
      kind: "hull",
      transform: { position: start, rotation: identity },
      points: sides.flatMap((x: number): IAutoMovieVector3[] =>
        sides.flatMap((y: number): IAutoMovieVector3[] =>
          sides.map((z: number): IAutoMovieVector3 => ({ x, y, z })),
        ),
      ),
    },
  };
  const covector: IAutoMovieVector3 = HumanArmSweepGradient(
    cube,
    {
      distance: -5 / 8,
      at: { x: 3 / 8, y: 3 / 8, z: 0 },
      point: { x: 1, y: 3 / 8, z: 0 },
      normal: { x: 1, y: 0, z: 0 },
    },
    { x: -1 / 4, y: 1 / 2, z: 0 },
    1 / 2,
  );
  TestValidator.predicate(
    "the two penetrating faces balance at the interior chord minimum",
    nclose(covector.x, 2 / 3, FACE_ROUNDING) &&
      nclose(covector.y, 1 / 3, FACE_ROUNDING) &&
      covector.z === 0,
  );

  const hull: Parameters<typeof HumanArmShapeBox>[0] = {
    bone: "chest",
    part: 0,
    pose: {
      position: { x: 5, y: 6, z: 7 },
      rotation: { x: 0, y: 0, z: 1, w: 0 },
    },
    shape: {
      id: "asymmetric hull",
      material: "skin",
      kind: "hull",
      transform: {
        position: { x: 1, y: 2, z: 3 },
        rotation: { x: 1, y: 0, z: 0, w: 0 },
      },
      points: [
        { x: -1, y: -2, z: -3 },
        { x: 2, y: -2, z: -3 },
        { x: -1, y: 4, z: -3 },
        { x: -1, y: -2, z: 6 },
      ],
    },
    centre: { x: 4, y: 4, z: 10 },
    radius: 9,
  };
  const hullBox: NonNullable<typeof hull.hullBox> =
    HumanArmShapeBox.prepare(hull.shape)!;
  TestValidator.equals(
    "the prepared local hull extrema",
    [...hullBox],
    [-1, -2, -3, 2, 4, 6],
  );
  const prepared: typeof hull = { ...hull, hullBox };
  const outside: IAutoMovieVector3 = { x: 1, y: 10, z: 6 };
  const interior: number = HumanArmShapeBox(prepared, hull.centre);
  const exterior: number = HumanArmShapeBox(prepared, outside);
  TestValidator.predicate(
    "a prepared box keeps the same conservative signed distances in both frames",
    interior === HumanArmShapeBox(hull, hull.centre) &&
      exterior === HumanArmShapeBox(hull, outside) &&
      interior <= -1 &&
      exterior <= Math.sqrt(5) &&
      nclose(interior, -1, BOX_ROUNDING) &&
      nclose(exterior, Math.sqrt(5), BOX_ROUNDING),
  );
}
