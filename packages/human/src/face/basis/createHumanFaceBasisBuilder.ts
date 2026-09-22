import { validateModel } from "@automovie/engine";
import { createMeshWeldPartitionMatcher } from "@automovie/engine/math/createMeshWeldPartitionMatcher";
import type { IAutoMovieModel } from "@automovie/interface";
import typia from "typia";

import { createHumanFaceHairBuilder } from "../anatomy/hair/createHumanFaceHairBuilder";
import { createPortraitColourField } from "../anatomy/skin/createPortraitColourField";
import { portraitNormals } from "../mesh/portraitNormals";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import { assertHumanFaceBasis } from "./assertHumanFaceBasis";
import { createHumanFaceBasisRegion } from "./createHumanFaceBasisRegion";
import { evaluateHumanFaceRest } from "./evaluateHumanFaceRest";
import { humanFaceBasisWeights } from "./humanFaceBasisWeights";
import { poseHumanFaceSurface } from "./poseHumanFaceSurface";
import { resolveHumanFaceArticulation } from "./resolveHumanFaceArticulation";

/**
 * Compile a caller-owned connected facial prior into a deterministic builder.
 * The playground's connected-basis editor consumes this builder and exports its
 * resident model through exportHumanFace. Offline modelling tools supply the
 * licensed geometry; none run here and no source photo is needed for replay.
 *
 * The order per document is fixed and is what the specification states:
 * channel weights and corrective activations (`humanFaceBasisWeights`), then
 * the rest layer of every surface and landmark (`evaluateHumanFaceRest`:
 * `p + sum(|weight| * endpoint) + sum(activation * corrective)`), then the
 * articulation read off the shaped landmarks (`resolveHumanFaceArticulation`),
 * then each attached surface posed through its sparse weights
 * (`poseHumanFaceSurface`), then common normals and region separation. Shape
 * is identity, a joint's centre is identity, and the expression rows of an
 * articulated basis are rest-space residuals over the joint motion, so a
 * mandibular arch stays a rigid body on the arc at every fraction of opening
 * and the lips, lining and tongue bound to it take the same transform before
 * their own tissue rows are added. A basis without articulation evaluates the
 * same rest layer and poses nothing, which is the purely linear prior.
 *
 * Pigmentation is sampled on immutable neutral source coordinates, then
 * gathered with the same region correspondence. It changes no position or
 * normal and follows both shape and articulated expression. Fields contain no
 * image data. A new model owns its arrays and materials; neither basis nor
 * edits mutate. Model structure and materials are admitted on the prepared
 * neutral. Repeated edits retain that structure and check their welded vertex
 * partition; a changed partition takes the full model gate again. Finite
 * normal construction and channel/material domains remain per-edit checks.
 * Export still admits Float32. Neither the rest layer nor the articulation
 * establishes nonpenetration; the contact census measures that separately.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Evaluates named shape and expression edits on one reusable connected prior without source images.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Admits sparse correspondence once, applies deterministic endpoint selection and reconstructs common normals before region separation.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-articulation Poses the mandible-bound and globe-bound tissue with one shared articulation before local expression detail.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-articulation Runs rest layer, landmarks, articulation and attachment posing in the order the specification fixes.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-skin-colour Carries numerical pigment with shared tissue correspondence independently of pose and illumination.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-skin-colour Samples metre-space envelopes on neutral vertices before gathering colours across material and UV seams.
 */
