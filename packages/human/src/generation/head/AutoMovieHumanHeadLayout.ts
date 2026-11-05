import { AutoMovieHumanHeadLandmarks } from "../AutoMovieHumanHeadLandmarks";
import { AutoMovieHumanHeadVault } from "../AutoMovieHumanHeadVault";
import type { IAutoMovieHumanHeadCompiled } from "../IAutoMovieHumanHeadCompiled";
import type { IAutoMovieHumanHeadInputs } from "../IAutoMovieHumanHeadInputs";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import type { AutoMovieHumanNeckSource } from "../AutoMovieHumanNeckSource";

/**
 * The head lane's anatomical layout from a pure neck generating record.
 * Harmonic means, the adopted posterior C7 point and the endpoint dx/dy
 * are already explicit in that record; this consumer constructs neither
 * a neck chain nor the retired head surface, jaw or ear assembly.
 *
 * @evidence contracts/common.md#principled-implementation Reads the shared generating neck frame and body calibration scale, places the landmark plan and solves its existing cranial exponent.
 * @evidence contracts/common.md#clear-and-simple-design Owns layout alone; no old radial head skin, ear chains or eye-seat assembly is built.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The same source record serves every parameter set without a mesh read, ray or source-parameter fit.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes original frame data, body units and the unfinished anatomical tape laws.
 * @evidence contracts/performance.md#efficient-algorithms Only the existing fixed-size landmark/profile and vault solvers run here; no periodic neck chain or unused head surface is built.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned plan is shared by every part and attachment of one lane; no cross-input cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned plan owns scalar landmarks/profiles and borrows the source's scalar neck frame; no neck chain is retained.
 */
export namespace AutoMovieHumanHeadLayout {
  /**
   * Place the head without constructing a second skin.
   *
   * @param source The same pure generating record shared by the body, with an analytic mean, posterior point and endpoint secant, calibration mm.
   * @param inputs Head dimensions and stature in world mm.
   * @returns The lane's layout in calibration mm.
   *
   * @evidence contracts/common.md#principled-implementation The source closes the posterior C7 point separately from its mean. Body input units, stature and head height place the plan independently of an emitted neck chain.
   * @evidence contracts/common.md#clear-and-simple-design Reads only the neck quantities the head mass's views consume, leaving skin construction to the head tree.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads original generating frame data rather than emitted triangles, sampled polygon crossings or a second interpolation; there is no person branch.
   * @evidence contracts/common.md#meaningful-documentation States inputs, calibration scale and which anatomical quantities each curve reading supplies.
   * @evidence contracts/performance.md#efficient-algorithms Consumes one already resolved record before the existing bounded profile/vault solve; no speedup is claimed without measurement.
   * @evidence contracts/performance.md#reuse-equivalent-work The same posterior point serves scale and nape placement, the mean centres the neck, and one plan serves the lane's parts and attachments.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Local coefficient arrays and compiled splines are released with the call; the returned plan retains only its own landmark and profile data.
   */
  export function create(source: AutoMovieHumanNeckSource.IOutput, inputs: IAutoMovieHumanHeadInputs): IAutoMovieHumanHeadLayout {
    const compiled: IAutoMovieHumanHeadCompiled = AutoMovieHumanHeadLandmarks.compile();
    const plan: IAutoMovieHumanHeadLayout = AutoMovieHumanHeadLandmarks.layout(compiled, inputs, source.head, source.scale, AutoMovieHumanHeadLandmarks.NONE);
    plan.neck = { ...plan.neck, base: {
      girth: inputs.neckBase.girth * source.scale,
      cervicaleHeight: inputs.neckBase.cervicaleHeight * source.scale,
      sideNeckPointHeight: inputs.neckBase.sideNeckPointHeight * source.scale,
      suprasternaleHeight: inputs.neckBase.suprasternaleHeight * source.scale,
    } };
    plan.vault = AutoMovieHumanHeadVault.closing(plan);
    return plan;
  }

  /**
   * World height of the adopted posterior C7 point, mm. NeckConstruction
   * closes its generating ring's mean from this named-point constraint.
   *
   * @evidence contracts/common.md#principled-implementation Reads the public resolved cervicale height directly, instead of cancelling a derived neck-course ratio and then mistaking that value for a ring mean.
   * @evidence contracts/common.md#clear-and-simple-design One seat definition serves generation and standalone debug consumers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither a person branch nor a mean-height clamp changes the named landmark.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes the world named-point height from a nonplanar ring's mean.
   * @evidence contracts/performance.md#efficient-algorithms One scalar read without a chain or prior solve.
   * @evidence contracts/performance.md#reuse-equivalent-work No repeated solve or generated body is needed.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one number and retains nothing.
   */
  export function seat(inputs: IAutoMovieHumanHeadInputs): number {
    return inputs.neckBase.cervicaleHeight;
  }

}
