import type { IAutoMovieRenderDrawSubject } from "./IAutoMovieRenderDrawSubject.js";

/**
 * What a subject module exports as `subjects`: given the props the host
 * injected before the page loaded, the subjects the page offers by name.
 *
 * A production maps its film registry and ignores the props; a subject whose
 * data the host computes, such as a motion case built and judged in Node, reads
 * it from the props. The names are what a capture request's `subject` key
 * chooses among. `Props` is the type of the data the module reads, which the
 * host injects as it declares it.
 *
 * ```ts
 * export const subjects: AutoMovieRenderDrawSubjects = (): Record<
 *   string,
 *   IAutoMovieRenderDrawSubject
 * > => ({ starter: { create: () => starter.create() } });
 * ```
 */
export type AutoMovieRenderDrawSubjects<Props = unknown> = (
  props: Props,
) => Readonly<Record<string, IAutoMovieRenderDrawSubject>>;
