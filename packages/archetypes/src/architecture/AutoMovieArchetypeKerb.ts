import { type AutoMovieArchetype } from "../core/index";
import { createKerb as createKerbImplementation } from "./internal/createKerb";
import { AutoMovieArchetypeDrawSession, type IAutoMovieArchetypeBand, AutoMovieArchetypeBand } from "../core";

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

  /*
   * A kerb unit, read.
   */
  const HB2: string =
    "Marshalls half battered kerb HB2 to BS EN 1340, 125 x 255 x 915 mm work size (https://media.marshalls.co.uk/image/upload/v1523957771/125_x_255_Half_Battered_Kerb_Datasheet.pdf), 72 kg (https://the-landscape-centre.co.uk/125x255-915mm-hb-straight-kerb-g05080040)";

  /*
   * A kerb's upstand above the road, read.
   */
  const UPSTAND: string =
    "Wheels for Wellbeing, Common kerb profiles: kerbs of 100 to 150 mm, bus stop kerbs 125 to 140 mm (https://wheelsforwellbeing.org.uk/common-kerb-profiles/)";

  /*
   * The residential stair code, read.
   */
  const IRC: string =
    "2021 International Residential Code, R311.7.5.1 risers not more than 7 3/4 in (196 mm) and R311.7.5.2 treads not less than 10 in (254 mm) (https://codes.iccsafe.org/s/IRC2021P3/chapter-3-building-planning/IRC2021P3-Pt03-Ch03-SecR311.7.5.1)";

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = {
    kerb: {
      height: AutoMovieArchetypeBand.metres(0.1, 0.15, UPSTAND),
      depth: AutoMovieArchetypeBand.metres(0.125, 0.125, HB2),
      length: AutoMovieArchetypeBand.metres(0.915, 0.915, HB2),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        72,
        72,
        `${HB2}: the whole unit, its bedded part below the road not modelled`,
      ),
    },
    step: {
      height: AutoMovieArchetypeBand.metres(
        0.196,
        0.196,
        `${IRC}: the riser's limit, which the model takes`,
      ),
      depth: AutoMovieArchetypeBand.metres(
        0.254,
        0.254,
        `${IRC}: the tread's limit, which the model takes`,
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
