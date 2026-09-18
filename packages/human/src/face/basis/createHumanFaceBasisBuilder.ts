import { validateModel } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";
import typia from "typia";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import { assertHumanFaceBasis } from "./assertHumanFaceBasis";
import { portraitNormals } from "../mesh/portraitNormals";
import { humanFaceBasisRegion } from "./humanFaceBasisRegion";

/**
 * Compile a caller-owned connected facial prior into a deterministic builder.
 * The playground's connected-basis editor consumes this builder and exports its
 * resident model through exportHumanFace. Offline modelling tools supply the
 * licensed geometry; none run here and no source photo is needed for replay.
 *
 * For each vertex p, evaluation is p + sum(abs(weight) * endpointDelta), then
 * plus each corrective's endpoint at its own activation. Signed shape controls
 * select distinct authored endpoints. All surfaces use the same channel order;
 * normals are reconstructed before UV/material seams.
 *
 * Correctives are what a purely linear prior cannot express: two endpoints that
 * move the same tissue sum to a face neither of them describes. The activation
 * is a product of the clamped driving sides, so it is absent unless the whole
 * combination is, which is what separates a corrective from another control.
 * A new model owns its arrays and materials; neither basis nor edits mutate.
 * The existing model and Float32 exporter admission remain authoritative.
 * Linear endpoints do not establish collision-free or physiological movement.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Evaluates named shape and expression edits on one reusable connected prior without source images.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Admits sparse correspondence once, applies deterministic endpoint selection and reconstructs common normals before region separation.
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
  return (inputDocument) => {
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
    // A per-vertex identity names surfaces and vertices of this basis. A row
    // that names neither is a document written against something else, and
    // silently skipping it would build a face that is not the one asked for.
    for (const [id, rows] of Object.entries(document.identity ?? {})) {
      const surface = basis.surfaces.find((one) => one.id === id);
      const vertices = surface === undefined ? 0 : surface.positions.length / 3;
      if (
        surface === undefined ||
        rows.length % 4 !== 0 ||
        rows.some((value) => !Number.isFinite(value))
      )
        throw new Error(
          "Per-vertex identity needs finite [vertex, dx, dy, dz] rows on a surface this basis declares: " +
            id,
        );
      let previous = -1;
      for (let i = 0; i < rows.length; i += 4) {
        const vertex = rows[i];
        if (!Number.isInteger(vertex) || vertex <= previous || vertex >= vertices)
          throw new Error(
            "Per-vertex identity rows are strictly increasing vertices of " +
              id +
              ", within its " +
              vertices +
              " vertices.",
          );
        previous = vertex;
      }
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
    // to leave untouched.
    const applied = (basis.correctives ?? []).map((corrective) => ({
      target: corrective.target,
      activation: Math.min(
        1,
        corrective.inputs.reduce((total, input) => {
          const weight = weights.get(input.channel) ?? 0;
          const driver = input.side === "negative" ? -weight : weight;
          return total * Math.min(1, Math.max(0, driver));
        }, corrective.weight),
      ),
    }));
    const parts = basis.surfaces.flatMap((surface) => {
      const positions = surface.positions.slice();
      const accumulate = (name: string, gain: number): void => {
        const rows = surface.targets[name];
        if (rows === undefined) return;
        for (let i = 0; i < rows.length; i += 4)
          for (let axis = 0; axis < 3; axis++)
            positions[rows[i] * 3 + axis] += gain * rows[i + axis + 1];
      };
      // Identity first, because identity is what the neutral is. The channels
      // then move this face from its own neutral rather than from the shared
      // one; applying the delta afterwards would make a wider jaw open
      // differently from a narrow one for no authored reason.
      const identity = document.identity?.[surface.id];
      if (identity !== undefined)
        for (let i = 0; i < identity.length; i += 4)
          for (let axis = 0; axis < 3; axis++)
            positions[identity[i] * 3 + axis] += identity[i + axis + 1];
      for (const channel of basis.channels) {
        const weight = weights.get(channel.id) ?? 0;
        if (weight === 0) continue;
        accumulate(
          weight < 0 ? channel.negative! : channel.positive,
          Math.abs(weight),
        );
      }
      for (const corrective of applied)
        if (corrective.activation > 0)
          accumulate(corrective.target, corrective.activation);
      const normals = portraitNormals(positions, surface.indices);
      return surface.regions.map((region) => ({
        id: region.id,
        name: region.id,
        material: region.material,
        geometry: {
          type: "mesh" as const,
          mesh: humanFaceBasisRegion(positions, normals, region),
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
    const validation = validateModel({ model });
    if (!validation.success)
      throw new Error(
        "The evaluated facial basis is not a valid resident model: " +
          JSON.stringify(validation),
      );
    return model;
  };
}
