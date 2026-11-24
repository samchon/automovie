import type { AutoMovieArchetype } from "../core";
import { InstrumentBuild } from "./InstrumentBuild";
import { StringedConstruction } from "./StringedConstruction";
import type { createInstrument } from "./createInstrument";

/**
 * A violin with four bowed-string contacts and a neck grasp.
 *
 * The violin lies on its back with the neck along +X and string1 on its -Z
 * edge. The bow is made separately with createViolinBow.
 *
 * @param params The optional identifier and dimensions fixed within their
 *   recorded bands.
 * @param seed The seed for free dimensions. The band midpoints apply without a
 *   seed.
 * @returns The model with its named contacts in its local frame.
 * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice
 *   cannot be realized.
 */
export function createViolin(
  params: createViolin.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createViolin.Affordance, createViolin.Dimension> {
  return InstrumentBuild.create<createViolin.Affordance>(
    "violin",
    "violin",
    params,
    seed,
    StringedConstruction.violin,
  );
}

/** The authored parameters and contact names for {@link createViolin}. */
export namespace createViolin {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "bodyLength"
    | "bridgeHeight"
    | "bridgeSpacing"
    | "fingerboard"
    | "lowerBout"
    | "mass"
    | "neck"
    | "neckThickness"
    | "nutSpacing"
    | "rib"
    | "scale"
    | "upperBout"
    | "waist";

  /** The named playing and carrying contacts. */
  export type Affordance = "neck" | `string${number}`;

  /** The identifier and dimension overrides for this instrument. */
  export type IParams = Pick<
    createInstrument.IParams,
    | "id"
    | "bodyLength"
    | "scale"
    | "neck"
    | "upperBout"
    | "waist"
    | "lowerBout"
    | "rib"
    | "neckThickness"
    | "fingerboard"
    | "nutSpacing"
    | "bridgeSpacing"
    | "bridgeHeight"
    | "mass"
  >;
}
