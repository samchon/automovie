import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieDrawingView } from "./IAutoMovieDrawingView";

/** Data and callback contracts shared by the DeriveDrawing operations. */
export namespace IAutoMovieDeriveDrawing {
  /**
   * Derive one drawing from one design and one view.
   *
   * Throws an `Error` when the design fails `validateBuiltEnvironment`, naming
   * the first violation, because a drawing of a graph that does not resolve
   * would be a picture of nothing handed on as evidence. Throws when the view
   * is degenerate, as `autoMovieDrawingFrame` describes, and when it declares
   * two dimensions or two annotations with one id, since a consumer addresses
   * them by id.
   *
   * Everything is computed from the design: lines from element and face-only
   * boundary geometry in each element's current operating state, regions from
   * the cells a cutting view passes through, opening marks from each opening's
   * void or fill, and dimensions and notes from the features their targets pin.
   * Nothing produced here may be read back into the design. What cannot be
   * computed is reported in {@link IAutoMovieDrawing.gaps} rather than omitted,
   * because a sheet that silently leaves something out reads as a building
   * without it. Openings are marked whatever the kind filter says, because the
   * schedule counts them all, and only the space filter selects them.
   *
   * The digest is SHA-256 over the canonical JSON of every other field.
   * Identical canonical payloads give identical digests; a shared digest does
   * not prove field equality because SHA-256 collisions are possible.
   */
  export type IProps = {
    /** Design the drawing is taken from. */
    environment: IAutoMovieBuiltEnvironment;

    /** View that decides the cut, the direction, the filters and the pen. */
    view: IAutoMovieDrawingView;
  };
}
