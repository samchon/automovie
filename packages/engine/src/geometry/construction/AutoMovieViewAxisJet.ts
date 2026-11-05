import type { AutoMovieConstructionOutlineParameter } from "@automovie/interface";

import type { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import { AutoMovieViewParameter } from "./AutoMovieViewParameter";

/**
 * Analytic derivatives of an axis's own frame in station or a selected coordinate.
 *
 * @evidence contracts/common.md#principled-implementation Keeps the value and two selected-coordinate derivatives of the same origin/u/v map; fixed bases and material rotations use their analytic product rules.
 * @evidence contracts/common.md#clear-and-simple-design One frame-shaped jet serves every supported analytic axis owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A numerical transported frame is not assigned an invented analytic jet here.
 * @evidence contracts/common.md#meaningful-documentation States derivative units, actual-source ownership and singular absence at the axis API.
 * @evidence contracts/performance.md#efficient-algorithms Fixed-size vector arithmetic is independent of layer count.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work These pure value operations coordinate no retained preparation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Every returned record owns fresh derivative vectors and no global state.
 */
export namespace AutoMovieViewAxisJet {
  /**
   * One origin/u/v value and its first two derivatives in the query's selected coordinate, millimetre station by default.
   *
   * @evidence contracts/common.md#principled-implementation Three frame-shaped records distinguish the source value from first and second derivatives in the query coordinate.
   * @evidence contracts/common.md#clear-and-simple-design The frame component layout is shared with existing loft endpoint jets.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Derivative vectors are not normalized and this record certifies no numerical accuracy by itself.
   * @evidence contracts/common.md#meaningful-documentation Origin has mm units and axes are dimensionless; derivatives divide by the selected coordinate's units (mm of station by default).
   * @evidenceExclude contracts/performance.md#efficient-algorithms This result type executes no evaluation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A value record coordinates no computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Its retaining caller owns three fixed-size records.
   */
  export interface IJet {
    /** Actual source frame, with origin in world mm and dimensionless axes. */
    value: AutoMovieLoftFrame.IFrame;

    /** First derivative of each component in the selected coordinate, per mm by default. */
    first: AutoMovieLoftFrame.IFrame;

    /** Second derivative of each component in the selected coordinate, per squared mm by default. */
    second: AutoMovieLoftFrame.IFrame;
  }

  /**
   * Jet of fixed chart directions and an analytically differentiated moving origin.
   *
   * @evidence contracts/common.md#principled-implementation Fixed directions have zero derivatives; the supplied origin derivatives belong to the same source value.
   * @evidence contracts/common.md#clear-and-simple-design One constructor shares the constant-basis rule among straight, level and parallel axes.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not estimate origin derivatives or fabricate them at a singular source station.
   * @evidence contracts/common.md#meaningful-documentation Arguments are the source frame and its origin's two derivatives in the query coordinate.
   * @evidence contracts/performance.md#efficient-algorithms Copies two triples and allocates four zero triples in constant work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure constructor has no shared preparation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The result borrows the supplied value frame and owns all derivative triples; it retains no other source data.
   */
  export function fixed(
    value: AutoMovieLoftFrame.IFrame,
    first: Vec3,
    second: Vec3,
  ): IJet {
    return {
      value,
      first: { origin: [...first], u: [0, 0, 0], v: [0, 0, 0] },
      second: { origin: [...second], u: [0, 0, 0], v: [0, 0, 0] },
    };
  }

  /**
   * Carry a regular station-frame jet into an explicitly selected root/angle coordinate.
   *
   * @evidence contracts/common.md#principled-implementation Applies Fq=Fs*sq and Fqq=Fss*sq^2+Fs*sqq to the actual source frame; no inversion of a singular forward jet is needed.
   * @evidence contracts/common.md#clear-and-simple-design One shared vector conversion serves straight, level and jointed analytic owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Default station queries return the original jet unchanged; invalid or unrepresentable parameter results return null without clamping.
   * @evidence contracts/common.md#meaningful-documentation The selected parameter endpoints use kernel mm; value remains the same source plane and derivative units become per selected coordinate.
   * @evidence contracts/performance.md#efficient-algorithms One inverse scalar jet and fixed 27-component arithmetic take constant work.
   * @evidence contracts/performance.md#reuse-equivalent-work All frame components share the same inverse-parameter pair.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns the input for identity or new derivative vectors for a selected map; no global state retains either.
   */
  export function parameter(
    jet: IJet,
    coordinate: AutoMovieConstructionOutlineParameter | undefined,
    station: number,
  ): IJet | null {
    if (coordinate === undefined) return jet;
    const inverse: [number, number] | null = AutoMovieViewParameter.inverseJet(
      coordinate,
      station,
    );
    if (inverse === null) return null;
    const first: AutoMovieLoftFrame.IFrame = {
      origin: [0, 0, 0],
      u: [0, 0, 0],
      v: [0, 0, 0],
    };
    const second: AutoMovieLoftFrame.IFrame = {
      origin: [0, 0, 0],
      u: [0, 0, 0],
      v: [0, 0, 0],
    };
    for (const key of ["origin", "u", "v"] as const)
      for (let k: number = 0; k < 3; k++) {
        first[key][k] = jet.first[key][k]! * inverse[0];
        second[key][k] =
          jet.second[key][k]! * inverse[0] * inverse[0] +
          jet.first[key][k]! * inverse[1];
      }
    if (
      ![
        ...first.origin,
        ...first.u,
        ...first.v,
        ...second.origin,
        ...second.u,
        ...second.v,
      ].every(Number.isFinite)
    )
      return null;
    return { value: jet.value, first, second };
  }
}

/** A source component triple; derivative units belong to its containing jet. */
type Vec3 = [number, number, number];
