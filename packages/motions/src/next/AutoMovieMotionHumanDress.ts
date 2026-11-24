import { composeHumanStraightenTie as composeHumanStraightenTieLaw } from "../dressing/composeHumanStraightenTie";
import { dress as dressLaw } from "../dressing/dress";
import { tipHat as tipHatLaw } from "../dressing/tipHat";
import { wardrobe as wardrobeLaw } from "../dressing/wardrobe";
import { HumanSheath as HumanSheathSource } from "../handling/HumanSheath";
import { drawFromCarrier as drawFromCarrierLaw } from "../handling/drawFromCarrier";
import { HumanCarrierCustody as HumanCarrierCustodySource } from "../lexicon/HumanCarrierCustody";
import { HumanDressRows as HumanDressRowsSource } from "../lexicon/HumanDressRows";

/**
 * Putting on, taking off and fastening clothing.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `dress`: Putting on a hat or a pair of glasses held in one hand, with both
 *   hands, while standing.
 * - `wardrobe`: Put coarse stage wearables onto or take them off a real
 *   performer.
 * - `tipHat`: Take a stiff hat by its declared brim grip, lift it briefly and set
 *   it back on the head (Emily Post, _Etiquette_, 1922, “Lifting the Hat,”
 *   https://www.gutenberg.org/ebooks/14314).
 * - `composeHumanStraightenTie`: Stage straightening the front blade of a tie
 *   with a short up-and-down sweep of the fingertips at the sternum.
 * - `drawFromCarrier`: Draw a gripped object out of its carrier along a straight
 *   line, the inverse of aperture placement (`putDownAperture`): a sword drawn
 *   from its scabbard.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanSheath`: Stage a blade seated in its carrier, draw it out on screen and
 *   return it.
 * - `HumanDressRows`: Putting on a worn item as rows: each item of `dress` under
 *   a name of its own, the prop, the hand and the manner open.
 * - `HumanCarrierCustody`: Take a mounted display object from its carrier with
 *   the ordinary pickup grip and lift.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanDress} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanDress {
  /**
   * Putting on a hat or a pair of glasses held in one hand, with both hands,
   * while standing.
   *
   * The item is the wearable prop the hand holds since a pick-up (`prop`, by
   * its `hold`): that hand carries it, rigid in the hand
   * (`AutoMovieMotionHumanHeld`), so that its own `wear` socket comes onto the
   * head's region it is worn on (`HumanWorn`: a hat's on the crown, a pair of
   * glasses' on the nose's bridge), spectacles facing the way the body faces
   * and a hat, round about its crown, at whichever turn the arm, fitted within
   * its ranges, brings the wear socket nearest the crown at (the shared
   * chooser, `HumanFreedomChoice`, the turn a wrapped freedom); from the stroke
   * it is worn on the head (`IHumanActionPlan.wears`) and the hand lets go. The
   * other hand steadies it at a place on the performer's own head, read on the
   * posture so it follows the head: a hat's brim at the side of the head's
   * girth (`HAT`, provisional), the palm on the head's own surface; a pair of
   * glasses' temple just before the ear, the index finger pointing back along
   * it. Both hands rise to a place a quarter of the forearm before the item's
   * final place in front of the face (the item held up), then move it onto the
   * head in a stroke, hold it a moment and return. The reach takes the
   * free-space movement time (`AutoMovieMotionHumanTiming.transport`) of the
   * farther hand's way from where it starts to where it holds the item up, in
   * free space before the face, the stroke a beat
   * (`AutoMovieMotionHumanTiming.PAUSES`). The shoulder's elevation stays
   * within the functional ranges of daily tasks (flexion 121, abduction 128
   * degrees, Namdari et al. 2012, J Shoulder Elbow Surg 21:1177), which the
   * capture checks. Events: the phrase's `ready` (item held up), `strokeStart`,
   * `stroke` (item on), `relax` (hands off).
   *
   * Not yet: the jacket through rigid sleeve sockets, shoes and socks while
   * seated, zips and buttons (garment sockets as props), and a watch on the
   * other wrist.
   */
  export import dress = dressLaw;

  /**
   * Put coarse stage wearables onto or take them off a real performer.
   *
   * A previously held open-front jacket is carried into position while the
   * other hand passes into its named sleeve. It transfers from the grasping
   * hand to the chest. The remaining sleeve can be threaded, and either sleeve
   * can be cleared, with the pose on that same jacket. The zip moves with the
   * hand on its actual slider. Its travel is retained by the native prop drive.
   * The seated footwear modes reuse a chair and an opposite foot plant while
   * transferring the shell onto or out of the raised foot.
   *
   * Clegg et al. describe independent alignment and sleeve passage phases in
   * Animating Human Dressing (2015),
   * https://sites.cc.gatech.edu/gvu/people/faculty/greg.turk/paper_pages/2015_animating_human_dressing/index.html.
   * The jacket here uses explicit short openings and imposes staged rigid
   * poses.
   */
  export const wardrobe: typeof wardrobeLaw = wardrobeLaw;

  /**
   * Take a stiff hat by its declared brim grip, lift it briefly and set it back
   * on the head (Emily Post, _Etiquette_, 1922, “Lifting the Hat,”
   * https://www.gutenberg.org/ebooks/14314). The lift is provisionally one
   * third of the head radius. `strokeStart` closes the grip, `stroke` marks the
   * lift's apex and `strokeEnd` reseats the hat. The action uses a still base.
   * Stage the hat on the performer's crown with its wear socket facing inward
   * and keep it worn until the action starts.
   */
  export const tipHat: typeof tipHatLaw = tipHatLaw;

  /**
   * Stage straightening the front blade of a tie with a short up-and-down sweep
   * of the fingertips at the sternum. The sternum serves as the garment
   * landmark. The optional anchor names the smoothing action.
   *
   * @param chain The performer's entry chain.
   * @param side The smoothing hand.
   * @param anchor A stable cue id for the smoothing action.
   * @returns The same kind of chain with one touch appended.
   */
  export const composeHumanStraightenTie: typeof composeHumanStraightenTieLaw =
    composeHumanStraightenTieLaw;

  /**
   * Draw a gripped object out of its carrier along a straight line, the inverse
   * of aperture placement (`putDownAperture`): a sword drawn from its scabbard.
   * Register it with `HumanChain.extend({ drawFromCarrier })` or by name, and
   * with the performance.
   *
   * The hand has gripped the seated object (a pickup with no lift). The object
   * then rides the carrier's slide socket while the action drives the carrier's
   * slider from the seat to the opening on one minimum-jerk movement, timed as
   * a loaded carry (`HumanPrehension.carry`), so the carrier keeps it on its
   * line as a scabbard guides its blade. The hand follows on its grip, its
   * wrist placed through the grip's rigid offset read from the displayed frames
   * at the start, and takes the object over at the opening. The rest of the
   * body holds the posture the action was entered in, so the carrier, worn or
   * placed, holds still under the line. Adult insertion trials separate the
   * transport to an opening from the aligned insertion (Ossmy et al. 2020,
   * https://pmc.ncbi.nlm.nih.gov/articles/PMC6851484/); this is the aligned
   * part run backward. The fitted hand is judged against its planned place on
   * the grip at plan time, and a draw it cannot follow is refused rather than
   * shown with the hand off the hilt. Events: `unseated` at the start and
   * `drawn` at the end. A cut to `stand` inside the draw, or to `walk` at its
   * end, keeps the grip. Over a carrier (a seated rider's draw), the draw
   * claims only its hands and arms, their goals riding the bone the carrier is
   * worn on so they follow the line as the body moves; there the fit is not
   * judged against the line. With a `pull`, a blade longer than the arm's
   * reach, the other hand slides the carrier back along its own line and then
   * turns it about where it hangs toward the drawing shoulder, each by the
   * least that brings the drawn wrist within reach (`pivoting`), while the
   * trunk turns away, and the blade leaves low and in front along the moving
   * line.
   */
  export const drawFromCarrier: typeof drawFromCarrierLaw = drawFromCarrierLaw;

  /**
   * Stage a blade seated in its carrier, draw it out on screen and return it.
   *
   * `of` derives, on the carrier's mouth axis, the seat where the blade's frame
   * sits when sheathed, the entry where it sits once drawn, a slider from the
   * seat toward the entry and a socket riding it, the carrier's guide; it
   * mounts the blade on the seat from the film's start. `draw` grips the handle
   * with the carrier pickup and no lift (`HumanCarrierCustody`), then draws the
   * blade out on the guide to the entry, where the hand takes it
   * (`drawFromCarrier`); `sheathe` brings it to the entry and returns it on the
   * guide to the seat with aperture placement (`putDownAperture`). Register the
   * three laws with the performance. The line is the carrier's own, so it holds
   * for a canted or a worn carrier alike. The prop's identity is the same
   * subject through seat, guide, hand, guide and seat again.
   *
   * Stage practice draws and resheathes along the scabbard's line so the blade
   * never binds or cuts the throat.
   */
  export import HumanSheath = HumanSheathSource;

  /**
   * Putting on a worn item as rows: each item of `dress` under a name of its
   * own, the prop, the hand and the manner open.
   *
   * Each row writes no motion: its law plans it, so it fits any body, refuses
   * and is checked as the law is, and its draws are keyed by its own name. The
   * rows over the arm's phrases themselves are `HumanUpperRows`.
   */
  export import HumanDressRows = HumanDressRowsSource;

  /**
   * Take a mounted display object from its carrier with the ordinary pickup
   * grip and lift. Register this law in the composition that stages the
   * carrier. A cut to stand from grip closure through lift retains the hand's
   * grip and the last displayed pose, and a cut to `drawFromCarrier` from grip
   * closure starts the draw before the body straightens. The authored carrier
   * and lift must allow that pose to remain clear.
   *
   * The reach is the pick-up's, about 0.5 s for a 0.4 m reach, then a 0.15 s
   * load and a 0.1 m lift (`IAutoMovieMotionHumanPickUp`); taking a held item
   * from its carrier, a tray or a mannequin.
   */
  export const HumanCarrierCustody: typeof HumanCarrierCustodySource =
    HumanCarrierCustodySource;
}
