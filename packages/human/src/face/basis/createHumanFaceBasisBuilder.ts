import { validateModel } from "@automovie/engine";
import { createMeshWeldPartitionMatcher } from "@automovie/engine/math/createMeshWeldPartitionMatcher";
import type { IAutoMovieModel } from "@automovie/interface";
import typia from "typia";

import { createHumanFaceIrisPigment } from "../anatomy/eye/createHumanFaceIrisPigment";
import { assertHumanFaceHair } from "../anatomy/hair/assertHumanFaceHair";
import { createHumanFaceHairBuilder } from "../anatomy/hair/createHumanFaceHairBuilder";
import { createHumanFaceHairResultCache } from "../anatomy/hair/createHumanFaceHairResultCache";
import { createHumanFaceScalpTint } from "../anatomy/hair/createHumanFaceScalpTint";
import { createPortraitColourField } from "../anatomy/skin/createPortraitColourField";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanFaceContactSummary } from "../structures/IAutoMovieHumanFaceContactSummary";
import { assertHumanFaceBasis } from "./assertHumanFaceBasis";
import { bakeHumanFaceOcclusion } from "./bakeHumanFaceOcclusion";
import { createHumanFaceBasisPoseCache } from "./createHumanFaceBasisPoseCache";
import { createHumanFaceBasisPoseEvaluator } from "./createHumanFaceBasisPoseEvaluator";
import { createHumanFaceBasisRegion } from "./createHumanFaceBasisRegion";
import { createHumanFaceFibrePigment } from "./createHumanFaceFibrePigment";
import { createHumanFaceOcclusionCache } from "./createHumanFaceOcclusionCache";
import { humanFaceBasisWeights } from "./humanFaceBasisWeights";
import { liftHumanFaceColours } from "./liftHumanFaceColours";

/**
 * Compile a caller-owned connected facial prior into a deterministic builder.
 * The playground's connected-basis editor consumes this builder and exports its
 * resident model through exportHumanFace. Offline modelling tools supply the
 * licensed geometry; none run here and no source photo is needed for replay.
 *
 * The order per document is fixed and is what the specification states:
 * channel weights and corrective activations (`humanFaceBasisWeights`), then
 * the rest layer of every surface and landmark (`evaluateHumanFaceRest`:
 * `p + sum(|weight| * endpoint) + sum(activation * corrective)`, the closure
 * channel of a contact basis excepted), then the articulation read off the
 * shaped landmarks (`resolveHumanFaceArticulation`), then on a contact basis
 * the apertures of the posed vertex pairs (`measureHumanFaceAperture`) and
 * the closure rows added to the rest layer scaled by weight and aperture
 * ratio, then each attached surface posed through its sparse weights
 * (`poseHumanFaceSurface`), then the tongue's passage judged
 * (`evaluateHumanFacePassage`) and soft tissue held outside the dental
 * colliders (`resolveHumanFaceContact`), then common normals and region
 * separation. Shape is identity, a joint's centre is identity, and the
 * expression rows of an articulated basis are rest-space residuals over the
 * joint motion, so a mandibular arch stays a rigid body on the arc at every
 * fraction of opening and the lips, lining and tongue bound to it take the
 * same transform before their own tissue rows are added. A basis without
 * articulation evaluates the same rest layer and poses nothing, which is the
 * purely linear prior; a basis without contact stops after posing.
 * The pose evaluator owns that sequence in one module. The builder retains
 * only the latest channel-weight vector and its posed positions, contact
 * summary and common normals. An appearance-only change reuses those arrays,
 * while each emitted region still gathers owned copies. Hair is generated
 * again when the pose or its own numerical layers change; other edits receive
 * a copy of the last generated cards and finish. Shape or expression changes
 * replace the cached pose. Observers receive a copy of the contact summary
 * so they cannot modify a later reused report. A hair result is certified only
 * after the complete resident model passes validateModel. On a certified hit,
 * the current base model still takes the model gate, and the part/material ID
 * collision check still runs before composition; the engine's model validator
 * has no cross-part geometry test beyond references and unique IDs.
 *
 * Pigmentation is sampled on immutable neutral source coordinates, then
 * gathered with the same region correspondence; the scalp under a hair
 * document's populations is tinted toward the hair colour by
 * `createHumanFaceScalpTint`, as a further gain on it. It changes no position or
 * normal and follows both shape and articulated expression. A document's iris
 * pigments repaint only the anatomical iris disc of the eye texture
 * (`createHumanFaceIrisPigment`) after the material overrides, so an override
 * of the eye's colour still multiplies the repainted texture. Fields contain no
 * image data. A new model owns its arrays and materials; neither basis nor
 * edits mutate. Model structure and materials are admitted on the prepared
 * neutral. Repeated edits retain that structure and check their welded vertex
 * partition; a changed partition takes the full model gate again. Finite
 * normal construction and channel/material domains remain per-edit checks.
 * Export still admits Float32. The contact stage establishes only the floor
 * rule it states and the passage it refuses; the crossing census still
 * measures the rest. An `observe` callback receives each successful build's
 * contact summary, or null on a basis without contact, so a runtime can
 * report it without evaluating twice. With `occlusion`, each opaque material
 * with UVs of the finished face (before any hair) takes the ambient
 * occlusion baked from the evaluated geometry (`bakeHumanFaceOcclusion`) as
 * its occlusion texture. The resulting image is reused while the admitted
 * pose stays the same: the source material's opaque classification is fixed,
 * and colour, roughness and fibre edits do not change the geometry the rays
 * read. Without the option no texture is baked. A skin field that
 * lightens a region past its material (a gain over one) is folded into the
 * material's base colour so vertex colours stay in [0, 1] and every albedo
 * is kept (`liftHumanFaceColours`); an albedo past one refuses.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-surface-maps Bakes the optional ambient occlusion of the evaluated face into its materials without changing geometry.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Same edits yield the same model; shape and expression are read from the same base under one evaluation order.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Evaluates rest, articulation and contact in the specified order and gates on the neutral once.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-articulation Applies one mandibular and two ocular transforms through shared attachments before any local expression is read.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-articulation Evaluates rest layer, shaped landmarks, joint resolution, attached posing and normals in that order.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-contact Scales lip closure to the aperture it closes and judges tongue passage and tissue contact on the same articulated state.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-contact Runs aperture measurement, scaled closure, posing, passage and floor resolution in the specified order.
 */
