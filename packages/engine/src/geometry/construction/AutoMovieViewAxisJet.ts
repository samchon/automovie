import type { AutoMovieVector3Tuple, IAutoMovieConstructionOutlineParameter, IAutoMovieLoftFrame, IAutoMovieViewAxisJet } from "@automovie/interface";
import { AutoMovieViewParameter } from "./AutoMovieViewParameter";

/**
 * Analytic derivatives of an axis's own frame in station or a selected coordinate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States derivative units, actual-source ownership and singular absence at the axis API.
 * @evidence contracts/development/design.md#principled-representation Represents Analytic derivatives of an axis's own frame in station or a selected coordinate: companion namespace of 3 members (`IJet`, `fixed`, `parameter`); units and frames named in its text: frame, second, world. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieViewAxisJet` in packages/engine/src/geometry/construction/AutoMovieViewAxisJet.ts; its surface is the 3 members listed and the text shows 7 other files naming it, mostly packages/engine (6), packages/human (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieViewAxisJet {

  /**
   * Jet of fixed chart directions and an analytically differentiated moving origin.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Fixed directions have zero derivatives; the supplied origin derivatives belong to the same source value.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One constructor shares the constant-basis rule among straight, level and parallel axes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not estimate origin derivatives or fabricate them at a singular source station.
   * @evidence contracts/development/common.md#meaningful-documentation Arguments are the source frame and its origin's two derivatives in the query coordinate.
   * @evidence contracts/development/implementation.md#efficient-algorithms Copies two triples and allocates four zero triples in constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This pure constructor has no shared preparation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The result borrows the supplied value frame and owns all derivative triples; it retains no other source data.
   */
  export function fixed(
    value: IAutoMovieLoftFrame.IFrame,
    first: AutoMovieVector3Tuple,
    second: AutoMovieVector3Tuple,
  ): IAutoMovieViewAxisJet.IJet {
    return {
      value,
      first: { origin: [...first], u: [0, 0, 0], v: [0, 0, 0] },
      second: { origin: [...second], u: [0, 0, 0], v: [0, 0, 0] },
    };
  }

  /**
   * Carry a regular station-frame jet into an explicitly selected root/angle coordinate.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Applies Fq=Fs*sq and Fqq=Fss*sq^2+Fs*sqq to the actual source frame; no inversion of a singular forward jet is needed.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One shared vector conversion serves straight, level and jointed analytic owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Default station queries return the original jet unchanged; invalid or unrepresentable parameter results return null without clamping.
   * @evidence contracts/development/common.md#meaningful-documentation The selected parameter endpoints use kernel mm; value remains the same source plane and derivative units become per selected coordinate.
   * @evidence contracts/development/implementation.md#efficient-algorithms One inverse scalar jet and fixed 27-component arithmetic take constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All frame components share the same inverse-parameter pair.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the input for identity or new derivative vectors for a selected map; no global state retains either.
   */
  export function parameter(
    jet: IAutoMovieViewAxisJet.IJet,
    coordinate: IAutoMovieConstructionOutlineParameter | undefined,
    station: number,
  ): IAutoMovieViewAxisJet.IJet | null {
    if (coordinate === undefined) return jet;
    const inverse: [number, number] | null = AutoMovieViewParameter.inverseJet(
      coordinate,
      station,
    );
    if (inverse === null) return null;
    const first: IAutoMovieLoftFrame.IFrame = {
      origin: [0, 0, 0],
      u: [0, 0, 0],
      v: [0, 0, 0],
    };
    const second: IAutoMovieLoftFrame.IFrame = {
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
