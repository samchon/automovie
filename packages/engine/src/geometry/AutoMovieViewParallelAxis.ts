import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionOutlineParameter,
  IAutoMovieConstructionParallelAxis,
  IAutoMovieLoftSectionFrame,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
  IAutoMovieViewOutline,
  IAutoMovieViewParallelAxis,
} from "@automovie/interface";

import { AutoMovieViewAxisJet } from "./AutoMovieViewAxisJet";
import { AutoMovieViewOutline } from "./AutoMovieViewOutline";
import { AutoMovieViewParameter } from "./AutoMovieViewParameter";

/**
 * Parallel source planes: fixed chart axes translated by three admitted
 * source-coordinate curves, independent of the origin course's tangent.
 */
export namespace AutoMovieViewParallelAxis {
  /** Admit fixed planes and their original coordinate curves. */
  export function create(
    origin: IAutoMovieViewParallelAxis.IOrigin,
    u: AutoMovieVector3Tuple,
    v: AutoMovieVector3Tuple,
  ): IAutoMovieViewAxis.IAxis | string {
    const U: AutoMovieVector3Tuple = [...u];
    const V: AutoMovieVector3Tuple = [...v];
    const tolerance: number = 64 * Number.EPSILON;
    if (
      Math.abs(Math.hypot(...U) - 1) > tolerance ||
      Math.abs(Math.hypot(...V) - 1) > tolerance ||
      Math.abs(U[0] * V[0] + U[1] * V[1] + U[2] * V[2]) > tolerance
    )
      return "parallel chart directions must be finite, unit and perpendicular";
    const curves: IAutoMovieViewOutline.IOutline[] = [];
    for (const coordinate of ["x", "y", "z"] as const) {
      const source: IAutoMovieViewOutline.IResult = AutoMovieViewOutline.create(
        origin[coordinate],
      );
      if ("detail" in source)
        return `parallel origin ${coordinate}: ${source.detail}`;
      curves.push(source);
    }
    const at: (station: number) => IAutoMovieLoftSectionFrame = (
      station: number,
    ): IAutoMovieLoftSectionFrame => {
      const point: AutoMovieVector3Tuple = [0, 0, 0];
      for (let c: number = 0; c < 3; c++) {
        const value: number | string = AutoMovieViewOutline.value(
          curves[c]!,
          station,
        );
        if (typeof value === "string")
          throw new Error(`parallel origin ${c}: ${value}`);
        point[c] = value;
      }
      return { origin: point, u: [...U], v: [...V] };
    };
    return {
      at,
      jet: (
        station: number,
        parameter?: IAutoMovieConstructionOutlineParameter,
      ): IAutoMovieViewAxisJet.IJet | null => {
        const point: AutoMovieVector3Tuple = [0, 0, 0];
        const first: AutoMovieVector3Tuple = [0, 0, 0];
        const second: AutoMovieVector3Tuple = [0, 0, 0];
        for (let c: number = 0; c < 3; c++) {
          const reading: IAutoMovieViewOutline.IReading | string =
            AutoMovieViewOutline.at(curves[c]!, station);
          if (typeof reading === "string") {
            const value: number | string = AutoMovieViewOutline.value(
              curves[c]!,
              station,
            );
            if (typeof value === "string")
              throw new Error(`parallel origin ${c}: ${value}`);
            return null;
          }
          const transfer: [number, number] | null =
            AutoMovieViewParameter.transferJet(
              curves[c]!.parameter,
              parameter,
              station,
            );
          if (transfer === null) return null;
          point[c] = reading.value;
          first[c] = reading.parameterJet[0] * transfer[0];
          second[c] =
            reading.parameterJet[1] * transfer[0] * transfer[0] +
            reading.parameterJet[0] * transfer[1];
        }
        return AutoMovieViewAxisJet.fixed(
          { origin: point, u: [...U], v: [...V] },
          first,
          second,
        );
      },
    };
  }

  /**
   * Prepare the source axis from its authoritative metre declaration, retaining
   * that same declaration for tree serialization.
   */
  export function from(
    declaration: IAutoMovieConstructionParallelAxis,
  ): IAutoMovieViewAxis.IAxis | string {
    const original: IAutoMovieConstructionParallelAxis = copy(declaration);
    const axis: IAutoMovieViewAxis.IAxis | string = create(
      {
        x: AutoMovieViewOutline.scale(original.origin.x, 1000, 1000),
        y: AutoMovieViewOutline.scale(original.origin.y, 1000, 1000),
        z: AutoMovieViewOutline.scale(original.origin.z, 1000, 1000),
      },
      [original.u.x, original.u.y, original.u.z],
      [original.v.x, original.v.y, original.v.z],
    );
    return typeof axis === "string" ? axis : { ...axis, parallel: original };
  }

  /**
   * Copy the actual declaration of an axis prepared by from; return null for an
   * arbitrary or other-kind axis.
   */
  export function source(
    axis: IAutoMovieViewAxis.IAxis,
  ): IAutoMovieConstructionParallelAxis | null {
    return axis.parallel === undefined ? null : copy(axis.parallel);
  }

  /*
   * Copy one source declaration without converting its metre units.
   *
   * Copies every coordinate knot list, parameter record and basis to isolate
   * retained metadata and returned declarations from caller mutation. No
   * numeric input is fitted, sampled or replaced. O(n) copying in coordinate
   * knot count produces fresh caller-owned curves and fixed-size basis records;
   * it cannot alias an earlier mutable ownership copy.
   */
  function copy(
    declaration: IAutoMovieConstructionParallelAxis,
  ): IAutoMovieConstructionParallelAxis {
    return {
      type: "parallel",
      origin: {
        x: AutoMovieViewOutline.scale(declaration.origin.x, 1, 1),
        y: AutoMovieViewOutline.scale(declaration.origin.y, 1, 1),
        z: AutoMovieViewOutline.scale(declaration.origin.z, 1, 1),
      },
      u: { ...declaration.u },
      v: { ...declaration.v },
    };
  }
}
