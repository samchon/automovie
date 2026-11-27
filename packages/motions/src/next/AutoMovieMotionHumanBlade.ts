import { HumanBlade as HumanBladeSource } from "../lexicon/internal/HumanBlade";
import { HumanLanceCouch as HumanLanceCouchSource } from "../lexicon/internal/HumanLanceCouch";
import { HumanSabre as HumanSabreSource } from "../lexicon/internal/HumanSabre";
import { HumanSword as HumanSwordSource } from "../lexicon/internal/HumanSword";
import { HumanSwordGuard as HumanSwordGuardLaw } from "../lexicon/internal/HumanSwordGuard";
import { HumanSwordParry as HumanSwordParrySource } from "../lexicon/internal/HumanSwordParry";
import { HumanSwordTaken as HumanSwordTakenSource } from "../lexicon/internal/HumanSwordTaken";
import { HumanSwordThrust as HumanSwordThrustSource } from "../lexicon/internal/HumanSwordThrust";
import { HumanSwordTiming as HumanSwordTimingSource } from "../lexicon/internal/HumanSwordTiming";
import { HumanWeaponMelee as HumanWeaponMeleeSource } from "../lexicon/internal/HumanWeaponMelee";
import { HUMAN_BLADE_ADVANCE } from "./presets/HUMAN_BLADE_ADVANCE";
import { HUMAN_BLADE_BEAT } from "./presets/HUMAN_BLADE_BEAT";
import { HUMAN_BLADE_BIND } from "./presets/HUMAN_BLADE_BIND";
import { HUMAN_BLADE_CLUB_STRIKE } from "./presets/HUMAN_BLADE_CLUB_STRIKE";
import { HUMAN_BLADE_CLUB_SWING } from "./presets/HUMAN_BLADE_CLUB_SWING";
import { HUMAN_BLADE_FEINT } from "./presets/HUMAN_BLADE_FEINT";
import { HUMAN_BLADE_RELOAD } from "./presets/HUMAN_BLADE_RELOAD";
import { HUMAN_BLADE_RETREAT } from "./presets/HUMAN_BLADE_RETREAT";
import { HUMAN_BLADE_TRAVERSE } from "./presets/HUMAN_BLADE_TRAVERSE";
import { HUMAN_BLADE_VOID_STEP } from "./presets/HUMAN_BLADE_VOID_STEP";

