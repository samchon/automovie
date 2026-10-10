import typia from "typia";

import { float32MeshBuffers } from "../../../common/mesh/float32MeshBuffers";
import { createHumanBodyBasisBuilder } from "../../basis/createHumanBodyBasisBuilder";
import { admitHumanBodyBasisDocument } from "../../document/admitHumanBodyBasisDocument";
import { readHumanBodyShapedMeasurement } from "../../measure/readHumanBodyShapedMeasurement";
import type { IAutoMovieHumanBodyBasisDocument } from "../../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyExteriorCandidateBuild } from "../generated/IAutoMovieHumanBodyExteriorCandidateBuild";
import type { IAutoMovieHumanBodyExteriorCandidateMeasurement } from "../generated/IAutoMovieHumanBodyExteriorCandidateMeasurement";
import type { IAutoMovieHumanBodyExteriorCandidateSection } from "../generated/IAutoMovieHumanBodyExteriorCandidateSection";
import { assembleHumanBodyGeneratedAnatomy } from "../generated/assembleHumanBodyGeneratedAnatomy";
import { HUMAN_BODY_EXTERIOR_TOLERANCE_METRES } from "./HUMAN_BODY_EXTERIOR_TOLERANCE_METRES";
import type { IAutoMovieHumanBodyExteriorReference } from "./IAutoMovieHumanBodyExteriorReference";
import type { IAutoMovieHumanBodyExteriorTargetSource } from "./IAutoMovieHumanBodyExteriorTargetSource";
import { collectHumanBodyExteriorRequests } from "./collectHumanBodyExteriorRequests";

/**
 * Compile one source into a builder that reports how a body document's
 * anatomical surface targets are met on its emitted exterior.
 *
 * The document passes product admission with its basis's registered assembly
 * when present. Exact-source-bound observations retain their raw acquisition
 * values; unregistered observations, paths without a consumer and bound
 * channels authored beside their measurement refuse. The actual body builder
 * resolves bound targets
 * into channel weights (`resolveHumanBodyAnatomy`) and builds the body once;
 * its unsplit final skin crosses the Float32 mesh-buffer boundary, and each
 * bound instrument (`collectHumanBodyExteriorRequests`) is read again on that
 * emitted skin. A Float32 residual beyond 0.05 mm refuses, so the reported
 * value is the emitted body's, not the rest reader's the inverse used. A
 * document without a bound target refuses as `missing-anatomical-input`.
 * Every named internal part reports through `assembleHumanBodyGeneratedAnatomy`.
 */
export function createHumanBodyExteriorTargetBuilder(
  input: IAutoMovieHumanBodyExteriorTargetSource,
) {
  const basis = structuredClone(input.basis);
  const reference = structuredClone(
    typia.assertEquals<IAutoMovieHumanBodyExteriorReference>(input.reference),
  );
  if (reference.basis !== basis.id)
    throw new Error(
      "Exterior source registration must belong to the exact compiled source basis.",
    );
  const build = createHumanBodyBasisBuilder(basis, {
    physicalSource: reference.incidence,
  });
  return (
    inputDocument: IAutoMovieHumanBodyBasisDocument,
  ): IAutoMovieHumanBodyExteriorCandidateBuild => {
    const document = admitHumanBodyBasisDocument(
      inputDocument,
      basis.anatomicalAssembly,
    );
    if (document.basis !== basis.id)
      throw new Error("Exterior request must name the exact compiled source.");
    const requested = collectHumanBodyExteriorRequests(document.anatomy);
    if (requested.length === 0)
      throw new Error(
        "missing-anatomical-input: the document's anatomy supplies no surface target the exterior answers.",
      );
    // the builder resolves the anatomy into the bound channels' weights
    const built = build(document);
    const final = {
      surfaces: built.posedSurfaces.map((surface) => surface.positions),
      landmarks: built.landmarks,
    };
    const float32 = {
      ...final,
      surfaces: built.posedSurfaces.map((surface, index) =>
        Array.from(
          float32MeshBuffers({
            positions: surface.positions,
            normals: surface.normals,
            indices: basis.surfaces[index].indices,
            uvs: null,
            skin: null,
          }).positions,
        ),
      ),
    };
    const fulfilled = requested.map(
      (one): IAutoMovieHumanBodyExteriorCandidateMeasurement => {
        let section: IAutoMovieHumanBodyExteriorCandidateSection | null = null;
        const finalMetres = readHumanBodyShapedMeasurement(
          basis,
          final,
          one.rule,
        );
        // only a girth at a skin landmark has one station, so only its witness
        // is the measured cut; a station stack would hand over every station
        const float32Metres = readHumanBodyShapedMeasurement(
          basis,
          float32,
          one.rule,
          "level" in one.rule
            ? (witness) => {
                section = witness;
              }
            : undefined,
        );
        if (finalMetres === null || float32Metres === null)
          throw new Error(
            `missing-tissue-boundary:anatomy.${one.binding.path} has no reading on the emitted skin`,
          );
        if (
          Math.abs(float32Metres - one.metres) >
          HUMAN_BODY_EXTERIOR_TOLERANCE_METRES
        )
          throw new Error(
            `The emitted skin reads ${float32Metres} m for anatomy.${one.binding.path}, not ${one.metres}.`,
          );
        return {
          path: "anatomy." + one.binding.path,
          rule: one.binding.rule,
          ...(one.binding.side === undefined ? {} : { side: one.binding.side }),
          protocol: one.binding.protocol,
          targetMetres: one.metres,
          finalMetres,
          float32Metres,
          residualMetres: float32Metres - one.metres,
          section,
        };
      },
    );
    return {
      model: built.model,
      exterior: {
        generatorRevision: "source-conditioned-exterior/2",
        status: "candidate-only",
        reference: { basis: basis.id, evaluation: reference.evaluation },
        requested: structuredClone(document),
        fulfilled,
        anatomy: assembleHumanBodyGeneratedAnatomy({
          ...(document.anatomy === undefined
            ? {}
            : { targets: document.anatomy }),
          basis,
        }),
      },
    };
  };
}
