import type { IAutoMovieDrawSubject } from "./IAutoMovieDrawSubject.js";

/**
 * What a subject module exports as `subjects`: given the props the host
 * injected before the page loaded, the subjects the page offers by name.
 *
 * A production maps its film registry and ignores the props; a subject whose
 * data the host computes, such as a motion case built and judged in Node, reads
 * it from the props. The names are what a capture request's `subject` key
 * chooses among.
 *
 * ```ts
 * export const subjects: AutoMovieDrawSubjects = (): Record<
 *   string,
 *   IAutoMovieDrawSubject
 * > => ({ starter: { create: () => starter.create() } });
 * ```
 */
export type AutoMovieDrawSubjects = (
  props: unknown,
) => Readonly<Record<string, IAutoMovieDrawSubject>>;
