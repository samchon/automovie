import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { walk } from "../actions/walk";
import { operate } from "../affordance/operate";
import { handOver } from "../handling/handOver";
import { putDown } from "../handling/putDown";
import { AutoMovieMotionHumanActionRow } from "../law/AutoMovieMotionHumanActionRow";
import { HUMAN_MILITARY_DRILL_COVER_VENT } from "../next/presets/HUMAN_MILITARY_DRILL_COVER_VENT";
import { touch } from "../touch/touch";

/**
 * A field gun's drill, the duties of the National Park Service's drill for the
 * 12-pounder Napoleon, each a row of a shipped law on the gun's affordances:
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
 * page's, which says its drill was altered for the crew's safety (the timing of
 * the vent and the primer); the period manual (the 1864 Instruction for Field
 * Artillery) is located but not read. Each row's duration is its law's,
 * provisional, and the composed cycle is to fit the rates read: 3 to 4 rounds a
 * minute for a well-drilled crew (NPS), about 2 round shot or 3 canister under
 * battle (History of War).
 */
export namespace HumanGunDrill {
  /** Cover the vent with the fingertips. */
  export const coverVent: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gunDrill"]["coverVent"]
  > = AutoMovieMotionHumanActionRow.of(
    "coverVent",
    touch,
    HUMAN_MILITARY_DRILL_COVER_VENT,
  );

  /** Sponge the bore. */
  export const spongeBore: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gunDrill"]["spongeBore"]
  > = AutoMovieMotionHumanActionRow.of("spongeBore", operate, {});

  /** Pass the charge to the loader. */
  export const passCharge: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gunDrill"]["passCharge"]
  > = AutoMovieMotionHumanActionRow.of("passCharge", handOver, {});

  /** Place the charge in the muzzle. */
  export const loadCharge: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gunDrill"]["loadCharge"]
  > = AutoMovieMotionHumanActionRow.of("loadCharge", putDown, {});

  /** Ram the charge home. */
  export const ramCharge: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gunDrill"]["ramCharge"]
  > = AutoMovieMotionHumanActionRow.of("ramCharge", operate, {});

  /** Prick the cartridge through the vent. */
  export const prickVent: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gunDrill"]["prickVent"]
  > = AutoMovieMotionHumanActionRow.of("prickVent", operate, {});

  /** Run the gun up into battery. */
  export const runUp: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gunDrill"]["runUp"]
  > = AutoMovieMotionHumanActionRow.of("runUp", operate, {});

  /** Lay the gun by its elevating screw. */
  export const layGun: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gunDrill"]["layGun"]
  > = AutoMovieMotionHumanActionRow.of("layGun", operate, {});

  /** Hook the primer into the vent. */
  export const hookPrimer: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gunDrill"]["hookPrimer"]
  > = AutoMovieMotionHumanActionRow.of("hookPrimer", putDown, {});

  /** Step clear of the wheels and the muzzle. */
  export const standClear: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gunDrill"]["standClear"]
  > = AutoMovieMotionHumanActionRow.of("standClear", walk, {});

  /** Pull the lanyard. */
  export const pullLanyard: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["gunDrill"]["pullLanyard"]
  > = AutoMovieMotionHumanActionRow.of("pullLanyard", operate, {});
}
