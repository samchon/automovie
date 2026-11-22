import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanTipHat } from "../dressing/IAutoMovieMotionHumanTipHat";
import type { IAutoMovieMotionHumanWardrobe } from "../dressing/IAutoMovieMotionHumanWardrobe";
import type { IAutoMovieMotionHumanDrawFromCarrier } from "../handling/IAutoMovieMotionHumanDrawFromCarrier";
import type { IAutoMovieMotionHumanSheath } from "../handling/IAutoMovieMotionHumanSheath";
import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";

/**
 * Putting on, taking off and fastening clothing.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Dress family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Dress laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanDress<Chain> {
  /**
   * Putting on a hat or a pair of glasses held in one hand, with both hands, while standing.
   *
   * @param params The `item`, `prop`, `hand` and `manner` of `IAutoMovieMotionHumanDress.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanDress.dress is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanDress.dress is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanDress.dress is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanDress.dress is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanDress.dress is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanDress.dress is provided by the chain that implements IAutoMovieMotionHumanDress.
   */
  dress(params: IAutoMovieMotionHumanDress.IDress, anchor?: string): Chain;

  /**
   * Dressing oneself with a staged garment: carrying a held open-front jacket on, threading or clearing one sleeve, moving its zip, or putting footwear on or taking it off one raised foot while seated.
   *
   * @param params The `kind`, `prop` and the mode's own `hand`, `side` or `held` of `IAutoMovieMotionHumanWardrobe`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanDress.wardrobe is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanDress.wardrobe is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanDress.wardrobe is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanDress.wardrobe is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanDress.wardrobe is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanDress.wardrobe is provided by the chain that implements IAutoMovieMotionHumanDress.
   */
  wardrobe(
    params: IAutoMovieMotionHumanDress.IWardrobe,
    anchor?: string,
  ): Chain;

  /**
   * A one-handed greeting that lifts and reseats a hat already worn on the performer's head.
   *
   * @param params The `prop` and `hand` of `IAutoMovieMotionHumanTipHat`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanDress.tipHat is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanDress.tipHat is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanDress.tipHat is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanDress.tipHat is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanDress.tipHat is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanDress.tipHat is provided by the chain that implements IAutoMovieMotionHumanDress.
   */
  tipHat(params: IAutoMovieMotionHumanDress.ITipHat, anchor?: string): Chain;

  /**
   * Drawing a blade out of the carrier it is staged seated in: the hand grips the blade's handle, then draws it out along the carrier's guide from the seat to the entry, where the hand holds it. With `pull`, the other hand first takes the carrier's throat, for a blade longer than the arm draws alone.
   *
   * @param params The `sheath`, `hand` and `pull` of `IAutoMovieMotionHumanDress.IDrawFromCarrier`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the grip and the draw appended; the grip's `gripClosed` marks closure, and the draw's `unseated` and `drawn` mark the start and the end of the withdrawal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanDress.drawFromCarrier is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanDress.drawFromCarrier is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanDress.drawFromCarrier is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanDress.drawFromCarrier is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanDress.drawFromCarrier is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanDress.drawFromCarrier is provided by the chain that implements IAutoMovieMotionHumanDress.
   */
  drawFromCarrier(
    params: IAutoMovieMotionHumanDress.IDrawFromCarrier,
    anchor?: string,
  ): Chain;

  /**
   * Returning the held blade through the carrier's entry to its seat: the hand carries the blade to the entry, the carrier's guide takes it straight to the seat at the same attitude, and the hand opens as the blade mounts on the seat.
   *
   * @param params The `sheath` and `hand` of `IAutoMovieMotionHumanDress.IPutDownAperture`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the return appended; its `aperture`, `placed` and `release` events mark the entry, the seat and the opened hand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanDress.putDownAperture is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanDress.putDownAperture is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanDress.putDownAperture is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanDress.putDownAperture is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanDress.putDownAperture is provided by the chain that implements IAutoMovieMotionHumanDress.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanDress.putDownAperture is provided by the chain that implements IAutoMovieMotionHumanDress.
   */
  putDownAperture(
    params: IAutoMovieMotionHumanDress.IPutDownAperture,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the Dress methods.
 */
export namespace IAutoMovieMotionHumanDress {
  /**
   * The parameters of `dress`: the dressing law's own `IAutoMovieMotionHumanDress.IParams` (imported as `IAutoMovieMotionHumanDress`), unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged, with its import name.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The dressing folder's `IAutoMovieMotionHumanDress` owns the type; the alias serves this family's `dress` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `dress` takes the type its law reads.
   */
  export type IDress = IAutoMovieMotionHumanDress.IParams;

  /**
   * The parameters of `wardrobe`: the law's own `IAutoMovieMotionHumanWardrobe`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanWardrobe` owns the type; the alias serves this family's `wardrobe` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `wardrobe` takes the type its law reads.
   */
  export type IWardrobe = IAutoMovieMotionHumanWardrobe;

  /**
   * The parameters of `tipHat`: the law's own `IAutoMovieMotionHumanTipHat`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTipHat` owns the type; the alias serves this family's `tipHat` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `tipHat` takes the type its law reads.
   */
  export type ITipHat = IAutoMovieMotionHumanTipHat;

  /**
   * The parameters of `drawFromCarrier`: the staged pair, the drawing hand and the other hand's pull.
   *
   * The pair is `HumanSheath.of`'s staged record, which names the blade, the carrier and the sockets the draw runs between.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member, its default and what the staged pair holds.
   * @evidence contracts/development/design.md#principled-representation The staged record and the draw's own pull type, so the method reads the identities the staging derived and states none of its own.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, the ones `HumanSheath.draw` reads besides the chain and the anchor.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: every member is optional or required as `HumanSheath.draw` takes it.
   */
  export interface IDrawFromCarrier {
    /** The staged blade and carrier, as `HumanSheath.of` returns them. */
    sheath: IAutoMovieMotionHumanSheath.IStaged;

    /** The drawing hand; `right` when absent. */
    hand?: AutoMovieHumanSide;

    /** The other hand's pull on a worn carrier, for a blade longer than the arm draws alone; the carrier holds still when absent. */
    pull?: IAutoMovieMotionHumanDrawFromCarrier.IPull;
  }

  /**
   * The parameters of `putDownAperture`: the staged pair and the holding hand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member and its default.
   * @evidence contracts/development/design.md#principled-representation The staged record names the entry, the seat and the guide, so the return states no frame of its own.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, the ones `HumanSheath.sheathe` reads besides the chain and the anchor.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the hand is optional as `HumanSheath.sheathe` takes it.
   */
  export interface IPutDownAperture {
    /** The staged blade and carrier, as `HumanSheath.of` returns them. */
    sheath: IAutoMovieMotionHumanSheath.IStaged;

    /** The holding hand; `right` when absent. */
    hand?: AutoMovieHumanSide;
  }
}

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
