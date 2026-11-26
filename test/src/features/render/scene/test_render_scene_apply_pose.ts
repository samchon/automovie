import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";
import { type IAutoMovieModelObject, AutoMovieRenderSceneMotion } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { Bone, Group, type Object3D, Vector3 } from "three";

import { qclose, vclose } from "../../internal/predicates";

/** Pose root and staged translations are copied, exactly in these coordinates. */
const EXACT_POSITION: number = 0;

/**
 * A rest quaternion times identity preserves its components. Sixteen binary64
 * ulps cover the quarter-turn component rounding and quaternion dot product.
 */
const ROTATION_TOLERANCE: number = 16 * Number.EPSILON;

/**
 * The render pose copies local bone rotation and restores the staged base when
 * the next pose has no authored root.
 *
 * Scenarios:
 *
 * 1. The mapped hip retains its rest quarter-turn about Z while the model root
 *    turns about Y. The absent native spine is reported by its authored id.
 * 2. A declared root supplies translation and rotation without display scale.
 * 3. A subsequent null root restores the neutral local frame under the same staged
 *    placement, independently of the previously applied pose.
 */
export function test_render_scene_apply_pose(): void {
  const identity: IAutoMovieTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const turnZ: IAutoMovieQuaternion = {
    x: 0,
    y: 0,
    z: Math.SQRT1_2,
    w: Math.SQRT1_2,
  };
  const turnY: IAutoMovieQuaternion = { x: 0, y: 1, z: 0, w: 0 };
  const skeleton: IAutoMovieSkeleton = {
    id: "rig",
    bones: [
      {
        bone: "hips",
        parent: null,
        constraint: null,
        rest: { ...identity, rotation: turnZ },
      },
      {
        bone: "spine",
        parent: "hips",
        constraint: null,
        rest: identity,
      },
    ],
  };
  const staged: Group = new Group();
  staged.position.set(8, -4, 2);
  const object: Group = new Group();
  const hip: Bone = new Bone();
  object.add(hip);
  staged.add(object);
  const target: IAutoMovieModelObject = {
    object,
    bones: new Map<AutoMovieHumanoidBone, Object3D>([["hips", hip]]),
    parts: new Map<string, Object3D>(),
  };
  const pose: IAutoMoviePose = {
    skeleton: skeleton.id,
    root: {
      translation: { x: 2, y: 1, z: -3 },
      rotation: turnY,
      scale: { x: 2, y: 3, z: 4 },
    },
    joints: [],
  };

  TestValidator.equals(
    "only the missing resolved bone is reported",
    AutoMovieRenderSceneMotion.applyPose(target, pose, skeleton),
    ["spine"],
  );
  TestValidator.predicate(
    "rotation is bone-local and root scale stays neutral",
    () =>
      qclose(hip.quaternion, turnZ, ROTATION_TOLERANCE) &&
      qclose(object.quaternion, turnY, ROTATION_TOLERANCE) &&
      vclose(object.scale, identity.scale, EXACT_POSITION) &&
      vclose(
        object.getWorldPosition(new Vector3()),
        { x: 10, y: -3, z: -1 },
        EXACT_POSITION,
      ),
  );

  AutoMovieRenderSceneMotion.applyPose(target, { ...pose, root: null }, skeleton);
  TestValidator.predicate(
    "null root returns to the staged base",
    () =>
      qclose(object.quaternion, identity.rotation, ROTATION_TOLERANCE) &&
      vclose(
        object.getWorldPosition(new Vector3()),
        { x: 8, y: -4, z: 2 },
        EXACT_POSITION,
      ),
  );
}
