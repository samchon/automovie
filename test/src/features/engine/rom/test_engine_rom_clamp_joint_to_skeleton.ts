import { clampJointToSkeleton, jointToQuaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { qclose } from "../../internal/qclose";
import { throwsError } from "../../internal/throwsError";

/** A transform at rest. */
const REST: IAutoMovieTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

/** The axes of a plain right-handed basis, X flexion, Y abduction, Z twist. */
const VALID: IAutoMovieJointAxes = {
  flexion: { x: 1, y: 0, z: 0 },
  abduction: { x: 0, y: 1, z: 0 },
  twist: { x: 0, y: 0, z: 1 },
};

/** A bone with an optional constraint and axes. */
const bone: (
  name: AutoMovieHumanoidBone,
  constraint: IAutoMovieJointConstraint | null,
  axes?: IAutoMovieJointAxes,
) => IAutoMovieBone = (
  name: AutoMovieHumanoidBone,
  constraint: IAutoMovieJointConstraint | null,
  axes?: IAutoMovieJointAxes,
): IAutoMovieBone => ({
  bone: name,
  parent: null,
  rest: REST,
  constraint,
  ...(axes === undefined ? {} : { axes }),
});

/** The angles of a joint in the order flexion, abduction, twist. */
const angles: (joint: IAutoMovieJointPose) => (number | null)[] = (
  joint: IAutoMovieJointPose,
): (number | null)[] => [joint.flexion, joint.abduction, joint.twist];

/** A joint pose with the given angles. */
const joint: (
  name: AutoMovieHumanoidBone,
  flexion: number | null,
  abduction: number | null,
  twist: number | null,
) => IAutoMovieJointPose = (
  name: AutoMovieHumanoidBone,
  flexion: number | null,
  abduction: number | null,
  twist: number | null,
): IAutoMovieJointPose => ({ bone: name, flexion, abduction, twist });

/** A constraint with a flexion interval only. */
const hinge: (range: IAutoMovieAngleRange) => IAutoMovieJointConstraint = (
  range: IAutoMovieAngleRange,
): IAutoMovieJointConstraint => ({
  flexion: range,
  abduction: null,
  twist: null,
});

/**
 * The swing-twist gated constraint: flexion and abduction +-30, twist +-15 from
 * rest.
 */
const GATED: IAutoMovieJointConstraint = {
  flexion: { min: -30, max: 30 },
  abduction: { min: -30, max: 30 },
  twist: { min: -90, max: 90 },
  swingTwist: { twist: { min: -15, max: 15 } },
};

/**
 * `clampJointToSkeleton.of` clamps one joint to the rig's current record of its
 * bone: the first declaration's constraint, its last declared axes, nothing for
 * an unconstrained bone.
 *
 * Scenarios:
 *
 * 1. Of two declarations, the first constraint [-10, 20] applies: flexion 35
 *    becomes 20 and the immobile abduction 31 becomes 0.
 * 2. A bone missing from the rig, and one whose first declaration has a null
 *    constraint, both use the named hinge fallback: flexion 7 stays and
 *    abduction 31 becomes 0.
 * 3. Plain bounds mutated on the rig are read by the next prepared call.
 * 4. A pure 50 degree twist of a spine gated to +-15 clips to flexion 0, abduction
 *    0, twist 15, whose rotation is (0, 0, sin 7.5, cos 7.5) degrees of half
 *    angle; the last declared axes win, also across a final declaration without
 *    axes, and a replaced axes record is read at the next call.
 * 5. A zero axis on the winning declaration is refused naming `axes.flexion`; on
 *    an unconstrained joint it is not admitted and the joint is returned as
 *    is.
 */
export function test_engine_rom_clamp_joint_to_skeleton(): void {
  const first: IAutoMovieSkeleton = {
    id: "current-rig",
    bones: [
      bone("leftLowerArm", hinge({ min: -10, max: 20 })),
      bone("leftLowerArm", hinge({ min: -40, max: 50 })),
    ],
  };
  TestValidator.equals(
    "the first declaration",
    angles(
      clampJointToSkeleton.of(
        "leftLowerArm",
        first,
      )(joint("leftLowerArm", 35, 31, null)),
    ),
    [20, 0, null],
  );
  const sides: IAutoMovieJointPose = joint("rightLowerArm", 7, 31, null);
  const nullFirst: IAutoMovieSkeleton = {
    id: "current-rig",
    bones: [
      bone("rightLowerArm", null),
      bone("rightLowerArm", {
        flexion: { min: -1, max: 1 },
        abduction: { min: -1, max: 1 },
        twist: { min: -1, max: 1 },
      }),
    ],
  };
  TestValidator.equals(
    "the hinge fallback",
    [{ id: "current-rig", bones: [] }, nullFirst].map(
      (skeleton: IAutoMovieSkeleton): (number | null)[] =>
        angles(clampJointToSkeleton.of("rightLowerArm", skeleton)(sides)),
    ),
    [
      [7, 0, null],
      [7, 0, null],
    ],
  );
  const range: IAutoMovieAngleRange = { min: -10, max: 20 };
  const plain: IAutoMovieSkeleton = {
    id: "current-rig",
    bones: [bone("leftLowerArm", hinge(range))],
  };
  const read: () => (number | null)[] = (): (number | null)[] =>
    [35, -40].map(
      (flexion: number): number | null =>
        clampJointToSkeleton.of(
          "leftLowerArm",
          plain,
        )(joint("leftLowerArm", flexion, null, null)).flexion,
    );
  const before: (number | null)[] = read();
  range.min = -4;
  range.max = 7;
  TestValidator.equals(
    "bounds mutated between calls",
    [before, read()],
    [
      [20, -10],
      [7, -4],
    ],
  );
  const axial: IAutoMovieJointPose = joint("spine", 0, 0, 50);
  const expected: { x: number; y: number; z: number; w: number } = {
    x: 0,
    y: 0,
    z: Math.sin(Math.PI / 24),
    w: Math.cos(Math.PI / 24),
  };
  const clipped: (skeleton: IAutoMovieSkeleton) => boolean = (
    skeleton: IAutoMovieSkeleton,
  ): boolean => {
    const out: IAutoMovieJointPose = clampJointToSkeleton.of(
      "spine",
      skeleton,
    )(axial);
    return (
      nclose(out.flexion!, 0, 1e-9) &&
      nclose(out.abduction!, 0, 1e-9) &&
      nclose(out.twist!, 15, 1e-9) &&
      qclose(jointToQuaternion(out, VALID), expected, 1e-9)
    );
  };
  const zeroFlexion: IAutoMovieJointAxes = {
    ...VALID,
    flexion: { x: 0, y: 0, z: 0 },
  };
  const current: IAutoMovieBone = bone("spine", GATED, VALID);
  const changing: IAutoMovieSkeleton = { id: "current-rig", bones: [current] };
  const refused: (skeleton: IAutoMovieSkeleton) => boolean = (
    skeleton: IAutoMovieSkeleton,
  ): boolean =>
    throwsError(
      (): IAutoMovieJointPose =>
        clampJointToSkeleton.of("spine", skeleton)(axial),
      "axes.flexion",
    );
  const results: boolean[] = [
    clipped({
      id: "current-rig",
      bones: [
        bone("spine", GATED, zeroFlexion),
        bone("spine", GATED, VALID),
        bone("spine", GATED),
      ],
    }),
    refused({
      id: "current-rig",
      bones: [
        bone("spine", GATED, VALID),
        bone("spine", GATED, zeroFlexion),
        bone("spine", GATED),
      ],
    }),
    clipped(changing),
  ];
  current.axes = zeroFlexion;
  results.push(refused(changing));
  current.axes = { ...VALID };
  results.push(clipped(changing));
  TestValidator.equals("gated axial clip and axes", results, [
    true,
    true,
    true,
    true,
    true,
  ]);
  const hips: IAutoMovieJointPose = joint("hips", 5, 999, null);
  TestValidator.predicate(
    "an unconstrained joint is returned as is",
    clampJointToSkeleton.of("hips", {
      id: "current-rig",
      bones: [bone("hips", null, zeroFlexion)],
    })(hips) === hips,
  );
}
