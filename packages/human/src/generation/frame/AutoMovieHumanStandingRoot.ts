import { AutoMovieHumanSegmentFrame as F } from "./AutoMovieHumanSegmentFrame";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanSegmentFrame,
  IAutoMovieHumanSegmentJoint,
} from "@automovie/interface";

/**
 * The height a standing figure's root stands at: derived from the person's own chain, so the soles stay on the floor when a leg's
 * length changes.
 *
 * A chain's root (the pelvis) holds its origin in the figure's frame, and every other segment hangs on it. A thigh or a shank of another
 * length therefore moves the feet, not the pelvis: with the root's height stored, the figure floats or sinks by the legs' change. The
 * standing figure's premise is the reverse: the floor is fixed and the pelvis stands on the legs.
 *
 * The law assumes the sole is fixed in the supporting segment's frame and
 * that both chains keep the same reference rotations. Under those premises
 * the soles stay on the floor when the support origin keeps its reference height. In an erect
 * stance this is the stature's decomposition `hip centre height = ankle centre height + shank + thigh` along the segments' own rest
 * directions (de Leva 1996, whose thigh and shank are the hip-to-knee and knee-to-ankle joint centre lengths).
 *
 * The caller chooses one supporting segment. Both feet stand level when the
 * rest chain's two sides are reflections. A posed figure chooses support from
 * its pose.
 */
export namespace AutoMovieHumanStandingRoot {
  /**
   * A person's chain with its root moved along `up` so that the supporting segment's origin stands as high as on the reference chain.
   * A person whose support already stands there gets the given chain itself.
   *
   * @param reference The chain the floor was read on: its supporting segment's height is the one to keep.
   * @param person The person's chain, the same tree with edited offsets, parent first.
   * @param support The supporting segment's name, the one whose frame holds the sole.
   * @param up The floor's unit normal in the figure's frame.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Rigid composition: every segment's origin is the root's plus a sum of rotated offsets, so moving the root by `d up` moves the support by the same vector, and the height to restore is the difference of the two supports' heights. Premises: the sole is fixed in the support's frame and both chains carry the same reference rotations, which holds for chains edited by length ratios alone.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two frame compositions, one difference and one edited root record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No height is stored and no person is special-cased; a chain without exactly one root, an absent support and a normal that is not unit are refused.
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, the unit (mm), the premise on rotations and the returned identity for an unchanged person.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the chain's length, twice.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work An unchanged height returns the person's chain itself; every record but the root's is borrowed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A changed result owns one array and one root record with its offset.
   */
  export function place(reference: readonly IAutoMovieHumanSegmentJoint[], person: readonly IAutoMovieHumanSegmentJoint[], support: string, up: AutoMovieVector3Tuple): readonly IAutoMovieHumanSegmentJoint[] {
    if (Math.abs(F.dot(up, up) - 1) > 1e-9) throw new Error("standing root needs a unit floor normal");
    const roots: IAutoMovieHumanSegmentJoint[] = person.filter((joint: IAutoMovieHumanSegmentJoint): boolean => joint.parent === null);
    if (roots.length !== 1) throw new Error("standing root needs a chain with exactly one root, found " + roots.length);

    // The support's height on each chain at its reference rotations: the standing pose both chains were authored in.
    const height = (chain: readonly IAutoMovieHumanSegmentJoint[]): number => {
      const frame: IAutoMovieHumanSegmentFrame | undefined = F.world(chain, (): undefined => undefined).get(support);
      if (frame === undefined) throw new Error("standing root's supporting segment is absent: " + support);
      return F.dot(frame.origin, up);
    };
    const rise: number = height(reference) - height(person);
    if (rise === 0) return person;

    // Moving the root moves every segment by the same vector, so the support regains its height and nothing else changes.
    const root: IAutoMovieHumanSegmentJoint = roots[0]!;
    return person.map((joint: IAutoMovieHumanSegmentJoint): IAutoMovieHumanSegmentJoint => (joint === root ? { ...joint, offset: F.add(joint.offset, F.scale(up, rise)) } : joint));
  }
}
