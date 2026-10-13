import {
  IAutoMovieFormationDesign,
  IAutoMovieFormationSlot,
} from "@automovie/interface";

import { IAutoMovieFormationGrounding } from "./IAutoMovieFormationGrounding";
import { formationSlotPosition } from "./formationSlotPosition";
import { formationSlotRecord } from "./formationSlotRecord";

/**
 * Regenerate one exact source-designed formation slot in constant memory.
 *
 * The builder and ordinary measurement scripts share this pure derivation so a
 * slot queried from loaded project state is exactly the slot materialized into
 * the compiled formation. No filesystem or project state is consulted.
 */
export const formationSlot = (
  formation: IAutoMovieFormationDesign & IAutoMovieFormationGrounding,
  slot: number,
): IAutoMovieFormationSlot =>
  formationSlotRecord(formation, slot, {
    actor:
      formation.heroOverrides.find((hero) => hero.slot === slot)?.actor ?? null,
    position: formationSlotPosition(formation, slot),
  });
