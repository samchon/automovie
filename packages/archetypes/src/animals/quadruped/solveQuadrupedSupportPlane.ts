import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * Put an exact sagittal limb solve in the plane of its supported ankle.
 * Parameter root: Fixed attachment in model metres.
 * Parameter ankle: The exact model-space ankle target, with lateral displacement
 * from root.
 * Parameter solve: Existing sagittal solver, which owns the chain lengths and fold.
 * Returns: Model-space controls from the root through the ankle.
 * When the displacement does not determine a finite
 * support plane or the planar solver refuses.
 */
export function solveQuadrupedSupportPlane(
  root: IAutoMovieVector3,
  ankle: IAutoMovieVector3,
  solve: (planar: IAutoMovieVector3) => IAutoMovieVector3[],
): IAutoMovieVector3[] {
  const side: number = ankle.x - root.x;
  const drop: number = root.y - ankle.y;
  const span: number = Math.hypot(side, drop);
  if (!(span > 0))
    throw new RangeError(
      "The lateral ankle does not define a finite support plane",
    );
  const planar: IAutoMovieVector3[] = solve({
    x: root.x,
    y: root.y - span,
    z: ankle.z,
  });
  return planar.map(
    (point: IAutoMovieVector3, index: number): IAutoMovieVector3 => {
      if (index === planar.length - 1) return { ...ankle };
      const fraction: number = (root.y - point.y) / span;
      return {
        x: root.x + fraction * side,
        y: root.y - fraction * drop,
        z: point.z,
      };
    },
  );
}
