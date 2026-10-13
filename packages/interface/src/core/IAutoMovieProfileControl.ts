import { IAutoMovieChannel } from "./IAutoMovieChannel";

/**
 * One named control a profile exposes: the abstract handle an LLM or an editor
 * drives, mapped onto a concrete channel.
 *
 * No engine, production or viewer code reads controls. `bindProfile` binds only
 * a profile's limits and drivers, so `default` is never written and a node
 * channel here is not mapped through the binding's `boneMap`; legacy prop
 * conversion (`toEnginePropSpec`) copies the list through unchanged.
 *
 * @evidence contracts/common.md#principled-implementation A control names one typed channel and a default vector whose length is meant to equal that channel's width; with no reader, nothing evaluates or validates that pairing, which is the unresolved limitation of this record.
 * @evidence contracts/common.md#clear-and-simple-design Four members, name, channel, default and group, describe a handle without a second address scheme, because the channel union already addresses both node and pointer targets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No consumer writes a default or binds a control by name; the record is carried unread, a gap in this core type documented here rather than hidden behind a placeholder pass.
 * @evidence contracts/common.md#meaningful-documentation States that nothing reads controls, that `default` is unchecked against the channel width and never applied, that node channels here are not bound, and what `group` is for.
 * @author Samchon
 */
export interface IAutoMovieProfileControl {
  /** Semantic control name, such as `"leftElbow.flexion"`. */
  name: string;

  /** The channel this control would write; not mapped by any binding. */
  channel: IAutoMovieChannel;

  /**
   * Default value, one element per channel component; neither checked against
   * the channel width nor applied by any pass.
   */
  default: number[];

  /**
   * Category for grouping controls in an editor, such as `"face"` or `"legs"`,
   * or `null` for none.
   */
  group: string | null;
}
