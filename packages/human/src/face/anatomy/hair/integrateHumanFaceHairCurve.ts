import { Vector3 } from "@automovie/engine";

import { HumanFaceHairRootRefusalError } from "./HumanFaceHairRootRefusalError";
import { HumanFaceHairStemRefusalError } from "./HumanFaceHairStemRefusalError";
import type { IAutoMovieHumanFaceHairCurve } from "./IAutoMovieHumanFaceHairCurve";
import type { IHumanFaceHairIntegration } from "./IHumanFaceHairIntegration";
import type { IHumanFaceHairMetric } from "./IHumanFaceHairMetric";
import { humanFaceHairContact } from "./humanFaceHairContact";
import { humanFaceHairEmergenceRange } from "./humanFaceHairEmergenceRange";
import { humanFaceHairLength } from "./humanFaceHairLength";
import { walkHumanFaceHairCurve } from "./walkHumanFaceHairCurve";

/**
 * Integrate one metric lock at its authored elevation, or the legacy scalp
 * placement interval when that scalar is absent. An authored target is walked
 * once and its refusal propagates without borrowing scalp clinical angles.
 *
 * Without an authored elevation, the lock is first walked at the scalp range's
 * lower end, the existing emergence convention.
 * Where that walk is admitted the result is exactly the convention's, so a
 * feasible root is unchanged. Only a stem refusal (HumanFaceHairStemRefusalError)
 * means the convention's exit cannot clear the skin under the construction
 * curvature: the lock is then walked at the range top (Shapiro & Shapiro 2013
 * range top). If that also refuses, the root refuses by name with every
 * elevation tried. Otherwise the smallest admitted elevation is found by
 * bisecting the interval until its midpoint is no longer representable, each
 * trial being a complete walk; the result keeps the exit closest to the
 * convention among the elevations the bracket visited. Admission need not be
 * monotone in elevation, so this is the bracket's admitted end, not a global
 * minimum claim. The azimuth stays the authored field's throughout.
 *
 * Any other error from a walk propagates unchanged. Every trial walk spends the
 * shared lock budget, and each builds its own gathering stage; the contact's
 * memory only reuses deterministic answers. The walk itself is
 * walkHumanFaceHairCurve; regional guide length and post-clump strand
 * metric/contact retain their existing owners.
 *
 * @evidence contracts/common.md#principled-implementation An authored elevation is walked unchanged; omission preserves the convention and search inside the cited scalp interval using the walk's own admission.
 * @evidence contracts/common.md#clear-and-simple-design Owns the elevation choice only; the walk, the stem step and the emergence direction keep their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No azimuth change, subject case or alteration of an authored target; the legacy scalp search stays inside its cited interval and failed endpoints make no global impossibility claim.
 * @evidence contracts/common.md#meaningful-documentation States the order of trials, the search, its non-monotone limit and what propagates.
 * @evidence contracts/modeling.md#spatial-conventions Elevations are degrees above the tangent plane; lengths are head-frame metres.
 * @evidenceExclude contracts/modeling.md#parameter-channels Reads the authored layer without defining a channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidence contracts/modeling.md#emitted-geometry Returns the admitted walk's curve unchanged.
 * @evidence contracts/modeling.md#shared-boundaries Every admitted elevation's stem is exterior-certified on the one host collider by the walk.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The range owner states the cited angles.
 * @evidence contracts/anatomy.md#permitted-range The legacy scalp search stays inside its cited interval; explicit elevations retain their admitted geometric authoring meaning without borrowing a scalp clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a human form through this function; it reads quantities the hairstyle document already names and admits.
 */
export function integrateHumanFaceHairCurve(
  props: IHumanFaceHairIntegration,
): IAutoMovieHumanFaceHairCurve {
  const { layer } = props;
  const length =
    props.metric?.length ??
    humanFaceHairLength(layer, props.origin, props.reference, props.sequence);
  const metric: IHumanFaceHairMetric = {
    length,
    contact:
      props.metric?.contact ??
      humanFaceHairContact({
        layer,
        root: props.root,
        length,
        query: props.query,
      }),
  };
  if (layer.emergenceAngleDegrees !== undefined)
    return walkHumanFaceHairCurve(props, metric, layer.emergenceAngleDegrees);
  const range = humanFaceHairEmergenceRange(
    layer.hairline,
    Vector3.subtract(props.reference, props.origin),
  );
  const tried: number[] = [];
  const attempt = (
    degrees: number,
  ): IAutoMovieHumanFaceHairCurve | HumanFaceHairStemRefusalError => {
    tried.push(degrees);
    try {
      return walkHumanFaceHairCurve(props, metric, degrees);
    } catch (error) {
      if (error instanceof HumanFaceHairStemRefusalError) return error;
      throw error;
    }
  };
  const convention = attempt(range.lowest);
  if (!(convention instanceof HumanFaceHairStemRefusalError)) return convention;
  const steepest = attempt(range.highest);
  if (steepest instanceof HumanFaceHairStemRefusalError)
    throw new HumanFaceHairRootRefusalError(
      "A hair root at (" +
        [props.root.x, props.root.y, props.root.z]
          .map((v) => v.toFixed(4))
          .join(", ") +
        ") m did not clear the skin at the attempted cited exit elevations (" +
        tried.map((v) => v.toFixed(2)).join(", ") +
        " degrees): " +
        steepest.message,
      {
        lowest: range.lowest,
        highest: range.highest,
        tried,
        stem: steepest.detail,
      },
    );
  let low = range.lowest,
    high = range.highest,
    admitted = steepest;
  while (true) {
    const middle = low / 2 + high / 2;
    if (middle === low || middle === high) break;
    const result = attempt(middle);
    if (result instanceof HumanFaceHairStemRefusalError) low = middle;
    else {
      high = middle;
      admitted = result;
    }
  }
  return admitted;
}
