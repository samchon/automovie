import { QuadrupedPoseAngles } from "@automovie/archetypes/internal";
import { prepareArticulatedRig } from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { qclose } from "../../internal/qclose";

/**
 * At most 128 rounded operations, including orientation normalization and the
 * degree conversion to 90.
 */
const POSE_ROUNDING: number = 128 * Number.EPSILON;

/**
 * Quadruped goals are pulled back through the carried parent before local
 * angles are reported, then read forward through the rig.
 *
 * Scenarios:
 *
 * 1. With a 90-degree world yaw, a neck aimed from world +Y to +X receives local X
 *    flexion of 90 degrees and world quaternion (1/2, 1/2, −1/2, 1/2).
 * 2. A world identity orientation cancels the inherited yaw with −90 degrees of
 *    local twist. An aim of zero length refuses.
 */
export function test_archetypes_internal_quadruped_pose_angles(): void {
  const neutral: IAutoMovieTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const axes: IAutoMovieJointAxes = {
    flexion: { x: 1, y: 0, z: 0 },
    abduction: { x: 0, y: 0, z: 1 },
    twist: { x: 0, y: 1, z: 0 },
  };
  const rig: Parameters<typeof QuadrupedPoseAngles>[0] = {
    id: "two axial links",
    bones: [
      { bone: "trunk", parent: null, rest: neutral, axes, limits: null },
      {
        bone: "neck",
        parent: "trunk",
        rest: { ...neutral, translation: { x: 0, y: 1, z: 0 } },
        axes,
        limits: null,
      },
    ],
  };
  const yaw: IAutoMovieTransform = {
    ...neutral,
    rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
  };
  const lower: ReturnType<typeof QuadrupedPoseAngles> = QuadrupedPoseAngles(
    rig,
    prepareArticulatedRig(rig),
  );
  const aimed: ReturnType<typeof lower> = lower(
    yaw,
    undefined,
    new Map([["neck", { kind: "direction", direction: { x: 1, y: 0, z: 0 } }]]),
  );
  TestValidator.predicate(
    "neck turns on the carried flexion axis",
    nclose(aimed.joints.get("neck")!.flexion ?? 0, 90, 90 * POSE_ROUNDING) &&
      nclose(aimed.joints.get("neck")!.twist ?? 0, 0, 90 * POSE_ROUNDING) &&
      nclose(aimed.joints.get("neck")!.abduction ?? 0, 0, 90 * POSE_ROUNDING),
  );
  TestValidator.predicate(
    "achieved world direction",
    qclose(
      aimed.frames.get("neck")!.rotation,
      { x: 1 / 2, y: 1 / 2, z: -1 / 2, w: 1 / 2 },
      POSE_ROUNDING,
    ),
  );
  const aligned: ReturnType<typeof lower> = lower(
    yaw,
    undefined,
    new Map([["neck", { kind: "rotation", rotation: neutral.rotation }]]),
  );
  TestValidator.predicate(
    "absolute orientation removes inherited yaw",
    nclose(aligned.joints.get("neck")!.twist ?? 0, -90, 90 * POSE_ROUNDING) &&
      qclose(
        aligned.frames.get("neck")!.rotation,
        neutral.rotation,
        POSE_ROUNDING,
      ),
  );
  TestValidator.error("zero direction", (): unknown =>
    lower(
      yaw,
      undefined,
      new Map([
        ["neck", { kind: "direction", direction: neutral.translation }],
      ]),
    ),
  );
}
