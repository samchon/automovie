import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";

/**
 * Putting on a hat or a pair of glasses held in one hand, with both hands,
 * while standing.
 *
 * The item is the wearable prop the hand holds since a pick-up (`prop`, by
 * its `hold`): that hand carries it, rigid in the hand
 * (`AutoMovieMotionHumanHeld`), so that its own `wear` socket comes onto the
 * head's region it is worn on (`HumanWorn`: a hat's on the crown, a pair of
 * glasses' on the nose's bridge), spectacles facing the way the body faces
 * and a hat, round about its crown, at whichever turn the arm, fitted
 * within its ranges, brings the wear socket nearest the crown at (the
 * shared chooser, `HumanFreedomChoice`, the turn a wrapped freedom);
 * from the stroke it is worn on the head (`IAutoMovieMotionHumanActionPlan.wears`) and the
 * hand lets go. The other hand steadies it at a place on the performer's own
 * head, read on the posture so it follows the head: a hat's brim at the
 * side of the head's girth (`HAT`, provisional), the palm on the head's own
 * surface; a pair of glasses' temple just before the ear, the index finger
 * pointing back along it. Both hands rise to a place a quarter of the
 * forearm before the item's final place in front of the face (the item held
 * up), then move it onto the head in a stroke, hold it a moment and return. The reach takes the aimed movement time (McIntosh et
 * al. 2018), the stroke a beat, both provisional. The shoulder's elevation
 * stays within the functional ranges of daily tasks (flexion 121, abduction
 * 128 degrees, Namdari et al. 2012, J Shoulder Elbow Surg 21:1177), which the
 * capture checks. Events: the phrase's `ready` (item held up), `strokeStart`,
 * `stroke` (item on), `relax` (hands off).
 *
 * Not yet: the jacket through rigid sleeve sockets, shoes and socks while
 * seated, zips and buttons (garment sockets as props), and a watch on the
 * other wrist.
 *
 * @evidence contracts/development/common.md#meaningful-documentation hand: The hand that holds it; the one the entry holds it in when absent, `right` if neither. point: Dressing contact point in world metres. surface: Hand surface placed on the item: palm for a hat, index tip for glasses.
 * @evidence contracts/development/design.md#principled-representation hand: The hand that holds it; the one the entry holds it in when absent, `right` if neither. point: Dressing contact point in world metres. surface: Hand surface placed on the item: palm for a hat, index tip for glasses.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainManual.ts (HumanChainManual.dress, params); dressing/dress.ts (dress.plan, context); dressing/dress.ts (dress.place, item); executable/cases/dressCases.ts (wearable, item); dressing/dress.ts (dress.place, return); dressing/dress.ts (dress.WORN).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanSide, IAutoMovieMotionManner, IAutoMovieVector3, IAutoMovieMotionHumanHand.Surface identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanDress {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its default.
   * @evidence contracts/development/design.md#principled-representation A closed item, the held wearable, its hand and a manner.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No hand place is typed.
   */
  export interface IParams {
    /** The item: where it is worn and how the free hand steadies it. */
    item: IAutoMovieMotionHumanDress.Item;

    /** The wearable's prop subject, held since a pick-up: its `wear` socket is put on the head (`createWearable`'s contacts). */
    prop: string;

    /** The hand that holds it; the one the entry holds it in when absent, `right` if neither. */
    hand?: AutoMovieHumanSide;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * A hand's place for an item on a posture, and the surface laid there. An item put on.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A hand's place for an item on a posture, and the surface laid there. An item put on.
   * @evidence contracts/development/design.md#principled-representation Closed choices "hat", "glasses" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: dressing/dress.ts (dress.place, item); executable/cases/dressCases.ts (wearable, item); dressing/dress.ts (dress.WORN); dressing/dress.ts (dress.plan); executable/cases/dressCases.ts (WEAR).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in dress.place.
   */
  export type Item = "hat" | "glasses";

  /**
   * A hand's place for an item on a posture, and the surface laid there. Result returned by dress.place. The point, the normal the hand's surface is laid against, the
   *   surface and where its forward points: a palm flat on the head with the
   *   fingers ahead, or an index finger pointing back along the temple with
   *   the palm toward the head.
   *
   * @evidence contracts/development/common.md#meaningful-documentation point: Dressing contact point in world metres. surface: Hand surface placed on the item: palm for a hat, index tip for glasses.
   * @evidence contracts/development/design.md#principled-representation point: Dressing contact point in world metres. surface: Hand surface placed on the item: palm for a hat, index tip for glasses.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: dressing/dress.ts (dress.place, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanHand.Surface identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IPlaceResult = {
    /** Dressing contact point in world metres. */
    point: IAutoMovieVector3;
    /** Outward target normal in world coordinates. */
    normal: IAutoMovieVector3;
    /** Hand surface placed on the item: palm for a hat, index tip for glasses. */
    surface: IAutoMovieMotionHumanHand.Surface;
    /** Preferred fingers direction in world coordinates, derived from the item's wearing orientation. */
    forward: IAutoMovieVector3;
  };
}
