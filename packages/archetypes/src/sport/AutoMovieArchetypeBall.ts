import { ArchetypeDraw, type AutoMovieArchetype } from "../core/index";
import { BallBuild } from "./BallBuild";
import { AutoMovieArchetypeOvalBall } from "./AutoMovieArchetypeOvalBall";
import { AutoMovieArchetypePuck } from "./AutoMovieArchetypePuck";
import { AutoMovieArchetypeSphericalBall } from "./AutoMovieArchetypeSphericalBall";
import type { IArchetypeDispatch } from "../core/IArchetypeDispatch";

/** Constructs the ball archetype from its recipe. */
export namespace AutoMovieArchetypeBall {
/**
 * Reads a saved ball recipe using its canonical producer.
 *
 * @param params The saved kind, optional identifier and any dimensions or
 *   choices the author supplied.
 * @param seed The seed used by the selected producer.
 * @returns The original model and its contacts.
 * @throws {AutoMovieArchetypeRefusal} When the saved kind, choice or dimension
 *   cannot be realized.
 */
export function create(
  params: AutoMovieArchetypeBall.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeBall.Affordance, AutoMovieArchetypeBall.Dimension> {
  const kind: AutoMovieArchetypeBall.Kind = ArchetypeDraw.choice(
    "ball",
    "kind",
    params.kind,
    AutoMovieArchetypeBall.KINDS,
  );

  // The stored input can carry any former choice. The selected draw admits only its own profile.
  // Each variant admits the saved parameters with its own draw, so the table
  // holds its producers as dispatch methods.
  const variants: Readonly<
    Record<
      AutoMovieArchetypeBall.Kind,
      IArchetypeDispatch<
        Omit<AutoMovieArchetypeBall.IParams, "kind">,
        AutoMovieArchetype<AutoMovieArchetypeBall.Affordance, AutoMovieArchetypeBall.Dimension>
      >
    >
  > = {
    football: { build: AutoMovieArchetypeSphericalBall.create },
    futsal: { build: AutoMovieArchetypeSphericalBall.create },
    basketball: { build: AutoMovieArchetypeSphericalBall.create },
    volleyball: { build: AutoMovieArchetypeSphericalBall.create },
    handball: { build: AutoMovieArchetypeSphericalBall.create },
    tennis: { build: AutoMovieArchetypeSphericalBall.create },
    tableTennis: { build: AutoMovieArchetypeSphericalBall.create },
    padel: { build: AutoMovieArchetypeSphericalBall.create },
    squash: { build: AutoMovieArchetypeSphericalBall.create },
    baseball: { build: AutoMovieArchetypeSphericalBall.create },
    softball: { build: AutoMovieArchetypeSphericalBall.create },
    golf: { build: AutoMovieArchetypeSphericalBall.create },
    cricket: { build: AutoMovieArchetypeSphericalBall.create },
    bowling: { build: AutoMovieArchetypeSphericalBall.create },
    pool: { build: AutoMovieArchetypeSphericalBall.create },
    rugby: { build: AutoMovieArchetypeOvalBall.create },
    americanFootball: { build: AutoMovieArchetypeOvalBall.create },
    fieldHockey: { build: AutoMovieArchetypeSphericalBall.create },
    lacrosse: { build: AutoMovieArchetypeSphericalBall.create },
    puck: { build: AutoMovieArchetypePuck.create },
  };
  return variants[kind].build(params, seed);
}
}

/** Companion types, constants and bands of {@link createBall}. */
export namespace AutoMovieArchetypeBall {
  /** The kinds of ball. */
  export type Kind =
    | "football"
    | "futsal"
    | "basketball"
    | "volleyball"
    | "handball"
    | "tennis"
    | "tableTennis"
    | "padel"
    | "squash"
    | "baseball"
    | "softball"
    | "golf"
    | "cricket"
    | "bowling"
    | "pool"
    | "rugby"
    | "americanFootball"
    | "fieldHockey"
    | "lacrosse"
    | "puck";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: typeof BallBuild.KINDS = BallBuild.KINDS;

  /**
   * The diameter above which a ball is taken in two hands, metres: a handball's
   * 0.19 m is still palmed, a football's 0.22 m is not. An estimate, not read
   * at a source.
   */
  export const TWO_HANDS: typeof BallBuild.TWO_HANDS = BallBuild.TWO_HANDS;

  /** Each kind's flat colour, sRGB. */
  export const COLORS: typeof BallBuild.COLORS = BallBuild.COLORS;

  /**
   * The affordance ids:
   *
   * - `grip`: the ball as a hand or two take it, at its centre, its height off
   *   the floor the aperture: the diameter, a puck's thickness.
   * - `top`: its highest point, facing up.
   * - `rim`: a puck's radial side surface, with the disc diameter and thickness.
   */
  export type Affordance = "grip" | "top" | "rim";

