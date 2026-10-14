import type {
  IAutoMovieMaterial as IAutoMovieMaterialImported,
  IAutoMovieModel,
  IAutoMovieModelPart as IAutoMovieModelPartImported,
} from "@automovie/interface";

import type { IAutoMovieHumanConstructionClearanceReading as IAutoMovieHumanConstructionClearanceReadingImported } from "../../index";
import { buildHumanFaceOcularSurfaces } from "../anatomy/eye/buildHumanFaceOcularSurfaces";
import { createHumanFaceOpticalFinish } from "../anatomy/eye/createHumanFaceOpticalFinish";
import { finishHumanFacePeriocularTissues } from "../anatomy/eye/finishHumanFacePeriocularTissues";
import { readHumanFaceOcularSurfaceSpace } from "../anatomy/eye/readHumanFaceOcularSurfaceSpace";
import { createHumanFaceLashFinish } from "../anatomy/lash/createHumanFaceLashFinish";
import type { IHumanFaceLashRow as IHumanFaceLashRowImported } from "../anatomy/lash/structures/IHumanFaceLashRow";
import { createHumanFaceOralFinish } from "../anatomy/oral/createHumanFaceOralFinish";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IHumanFaceGeneratedCompositionInput } from "./IHumanFaceGeneratedCompositionInput";
import { createHumanFaceClearanceCheck } from "./createHumanFaceClearanceCheck";

/**
 * Compose generated optical, fibre and soft-tissue parts into one owned model.
 * Geometry comes from the exact pose/attachment stages; the finish factories
 * retain their source painting caches and instantiate lazily. Composition owns
 * part/material identity collisions and updates the same finish map the model
 * occlusion stage consumes. The caller still owns canonical model admission and
 * successful observer publication. Failed composition cannot alter a previous
 * admitted model because only the current build's owned model is supplied.
 * A later failure can leave that current model and its finish/check maps partly
 * extended; the builder discards that unreturned stage.
 *
 * @evidence contracts/common.md#principled-implementation Source-registered pose assemblies supply geometry and their owning finish factories supply materials. Append refuses collisions against resident ids, updates the current finish map, and attaches the actual rest/performed ocular clearance checks; canonical model admission remains in the builder.
 * @evidence contracts/common.md#clear-and-simple-design Lazy optical and lash finish owners retain painting reuse, while one append operation owns shared model/material-map updates. Oral, brow, tissue and ocular producers retain their distinct physical responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing oral jaw motion or ocular reference refuses instead of borrowing another stage. Identity comparisons are real collision checks, not cross-part geometric certification; no observer publication or accepted verdict is synthesized here.
 * @evidence contracts/common.md#meaningful-documentation Prose states exact pose/reference inputs, lazy finish ownership, collision and admission boundaries, and partial current-stage mutation versus independence of earlier published models.
 * @evidence contracts/performance.md#efficient-algorithms Generation/finish costs remain with each producer; append compares each new id with current ids, O(new parts times resident parts plus new materials times resident materials), then appends once. Ocular rest/performed geometry is generated separately because both physical states are judged.
 * @evidence contracts/performance.md#reuse-equivalent-work Optical/lash factories are initialized at first use and reused for the fixed basis; composition itself is request-specific and updates its supplied maps/checks. Rest and performed ocular shells have distinct positions and cannot be collapsed by equal document labels.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The builder retains its optional finish factories and their source caches; current generated parts, material attachments and check closures transfer to the stage. No model history or external task is retained by this composition closure.
 */
export function createHumanFaceGeneratedComposition(
  basis: IAutoMovieHumanFaceBasis,
): (input: IHumanFaceGeneratedCompositionInput) => void {
  let opticalFinish:
    | ReturnType<typeof createHumanFaceOpticalFinish>
    | undefined;
  let lashFinish: ReturnType<typeof createHumanFaceLashFinish> | undefined;
  return (input: IHumanFaceGeneratedCompositionInput): void => {
    const {
      document,
      pose,
      lashes,
      brows,
      model,
      materialMap,
      checks,
    }: IHumanFaceGeneratedCompositionInput = input;
    const append: (
      generated: Pick<IAutoMovieModel, "parts" | "materials">,
      label: string,
    ) => void = (
      generated: Pick<IAutoMovieModel, "parts" | "materials">,
      label: string,
    ): void => {
      if (
        generated.parts.some((part: IAutoMovieModelPartImported): boolean =>
          model.parts.some(
            (old: IAutoMovieModelPartImported): boolean => old.id === part.id,
          ),
        ) ||
        generated.materials.some(
          (material: IAutoMovieMaterialImported): boolean =>
            model.materials.some(
              (old: IAutoMovieMaterialImported): boolean =>
                old.id === material.id,
            ),
        )
      )
        throw new Error(
          label + " identities collide with resident geometry or finishes.",
        );
      model.parts.push(...generated.parts);
      model.materials.push(...generated.materials);
      for (const material of generated.materials)
        materialMap.set(material.id, material);
    };
    if (pose.optics !== undefined) {
      opticalFinish ??= createHumanFaceOpticalFinish(basis);
      append(
        opticalFinish(document, pose.optics, model.materials),
        "Independent optical",
      );
    }
    if (
      lashes !== undefined &&
      lashes.some(
        (row: IHumanFaceLashRowImported): boolean => row.mesh !== null,
      )
    ) {
      lashFinish ??= createHumanFaceLashFinish(basis);
      append(lashFinish(document, lashes, model.materials), "Numerical lash");
    }
    if (pose.periocularTissues !== undefined)
      append(
        finishHumanFacePeriocularTissues(
          basis,
          pose.periocularTissues,
          model.materials,
        ),
        "Periocular tissue",
      );
    if (pose.oral !== undefined) {
      if (pose.jawMotion === undefined)
        throw new Error("Oral finishing needs the same source jaw motion.");
      append(
        createHumanFaceOralFinish(
          basis,
          document,
          pose.oral,
          pose.jawMotion,
          model.materials,
          input.materialAttachments,
        ),
        "Oral",
      );
    }
    if (brows !== undefined) append(brows, "Numerical brow");
    if (document.ocularSurfaces !== undefined) {
      if (pose.reference === undefined)
        throw new Error(
          "Ocular surfaces need their actual resting source reference.",
        );
      const resting: Pick<IAutoMovieModel, "materials" | "parts"> =
        buildHumanFaceOcularSurfaces(
          basis,
          pose.reference,
          document,
          pose.optics,
          model.materials,
          "rest",
        );
      const performed: Pick<IAutoMovieModel, "materials" | "parts"> =
        buildHumanFaceOcularSurfaces(
          basis,
          pose.positions,
          document,
          pose.optics,
          model.materials,
        );
      append(performed, "Ocular surface");
      checks.push(
        createHumanFaceClearanceCheck(
          "ocular-rest",
          "Ocular rest surface penetrates or crosses its actual optical exterior",
          (): IAutoMovieHumanConstructionClearanceReadingImported[] =>
            readHumanFaceOcularSurfaceSpace(
              basis,
              pose.reference!,
              resting.parts,
              pose.optics,
              "rest",
            ),
        ),
      );
      checks.push(
        createHumanFaceClearanceCheck(
          "ocular-performed",
          "Ocular performed surface penetrates or crosses its actual optical exterior",
          (): IAutoMovieHumanConstructionClearanceReadingImported[] =>
            readHumanFaceOcularSurfaceSpace(
              basis,
              pose.positions,
              performed.parts,
              pose.optics,
              "performed",
            ),
        ),
      );
    }
  };
}
