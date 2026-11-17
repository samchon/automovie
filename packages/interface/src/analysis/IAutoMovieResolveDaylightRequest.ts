import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieEnvironmentInstant } from "./IAutoMovieEnvironmentInstant";

/**
 * Data and callback contracts shared by the ResolveDaylightRequest operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Refuse a daylight request no honest study can be made from, and resolve the instant and the workplane frame it names. Member documentation states the supplied records, units and absence meanings used by resolveAutoMovieDaylightRequest.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The nullable instant preserves absence and the canonical vector type does not itself prove normalization; the resolver validates the request and constructs this frame.
 * @evidence contracts/development/design.md#principled-representation instant explicitly permits null for an artificial-light-only study, while normal, axisU and axisV are normalized workplane directions produced by resolveAutoMovieDaylightRequest.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieResolveDaylightRequest, used by resolveAutoMovieDaylightRequest. Its IResult members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieResolveDaylightRequest {
  /**
   * Refuse a daylight request no honest study can be made from, and resolve the
   * instant and the workplane frame it names.
   *
   * Authoring mistakes throw rather than becoming an `unsupported` run: an
   * unsupported run is a true statement about the host's capability, and using it
   * for a degenerate grid would turn a bug report into a capability claim. The
   * refused inputs are those {@link IAutoMovieDaylightRequest} lists, checked in
   * field order, and the first one throws an `Error` naming it.
   *
   * The returned axes are the normalized workplane axes, and the normal is their
   * normalized right-handed cross product, the face the study measures. The
   * instant is the context's own record, or `null` when the request names none.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Refuse a daylight request no honest study can be made from, and resolve the instant and the workplane frame it names. Member documentation states the supplied records, units and absence meanings used by resolveAutoMovieDaylightRequest.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The nullable instant preserves absence and the canonical vector type does not itself prove normalization; the resolver validates the request and constructs this frame.
   * @evidence contracts/development/design.md#principled-representation instant explicitly permits null for an artificial-light-only study, while normal, axisU and axisV are normalized workplane directions produced by resolveAutoMovieDaylightRequest.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieResolveDaylightRequest.IResult, used by resolveAutoMovieDaylightRequest. Its instant, normal, axisU, axisV members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IResult = {
    /** Instant the study reads, or `null` for an artificial-light-only study. */
    instant: IAutoMovieEnvironmentInstant | null;

    /** Unit normal of the measured face. */
    normal: IAutoMovieVector3;

    /** Unit direction of the workplane's first axis. */
    axisU: IAutoMovieVector3;

    /** Unit direction of the workplane's second axis. */
    axisV: IAutoMovieVector3;
  };
}
