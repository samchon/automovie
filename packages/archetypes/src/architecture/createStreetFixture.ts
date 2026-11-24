import {
  ArchetypeDraw,
  type AutoMovieArchetype,
  type IAutoMovieArchetypeBand,
} from "../core";
import { FixtureDraw } from "./FixtureDraw";
import { STREET_FIXTURE_BANDS } from "./STREET_FIXTURE_BANDS";
import { STREET_FIXTURE_MODELS } from "./STREET_FIXTURE_MODELS";
import { createBollard } from "./createBollard";
import { createFireHydrant } from "./createFireHydrant";
import { createLampPost } from "./createLampPost";
import { createSignPost } from "./createSignPost";
import { createTrafficCone } from "./createTrafficCone";

/**
 * Read a saved streetFixture recipe and call the corresponding fixed producer.
 *
 * @param params The saved kind and its recorded model, dimensions or
 *   identifier.
 * @param seed The seed used by the selected producer under the original draw
 *   key.
 * @returns The selected fixture in its original frame.
 * @throws {AutoMovieArchetypeRefusal} For an unknown kind or a rejected model
 *   or dimension.
 * @evidence contracts/development/common.md#meaningful-documentation Describes the saved recipe and draw namespace.
 * @evidence contracts/development/implementation.md#principled-implementation Resolve the old kind, then let its canonical producer admit the original inputs.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One kind check and one dispatch.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Pass all arguments to the named producer so saved invalid inputs still raise their refusal.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The kind table is bounded.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both entry points run the exact same producer.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The dispatcher keeps no inputs or intermediate state.
 */
export function createStreetFixture(
  params: createStreetFixture.IParams,
  seed?: number | string,
): AutoMovieArchetype<
  createStreetFixture.Affordance,
  createStreetFixture.Dimension
> {
  const kind: createStreetFixture.Kind = ArchetypeDraw.choice(
    "streetFixture",
    "kind",
    params.kind,
    createStreetFixture.KINDS,
  );

  // Saved recipes may state any model. The canonical draw checks it against this kind's table.
  const produce: (
    params: createStreetFixture.IParams,
    seed?: number | string,
  ) => AutoMovieArchetype<
    createStreetFixture.Affordance,
    createStreetFixture.Dimension
  > = createStreetFixture.PRODUCERS[kind] as typeof produce;
  return produce(params, seed);
}

/** Companion types and bands of {@link createStreetFixture}. */
export namespace createStreetFixture {
  /** The kinds of fixture. */
  export type Kind =
    | "trafficCone"
    | "bollard"
    | "hydrant"
    | "lampPost"
    | "signPost";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "trafficCone",
    "bollard",
    "hydrant",
    "lampPost",
    "signPost",
  ];

  /**
   * The affordance ids:
   *
   * - `top`: a cone's top, a round handle it is lifted by; a bollard's top face.
   * - `post`: a bollard's or a lamp post's shaft, a sign post below its sign, an
   *   upright bar.
   * - `nut`: a hydrant's operating nut, a knob turned about `+Y`.
   * - `pumper`, `hoseLeft`, `hoseRight`: a hydrant's pumper nozzle face on `+Z`
   *   and hose nozzle faces on `+X` and `-X`, sockets a hose couples to.
   * - `face`: a sign's front, a surface a production letters.
   */
  export type Affordance =
    | "top"
    | "post"
    | "face"
    | "nut"
    | "pumper"
    | "hoseLeft"
    | "hoseRight";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the fixture above the ground; a lamp post's mounting height; a
   *   sign's bottom edge.
   * - `diameter`: a bollard's pipe, a hydrant's barrel, a lamp post's shaft, a
   *   sign post's side.
   * - `head`, `headHeight`: a lamp post's luminaire across and high; `head` also
   *   a sign's side.
   * - `nozzleHeight`: a hydrant's nozzles' centreline above the ground;
   *   `pumperReach`, `hoseReach`: its pumper's and hose nozzles' faces from its
   *   axis.
   * - `base`, `baseHeight`: a lamp post's base across and high.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "height"
    | "diameter"
    | "nozzleHeight"
    | "pumperReach"
    | "hoseReach"
    | "base"
    | "baseHeight"
    | "head"
    | "headHeight"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: typeof FixtureDraw.streetFixture =
    FixtureDraw.streetFixture;

  /**
   * The read models: the MUTCD's 18 and 28 in cones, Reliance's R-1007 bollards
   * and the MUTCD's 30 and 36 in STOP signs.
   */
  export type Model =
    | "cone 18 in"
    | "cone 28 in"
    | "R-1007-04"
    | "R-1007-06"
    | "R-1007-08"
    | "R-1007-10"
    | "STOP 30 in"
    | "STOP 36 in";

  /**
   * Each kind's models with the figures each fixes, its default first; none for
   * a kind with one read model.
   */
  export const MODELS: typeof STREET_FIXTURE_MODELS = STREET_FIXTURE_MODELS;

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which fixture. */
    kind: Kind;

    /**
     * A cone's, a bollard's or a sign's read model; drawn from the seed when
     * absent. A hydrant and a lamp post have one model.
     */
    model?: Model;

    /** The model's id, unique in a scene; `streetFixture` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = STREET_FIXTURE_BANDS;

  /** The fixed producer of each saved kind. */
  export const PRODUCERS = {
    trafficCone: createTrafficCone,
    bollard: createBollard,
    hydrant: createFireHydrant,
    lampPost: createLampPost,
    signPost: createSignPost,
  } as const satisfies Readonly<
    Record<Kind, (...args: never[]) => AutoMovieArchetype>
  >;
}
