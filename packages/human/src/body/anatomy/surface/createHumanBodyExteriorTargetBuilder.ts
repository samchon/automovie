import typia from "typia";

import { float32MeshBuffers } from "../../../common/mesh/float32MeshBuffers";
import { createHumanBodyBasisBuilder } from "../../basis/createHumanBodyBasisBuilder";
import { admitHumanBodyBasisDocument } from "../../document/admitHumanBodyBasisDocument";
import { readHumanBodyShapedMeasurement } from "../../measure/readHumanBodyShapedMeasurement";
import type { IAutoMovieHumanBodyBasisDocument } from "../../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBuild } from "../../structures/IAutoMovieHumanBodyBuild";
import type { IAutoMovieHumanBodyPosedSurface } from "../../structures/IAutoMovieHumanBodyPosedSurface";
import type { IAutoMovieHumanBodyMeasurementSection } from "../../structures/IAutoMovieHumanBodyMeasurementSection";
import type { IAutoMovieHumanBodyExteriorCandidateBuild } from "../generated/IAutoMovieHumanBodyExteriorCandidateBuild";
import type { IAutoMovieHumanBodyExteriorCandidateMeasurement } from "../generated/IAutoMovieHumanBodyExteriorCandidateMeasurement";
import type { IAutoMovieHumanBodyExteriorCandidateSection } from "../generated/IAutoMovieHumanBodyExteriorCandidateSection";
import { assembleHumanBodyGeneratedAnatomy } from "../generated/assembleHumanBodyGeneratedAnatomy";
import { HUMAN_BODY_EXTERIOR_TOLERANCE_METRES } from "./HUMAN_BODY_EXTERIOR_TOLERANCE_METRES";
import type { IAutoMovieHumanBodyExteriorReference } from "./IAutoMovieHumanBodyExteriorReference";
import type { IAutoMovieHumanBodyExteriorTargetSource } from "./IAutoMovieHumanBodyExteriorTargetSource";
import { collectHumanBodyExteriorRequests } from "./collectHumanBodyExteriorRequests";
import type { IAutoMovieHumanBodyExteriorRequest } from "./IAutoMovieHumanBodyExteriorRequest";

/**
 * Compile one source into a builder that reports how a body document's anatomical surface targets are met on its emitted exterior.
 *
 * The document passes product admission with its basis's registered assembly when present. Exact-source-bound observations retain their raw acquisition values; unregistered observations, paths without a consumer and bound channels authored beside their measurement refuse. The actual body builder resolves bound targets into channel weights (`resolveHumanBodyAnatomy`) and builds the body once; its unsplit final skin crosses the Float32 mesh-buffer boundary, and each bound instrument (`collectHumanBodyExteriorRequests`) is read again on that emitted skin. A Float32 residual beyond 0.05 mm refuses, so the reported value is the emitted body's, not the rest reader's the inverse used. A document without a bound target refuses as `missing-anatomical-input`. Every named internal part reports through `assembleHumanBodyGeneratedAnatomy`. The returned closure owns the cloned source and its compiled body builder until the caller releases it; this entry exposes no explicit dispose method.
 *
 * The reference's source-rest label describes constructor registration; this entry does not separately reject ordinary pose, shoulder, toe or ground-placement requests beyond the body admission owner. Readback combines final performed skin with shaped rest landmarks before pose and placement. For requests that change those frames, the residual is this instrument's mixed-frame reading rather than an independently registered rest or performed anatomical measurement.
 *
 * @evidence contracts/common.md#principled-implementation Exact source/reference and document admission precede one body build; target instruments read final double-precision and Float32 skin against the retained shaped rest landmarks, refusing missing or out-of-budget readback rather than reporting the inverse's rest-state values.
 * @evidence contracts/common.md#clear-and-simple-design One source-bound closure coordinates admission, compilation and emitted-skin readback while existing owners perform body solving, mesh conversion and internal-part reporting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source-rest metadata imposes no additional motion refusal, and performed skin with retained rest landmarks has the declared frame limitation. Matching source IDs and candidate readbacks do not validate clinical acquisition, tissue generation or visual acceptance.
 * @evidence contracts/common.md#meaningful-documentation The prose states Float32 residual budget, missing-input failures, actual output measurement and cloned-source closure ownership without a disposal API.
 * @evidence contracts/performance.md#efficient-algorithms Compilation clones source-sized state once; each request builds the body, converts vertex and index buffers through float32MeshBuffers and copies its positions to number arrays, then reads R instruments twice. Mesh conversion and instrument section traversals scale with source geometry.
 * @evidence contracts/performance.md#reuse-equivalent-work The closure reuses one immutable cloned basis and compiled builder; all requested instruments share its completed skin, while distinct documents require admission and current output readings.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains one cloned basis/reference and builder state until unreachable; per-build mesh copies, readings and requested snapshot grow with source/document size and no worker or handle is acquired here.
 */
