import { HumanEdgeRescue as HumanEdgeRescueLaw } from "../lexicon/HumanEdgeRescue";

/**
 * A rescue from an edge. A rescuer and a faller each play a role, planned together on one ledge scene. The code defines no timing from a study; the scene is authored (provisional).
 *
 * Laws and helpers, each the shipped function under the family name:
 * - `edgeRescue`: The cliffhanger rescue at a ledge: the `edgeRescue` law each role performs (`planEdgeRescue`), and the mutual record that casts the rescuer and the faller with one scene.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by `typeof` and never wrapped, so its parameters, units, frames and refusals are those its own comment states. The family's shared model and each law's parameters are declared by {@link IAutoMovieMotionHumanRescue} in `@automovie/interface`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the family covers, how its members relate and where its model is declared.
 * @evidence contracts/development/design.md#principled-representation Each member is the shipped law, preset or row itself, so the units, frames and invariants are those its owner states.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the members the family groups; each stays owned by its module.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is wrapped, widened or redefined, so no behaviour is added here.
 */
export namespace AutoMovieMotionHumanRescue {
  /**
   * The cliffhanger rescue at a ledge: the `edgeRescue` law each role
   * performs (`planEdgeRescue`), and the mutual record that casts the rescuer
   * and the faller with one scene. Register `HumanEdgeRescue.edgeRescue` and
   * compose `HumanEdgeRescue.rescue` to use it.
   */
  export import edgeRescue = HumanEdgeRescueLaw;
}
