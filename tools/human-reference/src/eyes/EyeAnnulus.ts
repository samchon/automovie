import type { V3 } from "../geometry/V3.ts";
import type { FeatureLoop } from "../schema/FeatureLoop.ts";
import type { EyeRadial } from "./EyeRadial.ts";

/**
 * Shares radial reference paths, physical row intersections and one exterior collar.
 * Ring chords and source-polyline tangents do not establish a continuous skin.
 * Probe rings are derived from the same input paths and are not independent validation.
 *
 * @evidence contracts/common.md#principled-implementation Exposes one section family in its measured frame with explicit physical stations and missing angular coverage.
 * @evidence contracts/common.md#clear-and-simple-design Aperture, row observations and the collar refer to the same radial paths; probes retain their dependency meaning.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains raw observations only; no source topology or fitted control buffer is presented as an anatomical generator.
 * @evidence contracts/common.md#meaningful-documentation States construction, probe independence and derivative limits alongside the observations.
 * @evidence contracts/performance.md#efficient-algorithms This interface performs no computation; storage follows path and requested row counts.
 * @evidence contracts/performance.md#reuse-equivalent-work Keeps source paths reusable across physical row observations and independent consumer fitting.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns all arrays; no retained process or GPU resource is represented.
 *
 * @author Samchon
 */
export interface EyeAnnulus {
  /** Subject-relative side in the admitted reference frame. */
  side: "l" | "r";

  /** Aperture-centred native frame with unit directions and origin in millimetres. */
  frame: FeatureLoop["frame"];

  /** Angle convention shared by all radials and row observations. */
  phase: string;

  /** Definition of the physical distance parameter used along each source section. */
  radialCoordinate: string;

  /** Declared distance-field contour; its clinical fissure correspondence is unresolved. */
  aperture: { protocol: string; points: V3[] };

  /** Ordered source sections consumed by the annular fitting stage. */
  radials: EyeRadial[];

  /** Physical row observations; missing phases prohibit an inferred closed collar. */
  rings: {
    /** Section arclength from the observed aperture crossing, millimetres. */
    arcMm: number;

    /** Ordered observed positions and one-sided tangents, absent when outside the path. */
    observations: {
      phaseDeg: number;
      sourceSection: string;
      p?: V3;
      tangentIncoming?: V3;
      tangentOutgoing?: V3;
    }[];

    /** Angular stations whose source paths do not reach this physical row. */
    missingPhases: number[];
  }[];

  /** Additional samples derived from the same source paths; no independence claim. */
  interpolatedProbeRings: EyeAnnulus["rings"];

  /** Conventional physical row chosen jointly with the neighboring head chart, millimetres. */
  outerCollarArcMm: number;

  /** States source-polyline versus fitted analytic derivative ownership. */
  derivativePolicy: string;

  /** Unobserved nominal 7.5-degree stations, retaining gaps rather than invented sections. */
  missingPhaseDeg: number[];
}
