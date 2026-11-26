import type { AutoMovieArchetypeStagePouch } from "../AutoMovieArchetypeStagePouch";
import { type AutoMovieArchetype } from "../../core/index";
import { CartridgeBox } from "../CartridgeBox";
import { StageCarrierConstruction } from "../StageCarrierConstruction";


/**
 * Worn stage pouch.
 *
 * A costume box with a separately articulated lid, belt or strap hooks and
 * individually addressed display-token sites.
 *
 * @param params The scene id, optional display dimensions and this carrier's
 *   own fit options.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createStagePouch(
  params: AutoMovieArchetypeStagePouch.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeStagePouch.Affordance, AutoMovieArchetypeStagePouch.Dimension> {
  return StageCarrierConstruction(
    "pouch",
    params,
    seed,
    (builder, d, slots) => {
      CartridgeBox.lay(
        builder,
        d,
        slots,
        StageCarrierConstruction.facingWearer,
      );
    },
  );
}
