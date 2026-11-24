import { AutoMovieHumanSegmentFrame as F } from "./AutoMovieHumanSegmentFrame";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanSegmentJoint,
  IAutoMovieHumanSegmentScaling,
} from "@automovie/interface";

/**
 * Segment lengths as edits of a chain: a segment's length moves the joint at its far end along the segment, so every joint centre and
 * relative frame past it follows through the chain composer (`AutoMovieHumanSegmentFrame.world`), and a later segment keeps its own
 * length and translates. This is the station law the limb law proved on f1 in step 2 of #3151
 * (`test/src/reference-conics/FamilyConicLimbLaw.ts`, `chainWith`, `extremityFrames`, `scaleIn`), moved into the package.
 *
 * A joint's offset in its parent's frame is scaled by one ratio (a long bone: the far joint along the bone), or, inside a segment whose
 * children spread across it (the hand's metacarpal heads, the foot's metatarsal heads), by one ratio along the segment's axis and another
 * across it, the third direction kept. Rotations are never changed. A chain with no changed offset is returned as given.
 */
export namespace AutoMovieHumanSegmentScaling {
  /** One joint's offset edit: a ratio, or an along/across map in the parent's frame. */
  export type IScale = IAutoMovieHumanSegmentScaling.IScale;

  /**
   * A local vector scaled along the unit `a` by `along` and along the unit `b`, square to `a`, by `across`; the third direction kept.
   * Equal ratios of one return the vector itself.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The limb law's `scaleIn`: `p + (along - 1)(p.a)a + (across - 1)(p.b)b`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One closed-form map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nonpositive or nonfinite ratios and axes that are not unit and square are refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per vector.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure map coordinates no shared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure retains two axes and two ratios.
   */
  export function spread(a: AutoMovieVector3Tuple, b: AutoMovieVector3Tuple, along: number, across: number): (p: AutoMovieVector3Tuple) => AutoMovieVector3Tuple {
    if (![along, across].every((k: number): boolean => Number.isFinite(k) && k > 0))
      throw new Error("segment scaling ratios must be finite and positive");
    if (Math.abs(F.dot(a, a) - 1) > 1e-9 || Math.abs(F.dot(b, b) - 1) > 1e-9 || Math.abs(F.dot(a, b)) > 1e-9)
      throw new Error("segment scaling axes must be unit and square");
    return (p: AutoMovieVector3Tuple): AutoMovieVector3Tuple => {
      if (along === 1 && across === 1) return p;
      const [pa, pb]: number[] = [F.dot(p, a), F.dot(p, b)];
      return [0, 1, 2].map((c: number): number => p[c]! + (along - 1) * pa! * a[c]! + (across - 1) * pb! * b[c]!) as AutoMovieVector3Tuple;
    };
  }

  /**
   * The chain with the named joints' offsets edited. Joints absent from `scales`, or whose edit returns their own offset (a ratio of
   * one), keep their records; with no record changed the given chain itself is returned, so an unchanged person keeps the stored chain's
   * identity and its reference frames.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The offset of the joint at a segment's far end is the segment in its parent's frame; scaling it moves that joint and its descendants by composition.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the chain.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A named joint the chain lacks, or a nonpositive or nonfinite ratio, is refused; rotations are never touched.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the chain's length.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Unchanged records and the unchanged chain are borrowed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A changed result owns one array and the edited records.
   */
  export function chain(base: readonly IAutoMovieHumanSegmentJoint[], scales: ReadonlyMap<string, IScale>): readonly IAutoMovieHumanSegmentJoint[] {
    for (const name of scales.keys())
      if (!base.some((joint: IAutoMovieHumanSegmentJoint): boolean => joint.name === name))
        throw new Error("segment scaling names a joint the chain lacks: " + name);
    let changed: boolean = false;
    const out: IAutoMovieHumanSegmentJoint[] = base.map((joint: IAutoMovieHumanSegmentJoint): IAutoMovieHumanSegmentJoint => {
      const scale: IScale | undefined = scales.get(joint.name);
      if (scale === undefined) return joint;
      if (typeof scale === "number" && !(Number.isFinite(scale) && scale > 0))
        throw new Error("segment length ratio must be finite and positive: " + joint.name);
      if (scale === 1) return joint;
      const offset: AutoMovieVector3Tuple = typeof scale === "number" ? F.scale(joint.offset, scale) : scale(joint.offset);
      if (offset === joint.offset) return joint;
      changed = true;
      return { ...joint, offset };
    });
    return changed ? out : base;
  }
}
