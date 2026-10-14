import { IAutoMovieFace } from "@automovie/interface";

import { flattenFace } from "../face/flattenFace";
import { ViolationCollector } from "./ViolationCollector";
import { FACE_PARAMETER_LIMIT } from "./constants/FACE_PARAMETER_LIMIT";

/**
 * Flatten present nested face traits with the morphing owner's mapping and require signed weights in[-2,2].
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Flatten present nested face traits with the morphing owner's mapping and require signed weights in[-2,2].
 * @evidence contracts/common.md#clear-and-simple-design flattenFace owns trait paths, while the collector owns finite/inclusive range faults.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Typed field names are assumed; the check does not prove rendered anatomy or geometric quality.
 * @evidence contracts/common.md#meaningful-documentation Optional path/collector composition and the signed weight limit are documented.
 * @evidence contracts/performance.md#efficient-algorithms Present trait population drives flattening and range traversal, with proportional temporary rows.
 * @evidence contracts/performance.md#reuse-equivalent-work The same flattenFace mapping is shared with morphFace instead of a parallel trait traversal.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A supplied/fresh collector owns diagnostics; temporary trait rows release and no mesh/image is retained.
 */
export const validateFace: (props: { face: IAutoMovieFace; path?: string; collector?: ViolationCollector; }) => ViolationCollector = (props: {
  /** Borrowed optional nested traits with signed weights admitted within -2..2. */
  face: IAutoMovieFace;

  /** Base diagnostic address, defaulting to $input. */
  path?: string;

  /** Optional caller-owned sink; omitted, validation returns a fresh collector. */
  collector?: ViolationCollector;
}): ViolationCollector => {
  const path: string = props.path ?? "$input";
  const collector: ViolationCollector = props.collector ?? new ViolationCollector();

  for (const trait of flattenFace(props.face))
    collector.range(
      `${path}.${trait.path}`,
      trait.weight,
      -FACE_PARAMETER_LIMIT,
      FACE_PARAMETER_LIMIT,
      "weight",
    );

  return collector;
};
