import type {
  IAutoMovieInspectionFocus,
  IAutoMovieMark,
} from "@automovie/interface";
import type * as THREE from "three";

import type { IAutoMovieViewerSubjectBounds } from "../subjectViewpoint/IAutoMovieViewerSubjectBounds.js";
import type { IAutoMovieInspectionPath } from "./IAutoMovieInspectionPath.js";
import { matchAutoMovieInspectionPath } from "./internal/matchAutoMovieInspectionPath.js";
import { measureAutoMovieInspectionPaths } from "./measureAutoMovieInspectionPaths.js";

/**
 * Measure the world-space box a view's focus frames: the drawn objects and
 * marks a path pattern matches, or every drawn flagged mark, so a close-up on a
 * part or on a defect's region is one request.
 *
 * The boxes are those `measureAutoMovieInspectionPaths` measures, joined into
 * one. It throws when a pattern matches nothing drawn, and when the flagged
 * focus finds no flagged mark, saying no mark is flagged.
 */
export function focusAutoMovieInspection(props: {
  /** What to frame. */
  focus: IAutoMovieInspectionFocus;

  /** The drawn, selected objects. */
  objects: readonly IAutoMovieInspectionPath[];

  /** The drawn marks with the objects their frames belong to. */
  marks: readonly { mark: IAutoMovieMark; anchor: THREE.Object3D | null }[];
}): IAutoMovieViewerSubjectBounds {
  const focus: IAutoMovieInspectionFocus = props.focus;
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
