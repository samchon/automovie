import { HumanExactFraction as Fraction } from "../../../common/measure/HumanExactFraction";
import type { IHumanFaceProjectedSkinCourse } from "./IHumanFaceProjectedSkinCourse";
import type { IHumanFaceProjectedSkinCourseInput } from "./IHumanFaceProjectedSkinCourseInput";
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
 * @evidence contracts/common.md#principled-implementation A triangle's closed feature domains cover every closest point; the finite quadratic lower envelope gives its piecewise affine nearest projection.
 * @evidence contracts/common.md#clear-and-simple-design Feature construction, certified comparisons, envelope selection and arc reading each have one owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No width-driven subdivisions, arbitrary minimum width, iteration cap, geodesic substitution or inter-sheet bridge enters.
 * @evidence contracts/common.md#meaningful-documentation States the represented geometry, tie policy, discontinuity refusal and derivative invalidation.
 * @evidence contracts/modeling.md#spatial-conventions All public positions and lengths remain head-frame metres; internal origin/scale changes only numerical units.
 * @evidence contracts/modeling.md#shared-boundaries Each affine span belongs to an actual native feature, and feature transitions require shared native support and arithmetic continuity.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Compiles a curve on an existing part and creates no new part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Consumes the existing caller-owned guide without adding an authoring control.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no render primitive or new source vertex.
 * @evidenceExclude contracts/modeling.md#rendered-observation The relief callers own the assembled skin observations.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Transports registered guide geometry without assigning physiological quantities.
 * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical admission remains with the relief callers and source registrations.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal sculpting input; guides are internal caller-owned source constructions.
 * @author Samchon
 */
export function compileHumanFaceProjectedSkinCourse(
  input: IHumanFaceProjectedSkinCourseInput,
): IHumanFaceProjectedSkinCourse {
  const count = input.positions.length / 3;
  if (
    !Number.isInteger(count) ||
    input.indices.length % 3 !== 0 ||
    input.indices.length === 0 ||
    input.positions.some((value) => !Number.isFinite(value)) ||
    input.indices.some(
      (id) => !Number.isInteger(id) || id < 0 || id >= count,
    ) ||
    input.guide.length < 2 ||
    input.guide.some(
      (point) =>
        point.length !== 3 || point.some((value) => !Number.isFinite(value)),
    )
  )
    throw new Error(
      "Skin course needs finite native triangles and an ordered finite guide.",
    );
  const aliases = (id: number): string =>
    input.positions.slice(3 * id, 3 * id + 3).join(",");
  const spans: IHumanFaceProjectedSkinSpan[] = [];
  let totalLengthMetres = 0,
    previousFeature: IHumanFaceSkinProjectionFeature | undefined;
  let previousInterval: IHumanFaceSkinProjectionInterval | undefined;
  let previousContext: IHumanFaceSkinProjectionFeatures | undefined;
  let previousSegment: number | undefined;
  for (let segment = 0; segment + 1 < input.guide.length; segment++) {
    const features = createHumanFaceSkinProjectionFeatures(input, segment);
    const envelope = createHumanFaceSkinProjectionEnvelope(features);
    for (const interval of envelope) {
      const feature = interval.feature;
      const at = (parameter: number): number[] =>
        feature.origin.map((value, axis) =>
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
      const start = at(interval.lower),
        end = at(interval.upper);
      if (![...start, ...end].every(Number.isFinite))
        throw new Error("Skin course projection is unrepresentable.");
      const previous = spans.at(-1);
      if (previous !== undefined && previousFeature !== undefined) {
        const common = new Set(previousFeature.vertices.map(aliases));
        if (!feature.vertices.some((id) => common.has(aliases(id))))
          throw new Error(
            "Skin guide nearest projection jumps between native sheets.",
          );
        const separation = Math.hypot(
          ...start.map((value, axis) => value - previous.end[axis]),
        );
        const arithmeticScale = Math.max(
          features.scale,
          ...start.map(Math.abs),
          ...previous.end.map(Math.abs),
        );
        const threshold = 128 * Number.EPSILON * arithmeticScale;
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
                    nativePositions: feature.vertices.map((id) =>
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
                    nativePositions: previousFeature.vertices.map((id) =>
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
                (_key, value: unknown) =>
                  typeof value === "bigint" ? value.toString() : value,
              ),
          );
      }
      const lengthMetres = Math.hypot(
        ...end.map((value, axis) => value - start[axis]),
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
    read: (point) =>
      readHumanFaceProjectedSkinCourse(spans, totalLengthMetres, point),
  };
}
