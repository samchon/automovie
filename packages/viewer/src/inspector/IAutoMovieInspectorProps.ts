import type { IAutoMovieDrawSubject } from "@automovie/render";

/**
 * What a page gives `AutoMovieInspector`: the subjects it offers, the request text it opens with, and where to hear about every change of the request.
 *
 * @evidence contracts/development/design.md#principled-representation The inspector's state is one request, so the page hands in its first text and listens for the text of each change; the subjects are the draw page's own subjects by name, so the page that draws and the page that inspects offer one record.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three members the scaffold page uses: the subject module's record as subjects, `location.search` as the first text and `createAutoMovieInspectorAddressWriter` as the listener. The subject type is render's `IAutoMovieDrawSubject`, not a parallel one.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The text is read once; the inspector owns the request afterwards, so a page cannot fight it by passing a new text each render.
 * @evidence contracts/development/common.md#meaningful-documentation States what each member is, the identity each subject must keep, when the text is read and what the listener receives.
 */
export interface IAutoMovieInspectorProps {
  /**
   * The subjects offered by name, the record a draw page's subject module gives; the request's `subject` key chooses one, and with one subject it may be left out.
   *
   * Each subject must keep its object identity across renders: the canvas mount is keyed on the chosen subject object, so a new object for the same name disposes the scene and builds it again. Create the record once, outside the component.
   */
  subjects: Readonly<Record<string, IAutoMovieDrawSubject>>;

  /** Address query text the inspector opens with, such as `location.search`; read once, at mount, by `readAutoMovieInspectorAddress`. A text the grammar refuses, such as one with an unknown key, opens the request that asks for nothing, with the refusal shown. */
  initialText: string;

  /**
   * Hear the address text of the request after every change, and once at mount, so the page keeps its address equal to the request. `createAutoMovieInspectorAddressWriter` gives one that writes through an injected `history`; without a listener the inspector touches no address.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is received, when, and the default helper.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback signature; the page implements it.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback signature; the page implements it.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback signature; the page implements it.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback signature; the page implements it.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback signature; the page implements it.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback signature; the page implements it.
   */
  onRequestChange?: (text: string) => void;
}