/**
 * Fighting with a blade: the sword guard, the cut, thrust, parry and taken
 * laws, the sabre and the couched lance.
 *
 * Every attack keeps the blade timing of `IAutoMovieMotionHumanSword`: a thrust
 * reaches contact on a point speed of 2.6 m/s at novice to 3.2 m/s at elite and
 * a cut on an edge speed of 6 to 10 m/s, a path of 0.8 m taking 0.47 s at elite
 * for a thrust. A bind holds the parry for a second (provisional); a footwork
 * step takes one stance step, 0.35 s at the reference hip. The composition
 * gives the held blade (`blade`, a sword prop the hand picked up) and the
 * target; with neither, the law is a solo drill of the bare hand.
 *
 * The presets are the constants of `AutoMovieMotionHumanBlade` that the film
 * rows of `HumanBlade` and `HumanWeaponMelee` read: the footwork steps
 * (`ADVANCE`, `RETREAT`, `TRAVERSE`, `VOID_STEP`), the parry holds (`BEAT`,
 * `BIND`), the feint (`FEINT`), the club blows (`CLUB_SWING`, `CLUB_STRIKE`)
 * and the reload (`RELOAD`).
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `swordGuard`: The guards of blade work: the blade taken from where the hand
 *   holds it to a named guard and kept there.
 *
 * Presets, named parameter values spread into a law's parameters beside the
 * hold; a preset adds no method:
 *
 * - `ADVANCE`: The advance preset: one step forward with the stance kept, the
 *   footwork of an advance.
 * - `RETREAT`: The retreat preset: one step back with the stance kept, the
 *   footwork of a retreat.
 * - `TRAVERSE`: The traverse preset: one step to the left with the stance kept,
 *   the footwork of a traverse.
 * - `VOID_STEP`: The void step preset: one step back with the stance kept, the
 *   step that leaves the line of an attack.
 * - `BEAT`: The beat preset: a parry that is not held: the blade strikes the
 *   opponent's blade aside and does not stay on it.
 * - `BIND`: The bind preset: a parry held for one second (provisional): the blade
 *   stays on the opponent's blade.
 * - `FEINT`: The feint preset: a cut carried to half its delivery (provisional)
 *   and withdrawn.
 * - `CLUB_SWING`: The club swing preset: a club or a bat swung level from the
 *   blade hand's side, its striking contact the tip.
 * - `CLUB_STRIKE`: The club strike preset: a club or a baton brought down from
 *   above, its striking contact the tip.
 * - `RELOAD`: The reload preset: the support hand's palm pressed once at the
 *   place the composition names (the pistol's `magazine` contact).
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanSword`: Blade work with the blade as the effector: the cut on the eight
 *   lines, and what every blade action shares.
 * - `HumanSwordTiming`: The clock of a blade's attack, shared by the cut and the
 *   thrust: every movement of the hand is one minimum-jerk unit (Flash and
 *   Hogan 1985) at the attack's peak speed, whose duration is 1.875 times its
 *   path over that speed; the setting from the entry hold to the path's start
 *   and the return from the follow-through to the entry hold are slowed by the
 *   recovery skill's factor (`StrikingSkill.recovery`, Vagner et al.
 * - `HumanSwordParry`: The parry of blade work: the strong of the blade brought
 *   across an incoming blade where its attack is stopped.
 * - `HumanSwordThrust`: The thrust of blade work: the point driven straight onto
 *   the target, from where the fencer stands or carried by a step or a lunge,
 *   then recovered.
 * - `HumanSwordTaken`: A taken blade: the attacker's blade, stopped by a parry
 *   that takes it (`IAutoMovieMotionHumanSword.IAttack.taken`), kept on the
 *   parrying blade while that parry carries it aside, then held where it was
 *   left until a named action ends.
 * - `HumanSabre`: A sabre's slope and engage from the saddle
 *   (`IAutoMovieMotionHumanSabre`): carried on the seat contact, the right hand
 *   closes on the held sabre's grip and is placed by the sabre's own geometry
 *   (`StrikingHeld`) at stations laid from the right shoulder joint.
 * - `HumanLanceCouch`: A lance couched and lowered to a skill-at-arms target from
 *   the saddle (`IAutoMovieMotionHumanLanceCouch`): carried on the seat
 *   contact, the right hand holds the lance by its grip with the upper arm out
 *   and down from the shoulder, the shaft along the travel at the grasp's angle
 *   to the forearm, and the left holds both reins at their middle.
 * - `HumanBlade`: Blade work under film names, each a row of a law of
 *   `HumanSword`, `HumanSwordGuard`, `HumanSwordParry`, `HumanSwordTaken` or
 *   `HumanSwordThrust`.
 * - `HumanWeaponMelee`: One-handed melee weapons and the firearm's reload under
 *   film names, each a blade row with the blade timing of
 *   `IAutoMovieMotionHumanSword` (a cut's edge at 6 to 10 m/s, a thrust's point
 *   at 2.6 to 3.2 m/s, by skill), and each a row of a blade law or of the
 *   touch.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanBlade} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanBlade {
  /**
   * The guards of blade work: the blade taken from where the hand holds it to a
   * named guard and kept there.
   *
   * A guard is named by where the hilt is held, the tradition-neutral names of
   * the swordplay campaign (decision 8). Its pose is a row of `GUARDS`: the
   * hilt's place from the blade hand's shoulder in arm lengths, the way the
   * blade points and the way its true edge faces, so one row fits every body
   * and every blade. The guard takes at least 0.5 s to set (provisional) and is
   * held `seconds`, 1 s by default
   * (`IAutoMovieMotionHumanSwordGuard.IParams.seconds`). The action ends in the
   * guard: what follows is entered from it.
   */
  export import swordGuard = HumanSwordGuardLaw;

  /**
   * Blade work with the blade as the effector: the cut on the eight lines, and
   * what every blade action shares. `HumanSwordThrust` holds the thrust,
   * `HumanSwordGuard` the guards and `HumanSwordParry` the parry.
   *
   * The blade is a prop the hand already holds (`AutoMovieMotionHumanObject.prop` of a sword,
   * then `pickUp` by its grip); the law reads its point and edge from the
   * prop's `point` and `edge` affordances as the hand holds them and aims
   * those. With no blade named the hand itself is aimed, and with no target a
   * place at the blade's reach ahead stands in, so every action also plays as a
   * solo drill.
   *
   * Cuts are named by the side they come from (Meyer's cutting diagram, 1570:
   * descending, rising, horizontal and vertical lines; decision 8).
   * `HumanBlade` names rows of these in a tradition's words.
   *
   * A cut or a thrust that a parry is to meet is declared `parried`: it stops
   * short of its target at its decisive instant, where the parry's blade meets
   * it. The outcome is the author's, never the geometry's.
   *
   * First pass: the target is read once, at the start; a body does not stop the
   * blade; binds, winds and redirection are not planned; the chambers and the
   * stand-in target are the body's own measures, and `SWING`, `CONE`, `REACH`
   * and the cut's speed are provisional.
   */
  export import HumanSword = HumanSwordSource;

  /**
   * The clock of a blade's attack, shared by the cut and the thrust: every
   * movement of the hand is one minimum-jerk unit (Flash and Hogan 1985) at the
   * attack's peak speed, whose duration is 1.875 times its path over that
   * speed; the setting from the entry hold to the path's start and the return
   * from the follow-through to the entry hold are slowed by the recovery
   * skill's factor (`StrikingSkill.recovery`, Vagner et al. 2023: the chamber
   * and the recovery absorb a novice's longer strike), and the clock is
   * stretched by the manner's tempo, the law's own at the neutral manner. The
   * blade turns back at once; a held pose is a guard's or the author's.
   */
  export import HumanSwordTiming = HumanSwordTimingSource;

  /**
   * The parry of blade work: the strong of the blade brought across an incoming
   * blade where its attack is stopped.
   *
   * A parry answers an attack the author declared `parried` (`HumanSword`),
   * named by its anchor. It reads the attacker's blade at the attack's decisive
   * instant, where that blade stands stopped, and puts its own blade across it
   * there: point up for a high line and down for a low one, on the defender's
   * side, the two centre lines `HumanSword.GAP` apart. The parry waits in the
   * hold it was entered in for as long as puts its meeting (`stroke`) on the
   * attack's decisive instant, so a parry that starts in time meets its attack;
   * `sync` with `align: "stroke"` starts it in time. With no attack named it
   * closes a line as a drill.
   *
   * It meets the attacking blade on its weak and, while the arm cannot hold its
   * own blade across it there, slides the meeting back along that blade
   * (`SLIDE`), where the stopped blade stands farther from the defender. A
   * blade to meet that lies beyond the arm is refused. The meeting is where the
   * stopped attack stands. An attack declared `taken` ends where it was
   * stopped, and the parry carries its blade aside while the blades stay
   * together (`aside`): level and square to the defender's front, until the
   * whole attacking blade lies outside the defender's broadest half breadth, so
   * a riposte's lunge passes beside it; the attacker's blade follows
   * (`HumanSwordTaken`). First pass: a blade not taken is not beaten aside.
   *
   * What the row fixes: the parry meets the attacking blade at the middle of
   * its foible, 1/6 of its length back from the point (`WEAK`), slides to the
   * middle of the blade, 1/2, when the arm cannot hold it there (`SLIDE`), the
   * two centre lines 5 mm apart (`HumanSword.GAP`), and the blade may lean
   * about 30 degrees (29.7) from the square to the attacker's (`LEAN`, the
   * friction angle of steel). The attack is stopped where this parry's guard
   * meets it, a forearm short of its target (`HumanSword.stopped`). The parry's
   * own travel is timed as the thrust's, at 2.6 to 3.2 m/s by skill, and it
   * never arrives faster than its skill: a parry that starts late meets late.
   * It waits in its hold until its meeting falls on the attack's decisive
   * instant, so a parry synced to the attack's `stroke` is in time; the hold
   * afterwards is the stopped attack's own stay. A taken blade is carried aside
   * by one minimum-jerk unit from the end of the attack's follow-through to the
   * parry's relax, and the parry keeps it there until it turns back.
   */
  export import HumanSwordParry = HumanSwordParrySource;

  /**
   * The thrust of blade work: the point driven straight onto the target, from
   * where the fencer stands or carried by a step or a lunge, then recovered.
   *
   * A thrust states where the point goes and about which way the blade runs;
   * the blade's turn about its own line, and a lean of that line inside
   * `HumanSword.CONE`, are the ones the arm holds best with the blade as the
   * hand took it (`StrikingRoll.hand`). The attack lasts as a minimum-jerk unit
   * arrested at its peak, at the sword's cited peak speed in a lunge
   * (`HumanSword.SPEED`). Parameters, the advance and the parried outcome are
   * `HumanSword`'s.
   *
   * What the row fixes: the point lands at the decisive instant (`stroke`) on a
   * line that may leave the shoulder-to-target line by at most 40 degrees
   * (`HumanSword.CONE`); the chamber holds the upper arm 25 degrees out from
   * the trunk (`CHAMBER`); a target nearer than 0.3 of the arm from the
   * shoulder in a pose the arm cannot hold is refused (`NEAR`); a target beyond
   * 0.9 of the arm less the blade takes an advance (`HumanSword.REACH`). The
   * duration is the sword timing model's (`IAutoMovieMotionHumanSword`): 1.875
   * times the path over a point speed of 2.6 m/s at novice to 3.2 m/s at elite,
   * so a 0.8 m thrust takes 0.47 s at elite. The row fixes no duration of its
   * own; all its values are provisional but the speeds.
   */
  export import HumanSwordThrust = HumanSwordThrustSource;

  /**
   * A taken blade: the attacker's blade, stopped by a parry that takes it
   * (`IAutoMovieMotionHumanSword.IAttack.taken`), kept on the parrying blade
   * while that parry carries it aside, then held where it was left until a
   * named action ends.
   *
   * The attack ended where it was stopped, so this starts on that pose. The
   * hand keeps its grip and its attitude, and is carried by the parrying
   * blade's own displayed translation since this action's start, the two blades
   * staying together as the parry carries them (`HumanSwordParry`), up to the
   * parry's relax, where the parry leaves the blade; it holds that place until
   * the action named by `until` ends, or the parry ends. The body keeps its
   * entry posture, an advance's stance included. The row fixes no number: its
   * duration is the named action's end.
   */
  export import HumanSwordTaken = HumanSwordTakenSource;

  /**
   * A sabre's slope and engage from the saddle (`IAutoMovieMotionHumanSabre`):
   * carried on the seat contact, the right hand closes on the held sabre's grip
   * and is placed by the sabre's own geometry (`StrikingHeld`) at stations laid
   * from the right shoulder joint. At the slope the upper arm hangs and the
   * forearm lies level forward, the hand in front of the elbow holding the
   * blade upright with the edge forward, and the grip is loosened: the blade
   * turns in the hand about the grip (the grip window's in-hand motion) until
   * its back rests on the front of the right shoulder, point up and a little
   * back, edge forward, as the historical slope carries it with the hilt
   * pivoting between the thumb and the fingers; at the charge the fingers close
   * back to the full grip and the hand comes to the engage, the ox's raised
   * hilt about the shoulder turned toward the line with the point leading along
   * it. The left hand holds both reins at their middle. A charge cue brings the
   * slope to the engage after the rider's warned reaction over `transition`
   * seconds by a minimum-jerk path in the seat frame; the grip stays closed
   * throughout. Register `HumanSabre` to use it.
   */
  export const HumanSabre: typeof HumanSabreSource = HumanSabreSource;

  /**
   * A lance couched and lowered to a skill-at-arms target from the saddle
   * (`IAutoMovieMotionHumanLanceCouch`): carried on the seat contact, the right
   * hand holds the lance by its grip with the upper arm out and down from the
   * shoulder, the shaft along the travel at the grasp's angle to the forearm,
   * and the left holds both reins at their middle. The strike is the first
   * frame at which a carriage lays the lance's point on the target's own point,
   * read in the moving seat frame: the grip one lance length from the target
   * within the arm's reach, the forearm at the grasp's angle to the shaft; over
   * `lower` seconds before it the hand comes down to that carriage and the
   * shaft onto the line to the target by a minimum-jerk path between two
   * carriages laid from the arm's own line (the hand continuing the forearm,
   * the shaft at the grasp's angle to it, the elbow one upper arm from the
   * shoulder), the point meets the target at the strike, the target is set on
   * the lance's point from then, and over `lower` seconds after it the lance
   * comes back to the couch. Register `HumanLanceCouch` to use it.
   */
  export const HumanLanceCouch: typeof HumanLanceCouchSource =
    HumanLanceCouchSource;

  /**
   * Blade work under film names, each a row of a law of `HumanSword`,
   * `HumanSwordGuard`, `HumanSwordParry`, `HumanSwordTaken` or
   * `HumanSwordThrust`. The composition gives the held blade (`blade`, a sword
   * prop the hand picked up) and the target; with neither, the row is a solo
   * drill of the bare hand. Register the ones a film uses.
   *
   * The guard names are Liechtenauer's four, as Ringeck's gloss describes them:
   * `vomTag` (from the roof, the hilt at the shoulder), `ochs` (the ox, the
   * hilt beside the head and the point at the face), `pflug` (the plough, the
   * hilt at the hip and the point at the face) and `alber` (the fool, the point
   * at the ground).
   *
   * An exchange is three rows on two people: the attacker's `cut` or `thrust`
   * with `outcome: "parried"` and an anchor, the defender's `parry` with
   * `against` that anchor, and the defender's `riposte` after it. A parried
   * attack declared `taken` ends where it was stopped; the attacker's `taken`
   * row then keeps the blade on the defender's `bind` while it carries the
   * blade aside, and holds it there until the riposte ends.
   *
   * Every attack row keeps the blade timing of `IAutoMovieMotionHumanSword`: a
   * thrust, lunge, stab, wind and disengage reach contact on a point speed of
   * 2.6 m/s at novice to 3.2 m/s at elite, a cut, slash, draw and backslash on
   * an edge speed of 6 to 10 m/s (`HumanSword.SPEED`), a path of 0.8 m taking
   * 0.47 s at elite for a thrust. A bind holds the parry for a second
   * (provisional); the footwork rows (`advance`, `retreat`, `traverse`) take
   * one stance step, 0.35 s at the reference hip (`step.PERIOD`).
   */
  export import HumanBlade = HumanBladeSource;

  /**
   * One-handed melee weapons and the firearm's reload under film names, each a
   * blade row with the blade timing of `IAutoMovieMotionHumanSword` (a cut's
   * edge at 6 to 10 m/s, a thrust's point at 2.6 to 3.2 m/s, by skill), and
   * each a row of a blade law or of the touch. The composition gives the weapon
   * the hand holds (`blade`; a club's striking contact is `tip: "strike"`,
   * fixed here) and the target; with neither, the row is a shadow stroke of the
   * empty hand. The receiver's part is its own row (`HumanStageFight`).
   *
   * First pass: a blow is the arm's stroke with the advance the cut offers; a
   * body does not stop it. The reload brings the support hand's palm to the
   * place the composition names (the pistol's `magazine` contact); no magazine
   * is exchanged.
   */
  export import HumanWeaponMelee = HumanWeaponMeleeSource;

  /**
   * The advance preset: one step forward with the stance kept, the footwork of
   * an advance. The `advance` row of `HumanBlade` reads it, so the row and the
   * preset share one value.
   */
  export const ADVANCE: typeof HUMAN_BLADE_ADVANCE = HUMAN_BLADE_ADVANCE;

  /**
   * The retreat preset: one step back with the stance kept, the footwork of a
   * retreat. The `retreat` row of `HumanBlade` reads it, so the row and the
   * preset share one value.
   */
  export const RETREAT: typeof HUMAN_BLADE_RETREAT = HUMAN_BLADE_RETREAT;

  /**
   * The traverse preset: one step to the left with the stance kept, the
   * footwork of a traverse. The `traverse` row of `HumanBlade` reads it, so the
   * row and the preset share one value.
   */
  export const TRAVERSE: typeof HUMAN_BLADE_TRAVERSE = HUMAN_BLADE_TRAVERSE;

  /**
   * The void step preset: one step back with the stance kept, the step that
   * leaves the line of an attack. The `voidStep` row of `HumanBlade` reads it,
   * so the row and the preset share one value.
   */
  export const VOID_STEP: typeof HUMAN_BLADE_VOID_STEP = HUMAN_BLADE_VOID_STEP;

  /**
   * The beat preset: a parry that is not held: the blade strikes the opponent's
   * blade aside and does not stay on it. The `beat` row of `HumanBlade` reads
   * it, so the row and the preset share one value.
   */
  export const BEAT: typeof HUMAN_BLADE_BEAT = HUMAN_BLADE_BEAT;

  /**
   * The bind preset: a parry held for one second (provisional): the blade stays
   * on the opponent's blade. The `bind` row of `HumanBlade` reads it, so the
   * row and the preset share one value.
   */
  export const BIND: typeof HUMAN_BLADE_BIND = HUMAN_BLADE_BIND;

  /**
   * The feint preset: a cut carried to half its delivery (provisional) and
   * withdrawn. The `feint` row of `HumanBlade` reads it, so the row and the
   * preset share one value.
   */
  export const FEINT: typeof HUMAN_BLADE_FEINT = HUMAN_BLADE_FEINT;

  /**
   * The club swing preset: a club or a bat swung level from the blade hand's
   * side, its striking contact the tip. The `clubSwing` row of
   * `HumanWeaponMelee` reads it, so the row and the preset share one value.
   */
  export const CLUB_SWING: typeof HUMAN_BLADE_CLUB_SWING =
    HUMAN_BLADE_CLUB_SWING;

  /**
   * The club strike preset: a club or a baton brought down from above, its
   * striking contact the tip. The `clubStrike` row of `HumanWeaponMelee` reads
   * it, so the row and the preset share one value.
   */
  export const CLUB_STRIKE: typeof HUMAN_BLADE_CLUB_STRIKE =
    HUMAN_BLADE_CLUB_STRIKE;

  /**
   * The reload preset: the support hand's palm pressed once at the place the
   * composition names (the pistol's `magazine` contact). The `reload` row of
   * `HumanWeaponMelee` reads it, so the row and the preset share one value.
   */
  export const RELOAD: typeof HUMAN_BLADE_RELOAD = HUMAN_BLADE_RELOAD;
}
