import { IAutoMovieValidation } from "@automovie/interface";

import type { IAutoMovieMeshTopologyValidationProps } from "./IAutoMovieMeshTopologyValidationProps";
import { ViolationCollector } from "./ViolationCollector";
import { appendMeshTopology } from "./appendMeshTopology";

/**
 * Run shared welded topology checks with caller-selected closedness policy and return canonical validation.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Run shared welded topology checks over IAutoMovieMesh's typed buffer containers with caller-selected closedness policy and return canonical validation; array-container shape is not independently admitted here.
 * @evidence contracts/common.md#clear-and-simple-design appendMeshTopology owns finite buffer admission, winding and manifold-edge checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Open meshes are allowed unless watertightness is requested; malformed containers can throw before topology checks, and this does not prove global embedded-surface self-intersection freedom.
 * @evidence contracts/common.md#meaningful-documentation The topology policy and caller path are explicit, preserving ordered mesh faults.
 * @evidence contracts/performance.md#efficient-algorithms Mesh coordinate/index size and welded edge inventory drive time/storage through the shared analyzer.
 * @evidence contracts/performance.md#reuse-equivalent-work No duplicate weld/edge implementation is kept in the public result wrapper.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns result rows while analyzer tables release; no native mesh resource is retained.
 */
export const validateMeshTopology: (
  props: IAutoMovieMeshTopologyValidationProps,
) => IAutoMovieValidation = (
  props: IAutoMovieMeshTopologyValidationProps,
): IAutoMovieValidation => {
  const collector: ViolationCollector = new ViolationCollector();
  appendMeshTopology(
    props.mesh,
    props.path ?? "$input",
    collector,
    props.expectClosed ?? false,
  );
  return collector.toValidation();
};
