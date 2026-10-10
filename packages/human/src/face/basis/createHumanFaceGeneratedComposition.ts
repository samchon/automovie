import type { IAutoMovieModel } from "@automovie/interface";

import { buildHumanFaceOcularSurfaces } from "../anatomy/eye/buildHumanFaceOcularSurfaces";
import { createHumanFaceOpticalFinish } from "../anatomy/eye/createHumanFaceOpticalFinish";
import { finishHumanFacePeriocularTissues } from "../anatomy/eye/finishHumanFacePeriocularTissues";
import { readHumanFaceOcularSurfaceSpace } from "../anatomy/eye/readHumanFaceOcularSurfaceSpace";
import { createHumanFaceLashFinish } from "../anatomy/lash/createHumanFaceLashFinish";
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
 */
export function createHumanFaceGeneratedComposition(
  basis: IAutoMovieHumanFaceBasis,
) {
  let opticalFinish:
    | ReturnType<typeof createHumanFaceOpticalFinish>
    | undefined;
  let lashFinish: ReturnType<typeof createHumanFaceLashFinish> | undefined;
  return (input: IHumanFaceGeneratedCompositionInput): void => {
    const { document, pose, lashes, brows, model, materialMap, checks } = input;
    const append = (
      generated: Pick<IAutoMovieModel, "parts" | "materials">,
      label: string,
    ): void => {
      if (
        generated.parts.some((part) =>
          model.parts.some((old) => old.id === part.id),
        ) ||
        generated.materials.some((material) =>
          model.materials.some((old) => old.id === material.id),
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
    if (lashes !== undefined && lashes.some((row) => row.mesh !== null)) {
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
      const resting = buildHumanFaceOcularSurfaces(
        basis,
        pose.reference,
        document,
        pose.optics,
        model.materials,
        "rest",
      );
      const performed = buildHumanFaceOcularSurfaces(
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
          () =>
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
          () =>
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