export function createHumanBodyExteriorTargetBuilder(
  input: IAutoMovieHumanBodyExteriorTargetSource,
): (inputDocument: IAutoMovieHumanBodyBasisDocument) => IAutoMovieHumanBodyExteriorCandidateBuild {
  const basis: IAutoMovieHumanBodyBasis = structuredClone(input.basis);
  const reference: IAutoMovieHumanBodyExteriorReference = structuredClone(
    typia.assertEquals<IAutoMovieHumanBodyExteriorReference>(input.reference),
  );
  if (reference.basis !== basis.id)
    throw new Error(
      "Exterior source registration must belong to the exact compiled source basis.",
    );
  const build: ReturnType<typeof createHumanBodyBasisBuilder> = createHumanBodyBasisBuilder(basis, {
    physicalSource: reference.incidence,
  });
  return (
    inputDocument: IAutoMovieHumanBodyBasisDocument,
  ): IAutoMovieHumanBodyExteriorCandidateBuild => {
    const document: IAutoMovieHumanBodyBasisDocument = admitHumanBodyBasisDocument(
      inputDocument,
      basis.anatomicalAssembly,
    );
    if (document.basis !== basis.id)
      throw new Error("Exterior request must name the exact compiled source.");
    const requested: IAutoMovieHumanBodyExteriorRequest[] = collectHumanBodyExteriorRequests(document.anatomy);
    if (requested.length === 0)
      throw new Error(
        "missing-anatomical-input: the document's anatomy supplies no surface target the exterior answers.",
      );
    // the builder resolves the anatomy into the bound channels' weights
    const built: IAutoMovieHumanBodyBuild = build(document);
    const final: Parameters<typeof readHumanBodyShapedMeasurement>[1] = {
      surfaces: built.posedSurfaces.map((surface: IAutoMovieHumanBodyPosedSurface): number[] => surface.positions),
      landmarks: built.landmarks,
    };
    const float32: Parameters<typeof readHumanBodyShapedMeasurement>[1] = {
      ...final,
      surfaces: built.posedSurfaces.map((surface: IAutoMovieHumanBodyPosedSurface, index: number): number[] =>
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
    const fulfilled: IAutoMovieHumanBodyExteriorCandidateMeasurement[] = requested.map(
      (one: IAutoMovieHumanBodyExteriorRequest): IAutoMovieHumanBodyExteriorCandidateMeasurement => {
        let section: IAutoMovieHumanBodyExteriorCandidateSection | null = null;
        const finalMetres: number | null = readHumanBodyShapedMeasurement(
          basis,
          final,
          one.rule,
        );
        // only a girth at a skin landmark has one station, so only its witness
        // is the measured cut; a station stack would hand over every station
        const float32Metres: number | null = readHumanBodyShapedMeasurement(
          basis,
          float32,
          one.rule,
          "level" in one.rule
            ? (witness: IAutoMovieHumanBodyMeasurementSection): void => {
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
