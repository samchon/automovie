import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieInspectionFocus } from "./IAutoMovieInspectionFocus";

/**
 * A view of an inspection as its text says it, before anything is fitted: the
 * subject's own delivery camera, a fixed camera, or a name with the switches a
 * fitted view takes.
 *
 * `parseInspectionView` writes it and `AutoMovieRenderInspectionCamera.resolveView`
 * turns it into a camera. A name is resolved there, because whether it names
 * one of the subject's views or a named viewpoint depends on the subject.
 */
export type IAutoMovieInspectionView =
  | IAutoMovieInspectionView.IFilm
  | IAutoMovieInspectionView.IFixed
  | IAutoMovieInspectionView.INamed;

/**
 * Parsed film, fixed and named view alternatives, with optional named-view
 * focus selection.
 */
export namespace IAutoMovieInspectionView {
  /** The subject's own delivery camera, drawn unchanged; its text is `film`. */
  export interface IFilm {
    /** Discriminant. */
    type: "film";
  }

  /**
   * A camera at one point looking at another, in world metres; its text is
   * `x,y,z:tx,ty,tz`, optionally followed by `@ortho=<metres per pixel>` and
   * `@up=x,y,z`, so every camera a record keeps can be written as a fixed view
   * that draws it again.
   */
  export interface IFixed {
    /** Discriminant. */
    type: "fixed";

    /** Camera position, world metres. */
    position: IAutoMovieVector3;

    /** Point looked at, world metres, distinct from `position`. */
    target: IAutoMovieVector3;

    /**
     * Metres of world one picture pixel spans for an orthographic camera,
     * positive; null for the subject's perspective lens.
     */
    metresPerPixel: number | null;

    /**
     * Up direction of the picture, a world direction not parallel to the line
     * of sight; null for world `+Y`.
     */
    up: IAutoMovieVector3 | null;
  }

  /**
   * A view by name, with the switches a fitted view takes; its text is the name
   * followed by `@ortho`, `@follow`, `@focus=<pattern>` or `@flagged`.
   */
  export interface INamed {
    /** Discriminant. */
    type: "named";

    /**
     * The view's name, such as `front`, `three-quarter` or a subject's own
     * view.
     */
    name: string;

    /**
     * Whether the fitted camera is orthographic, which draws lengths true to
     * scale across the picture.
     */
    orthographic: boolean;

    /**
     * Whether the view is fitted at each drawn second alone instead of over
     * every second a capture plans, so a travelling subject stays large in the
     * picture at the cost of one shared camera across times.
     */
    follow: boolean;

    /**
     * What the fitted camera frames instead of everything drawn, or null for
     * everything drawn.
     */
    focus: IAutoMovieInspectionFocus | null;
  }
}
