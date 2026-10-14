import { HumanExactFraction as Fraction } from "../../../common/measure/HumanExactFraction";
import type { IHumanExactFraction as IHumanExactFractionImported } from "../../../common/measure/IHumanExactFraction";
import type { IHumanFaceProjectedSkinCourse } from "./IHumanFaceProjectedSkinCourse";
import type { IHumanFaceProjectedSkinCourseInput } from "./IHumanFaceProjectedSkinCourseInput";
import type { IHumanFaceProjectedSkinCourseReading as IHumanFaceProjectedSkinCourseReadingImported } from "./IHumanFaceProjectedSkinCourseReading";
import type { IHumanFaceProjectedSkinSpan } from "./IHumanFaceProjectedSkinSpan";
import type { IHumanFaceSkinProjectionFeature } from "./IHumanFaceSkinProjectionFeature";
import type { IHumanFaceSkinProjectionFeatures } from "./IHumanFaceSkinProjectionFeatures";
import type { IHumanFaceSkinProjectionInterval } from "./IHumanFaceSkinProjectionInterval";
import { createHumanFaceSkinProjectionEnvelope } from "./createHumanFaceSkinProjectionEnvelope";
import { createHumanFaceSkinProjectionFeatures } from "./createHumanFaceSkinProjectionFeatures";
import { readHumanFaceProjectedSkinCourse } from "./readHumanFaceProjectedSkinCourse";

/**
 * Compile a free guide's continuous nearest projection onto the immutable
 * native skin triangles. On each native vertex, edge or face its projection
 * is exact rational affine and its squared distance quadratic. One native
 * geometry supplies membership, projection and distance comparison; final
 * head-frame positions round once after the affine evaluation. The finite lower envelope
 * selects the nearest feature without a sampling step or a relief width.
 * CGAL's 2D Envelopes defines this pointwise-minimum arrangement; this owner
 * specializes it to closed triangle-feature distance domains.
 *
 * A nearest projection can jump between separate sheets. Such a guide
 * refuses rather than adding an unsupported chord through air. Adjacent
 * pieces must share an actual native corner (exact-coordinate seam aliases
 * count as one) and meet within their floating construction's roundoff.
 * That bound covers arithmetic only; it never supplies anatomical reach.
 * Equal-distance feature intervals retain deterministic native order.
 *
 * This changes the previous width-sensitive sampled representation. Relief
 * fields, contact references, normals and source derivatives that consumed
 * it require regeneration and observation; bitwise equivalence is not claimed.
 * No source vertex, topology, numerical trait or anatomical range is changed.
 *
 * @evidence contracts/common.md#principled-implementation Per-guide-chord exact affine native candidates and their quadratic lower envelope determine nearest spans; actual shared corner identity plus a 128-epsilon arithmetic bound admits continuity, while unrelated or discontinuous sheets refuse.
 * @evidence contracts/common.md#clear-and-simple-design Candidate construction and envelope merging have their own owners; this compiler owns finite input admission, native continuity, metre lengths and the returned distance reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Width and anatomical tolerances do not enter nearest selection. Coordinate-identical native aliases and a scale-relative roundoff check support represented continuity, not clinical reach or a repaired chord through air.
 * @evidence contracts/common.md#meaningful-documentation The prose states rational versus displayed precision, native ordering, continuity/refusal, unchanged source topology and derivative regeneration; the detailed refusal preserves physical units and feature inputs.
 * @evidence contracts/performance.md#efficient-algorithms For G guide chords, each feature producer scans V vertices/T triangles, then the envelope merges retained features with exact pair comparisons; emitted S spans are measured once and later reads scan S. Work depends on native feature/interval populations and rational bit sizes, not relief width.
 * @evidence contracts/performance.md#reuse-equivalent-work Each chord shares its normalized context and guide-local pair cache; spans retain compiled endpoints/lengths for repeated reads. Different geometry or guides require rebuilding rather than reusing by equal width or total length.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Candidate and pair populations are chord-local and discarded after merge/refusal; the returned course retains O(S) endpoint/metric records for its caller, without source mutation, external handles or global cache.
 *
 * @author Samchon
 */
