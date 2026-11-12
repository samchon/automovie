import type { IAutoMovieVector3 } from "@automovie/interface";

import { matchAutoMovieInspectionPath } from "./matchAutoMovieInspectionPath.js";

/**
 * Expand a sweep pattern into its units, each with the selection that draws it alone and the selection that draws it with the neighbours it touches, so the whole, each unit alone and each unit with its neighbours are planned in one run.
 *
 * `objects` are drawn objects by path with their world-space boxes in metres, one entry per path. A unit is a path the pattern matches whose parent paths it does not match, so a pattern that takes a subtree yields the subtree's top as one unit; the unit holds every object at or beneath its path, and its box is the union of theirs. A neighbour is an object outside the unit whose box intersects the unit's box grown by `margin` metres on every side, touching included. Units come in the order their first object appears, and neighbours in the objects' order.
 *
 * `alone` is the unit's path, and `neighbours` the paths of its neighbours; drawing the unit with its neighbours selects both. A unit with no neighbour within the margin has an empty `neighbours`, so its neighbour cell equals its alone cell and a planner need not draw it twice.
 *
 * It throws for a margin that is negative or not finite, a box whose corners are not finite or not ordered, and a pattern that matches no object.
 *
 * ```ts
 * expandAutoMovieInspectionSweep({ objects, pattern: "hero/*", margin: 0.02 });
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the input, what a unit and its box are, the neighbour rule with its unit and boundary, the order, what each output member selects, the empty-neighbour case and every refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Two axis-aligned boxes intersect exactly when their intervals overlap on all three axes, so growing the unit's box by the margin and testing overlap finds every object within that distance along each axis; any scene that reports world boxes can answer it, whatever its subject.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, unit discovery by the shallowest matched path, unit boxes, then one overlap test per unit and object.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The margin is the caller's stated value, no path or subject kind is treated specially, and an empty match is refused instead of planning no cell.
 * @evidence contracts/development/implementation.md#efficient-algorithms Units times objects overlap tests, plus one pattern match per object and per parent path; a sweep has tens of units, where a spatial index would cost more than it saves.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its arguments.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh records and keeps nothing.
 */
export function expandAutoMovieInspectionSweep(props: {
  /** Drawn objects by path, with their world-space boxes in metres. */
  objects: readonly {
    path: string;
    min: IAutoMovieVector3;
    max: IAutoMovieVector3;
  }[];

  /** Path pattern of the units, under the inspection path grammar. */
  pattern: string;

  /** Distance in metres a neighbour's box may lie from the unit's box. */
  margin: number;
}): { unit: string; alone: string[]; neighbours: string[] }[] {
  if (!(Number.isFinite(props.margin) && props.margin >= 0))
    throw new Error(
      `Sweep margin ${props.margin} is not a finite distance of zero or more`,
    );
  for (const object of props.objects)
    for (const axis of AXES)
      if (
        !Number.isFinite(object.min[axis]) ||
        !Number.isFinite(object.max[axis]) ||
        object.min[axis] > object.max[axis]
      )
        throw new Error(
          `Sweep object "${object.path}" has no finite ordered box along ${axis}`,
        );

  // A unit is a matched path whose parents are not matched.
  const units: string[] = [];
  for (const object of props.objects) {
    if (!matchAutoMovieInspectionPath(object.path, props.pattern)) continue;
    const names: string[] = object.path === "" ? [] : object.path.split("/");
    let unit: string = object.path;
    for (let depth: number = 0; depth < names.length; depth++) {
      const parent: string = names.slice(0, depth).join("/");
      if (matchAutoMovieInspectionPath(parent, props.pattern)) {
        unit = parent;
        break;
      }
    }
    if (!units.includes(unit)) units.push(unit);
  }
  if (units.length === 0)
    throw new Error(`Sweep pattern "${props.pattern}" matches no object`);

  return units.map(
    (unit: string): { unit: string; alone: string[]; neighbours: string[] } => {
      const inside: (path: string) => boolean = (path: string): boolean =>
        unit === "" || path === unit || path.startsWith(`${unit}/`);
      const members: typeof props.objects = props.objects.filter(
        (object: (typeof props.objects)[number]): boolean =>
          inside(object.path),
      );
      const low: IAutoMovieVector3 = corner(members, "min");
      const high: IAutoMovieVector3 = corner(members, "max");
      const neighbours: string[] = props.objects
        .filter(
          (object: (typeof props.objects)[number]): boolean =>
            !inside(object.path) &&
            AXES.every(
              (axis: "x" | "y" | "z"): boolean =>
                object.max[axis] >= low[axis] - props.margin &&
                object.min[axis] <= high[axis] + props.margin,
            ),
        )
        .map((object: (typeof props.objects)[number]): string => object.path);
      return { unit, alone: [unit], neighbours };
    },
  );
}

/** The three axes of a box. */
const AXES: readonly ("x" | "y" | "z")[] = ["x", "y", "z"];

/** The lowest `min` or the highest `max` corner of a set of boxes. */
function corner(
  boxes: readonly { min: IAutoMovieVector3; max: IAutoMovieVector3 }[],
  side: "min" | "max",
): IAutoMovieVector3 {
  const pick: (values: number[]) => number =
    side === "min"
      ? (values: number[]): number => Math.min(...values)
      : (values: number[]): number => Math.max(...values);
  return {
    x: pick(
      boxes.map(
        (box: { min: IAutoMovieVector3; max: IAutoMovieVector3 }): number =>
          box[side].x,
      ),
    ),
    y: pick(
      boxes.map(
        (box: { min: IAutoMovieVector3; max: IAutoMovieVector3 }): number =>
          box[side].y,
      ),
    ),
    z: pick(
      boxes.map(
        (box: { min: IAutoMovieVector3; max: IAutoMovieVector3 }): number =>
          box[side].z,
      ),
    ),
  };
}
