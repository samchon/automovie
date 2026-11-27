import type { AutoMovieArchetypeBuilder } from "../../core";
import { type AutoMovieArchetypeEquine } from "../AutoMovieArchetypeEquine";
import { EquineHarness } from "./EquineHarness";
import { EquineMane } from "./EquineMane";
import { EquinePack } from "./EquinePack";
import { EquineSaddle } from "./EquineSaddle";
import { EquineSideSaddle } from "./EquineSideSaddle";
import { EquineSurcingle } from "./EquineSurcingle";

/**
 * Lay an equid's tack on its laid body and give the tack's own read mass, which
 * the equid producer adds on top of the equid's drawn mass.
 *
 * `saddle` lays the riding saddle and the lead (`EquineSaddle`), `both` adds
 * the harness under it, `harness` the driving harness alone (`EquineHarness`),
 * `pack` the pack saddle and the lead (`EquinePack`), `bareback` the bridle's
 * reins and the back seat with the lead, `sidesaddle` the side saddle
 * (`EquineSideSaddle`) with the lead, `surcingle` the vaulting surcingle and
 * pad (`EquineSurcingle`), `double` the riding saddle with a pillion pad behind
 * it (`EquineSaddle.pillion`), `trick` the riding saddle with a trick rider's
 * horn, handholds and straps (`EquineSaddle.trick`), and `bare` nothing.
 *
 * @param selection The selected tack, with clearance when it needs a croup
 *   piece.
 * @param builder The equid under construction, its body laid.
 * @param d The equid's dimensions.
 * @param rig The equid's rest rig.
 * @returns The tack's mass, kilograms: a saddle's read weight, the rigged pack
 *   saddle's, or 0 for tack whose weight no maker states.
 */
export function EquineTack(
  selection: EquineTack.Selection,
  builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  >,
  d: EquineTack.Dimensions,
  rig: AutoMovieArchetypeEquine.IRig,
): number {
  if (selection.kind === "pack") {
    EquinePack.lay(
      builder,
      { ...d, croupClearance: selection.croupClearance },
      rig,
    );
    EquineSaddle.lead(builder, rig.nose, d.withersHeight);
    return EquinePack.saddle(d.withersHeight).rigged;
  }

  const tack: Exclude<AutoMovieArchetypeEquine.Tack, "pack"> = selection.kind;
  const h: number = d.withersHeight;
  if (
    tack === "saddle" ||
    tack === "both" ||
    tack === "double" ||
    tack === "trick"
  ) {
    EquineSaddle.lay(builder, d, rig, tack === "trick");
    if (tack === "double") EquineSaddle.pillion(builder, d, rig);
    if (tack === "trick") EquineSaddle.trick(builder, d, rig);
    EquineSaddle.lead(builder, rig.nose, h);
    EquineMane(builder, rig);

    // A postilion's horse wears its harness under the riding saddle; the saddle's read weight is its own, the rest of its tack massless, unread.
    if (tack === "both") EquineHarness.lay(builder, d, rig);
    return EquineSaddle.WEIGHT;
  }
  if (tack === "harness") {
    EquineHarness.lay(builder, d, rig);
    return 0;
  }
  if (tack === "bareback") {
    EquineSaddle.bareback(builder, d, rig);
    EquineSaddle.lead(builder, rig.nose, h);
    return 0;
  }
  if (tack === "sidesaddle") {
    EquineSideSaddle.lay(builder, d, rig);
    EquineSaddle.lead(builder, rig.nose, h);
    return EquineSideSaddle.WEIGHT;
  }
  if (tack === "surcingle") EquineSurcingle.lay(builder, rig);
  return 0;
}

/** Dimensions consumed when assembling tack on the common equid body. */
export namespace EquineTack {
  /**
   * Common body and tack dimensions provided before the particular tack is
   * assembled.
   */
  export type Dimensions = Readonly<
    Record<
      Exclude<AutoMovieArchetypeEquine.Dimension, "croupClearance">,
      number
    >
  >;

  /** The pack variant owns the croup piece clearance above the tail root. */
  export type Selection =
    | { kind: "pack"; croupClearance: number }
    | { kind: Exclude<AutoMovieArchetypeEquine.Tack, "pack"> };
}
