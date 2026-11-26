import type {
  IAutoMovieInspectionView,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Write an inspection view as the text `parseAutoMovieInspectionView` reads, so
 * a view chosen in one host repeats in another.
 *
 * The film camera is `film`. A fixed camera is `x,y,z:tx,ty,tz`, then
 * `@ortho=<metres per pixel>` when orthographic and `@up=ux,uy,uz` when its up
 * is not world `+Y`. A named view is its name followed by `@ortho` when
 * orthographic, `@follow` when fitted per second, and then `@focus=<pattern>`
 * or `@flagged` for its focus. Every number is written in JavaScript's shortest
 * form that reads back to it, and for every view the parser returns, parsing
 * the written text gives an equal view.
 */
export function formatAutoMovieInspectionView(
  view: IAutoMovieInspectionView,
): string {
  if (view.type === "film") return "film";
  if (view.type === "fixed")
    return (
      `${triple(view.position)}:${triple(view.target)}` +
      (view.metresPerPixel === null ? "" : `@ortho=${view.metresPerPixel}`) +
      (view.up === null ? "" : `@up=${triple(view.up)}`)
    );
  return (
    view.name +
    (view.orthographic ? "@ortho" : "") +
    (view.follow ? "@follow" : "") +
    (view.focus === null
      ? ""
      : view.focus.type === "flagged"
        ? "@flagged"
        : `@focus=${view.focus.pattern}`)
  );
}

/** A vector as `x,y,z`. */
function triple(vector: IAutoMovieVector3): string {
  return `${vector.x},${vector.y},${vector.z}`;
}
