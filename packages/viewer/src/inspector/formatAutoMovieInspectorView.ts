import type { IAutoMovieInspectionView } from "@automovie/render";

/**
 * Write a view as the text `parseAutoMovieInspectionView` reads back to an equal view, so the view panel builds a view from its controls and dispatches its text.
 *
 * | View | Text |
 * | --- | --- |
 * | Film | `film` |
 * | Fixed | `x,y,z:tx,ty,tz`, each number in JavaScript's shortest form that reads back to it |
 * | Named | the name, then `@ortho` when orthographic, then `@focus=<pattern>` or `@flagged` |
 *
 * The text of an invalid view, such as a name holding `@` or a fixed camera looking from its own target, is written as it is and refused when it is read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Tabulates the text of every form, the switch order and what happens to an invalid view.
 * @evidence contracts/development/implementation.md#principled-implementation Mirrors the view grammar's three forms; `String` of a finite number is the shortest text that reads back as that number, so the round trip is exact.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per form.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Validation stays with the grammar's reader, which every dispatched text goes through.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per view.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure conversion of one view.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh string and keeps nothing.
 */
export function formatAutoMovieInspectorView(
  view: IAutoMovieInspectionView,
): string {
  if (view.type === "film") return "film";
  if (view.type === "fixed")
    return `${view.position.x},${view.position.y},${view.position.z}:${view.target.x},${view.target.y},${view.target.z}`;
  const focus: string =
    view.focus === null
      ? ""
      : view.focus.type === "flagged"
        ? "@flagged"
        : `@focus=${view.focus.pattern}`;
  return `${view.name}${view.orthographic ? "@ortho" : ""}${focus}`;
}
