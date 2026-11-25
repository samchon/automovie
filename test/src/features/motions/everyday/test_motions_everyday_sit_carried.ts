import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSeated,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { sitCarried } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../../internal/qclose";
import { vclose } from "../../internal/vclose";

/** Film second at which the local mount clock starts. */
const START: number = 10;

/** Roundoff for the bounded translations, quarter turn and quintic blend. */
const ROUNDING: number = 64 * Number.EPSILON;

/** An exactly representable second offset to read after floor release. */
const AFTER_RELEASE: number = 2 ** -10;

/**
 * Metres of change from the ground goal at the one-sided read. The interval
 * lasts two seconds, the quintic share is at most 10u³, and each component of
 * the tread or pole displacement is under 3 m there.
 */
const RELEASE_LIMIT: number = 30 * (AFTER_RELEASE / 2) ** 3 + ROUNDING;

/** An unrotated support frame. */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/** The upright normal for the horizontal supports. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** The carrier translates two metres per second along world X. */
function frame(film: number): IAutoMovieRigidTransform {
  return {
    position: { x: 5 + 2 * (film - START), y: 0, z: 3 },
    rotation: IDENTITY,
  };
}

/** The seat bobs while the footrest rises and turns separately. */
function point(
  id: string,
  film: number,
): IAutoMovieMotionHumanProp.IPlacedPoint | undefined {
  const t: number = film - START;
  const x: number = frame(film).position.x;
  if (id === "seat")
    return { point: { x, y: 2 + t / 4, z: 3 }, normal: UP };
  if (id === "stirrup")
    return {
      point: { x: x - 1, y: 1 + t / 2, z: 3 },
      normal: UP,
      rotation: Quaternion.fromAxisAngle(
        UP,
        45 * Math.max(0, Math.min(2, t - 1)),
      ),
    };
  return undefined;
}

/**
 * A mount changes supports on its local clock while the carrier and the
 * stirrup move on the film clock.
 *
 * Scenarios:
 *
 * 1. The foot holds its original goal through floor release, with the
 *    quintic's one-sided bound immediately afterwards. The seat already
 *    follows its own rise above the translating carrier.
 * 2. A quarter of the way from release to landing, the ankle takes the
 *    minimum-jerk share of the stirrup's moving-frame goal.
 * 3. At bearing and the final sample, the stirrup takes the ankle's offset
 *    and rotation. Re-reading an earlier second still holds the floor.
 */
export function test_motions_everyday_sit_carried(): void {
  const reader: IAutoMovieMotionHumanPropReader = {
    prop: {
      subject: "carrier",
      frame: frame(START),
      points: {
        seat: { point: { x: 0, y: 2, z: 0 }, normal: UP },
        stirrup: { point: { x: -1, y: 1, z: 0 }, normal: UP },
      },
      point,
    },
    frame,
  };
  const seat: IAutoMovieMotionHumanSeated.ISeat = {
    at: { x: 5, y: 2, z: 3 },
    yaw: 0,
    carrier: "carrier",
    point: "seat",
  };
  const windows: readonly IAutoMovieMotionHumanContactWindow[] = [
    {
      part: "rightFoot",
      kind: "plant",
      from: 0,
      to: 1 / 4,
      support: { kind: "ground" },
    },
    {
      part: "rightFoot",
      kind: "plant",
      from: 3 / 4,
      to: 1,
      support: { kind: "prop", subject: "carrier", point: "stirrup" },
    },
  ];
  const source: IAutoMovieMotionHumanPosture = {
    root: { x: 5, y: 1, z: 3 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {
      rightLeg: {
        point: { x: 4, y: 1, z: 4 },
        bend: { x: 4, y: 2, z: 4 },
        rotation: IDENTITY,
      },
    },
  };
  const sample: sitCarried.Pose = sitCarried.prepare(
    { start: START, prop: (): IAutoMovieMotionHumanPropReader => reader },
    seat,
    4,
    windows,
  );
  const final: IAutoMovieMotionHumanPosture = sample(source, 4);
  const release: IAutoMovieMotionHumanPosture = sample(source, 1);
  const justFree: IAutoMovieMotionHumanPosture = sample(source, 1 + AFTER_RELEASE);
  const bearing: IAutoMovieMotionHumanPosture = sample(source, 3);
  const approach: IAutoMovieMotionHumanPosture = sample(source, 1.5);
  TestValidator.predicate(
    "the seat follows its own rise while the foot still holds the floor",
    vclose(release.root, { x: 7, y: 1.25, z: 3 }, ROUNDING) &&
      release.limbs.rightLeg !== undefined &&
      vclose(release.limbs.rightLeg.point, { x: 4, y: 1, z: 4 }, ROUNDING) &&
      vclose(release.limbs.rightLeg.bend, { x: 4, y: 2, z: 4 }, ROUNDING),
  );

  TestValidator.predicate(
    "the free ankle and bend begin at their ground goals",
    justFree.limbs.rightLeg !== undefined &&
      vclose(justFree.limbs.rightLeg.point, { x: 4, y: 1, z: 4 }, RELEASE_LIMIT) &&
      vclose(justFree.limbs.rightLeg.bend, { x: 4, y: 2, z: 4 }, RELEASE_LIMIT),
  );

  // The zero-endpoint-velocity and acceleration quintic gives 53/512 at 1/4.
  // The tread has turned pi/8 and risen 3/4 m at this second.
  const share: number = 53 / 512;
  const angle: number = Math.PI / 8;
  TestValidator.predicate(
    "the approach adds the quintic share of the stirrup's independent motion",
    vclose(approach.root, { x: 8, y: 1.375, z: 3 }, ROUNDING) &&
      approach.limbs.rightLeg !== undefined &&
      vclose(
        approach.limbs.rightLeg.point,
        {
          x: 4 + share * (3 + Math.sin(angle)),
          y: 1 + (3 * share) / 4,
          z: 4 + share * (Math.cos(angle) - 1),
        },
        ROUNDING,
      ) &&
      vclose(
        approach.limbs.rightLeg.bend,
        { x: 4 + 3 * share, y: 2, z: 4 },
        ROUNDING,
      ) &&
      approach.limbs.rightLeg.rotation !== undefined &&
      qclose(
        approach.limbs.rightLeg.rotation,
        {
          x: 0,
          y: Math.sin((share * angle) / 2),
          z: 0,
          w: Math.cos((share * angle) / 2),
        },
        ROUNDING,
      ),
  );
  TestValidator.predicate(
    "the stirrup alone carries the ankle offset from its first bearing on",
    bearing.limbs.rightLeg !== undefined &&
      vclose(bearing.limbs.rightLeg.point, { x: 11, y: 2.5, z: 3 }, ROUNDING) &&
      final.limbs.rightLeg !== undefined &&
      vclose(final.limbs.rightLeg.point, { x: 13, y: 3, z: 3 }, ROUNDING) &&
      final.limbs.rightLeg.rotation !== undefined &&
      qclose(
        final.limbs.rightLeg.rotation,
        { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
        ROUNDING,
      ),
  );
  const offset: IAutoMovieMotionHumanPosture = {
    ...source,
    limbs: {
      rightLeg: { ...source.limbs.rightLeg!, bend: { x: 5, y: 2, z: 4 } },
    },
  };
  const carried = sample(offset, 4).limbs.rightLeg;
  // The quarter turn takes the ankle-to-knee offset (1, 1, 0) to (0, 1, -1).
  TestValidator.predicate(
    "the actual tread carries the held knee direction with the ankle",
    carried !== undefined &&
      vclose(carried.bend, { x: 13, y: 4, z: 2 }, ROUNDING),
  );
}
