import type { IAutoMovieViewerViewpoint } from "@automovie/viewer";

/**
 * One camera an inspection draws through, as `planInspectionViews` reads it from a view request.
 *
 * `id` names the view in file names, captions and records.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the producer and what `id` is for; each member states where its camera stands and what moves it.
 * @evidence contracts/development/design.md#principled-representation The four ways a camera is placed need different data, so each is one member of a union keyed by `kind` and a consumer cannot read a coordinate a named view does not have.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The viewpoint is the viewer's own record; the production adds only the kind, the id and a fixed camera's two points.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The film camera is a member of the union, not an absent value, so a request for several views can include it.
 */
export type InspectionView =
  | {
      /** The film's own camera, which shows the delivered framing. */
      kind: "film";

      /** Always `film`. */
      id: "film";
    }
  | {
      /** One of the production's `IFilmProduction.views`, placed again for every drawn second. */
      kind: "preset";

      /** The view's key in `IFilmProduction.views`. */
      id: string;
    }
  | {
      /** One of the viewer's named viewpoints, framed on what is drawn. */
      kind: "named";

      /** The viewpoint's id, such as `front` or `three-quarter`. */
      id: string;

      /** Direction and distance factor the framing owner takes. */
      viewpoint: IAutoMovieViewerViewpoint;
    }
  | {
      /** A camera that stays at one point and looks at another. */
      kind: "fixed";

      /** Always `inspection`. */
      id: "inspection";

      /** Camera position in world metres. */
      position: readonly [number, number, number];

      /** Point the camera looks at, in world metres. */
      target: readonly [number, number, number];
    };
