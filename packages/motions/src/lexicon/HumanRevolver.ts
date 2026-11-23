import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { operate } from "../affordance/operate";
import { HumanActionRow } from "../law/HumanActionRow";

/**
 * A revolver's handling, each a row of `operate` on the revolver's affordances:
 * `cock` draws the `hammer` hinge back by the thumb, the cylinder turning one
 * chamber by `follows`; `fanHammer` is the other palm's stroke on the hammer
 * for each shot; `openGate` and `closeGate` swing the loading `gate`;
 * `loadChamber` inserts a cartridge into the chamber the gate shows
 * (`operate`'s `insert`). The composition gives the revolver's contacts; the
 * timings are `operate`'s paces, provisional: a press takes 0.25 s, a hinge
 * (the hammer, the gate) moves at 0.6 m/s along its arc and a slider or an
 * inserted cartridge at 0.4 m/s (`operate.PACE`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row operates and what is provisional.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped law (`HumanActionRow`).
 * @evidence contracts/development/design.md#minimal-and-owned-surface #3488's revolver rows.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own.
 */
export namespace HumanRevolver {
  /** Cock the hammer with the thumb. */
  export const cock: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["revolver"]["cock"]
  > = HumanActionRow.of("cockRevolver", operate, {});

  /** Fan the hammer with the other palm. */
  export const fanHammer: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["revolver"]["fanHammer"]
  > = HumanActionRow.of("fanHammer", operate, {});

  /** Open the loading gate. */
  export const openGate: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["revolver"]["openGate"]
  > = HumanActionRow.of("openGate", operate, {});

  /** Load a cartridge into the chamber at the gate. */
  export const loadChamber: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["revolver"]["loadChamber"]
  > = HumanActionRow.of("loadChamber", operate, {});

  /** Close the loading gate. */
  export const closeGate: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["revolver"]["closeGate"]
  > = HumanActionRow.of("closeGate", operate, {});
}
