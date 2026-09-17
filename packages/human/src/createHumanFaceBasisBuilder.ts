import { validateModel } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";
import typia from "typia";

import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
} from "./IAutoMovieHumanFaceBasis";
import { assertHumanFaceBasis } from "./assertHumanFaceBasis";
import { portraitNormals } from "./geometry/geometry";
import { humanFaceBasisRegion } from "./humanFaceBasisRegions";

/**
 * Compile a caller-owned connected facial prior into a deterministic builder.
 * The playground's connected-basis editor consumes this builder and exports its
 * resident model through exportHumanFace. Offline modelling tools supply the
 * licensed geometry; none run here and no source photo is needed for replay.
 *
 * For each vertex p, evaluation is p + sum(abs(weight) * endpointDelta).
 * Signed shape controls select distinct authored endpoints. All surfaces use
 * the same channel order; normals are reconstructed before UV/material seams.
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
    const parts = basis.surfaces.flatMap((surface) => {
      const positions = surface.positions.slice();
      for (const channel of basis.channels) {
        const weight = weights.get(channel.id) ?? 0;
        if (weight === 0) continue;
        const name = weight < 0 ? channel.negative! : channel.positive;
        const rows = surface.targets[name];
        if (rows === undefined) continue;
        for (let i = 0; i < rows.length; i += 4)
          for (let axis = 0; axis < 3; axis++)
            positions[rows[i] * 3 + axis] +=
              Math.abs(weight) * rows[i + axis + 1];
      }
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
