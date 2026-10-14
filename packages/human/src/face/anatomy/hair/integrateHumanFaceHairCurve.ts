import { Vector3 } from "@automovie/engine";

import { HumanFaceHairRootRefusalError } from "./HumanFaceHairRootRefusalError";
import { HumanFaceHairStemRefusalError } from "./HumanFaceHairStemRefusalError";
import type { IAutoMovieHumanFaceHairCurve } from "./IAutoMovieHumanFaceHairCurve";
import type { IHumanFaceHairEmergenceRange as ImportedIHumanFaceHairEmergenceRange } from "./IHumanFaceHairEmergenceRange";
import type { IHumanFaceHairIntegration } from "./IHumanFaceHairIntegration";
import type { IHumanFaceHairMetric } from "./IHumanFaceHairMetric";
import { humanFaceHairContact } from "./humanFaceHairContact";
import { humanFaceHairEmergenceRange } from "./humanFaceHairEmergenceRange";
import { humanFaceHairLength } from "./humanFaceHairLength";
import { walkHumanFaceHairCurve } from "./walkHumanFaceHairCurve";

/**
 * Integrate one metric lock at its authored elevation, or the legacy scalp placement interval when that scalar is absent. An authored target is walked once and its refusal propagates without borrowing scalp clinical angles.
 *
 * Without an authored elevation, the lock is first walked at the scalp range's lower end. An admitted first walk is returned unchanged. A typed stem refusal (HumanFaceHairStemRefusalError) triggers a complete trial at the range top (Shapiro & Shapiro 2013); it establishes failure of that numerical walk, not impossibility of every path at the lower elevation. If the top trial also refuses, the root refuses by name with every elevation tried. Otherwise the interval is bisected until its midpoint is no longer representable, each trial being a complete walk; the result keeps the exit closest to the convention among the elevations the bracket visited. Admission need not be monotone in elevation, so this is the bracket's admitted end, not a global minimum claim. The azimuth stays the authored field's throughout.
 *
 * Any other error from a walk propagates unchanged. Every trial walk spends the shared lock budget, and each builds its own gathering stage; the contact's memory only reuses deterministic answers. The walk itself is walkHumanFaceHairCurve; regional guide length and post-clump strand metric/contact retain their existing owners.
 *
 * @evidence contracts/common.md#principled-implementation An explicit authored elevation walks once; otherwise only typed stem refusals trigger interval endpoint trials and representable bisection.
 * @evidence contracts/common.md#clear-and-simple-design Every complete trial reuses the caller's metric contact and remaining lock budget while creating its own gather state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Non-stem errors propagate; nonmonotone admission means the retained bracket endpoint is not a global minimum elevation guarantee.
 * @evidence contracts/common.md#meaningful-documentation Returned curve preserves actual metric and tried elevations appear in named root refusal detail.
 * @evidence contracts/performance.md#efficient-algorithms Cost is the sum of full walks over visited representable elevation brackets, constrained by their shared budget.
 * @evidence contracts/performance.md#reuse-equivalent-work Regional length/contact are prepared once and deterministic contact sampling may reuse same-point queries across attempts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the admitted curve escapes; prior trial curves and gather closures become collectible, while tried scalar elevations remain local/error detail.
 */
export function integrateHumanFaceHairCurve(
  props: IHumanFaceHairIntegration,
): IAutoMovieHumanFaceHairCurve {
  const { layer }: IHumanFaceHairIntegration = props;
  const length: number =
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
  const range: ImportedIHumanFaceHairEmergenceRange =
    humanFaceHairEmergenceRange(
      layer.hairline,
      Vector3.subtract(props.reference, props.origin),
    );
  const tried: number[] = [];
  const attempt: (
    degrees: number,
  ) => IAutoMovieHumanFaceHairCurve | HumanFaceHairStemRefusalError = (
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
  const convention:
    | IAutoMovieHumanFaceHairCurve
    | HumanFaceHairStemRefusalError = attempt(range.lowest);
  if (!(convention instanceof HumanFaceHairStemRefusalError)) return convention;
  const steepest: IAutoMovieHumanFaceHairCurve | HumanFaceHairStemRefusalError =
    attempt(range.highest);
  if (steepest instanceof HumanFaceHairStemRefusalError)
    throw new HumanFaceHairRootRefusalError(
      "A hair root at (" +
        [props.root.x, props.root.y, props.root.z]
          .map((v: number): string => v.toFixed(4))
          .join(", ") +
        ") m did not clear the skin at the attempted cited exit elevations (" +
        tried.map((v: number): string => v.toFixed(2)).join(", ") +
        " degrees): " +
        steepest.message,
      {
        lowest: range.lowest,
        highest: range.highest,
        tried,
        stem: steepest.detail,
      },
    );
  let low: number = range.lowest,
    high: number = range.highest,
    admitted: IAutoMovieHumanFaceHairCurve = steepest;
  while (true) {
    const middle: number = low / 2 + high / 2;
    if (middle === low || middle === high) break;
    const result: IAutoMovieHumanFaceHairCurve | HumanFaceHairStemRefusalError =
      attempt(middle);
    if (result instanceof HumanFaceHairStemRefusalError) low = middle;
    else {
      high = middle;
      admitted = result;
    }
  }
  return admitted;
}
