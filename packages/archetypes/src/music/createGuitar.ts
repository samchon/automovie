import type { AutoMovieArchetype } from "../core";
import { InstrumentBuild } from "./InstrumentBuild";
import { StringedConstruction } from "./StringedConstruction";
import type { createInstrument } from "./createInstrument";

/**
 * A steel-string guitar with numbered fret and string contacts.
 *
 * The guitar lies on its back with the neck along +X, the body to -X and
 * string1 on its -Z edge. The neck and body contacts support fretting and
 * strumming.
 *
 * @param params The optional identifier and dimensions fixed within their
 *   recorded bands.
 * @param seed The seed for free dimensions. The band midpoints apply without a
 *   seed.
 * @returns The model with its named contacts in its local frame.
 * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice
 *   cannot be realized.
 */
export function createGuitar(
  params: createGuitar.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createGuitar.Affordance, createGuitar.Dimension> {
  return InstrumentBuild.create<createGuitar.Affordance>(
    "guitar",
    "guitar",
    params,
    seed,
    StringedConstruction.guitar,
  );
}

/** The authored parameters and contact names for {@link createGuitar}. */
export namespace createGuitar {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "bodyDepth"
    | "bodyLength"
    | "bodyWidth"
    | "mass"
    | "nut"
    | "saddle"
    | "scale";

  /** The named playing and carrying contacts. */
  export type Affordance =
    | "body"
    | "neck"
    | `fret${number}`
    | `string${number}`;

  /** The identifier and dimension overrides for this instrument. */
  export type IParams = Pick<
    createInstrument.IParams,
    | "id"
    | "scale"
    | "nut"
    | "saddle"
    | "bodyLength"
    | "bodyWidth"
    | "bodyDepth"
    | "mass"
  >;
}
