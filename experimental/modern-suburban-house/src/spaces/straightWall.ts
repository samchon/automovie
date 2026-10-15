

import type { IWallHole } from "../types/IWallHole";
import type { IWallPoint } from "../types/IWallPoint";
import type { IWallSolid } from "../types/IWallSolid";
import { wallPanel } from "./wallPanel";

/**
 * A straight wall panel between two heights: the common rectangular case.
 *
 * A void whose bottom reaches the panel bottom (a door in a partition that
 * stands on the finished floor) cannot be a hole: it is cut as a notch of the
 * outline, so the panel stays one closed body on each side of the door. A void
 * that leaves the panel's length range or sits below its bottom is refused.
 */
export const straightWall = (props: {
  axis: "x" | "z";
  across: readonly [number, number];
  along: readonly [number, number];
  bottom: number;
  top: number;
  holes?: readonly IWallHole[];
}): IWallSolid => {
  const eps = 1e-9;
  const holes = props.holes ?? [];
  for (const h of holes)
    if (h.from <= props.along[0] + eps || h.to >= props.along[1] - eps || h.bottom < props.bottom - eps || h.top >= props.top - eps)
      throw new Error(
        `void "${h.id}" [${h.from}, ${h.to}] × [${h.bottom}, ${h.top}] leaves wall [${props.along[0]}, ${props.along[1]}] × [${props.bottom}, ${props.top}]`,
      );
  const notches = holes.filter((h) => h.bottom <= props.bottom + eps).sort(
    (x, y) => x.from - y.from,
  );
  const outline: IWallPoint[] = [{ u: props.along[0], y: props.bottom }];
  for (const n of notches)
    outline.push(
      { u: n.from, y: props.bottom },
      { u: n.from, y: n.top },
      { u: n.to, y: n.top },
      { u: n.to, y: props.bottom },
    );
  outline.push(
    { u: props.along[1], y: props.bottom },
    { u: props.along[1], y: props.top },
    { u: props.along[0], y: props.top },
  );
  const solid = wallPanel({
    axis: props.axis,
    across: props.across,
    outline,
    holes: holes.filter((h) => h.bottom > props.bottom + eps),
  });
  // The face is the full rectangle with every void, notches included.
  return {
    mesh: solid.mesh,
    face: {
      axis: props.axis,
      across: props.across,
      outline: [
        { u: props.along[0], y: props.bottom },
        { u: props.along[1], y: props.bottom },
        { u: props.along[1], y: props.top },
        { u: props.along[0], y: props.top },
      ],
      holes,
    },
  };
};

