import {
  applyHumanFaceSkin,
  type IAutoMovieHumanFaceSkin,
} from "@automovie/human";
import type { IAutoMovieMaterial, IAutoMovieModel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

const finish = (id: string): IAutoMovieMaterial => ({
  id,
  name: id,
  baseColor: { r: 0.5, g: 0.3, b: 0.2, a: 1, hex: null },
  roughness: 0.7,
  metallic: 0,
  opacity: 1,
  emissive: null,
  baseColorTexture: null,
  doubleSided: true,
});

/** A face of one part and three finishes, one of which already has a map. */
const face = (): IAutoMovieModel => ({
  id: "face",
  name: "face",
  origin: "imported",
  parts: [
    {
      id: "Human/skin",
      name: "Human/skin",
      material: "skin",
      geometry: {
        type: "mesh",
        mesh: {
          positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
          indices: [0, 1, 2],
          normals: null,
          uvs: [0, 0, 1, 0, 0, 1],
          skin: null,
        },
      },
      attachedBone: null,
      transform: null,
    },
  ],
  materials: [
    finish("skin"),
    finish("lips"),
    { ...finish("eyes"), baseColorTexture: "data:image/png;base64,RVlFUw==" },
  ],
  skeleton: null,
  body: null,
  asset: null,
});

const skin = (
  maps: IAutoMovieHumanFaceSkin["maps"],
): IAutoMovieHumanFaceSkin => ({
  version: "human-face-skin/1",
  id: "study-skin",
  basis: "study-basis",
  maps,
});

const painted = "data:image/png;base64,U0tJTg==";

/**
 * An appearance replaces the maps it names and leaves everything else alone.
 *
 * The basis has one flat colour per material and no map for skin, so the only
 * evidence an appearance arrived is that the named materials now carry maps.
 * What has to survive that is everything else: the geometry, the part order,
 * the untouched materials, and every numeric coefficient of the materials that
 * were touched. An appearance that also moved a base colour or a roughness
 * would be doing a second, unstated thing.
 *
 * Refusing an unknown material is the part worth holding. Silently ignoring it
 * leaves an author looking at an unchanged face with no way to distinguish an
 * appearance that failed to load from one that named the wrong surface.
 *
 * Scenarios:
 * 1. A named material gains its map; its colour, roughness and every other field are unchanged.
 * 2. Materials the appearance does not name keep whatever map they already had, including none.
 * 3. An existing map is replaced rather than merged.
 * 4. Geometry and part order are untouched, and neither input is mutated.
 * 5. Naming a material this face does not carry refuses.
 * 6. An appearance of no maps is accepted and changes nothing.
 */
export const test_subject_human_skin_appearance = (): void => {
  const model = face();
  const snapshot = JSON.stringify(model);
  const source = skin({ skin: { baseColorTexture: painted } });
  const authored = JSON.stringify(source);
  const dressed = applyHumanFaceSkin({ model, skin: source });

  TestValidator.equals(
    "the named material gains the map and keeps every other field",
    dressed.materials[0],
    { ...finish("skin"), baseColorTexture: painted },
  );
  TestValidator.equals(
    "an unnamed material without a map keeps having none",
    dressed.materials[1].baseColorTexture,
    null,
  );
  TestValidator.equals(
    "an unnamed material with a map keeps it",
    dressed.materials[2].baseColorTexture,
    "data:image/png;base64,RVlFUw==",
  );
  TestValidator.equals(
    "geometry and part order are untouched",
    dressed.parts,
    model.parts,
  );
  TestValidator.equals("the face is not mutated", JSON.stringify(model), snapshot);
  TestValidator.equals(
    "the appearance is not mutated",
    JSON.stringify(source),
    authored,
  );

  TestValidator.equals(
    "an existing map is replaced rather than merged",
    applyHumanFaceSkin({
      model,
      skin: skin({ eyes: { baseColorTexture: painted } }),
    }).materials[2].baseColorTexture,
    painted,
  );
  TestValidator.predicate(
    "naming a material this face does not carry refuses",
    throwsError(
      () =>
        applyHumanFaceSkin({
          model,
          skin: skin({ hair: { baseColorTexture: painted } }),
        }),
      "does not carry",
    ),
  );
  TestValidator.equals(
    "an appearance of no maps changes nothing",
    applyHumanFaceSkin({ model, skin: skin({}) }).materials,
    model.materials,
  );
};