  /**
   * The free dimensions:
   *
   * - `diameter`: metres; an oval ball's across its middle.
   * - `length`: an oval ball's along its long axis, a puck's thickness, metres.
   * - `mass`: kilograms.
   */
  export type Dimension = "diameter" | "length" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: typeof BallBuild.UNITS = BallBuild.UNITS;

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which ball. */
    kind: Kind;

    /** The model's id, unique in a scene; `ball` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: typeof BallBuild.BANDS = BallBuild.BANDS;

  /** Each saved selector's named producer. */
  export interface IProducers {
    /** The named producer for the saved `football` selector. */
    football: typeof AutoMovieArchetypeSphericalBall.create;

    /** The named producer for the saved `futsal` selector. */
    futsal: typeof AutoMovieArchetypeSphericalBall.create;

    /** The named producer for the saved `basketball` selector. */
    basketball: typeof AutoMovieArchetypeSphericalBall.create;

    /** The named producer for the saved `volleyball` selector. */
    volleyball: typeof AutoMovieArchetypeSphericalBall.create;

    /** The named producer for the saved `handball` selector. */
    handball: typeof AutoMovieArchetypeSphericalBall.create;

    /** The named producer for the saved `tennis` selector. */
    tennis: typeof AutoMovieArchetypeSphericalBall.create;

    /** The named producer for the saved `tableTennis` selector. */
    tableTennis: typeof AutoMovieArchetypeSphericalBall.create;

    /** The named producer for the saved `padel` selector. */
    padel: typeof AutoMovieArchetypeSphericalBall.create;

    /** The named producer for the saved `squash` selector. */
    squash: typeof AutoMovieArchetypeSphericalBall.create;

    /** The named producer for the saved `baseball` selector. */
    baseball: typeof AutoMovieArchetypeSphericalBall.create;

    /** The named producer for the saved `softball` selector. */
    softball: typeof AutoMovieArchetypeSphericalBall.create;

    /** The named producer for the saved `golf` selector. */
    golf: typeof AutoMovieArchetypeSphericalBall.create;

    /** The named producer for the saved `cricket` selector. */
    cricket: typeof AutoMovieArchetypeSphericalBall.create;

    /** The named producer for the saved `bowling` selector. */
    bowling: typeof AutoMovieArchetypeSphericalBall.create;

    /** The named producer for the saved `pool` selector. */
    pool: typeof AutoMovieArchetypeSphericalBall.create;

    /** The named producer for the saved `rugby` selector. */
    rugby: typeof AutoMovieArchetypeOvalBall.create;

    /** The named producer for the saved `americanFootball` selector. */
    americanFootball: typeof AutoMovieArchetypeOvalBall.create;

    /** The named producer for the saved `fieldHockey` selector. */
    fieldHockey: typeof AutoMovieArchetypeSphericalBall.create;

    /** The named producer for the saved `lacrosse` selector. */
    lacrosse: typeof AutoMovieArchetypeSphericalBall.create;

    /** The named producer for the saved `puck` selector. */
    puck: typeof AutoMovieArchetypePuck.create;
  }

  /** The canonical producer for each saved kind. */
  export const PRODUCERS: Readonly<IProducers> = {
    football: AutoMovieArchetypeSphericalBall.create,
    futsal: AutoMovieArchetypeSphericalBall.create,
    basketball: AutoMovieArchetypeSphericalBall.create,
    volleyball: AutoMovieArchetypeSphericalBall.create,
    handball: AutoMovieArchetypeSphericalBall.create,
    tennis: AutoMovieArchetypeSphericalBall.create,
    tableTennis: AutoMovieArchetypeSphericalBall.create,
    padel: AutoMovieArchetypeSphericalBall.create,
    squash: AutoMovieArchetypeSphericalBall.create,
    baseball: AutoMovieArchetypeSphericalBall.create,
    softball: AutoMovieArchetypeSphericalBall.create,
    golf: AutoMovieArchetypeSphericalBall.create,
    cricket: AutoMovieArchetypeSphericalBall.create,
    bowling: AutoMovieArchetypeSphericalBall.create,
    pool: AutoMovieArchetypeSphericalBall.create,
    rugby: AutoMovieArchetypeOvalBall.create,
    americanFootball: AutoMovieArchetypeOvalBall.create,
    fieldHockey: AutoMovieArchetypeSphericalBall.create,
    lacrosse: AutoMovieArchetypeSphericalBall.create,
    puck: AutoMovieArchetypePuck.create,
  };
}
