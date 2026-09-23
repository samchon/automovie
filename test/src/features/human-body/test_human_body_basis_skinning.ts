import { Quaternion } from "@automovie/engine";
import {
  createHumanBodyBasisBuilder,
  skinHumanBodySurface,
} from "@automovie/human";
import type {
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose, throwsError, vclose } from "../internal/predicates";

/**
 * Skinned vertices walk their bone's arc, not the chord between endpoints,
 * and a vertex shared by two bones walks the screw motion between them: the
 * dual quaternion blend of two transforms about one axis is the rotation by
 * the weighted angle about that same pivot, so a blended vertex keeps its
 * distance from the axis where the linear mean of its rigid images would
 * flatten onto the pivot at 180 degrees or pinch under a twist. Every
 * expected position is hand-rotated from the fixture's rest coordinates about
 * the spine pivot (0,1,0); no expected number is read back from the builder.
 *
 * Scenarios:
 * 1. Spine flexion 90 degrees carries every top vertex to the hand-rotated
 *    position about the joint (0,1,0) around +X, and leaves the hips' vertices.
 * 2. At half flexion (45 degrees) each top vertex still sits at its rest
 *    distance from the pivot, which a linear chord would shorten by
 *    1 - cos(22.5 degrees) of the radius, and the posed bone transforms report
 *    the same pivot the vertices used.
 * 3. Normals are recomputed on the posed surface: the folded corner's unit
 *    normal keeps a positive Z and loses the +Y it had at rest, and the model
 *    remains a valid static resident model.
 * 4. The shaped landmark is the pivot: with `tall` the spine still rotates
 *    about (0,1,0) and the raised top face lands 1.5 m forward.
 * 5. A vertex bound half to the still hips and half to the spine at flexion
 *    90 lands on the 45 degree rotation about (0,1,0), not on the midpoint of
 *    its two rigid images.
 * 6. With the flexion range widened to 180 in a copy of the fixture, the same
 *    half-weighted vertex at flexion 180 lands on the 90 degree rotation and
 *    keeps its rest distance from the pivot axis, while the mean of its rigid
 *    images, the linear blend, sits on the axis itself. The fold is posed on
 *    the raised box (`tall`), because the 2 m box folded flat lands its rigid
 *    top ring on its bottom ring and the welded topology check refuses it.
 * 7. With the twist range widened to 90 in a copy, a top vertex bound to the
 *    spine turns 90 degrees about +Y through the axis and the half-weighted
 *    vertex turns 45 degrees at its rest radius, where the linear mean would
 *    shrink the radius by cos(45 degrees).
 * 8. Hemisphere alignment: skinning directly with the spine's posed rotation
 *    q and with -q gives the same positions, whether the blended vertex names
 *    the still hips or the turned spine as its first influence.
 * 9. A skin naming a bone the transforms lack is refused by name.
 */
