import type { IAutoMovieDrawSubject } from "@automovie/render";

/**
 * What a page gives `AutoMovieInspector`: subjects, the first request and optional address and capture command wiring.
 */
export interface IAutoMovieInspectorProps {
  /**
   * The subjects offered by name, the record a draw page's subject module gives; the request's `subject` key chooses one, and with one subject it may be left out.
   *
   * Each subject must keep its object identity across renders: the canvas mount is keyed on the chosen subject object, so a new object for the same name disposes the scene and builds it again. Create the record once, outside the component.
   */
  subjects: Readonly<Record<string, IAutoMovieDrawSubject>>;

  /** Address query text the inspector opens with, such as `location.search`; read once, at mount, by `AutoMovieViewerInspector.readAddress`. A text the grammar refuses, such as one with an unknown key, opens the request that asks for nothing, with the refusal shown. */
  initialText: string;

  /** Executable and fixed arguments for capture from this host's working directory. Omit when the host only offers an address. */
  captureCommand?: readonly [string, ...string[]];

  /**
   * Hear the address text of the request after every change, and once at mount, so the page keeps its address equal to the request. `AutoMovieViewerInspector.createAddressWriter` gives one that writes through an injected `history`; without a listener the inspector touches no address.
   */
  onRequestChange?: (text: string) => void;
}
