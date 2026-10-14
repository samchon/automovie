import {
  IAutoMovieFormationDesign,
  IAutoMovieFormationSlot,
} from "@automovie/interface";

import { IAutoMovieFormationGrounding } from "./IAutoMovieFormationGrounding";
import { formationSlotPosition } from "./formationSlotPosition";
import { formationSlotRecord } from "./formationSlotRecord";

/**
 * Regenerate one exact formation slot from its design, in constant memory.
 *
 * Measurement scripts call this on loaded design records. The compiled path,
 * `compiledFormationSlot` behind the source oracle, hands the same
 * {@link formationSlotRecord} identity law and {@link formationSlotPosition}
 * placement a compiled formation, so a slot asked of a design grounded on the
 * compiled terrain snapshot equals the slot the viewer draws. Without
 * `ground`, the member stands at the anchor's height. No filesystem or project
 * state is consulted. Throws a `RangeError` for a slot outside `[0, count)`.
 *
 * @evidence contracts/common.md#principled-implementation A pure function of the design and slot index: the hero override is looked up by slot, the position comes from the one placement law, and the identity, recipe, heading and seeded motion phase come from the shared record law.
 * @evidence contracts/common.md#clear-and-simple-design Composes the two shared laws and owns only the design's spelling of a hero, an override list, which is the one thing the compiled record spells differently.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No slot, hero or layout is special-cased, and no compiled-record value is substituted for an ungrounded design; an absent terrain snapshot is an authored fact giving zero relief.
 * @evidence contracts/common.md#meaningful-documentation States who calls it, which laws it shares with the compiled path, what an absent `ground` means, that it reads no external state, and its range error.
 * @evidence contracts/performance.md#efficient-algorithms One scan of the hero overrides, bounded by the design's hero count, plus the constant-time placement and its terrain lookup; regenerating a member costs no storage, which is why a formation of up to 100,000 slots is never materialized for one query.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Answers one slot per call and shares nothing across calls beyond the anchor datum `formationGroundRelief` keeps per record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the returned record is fresh and caller-owned.
 */
export const formationSlot = (
  formation: IAutoMovieFormationDesign & IAutoMovieFormationGrounding,
  slot: number,
): IAutoMovieFormationSlot =>
  formationSlotRecord(formation, slot, {
    actor:
      formation.heroOverrides.find(
        (hero: IAutoMovieFormationDesign["heroOverrides"][number]): boolean =>
          hero.slot === slot,
      )?.actor ?? null,
    position: formationSlotPosition(formation, slot),
  });