export const test_human_body_basis_skinning = (): void => {
  const { basis, document } = humanBodyBasisFixture();
  const order = [...new Set(basis.surfaces[0].regions[0].indices)];
  const mesh = (model: IAutoMovieModel): IAutoMovieMesh => {
    const geometry = model.parts[0].geometry;
    if (geometry.type !== "mesh") throw new Error("Expected resident mesh.");
    return geometry.mesh;
  };
  const at = (model: IAutoMovieModel, vertex: number): IAutoMovieVector3 => {
    const i = order.indexOf(vertex) * 3;
    const p = mesh(model).positions;
    return { x: p[i], y: p[i + 1], z: p[i + 2] };
  };
  // Right-hand rotation about +X through (0, pivotY, 0): the spine's flexion.
  const rotated = (
    p: IAutoMovieVector3,
    degrees: number,
    pivotY = 1,
  ): IAutoMovieVector3 => {
    const r = (degrees * Math.PI) / 180;
    const y = p.y - pivotY;
    return {
      x: p.x,
      y: pivotY + y * Math.cos(r) - p.z * Math.sin(r),
      z: y * Math.sin(r) + p.z * Math.cos(r),
    };
  };
  // Right-hand rotation about +Y through the spine's axis: its twist.
  const twisted = (
    p: IAutoMovieVector3,
    degrees: number,
  ): IAutoMovieVector3 => {
    const r = (degrees * Math.PI) / 180;
    return {
      x: p.x * Math.cos(r) + p.z * Math.sin(r),
      y: p.y,
      z: -p.x * Math.sin(r) + p.z * Math.cos(r),
    };
  };
  const mean = (a: IAutoMovieVector3, b: IAutoMovieVector3) => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
  });
  // Distance from the flexion axis, the line through (0,1,0) along X.
  const fromPivot = (p: IAutoMovieVector3) => Math.hypot(p.y - 1, p.z);
  const build = createHumanBodyBasisBuilder(basis);
  const rest = build(document);
  const spinePose = (flexion: number | null, twist: number | null = null) => [
    { bone: "spine" as const, flexion, abduction: null, twist },
  ];
  const pose = (flexion: number) =>
    build({ ...document, pose: spinePose(flexion) });
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
      nclose(fromPivot(p), fromPivot(q), 1e-9) && vclose(p, rotated(q, 45)),
    );
  }
  const chord = mean(at(rest.model, 4), at(bent.model, 4));
  TestValidator.predicate(
    "the chord midpoint is not on the arc",
    fromPivot(chord) < fromPivot(at(rest.model, 4)) - 0.1,
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
  const tallBent = build({
    ...document,
    shape: { tall: 1 },
    pose: spinePose(90),
  });
  TestValidator.predicate(
    "raised top face rotates about the same pivot",
    vclose(at(tallBent.model, 6), rotated({ x: 0.1, y: 2.5, z: 0.2 }, 90)),
  );
  // Vertex 4 shared half and half between the hips and the spine, with the
  // spine's ranges widened so the fold and the twist can be posed.
  const blended = (first: 0 | 1) => {
    const fixture = humanBodyBasisFixture();
    fixture.basis.joints[1].constraint = {
      flexion: { min: -30, max: 180 },
      abduction: { min: -10, max: 10 },
      twist: { min: -90, max: 90 },
    };
    const skin = fixture.basis.surfaces[0].skin;
    skin.boneIndices.splice(16, 4, first, 1 - first, 0, 0);
    skin.weights.splice(16, 4, 0.5, 0.5, 0, 0);
    return fixture;
  };
  const mixed = blended(0);
  const mix = (
    flexion: number | null,
    twist: number | null = null,
    shape: Record<string, number> = {},
  ) =>
    at(
      createHumanBodyBasisBuilder(mixed.basis)({
        ...mixed.document,
        shape,
        pose: spinePose(flexion, twist),
      }).model,
      4,
    );
  const still = at(rest.model, 4);
  TestValidator.predicate(
    "half-weighted vertex turns half the flexion about the pivot",
    vclose(mix(90), rotated(still, 45)) &&
      !vclose(mix(90), mean(still, rotated(still, 90))),
  );
  // Folded flat, a 2 m box lands its rigid top ring exactly on its bottom
  // ring and the welded topology check refuses the model, so the fold is
  // posed on the raised box: vertex 4 rests at (-0.1, 2.5, -0.2) and its
  // rigid image at 180 sits at y = -0.5, clear of the ring at y = 0.
  const raised = { x: -0.1, y: 2.5, z: -0.2 };
  const folded = mix(180, null, { tall: 1 });
  TestValidator.predicate(
    "half-weighted vertex keeps its radius at the 180 degree fold",
    vclose(folded, rotated(raised, 90)) &&
      nclose(fromPivot(folded), fromPivot(raised), 1e-9) &&
      nclose(fromPivot(mean(raised, rotated(raised, 180))), 0, 1e-9),
  );
  const spun = createHumanBodyBasisBuilder(mixed.basis)({
    ...mixed.document,
    pose: spinePose(null, 90),
  });
  const radius = (p: IAutoMovieVector3) => Math.hypot(p.x, p.z);
  const turned = at(spun.model, 5);
  TestValidator.predicate(
    "spine vertex turns 90 degrees about +Y",
    vclose(turned, twisted(at(rest.model, 5), 90)),
  );
  const wrapped = mix(null, 90);
  TestValidator.predicate(
    "half-weighted vertex keeps its radius under a twist",
    vclose(wrapped, twisted(still, 45)) &&
      nclose(radius(wrapped), radius(still), 1e-9) &&
      nclose(
        radius(mean(still, twisted(still, 90))),
        radius(still) * Math.cos(Math.PI / 4),
        1e-9,
      ),
  );
  // Direct skinning with hand-built transforms: identity rest frames at the
  // fixture's joint positions, the spine turned by q or by -q.
  const identity = Quaternion.identity();
  const frame = (position: IAutoMovieVector3, rotation: IAutoMovieQuaternion) =>
    ({ position, rotation }) as const;
  const transforms = (rotation: IAutoMovieQuaternion) =>
    new Map([
      [
        "hips" as const,
        {
          rest: frame({ x: 0, y: 0, z: 0 }, identity),
          posed: frame({ x: 0, y: 0, z: 0 }, identity),
        },
      ],
      [
        "spine" as const,
        {
          rest: frame({ x: 0, y: 1, z: 0 }, identity),
          posed: frame({ x: 0, y: 1, z: 0 }, rotation),
        },
      ],
    ]);
  const q = Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90);
  const negated = { x: -q.x, y: -q.y, z: -q.z, w: -q.w };
  for (const first of [0, 1] as const) {
    const surface = blended(first).basis.surfaces[0];
    const skinned = (rotation: IAutoMovieQuaternion) => {
      const p = skinHumanBodySurface(
        surface.positions,
        surface.skin,
        transforms(rotation),
      );
      return { x: p[12], y: p[13], z: p[14] };
    };
    TestValidator.predicate(
      "a negated bone rotation skins the same, first influence " + first,
      vclose(skinned(q), rotated(still, 45)) &&
        vclose(skinned(negated), rotated(still, 45)),
    );
  }
  TestValidator.predicate(
    "a joint without transforms is refused by name",
    throwsError(
      () =>
        skinHumanBodySurface(
          basis.surfaces[0].positions,
          basis.surfaces[0].skin,
          new Map([["hips" as const, transforms(q).get("hips")!]]),
        ),
      "spine",
    ),
  );
};
