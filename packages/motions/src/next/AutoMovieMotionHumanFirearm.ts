import { HumanBoltAction as HumanBoltActionSource } from "../lexicon/internal/HumanBoltAction";
import { HumanFirearm as HumanFirearmSource } from "../lexicon/internal/HumanFirearm";
import { HumanRevolver as HumanRevolverSource } from "../lexicon/internal/HumanRevolver";
import { HumanWeaponFirearm as HumanWeaponFirearmSource } from "../lexicon/internal/HumanWeaponFirearm";
import { HumanWeaponHeld as HumanWeaponHeldLaw } from "../lexicon/internal/HumanWeaponHeld";
import { HumanWeaponPresent as HumanWeaponPresentSource } from "../lexicon/internal/HumanWeaponPresent";
import { HUMAN_FIREARM_DRAW } from "./presets/HUMAN_FIREARM_DRAW";
import { HUMAN_FIREARM_REACH_HOLSTER } from "./presets/HUMAN_FIREARM_REACH_HOLSTER";
import { HUMAN_FIREARM_SURRENDER } from "./presets/HUMAN_FIREARM_SURRENDER";

/**
 * Handling a firearm with the weapon as the effector: drawing it, presenting it
 * to an aim or a ready position, firing a shot, tracking a moving target and
 * holstering it.
 *
 * The firearm is a prop the hand holds (a handgun or a long gun, taken by its
 * `grip`); presenting and firing read the gun's `muzzle` and `sight` and aim
 * from the eye (a handgun) or the cheek (a long gun) unless the call names
 * another tip, edge or anchor. A shot is three actions in a chain:
 * `drawFirearm`, `presentFirearm` and `fireFirearm`. Presenting takes 0.9 s at
 * novice to 0.5 s at elite and a shot 0.42 s (press 0.1, rise 0.07, return
 * 0.25), all provisional.
 *
 * The presets are the constants of `AutoMovieMotionHumanFirearm` that the film
 * rows read: `REACH_HOLSTER` (the right palm held on the hip for 0.3 s),
 * `SURRENDER` (the hands raised for 2 s) and `DRAW` (the grip taken and the
 * weapon lifted 0.15 m clear with its bore continuing the forearm).
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `weaponTrack`: How a presented weapon is held, read once per plan: the weapon
 *   as the shooting hand holds it, whether it is a long gun (a prop with a
 *   `foreEnd`), and where the support hand takes it, beside the shooting hand
 *   on a handgun and on the fore-end of a long gun, nearer when the support arm
 *   cannot reach the fore-end's middle.
 *
 * Presets, named parameter values spread into a law's parameters beside the
 * hold; a preset adds no method:
 *
 * - `REACH_HOLSTER`: The reach holster preset: the right palm held on the right
 *   hip for 0.3 s, the reach for the holstered firearm.
 * - `SURRENDER`: The surrender preset: the hands raised and held for 2 s.
 * - `DRAW`: The draw preset: the holstered firearm taken by its grip and lifted
 *   0.15 m clear, its bore continuing the forearm.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanWeaponPresent`: Presenting any held launcher with the weapon as the
 *   effector, and the shot's press and recoil: a pistol, a long gun, a
 *   crossbow, a bow, a couched lance (generalised `present`).
 * - `HumanWeaponFirearm`: Handling a firearm with the weapon as the effector:
 *   presenting it to an aim or a ready position, the shot's recoil, and the
 *   draw and the return to a holster.
 * - `HumanFirearm`: Firearm handling under film names.
 * - `HumanBoltAction`: A bolt-action rifle's and a pistol's magazine handling,
 *   each a row of a shipped law: `liftBolt` and `lowerBolt` turn the `bolt`
 *   hinge, `drawBolt` and `closeBolt` run the `boltSlide` slider back and
 *   forward (the four motions of cycling the bolt, composed in that order);
 *   `seatMagazine` inserts a magazine into the gun's `magazine` socket
 *   (`operate`'s `insert`); `pressRelease` presses the magazine release button
 *   and `dropMagazine` lets the empty magazine fall (`release`).
 * - `HumanRevolver`: A revolver's handling, each a row of `operate` on the
 *   revolver's affordances: `cock` draws the `hammer` hinge back by the thumb,
 *   the cylinder turning one chamber by `follows`; `fanHammer` is the other
 *   palm's stroke on the hammer for each shot; `openGate` and `closeGate` swing
 *   the loading `gate`; `loadChamber` inserts a cartridge into the chamber the
 *   gate shows (`operate`'s `insert`).
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanFirearm} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanFirearm {
  /**
   * How a presented weapon is held, read once per plan: the weapon as the
   * shooting hand holds it, whether it is a long gun (a prop with a `foreEnd`),
   * and where the support hand takes it, beside the shooting hand on a handgun
   * and on the fore-end of a long gun, nearer when the support arm cannot reach
   * the fore-end's middle. The support arm reaches as far as it is long: the
   * upper arm and the forearm straight, and the grip's own distance from the
   * wrist, as the present of a long arm holds it with the left arm extended
   * under the piece ("the left hand at the swell", the 1764 Manual Exercise);
   * the arm's fit then holds it within its own range.
   */
  export import weaponTrack = HumanWeaponHeldLaw;

  /**
   * Presenting any held launcher with the weapon as the effector, and the
   * shot's press and recoil: a pistol, a long gun, a crossbow, a bow, a couched
   * lance (generalised `present`).
   *
   * The weapon is a prop the hand holds (`AutoMovieMotionHumanObject.prop`, taken by its
   * `grip`); the law reads its working point `tip` and its sighting `edge` (a
   * firearm's `muzzle` and `sight` when absent) as the hand holds them, so the
   * weapon's line is what is aimed. The line runs from the `anchor` to the
   * target: the eye (the head's joint, a handgun's), the cheek (`CHEEK` of the
   * way from the head's joint down to the firing shoulder, a long gun's or a
   * crossbow's), the face (the mouth's region, where a bow's drawing hand
   * anchors under the jaw or at the mouth's corner, provisional) or the arm
   * (the firing shoulder's joint, a lance couched under the armpit). Absent,
   * the anchor is the eye for a handgun and the cheek for a long gun, today's
   * rule. With no weapon named the hand itself points, and with no target a
   * place straight ahead at eye height stands in.
   *
   * `present` brings the tip onto the line and holds it, or lowers the weapon
   * to a ready position; `fire` presses the trigger (driving the weapon's
   * `trigger` articulation to its full travel by the break and back by the end,
   * `IHumanActionPlan.drives`), turns the muzzle up about the hand and returns
   * it onto the line. `HumanWeaponFirearm` keeps both under its firearm names.
   * Both may be performed over a carrier, a stand, a ride or a stance on a
   * moving floor: then they claim the trunk's turn and the holding arms and
   * hands, and their plan, made in the world at their start, is carried by the
   * support's motion (`HumanSupportCarry`).
   *
   * A handgun is held in both hands unless one is asked, the support hand
   * wrapped beside the shooting hand; a long gun (a prop that declares a
   * `foreEnd`) takes the support hand on its fore-end and is refused in one
   * hand. A target more than `TURN` degrees off the heading is refused: the
   * performer turns first.
   *
   * First pass: the target is read once at the action's start, the holster is a
   * prop where the scene stands it and does not ride the body, and no reload is
   * planned. The recoil's size and times are provisional: no recoil-recovery
   * study was read (listed as research to do).
   */
  export import HumanWeaponPresent = HumanWeaponPresentSource;

  /**
   * Handling a firearm with the weapon as the effector: presenting it to an aim
   * or a ready position, the shot's recoil, and the draw and the return to a
   * holster.
   *
   * The firearm is a prop the hand holds (`AutoMovieMotionHumanObject.prop` of a handgun or a
   * long gun, taken by its `grip`); presenting and firing are the generalised
   * launcher laws of `HumanWeaponPresent` under the firearm's names, reading
   * the gun's `muzzle` and `sight` and aiming from the eye (a handgun) or the
   * cheek (a long gun) unless a row names another tip, edge or anchor.
   *
   * A shot is three actions in a chain: `draw` (a pick up of the holstered
   * pistol by its grip), `present` (the muzzle brought onto the line from the
   * eye to the target and held) and `fire` (the trigger's press, the muzzle's
   * rise about the hand and its return onto the line). `present` with a ready
   * position lowers the weapon, and `holster` puts it back.
   *
   * Timing (`IAutoMovieMotionHumanWeaponPresent`): `present` takes 0.9 s at
   * novice to 0.5 s at elite, `fire` 0.42 s (press 0.1, rise 0.07, return
   * 0.25), all provisional. The two-hand rules, the refusal of a target past
   * `TURN` and what the first pass leaves out are `HumanWeaponPresent`'s, whose
   * laws these are.
   */
  export import HumanWeaponFirearm = HumanWeaponFirearmSource;

  /**
   * Firearm handling under film names. The rows of `HumanWeaponFirearm` take
   * the held firearm (`gun`, a handgun or long gun prop the hand picked up) and
   * aim its bore; with no gun named they are the same movements of the empty
   * hand. Register the ones a film uses.
   *
   * `takeAim` and the ready rows take 0.9 s at novice to 0.5 s at elite and
   * `recoil` 0.42 s, provisional (`IAutoMovieMotionHumanWeaponPresent`). A shot
   * from the holster is `HumanWeaponFirearm.draw`, then `takeAim`, then
   * `recoil`; `lowReady` lowers the weapon and `HumanWeaponFirearm.holster`
   * returns it.
   */
  export import HumanFirearm = HumanFirearmSource;

  /**
   * A bolt-action rifle's and a pistol's magazine handling, each a row of a
   * shipped law: `liftBolt` and `lowerBolt` turn the `bolt` hinge, `drawBolt`
   * and `closeBolt` run the `boltSlide` slider back and forward (the four
   * motions of cycling the bolt, composed in that order); `seatMagazine`
   * inserts a magazine into the gun's `magazine` socket (`operate`'s `insert`);
   * `pressRelease` presses the magazine release button and `dropMagazine` lets
   * the empty magazine fall (`release`). The composition gives the contacts;
   * the timings are `operate`'s paces, provisional: the bolt handle's hinge
   * moves at 0.6 m/s along its arc, the bolt slide and the inserted magazine at
   * 0.4 m/s and the release button press takes 0.25 s (`operate.PACE`).
   */
  export import HumanBoltAction = HumanBoltActionSource;

  /**
   * A revolver's handling, each a row of `operate` on the revolver's
   * affordances: `cock` draws the `hammer` hinge back by the thumb, the
   * cylinder turning one chamber by `follows`; `fanHammer` is the other palm's
   * stroke on the hammer for each shot; `openGate` and `closeGate` swing the
   * loading `gate`; `loadChamber` inserts a cartridge into the chamber the gate
   * shows (`operate`'s `insert`). The composition gives the revolver's
   * contacts; the timings are `operate`'s paces, provisional: a press takes
   * 0.25 s, a hinge (the hammer, the gate) moves at 0.6 m/s along its arc and a
   * slider or an inserted cartridge at 0.4 m/s (`operate.PACE`).
   */
  export import HumanRevolver = HumanRevolverSource;

  /**
   * The reach holster preset: the right palm held on the right hip for 0.3 s,
   * the reach for the holstered firearm. The `reachHolster` row of
   * `HumanFirearm` reads it, so the row and the preset share one value.
   */
  export const REACH_HOLSTER: typeof HUMAN_FIREARM_REACH_HOLSTER =
    HUMAN_FIREARM_REACH_HOLSTER;

  /**
   * The surrender preset: the hands raised and held for 2 s. The `surrender`
   * row of `HumanFirearm` reads it, so the row and the preset share one value.
   */
  export const SURRENDER: typeof HUMAN_FIREARM_SURRENDER =
    HUMAN_FIREARM_SURRENDER;

  /**
   * The draw preset: the holstered firearm taken by its grip and lifted 0.15 m
   * clear, its bore continuing the forearm. The `draw` row of
   * `HumanWeaponFirearm` reads it, so the row and the preset share one value.
   */
  export const DRAW: typeof HUMAN_FIREARM_DRAW = HUMAN_FIREARM_DRAW;
}
