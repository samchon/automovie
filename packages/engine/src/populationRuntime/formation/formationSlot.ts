import {
  IAutoMovieFormationDesign,
  type IAutoMovieFormationGrounding,
  IAutoMovieFormationSlot,
} from "@automovie/interface";

import { formationSlotPosition } from "./formationSlotPosition";
import { formationSlotRecord } from "./formationSlotRecord";

/**
 * Regenerate one exact formation slot from its design, in constant memory.
 *
 * Measurement scripts call this on loaded design records. The compiled path,
 * `compiledFormationSlot` behind the source oracle, hands the same
 * {@link formationSlotRecord} identity law and {@link formationSlotPosition}
 * placement a compiled formation, so a slot asked of a design grounded on the
 * compiled terrain snapshot equals the slot the viewer draws. Without `ground`,
 * the member stands at the anchor's height. No filesystem or project state is
 * consulted. Throws a `RangeError` for a slot outside `[0, count)`.
 */
export function formationSlot(
  formation: IAutoMovieFormationDesign & IAutoMovieFormationGrounding,
  slot: number,
): IAutoMovieFormationSlot {
  return formationSlotRecord(formation, slot, {
    actor:
      formation.heroOverrides.find(
        (hero: IAutoMovieFormationDesign["heroOverrides"][number]): boolean =>
          hero.slot === slot,
      )?.actor ?? null,
    position: formationSlotPosition(formation, slot),
  });
}
