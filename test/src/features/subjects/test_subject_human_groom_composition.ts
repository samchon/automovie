import {
  appendHumanFaceGroom,
  type IAutoMovieHumanFaceGroom,
} from "@automovie/human";
import type { IAutoMovieMaterial, IAutoMovieModel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

const finish: IAutoMovieMaterial = {
  id: "study-hair",
  name: "study-hair",
  baseColor: { r: 0.1, g: 0.08, b: 0.06, a: 1, hex: null },
  roughness: 0.4,
  metallic: 0,
  opacity: 1,
  emissive: null,
  baseColorTexture: null,
  doubleSided: true,
};

/** A bald face of one skin triangle and one resident finish. */
const bald = (): IAutoMovieModel => ({
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
          uvs: null,
          skin: null,
        },
      },
      attachedBone: null,
      transform: null,
    },
  ],
  materials: [
    {
      id: "skin",
      name: "skin",
      baseColor: { r: 0.5, g: 0.3, b: 0.2, a: 1, hex: null },
      roughness: 0.7,
      metallic: 0,
      opacity: 1,
      emissive: null,
      baseColorTexture: null,
      doubleSided: true,
    },
  ],
  skeleton: null,
  body: null,
  asset: null,
});

const groom = (over: Partial<IAutoMovieHumanFaceGroom> = {}) =>
  ({
    version: "human-face-groom/1",
    id: "study-groom",
    basis: "study-basis",
    finish,
    profile: {
      segments: 2,
      widthScale: 1,
      tipWidth: 0.5,
      taperStart: 0,
      seed: 7,
      fibres: 4,
      coverage: 0.9,
    },
    cards: [
      {
        part: "Human/skin",
        triangle: 0,
        weights: [0.5, 0] as readonly [number, number],
        guide: [
          [0, 0, 0],
          [0, 0, 0.1],
        ],
        across: [
          [0, 1, 0],
          [0, 1, 0],
        ],
        width: 0.012,
      },
    ],
    ...over,
  }) as IAutoMovieHumanFaceGroom;

/**
 * Composing a groom adds surfaces to a face and changes nothing already there.
 *
 * A connected facial basis has no hair, so the only evidence a groom arrived is
 * that the face gained parts it did not have. The resident parts must survive
 * that unchanged in order and identity, because an export written against the
 * bald face has to keep finding the same face in the same place.
 *
 * Both inputs are compared against a snapshot taken before the call. A
 * composition that mutated the face it was handed would still look correct in
 * its return value and would corrupt the next pose built from the same model.
 *
 * Scenarios:
 * 1. The face gains hair parts while its own parts keep their order and identity.
 * 2. The generated card finish joins the materials, alongside the base finish the groom brought.
 * 3. Neither the face nor the groom is mutated.
 * 4. A groom whose finish identity is already resident refuses rather than shadowing it.
 * 5. A groom of no locks adds no parts and no finish.
 */
export const test_subject_human_groom_composition = (): void => {
  const model = bald();
  const snapshot = JSON.stringify(model);
  const source = groom();
  const authored = JSON.stringify(source);
  const dressed = appendHumanFaceGroom({ model, groom: source });

  TestValidator.equals(
    "the resident parts keep their order and identity, and hair follows",
    dressed.parts.map((part) => part.id),
    ["Human/skin", "scalp-hair-cards"],
  );
  TestValidator.predicate(
    "the hair part carries geometry rather than an empty mesh",
    dressed.parts[1].geometry.type === "mesh" &&
      dressed.parts[1].geometry.mesh.positions.length > 0,
  );
  TestValidator.equals(
    "the base finish and its generated card finish are both resident",
    dressed.materials.map((material) => material.id),
    ["skin", "study-hair", dressed.parts[1].material!],
  );
  TestValidator.predicate(
    "the hair part names the generated finish, not the base one",
    dressed.parts[1].material !== finish.id,
  );
  TestValidator.equals("the face is not mutated", JSON.stringify(model), snapshot);
  TestValidator.equals(
    "the groom is not mutated",
    JSON.stringify(source),
    authored,
  );

  TestValidator.predicate(
    "a groom finish that is already resident refuses",
    throwsError(
      () =>
        appendHumanFaceGroom({
          model,
          groom: groom({ finish: { ...finish, id: "skin" } }),
        }),
      "collides with a finish this face already carries",
    ),
  );
  const empty = appendHumanFaceGroom({ model, groom: groom({ cards: [] }) });
  TestValidator.equals(
    "a groom of no locks adds no parts and no finish",
    [empty.parts.map((part) => part.id), empty.materials.map((m) => m.id)],
    [["Human/skin"], ["skin", "study-hair"]],
  );
};
