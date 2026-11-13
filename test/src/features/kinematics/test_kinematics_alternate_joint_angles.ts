import {
  DEFAULT_JOINT_AXES,
  type IAutoMovieResolvedJointAngles,
  type IAutoMovieRestFrame,
  alternateJointAngles,
  jointToQuaternion,
} from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../internal/qclose";
import { makeRng } from "../internal/random";

/**
 * The other reading of a joint's angles is another triple of the same
 * rotation.
 *
 * Scenarios, for a proximal and a distal twist, on the default left-handed
 * basis and on a right-handed one, without a rest frame and with one whose
 * axes have signs and neutrals:
 * 1. For 64 seeded triples of angles within a half turn, the other reading
 *    composes to the same rotation as the triple.
 * 2. The other reading differs from the triple: its flexion or its
 *    abduction is at least 1 degree away, since it is the second chart and
 *    not the first with a full turn added.
 * 3. The other reading of the other reading composes to the same rotation
 *    again.
 * 4. An invalid basis throws.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Composes both triples through the forward converter and compares the rotations; a chart rule with a wrong sign, a wrong placement or a frame lifted the wrong way fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected rotation is the input triple's own, by the forward converter; nothing is read from the inverse's chart choice.
 * @evidence contracts/development/testing.md#distinguishing-cases Both twist placements, both handednesses, with and without a clinical frame of mixed signs and neutrals, seeded triples and a refused basis. The inverse's choice between the two readings is `test_kinematics_rotation_domain`'s.
 * @evidence contracts/development/testing.md#execution-ownership Pure arithmetic on portable kinematics source; it runs in the CI test job.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 4 scenarios with their inputs.
 */
export function test_kinematics_alternate_joint_angles(): void {
  const rng: () => number = makeRng(0x51c7e2ab);
  const frames: readonly (IAutoMovieRestFrame | undefined)[] = [
    undefined,
    {
      flexion: { sign: -1, neutral: 12 },
      abduction: { sign: 1, neutral: -35 },
      twist: { sign: -1, neutral: 90 },
    },
  ];
  const bases: readonly (readonly [string, IAutoMovieJointAxes])[] = [
    ["left-handed", DEFAULT_JOINT_AXES],
    [
      "right-handed",
      {
        flexion: { x: 1, y: 0, z: 0 },
        abduction: { x: 0, y: 1, z: 0 },
        twist: { x: 0, y: 0, z: 1 },
      },
    ],
  ];
  for (const placement of ["proximal", "distal"] as const)
    for (const [hand, basis] of bases)
      for (const frame of frames) {
        const axes: IAutoMovieJointAxes = {
          ...basis,
          twistPlacement: placement,
        };
        const cell: string = `${placement}, ${hand}, ${frame === undefined ? "no frame" : "a frame"}`;
        for (let i: number = 0; i < 64; ++i) {
          const angles: IAutoMovieResolvedJointAngles = {
            flexion: 360 * rng() - 180,
            abduction: 360 * rng() - 180,
            twist: 360 * rng() - 180,
          };
          const rotation: IAutoMovieQuaternion = jointToQuaternion(
            angles,
            axes,
            frame,
          );
          const other: IAutoMovieResolvedJointAngles = alternateJointAngles(
            angles,
            axes,
            frame,
          );
          TestValidator.predicate(
            `${cell} #${i}: the other reading is the same rotation`,
            qclose(jointToQuaternion(other, axes, frame), rotation, 1e-9),
          );
          TestValidator.predicate(
            `${cell} #${i}: the other reading is another triple`,
            Math.abs(other.flexion - angles.flexion) >= 1 ||
              Math.abs(other.abduction - angles.abduction) >= 1,
          );
          TestValidator.predicate(
            `${cell} #${i}: the other reading's other reading is the same rotation`,
            qclose(
              jointToQuaternion(
                alternateJointAngles(other, axes, frame),
                axes,
                frame,
              ),
              rotation,
              1e-9,
            ),
          );
        }
      }
  TestValidator.error("a basis with a zero axis throws", (): void => {
    alternateJointAngles(
      { flexion: 10, abduction: 20, twist: 30 },
      { ...DEFAULT_JOINT_AXES, twist: { x: 0, y: 0, z: 0 } },
    );
  });
}
