import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";

/**
 * The single parent-first arm-chain FK used by cold placement and an explicit
 * derivative reader. Readers supply the same pure local articulations; world
 * parent/rest composition always runs for the current coordinates.
 *
 * @param setup The unchanged arm rig metadata.
 * @param at The current parent frame and optional completed same-frame shoulder
 *   point.
 * @param c The nine arm coordinates.
 * @param readShoulder The existing shoulder chart calculation or its scoped
 *   exact-input reader.
 * @param readRotation The existing local-joint projection/composition or its
 *   scoped exact-input reader.
 * @param readScalars Optional same-derivative local reader receiving
 *   coordinates without temporary input tuples.
 * @returns Fresh world joint positions and segment rotations, without probes.
 */
export function resolveHumanArmChain(
  setup: IAutoMovieMotionHumanArmGeometry.ISetup,
  at: IAutoMovieMotionHumanArmGeometry.IFrame,
  c: readonly number[],
  readShoulder: typeof G.shoulder,
  readRotation: typeof G.rotation,
  readScalars?: (
    setup: IAutoMovieMotionHumanArmGeometry.ISetup,
    bone: AutoMovieHumanoidBone,
    flexion: number,
    abduction: number,
    twist: number,
  ) => IAutoMovieQuaternion,
): Omit<IAutoMovieMotionHumanArmGeometry.IPlaced, "probes"> {
  const rest: IAutoMovieMotionHumanArmGeometry.ISetup["rest"] = setup.rest;
  const parent: IAutoMovieMotionHumanArmGeometry.IFrame["parent"] = at.parent;
  const wu: IAutoMovieQuaternion = Quaternion.multiply(
    parent.rotation,
    Quaternion.multiply(rest.upper.rotation, readShoulder(setup, c)),
  );
  const pu: IAutoMovieVector3 =
    at.shoulder === undefined
      ? Vector3.add(
          parent.position,
          Quaternion.rotateVector(parent.rotation, rest.upper.translation),
        )
      : { x: at.shoulder.x, y: at.shoulder.y, z: at.shoulder.z };
  const wl: IAutoMovieQuaternion = Quaternion.multiply(
    wu,
    Quaternion.multiply(
      rest.lower.rotation,
      readScalars === undefined
        ? readRotation(setup, setup.bones.lower, [c[3]!, c[4]!, c[5]!])
        : readScalars(setup, setup.bones.lower, c[3]!, c[4]!, c[5]!),
    ),
  );
  const pl: IAutoMovieVector3 = Vector3.add(
    pu,
    Quaternion.rotateVector(wu, rest.lower.translation),
  );
  const wh: IAutoMovieQuaternion = Quaternion.multiply(
    wl,
    Quaternion.multiply(
      rest.hand.rotation,
      readScalars === undefined
        ? readRotation(setup, setup.bones.hand, [c[6]!, c[7]!, c[8]!])
        : readScalars(setup, setup.bones.hand, c[6]!, c[7]!, c[8]!),
    ),
  );
  const ph: IAutoMovieVector3 = Vector3.add(
    pl,
    Quaternion.rotateVector(wl, rest.hand.translation),
  );
  return {
    shoulder: pu,
    elbow: pl,
    upper: wu,
    lower: wl,
    wrist: ph,
    hand: wh,
  };
}
