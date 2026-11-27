import { Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeConvexCell,
} from "../../core";

/** A rigid collar or cuff made of convex cells around an open finite bore. */
export namespace AnnularFitting {
  /** All part ids owned by the same rigid annular fitting. */
  export function ids(id: string): string[] {
    return Array.from({ length: SEGMENTS }, (_: unknown, i: number): string =>
      i === 0 ? id : `${id}-wall-${i}`,
    );
  }

  /**
   * Prepare one fitting's cell geometry in a common frame with the axis along
   * local +Y. Its inner and outer wall faces are tangent at the stated radii.
   */
  export function prepare(
    inner: number,
    outer: number,
    width: number,
  ): readonly AutoMovieArchetypeConvexCell.ICell[] {
    const angle: number = (2 * Math.PI) / SEGMENTS;
    const corner: number = 1 / Math.cos(angle / 2);
    return Array.from(
      { length: SEGMENTS },
      (_: unknown, i: number): AutoMovieArchetypeConvexCell.ICell => {
        const points: IAutoMovieVector3[] = [];
        for (const radius of [inner, outer])
          for (const direction of [(i - 0.5) * angle, (i + 0.5) * angle])
            for (const y of [-width / 2, width / 2])
              points.push({
                x: radius * corner * Math.cos(direction),
                y,
                z: radius * corner * Math.sin(direction),
              });
        return AutoMovieArchetypeConvexCell.of(points);
      },
    );
  }

  /**
   * Place prepared cells along the fitted body's axis. All parts share the same
   * origin so a carrier can update every cell with one rigid transform.
   */
  export function emit<I extends string, D extends string>(
    builder: AutoMovieArchetypeBuilder<I, D>,
    id: string,
    cells: readonly AutoMovieArchetypeConvexCell.ICell[],
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    color: string,
  ): void {
    const at: IAutoMovieVector3 = Vector3.scale(Vector3.add(from, to), 0.5);
    const rotation: AutoMovieArchetypeBuilder.IOptions["rotation"] =
      AutoMovieEngineMath.rotationBetween({ x: 0, y: 1, z: 0 }, Vector3.subtract(to, from));
    ids(id).forEach((part: string, index: number): void => {
      builder.convex(part, cells[index]!, at, { color, rotation });
    });
  }
}

/** Thirty-two sides limit radial excess to less than one percent. */
const SEGMENTS: number = 32;