export function createHumanFaceBasisBuilder(
  input: IAutoMovieHumanFaceBasis,
  options?: {
    observe?: (contact: IAutoMovieHumanFaceContactSummary | null) => void;
    occlusion?: { rays: number; size: number };
  },
): (document: IAutoMovieHumanFaceBasisDocument) => IAutoMovieModel {
  const basis = structuredClone(
    typia.assertEquals<IAutoMovieHumanFaceBasis>(input),
  );
  assertHumanFaceBasis(basis);
  const buildHair = createHumanFaceHairResultCache(
    createHumanFaceHairBuilder(basis),
  );
  const scalpTint = createHumanFaceScalpTint(basis);
  const irisPigment = createHumanFaceIrisPigment(basis);
  const fibrePigment = createHumanFaceFibrePigment();
  const evaluatePose = createHumanFaceBasisPoseCache(
    basis.channels,
    createHumanFaceBasisPoseEvaluator(basis),
  );
  const occlusion =
    options?.occlusion === undefined ? undefined : { ...options.occlusion };
  const bakeOcclusion =
    occlusion === undefined
      ? undefined
      : createHumanFaceOcclusionCache((model) =>
          bakeHumanFaceOcclusion(model, occlusion),
        );
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
    fibrePigment(document.materials, materials);
    irisPigment(document.iris, materials);
    const pose = evaluatePose(state, document.shape);
    const { positions: posed, normals, summary } = pose;
    const evaluated = new Map<string, readonly number[]>();
    const tints = scalpTint(document.hair, materials);
    const parts = surfaces.flatMap(({ surface, regions }) => {
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
      // The scalp under hair takes the hair's colour, as a further gain on
      // whatever pigmentation the document painted.
      const tint = tints.get(surface.id);
      if (tint !== undefined)
        colors =
          colors === undefined
            ? tint.slice()
            : colors.map((value, at) => value * tint[at]);
      const positions = posed.get(surface.id)!;
      const surfaceNormals = normals.get(surface.id)!;
      evaluated.set(surface.id, positions);
      return regions.map(({ region, evaluate }) => ({
        id: region.id,
        name: region.id,
        material: region.material,
        geometry: {
          type: "mesh" as const,
          mesh: evaluate(positions, surfaceNormals, colors),
        },
        attachedBone: null,
        transform: null,
      }));
    });
    // Before validation, which a fixed weld partition may skip: a vertex
    // colour never leaves [0, 1].
    liftHumanFaceColours(parts, materialMap);
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
    if (bakeOcclusion !== undefined)
      for (const [id, uri] of bakeOcclusion(pose, model))
        materialMap.get(id)!.occlusionTexture = uri;
    if (document.hair !== undefined && document.hair !== null) {
      assertHumanFaceHair(document.hair);
      const generated = buildHair(document.hair, evaluated, pose);
      const hair = generated.value;
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
      // validateModel checks each part/material locally plus IDs and references.
      // A certified hair copy passed the full model gate for this exact pose
      // and hair document. Admit the current face/material changes separately
      // before composing it; the collision check above settles shared IDs.
      if (generated.certified) {
        const validation = validateModel({ model });
        if (!validation.success)
          throw new Error(
            "The numerical hairstyle did not form a valid resident model: " +
              JSON.stringify(validation),
          );
      }
      model.parts.push(...hair.parts);
      model.materials.push(...hair.materials);
      if (!generated.certified) {
        const validation = validateModel({ model });
        if (!validation.success)
          throw new Error(
            "The numerical hairstyle did not form a valid resident model: " +
              JSON.stringify(validation),
          );
        generated.certify();
      }
    }
    options?.observe?.(summary === null ? null : structuredClone(summary));
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
