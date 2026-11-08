import {
  type AutoMovieLoftFrame,
  AutoMovieViewAxis,
  AutoMovieViewOutline,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import type { AutoMovieHumanHeadEarRidge } from "./AutoMovieHumanHeadEarRidge";

/**
 * Original ridge coordinate sources and the frame that borrows a canonical fork.
 *
 * @evidence contracts/common.md#principled-implementation Retains the original coordinate interpolation and projects the identical parent's fork frame along that original course.
 * @evidence contracts/common.md#clear-and-simple-design One regional axis owner serves ridge authoring and later whole-port readers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no resampled course, fitted frame or fabricated analytic transport jet.
 * @evidence contracts/common.md#meaningful-documentation Uses physical calibration-mm stations and preserves the borrowed frame and coordinate2 authority.
 * @evidence contracts/performance.md#efficient-algorithms Three linear coordinate admissions precede original-outline lookups and fixed frame work; an unbound course retains the engine minimal-axis owner's costs.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned original coordinates supply both actual frames and later fork reading.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only caller-owned coordinate preparations and the borrowed port survive with the returned axis; no global cache is retained.
 */
export namespace AutoMovieHumanHeadEarRidgeAxis {
  /**
   * Keep course points while a borrowed fork owns its entire initial plane.
   *
   * @evidence contracts/common.md#principled-implementation Original coordinate outlines share the parent's actual coordinate2 at the fork; its frame supplies the common normal before the branch turns toward its own remaining course points.
   * @evidence contracts/common.md#clear-and-simple-design One set of three source curves supplies positions, course tangents and subsequent port readers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not refit a completed surface or fabricate analytic jets for numerical transported frames.
   * @evidence contracts/common.md#meaningful-documentation Fork coordinate2 uses the same physical-mm clock; normalized outline jets are converted once at authoring.
   * @evidence contracts/performance.md#efficient-algorithms Three linear coordinate admissions precede logarithmic bound-axis outline reads and fixed frame arithmetic. The unbound path additionally prepares the engine minimal axis and retains its own transport-query costs.
   * @evidence contracts/performance.md#reuse-equivalent-work The same admitted coordinates provide branch frames and all later port readings.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned axis and coordinate preparations retain the immutable parent port.
   */
  export function of(
    name: string,
    points: [number, number, number][],
    stations: number[],
    normal: [number, number, number],
    ports: AutoMovieHumanHeadEarRidge.IPorts,
  ): {
    axis: AutoMovieViewAxis.IAxis;
    coordinates: AutoMovieHumanHeadEarRidge.IRidge["coordinates"];
  } {
    const shared: (
      i: number,
    ) => AutoMovieHumanHeadEarRidge.IPort | undefined = (
      i: number,
    ): AutoMovieHumanHeadEarRidge.IPort | undefined =>
      i === 1 && typeof ports.start === "object"
        ? ports.start
        : i === points.length - 2 && typeof ports.end === "object"
          ? ports.end
          : undefined;
    const span: number = stations.at(-1)! - stations[0]!;
    const coordinates: AutoMovieHumanHeadEarRidge.IRidge["coordinates"] = [
      0, 1, 2,
    ].map((component: number): AutoMovieViewOutline.IOutline => {
      const input: IAutoMovieViewPart.IOutline = {
        knots: stations.map(
          (station: number, i: number): IAutoMovieViewPart.IKnot => {
            const parent: AutoMovieHumanHeadEarRidge.IPort | undefined =
              shared(i);
            return {
              site: `${name}.coordinate.${component}.${i}`,
              station,
              value: points[i]![component]!,
              ...(parent === undefined
                ? {}
                : {
                    jet: {
                      first: parent.originJet[0][component]! * span,
                      second: parent.originJet[1][component]! * span * span,
                    },
                  }),
            };
          },
        ),
      };
      const prepared:
        | AutoMovieViewOutline.IOutline
        | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(input);
      if ("detail" in prepared)
        throw new Error(`Ear source course ${name}: ${prepared.detail}`);
      return prepared;
    }) as AutoMovieHumanHeadEarRidge.IRidge["coordinates"];
    const parent: AutoMovieHumanHeadEarRidge.IPort | undefined =
      typeof ports.start === "object"
        ? ports.start
        : typeof ports.end === "object"
          ? ports.end
          : undefined;
    if (parent === undefined)
      return {
        coordinates,
        axis: AutoMovieViewAxis.minimal(
          stations.map(
            (station: number, i: number): AutoMovieViewAxis.IAxisKnot => ({
              station,
              point: points[i]!,
            }),
          ),
          normal,
          1,
        ),
      };
    const axis: AutoMovieViewAxis.IAxis = {
      at: (station: number): AutoMovieLoftFrame.IFrame => {
        const readings: AutoMovieViewOutline.IReading[] = coordinates.map(
          (
            outline: AutoMovieViewOutline.IOutline,
          ): AutoMovieViewOutline.IReading => {
            const read: AutoMovieViewOutline.IReading | string =
              AutoMovieViewOutline.at(outline, station);
            if (typeof read === "string" || read.stationJet === null)
              throw new Error(`Ear source ${name} has no regular course frame`);
            return read;
          },
        );
        const tangent: [number, number, number] = readings.map(
          (read: AutoMovieViewOutline.IReading): number => read.stationJet![0],
        ) as [number, number, number];
        const speed: number = Math.hypot(...tangent);
        if (!(speed > 0 && Number.isFinite(speed)))
          throw new Error(`Ear source ${name} has a singular course tangent`);
        const t: [number, number, number] = tangent.map(
          (value: number): number => value / speed,
        ) as [number, number, number];
        const dot: number = parent.frame.u.reduce(
          (sum: number, value: number, i: number): number =>
            sum + value * t[i]!,
          0,
        );
        const projected: [number, number, number] = parent.frame.u.map(
          (value: number, i: number): number => value - dot * t[i]!,
        ) as [number, number, number];
        const length: number = Math.hypot(...projected);
        if (!(length > 0 && Number.isFinite(length)))
          throw new Error(`Ear source ${name} has no projected fork normal`);
        const u: [number, number, number] = projected.map(
          (value: number): number => value / length,
        ) as [number, number, number];
        const v: [number, number, number] = [
          u[1] * t[2] - u[2] * t[1],
          u[2] * t[0] - u[0] * t[2],
          u[0] * t[1] - u[1] * t[0],
        ];
        return {
          origin: readings.map(
            (read: AutoMovieViewOutline.IReading): number => read.value,
          ) as [number, number, number],
          u,
          v,
        };
      },
    };
    return { coordinates, axis };
  }
}
