import type { IAutoMovieViewerSubjectBounds } from "../subjectViewpoint/IAutoMovieViewerSubjectBounds.js";
import type { IAutoMovieInspectionLegendEntry } from "./IAutoMovieInspectionLegendEntry.js";

/**
 * An inspection applied to a scene: what its colours mean, what it selected, and the three calls made while it is in force.
 *
 * @evidence contracts/development/design.md#principled-representation An applied inspection is temporary scene state, so it is held as a handle whose `restore` ends it, the form the render-mode override already has.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The legend and the selected paths a manifest stores, and three calls; the undo list, the overlays and the isolated objects stay inside the owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The legend reports what was drawn, so a defect kind that was asked for and not found is absent instead of listed with a zero that reads as a mark.
 * @evidence contracts/development/common.md#meaningful-documentation States what the handle stands for and when each call is made.
 */
export interface IAutoMovieInspectionHandle {
  /**
   * One entry per mark colour in the picture, with the number of marks.
   */
  legend: IAutoMovieInspectionLegendEntry[];

  /**
   * The distinct paths the request selects, objects in scene order and then curves. A record of the picture keeps it, so a reader confirms the selection matched what was meant.
   */
  selected: string[];

  /**
   * Bring the shade and the marks to the scene's current time and pose. Call it after every seek and before drawing.
   *
   * The `outline` shells and the `pose` segments are moved with the scene, and so is every curve and defect mark. A shade made of swapped materials needs no move.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what moves, what needs no move and when to call it.
   * @evidence contracts/development/implementation.md#principled-implementation The shade is brought up to date, world matrices are refreshed, then every overlay is placed from them, so the shade, the marks and the surfaces are drawn from the same instant.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call covers the shade and every overlay.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Defects are not measured again: topology does not change with pose, only positions do. The shade is refreshed in place and not applied again.
   * @evidence contracts/development/implementation.md#efficient-algorithms One world-matrix pass, then work linear in the marks, the outline's shells and the pose's bone links.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Measured defects, built buffers and the shade's shells, segments and materials are reused for every frame of the run.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates nothing that outlives the call.
   */
  update: () => void;

  /**
   * The world-space box of what the inspection leaves drawn now, or null when nothing is. A view is framed on it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is measured, the null case and the use.
   * @evidence contracts/development/implementation.md#principled-implementation The box is measured on the scene as isolated, so a partial view is framed on its part.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call with no argument, answered by the bounds owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An empty selection is null, not a box at the origin.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the drawn vertices, measured only when asked.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The pose changes between calls, so no earlier box is valid to reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns plain numbers and keeps nothing.
   */
  bounds: () => IAutoMovieViewerSubjectBounds | null;

  /**
   * End the inspection: put back every layer, material, wireframe flag and clipping state it changed, and remove and release its marks. Calling it again does nothing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States everything that is put back and the repeated-call behaviour.
   * @evidence contracts/development/implementation.md#principled-implementation Changes are undone in the reverse of the order they were made, so a later step never restores onto an earlier step's temporary state.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call replays one undo list.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every undo step is attempted even when one fails, and the failures are reported together.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in what was changed.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A restore computes nothing to reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources After the call the scene holds none of the inspection's objects or materials.
   */
  restore: () => void;
}
