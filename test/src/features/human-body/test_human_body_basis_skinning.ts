import { createHumanBodyBasisBuilder } from "@automovie/human";
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose, vclose } from "../internal/predicates";

/**
 * Skinned vertices walk their bone's arc, not the chord between endpoints.
 *
 * Scenarios:
 * 1. Spine flexion 90 degrees carries every top vertex to the hand-rotated
 *    position about the joint (0,1,0) around +X, and leaves the hips' vertices.
 * 2. At half flexion (45 degrees) each top vertex still sits at its rest
 *    distance from the pivot, which a linear chord would shorten by
 *    1 - cos(22.5 degrees) of the radius.
 * 3. A vertex bound half to each bone lands at the mean of its two rigid
 *    images, and the posed bone transforms report the same pivot and rotation
 *    the vertices used.
 * 4. Normals are recomputed on the posed surface: the folded corner's unit
 *    normal keeps a positive Z and loses the +Y it had at rest, and the model
 *    remains a valid static resident model.
 * 5. The shaped landmark is the pivot: with `tall` the spine still rotates
 *    about (0,1,0) and the raised top face lands 1.5 m forward.
 */
export const test_human_body_basis_skinning = (): void => {
  const { basis, document } = humanBodyBasisFixture();
  const order = [...new Set(basis.surfaces[0].regions[0].indices)];
  const mesh = (model: IAutoMovieModel): IAutoMovieMesh => {
    const geometry = model.parts[0].geometry;
    if (geometry.type !== "mesh") throw new Error("Expected resident mesh.");
    return geometry.mesh;
  };
  const at = (model: IAutoMovieModel, vertex: number) => {
    const i = order.indexOf(vertex) * 3;
    const p = mesh(model).positions;
    return { x: p[i], y: p[i + 1], z: p[i + 2] };
  };
  const rotated = (
    p: { x: number; y: number; z: number },
    degrees: number,
    pivotY = 1,
  ) => {
    const r = (degrees * Math.PI) / 180;
    const y = p.y - pivotY;
    return {
      x: p.x,
      y: pivotY + y * Math.cos(r) - p.z * Math.sin(r),
      z: y * Math.sin(r) + p.z * Math.cos(r),
    };
  };
  const build = createHumanBodyBasisBuilder(basis);
  const rest = build(document);
  const pose = (flexion: number) =>
    build({
      ...document,
      pose: [{ bone: "spine", flexion, abduction: null, twist: null }],
    });
  const bent = pose(90);
  for (const vertex of [4, 5, 6, 7])
    TestValidator.predicate(
      "top vertex " + vertex + " follows the arc at 90",
      vclose(at(bent.model, vertex), rotated(at(rest.model, vertex), 90)),
    );
  for (const vertex of [0, 1, 2, 3])
    TestValidator.predicate(
      "hips vertex " + vertex + " stays",
      vclose(at(bent.model, vertex), at(rest.model, vertex)),
    );
  const half = pose(45);
  for (const vertex of [4, 5, 6, 7]) {
    const p = at(half.model, vertex);
    const q = at(rest.model, vertex);
    TestValidator.predicate(
      "half flexion keeps the rest radius " + vertex,
      nclose(Math.hypot(p.y - 1, p.z), Math.hypot(q.y - 1, q.z), 1e-9) &&
        vclose(p, rotated(q, 45)),
    );
  }
  const chord = {
    y: (at(rest.model, 4).y + at(bent.model, 4).y) / 2,
    z: (at(rest.model, 4).z + at(bent.model, 4).z) / 2,
  };
  TestValidator.predicate(
    "the chord midpoint is not on the arc",
    Math.hypot(chord.y - 1, chord.z) <
      Math.hypot(at(rest.model, 4).y - 1, at(rest.model, 4).z) - 0.1,
  );
  const spine = bent.bones.find((bone) => bone.bone === "spine")!;
  TestValidator.predicate(
    "posed bone reports the pivot",
    vclose(spine.posed.position, { x: 0, y: 1, z: 0 }) &&
      vclose(spine.rest.position, { x: 0, y: 1, z: 0 }),
  );
  const normals = mesh(bent.model).normals!;
  const restNormals = mesh(rest.model).normals!;
  const top = order.indexOf(6) * 3;
  // The corner's rest normal averages +X, +Y and +Z faces; after the upper
  // half folds forward the top face points +Z and the corner turns toward
  // -Y, so the recomputed normal is unit, carries a positive Z, and is not
  // the rest normal carried along.
  TestValidator.predicate(
    "normals are recomputed on the posed surface",
    nclose(Math.hypot(normals[top], normals[top + 1], normals[top + 2]), 1) &&
      normals[top + 2] > 0 &&
      normals[top + 1] < restNormals[top + 1] &&
      restNormals[top + 1] > 0,
  );
  TestValidator.equals(
    "posed model has no skeleton",
    bent.model.skeleton,
    null,
  );
  const blended = humanBodyBasisFixture();
  blended.basis.surfaces[0].skin.boneIndices.splice(16, 4, 0, 1, 0, 0);
  blended.basis.surfaces[0].skin.weights.splice(16, 4, 0.5, 0.5, 0, 0);
  const mixed = createHumanBodyBasisBuilder(blended.basis)({
    ...blended.document,
    pose: [{ bone: "spine", flexion: 90, abduction: null, twist: null }],
  });
  const rigid = rotated(at(rest.model, 4), 90);
  const still = at(rest.model, 4);
  TestValidator.predicate(
    "half-weighted vertex is the mean of its rigid images",
    vclose(at(mixed.model, 4), {
      x: (rigid.x + still.x) / 2,
      y: (rigid.y + still.y) / 2,
      z: (rigid.z + still.z) / 2,
    }),
  );
  const tallBent = build({
    ...document,
    shape: { tall: 1 },
    pose: [{ bone: "spine", flexion: 90, abduction: null, twist: null }],
  });
  TestValidator.predicate(
    "raised top face rotates about the same pivot",
    vclose(at(tallBent.model, 6), rotated({ x: 0.1, y: 2.5, z: 0.2 }, 90)),
  );
};
