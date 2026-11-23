import type { IAutoMovieMotionHumanAffect } from "../everyday/IAutoMovieMotionHumanAffect";
import type { IAutoMovieMotionHumanBreath } from "../everyday/IAutoMovieMotionHumanBreath";
import type { IAutoMovieMotionHumanLayer } from "../law/IAutoMovieMotionHumanLayer";

/**
 * An overlay: what the body's own signals add to any whole-body action, as additive layers over the trunk, shoulders, head and face rather than goals of the hands or feet. Affect is a display on a clock (a laugh, a sigh, a yawn, a cough); breath is the continuous rhythm of the chest.
 *
 * Both methods are layer builders, not chain actions: each returns an `IAutoMovieMotionHumanLayer` that a performance lays over the actions it spans, so the family has no `Chain` parameter and the runtime namespace holds plain functions. The layer writes joint angles, so every planted or gripping limb goal stays where it is.
 *
 * @evidence contracts/development/design.md#principled-representation One method per layer builder of the Expression family, each taking the builder's own parameter type and returning the layer.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The affect and breath layers and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing display or option type of its builder; nothing is redefined.
 */
export interface IAutoMovieMotionHumanExpression {
  /**
   * The affect displays as one layer: each display (a laugh, a sigh, a yawn, a cough and the others of `IAutoMovieMotionHumanAffect.Kind`) added over the body at its film second for its length.
   *
   * @param params The `displays` of `IAutoMovieMotionHumanExpression.IAffect`.
   * @returns The layer that adds the displays.
   * @throws {HumanRefusal} For a display whose length is not above the display's floor (0 s, more for a sneeze or a gasp).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the layer adds, its parameters, its refusal and its return.
   */
  affect(
    params: IAutoMovieMotionHumanExpression.IAffect,
  ): IAutoMovieMotionHumanLayer;

  /**
   * The breathing layer: the chest, the upper chest and the lumbar spine extend and the shoulder girdles rise a little with each inhalation, at a seeded resting rate that exertion raises and that recovers afterwards, with an occasional seeded sigh.
   *
   * @param params The `rate` and `exertion` of `IAutoMovieMotionHumanBreath.IOptions`; the defaults when absent.
   * @returns The layer that breathes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the layer adds, its parameters and its return.
   */
  breath(
    params?: IAutoMovieMotionHumanBreath.IOptions,
  ): IAutoMovieMotionHumanLayer;
}

/**
 * The parameter types of the Expression methods.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names each method's parameters with their units.
 */
export namespace IAutoMovieMotionHumanExpression {
  /**
   * The parameters of `affect`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The member states its meaning.
   * @evidence contracts/development/design.md#principled-representation The one argument the builder takes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the argument of `affect`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the display type `IAutoMovieMotionHumanAffect` owns.
   */
  export interface IAffect {
    /** The displays, each at its film second for its length. */
    displays: readonly IAutoMovieMotionHumanAffect.IDisplay[];
  }
}
