import { type Archetype, ArchetypeDraw } from "../core";
import { BallBuild } from "./BallBuild";
import { createOvalBall } from "./createOvalBall";
import { createPuck } from "./createPuck";
import { createSphericalBall } from "./createSphericalBall";

/**
 * Reads a saved ball recipe using its canonical producer.
 *
 * @param params The saved kind, optional identifier and any dimensions or choices the author supplied.
 * @param seed The seed used by the selected producer.
 * @returns The original model and its contacts.
 * @throws {ArchetypeRefusal} When the saved kind, choice or dimension cannot be realized.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the saved input and selected model.
 * @evidence contracts/development/implementation.md#principled-implementation Admit the saved kind and use its producer's bands and original seed domain.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the kind and call the corresponding public producer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The selected producer still validates the original dimensions and choices.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A fixed kind table selects the producer.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The saved and named calls use the same construction.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createBall(
  params: createBall.IParams,
  seed?: number | string,
): Archetype<createBall.Affordance, createBall.Dimension> {
  const kind: createBall.Kind = ArchetypeDraw.choice(
    "ball",
    "kind",
    params.kind,
    createBall.KINDS,
  );

  // The stored input can carry any former choice. The selected draw admits only its own profile.
  const produce: (
    params: createBall.IParams,
    seed?: number | string,
  ) => Archetype<createBall.Affordance, createBall.Dimension> = createBall
    .PRODUCERS[kind] as typeof produce;
  return produce(params, seed);
}

/**
 * Companion types, constants and bands of {@link createBall}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of the games and one band per dimension per kind, each a rule's limits; a rule's circumference becomes a diameter by dividing by pi.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The size and mass a kick, a throw or a catch reads, and the two contacts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Only the oval balls and the puck have a length; each band uses its rule or identified estimate.
 */
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

  /** The diameter above which a ball is taken in two hands, metres: a handball's 0.19 m is still palmed, a football's 0.22 m is not. An estimate, not read at a source. */
  export const TWO_HANDS: typeof BallBuild.TWO_HANDS = BallBuild.TWO_HANDS;

  /** Each kind's flat colour, sRGB. */
  export const COLORS: typeof BallBuild.COLORS = BallBuild.COLORS;

  /**
   * The affordance ids:
   *
   * - `grip`: the ball as a hand or two take it, at its centre, its height off the floor the aperture: the diameter, a puck's thickness.
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

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which ball. */
    kind: Kind;

    /** The model's id, unique in a scene; `ball` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: typeof BallBuild.BANDS = BallBuild.BANDS;

  /** The canonical producer for each saved kind. */
  export const PRODUCERS: Readonly<{
    football: typeof createSphericalBall;
    futsal: typeof createSphericalBall;
    basketball: typeof createSphericalBall;
    volleyball: typeof createSphericalBall;
    handball: typeof createSphericalBall;
    tennis: typeof createSphericalBall;
    tableTennis: typeof createSphericalBall;
    padel: typeof createSphericalBall;
    squash: typeof createSphericalBall;
    baseball: typeof createSphericalBall;
    softball: typeof createSphericalBall;
    golf: typeof createSphericalBall;
    cricket: typeof createSphericalBall;
    bowling: typeof createSphericalBall;
    pool: typeof createSphericalBall;
    rugby: typeof createOvalBall;
    americanFootball: typeof createOvalBall;
    fieldHockey: typeof createSphericalBall;
    lacrosse: typeof createSphericalBall;
    puck: typeof createPuck;
  }> = {
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
