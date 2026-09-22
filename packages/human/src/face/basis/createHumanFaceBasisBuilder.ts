import { validateModel } from "@automovie/engine";
import { createMeshWeldPartitionMatcher } from "@automovie/engine/math/createMeshWeldPartitionMatcher";
import type { IAutoMovieModel } from "@automovie/interface";
import typia from "typia";

import { createHumanFaceHairBuilder } from "../anatomy/hair/createHumanFaceHairBuilder";
import { createHumanFaceScalpTint } from "../anatomy/hair/createHumanFaceScalpTint";
import { createPortraitColourField } from "../anatomy/skin/createPortraitColourField";
import { portraitNormals } from "../mesh/portraitNormals";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanFaceContactSummary } from "../structures/IAutoMovieHumanFaceContactSummary";
import { assertHumanFaceBasis } from "./assertHumanFaceBasis";
import { createHumanFaceBasisRegion } from "./createHumanFaceBasisRegion";
import { evaluateHumanFacePassage } from "./evaluateHumanFacePassage";
import { evaluateHumanFaceRest } from "./evaluateHumanFaceRest";
import { humanFaceBasisWeights } from "./humanFaceBasisWeights";
import { measureHumanFaceAperture } from "./measureHumanFaceAperture";
import { poseHumanFaceSurface } from "./poseHumanFaceSurface";
import { resolveHumanFaceArticulation } from "./resolveHumanFaceArticulation";
import { resolveHumanFaceContact } from "./resolveHumanFaceContact";

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
 *
 * Pigmentation is sampled on immutable neutral source coordinates, then
 * gathered with the same region correspondence; the scalp under a hair
 * document's populations is tinted toward the hair colour by
 * `createHumanFaceScalpTint`, as a further gain on it. It changes no position or
 * normal and follows both shape and articulated expression. Fields contain no
 * image data. A new model owns its arrays and materials; neither basis nor
 * edits mutate. Model structure and materials are admitted on the prepared
 * neutral. Repeated edits retain that structure and check their welded vertex
 * partition; a changed partition takes the full model gate again. Finite
 * normal construction and channel/material domains remain per-edit checks.
 * Export still admits Float32. The contact stage establishes only the floor
 * rule it states and the passage it refuses; the crossing census still
 * measures the rest. An `observe` callback receives each successful build's
 * contact summary, or null on a basis without contact, so a runtime can
 * report it without evaluating twice.
 *
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
  },
): (document: IAutoMovieHumanFaceBasisDocument) => IAutoMovieModel {
  const basis = structuredClone(
    typia.assertEquals<IAutoMovieHumanFaceBasis>(input),
  );
  assertHumanFaceBasis(basis);
  const buildHair = createHumanFaceHairBuilder(basis);
  const scalpTint = createHumanFaceScalpTint(basis);
  const surfaces = basis.surfaces.map((surface) => ({
    surface,
    regions: surface.regions.map((region) => ({
      region,
      evaluate: createHumanFaceBasisRegion(region),
    })),
  }));
  const closure = new Set(
    basis.contact === undefined ? [] : [basis.contact.closure.channel],
  );
  const shapeChannels = new Set(
    basis.channels
      .filter((channel) => channel.kind === "shape")
      .map((channel) => channel.id),
  );
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
    const rest = evaluateHumanFaceRest(basis, state, closure);
    const motions =
      basis.articulation === undefined
        ? undefined
        : resolveHumanFaceArticulation(
            basis.articulation,
            state.weights,
            rest.landmarks,
          ).motions;
    let summary: IAutoMovieHumanFaceContactSummary | null = null;
    let shaped: ReturnType<typeof evaluateHumanFaceRest> | undefined;
    let frame: ReturnType<typeof measureHumanFaceAperture> | undefined;
    const contact = basis.contact;
    if (contact !== undefined) {
      shaped = evaluateHumanFaceRest(basis, {
        weights: new Map(
          [...state.weights].filter(([id]) => shapeChannels.has(id)),
        ),
        activations: state.activations.filter((one) => one.shapeOnly),
      });
      const referenced = evaluateHumanFaceRest(
        basis,
        humanFaceBasisWeights(basis, {
          shape: document.shape,
          expression: { [contact.closure.reference]: 1 },
        }),
      );
      frame = measureHumanFaceAperture(
        basis,
        contact,
        shaped,
        referenced,
        rest,
        motions!,
      );
      const weight = state.weights.get(contact.closure.channel) ?? 0;
      const gain = weight * frame.closureRatio;
      const endpoint = basis.channels.find(
        (channel) => channel.id === contact.closure.channel,
      )!.positive;
      if (gain !== 0)
        basis.surfaces.forEach((surface, index) => {
          const rows = surface.targets[endpoint];
          if (rows === undefined) return;
          const positions = rest.surfaces[index];
          for (let i = 0; i < rows.length; i += 4)
            for (let axis = 0; axis < 3; axis++)
              positions[rows[i] * 3 + axis] += gain * rows[i + axis + 1];
        });
    }
    const posed = new Map<string, number[]>();
    basis.surfaces.forEach((surface, index) => {
      posed.set(
        surface.id,
        motions !== undefined && (surface.attachments?.length ?? 0) > 0
          ? poseHumanFaceSurface(
              rest.surfaces[index],
              surface.attachments!,
              motions,
            )
          : rest.surfaces[index],
      );
    });
    if (contact !== undefined) {
      // The lips are read again after closure: passage and the summary judge
      // the seam the render shows, not the aperture the closure was scaled to.
      const lips = posed.get(contact.lips.surface)!;
      const seam = [0, 1, 2].reduce(
        (total, axis) =>
          total +
          (lips[3 * contact.lips.upper + axis] -
            lips[3 * contact.lips.lower + axis]) *
            [frame!.up.x, frame!.up.y, frame!.up.z][axis],
        0,
      );
      frame = { ...frame!, lips: { ...frame!.lips, gap: seam } };
      const passage = evaluateHumanFacePassage(
        contact,
        posed.get(contact.passage.surface)!,
        frame,
      );
      const resolved = resolveHumanFaceContact(
        basis,
        contact,
        posed,
        new Map(
          basis.surfaces.map((surface, index) => [
            surface.id,
            shaped!.surfaces[index],
          ]),
        ),
      );
      summary = {
        interlabialMetres: frame!.lips.gap,
        interincisalMetres: frame!.incisors.gap,
        closureRatio: frame!.closureRatio,
        passage,
        resolved,
      };
    }
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
    options?.observe?.(summary);
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
