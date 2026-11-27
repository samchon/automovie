import type {
  IAutoMovieInspectionFocus,
  IAutoMovieMark,
} from "@automovie/interface";


import type { IAutoMovieViewerSubjectBounds } from "../../IAutoMovieViewerSubjectBounds.js";

import { matchAutoMovieInspectionPath } from "./matchAutoMovieInspectionPath.js";
import type { AutoMovieRenderInspection } from "../../AutoMovieRenderInspection.js";
import { AutoMovieRenderInspectionGeometry } from "../../AutoMovieRenderInspectionGeometry.js";

/*
 * Measure the world-space box a view's focus frames: the drawn objects and
 * marks a path pattern matches, or every drawn flagged mark, so a close-up on a
 * part or on a defect's region is one request.
 *
 * The boxes are those `AutoMovieRenderInspectionGeometry.measurePaths` measures, joined into
 * one. It throws when a pattern matches nothing drawn, and when the flagged
 * focus finds no flagged mark, saying no mark is flagged.
 */
export function focusAutoMovieInspection(props: AutoMovieRenderInspection.IFocusProps): IAutoMovieViewerSubjectBounds {
  const focus: IAutoMovieInspectionFocus = props.focus;
  const flagged: boolean = focus.type === "flagged";
  const boxes: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  }[] = AutoMovieRenderInspectionGeometry.measurePaths({
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
