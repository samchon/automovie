import type { IAutoMovieInspectorSubject } from "./IAutoMovieInspectorSubject.js";

/**
 * What a page gives `AutoMovieInspector`: the subjects it offers, the request text it opens with, and where to hear about every change of the request.
 *
 * @evidence contracts/development/design.md#principled-representation The inspector's state is one request, so the page hands in its first text and listens for the text of each change; the subjects are data the page owns.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three members the scaffold page uses: the film registry as subjects, `location.search` as the first text and `history.replaceState` as the listener.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The text is read once; the inspector owns the request afterwards, so a page cannot fight it by passing a new text each render.
 * @evidence contracts/development/common.md#meaningful-documentation States what each member is, when it is read and what the listener receives.
 */
export interface IAutoMovieInspectorProps {
  /** The subjects offered, each with a distinct name; the request's `subject` key chooses one, and with one subject it may be left out. */
  subjects: readonly IAutoMovieInspectorSubject[];

  /** Address query text the inspector opens with, such as `location.search`; read once, at mount. A text the grammar refuses opens the request that asks for nothing, with the refusal shown. */
  initialText: string;

  /**
   * Hear the address text of the request after every change, and once at mount, so the page keeps its address equal to the request.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is received and when.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback signature; the page implements it.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback signature; the page implements it.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback signature; the page implements it.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback signature; the page implements it.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback signature; the page implements it.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback signature; the page implements it.
   */
  onRequestChange?: (text: string) => void;
}
