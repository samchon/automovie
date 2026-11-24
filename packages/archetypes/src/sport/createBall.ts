import { ArchetypeDraw, type AutoMovieArchetype } from "../core";
import { BallBuild } from "./BallBuild";
import { createOvalBall } from "./createOvalBall";
import { createPuck } from "./createPuck";
import { createSphericalBall } from "./createSphericalBall";

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
export function createBall(
  params: createBall.IParams,
  seed?: number,
): AutoMovieArchetype<createBall.Affordance, createBall.Dimension> {
  const kind: createBall.Kind = ArchetypeDraw.choice(
    "ball",
    "kind",
    params.kind,
    createBall.KINDS,
  );

  // The stored input can carry any former choice. The selected draw admits only its own profile.
  const produce: (
    params: createBall.IParams,
    seed?: number,
  ) => AutoMovieArchetype<createBall.Affordance, createBall.Dimension> =
    createBall.PRODUCERS[kind] as typeof produce;
  return produce(params, seed);
}

/** Companion types, constants and bands of {@link createBall}. */
export namespace createBall {
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
    football: typeof createSphericalBall;

    /** The named producer for the saved `futsal` selector. */
    futsal: typeof createSphericalBall;

    /** The named producer for the saved `basketball` selector. */
    basketball: typeof createSphericalBall;

    /** The named producer for the saved `volleyball` selector. */
    volleyball: typeof createSphericalBall;

    /** The named producer for the saved `handball` selector. */
    handball: typeof createSphericalBall;

    /** The named producer for the saved `tennis` selector. */
    tennis: typeof createSphericalBall;

    /** The named producer for the saved `tableTennis` selector. */
    tableTennis: typeof createSphericalBall;

    /** The named producer for the saved `padel` selector. */
    padel: typeof createSphericalBall;

    /** The named producer for the saved `squash` selector. */
    squash: typeof createSphericalBall;

    /** The named producer for the saved `baseball` selector. */
    baseball: typeof createSphericalBall;

    /** The named producer for the saved `softball` selector. */
    softball: typeof createSphericalBall;

    /** The named producer for the saved `golf` selector. */
    golf: typeof createSphericalBall;

    /** The named producer for the saved `cricket` selector. */
    cricket: typeof createSphericalBall;

    /** The named producer for the saved `bowling` selector. */
    bowling: typeof createSphericalBall;

    /** The named producer for the saved `pool` selector. */
    pool: typeof createSphericalBall;

    /** The named producer for the saved `rugby` selector. */
    rugby: typeof createOvalBall;

    /** The named producer for the saved `americanFootball` selector. */
    americanFootball: typeof createOvalBall;

    /** The named producer for the saved `fieldHockey` selector. */
    fieldHockey: typeof createSphericalBall;

    /** The named producer for the saved `lacrosse` selector. */
    lacrosse: typeof createSphericalBall;

    /** The named producer for the saved `puck` selector. */
    puck: typeof createPuck;
  }

  /** The canonical producer for each saved kind. */
  export const PRODUCERS: Readonly<IProducers> = {
    football: createSphericalBall,
    futsal: createSphericalBall,
    basketball: createSphericalBall,
    volleyball: createSphericalBall,
    handball: createSphericalBall,
    tennis: createSphericalBall,
    tableTennis: createSphericalBall,
    padel: createSphericalBall,
    squash: createSphericalBall,
    baseball: createSphericalBall,
    softball: createSphericalBall,
    golf: createSphericalBall,
    cricket: createSphericalBall,
    bowling: createSphericalBall,
    pool: createSphericalBall,
    rugby: createOvalBall,
    americanFootball: createOvalBall,
    fieldHockey: createSphericalBall,
    lacrosse: createSphericalBall,
    puck: createPuck,
  };
}
