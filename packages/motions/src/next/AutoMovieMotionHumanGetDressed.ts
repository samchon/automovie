import { bindPartner as bindPartnerLaw } from "../dressing/bindPartner";
import { coatPartner as coatPartnerLaw } from "../dressing/coatPartner";
import { composeHumanAdjustCuff as composeHumanAdjustCuffLaw } from "../dressing/composeHumanAdjustCuff";
import { composeHumanStraightenPartnerTie as composeHumanStraightenPartnerTieLaw } from "../dressing/composeHumanStraightenPartnerTie";
import { dressPartner as dressPartnerLaw } from "../dressing/dressPartner";
import { placeOverHead as placeOverHeadLaw } from "../dressing/placeOverHead";
import { presentHand as presentHandLaw } from "../dressing/presentHand";
import { slipRing as slipRingLaw } from "../dressing/slipRing";

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
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `bindPartner`: Bind another performer with a held restraint.
 * - `dressPartner`: Dress another performer.
 * - `coatPartner`: Help a partner into a coat.
 * - `slipRing`: Slip a ring onto a partner's finger.
 * - `presentHand`: Present a hand to a partner.
 * - `placeOverHead`: Set a neck loop over a partner's head.
 * - `straightenPartnerTie`: Stage straightening a partner's tie, facing them: the
 *   flat palm of one hand smooths the tie's front blade along the partner's
 *   sternum with one short sweep, as `composeHumanStraightenTie` does on one's
 *   own with the fingertips; on another's chest the palm lays the blade flat.
 * - `adjustCuff`: Stage a cuff adjustment by presenting the sleeved wrist across
 *   the waist and bringing the opposite hand's curled fingertips to the cuff
 *   for a brief hold.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanGetDressed} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanGetDressed {
  /**
   * Bind another performer with a held restraint. The binder's hand carries the
   * restraint to the partner's region by the arm phrase that visits a target,
   * the fingers down and the palm turned in (the thumb ahead, clear of the
   * binder's own hips), and the restraint is worn on the bone under the region
   * from the phrase's stroke with the link: the partner's other region's bone,
   * or a scene target, and the slack. The performance then keeps the bound
   * parts where they were when the restraint went on (`HumanPerformanceBonds`)
   * until a later grip takes it off.
   */
  export const bindPartner: typeof bindPartnerLaw = bindPartnerLaw;

  /**
   * Dress another performer. The dresser's hand carries the held item to the
   * partner's region by the arm phrase that visits a target, the item is worn
   * on the partner's bone under that region from the phrase's stroke, when the
   * hand arrives, and the hand's grip ends there and no hold is left on the
   * item, so custody passes from the hand to the partner's body without a gap
   * or an overlap. The partner's region is read where it is at the phrase's
   * start, so a partner who presents a hand, bows or kneels first is met where
   * they stand. A region beyond the standing arm, such as a kneeling partner's
   * crown, is reached by the least hinge at the hips that brings the wrist
   * within the arm (`HumanTrunkLean`), so the dresser keeps its standoff; no
   * hinge within the hip's range is refused as a reach.
   */
  export const dressPartner: typeof dressPartnerLaw = dressPartnerLaw;

  /**
   * Help a partner into a coat. The dresser's holding hand carries the jacket's
   * `wear` socket up to the partner's collar, read from the partner's shoulders
   * and heading at the action's start, and holds it there still for the
   * authored span. Meanwhile the partner threads each sleeve with `wardrobe`'s
   * `sleeveIn`, whose openings stay where the held jacket keeps them. Then the
   * hand lets go, the jacket is worn on the partner's chest from that instant,
   * and the hand returns. The jacket thus has one carrier at a time: the
   * dresser's grip, then the partner's chest.
   */
  export const coatPartner: typeof coatPartnerLaw = coatPartnerLaw;

  /**
   * Slip a ring onto a partner's finger. The partner's presented hand is read
   * where it is at the action's start, so the partner presents it first
   * (`presentHand`). The dresser's other hand takes the partner's forearm from
   * its own side, its fingers toward the partner's wrist, before the ring hand
   * leaves its rest, and lets go once the ring hand is back at it (Guiard 1987:
   * the non-dominant hand leads and lags). The ring hand brings the ring's hole
   * onto the finger's axis `LINE_UP` beyond the fingertip by `ready`, then
   * slides it along the axis to `SEAT` of the proximal phalanx over the stroke:
   * the ring's `wear` axis lies along the finger, from the fingertip toward the
   * hand, its roll about the finger the one, by `ROLL` steps, that turns the
   * holding hand least from how it holds the ring. From `strokeEnd` the ring is
   * worn on the partner's proximal bone and the ring hand's grip ends, so
   * custody passes without a gap; both hands then return. Both arms are laid in
   * one course (`courseArmGoal` with `with`), the hands excused from each
   * other. A presented hand beyond the standing arms is reached by the least
   * hinge at the hips that brings both wrists within their arms
   * (`HumanTrunkLean`), as `dressPartner` reaches a region, so the dresser
   * keeps its standoff.
   */
  export const slipRing: typeof slipRingLaw = slipRingLaw;

  /**
   * Present a hand to a partner. The palm goes, palm down and fingers forward,
   * to the place the arm reaches with the upper arm hanging and the forearm
   * level ahead: `INWARD` of the shoulder's half width out from the midline,
   * the upper arm's length below it, the forearm and half the hand ahead of it,
   * all from the body's own measure; it stays the authored seconds and returns.
   * The arm is laid as one course (`courseArmGoal`). Events: `ready` once
   * presented, `relax` as it starts back.
   */
  export const presentHand: typeof presentHandLaw = presentHandLaw;

  /**
   * Set a neck loop over a partner's head. The loop's path is
   * `placeOverHeadPath`'s, read on the partner's displayed body at the action's
   * start, so a partner who bows, kneels or sits first is met where they are.
   * The hand that holds the loop at entry first presents it level before the
   * chest (its nearest edge `PRESENT` off the chest, `BELOW` the shoulders),
   * turned as it will go over the head, and the other hand closes on the loop's
   * other handle there by `ready`, without carrying it. Both hands carry it
   * along the path over the stroke; at `strokeEnd` it is worn on the partner's
   * upper chest (the sternum region's bone) and both grips end, and the hands
   * return. Both arms are laid in one course (`courseArmGoal` with `with`).
   * Before any of it, the loop's inner half-breadth is checked against the
   * partner's head radius, and the hands' highest places, above the crown,
   * against the arm's reach from each shoulder: a loop too narrow for the head,
   * or a crown the arms cannot clear (a standing tall partner), is refused with
   * the measure, so the partner bows or kneels. Down past the crown to a seated
   * partner's nape and chest the dresser hinges at the hips by the least angle
   * that keeps both wrists within their arms along the path (`HumanTrunkLean`),
   * as `dressPartner` reaches a kneeling crown.
   */
  export const placeOverHead: typeof placeOverHeadLaw = placeOverHeadLaw;

  /**
   * Stage straightening a partner's tie, facing them: the flat palm of one hand
   * smooths the tie's front blade along the partner's sternum with one short
   * sweep, as `composeHumanStraightenTie` does on one's own with the
   * fingertips; on another's chest the palm lays the blade flat. The partner's
   * sternum is the garment's landmark, read where the partner stands when the
   * touch starts, so the partner is placed first.
   *
   * @param chain The dresser's entry chain.
   * @param params The partner whose tie is straightened and the smoothing side.
   * @param anchor A stable cue id for the smoothing action.
   * @returns The same kind of chain with one touch appended.
   */
  export const straightenPartnerTie: typeof composeHumanStraightenPartnerTieLaw =
    composeHumanStraightenPartnerTieLaw;

  /**
   * Stage a cuff adjustment by presenting the sleeved wrist across the waist
   * and bringing the opposite hand's curled fingertips to the cuff for a brief
   * hold. The wrist serves as the garment landmark.
   *
   * @param chain The performer's entry chain.
   * @param params The `cuff` side of the sleeve being adjusted.
   * @param anchor A stable cue id for the adjustment.
   * @returns The same kind of chain with one touch appended.
   */
  export const adjustCuff: typeof composeHumanAdjustCuffLaw =
    composeHumanAdjustCuffLaw;
}
