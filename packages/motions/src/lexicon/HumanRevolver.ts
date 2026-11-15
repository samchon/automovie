import { operate } from "../affordance/operate";
import { HumanActionRow } from "../law/HumanActionRow";

/**
 * A revolver's handling (#3488), each a row of `operate` on the revolver's
 * affordances: `cock` draws the `hammer` hinge back by the thumb, the
 * cylinder turning one chamber by `follows`; `fanHammer` is the other
 * palm's stroke on the hammer for each shot; `openGate` and `closeGate`
 * swing the loading `gate`; `loadChamber` inserts a cartridge into the
 * chamber the gate shows (`operate`'s `insert`). The composition gives the
 * revolver's contacts; the timings are `operate`'s paces, provisional.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row operates and what is provisional.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped law (`HumanActionRow`).
 * @evidence contracts/development/design.md#minimal-and-owned-surface #3488's revolver rows.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own.
 */
export namespace HumanRevolver {
  /** Cock the hammer with the thumb. */
  export const cock = HumanActionRow.of("cockRevolver", operate, {});

  /** Fan the hammer with the other palm. */
  export const fanHammer = HumanActionRow.of("fanHammer", operate, {});

  /** Open the loading gate. */
  export const openGate = HumanActionRow.of("openGate", operate, {});

  /** Load a cartridge into the chamber at the gate. */
  export const loadChamber = HumanActionRow.of("loadChamber", operate, {});

  /** Close the loading gate. */
  export const closeGate = HumanActionRow.of("closeGate", operate, {});
}