export function createHumanFaceBasisBuilder(
  input: IAutoMovieHumanFaceBasis,
): (document: IAutoMovieHumanFaceBasisDocument) => IAutoMovieModel {
  const basis = structuredClone(
    typia.assertEquals<IAutoMovieHumanFaceBasis>(input),
  );
  assertHumanFaceBasis(basis);
  const buildHair = createHumanFaceHairBuilder(basis);
  const surfaces = basis.surfaces.map((surface) => ({
    surface,
    regions: surface.regions.map((region) => ({
      region,
      evaluate: createHumanFaceBasisRegion(region),
    })),
  }));
  let partitions:
    | ReturnType<typeof createMeshWeldPartitionMatcher>[]
    | undefined;
  const build = (
    inputDocument: IAutoMovieHumanFaceBasisDocument,
  ): IAutoMovieModel => {
    const document =
      typia.assertEquals<IAutoMovieHumanFaceBasisDocument>(inputDocument);
    if (
      document.basis !== basis.id ||
      [document.id, document.name].some((id) => id.trim() === "")
    )
      throw new Error(
        "Facial edits need nonempty identities and the exact compiled basis revision.",
      );
    const surfaceIds = new Set(basis.surfaces.map((surface) => surface.id));
    for (const id of Object.keys(document.skin ?? {}))
      if (!surfaceIds.has(id))
        throw new Error("Pigmentation needs a resident basis surface: " + id);
    const state = humanFaceBasisWeights(basis, document);
    const materials = structuredClone(basis.materials);
    const materialMap = new Map(
      materials.map((material) => [material.id, material]),
    );
    for (const [id, override] of Object.entries(document.materials ?? {})) {
      const material = materialMap.get(id);
      const values = [
        ...Object.values(override.color ?? {}),
        ...(override.roughness === undefined ? [] : [override.roughness]),
      ];
      if (
        material === undefined ||
        values.some(
          (value) => !Number.isFinite(value) || value < 0 || value > 1,
        )
      )
        throw new Error(
          "Facial material overrides need existing IDs and finite [0,1] values.",
        );
      if (override.color !== undefined)
        material.baseColor = {
          ...material.baseColor,
          ...override.color,
          hex: null,
        };
      if (override.roughness !== undefined)
        material.roughness = override.roughness;
    }
    const rest = evaluateHumanFaceRest(basis, state);
    const motions =
      basis.articulation === undefined
        ? undefined
        : resolveHumanFaceArticulation(
            basis.articulation,
            state.weights,
            rest.landmarks,
          ).motions;
    const evaluated = new Map<string, readonly number[]>();
    const parts = surfaces.flatMap(({ surface, regions }, index) => {
      const fields = Object.hasOwn(document.skin ?? {}, surface.id)
        ? document.skin![surface.id]
        : undefined;
      let colors: number[] | undefined;
      if (fields !== undefined) {
        const sample = createPortraitColourField(fields);
        colors = [];
        for (let vertex = 0; vertex < surface.positions.length; vertex += 3)
          colors.push(...sample(surface.positions.slice(vertex, vertex + 3)));
      }
      const positions =
        motions !== undefined && (surface.attachments?.length ?? 0) > 0
          ? poseHumanFaceSurface(
              rest.surfaces[index],
              surface.attachments!,
              motions,
            )
          : rest.surfaces[index];
      const normals = portraitNormals(positions, surface.indices);
      evaluated.set(surface.id, positions);
      return regions.map(({ region, evaluate }) => ({
        id: region.id,
        name: region.id,
        material: region.material,
        geometry: {
          type: "mesh" as const,
          mesh: evaluate(positions, normals, colors),
        },
        attachedBone: null,
        transform: null,
      }));
    });
    const model: IAutoMovieModel = {
      id: document.id,
      name: document.name,
      origin: "imported",
      parts,
      materials,
      skeleton: null,
      body: null,
      asset: null,
    };
    // Fixed indices, UVs, references and resident finishes were admitted on the
    // neutral. Only deformation can change welded incidence; reuse the verdict
    // exactly while its equivalence classes stay fixed. Never assume an endpoint
    // cannot merge or split vertices merely because its scalar is in range.
    if (
      partitions === undefined ||
      parts.some(
        (part, index) => !partitions![index](part.geometry.mesh.positions),
      )
    ) {
      const validation = validateModel({ model });
      if (!validation.success)
        throw new Error(
          "The evaluated facial basis is not a valid resident model: " +
            JSON.stringify(validation),
        );
      if (partitions === undefined)
        partitions = parts.map((part) =>
          createMeshWeldPartitionMatcher(part.geometry.mesh.positions),
        );
    }
    if (document.hair !== undefined && document.hair !== null) {
      const hair = buildHair(document.hair, evaluated);
      if (
        hair.parts.some((part) =>
          model.parts.some((resident) => resident.id === part.id),
        ) ||
        hair.materials.some((material) =>
          model.materials.some((resident) => resident.id === material.id),
        )
      )
        throw new Error(
          "Numerical hair identities collide with resident face geometry or finishes.",
        );
      model.parts.push(...hair.parts);
      model.materials.push(...hair.materials);
      const validation = validateModel({ model });
      if (!validation.success)
        throw new Error(
          "The numerical hairstyle did not form a valid resident model: " +
            JSON.stringify(validation),
        );
    }
    return model;
  };
  build({
    id: basis.id,
    name: basis.id,
    basis: basis.id,
    shape: {},
    expression: {},
  });
  return build;
}
