import {
  type IAutoMovieMeshTopologyValidationProps,
  IAutoMovieValidation,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { ViolationCollector } from "./ViolationCollector";
import { appendMeshTopology } from "./appendMeshTopology";

/**
 * Run shared welded topology checks with caller-selected closedness policy and
 * return canonical validation.
 */
export function validateMeshTopology(
  props: IAutoMovieMeshTopologyValidationProps,
): IAutoMovieValidation {
  const collector: IAutoMovieViolationCollector = new ViolationCollector();
  appendMeshTopology(
    props.mesh,
    props.path ?? "$input",
    collector,
    props.expectClosed ?? false,
  );
  return collector.toValidation();
}
