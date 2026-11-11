import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieInspectionView } from "./IAutoMovieInspectionView.js";

/**
 * Write an inspection view as the text `parseAutoMovieInspectionView` reads, so a view chosen in one host repeats in another.
 *
 * The film camera is `film`. A fixed camera is `x,y,z:tx,ty,tz`, then `@ortho=<metres per pixel>` when orthographic and `@up=ux,uy,uz` when its up is not world `+Y`. A named view is its name followed by `@ortho` when orthographic, `@follow` when fitted per second, and then `@focus=<pattern>` or `@flagged` for its focus. Every number is written in JavaScript's shortest form that reads back to it, and for every view the parser returns, parsing the written text gives an equal view.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the text of each form, the switch order and the round trip it guarantees.
 * @evidence contracts/development/implementation.md#principled-implementation The writer mirrors the parser form by form, and `String` of a finite number is the shortest text that reads back as that number, so the round trip is exact.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per form.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Switches are written in one fixed order, so one view has one text.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the length of the written text.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure conversion of one view.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh string and keeps nothing.
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
