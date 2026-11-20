import type { Archetype } from "../core";
import { GoalBuild } from "./GoalBuild";
import { buildBasketballHoop } from "./buildBasketballHoop";
import type { createGoal } from "./createGoal";

/**
 * A basketball hoop with a rim bar and backboard surface.
 *
 * The backboard faces +Z at the goal plane and the rim projects toward the court. Mount the board on a wall or stand in the scene.
 * @param params The optional identifier and dimensions fixed within their recorded bands.
 * @param seed The seed for free dimensions. The band midpoints apply without a seed.
 * @returns The model with its named contacts in its local frame.
 * @throws {ArchetypeRefusal} When a supplied dimension or choice cannot be realized.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the local frame, input defaults and the contacts consumed by motion.
 * @evidence contracts/development/implementation.md#principled-implementation Place the bracket and sixteen rim tangents from the drawn rim diameter, board offset and height.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the profile and build its parts and contacts at the same dimensions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keep the rim and board contacts on the same geometry the hoop builds. The scene supplies its mount.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The profile has a fixed number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Saved recipes call this producer with the original seed namespace and geometry.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call returns an independent model and retains no inputs.
 */
export function createBasketballHoop(
  params: createBasketballHoop.IParams = {},
  seed?: number | string,
): Archetype<createBasketballHoop.Affordance, createGoal.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof GoalBuild.draw<createBasketballHoop.Affordance>> =
    GoalBuild.draw("basketballHoop", params, seed);
  buildBasketballHoop(builder, d);
  return builder.build(d.mass!);
}

/**
 * The authored parameters and contact names for {@link createBasketballHoop}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the profile's dimensions, authoring choices and contacts.
 * @evidence contracts/development/design.md#principled-representation Each affordance belongs to the constructed goal or net. Dimensions use metres and mass uses kilograms. The draw checks the retained bands and measured choices.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The inputs name only controls this producer accepts, and contacts are those built for motion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contact identifiers are tied to the geometry this producer constructs.
 */
export namespace createBasketballHoop {
  /** The contact identifiers for the apparatus. */
  export type Affordance = "rim" | "board";

  /** The identifier and overrides that apply to this profile. */
  export type IParams = Pick<
    createGoal.IParams,
    | "id"
    | "width"
    | "board"
    | "thickness"
    | "height"
    | "ring"
    | "bar"
    | "offset"
    | "mass"
  >;
}
