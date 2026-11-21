import { type Archetype, ArchetypeDraw } from "../core";
import { GoalBuild } from "./GoalBuild";
import { createBasketballHoop } from "./createBasketballHoop";
import { createFieldGoal } from "./createFieldGoal";
import { createTennisNet } from "./createTennisNet";
import { createVolleyballNet } from "./createVolleyballNet";

/**
 * Reads a saved goal recipe using its canonical producer.
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
export function createGoal(
  params: createGoal.IParams,
  seed?: number | string,
): Archetype<createGoal.Affordance, createGoal.Dimension> {
  const kind: createGoal.Kind = ArchetypeDraw.choice(
    "goal",
    "kind",
    params.kind,
    createGoal.KINDS,
  );

  // The stored input can carry any former choice. The selected draw admits only its own profile.
  const produce: (
    params: createGoal.IParams,
    seed?: number | string,
  ) => Archetype<createGoal.Affordance, createGoal.Dimension> = createGoal
    .PRODUCERS[kind] as typeof produce;
  return produce(params, seed);
}

/**
 * Companion types, names and bands of {@link createGoal}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The bars a hand hangs from or grips, the opening a ball passes, the face it banks off and the net top a block reaches over (#3468 N11).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A rule's limit is drawn where it gives no other figure, and says so.
 */
export namespace createGoal {
  /** The kinds of goal. */
  export type Kind =
    | "footballGoal"
    | "fieldHockeyGoal"
    | "iceHockeyGoal"
    | "lacrosseGoal"
    | "handballGoal"
    | "basketballHoop"
    | "volleyballNet"
    | "tennisNet";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "footballGoal",
    "fieldHockeyGoal",
    "iceHockeyGoal",
    "lacrosseGoal",
    "handballGoal",
    "basketballHoop",
    "volleyballNet",
    "tennisNet",
  ];

  /** The readable name of each kind. */
  export const NAMES: typeof GoalBuild.NAMES = GoalBuild.NAMES;

  /**
   * The affordance ids:
   *
   * - `crossbar`, `mouth`: a football goal's crossbar, a bar, and its opening, an aperture.
   * - `leftPost`, `rightPost`: the upright posts on `+X` and `-X` of a football goal, a volleyball or a tennis net, bars.
   * - `rim`, `board`: a basketball ring's front, a bar, and the backboard's face.
   * - `top`: a net's top as a ledge along `X`: a volleyball net's whole top, a tennis net's lowest point at its centre strap.
   */
  export type Affordance =
    | "crossbar"
    | "mouth"
    | "leftPost"
    | "rightPost"
    | "rim"
    | "board"
    | "top";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`: a football goal's mouth, a backboard's width, a volleyball net's length, a tennis court's doubles width.
   * - `height`: a football crossbar's lower edge, a basketball ring's top, a net's top at its centre; a volleyball net's is its class's.
   * - `bar`: a football goal's post and crossbar section, a basketball ring's metal, a tennis post's side.
   * - `board`: a backboard's height or a volleyball net's width; `thickness`: a backboard's.
   * - `ring`: a basketball ring's inside diameter.
   * - `offset`: a basketball ring's nearest point from the backboard, or a net post's distance outside the court.
   * - `post`: a volleyball post's height, or a tennis net's height at its posts.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "width"
    | "height"
    | "bar"
    | "board"
    | "thickness"
    | "ring"
    | "offset"
    | "post"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: typeof GoalBuild.UNITS = GoalBuild.UNITS;

  /** A volleyball net's classes, FIVB 2.1.1's. */
  export type Net = "men" | "women";

  /** The figures each class fixes, by kind, the default first: a volleyball net's top, FIVB Official Volleyball Rules 2025-2028, 2.1.1, "2.43 m for men and 2.24 m for women" (https://www.fivb.com/wp-content/uploads/2025/01/FIVB-Volleyball_Rules2025_2028-EN-v05.pdf). */
  export const NETS: typeof GoalBuild.NETS = GoalBuild.NETS;

  /** The parameters: the kind, a volleyball net's class, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which goal. */
    kind: Kind;

    /** A volleyball net's class; drawn from the seed when absent. No other kind has one. */
    net?: Net;

    /** The model's id, unique in a scene; `goal` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: typeof GoalBuild.BANDS = GoalBuild.BANDS;

  /** Each saved selector's named producer. */
  export interface IProducers {
    /** The named producer for the saved `footballGoal` selector. */
    footballGoal: typeof createFieldGoal;

    /** The named producer for the saved `fieldHockeyGoal` selector. */
    fieldHockeyGoal: typeof createFieldGoal;

    /** The named producer for the saved `iceHockeyGoal` selector. */
    iceHockeyGoal: typeof createFieldGoal;

    /** The named producer for the saved `lacrosseGoal` selector. */
    lacrosseGoal: typeof createFieldGoal;

    /** The named producer for the saved `handballGoal` selector. */
    handballGoal: typeof createFieldGoal;

    /** The named producer for the saved `basketballHoop` selector. */
    basketballHoop: typeof createBasketballHoop;

    /** The named producer for the saved `volleyballNet` selector. */
    volleyballNet: typeof createVolleyballNet;

    /** The named producer for the saved `tennisNet` selector. */
    tennisNet: typeof createTennisNet;
  }

  /** The canonical producer for each saved kind. */
  export const PRODUCERS: Readonly<IProducers> = {
    footballGoal: createFieldGoal,
    fieldHockeyGoal: createFieldGoal,
    iceHockeyGoal: createFieldGoal,
    lacrosseGoal: createFieldGoal,
    handballGoal: createFieldGoal,
    basketballHoop: createBasketballHoop,
    volleyballNet: createVolleyballNet,
    tennisNet: createTennisNet,
  };
}
