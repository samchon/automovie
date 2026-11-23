import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanBindPartner } from "../dressing/IAutoMovieMotionHumanBindPartner";
import type { IAutoMovieMotionHumanCoatPartner } from "../dressing/IAutoMovieMotionHumanCoatPartner";
import type { IAutoMovieMotionHumanDressPartner } from "../dressing/IAutoMovieMotionHumanDressPartner";
import type { IAutoMovieMotionHumanPlaceOverHead } from "../dressing/IAutoMovieMotionHumanPlaceOverHead";
import type { IAutoMovieMotionHumanPresentHand } from "../dressing/IAutoMovieMotionHumanPresentHand";
import type { IAutoMovieMotionHumanSlipRing } from "../dressing/IAutoMovieMotionHumanSlipRing";

/**
 * Dressing another person, or being dressed by one: binding, coating, ring and
 * garment handovers between a dresser and a partner, and the staged
 * straightening of a tie or a cuff. The laws are planned by the chain between
 * the two bodies; the two helpers append shipped touch actions to the
 * performer's chain, so they are fitted, refused and checked as those actions
 * are.
 *
 * The helpers djustCuff and straightenPartnerTie take the chain first and
 * return it with the actions appended, as the runtime namespace takes it; the
 * laws take their parameters and an anchor.
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanGetDressed` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method takes and returns.
 */
export interface IAutoMovieMotionHumanGetDressed<Chain> {
  /**
   * Bind another performer with a held restraint: handcuffs closed on a wrist
   * and linked to the other wrist, a rope tied round the wrists or the ankles.
   * The binder carries the restraint to the partner's region, it is worn there
   * from the arrival, and the bound parts keep their places within the link's
   * slack until a later grip takes it off.
   *
   * Registered law: `registered("bindPartner", params)`; not a chain method.
   *
   * @param params The `hold` and `link` of `IAutoMovieMotionHumanBindPartner`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  bindPartner(params: IAutoMovieMotionHumanBindPartner, anchor?: string): Chain;

  /**
   * Put a held wearable on another performer: a ring onto a finger, a necklace
   * at the nape, a medal or a flower at the chest, a crown on the head. The
   * dresser carries the item to the partner's region, it is worn there from the
   * arrival, and the hand lets go and returns.
   *
   * Registered law: `registered("dressPartner", params)`; not a chain method.
   *
   * @param params The `prop`, `partner`, `region`, `side`, `point` and `hold`
   *   of `IAutoMovieMotionHumanDressPartner`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  dressPartner(
    params: IAutoMovieMotionHumanDressPartner,
    anchor?: string,
  ): Chain;

  /**
   * Help a partner into a coat: the dresser stands behind, carries the held
   * open-front jacket up to the partner's collar and holds it open while the
   * partner's arms go back into its sleeves, then lets go and the jacket is
   * worn on the partner's chest.
   *
   * Registered law: `registered("coatPartner", params)`; not a chain method.
   *
   * @param params The `prop`, `partner`, `hand` and `hold` of
   *   `IAutoMovieMotionHumanCoatPartner`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  coatPartner(params: IAutoMovieMotionHumanCoatPartner, anchor?: string): Chain;

  /**
   * Slip a ring onto a partner's finger: the partner presents a hand, the
   * dresser's other hand holds it from below, and the hand that holds the ring
   * brings its hole onto the fingertip and slides it to the finger's base,
   * where it is worn from then on.
   *
   * Registered law: `registered("slipRing", params)`; not a chain method.
   *
   * @param params The `prop`, `partner`, `hand`, `finger` and `side` of
   *   `IAutoMovieMotionHumanSlipRing`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  slipRing(params: IAutoMovieMotionHumanSlipRing, anchor?: string): Chain;

  /**
   * Present a hand to a partner and keep it there: the upper arm hangs, the
   * forearm comes forward level at the elbow's height and the hand is held out
   * palm down, fingers forward, for a ring to be slipped on or a hand to be
   * kissed, then it returns.
   *
   * Registered law: `registered("presentHand", params)`; not a chain method.
   *
   * @param params The `side` and `hold` of `IAutoMovieMotionHumanPresentHand`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  presentHand(params: IAutoMovieMotionHumanPresentHand, anchor?: string): Chain;

  /**
   * Set a neck loop over a partner's head with both hands: a ribbon medal over
   * a bowed head, or a necklace from behind a seated partner; the loop is
   * raised above the crown, lowered round the head to the neck and worn on the
   * upper chest, and the hands let go.
   *
   * Registered law: `registered("placeOverHead", params)`; not a chain method.
   *
   * @param params The `prop`, `partner` and `side` of
   *   `IAutoMovieMotionHumanPlaceOverHead`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  placeOverHead(
    params: IAutoMovieMotionHumanPlaceOverHead,
    anchor?: string,
  ): Chain;

  /**
   * Straighten a partner's tie, facing them: the flat palm of one hand smooths
   * the tie's front blade along the partner's sternum with one short sweep,
   * read where the partner stands when the touch starts, so the partner is
   * placed first.
   *
   * @param chain The dresser's entry chain.
   * @param params The partner and side of
   *   `IAutoMovieMotionHumanGetDressed.IStraightenPartnerTie`.
   * @param anchor A stable cue id for the smoothing action; none when absent.
   * @returns The same kind of chain with one touch appended.
   */
  straightenPartnerTie(
    chain: Chain,
    params: IAutoMovieMotionHumanGetDressed.IStraightenPartnerTie,
    anchor?: string,
  ): Chain;

  /**
   * Adjust one's own cuff: the sleeved wrist is presented across the waist and
   * the opposite hand's curled fingertips squeeze the cuff for a brief hold;
   * the wrist is the garment landmark.
   *
   * @param chain The performer's entry chain.
   * @param params The cuff of `IAutoMovieMotionHumanGetDressed.IAdjustCuff`.
   * @param anchor A stable cue id for the adjustment; none when absent.
   * @returns The same kind of chain with one touch appended.
   */
  adjustCuff(
    chain: Chain,
    params: IAutoMovieMotionHumanGetDressed.IAdjustCuff,
    anchor?: string,
  ): Chain;
}

/** The parameter types of the GetDressed methods. */
export namespace IAutoMovieMotionHumanGetDressed {
  /** The parameters of `straightenPartnerTie`. */
  export interface IStraightenPartnerTie {
    /** The partner's subject whose tie is straightened. */
    partner: string;

    /** The smoothing hand. */
    side: AutoMovieHumanSide;
  }

  /** The parameters of `adjustCuff`. */
  export interface IAdjustCuff {
    /** The side of the sleeve being adjusted. */
    cuff: AutoMovieHumanSide;
  }
}
