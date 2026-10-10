import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { evaluateHumanBodyLandmarks } from "./evaluateHumanBodyLandmarks";
import { humanBodyBasisWeights } from "./humanBodyBasisWeights";
import { resolveHumanBodyShapedShoulderRest } from "./resolveHumanBodyShapedShoulderRest";

/**
 * Read an admitted basis's shoulder rest for one caller-owned shape.
 *
 * The builder and the editor share this shape-only evaluation before reading
 * an omitted TT goal. Channel weights and rest correctives shape the landmark
 * skeleton, without evaluating skin or adding the document's performance.
 * Unsupported or out-of-domain channels retain the weight owner's refusal.
 * Neither argument is mutated. The returned TT degrees describe the source
 * rig's shaped landmark directions, with conventional zero axial rotation;
 * they establish no anatomical bone frame or clinical motion capacity.
 */
export function resolveHumanBodyShapeShoulderRest(
  basis: IAutoMovieHumanBodyBasis,
  shape: Record<string, number>,
): ReturnType<typeof resolveHumanBodyShapedShoulderRest> {
  return resolveHumanBodyShapedShoulderRest(
    basis,
    evaluateHumanBodyLandmarks(
      basis,
      humanBodyBasisWeights(basis, { shape, pose: undefined }),
    ),
  );
}
