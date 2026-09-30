import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";

/**
 * Evaluate an admitted diagonal Gaussian envelope at a neutral metre-space
 * point. Root rejection sampling uses this as relative area density; parting
 * uses it as a direction-field weight. Neither use changes the neutral point.
 * The exponent is the squared Mahalanobis distance for independent axes, with
 * peak one at the centre. An absent envelope is uniform. Very remote points
 * may underflow to zero; sampling owns its explicit exhaustion refusal.
 *
 * @evidence contracts/common.md#principled-implementation The diagonal
 *   Gaussian exp(-0.5 * sum(((x - c) / s)^2)) is the unnormalized density of
 *   independent axes, so it is one at the centre and falls monotonically with
 *   the squared Mahalanobis distance. It needs positive spreads, which
 *   assertHumanFaceHair admits, and a remote point may underflow to zero, which
 *   the sampler answers with its own exhaustion refusal.
 * @evidence contracts/common.md#clear-and-simple-design One formula shared by
 *   root sampling and parting, so the two readings cannot disagree; an absent
 *   region is the uniform value one.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special
 *   case for a style or subject; the value depends only on the point and the
 *   region.
 * @evidence contracts/common.md#meaningful-documentation The comment states
 *   the formula, its peak, the uniform meaning of an absent region and the
 *   underflow behaviour.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The
 *   function computes a value and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function
 *   defines no channel and reads the hairstyle document's fields without varying
 *   a form; the document type owns their meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits
 *   no primitive.
 * @evidence contracts/modeling.md#spatial-conventions The point and the
 *   region's centre and spread are metres in the neutral head frame, and the
 *   result is dimensionless. Nothing is converted.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds
 *   no surface and joins no neighbouring part.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function
 *   owns no part, group or joint and displays nothing; the builder that owns the
 *   assembled hair is where the result is observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The envelope is a
 *   styling preference and, as the document's own comment says, not a biological
 *   density estimate.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits,
 *   bounds or combines no anatomical quantity; assertHumanFaceHair owns
 *   admission of the hairstyle document.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input
 *   shapes a human form through this function; it reads quantities the hairstyle
 *   document already names and admits.
 */
export function humanFaceHairEnvelope(
  point: IAutoMovieVector3,
  region: IAutoMovieHumanFaceHair.Region | undefined,
): number {
  return region === undefined
    ? 1
    : Math.exp(
        -0.5 *
          [point.x, point.y, point.z].reduce(
            (sum, value, axis) =>
              sum + ((value - region.center[axis]) / region.spread[axis]) ** 2,
            0,
          ),
      );
}
