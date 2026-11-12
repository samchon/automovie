import { type IAutoMovieResolvedBone, Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieMotionHumanAuditMeasure } from "./IAutoMovieMotionHumanAuditMeasure";
import type { IAutoMovieMotionHumanAuditMotion } from "./IAutoMovieMotionHumanAuditMotion";

/**
 * Whether a body is back where it was: how far the joint centres of one
 * instant are from the same centres of an earlier instant.
 *
 * An action that says it returns to its entry (a wave that lowers the arm
 * again, a squat that stands back up, a punch that comes back to guard)
 * shows the entry's body at its end. Two readings tell the two ways that can
 * fail apart. `world` is the largest distance between a joint centre at the
 * two instants as displayed, so it also reads a body that kept its form but
 * drifted or turned. `shape` reads the same after each instant's centres are
 * expressed in that instant's own pelvis frame (origin at the hips, axes the
 * hips' orientation), so it reads the body's form alone: a walker who ends
 * in the stance they began in, two metres on and facing another way, has a
 * `shape` of zero and a `world` of two metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the property, the two readings and what each tells apart, with an example.
 * @evidence contracts/development/implementation.md#principled-implementation A rigid displacement of the whole body leaves every centre's coordinates in the pelvis frame unchanged, so the pelvis-frame distance is the change of form and nothing else.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Two bone maps, one walk over the bones.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every displayed bone is read, fingers and toes included, and a bone the later instant lacks is an error, not a skip.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in bones; two instants are resolved.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The frame change is the engine's `Quaternion.inverse` and `Quaternion.rotateVector`.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace AutoMovieMotionHumanAuditReturn {
  /**
   * What the reading found.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and its frame.
   * @evidence contracts/development/design.md#principled-representation Form and placement apart, since an action may promise one without the other.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, each asserted by the audit's test.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No optional member.
   */
  export interface IResult {
    /** The largest distance between a joint centre at the two instants, world frame, metres, with the bone, at the later instant. */
    world: IAutoMovieMotionHumanAuditMeasure;

    /** The same in each instant's own pelvis frame, metres. */
    shape: IAutoMovieMotionHumanAuditMeasure;
  }

  /**
   * Read how far a person at one instant is from themselves at another.
   *
   * @param motion The motion.
   * @param subject The person.
   * @param from The instant returned to, film seconds.
   * @param to The instant that should show it again, film seconds.
   * @returns The two readings.
   * @throws {Error} When either instant displays no hips, or the later one lacks a bone of the earlier.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and the failures.
   * @evidence contracts/development/implementation.md#principled-implementation Each centre is taken relative to its instant's hips and turned by the inverse of the hips' orientation before the two are compared.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop that updates both readings.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance is applied here; the caller's limit judges the reading.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each hips orientation is inverted once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the engine's quaternion functions.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function measure(
    motion: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    from: number,
    to: number,
  ): IResult {
    const before: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      motion.bones(subject, from);
    const after: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      motion.bones(subject, to);
    const local = (
      bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    ): ((point: IAutoMovieVector3) => IAutoMovieVector3) => {
      const hips: IAutoMovieResolvedBone | undefined = bones.get("hips");
      if (hips === undefined)
        throw new Error("A return reading needs the hips at both instants");
      const inverse: IAutoMovieQuaternion = Quaternion.inverse(
        hips.worldRotation,
      );
      return (point: IAutoMovieVector3): IAutoMovieVector3 =>
        Quaternion.rotateVector(inverse, {
          x: point.x - hips.worldPosition.x,
          y: point.y - hips.worldPosition.y,
          z: point.z - hips.worldPosition.z,
        });
    };
    const first: (point: IAutoMovieVector3) => IAutoMovieVector3 =
      local(before);
    const second: (point: IAutoMovieVector3) => IAutoMovieVector3 =
      local(after);
    const out: IResult = {
      world: { value: 0, seconds: to, where: "none" },
      shape: { value: 0, seconds: to, where: "none" },
    };
    for (const [bone, resolved] of before) {
      const twin: IAutoMovieResolvedBone | undefined = after.get(bone);
      if (twin === undefined)
        throw new Error(`The later instant has no ${bone}`);
      const world: number = distance(
        resolved.worldPosition,
        twin.worldPosition,
      );
      if (world > out.world.value)
        out.world = { value: world, seconds: to, where: bone };
      const shape: number = distance(
        first(resolved.worldPosition),
        second(twin.worldPosition),
      );
      if (shape > out.shape.value)
        out.shape = { value: shape, seconds: to, where: bone };
    }
    return out;
  }
}

/** The distance between two points, metres. */
const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
