import { HUMAN_DRILL_CADENCES as HUMAN_DRILL_CADENCESSource } from "../lexicon/HUMAN_DRILL_CADENCES";
import { HumanDrill as HumanDrillSource } from "../lexicon/HumanDrill";
import { HumanGunCrew as HumanGunCrewSource } from "../lexicon/HumanGunCrew";
import { HumanGunDrill as HumanGunDrillSource } from "../lexicon/HumanGunDrill";
import { HumanMusketDrill as HumanMusketDrillSource } from "../lexicon/HumanMusketDrill";
import { HUMAN_MILITARY_DRILL_AIM } from "./presets/HUMAN_MILITARY_DRILL_AIM";
import { HUMAN_MILITARY_DRILL_BITE_CARTRIDGE } from "./presets/HUMAN_MILITARY_DRILL_BITE_CARTRIDGE";
import { HUMAN_MILITARY_DRILL_COVER_VENT } from "./presets/HUMAN_MILITARY_DRILL_COVER_VENT";
import { HUMAN_MILITARY_DRILL_FRONT_KICK } from "./presets/HUMAN_MILITARY_DRILL_FRONT_KICK";
import { HUMAN_MILITARY_DRILL_HOOK } from "./presets/HUMAN_MILITARY_DRILL_HOOK";
import { HUMAN_MILITARY_DRILL_SEIZE } from "./presets/HUMAN_MILITARY_DRILL_SEIZE";
import { HUMAN_MILITARY_DRILL_SHOULDER_ARMS } from "./presets/HUMAN_MILITARY_DRILL_SHOULDER_ARMS";
import { HUMAN_MILITARY_DRILL_TAKE_FIRELOCK } from "./presets/HUMAN_MILITARY_DRILL_TAKE_FIRELOCK";
import { HUMAN_MILITARY_DRILL_UPPERCUT } from "./presets/HUMAN_MILITARY_DRILL_UPPERCUT";

