import { walk } from "../actions/walk";
import { operate } from "../affordance/operate";
import { handOver } from "../handling/handOver";
import { putDown } from "../handling/putDown";
import { HumanActionRow } from "../law/HumanActionRow";
import { touch } from "../touch/touch";

/**
 * A field gun's drill (#3489), the duties of the National Park Service's
 * drill for the 12-pounder Napoleon, each a row of a shipped law on the
 * gun's affordances (#3484):
 *
 * | Row | Law | Duty |
 * | --- | --- | --- |
 * | `coverVent` | `touch`, the fingertips held on `vent` (the thumb is no touch effector yet) | No. 3 covers the vent while the bore is sponged |
 * | `spongeBore` | `operate` inserting the sponge head into `muzzle`, withdrawn | No. 1 sponges |
 * | `passCharge` | `handOver` of the cartridge | No. 5 brings the charge to No. 2 |
 * | `loadCharge` | `putDown` into `muzzle` | No. 2 places the charge |
 * | `ramCharge` | `operate` inserting the rammer head to the breech | No. 1 rams |
 * | `prickVent` | `operate` inserting the priming wire into `vent` | No. 3 pierces the cartridge |
 * | `runUp` | `operate` of a wheel's `leftSpin` or `rightSpin`, until the haul rows of #3351 land | the crew runs the gun into battery |
 * | `layGun` | `operate` of the `elevatingScrew`, a knob | the gunner points |
 * | `hookPrimer` | `putDown` of the primer into `vent` | No. 4 hooks the lanyard |
 * | `standClear` | `walk` to a place outside the wheel's line | Nos. 1 to 3 step clear |
 * | `pullLanyard` | `operate` of the lanyard's handle, a slider | No. 4 fires on command |
 *
 * The crew is a composition of one chain per role (`gunner`, `n1` to
 * `n5`), each row synced to the cue of the row before it in the drill's
 * order (#3340), the gunner's command to fire being a cue, not a motion.
 * The sequence is the NPS page's, which says its drill was altered for the
 * crew's safety (the timing of the vent and the primer); the period manual
 * (the 1864 Instruction for Field Artillery) is located but not read. Each
 * row's duration is its law's, provisional, and the composed cycle is to fit
 * the rates read: 3 to 4 rounds a minute for a well-drilled crew (NPS), about
 * 2 round shot or 3 canister under battle (History of War).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each row's law and duty, how the crew is composed, the source's caveat and the rates the cycle is held to.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped law (`HumanActionRow`).
 * @evidence contracts/development/design.md#minimal-and-owned-surface #3489's rows; a battery is the crowds campaign's.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own, and no role's motion is written for a body.
 */
export namespace HumanGunDrill {
  /** Cover the vent with the fingertips. */
  export const coverVent = HumanActionRow.of("coverVent", touch, {
    with: "fingertips",
    kind: "hold",
  });

  /** Sponge the bore. */
  export const spongeBore = HumanActionRow.of("spongeBore", operate, {});

  /** Pass the charge to the loader. */
  export const passCharge = HumanActionRow.of("passCharge", handOver, {});

  /** Place the charge in the muzzle. */
  export const loadCharge = HumanActionRow.of("loadCharge", putDown, {});

  /** Ram the charge home. */
  export const ramCharge = HumanActionRow.of("ramCharge", operate, {});

  /** Prick the cartridge through the vent. */
  export const prickVent = HumanActionRow.of("prickVent", operate, {});

  /** Run the gun up into battery. */
  export const runUp = HumanActionRow.of("runUp", operate, {});

  /** Lay the gun by its elevating screw. */
  export const layGun = HumanActionRow.of("layGun", operate, {});

  /** Hook the primer into the vent. */
  export const hookPrimer = HumanActionRow.of("hookPrimer", putDown, {});

  /** Step clear of the wheels and the muzzle. */
  export const standClear = HumanActionRow.of("standClear", walk, {});

  /** Pull the lanyard. */
  export const pullLanyard = HumanActionRow.of("pullLanyard", operate, {});
}
