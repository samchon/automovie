import type { ArchetypeBuilder } from "../core";
import { HorseHarness } from "./HorseHarness";
import { HorsePack } from "./HorsePack";
import { HorseSaddle } from "./HorseSaddle";
import { HorseSideSaddle } from "./HorseSideSaddle";
import { HorseSurcingle } from "./HorseSurcingle";
import type { createHorse } from "./createHorse";

/**
 * Lay an equid's tack on its laid body and give the tack's own read mass, which the equid producer adds on top of the equid's drawn mass.
 *
 * `saddle` lays the riding saddle and the lead (`HorseSaddle`), `both` adds the harness under it, `harness` the driving harness alone (`HorseHarness`), `pack` the pack saddle and the lead (`HorsePack`), `bareback` the bridle's reins and the back seat with the lead, `sidesaddle` the side saddle (`HorseSideSaddle`) with the lead, `surcingle` the vaulting surcingle and pad (`HorseSurcingle`), and `bare` nothing.
 *
 * @param tack The admitted tack.
 * @param builder The equid under construction, its body laid.
 * @param d The equid's dimensions.
 * @param rig The equid's rest rig.
 * @returns The tack's mass, kilograms: a saddle's read weight, the rigged pack saddle's, or 0 for tack whose weight no maker states.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each tack lays, in which order, and what mass it returns.
 * @evidence contracts/development/implementation.md#principled-implementation Each tack's owner lays its parts; the mass is that owner's read weight, every unread part being massless.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per tack, kept apart from `createHorse` so the producer stays within its size; the existing tacks lay their parts in their original order.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tack lays another's parts except the postilion's harness under the saddle and the shared lead and reins.
 * @evidence contracts/development/implementation.md#efficient-algorithms One owner call or two per tack.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The lead and the reins are each laid by their one owner.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function HorseTack(
  tack: createHorse.Tack,
  builder: ArchetypeBuilder<createHorse.Affordance, createHorse.Dimension>,
  d: Readonly<Record<createHorse.Dimension, number>>,
  rig: createHorse.IRig,
): number {
  const h: number = d.withersHeight;
  if (tack === "saddle" || tack === "both") {
    HorseSaddle.lay(builder, d, rig);
    HorseSaddle.lead(builder, rig.nose, h);

    // A postilion's horse wears its harness under the riding saddle; the saddle's read weight is its own, the rest of its tack massless, unread.
    if (tack === "both") HorseHarness.lay(builder, d, rig);
    return HorseSaddle.WEIGHT;
  }
  if (tack === "harness") {
    HorseHarness.lay(builder, d, rig);
    return 0;
  }
  if (tack === "pack") {
    // The rigged pack saddle's mass is its own, its parts' shares percents of the equid's mass as the body's are.
    HorsePack.lay(builder, d, rig);
    HorseSaddle.lead(builder, rig.nose, h);
    return HorsePack.saddle(h).rigged;
  }
  if (tack === "bareback") {
    HorseSaddle.bareback(builder, d, rig);
    HorseSaddle.lead(builder, rig.nose, h);
    return 0;
  }
  if (tack === "sidesaddle") {
    HorseSideSaddle.lay(builder, d, rig);
    HorseSaddle.lead(builder, rig.nose, h);
    return HorseSideSaddle.WEIGHT;
  }
  if (tack === "surcingle") HorseSurcingle.lay(builder, rig);
  return 0;
}
