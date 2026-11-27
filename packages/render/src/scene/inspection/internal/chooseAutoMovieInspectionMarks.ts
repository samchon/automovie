import type { IAutoMovieMark } from "@automovie/interface";
import type * as THREE from "three";
import type { AutoMovieRenderInspectionMarks } from "../../AutoMovieRenderInspectionMarks.js";

/*
 * Choose the supplied marks one picture draws, and group them by the scene
 * object their frame belongs to.
 *
 * A mark is drawn when its kind is asked, its path is selected, and its anchor,
 * if it has one, is visible with its ancestors and not left out by `hide`.
 * Anchors are found by path among `anchors`, the first scene object at each
 * path, and `null` stands for world space. Marks keep their order within each
 * group.
 *
 * It throws naming the mark and the anchor when a mark follows a path no scene
 * object has.
 */
export function chooseAutoMovieInspectionMarks(
  props: AutoMovieRenderInspectionMarks.IChooseProps,
): AutoMovieRenderInspectionMarks.IChooseResult {
  const marks: IAutoMovieMark[] = [];
  const sets: Map<THREE.Object3D | null, IAutoMovieMark[]> = new Map<
    THREE.Object3D | null,
    IAutoMovieMark[]
  >();
  for (const mark of props.marks) {
    if (!props.asks(mark.kind) || !props.selects(mark.path)) continue;
    let anchor: THREE.Object3D | null = null;
    if (mark.anchor !== null) {
      anchor = props.anchors.get(mark.anchor) ?? null;
      if (anchor === null)
        throw new Error(
          `Mark "${mark.path}" follows "${mark.anchor}", which no object of the scene is`,
        );
      if (!shown(anchor) || props.hidden(mark.anchor)) continue;
    }
    marks.push(mark);
    const set: IAutoMovieMark[] = sets.get(anchor) ?? [];
    set.push(mark);
    sets.set(anchor, set);
  }
  return { marks, sets };
}

/*
 * Whether an object and every ancestor are visible.
 */
function shown(object: THREE.Object3D): boolean {
  for (
    let current: THREE.Object3D | null = object;
    current !== null;
    current = current.parent
  )
    if (!current.visible) return false;
  return true;
}
