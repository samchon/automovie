import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Sign-preserving OpenSim MCP and IP flexion axes in distal, radial and palmar
 * coordinates, after registration to the source wrist and knuckles. The
 * projection perpendicular to the person's straight first ray is an ESTIMATE
 * for the canonical pose. The clinical rest frame supplies the left-hand sign
 * change.
 *
 * Source: Sobinov, Goodman and Hardesty's Arm and Hand Model, right neutral:
 * https://github.com/nishbo/ms_arm_and_hand/blob/99ac3d066685b4beb77fc381682a700d379d51cc/AAH%20Model/RightArmAndHand_NoMuscles.osim
 *
 * @param positions The straightened body's canonical rest joint positions.
 * @returns The two thumb hinge bases for each hand, indexed by bone.
 */
export function canonicalThumbHinges(
  positions: ReadonlyMap<string, IAutoMovieVector3>,
): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieJointAxes> {
  const axes = new Map<AutoMovieHumanoidBone, IAutoMovieJointAxes>();
  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const) {
    const at = (part: string): IAutoMovieVector3 =>
      positions.get(`${side}${part}`)!;
    const distal = Vector3.normalize(
      Vector3.subtract(at("MiddleProximal"), at("Hand")),
    );
    const span = Vector3.subtract(at("IndexProximal"), at("LittleProximal"));
    const radial = Vector3.normalize(
      Vector3.subtract(span, Vector3.scale(distal, Vector3.dot(span, distal))),
    );
    const palmar = Vector3.scale(Vector3.cross(distal, radial), sign);
    const ray = Vector3.normalize(
      Vector3.subtract(at("ThumbProximal"), at("ThumbMetacarpal")),
    );
    const twist = Vector3.scale(ray, sign);
    for (const [joint, a, b, c] of [
      ["ThumbProximal", -0.331923, -0.264086, 0.905586],
      ["ThumbDistal", -0.594511, -0.158743, 0.788262],
    ] as const) {
      const line = Vector3.add(
        Vector3.scale(distal, a),
        Vector3.add(Vector3.scale(radial, b), Vector3.scale(palmar, c)),
      );
      const flexion = Vector3.normalize(
        Vector3.subtract(line, Vector3.scale(ray, Vector3.dot(line, ray))),
      );
      axes.set(`${side}${joint}`, {
        flexion,
        abduction: Vector3.cross(flexion, twist),
        twist,
      });
    }
  }
  return axes;
}
