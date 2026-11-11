import type { IAutoMovieMark } from "@automovie/engine";
import type * as THREE from "three";

/**
 * Choose the supplied marks one picture draws, and group them by the scene object their frame belongs to.
 *
 * A mark is drawn when its kind is asked, its path is selected, and its anchor, if it has one, is visible with its ancestors and not left out by `hide`. Anchors are found by path among `anchors`, the first scene object at each path, and `null` stands for world space. Marks keep their order within each group.
 *
 * It throws naming the mark and the anchor when a mark follows a path no scene object has.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three conditions, how anchors are found, the grouping and order, and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation A mark is drawn in its anchor's frame, so it can be drawn only where the anchor is drawn; the anchor's visibility and `hide` decide that, while `parts` decides by the mark's own path, so one curve can be drawn alone.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the marks with one map from anchor to group.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing anchor is refused instead of drawn in world space, and no kind or path is treated specially.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the marks, with the verdicts memoised by the caller and one walk up each anchor's ancestors.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call chooses among the marks of one state.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns arrays of the given marks and borrowed anchors; nothing is kept.
 */
export function chooseAutoMovieInspectionMarks(props: {
  /** The supplied marks. */
  marks: readonly IAutoMovieMark[];

  /** Whether a kind is asked. */
  asks: (kind: string) => boolean;

  /** Whether a path is selected. */
  selects: (path: string) => boolean;

  /** Whether a path is left out by `hide`. */
  hidden: (path: string) => boolean;

  /** The first scene object at each path. */
  anchors: ReadonlyMap<string, THREE.Object3D>;
}): {
  marks: IAutoMovieMark[];
  sets: Map<THREE.Object3D | null, IAutoMovieMark[]>;
} {
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

/** Whether an object and every ancestor are visible. */
function shown(object: THREE.Object3D): boolean {
  for (
    let current: THREE.Object3D | null = object;
    current !== null;
    current = current.parent
  )
    if (!current.visible) return false;
  return true;
}
