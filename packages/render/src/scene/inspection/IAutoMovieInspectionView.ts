import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A view of an inspection as its text says it, before anything is fitted: the subject's own delivery camera, a fixed camera, or a name with the switches a fitted view takes.
 *
 * `parseAutoMovieInspectionView` writes it and `resolveAutoMovieInspectionView` turns it into a camera. A name is resolved there, because whether it names one of the subject's views or a named viewpoint depends on the subject.
 *
 * @evidence contracts/development/design.md#principled-representation The three ways a camera is placed need different data, so each is one member of a union keyed by `type`: the film camera has none, a fixed camera two points in world metres, and a name the projection and focus a fitted view takes. A fixed or film view cannot carry a focus because the union gives it none.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the renderer's inspection beside its parser and resolver, read by every host that takes a view as text.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No named viewpoint or subject view is listed in the type: names stay strings until a subject is known.
 * @evidence contracts/development/common.md#meaningful-documentation States the three forms, who writes and reads the record, and why a name is resolved later.
 */
export type IAutoMovieInspectionView =
  | IAutoMovieInspectionView.IFilm
  | IAutoMovieInspectionView.IFixed
  | IAutoMovieInspectionView.INamed;
export namespace IAutoMovieInspectionView {
  /**
   * The subject's own delivery camera, drawn unchanged; its text is `film`.
   *
   * @evidence contracts/development/design.md#principled-representation The delivery camera is the subject's, so the view holds only its discriminant.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One member.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts It is a member of the union, not an absent view, so a list of views can include it.
   * @evidence contracts/development/common.md#meaningful-documentation States what is drawn and the text.
   */
  export interface IFilm {
    /** Discriminant. */
    type: "film";
  }

  /**
   * A camera at one point looking at another, in world metres; its text is `x,y,z:tx,ty,tz`.
   *
   * @evidence contracts/development/design.md#principled-representation Two distinct world points fix a perspective camera's direction; the lens is the subject's.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The discriminant and the two points.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No fitting member: a fixed view is not fitted.
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, units and text.
   */
  export interface IFixed {
    /** Discriminant. */
    type: "fixed";

    /** Camera position, world metres. */
    position: IAutoMovieVector3;

    /** Point looked at, world metres, distinct from `position`. */
    target: IAutoMovieVector3;
  }

  /**
   * A view by name, with the switches a fitted view takes; its text is the name followed by `@ortho`, `@focus=<pattern>` or `@flagged`.
   *
   * @evidence contracts/development/design.md#principled-representation A name is either a subject's view or a named viewpoint fitted to bounds; projection and focus only change the fit, so they ride on the name.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The discriminant, the name and the two switches.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Focus is null or one of two forms, so a pattern and the flagged focus cannot both be given.
   * @evidence contracts/development/common.md#meaningful-documentation States the text and what each member changes.
   */
  export interface INamed {
    /** Discriminant. */
    type: "named";

    /** The view's name, such as `front`, `three-quarter` or a subject's own view. */
    name: string;

    /** Whether the fitted camera is orthographic, which draws lengths true to scale across the picture. */
    orthographic: boolean;

    /** What the fitted camera frames instead of everything drawn, or null for everything drawn. */
    focus: IFocus | null;
  }

  /**
   * What a fitted view frames: the drawn objects and marks a path pattern selects, or every drawn flagged mark.
   *
   * @evidence contracts/development/design.md#principled-representation The two focus forms need different data, so they are a union keyed by `type`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The pattern form holds its pattern, the flagged form nothing.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The flagged form is its own member rather than a reserved pattern, so no path name is taken from the path grammar.
   * @evidence contracts/development/common.md#meaningful-documentation States what each form frames.
   */
  export type IFocus = { type: "pattern"; pattern: string } | { type: "flagged" };
}
