import { IAutoMovieFace } from "@automovie/interface";
import { flattenFace } from "../face/flattenFace";
import { ViolationCollector } from "./ViolationCollector";
import { FACE_PARAMETER_LIMIT } from "./FACE_PARAMETER_LIMIT";

/**
 * Validate an {@link IAutoMovieFace}: Tier-1 range checks the rough types
 * intentionally do not encode.
 *
 * The document is a nested object of optional trait fields, so the field
 * _names_ are already constrained by the type itself (and duplicates are
 * impossible by construction); what remains at runtime is the magnitudes: every
 * present leaf weight must sit in `[-2, 2]`, signed, unlike expression's `[0,
 * 1]`, because face edits go both ways. Violations are reported at the leaf's
 * document path (`….jaw.chin.length`), through the same {@link flattenFace}
 * mapping `morphFace` applies.
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `validateFace` reports each non-finite or out-of-range trait weight at its exact nested proxy-face field.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `validateFace` retains the observed trait scalar and the shared symmetric bound without collapsing sibling parameters.
 * @author Samchon
 */
export const validateFace = (props: {
  face: IAutoMovieFace;
  path?: string;
  collector?: ViolationCollector;
}): ViolationCollector => {
  const path = props.path ?? "$input";
  const collector = props.collector ?? new ViolationCollector();

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
