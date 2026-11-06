import {
  AutoMovieViewCurves,
  AutoMovieViewOutline,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import type { AutoMovieHumanSiteViewPart } from "../../../../packages/human/src/generation/limb/AutoMovieHumanSiteViewPart";

/**
 * Report the most medial counterexample of each already generated production leg in its actual world placement. Named, scalar-critical and regular readings are observations rather than a continuous moving-frame proof.
 *
 * @evidence contracts/common.md#principled-implementation Retains the original assertion bodies and public-engine observations, with their fixed expectations and limitations. This module changes ownership of test code only.
 * @evidence contracts/common.md#clear-and-simple-design Groups one coherent source-observation responsibility behind one exported namespace; the main test remains the sole generator and execution coordinator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no assertion suppression, tolerance change, fit, source mutation or alternative construction.
 * @evidence contracts/common.md#meaningful-documentation Each observer retains its source/frame scope, assumptions and failure meaning; no final skin or general anatomical result is inferred from these reads.
 * @evidence contracts/performance.md#efficient-algorithms Work remains the sum of the unchanged bounded observer loops and public source preparation; merely moving these loops changes no algorithm or sampling density.
 * @evidence contracts/performance.md#reuse-equivalent-work All functions receive the one existing definition or its actual parts; there is no additional generation or persistent cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The namespace retains only function definitions. Observations are synchronous and call-local; the public test owns the aggregate defects.
 */
export namespace HumanBodyDefinitionLeg {
  /**
   * Read each production leg's four original guides in its actual world frame,
   * retaining the most medial counterexample and its owning scalar/frame.
   * Named and scalar-critical stations plus sixteen subdivisions per source
   * knot interval provide counterexamples only, not a continuous half-space
   * proof. This reads the already generated source and creates no new limb,
   * fit, final surface, rig or renderer; arrays die with this synchronous call.
   *
   * @evidence contracts/common.md#principled-implementation Reads the original production-leg scalar curves in the actual world frame and retains the most medial reading and owner as a counterexample.
   * @evidence contracts/common.md#clear-and-simple-design One internal observer owns this coherent assertion group; the public definition test decides invocation order and owns the aggregate failures.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves the original expected values, numeric tolerances, source queries and failure strings; no fixture selector, fallback shape or fitted compensation is added.
   * @evidence contracts/common.md#meaningful-documentation The retained method description states its actual source, coordinate or frame scope and unresolved final-skin/anatomical limits.
   * @evidence contracts/performance.md#efficient-algorithms For four curves, queries named/critical stations and fifteen subdivisions per knot interval; work follows their actual source knot/root counts.
   * @evidence contracts/performance.md#reuse-equivalent-work Receives already generated source records from the single public test invocation; local engine preparations serve these reads only, with no duplicate Human definition.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary arrays and preparations leave scope synchronously; only the caller-owned defects and logged observations survive. No cache, process, renderer or external handle is acquired.
   */
  export function productionMedian(
    name: string,
    source: AutoMovieHumanSiteViewPart.IResult,
    sign: 1 | -1,
    defects: string[],
  ): void {
    if (source.part === null) return;
    const part: IAutoMovieViewPart = source.part;
    let minimum:
      | { value: number; curve: string; reading: AutoMovieViewCurves.IReading }
      | undefined;
    const prepared: AutoMovieViewCurves.IResult =
      AutoMovieViewCurves.create(part);
    for (const diagnostic of prepared.diagnostics)
      defects.push(
        `${name}: original ${diagnostic.contract}: ${diagnostic.detail}`,
      );
    for (const curve of prepared.curves) {
      if (curve.outline === null) continue;
      const stations: Set<number> = new Set([
        ...curve.outline.knots.map(
          (knot: IAutoMovieViewPart.IKnot): number => knot.station,
        ),
        ...AutoMovieViewOutline.criticalStations(curve.outline),
      ]);
      for (
        let index: number = 0;
        index + 1 < curve.outline.knots.length;
        index++
      ) {
        const start: number = curve.outline.knots[index]!.station;
        const end: number = curve.outline.knots[index + 1]!.station;
        for (let sample: number = 1; sample < 16; sample++)
          stations.add(start + ((end - start) * sample) / 16);
      }
      for (const station of stations) {
        const reading: AutoMovieViewCurves.IReading | string =
          AutoMovieViewCurves.at(curve, part.axis, station);
        if (typeof reading === "string")
          defects.push(
            `${name}/${curve.name}: original median reading failed: ${reading}`,
          );
        else {
          const value: number = sign * reading.point[2];
          if (!Number.isFinite(value))
            defects.push(
              `${name}/${curve.name}: original median coordinate is not finite at ${station} mm`,
            );
          if (minimum === undefined || value < minimum.value)
            minimum = { value, curve: curve.name, reading };
        }
      }
    }
    if (minimum !== undefined && minimum.value < -1e-6)
      defects.push(
        `${name}: production world medial curve crosses the median by ${-minimum.value} mm at ${minimum.reading.scalar.station} mm`,
      );
    console.log(
      JSON.stringify({
        part: name,
        placementScope: "actual-production-trunk",
        originalMedian: minimum,
      }),
    );
  }
}