/**
 * Military drill: the Gait family's `march` and `doubleTime` at the
 * regulation's cadence and step (`HUMAN_DRILL_CADENCES`; US Army TC 3-21.5:
 * quick time 120 steps a minute and double time 180, on a 0.762 m step), with
 * the drill, gun drill, musket drill and gun crew rows on
 * `AutoMovieMotionHumanMilitaryDrill` (`HumanDrill`, `HumanGunDrill`,
 * `HumanMusketDrill`, `HumanGunCrew`). The drill adds no method of its own.
 *
 * The presets are the constants of `AutoMovieMotionHumanMilitaryDrill` that the
 * rows of `HumanDrill`, `HumanGunDrill` and `HumanMusketDrill` read; each names
 * the members of its law that the row fixes, and `HUMAN_DRILL_CADENCES` stays
 * the one home of the cadences.
 *
 * Presets, named parameter values spread into a law's parameters beside the
 * hold; a preset adds no method:
 *
 * - `HOOK`: The hook preset: a hook thrown by the lead hand.
 * - `UPPERCUT`: The uppercut preset: an uppercut thrown by the rear hand.
 * - `FRONT_KICK`: The front kick preset: a push kick of the lead leg.
 * - `AIM`: The aim preset: a point held for 1.5 s.
 * - `TAKE_FIRELOCK`: The take firelock preset: the musket taken by its butt with
 *   the left hand.
 * - `SEIZE`: The seize preset: the musket taken by its grip with the right hand.
 * - `SHOULDER_ARMS`: The shoulder arms preset: the musket presented at the
 *   shoulder carriage in the left hand, one hand on it.
 * - `BITE_CARTRIDGE`: The bite cartridge preset: the end of the cartridge brought
 *   to the mouth.
 * - `COVER_VENT`: The cover vent preset: the fingertips held on the gun's vent.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HUMAN_DRILL_CADENCES`: The drill cadences and paces by regulation, steps a
 *   minute and metres.
 * - `HumanDrill`: Fighting and training rows, each a row of a shipped action; a
 *   strike's row leaves its target to the composition.
 * - `HumanGunDrill`: A field gun's drill, the duties of the National Park
 *   Service's drill for the 12-pounder Napoleon, each a row of a shipped law on
 *   the gun's affordances:
 * - `HumanMusketDrill`: The musket's drill, the one musket lexicon: the 1764
 *   Manual Exercise's carry positions, its Prime and Load in its own order, and
 *   its firings, each a row of a shipped law on the musket's, the cartridge's
 *   and the pouch's affordances.
 * - `HumanGunCrew`: One field gun's crew serving one load and fire: the duties of
 *   the National Park Service's drill for the 12-pounder Napoleon, each role's
 *   rows (`HumanGunDrill`) in its own chain, every duty synced to the end of
 *   the one before it in the drill's order, so the crew interlocks as the drill
 *   says: the vent covered before the sponge goes in, the charge passed (No.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanMilitaryDrill} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanMilitaryDrill {
  /**
   * The drill cadences and paces by regulation, steps a minute and metres.
   *
   * - `british1792`: ordinary time 75, quick time 108 and quickest (wheeling)
   *   time 120 on a 30-inch (0.762 m) pace: Dundas's Rules and Regulations
   *   (1792) as reproduced by the Hamilton Papers' annotations
   *   (founders.archives.gov, Hamilton 01-24-02-0270 and -0384) and the
   *   Napoleonic infantry march rates compiled by Rod's Wargaming; provisional
   *   until the regulation's text is read.
   * - `french1791`: ordinary 76 and accelerated 100 on two French feet (0.65 m):
   *   the Règlement of 1 August 1791 as reported in the Vicomte de Noailles's
   *   letter to Hamilton (1800); provisional until its text is read.
   * - `us2021`: quick time 120 and double time 180 on 30 inches: US Army TC
   *   3-21.5, Drill and Ceremonies, the march's own `HumanGait.MARCH` and
   *   `HumanGait.DOUBLE`.
   *
   * `HumanGait.march` reads a row by its `regulation` and its time by name; the
   * pace is every marcher's, as a regulation prescribes one step to all.
   */
  export const HUMAN_DRILL_CADENCES: typeof HUMAN_DRILL_CADENCESSource =
    HUMAN_DRILL_CADENCESSource;

  /**
   * Fighting and training rows, each a row of a shipped action; a strike's row
   * leaves its target to the composition. Register the ones a film uses. `hook`
   * and `uppercut` are punches (launch to contact 0.310 s for an elite cross,
   * other punches in proportion to their path, skill, 1.06 times at novice,
   * `IAutoMovieMotionHumanPunch`); `frontKick` is a push kick (0.33 s,
   * `IAutoMovieMotionHumanKick`); `aim` holds the pointing arm 1.5 s. The jab,
   * the cross and the rear round kick are the strike family's rows
   * (`HumanStrike`), each registered once.
   */
  export import HumanDrill = HumanDrillSource;

  /**
   * A field gun's drill, the duties of the National Park Service's drill for
   * the 12-pounder Napoleon, each a row of a shipped law on the gun's
   * affordances:
   *
   * | Row           | Law                                                                                              | Duty                                            |
   * | ------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
   * | `coverVent`   | `touch`, the fingertips held on `vent` (the thumb is no touch effector yet)                      | No. 3 covers the vent while the bore is sponged |
   * | `spongeBore`  | `operate` inserting the sponge head into `muzzle`, withdrawn                                     | No. 1 sponges                                   |
   * | `passCharge`  | `handOver` of the cartridge                                                                      | No. 5 brings the charge to No. 2                |
   * | `loadCharge`  | `putDown` into `muzzle`                                                                          | No. 2 places the charge                         |
   * | `ramCharge`   | `operate` inserting the rammer head to the breech                                                | No. 1 rams                                      |
   * | `prickVent`   | `operate` inserting the priming wire into `vent`                                                 | No. 3 pierces the cartridge                     |
   * | `runUp`       | `operate` of a wheel's `leftSpin` or `rightSpin`, until a haul row of `operate` exists (not yet) | the crew runs the gun into battery              |
   * | `layGun`      | `operate` of the independent `screw`, a knob                                                     | the gunner points                               |
   * | `hookPrimer`  | `putDown` of the primer into `vent`                                                              | No. 4 hooks the lanyard                         |
   * | `standClear`  | `walk` to a place outside the wheel's line                                                       | Nos. 1 to 3 step clear                          |
   * | `pullLanyard` | `operate` of the lanyard's handle, a slider                                                      | No. 4 fires on command                          |
   *
   * The crew is a composition of one chain per role (`gunner`, `n1` to `n5`),
   * each row synced to the cue of the row before it in the drill's order, the
   * gunner's command to fire being a cue, not a motion. The sequence is the NPS
   * page's, which says its drill was altered for the crew's safety (the timing
   * of the vent and the primer); the period manual (the 1864 Instruction for
   * Field Artillery) is located but not read. Each row's duration is its law's,
   * provisional, and the composed cycle is to fit the rates read: 3 to 4 rounds
   * a minute for a well-drilled crew (NPS), about 2 round shot or 3 canister
   * under battle (History of War).
   */
  export import HumanGunDrill = HumanGunDrillSource;

  /**
   * The musket's drill, the one musket lexicon: the 1764 Manual Exercise's
   * carry positions, its Prime and Load in its own order, and its firings, each
   * a row of a shipped law on the musket's, the cartridge's and the pouch's
   * affordances. One soldier's rows; the manual's three ranks are the crowds
   * campaign's to arrange.
   *
   * In the manual's order: `handleCartridge` (a pick up of a cartridge from the
   * pouch's slot), `biteCartridge` (a touch of the cartridge's `end` to the
   * mouth), `prime` (a touch of the cartridge to the `pan`), `shutPan` (an
   * operation of the `frizzen` hinge), `castAbout` (presenting at a high ready,
   * the muzzle up before the body), `charge` (a put down of the cartridge into
   * the `muzzle`), `drawRammer` (an operation of the `ramrod` slider, then a
   * pick up of the rod), `ramDown` (an operation inserting the rod into the
   * `muzzle`, withdrawn), `returnRammer` (a put down into the pipe), `seize`
   * (the right hand on the small of the stock, the left still under the butt),
   * `recover` (the left hand from the butt to above the lock, the firelock
   * upright before the body, its butt at the left breast, the manual's Make
   * Ready beginning "SPRING the firelock briskly to the recover"), `makeReady`
   * over it (an operation of the `cock` hinge to full cock), then
   * `presentMusket` and `fireMusket`. `takeFirelock` takes the musket by its
   * `butt` in the left hand, `shoulderArms` carries it shouldered against the
   * left shoulder, its butt on the hip, and `orderArms` sets its butt down by
   * the foot.
   *
   * The manual gives the order and the count of motions, not their durations:
   * each row's timing is its law's, provisional, and the composed Prime and
   * Load is to fall inside a trained soldier's rate, which a primary source is
   * still to give (secondary sources give about three rounds a minute). Biting
   * and pouring are the hand brought to the place; the fingers' fine work is
   * not yet planned.
   */
  export import HumanMusketDrill = HumanMusketDrillSource;

  /**
   * One field gun's crew serving one load and fire: the duties of the National
   * Park Service's drill for the 12-pounder Napoleon, each role's rows
   * (`HumanGunDrill`) in its own chain, every duty synced to the end of the one
   * before it in the drill's order, so the crew interlocks as the drill says:
   * the vent covered before the sponge goes in, the charge passed (No. 5
   * handing it over as No. 2 receives it), placed and rammed, the vent pricked,
   * the gun laid, the primer hooked, the crew clear of the wheels and the
   * muzzle, and the lanyard pulled on the gunner's command, a cue track instant
   * and no motion. The charge and the primer are set on the gun's own sockets
   * (`muzzle`, `vent`), so they ride the tube as the gun is laid.
   *
   * Roles are performers with their own bodies and seeds; nothing here is
   * written for a body. Each duty's duration is its law's, provisional, so the
   * cycle's rate (3 to 4 rounds a minute for a well-drilled crew, NPS) is a
   * measurement of the composed crew, not an input. The NPS page says its drill
   * was altered for the crew's safety; the 1864 Instruction for Field Artillery
   * is located but not read.
   *
   * The film blocking entry point composes crew arrival and gaze on an authored
   * cue. It uses the scene's marks and performers' ordinary walking and gaze.
   */
  export import HumanGunCrew = HumanGunCrewSource;

  /**
   * The hook preset: a hook thrown by the lead hand. The `hook` row of
   * `HumanDrill` reads it, so the row and the preset share one value.
   */
  export const HOOK: typeof HUMAN_MILITARY_DRILL_HOOK =
    HUMAN_MILITARY_DRILL_HOOK;

  /**
   * The uppercut preset: an uppercut thrown by the rear hand. The `uppercut`
   * row of `HumanDrill` reads it, so the row and the preset share one value.
   */
  export const UPPERCUT: typeof HUMAN_MILITARY_DRILL_UPPERCUT =
    HUMAN_MILITARY_DRILL_UPPERCUT;

  /**
   * The front kick preset: a push kick of the lead leg. The `frontKick` row of
   * `HumanDrill` reads it, so the row and the preset share one value.
   */
  export const FRONT_KICK: typeof HUMAN_MILITARY_DRILL_FRONT_KICK =
    HUMAN_MILITARY_DRILL_FRONT_KICK;

  /**
   * The aim preset: a point held for 1.5 s. The `aim` row of `HumanDrill` reads
   * it, so the row and the preset share one value.
   */
  export const AIM: typeof HUMAN_MILITARY_DRILL_AIM = HUMAN_MILITARY_DRILL_AIM;

  /**
   * The take firelock preset: the musket taken by its butt with the left hand.
   * The `takeFirelock` row of `HumanMusketDrill` reads it, so the row and the
   * preset share one value.
   */
  export const TAKE_FIRELOCK: typeof HUMAN_MILITARY_DRILL_TAKE_FIRELOCK =
    HUMAN_MILITARY_DRILL_TAKE_FIRELOCK;

  /**
   * The seize preset: the musket taken by its grip with the right hand. The
   * `seize` row of `HumanMusketDrill` reads it, so the row and the preset share
   * one value.
   */
  export const SEIZE: typeof HUMAN_MILITARY_DRILL_SEIZE =
    HUMAN_MILITARY_DRILL_SEIZE;

  /**
   * The shoulder arms preset: the musket presented at the shoulder carriage in
   * the left hand, one hand on it. The `shoulderArms` row of `HumanMusketDrill`
   * reads it, so the row and the preset share one value.
   */
  export const SHOULDER_ARMS: typeof HUMAN_MILITARY_DRILL_SHOULDER_ARMS =
    HUMAN_MILITARY_DRILL_SHOULDER_ARMS;

  /**
   * The bite cartridge preset: the end of the cartridge brought to the mouth.
   * The `biteCartridge` row of `HumanMusketDrill` reads it, so the row and the
   * preset share one value.
   */
  export const BITE_CARTRIDGE: typeof HUMAN_MILITARY_DRILL_BITE_CARTRIDGE =
    HUMAN_MILITARY_DRILL_BITE_CARTRIDGE;

  /**
   * The cover vent preset: the fingertips held on the gun's vent. The
   * `coverVent` row of `HumanGunDrill` reads it, so the row and the preset
   * share one value.
   */
  export const COVER_VENT: typeof HUMAN_MILITARY_DRILL_COVER_VENT =
    HUMAN_MILITARY_DRILL_COVER_VENT;
}
