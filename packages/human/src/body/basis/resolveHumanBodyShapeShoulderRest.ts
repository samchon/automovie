import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { evaluateHumanBodyLandmarks } from "./evaluateHumanBodyLandmarks";
import { humanBodyBasisWeights } from "./humanBodyBasisWeights";
import { resolveHumanBodyShapedShoulderRest } from "./resolveHumanBodyShapedShoulderRest";

/**
 * Read an admitted basis's shoulder rest for one caller-owned shape.
 *
 * The builder and the editor share this shape-only evaluation before reading an omitted TT goal. Channel weights and rest correctives shape the landmark skeleton, without evaluating skin or adding the document's performance. Unsupported or out-of-domain channels retain the weight owner's refusal. Neither argument is mutated. The returned TT degrees describe the source rig's shaped landmark directions, with conventional zero axial rotation; they establish no anatomical bone frame or clinical motion capacity.
 *
 * @evidence contracts/common.md#principled-implementation The shared shape-weight state drives only resident landmark rows, then the common shaped-skeleton shoulder reader converts those actual rest directions to TT angles.
 * @evidence contracts/common.md#clear-and-simple-design This shape-only composition joins three existing owners and omits document performance and full skin evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported shape controls preserve authoritative refusal; conventional zero torsion and landmark directions do not supply an anatomical frame or measured clinical capacity.
 * @evidence contracts/common.md#meaningful-documentation The comment states admitted basis, caller-owned shape, no input mutation, source rest degrees and the absent clinical/anatomical inference.
 * @evidence contracts/performance.md#efficient-algorithms Shared weight planning and sparse landmark evaluation precede a rig-sized rest readout, avoiding all native skin vertex and material-region allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Builder and editor use the same weight/landmark/shaped-rest owners, and equivalent fixed corrective-table planning is reused by the weight owner's weak basis cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned shoulder map escapes; temporary weight/landmark/skeleton references expire with the call and no source buffer, external handle or task is acquired.
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
