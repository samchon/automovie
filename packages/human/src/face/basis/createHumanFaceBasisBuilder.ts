import { validateModel } from "@automovie/engine";
import { createMeshWeldPartitionMatcher } from "@automovie/engine/math/createMeshWeldPartitionMatcher";
import type { IAutoMovieModel } from "@automovie/interface";
import typia from "typia";

import { createPortraitColourField } from "../anatomy/skin/createPortraitColourField";
import { portraitNormals } from "../mesh/portraitNormals";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import { applyHumanFaceRigidGroups } from "./applyHumanFaceRigidGroups";
import { assertHumanFaceBasis } from "./assertHumanFaceBasis";
import { createHumanFaceBasisRegion } from "./createHumanFaceBasisRegion";

/**
 * Compile a caller-owned connected facial prior into a deterministic builder.
 * The playground's connected-basis editor consumes this builder and exports its
 * resident model through exportHumanFace. Offline modelling tools supply the
 * licensed geometry; none run here and no source photo is needed for replay.
 *
 * For each vertex p, evaluation is p + sum(abs(weight) * endpointDelta),
 * then each shared basis corrective's endpoint at its own activation. Signed shape
 * controls select distinct authored endpoints. All surfaces use the same
 * channel order; normals are reconstructed before UV/material seams.
 * Declared rigid groups use a separate shape-only reference and replace their
 * performance target with fixed or least-squares proper rigid motion before
 * normal reconstruction. Shape-only correctives belong to that reference.
 * Pigmentation is sampled on immutable neutral source coordinates, then
 * gathered with the same region correspondence. It changes no position or
 * normal and follows both shape and expression. Fields contain no image data.
 *
 * Correctives supply authored interactions absent from a linear sum. Their
 * activation is a product of the clamped driving sides and vanishes when any
 * driver is absent. They must be justified by the measured combined shape;
 * overlapping endpoint support alone does not establish an incorrect sum.
 * A new model owns its arrays and materials; neither basis nor edits mutate.
 * Model structure and materials are admitted on the prepared neutral. Repeated
 * edits retain that structure and check their welded vertex partition; a changed
 * partition takes the full model gate again. Finite normal construction and
 * channel/material domains remain per-edit checks. Export still admits Float32.
 * Neither linear endpoints nor a rigid fit establish nonpenetration or a
 * physiological joint trajectory.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Evaluates named shape and expression edits on one reusable connected prior without source images.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Admits sparse correspondence once, applies deterministic endpoint selection and reconstructs common normals before region separation.
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
  const channels = new Map(
    basis.channels.map((channel) => [channel.id, channel]),
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
    const weights = new Map<string, number>();
    const surfaceIds = new Set(basis.surfaces.map((surface) => surface.id));
    for (const id of Object.keys(document.skin ?? {}))
      if (!surfaceIds.has(id))
        throw new Error("Pigmentation needs a resident basis surface: " + id);
    for (const kind of ["shape", "expression"] as const)
      for (const [name, weight] of Object.entries(document[kind])) {
        const channel = channels.get(name);
        if (
          channel === undefined ||
          channel.kind !== kind ||
          !Number.isFinite(weight) ||
          weight < channel.minimum ||
          weight > channel.maximum
        )
          throw new Error(
            "Unsupported or out-of-domain facial control: " + kind + "." + name,
          );
        weights.set(name, weight);
      }
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
    // Correctives are evaluated once, from the channel weights, and then
    // applied like any other endpoint. The activation is a product of the
    // clamped driving sides times the authored gain, capped at one: present
    // only when every driver is present, a quarter when two drivers are at
    // half. That is MetaHuman's `PSDNetImpl`, which computes
    // `min(1, weight * product of clamped inputs)` over a buffer it clamps to
    // [0,1] first, and the form matters more than the source: a sum here would
    // fire a corrective on one driver alone, which is the pose it was authored
    // to leave untouched. An input with a peak under one is an in-between: its
    // factor is a tent over the driver, one at the peak and zero at either end
    // of its span, which is the whole envelope unless the input names one.
    const activationOf = (corrective: {
      inputs: {
        channel: string;
        side: "positive" | "negative";
        peak?: number;
        between?: [number, number];
      }[];
      weight: number;
    }): number =>
      Math.min(
        1,
        corrective.inputs.reduce((total, input) => {
          const weight = weights.get(input.channel) ?? 0;
          const driver = input.side === "negative" ? -weight : weight;
          const peak = input.peak ?? 1;
          const [below, above] = input.between ?? [0, 1];
          const factor =
            driver <= peak
              ? (driver - below) / (peak - below)
              : above > peak
                ? (above - driver) / (above - peak)
                : 1;
          return total * Math.min(1, Math.max(0, factor));
        }, corrective.weight),
      );
    const applied = (basis.correctives ?? []).map((corrective) => ({
      target: corrective.target,
      activation: activationOf(corrective),
      shapeOnly: corrective.inputs.every(
        (input) => channels.get(input.channel)!.kind === "shape",
      ),
    }));
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
      const positions = surface.positions.slice();
      const shape =
        (surface.rigidGroups?.length ?? 0) > 0
          ? surface.positions.slice()
          : undefined;
      const accumulate = (
        name: string,
        gain: number,
        destination = positions,
      ): void => {
        const rows = surface.targets[name];
        if (rows === undefined) return;
        for (let i = 0; i < rows.length; i += 4)
          for (let axis = 0; axis < 3; axis++)
            destination[rows[i] * 3 + axis] += gain * rows[i + axis + 1];
      };
      for (const channel of basis.channels) {
        const weight = weights.get(channel.id) ?? 0;
        if (weight === 0) continue;
        accumulate(
          weight < 0 ? channel.negative! : channel.positive,
          Math.abs(weight),
        );
        if (shape !== undefined && channel.kind === "shape")
          accumulate(
            weight < 0 ? channel.negative! : channel.positive,
            Math.abs(weight),
            shape,
          );
      }
      for (const corrective of applied)
        if (corrective.activation > 0) {
          accumulate(corrective.target, corrective.activation);
          if (shape !== undefined && corrective.shapeOnly)
            accumulate(corrective.target, corrective.activation, shape);
        }
      if (shape !== undefined)
        applyHumanFaceRigidGroups(surface.rigidGroups!, shape, positions);
      const normals = portraitNormals(positions, surface.indices);
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