export function compileHumanFaceProjectedSkinCourse(
  input: IHumanFaceProjectedSkinCourseInput,
): IHumanFaceProjectedSkinCourse {
  const count: number = input.positions.length / 3;
  if (
    !Number.isInteger(count) ||
    input.indices.length % 3 !== 0 ||
    input.indices.length === 0 ||
    input.positions.some((value: number): boolean => !Number.isFinite(value)) ||
    input.indices.some(
      (id: number): boolean => !Number.isInteger(id) || id < 0 || id >= count,
    ) ||
    input.guide.length < 2 ||
    input.guide.some(
      (point: readonly number[]): boolean =>
        point.length !== 3 ||
        point.some((value: number): boolean => !Number.isFinite(value)),
    )
  )
    throw new Error(
      "Skin course needs finite native triangles and an ordered finite guide.",
    );
  const aliases: (id: number) => string = (id: number): string =>
    input.positions.slice(3 * id, 3 * id + 3).join(",");
  const spans: IHumanFaceProjectedSkinSpan[] = [];
  let totalLengthMetres: number = 0,
    previousFeature: IHumanFaceSkinProjectionFeature | undefined;
  let previousInterval: IHumanFaceSkinProjectionInterval | undefined;
  let previousContext: IHumanFaceSkinProjectionFeatures | undefined;
  let previousSegment: number | undefined;
  for (let segment: number = 0; segment + 1 < input.guide.length; segment++) {
    const features: IHumanFaceSkinProjectionFeatures =
      createHumanFaceSkinProjectionFeatures(input, segment);
    const envelope: IHumanFaceSkinProjectionInterval[] =
      createHumanFaceSkinProjectionEnvelope(features);
    for (const interval of envelope) {
      const feature: IHumanFaceSkinProjectionFeature = interval.feature;
      const at: (parameter: number) => number[] = (
        parameter: number,
      ): number[] =>
        feature.origin.map(
          (value: IHumanExactFractionImported, axis: number): number =>
            Fraction.number(
              Fraction.add(
                Fraction.from(features.origin[axis]),
                Fraction.multiply(
                  Fraction.from(features.scale),
                  Fraction.add(
                    value,
                    Fraction.multiply(
                      Fraction.from(parameter),
                      feature.velocity[axis],
                    ),
                  ),
                ),
              ),
            ),
        );
      const start: number[] = at(interval.lower),
        end: number[] = at(interval.upper);
      if (![...start, ...end].every(Number.isFinite))
        throw new Error("Skin course projection is unrepresentable.");
      const previous: IHumanFaceProjectedSkinSpan | undefined = spans.at(-1);
      if (previous !== undefined && previousFeature !== undefined) {
        const common: Set<string> = new Set(
          previousFeature.vertices.map(aliases),
        );
        if (
          !feature.vertices.some((id: number): boolean =>
            common.has(aliases(id)),
          )
        )
          throw new Error(
            "Skin guide nearest projection jumps between native sheets.",
          );
        const separation: number = Math.hypot(
          ...start.map(
            (value: number, axis: number): number => value - previous.end[axis],
          ),
        );
        const arithmeticScale: number = Math.max(
          features.scale,
          ...start.map(Math.abs),
          ...previous.end.map(Math.abs),
        );
        const threshold: number = 128 * Number.EPSILON * arithmeticScale;
        if (separation > threshold)
          throw new Error(
            "Skin guide nearest projection has no continuous native-feature transition. " +
              JSON.stringify(
                {
                  units: {
                    positions: "head-frame metres",
                    local: "normalized coordinates",
                    interval: "dimensionless guide parameter",
                  },
                  segment,
                  current: {
                    kind: ["vertex", "edge", "face"][
                      feature.vertices.length - 1
                    ],
                    vertices: feature.vertices,
                    nativePositions: feature.vertices.map(
                      (id: number): number[] =>
                        input.positions.slice(3 * id, 3 * id + 3),
                    ),
                    validity: [feature.lower, feature.upper],
                    interval: [interval.lower, interval.upper],
                    affineOrigin: feature.origin,
                    affineVelocity: feature.velocity,
                    normalizationOrigin: features.origin,
                    normalizationScale: features.scale,
                    freeDirection: features.direction,
                    start,
                    end,
                    guide: [input.guide[segment], input.guide[segment + 1]],
                  },
                  previous: {
                    segment: previousSegment,
                    kind: ["vertex", "edge", "face"][
                      previousFeature.vertices.length - 1
                    ],
                    vertices: previousFeature.vertices,
                    nativePositions: previousFeature.vertices.map(
                      (id: number): number[] =>
                        input.positions.slice(3 * id, 3 * id + 3),
                    ),
                    validity: [previousFeature.lower, previousFeature.upper],
                    interval: [
                      previousInterval?.lower,
                      previousInterval?.upper,
                    ],
                    affineOrigin: previousFeature.origin,
                    affineVelocity: previousFeature.velocity,
                    normalizationOrigin: previousContext?.origin,
                    normalizationScale: previousContext?.scale,
                    freeDirection: previousContext?.direction,
                    end: previous.end,
                    guide:
                      previousSegment === undefined
                        ? undefined
                        : [
                            input.guide[previousSegment],
                            input.guide[previousSegment + 1],
                          ],
                  },
                  sharedNativeCornerGuardPassed: true,
                  separationMetres: separation,
                  arithmeticScaleMetres: arithmeticScale,
                  thresholdMetres: threshold,
                  multiplier: 128,
                  binary64Epsilon: Number.EPSILON,
                },
                (_key: string, value: unknown): unknown =>
                  typeof value === "bigint" ? value.toString() : value,
              ),
          );
      }
      const lengthMetres: number = Math.hypot(
        ...end.map(
          (value: number, axis: number): number => value - start[axis],
        ),
      );
      if (
        !Number.isFinite(lengthMetres) ||
        !Number.isFinite(totalLengthMetres + lengthMetres)
      )
        throw new Error("Skin course arc length is unrepresentable.");
      spans.push({
        start,
        end,
        lengthMetres,
        precedingLengthMetres: totalLengthMetres,
      });
      totalLengthMetres += lengthMetres;
      previousFeature = feature;
      previousInterval = interval;
      previousContext = features;
      previousSegment = segment;
    }
  }
  return {
    spans,
    totalLengthMetres,
    read: (
      point: readonly number[],
    ): IHumanFaceProjectedSkinCourseReadingImported =>
      readHumanFaceProjectedSkinCourse(spans, totalLengthMetres, point),
  };
}
