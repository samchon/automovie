import type { IAutoMovieDrawSubject } from "./IAutoMovieDrawSubject.js";

/**
 * What a subject module exports as `subjects`: given the props the host injected before the page loaded, the subjects the page offers by name.
 *
 * A production maps its film registry and ignores the props; a subject whose data the host computes, such as a motion case built and judged in Node, reads it from the props. The names are what a capture request's `subject` key chooses among.
 *
 * ```ts
 * export const subjects: AutoMovieDrawSubjects = (): Record<string, IAutoMovieDrawSubject> => ({ starter: { create: () => starter.create() } });
 * ```
 *
 * @evidence contracts/development/design.md#principled-representation A function of the injected props, because some subjects exist only once the host hands over their data; the result is a plain record so the page can list every name it offers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `installAutoMovieDraw` once per page; the props stay `unknown` because only the module that reads them knows their shape.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No subject kind is named; a module validates its own props.
 * @evidence contracts/development/common.md#meaningful-documentation States what the props are, who reads them, what the names choose, and shows a production's form.
 */
export type AutoMovieDrawSubjects = (
  props: unknown,
) => Readonly<Record<string, IAutoMovieDrawSubject>>;
