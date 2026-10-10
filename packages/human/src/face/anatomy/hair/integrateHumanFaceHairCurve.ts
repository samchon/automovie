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
