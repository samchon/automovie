import typia from "typia";

import { float32MeshBuffers } from "../../../common/mesh/float32MeshBuffers";
import { createHumanBodyBasisBuilder } from "../../basis/createHumanBodyBasisBuilder";
import { admitHumanBodyBasisDocument } from "../../document/admitHumanBodyBasisDocument";
import { readHumanBodyShapedMeasurement } from "../../measure/readHumanBodyShapedMeasurement";
import type { IAutoMovieHumanBodyBasisDocument } from "../../structures/IAutoMovieHumanBodyBasisDocument";
import { assembleHumanBodyGeneratedAnatomy } from "../generated/assembleHumanBodyGeneratedAnatomy";
import type { IAutoMovieHumanBodyExteriorCandidateBuild } from "../generated/IAutoMovieHumanBodyExteriorCandidateBuild";
import type { IAutoMovieHumanBodyExteriorCandidateMeasurement } from "../generated/IAutoMovieHumanBodyExteriorCandidateMeasurement";
import type { IAutoMovieHumanBodyExteriorCandidateSection } from "../generated/IAutoMovieHumanBodyExteriorCandidateSection";
import { collectHumanBodyExteriorRequests } from "./collectHumanBodyExteriorRequests";
import { HUMAN_BODY_EXTERIOR_TOLERANCE_METRES } from "./HUMAN_BODY_EXTERIOR_TOLERANCE_METRES";
import type { IAutoMovieHumanBodyExteriorReference } from "./IAutoMovieHumanBodyExteriorReference";
import type { IAutoMovieHumanBodyExteriorTargetSource } from "./IAutoMovieHumanBodyExteriorTargetSource";

/**
 * Compile one source into a builder that reports how a body document's
 * anatomical surface targets are met on its emitted exterior.
 *
 * The document passes the product admission, which refuses observed values,
 * paths without a consumer and bound channels authored beside their
 * measurement. The actual body builder resolves the anatomy's bound targets
 * into channel weights (`resolveHumanBodyAnatomy`) and builds the body once;
 * its unsplit final skin crosses the Float32 mesh-buffer boundary, and each
 * bound instrument (`collectHumanBodyExteriorRequests`) is read again on that
 * emitted skin. A Float32 residual beyond 0.05 mm refuses, so the reported
 * value is the emitted body's, not the rest reader's the inverse used. A
 * document without a bound target refuses as `missing-anatomical-input`.
 * Every named internal part reports through `assembleHumanBodyGeneratedAnatomy`.
 *
 * @evidence contracts/common.md#principled-implementation The target table, rule table, channel inverse, body builder, Float32 boundary and part assembly each keep their sole responsibility.
 * @evidence contracts/common.md#clear-and-simple-design One compiled source registration produces one physical candidate beside the assembled anatomical availability.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unregistered observations, unmet residuals and inconsistent targets refuse; no population mean, default or unknown tissue is fabricated.
 * @evidence contracts/common.md#meaningful-documentation States the solve order, the final Float32 reading, the refusals and the unsupported context.
 * @evidence contracts/modeling.md#parameter-channels Named absolute targets condition only their bound source channels; private weights are not authored inputs.
 * @evidence contracts/modeling.md#spatial-conventions Final and Float32 readings use the same source-rest metre frame and oriented instrument.
 * @evidence contracts/modeling.md#emitted-geometry The admitted basis builder supplies the actual shared exterior, read after the real Float32 boundary.
 * @evidence contracts/modeling.md#shared-boundaries All targets are met on one compiled body evaluation and one skin.
 * @evidence contracts/modeling.md#part-identity-and-grouping Source regions retain their identities; named anatomical parts report through their region owners.
 * @evidence contracts/modeling.md#rendered-observation The connected exterior runtime consumes this physical model and qualification together.
 * @evidence contracts/anatomy.md#anatomical-source Each fulfilled target carries its instrument's protocol against the cited survey definition and supplies no held-out tissue validation.
 * @evidence contracts/anatomy.md#permitted-range Actual channel reach, the inverse tolerance and the pass limit refuse unsupported or contradictory targets without extrapolation.
 * @evidence contracts/anatomy.md#parametric-authority The body document supplies only named physical targets, never vertex or morph edits.
 */
export function createHumanBodyExteriorTargetBuilder(input: IAutoMovieHumanBodyExteriorTargetSource) {
  const basis = structuredClone(input.basis);
  const reference = structuredClone(typia.assertEquals<IAutoMovieHumanBodyExteriorReference>(input.reference));
  if (reference.basis !== basis.id)
    throw new Error("Exterior source registration must belong to the exact compiled source basis.");
  const build = createHumanBodyBasisBuilder(basis, { physicalSource: reference.incidence });
  return (inputDocument: IAutoMovieHumanBodyBasisDocument): IAutoMovieHumanBodyExteriorCandidateBuild => {
    const document = admitHumanBodyBasisDocument(inputDocument);
    if (document.basis !== basis.id)
      throw new Error("Exterior request must name the exact compiled source.");
    const requested = collectHumanBodyExteriorRequests(document.anatomy);
    if (requested.length === 0)
      throw new Error("missing-anatomical-input: the document's anatomy supplies no surface target the exterior answers.");
    // the builder resolves the anatomy into the bound channels' weights
    const built = build(document);
    const final = { surfaces: built.posedSurfaces.map((surface) => surface.positions), landmarks: built.landmarks };
    const float32 = { ...final, surfaces: built.posedSurfaces.map((surface, index) => Array.from(float32MeshBuffers({
      positions: surface.positions, normals: surface.normals, indices: basis.surfaces[index].indices, uvs: null, skin: null,
    }).positions)) };
    const fulfilled = requested.map((one): IAutoMovieHumanBodyExteriorCandidateMeasurement => {
      let section: IAutoMovieHumanBodyExteriorCandidateSection | null = null;
      const finalMetres = readHumanBodyShapedMeasurement(basis, final, one.rule);
      // only a girth at a skin landmark has one station, so only its witness
      // is the measured cut; a station stack would hand over every station
      const float32Metres = readHumanBodyShapedMeasurement(basis, float32, one.rule, "level" in one.rule ? (witness) => { section = witness; } : undefined);
      if (finalMetres === null || float32Metres === null)
        throw new Error(`missing-tissue-boundary:anatomy.${one.binding.path} has no reading on the emitted skin`);
      if (Math.abs(float32Metres - one.metres) > HUMAN_BODY_EXTERIOR_TOLERANCE_METRES)
        throw new Error(`The emitted skin reads ${float32Metres} m for anatomy.${one.binding.path}, not ${one.metres}.`);
      return {
        path: "anatomy." + one.binding.path, rule: one.binding.rule,
        ...(one.binding.side === undefined ? {} : { side: one.binding.side }),
        protocol: one.binding.protocol, targetMetres: one.metres, finalMetres, float32Metres,
        residualMetres: float32Metres - one.metres, section,
      };
    });
    return {
      model: built.model,
      exterior: {
        generatorRevision: "source-conditioned-exterior/2", status: "candidate-only",
        reference: { basis: basis.id, evaluation: reference.evaluation },
        requested: structuredClone(document),
        fulfilled,
        anatomy: assembleHumanBodyGeneratedAnatomy({ ...(document.anatomy === undefined ? {} : { targets: document.anatomy }), basis }),
      },
    };
  };
}
