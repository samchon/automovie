import { AutoMovieHumanSkinDatum as Skin } from "../frame/AutoMovieHumanSkinDatum";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanSegmentFrame,
  IAutoMovieHumanSegmentJoint,
} from "@automovie/interface";

/**
 * f1's datums that the native path moved by the trunk's tissue field (`AutoMovieHumanF1NativeBuild` `skinPoint`), each declared as a bone
 * or a skin datum under the one rule of `AutoMovieHumanSkinDatum`:
 *
 * - the leg's course origin is the hip joint centre, a bone datum: the femur's origin, moved only by the chain (its support breadth and
 *   lengths), never by the hip's fat;
 * - tragion, the ear's origin, is a skin datum of the head's wall: the ear (rigid on the head) is re-attached at tragion on the scaled
 *   wall, read at tragion's own station, so the plate, helix, antihelix and concha, stored in the ear's frame, follow it with their
 *   cutter;
 * - `breastFan`, where the breast's band fans against the trunk below the breast's side, and `armpit` are skin datums of the chest wall,
 *   each at its own station (`SKIN`, `point`).
 *
 * A child whose course starts at a joint centre (the arm, the leg) takes its course from the chain; a child that stands on skin (the ear)
 * is re-attached through the chain, so its frame, the datums and courses stored in it and its cutters all follow the parent's frame.
 */
export namespace AutoMovieHumanF1Datums {
  /**
   * The leg's course origin: the hip joint centre, the femur's frame origin at the person's chain and pose.
   *
   * @evidence contracts/development/implementation.md#principled-implementation ISB's femur origin is the hip centre (Wu et al. 2002, 4.4), a bone datum.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One frame read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tissue ratio enters; an absent femur frame is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read coordinates no shared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the frame's own origin.
   */
  export function legOrigin(frames: ReadonlyMap<string, IAutoMovieHumanSegmentFrame>): AutoMovieVector3Tuple {
    const femur: IAutoMovieHumanSegmentFrame | undefined = frames.get("femur");
    if (femur === undefined) throw new Error("the leg's course origin needs the femur's frame");
    return femur.origin;
  }

  /**
   * The chain with the ear re-attached at tragion on the scaled head wall. At a ratio of one the stored chain is returned.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Tragion (the ear frame's origin, Farkas's tragus landmark) is a skin datum: moved by the wall's ratio at its own station, the ear's offset in the head frame follows.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One skin map and one re-attachment.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The ratio is read at tragion, not at the plate's first centre; the ear's size is not scaled by the head's caliper.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work plus one chain pass.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work An unchanged wall borrows the given chain.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the given chain or one edited array.
   */
  export function ear(chain: readonly IAutoMovieHumanSegmentJoint[], frames: ReadonlyMap<string, IAutoMovieHumanSegmentFrame>, wall: Skin.IWall): readonly IAutoMovieHumanSegmentJoint[] {
    const ear: IAutoMovieHumanSegmentFrame | undefined = frames.get("ear");
    if (ear === undefined) throw new Error("the ear's attachment needs the ear's frame");
    return Skin.attach(chain, frames, "ear", Skin.skin(ear.origin, wall));
  }

  /**
   * f1's stored datums that stand on the trunk's skin, not on a bone, each with the anatomy that makes it one. Every other stored datum is
   * a bone datum, a point of its segment's frame. This declaration belongs with the placing table's rows
   * (`AutoMovieHumanF1Placing.POINTS`) once that table carries a datum's kind.
   */
  export const SKIN: Readonly<Record<string, string>> = {
    breastFan: "the point under the breast's side where its band fans against the chest wall: a point of the thoracic skin",
    armpit: "the axilla's skin datum between the anterior and posterior axillary folds: a point of the thoracic skin, pending the armscye port's rule",
  };

  /**
   * A stored datum at a person: a declared skin datum (`SKIN`) on the scaled trunk wall at its own station, any other datum as given.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A skin datum moves with the wall's ratio at its own station (`AutoMovieHumanSkinDatum.skin`); a bone datum moves only with the chain that already placed it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One declared table and one skin map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The datum's kind is declared with its anatomical basis here, once, instead of a name branch at each consumer; no bone datum takes a tissue ratio.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure map coordinates no shared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the given point or one new point.
   */
  export function point(name: string, placed: AutoMovieVector3Tuple, wall: Skin.IWall): AutoMovieVector3Tuple {
    return SKIN[name] === undefined ? placed : Skin.skin(placed, wall);
  }
}
