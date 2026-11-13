import type { IAutoMovieMark } from "@automovie/engine";
import type * as THREE from "three";

import type { IAutoMovieViewerSubjectBounds } from "../subjectViewpoint/IAutoMovieViewerSubjectBounds.js";
import type { IAutoMovieInspectionPath } from "./IAutoMovieInspectionPath.js";
import type { IAutoMovieInspectionView } from "./IAutoMovieInspectionView.js";
import { matchAutoMovieInspectionPath } from "./matchAutoMovieInspectionPath.js";
import { measureAutoMovieInspectionPaths } from "./measureAutoMovieInspectionPaths.js";

/**
 * Measure the world-space box a view's focus frames: the drawn objects and marks a path pattern matches, or every drawn flagged mark, so a close-up on a part or on a defect's region is one request.
 *
 * The boxes are those `measureAutoMovieInspectionPaths` measures, joined into one. It throws when a pattern matches nothing drawn, and when the flagged focus finds no flagged mark, saying no mark is flagged.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each focus frames, where the boxes come from, and both refusals.
 * @evidence contracts/development/implementation.md#principled-implementation A flagged mark is where a measurement found an anomaly, so its region is the place a close-up frames; a pattern focus uses the same path grammar as every other selection.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Measure the matched paths, then join their boxes.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An empty focus is refused instead of falling back to the whole picture, which would frame a still with no defect in it.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the matched objects' drawn vertices and marks' coordinates.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The pose changes between calls, so no earlier box is reused.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns plain numbers and keeps nothing.
 */
export function focusAutoMovieInspection(props: {
  /** What to frame. */
  focus: IAutoMovieInspectionView.IFocus;

  /** The drawn, selected objects. */
  objects: readonly IAutoMovieInspectionPath[];

  /** The drawn marks with the objects their frames belong to. */
  marks: readonly { mark: IAutoMovieMark; anchor: THREE.Object3D | null }[];
}): IAutoMovieViewerSubjectBounds {
  const focus: IAutoMovieInspectionView.IFocus = props.focus;
  const flagged: boolean = focus.type === "flagged";
  const boxes: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  }[] = measureAutoMovieInspectionPaths({
    objects: flagged ? [] : props.objects,
    marks: flagged
      ? props.marks.filter(
          (entry: { mark: IAutoMovieMark }): boolean => entry.mark.flagged,
        )
      : props.marks,
    choose:
      focus.type === "pattern"
        ? (path: string): boolean =>
            matchAutoMovieInspectionPath(path, focus.pattern)
        : (): boolean => true,
  });
  if (boxes.length === 0)
    throw new Error(
      focus.type === "flagged"
        ? "Inspection focus @flagged has nothing to frame: no mark is flagged"
        : `Inspection focus "${focus.pattern}" matches nothing drawn`,
    );
  return {
    min: {
      x: Math.min(
        ...boxes.map((box: { min: { x: number } }): number => box.min.x),
      ),
      y: Math.min(
        ...boxes.map((box: { min: { y: number } }): number => box.min.y),
      ),
      z: Math.min(
        ...boxes.map((box: { min: { z: number } }): number => box.min.z),
      ),
    },
    max: {
      x: Math.max(
        ...boxes.map((box: { max: { x: number } }): number => box.max.x),
      ),
      y: Math.max(
        ...boxes.map((box: { max: { y: number } }): number => box.max.y),
      ),
      z: Math.max(
        ...boxes.map((box: { max: { z: number } }): number => box.max.z),
      ),
    },
  };
}
