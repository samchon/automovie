import { type AutoMovieArchetype } from "../core/index";
import { createKerb as createKerbImplementation } from "./internal/createKerb";
import { AutoMovieArchetypeDrawSession, type IAutoMovieArchetypeBand, AutoMovieArchetypeBand } from "../core";
import { AutoMovieArchetypeKerbData } from "./internal/AutoMovieArchetypeKerbData";

/** Public operations for Auto Movie Archetype Kerb. */
export namespace AutoMovieArchetypeKerb {
  /** The kinds: a road kerb unit and a single free-standing step. */
  export type Kind = "kerb" | "step";

  /**
   * The affordance ids:
   *
   * - `top`: the top face, facing up.
   * - `edge`: the top's front edge along `+X`, `+Z` out of the face below.
   */
  export type Affordance = "top" | "edge";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the top above the ground, a kerb's upstand or a step's riser.
   * - `depth`: the top front to back, a kerb's width or a step's tread.
   * - `length`: along `X`.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "depth" | "length" | "mass";

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which one. */
    kind: Kind;

    /** The model's id, unique in a scene; `kerb` when absent. */
    id?: string;
  }

  /**
   * A single raised step a foot goes up or over: a road kerb or a free-standing
   * step.
   *
   * It stands on the ground centred on `X` with its back face at the origin's `Z`
   * and its front face toward `+Z`, the side it is approached from, its top at
   * the drawn height. `top` is the top face, facing up, where a foot lands;
   * `edge` the top's front edge, along `+X` with `+Y` up and `+Z` out of the face
   * below, which a foot clears going up or a stepping-over act clears going
   * across.
   *
   * @param params The kind and any dimension the author fixes.
   * @param seed The seed that draws every dimension left free inside its band;
   *   absent, each takes the middle of its band.
   * @returns The kerb or step.
   * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
   */
  export function create(params: AutoMovieArchetypeKerb.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeKerb.Affordance, AutoMovieArchetypeKerb.Dimension> {
    return createKerbImplementation(params, seed);
  }

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["kerb", "step"];

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    depth: "m",
    length: "m",
    mass: "kg",
  };

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = {
    kerb: {
      height: AutoMovieArchetypeBand.metres(0.1, 0.15, AutoMovieArchetypeKerbData.UPSTAND),
      depth: AutoMovieArchetypeBand.metres(0.125, 0.125, AutoMovieArchetypeKerbData.HB2),
      length: AutoMovieArchetypeBand.metres(0.915, 0.915, AutoMovieArchetypeKerbData.HB2),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        72,
        72,
        `${AutoMovieArchetypeKerbData.HB2}: the whole unit, its bedded part below the road not modelled`,
      ),
    },
    step: {
      height: AutoMovieArchetypeBand.metres(
        0.196,
        0.196,
        `${AutoMovieArchetypeKerbData.IRC}: the riser's limit, which the model takes`,
      ),
      depth: AutoMovieArchetypeBand.metres(
        0.254,
        0.254,
        `${AutoMovieArchetypeKerbData.IRC}: the tread's limit, which the model takes`,
      ),
      length: AutoMovieArchetypeBand.metres(
        0.9,
        1.2,
        "a step's width; the code read sets the riser and the tread only",
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        40,
        150,
        "a concrete or timber step; no source read gives a weight",
        true,
      ),
    },
  };}
