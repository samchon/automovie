import type { AutoMovieArchetype } from "../core";
import { InstrumentBuild } from "./InstrumentBuild";
import { MarchingConstruction } from "./MarchingConstruction";
import type { createInstrument } from "./createInstrument";

/**
 * A side drum with separate batter-head and carrier contacts.
 *
 * The drum stands on its bottom head. The head surface accepts a stick contact
 * and sling marks the carrier hook.
 *
 * @param params The optional identifier and dimensions fixed within their
 *   recorded bands.
 * @param seed The seed for free dimensions. The band midpoints apply without a
 *   seed.
 * @returns The model with its named contacts in its local frame.
 * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice
 *   cannot be realized.
 */
export function createSideDrum(
  params: createSideDrum.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createSideDrum.Affordance, createSideDrum.Dimension> {
  return InstrumentBuild.create<createSideDrum.Affordance>(
    "sideDrum",
    "side drum",
    params,
    seed,
    MarchingConstruction.sideDrum,
  );
}

/** The authored parameters and contact names for {@link createSideDrum}. */
export namespace createSideDrum {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "depth" | "diameter" | "mass";

  /** The named playing and carrying contacts. */
  export type Affordance = "head" | "sling";

  /** The identifier and dimension overrides for this instrument. */
  export type IParams = Pick<
    createInstrument.IParams,
    "id" | "diameter" | "depth" | "mass"
  >;
}
