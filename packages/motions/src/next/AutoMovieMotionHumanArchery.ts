import { HumanArchery as HumanArcherySource } from "../lexicon/internal/HumanArchery";
import { HumanLasso as HumanLassoSource } from "../lexicon/internal/HumanLasso";
import { HumanThrownWeapon as HumanThrownWeaponSource } from "../lexicon/internal/HumanThrownWeapon";
import { HUMAN_ARCHERY_PRESENT_BOW } from "./presets/HUMAN_ARCHERY_PRESENT_BOW";
import { HUMAN_ARCHERY_THROW_JAVELIN } from "./presets/HUMAN_ARCHERY_THROW_JAVELIN";
import { HUMAN_ARCHERY_THROW_KNIFE } from "./presets/HUMAN_ARCHERY_THROW_KNIFE";

/**
 * Archery and the thrown weapons: taking and nocking an arrow, presenting and
 * drawing a bow, loosing it, spanning, presenting and shooting a crossbow,
 * throwing a weapon and swinging a lasso.
 *
 * The shared grasp and placement laws take the inert prop from its slot to a
 * moving socket (the quiver's slot site, the bow's `nock` socket). The release
 * laws can hand the prop off to a scene-authored animation carrier on a film
 * cue (`IAutoMovieMotionHumanLexiconArcheryParams.IContinuation`). The family
 * fixes no draw time, hold time or arrow speed: the pick up, put down and
 * operate laws time the actions, and the flight belongs to the carrier.
 *
 * The presets are the constants of `AutoMovieMotionHumanArchery` that the rows
 * read: `PRESENT_BOW` (the bow held out in one hand from the face along the
 * line from its `nock`, the bow arm extended), `THROW_JAVELIN` (the javelin and
 * the spear thrown overarm at the middle of the elite release angles Campos,
 * Brizuela and Ramon 2004 measured, 27.7 to 40.1 degrees, 33.9 degrees, the
 * shaft along its velocity) and `THROW_KNIFE` (overarm, spinning whole half
 * turns to the target).
 *
 * Presets, named parameter values spread into a law's parameters beside the
 * hold; a preset adds no method:
 *
 * - `PRESENT_BOW`: The present bow preset: the bow held out in one hand with the
 *   line of aim from the face, its `rest` as the point the line from `nock`
 *   passes through, the bow arm extended.
 * - `THROW_JAVELIN`: The throw javelin preset: a javelin or a spear thrown
 *   overarm at the middle of the elite release angles Campos, Brizuela and
 *   Ramon (2004) measured at the 1999 World Championships (27.7 to 40.1
 *   degrees), 33.9 degrees, the shaft along its velocity.
 * - `THROW_KNIFE`: The throw knife preset: a knife thrown overarm and spinning
 *   whole half turns over the flight to the target.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanArchery`: Archery under its own names.
 * - `HumanThrownWeapon`: Thrown weapons as rows of `throwObject`, each throwing
 *   the held prop the composition names (`prop`), which rides the hand to the
 *   release and then flies.
 * - `HumanLasso`: Rope from the saddle (`IAutoMovieMotionHumanLasso`): carried on
 *   the saddle, the rider's wrist circles over the right shoulder, one turn per
 *   stride of the horse's own stride cue (or per second); the hand takes the
 *   turn its arm strains least in, and the held lariat goes where the hand
 *   holds it (`StrikingHeld`); at the release the wrist reaches out toward the
 *   target and the lariat is launched so its loop's centre flies the projectile
 *   that meets the target's contact at the catch; with a dally the hand then
 *   circles the horn its turns and holds there.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanArchery} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanArchery {
  /**
   * Archery under its own names. Shared grasp and placement laws take the same
   * inert prop from its slot to a moving socket. The release rows can hand it
   * off to a scene-authored animation carrier on a film cue.
   *
   * The rows fix no time: the pick up, put down and operate laws time them, and
   * the release is handed to a scene-authored carrier on a film cue.
   *
   * - `takeArrow`: a pick up of the arrow by its shaft just ahead of the nock
   *   (`nockGrip`), where the fingers hold it to nock it, from where the
   *   composition says it lies (a quiver's slot site).
   * - `nockArrow`: a put down of the arrow's nock onto the bow's `nock` socket,
   *   its shaft on the bow's `rest`.
   * - `presentBow`: presenting the bow in one hand with the line of aim from the
   *   face (`HumanWeaponPresent`, anchor `face`), the bow's `rest` as the
   *   working point the line from `nock` passes through, independently of the
   *   rest's surface normal, the bow arm extended to its own reach along the
   *   line (`extended`), as the shot cycle's set-up raises it toward the
   *   target.
   * - `drawBow`: an operation of the bow's `string` slider by the drawing hand,
   *   performed over `presentBow` (`AutoMovieMotionHumanChain.over`) from the set-up, so the
   *   string is drawn while the bow rises and the bow arm extends (the shot
   *   cycle's set-up and pre-draw, KSL Shot Cycle); the hand takes the string
   *   where the bow arm carries the bow (`onBowArm`: the grip the bow arm's own
   *   goal asks, never the bow's displayed frame) and draws it to the anchor
   *   under the chin, at most the travel given (`toAnchor`), and the string's
   *   drive moves the nock and, by `follows`, bends the limbs.
   * - `loose`: a release of the drawing hand, or a staged hand-off at `open` and
   *   visible string recovery when a continuation is supplied.
   * - `spanCrossbow`: an operation of the crossbow's `string` (a straight pull
   *   with the foot in the `stirrup`) or its `crank`, to full travel.
   * - `presentCrossbow`: presenting the crossbow with the cheek anchor, fixed
   *   rail mark and separate support-hand contact.
   * - `shootCrossbow`: a staged trigger and string cue with a bolt hand-off at
   *   `strokeStart` when a continuation is supplied.
   *
   * The phases are Nishizono et al.'s as Simsek and Ertan cite them (bow hold,
   * drawing, full draw, aiming, release, follow-through); their durations are
   * not yet read at a source and are the shipped laws' own, provisional. A draw
   * tradition (the Mediterranean draw, the thumb draw of a horse bow) is the
   * composition's choice of hand and anchor, not a law.
   */
  export import HumanArchery = HumanArcherySource;

  /**
   * Thrown weapons as rows of `throwObject`, each throwing the held prop the
   * composition names (`prop`), which rides the hand to the release and then
   * flies. Every row throws overarm with the style's 0.5 s windup, at a release
   * angle of 20 degrees but the javelin and the spear's 33.9, and the speed
   * that range equation gives for the stand-off
   * (`IAutoMovieMotionHumanThrowObjectForm.Style`): a farther target is a
   * faster throw, and no row fixes a speed.
   *
   * - `throwJavelin` and `throwSpear`: overarm, the shaft along its velocity,
   *   released at the middle of the release angles Campos, Brizuela and Ramón
   *   (2004) measured in elite men at the 1999 World Championships (27.7 to
   *   40.1 degrees), 33.9 degrees; a soldier's lower speed follows from the
   *   range equation to the target. The athletes' run-up is not planned here.
   * - `throwKnife`: overarm, spinning at the throwing arm's rate rounded to a
   *   whole number of half turns over the flight to the target, so the
   *   stand-off decides the turns (`throwObjectLever.spin`).
   * - `throwGrenade`, `hurlStone` and `hurlBottle`: overarm at the style's angle,
   *   the body tumbling as it was released.
   * - `sling` and `castAtlatl`: overarm from the implement the composition names
   *   (`implement`, a sling's pouch, an atlatl's spur), which lengthens the
   *   lever the launch leaves from (`throwObjectLever`).
   */
  export import HumanThrownWeapon = HumanThrownWeaponSource;

  /**
   * Rope from the saddle (`IAutoMovieMotionHumanLasso`): carried on the saddle,
   * the rider's wrist circles over the right shoulder, one turn per stride of
   * the horse's own stride cue (or per second); the hand takes the turn its arm
   * strains least in, and the held lariat goes where the hand holds it
   * (`StrikingHeld`); at the release the wrist reaches out toward the target
   * and the lariat is launched so its loop's centre flies the projectile that
   * meets the target's contact at the catch; with a dally the hand then circles
   * the horn its turns and holds there. Register `HumanLasso` to use it.
   */
  export const HumanLasso: typeof HumanLassoSource = HumanLassoSource;

  /**
   * The present bow preset: the bow held out in one hand with the line of aim
   * from the face, its `rest` as the point the line from `nock` passes through,
   * the bow arm extended. The `presentBow` row of `HumanArchery` reads it, so
   * the row and the preset share one value.
   */
  export const PRESENT_BOW: typeof HUMAN_ARCHERY_PRESENT_BOW =
    HUMAN_ARCHERY_PRESENT_BOW;

  /**
   * The throw javelin preset: a javelin or a spear thrown overarm at the middle
   * of the elite release angles Campos, Brizuela and Ramon (2004) measured at
   * the 1999 World Championships (27.7 to 40.1 degrees), 33.9 degrees, the
   * shaft along its velocity. The `throwJavelin` and `throwSpear` rows of
   * `HumanThrownWeapon` read it, so the row and the preset share one value.
   */
  export const THROW_JAVELIN: typeof HUMAN_ARCHERY_THROW_JAVELIN =
    HUMAN_ARCHERY_THROW_JAVELIN;

  /**
   * The throw knife preset: a knife thrown overarm and spinning whole half
   * turns over the flight to the target. The `throwKnife` row of
   * `HumanThrownWeapon` reads it, so the row and the preset share one value.
   */
  export const THROW_KNIFE: typeof HUMAN_ARCHERY_THROW_KNIFE =
    HUMAN_ARCHERY_THROW_KNIFE;
}
