import { IAutoMovieChannel } from "./IAutoMovieChannel";

/**
 * One named control a profile exposes: the abstract handle an LLM or an editor
 * UI drives, mapped onto a concrete channel.
 *
 * No engine, production or viewer code reads controls today. `bindProfile`
 * binds only a profile's limits and drivers, so `default` is never written and
 * a node channel here is not mapped through the binding's `boneMap`; legacy
 * prop conversion (`toEnginePropSpec`) copies the list through unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Pairs a semantic name with an existing `IAutoMovieChannel` and a per-component default; nothing checks that the default's length equals the channel width, because no consumer reads the default.
 * @evidence contracts/common.md#clear-and-simple-design Name, channel, default and group are what an editor needs to render a slider, but no code reads any of them yet, so the type is a presumed-need record this chapter flags.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing applies `default` or remaps the channel by profile or control name; the missing consumer is stated here instead of being hidden behind a pass that ignores the field.
 * @evidence contracts/common.md#meaningful-documentation States the semantic naming convention, the per-component default, what `group` is for, and that no pass binds or applies controls yet.
 * @author Samchon
 */
export interface IAutoMovieProfileControl {
  /**
   * Semantic control name, e.g. `"leftElbow.flexion"` or `"body.waistWidth"`.
   */
  name: string;

  /** The channel this control writes. */
  channel: IAutoMovieChannel;

  /**
   * Default value, one element per channel component; neither checked against
   * the channel width nor applied by any pass.
   */
  default: number[];

  /**
   * Category this control belongs to (e.g. `"face"`, `"legs"`), or `null`. Lets
   * an editor group controls and reveal detail progressively (beginner mode vs
   * per-part panels) rather than showing hundreds of sliders at once.
   */
  group: string | null;
}
