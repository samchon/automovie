import { validateModel } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieViolationKind,
  IAutoMovieAffordance,
  IAutoMovieBody,
  IAutoMovieBone,
  IAutoMovieConstraintViolation,
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createBicubicPlaneRecipe } from "../../../internal/createBicubicPlaneRecipe";
import { IDENTITY_TRANSFORM, createModel } from "../../../internal/fixtures";
import { hasViolation } from "../../../internal/predicates";

/**
 * `validateModel` admits a coherent model and names each broken rule by its
 * kind and path; every rule of its source has one decisive case here.
 *
 * Fixture: the standard one-part generated model (a 0.4 x 0.6 x 0.2 box in
 * material mat-1, on the standard skeleton), one rule broken at a time; a
 * one-triangle mesh for the mesh rules.
 *
 * Scenarios:
 *
 * 1. Admitted: the model; without a skeleton; a body of mass 2.5 with a centre of
 *    mass; a body at friction 0 and restitution 1; the triangle mesh with and
 *    without normals, UVs and indices; a two-joint skin; the bicubic plane
 *    recipe; a stack-top and a handle.
 * 2. Identity and graph: repeated material, part and bone ids; no parts; a bone
 *    whose parent `neck` is absent; a part's unknown material and bone.
 * 3. Geometry: a box of width 0 and a sphere of radius 0; mesh normals of the
 *    wrong length and index -1; a repeated skin joint; a two-scalar colour
 *    buffer; a bicubic patch of 15 controls (an admission warning, not a
 *    failure); a dual-quaternion skin on a part scaled (1, 2, 1).
 * 4. Transforms, joints and gaze: a part rotation with w = 2 and scale y = 0; a
 *    bone rest with the same; an inverted twist range; parallel flexion and
 *    abduction axes; a bone gaze on a rig without eyes.
 * 5. Body and capabilities: mass 0, friction 2, restitution -0.1, kinetic friction
 *    0.7 above friction 0.5, kinetic friction without friction; a profile with
 *    a blank name.
 * 6. Affordances and images: a repeated affordance id; a stack-top without an
 *    extent; a handle binding a part; an empty image; a repeated image id.
 *
 * The material rules are `test_unit_engine_validation_validate_model_material`.
 */
export function test_unit_engine_validation_validate_model(): void {
  const base: IAutoMovieModel = createModel();
  const skeleton: IAutoMovieSkeleton = base.skeleton!;
  const validate = (model: IAutoMovieModel): IAutoMovieValidation =>
    validateModel({ model });
  // Every rule is read before one verdict, so one run names every miss.
  const misses: string[] = [];
  const refused = (
    label: string,
    model: IAutoMovieModel,
    kinds: AutoMovieViolationKind[],
    path: string,
  ): void => {
    const result: IAutoMovieValidation = validate(model);
    if (
      !kinds.some((kind: AutoMovieViolationKind): boolean =>
        hasViolation(result, kind, path),
      )
    )
      misses.push(
        `${label} at ${path}: ${JSON.stringify(result.success ? (result.warnings ?? []) : result.violations.map((v) => [v.kind, v.path]))}`,
      );
  };
  const both: AutoMovieViolationKind[] = ["type", "range"];
  const part = (patch: Partial<IAutoMovieModelPart>): IAutoMovieModel => ({
    ...base,
    parts: [{ ...base.parts[0]!, ...patch }],
  });
  const bone = (patch: Partial<IAutoMovieBone>): IAutoMovieModel => ({
    ...base,
    skeleton: {
      ...skeleton,
      bones: skeleton.bones.map(
        (b: IAutoMovieBone, i: number): IAutoMovieBone =>
          i === 0 ? { ...b, ...patch } : b,
      ),
    },
  });
  const body = (b: Partial<IAutoMovieBody>): IAutoMovieModel => ({
    ...base,
    body: {
      mass: 1,
      centerOfMass: null,
      friction: 0.5,
      restitution: 0.5,
      ...b,
    },
  });
  const triangle: IAutoMovieMesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
    uvs: [0, 0, 1, 0, 0, 1],
    indices: [0, 1, 2],
    skin: null,
  };
  const skin: NonNullable<IAutoMovieMesh["skin"]> = {
    joints: ["leftUpperArm", "leftLowerArm"],
    boneIndices: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    weights: [0.7, 0.3, 0, 0, 0.5, 0.5, 0, 0, 1, 0, 0, 0],
  };
  const meshed = (mesh: IAutoMovieMesh): IAutoMovieModel =>
    part({ geometry: { type: "mesh", mesh } });
  const transform = (
    patch: Partial<IAutoMovieTransform>,
  ): IAutoMovieTransform => ({
    ...IDENTITY_TRANSFORM,
    ...patch,
  });
  const top: IAutoMovieAffordance = {
    id: "top",
    kind: "stack-top",
    frame: transform({ translation: { x: 0, y: 0.5, z: 0 } }),
    extent: [
      { x: -0.5, y: 0, z: -0.5 },
      { x: 0.5, y: 0, z: -0.5 },
      { x: 0.5, y: 0, z: 0.5 },
      { x: -0.5, y: 0, z: 0.5 },
    ],
  };
  const handle: IAutoMovieAffordance = {
    id: "grip",
    kind: "handle",
    frame: transform({ translation: { x: 0.3, y: 0.2, z: 0 } }),
    extent: null,
  };
  const plane = createBicubicPlaneRecipe();

  // 1.
  for (const [label, model] of [
    ["standard", base],
    ["object", { ...base, skeleton: null }],
    [
      "body",
      body({
        mass: 2.5,
        centerOfMass: { x: 0, y: 0.3, z: 0 },
        friction: 0.6,
        restitution: 0.2,
      }),
    ],
    ["boundary body", body({ friction: 0, restitution: 1 })],
    ["mesh", meshed(triangle)],
    [
      "minimal mesh",
      meshed({ ...triangle, normals: null, uvs: null, indices: null }),
    ],
    [
      "skin",
      meshed({ ...triangle, normals: null, uvs: null, indices: null, skin }),
    ],
    ["bicubic plane", part({ geometry: plane })],
    ["affordances", { ...base, affordances: [top, handle] }],
  ] satisfies [string, IAutoMovieModel][]) {
    const result: IAutoMovieValidation = validate(model);
    if (!result.success)
      misses.push(
        `${label} refused: ${JSON.stringify(result.violations.map((v) => [v.kind, v.path]))}`,
      );
  }

  // 2.
  const duplicate: IAutoMovieValidation = validate({
    ...base,
    materials: [base.materials[0]!, { ...base.materials[0]!, name: "again" }],
    parts: [base.parts[0]!, { ...base.parts[0]!, name: "again" }],
    skeleton: {
      ...skeleton,
      bones: [
        skeleton.bones[0]!,
        { ...skeleton.bones[1]!, bone: skeleton.bones[0]!.bone },
      ],
    },
  });
  for (const path of [
    "$input.materials[1].id",
    "$input.parts[1].id",
    "$input.skeleton.bones[1].bone",
  ])
    if (!hasViolation(duplicate, "type", path))
      misses.push(`duplicate at ${path}`);
  refused("no parts", { ...base, parts: [] }, ["type"], ".parts");
  const orphan = (
    name: AutoMovieHumanoidBone,
    parent: AutoMovieHumanoidBone | null,
  ): IAutoMovieBone => ({
    bone: name,
    parent,
    rest: IDENTITY_TRANSFORM,
    constraint: null,
  });
  refused(
    "missing parent",
    {
      ...base,
      skeleton: {
        ...skeleton,
        bones: [orphan("hips", null), orphan("spine", "neck")],
      },
    },
    ["type"],
    "$input.skeleton.bones[1].parent",
  );
  refused(
    "dangling material",
    part({ material: "does-not-exist" }),
    ["type"],
    ".material",
  );
  refused(
    "undeclared bone",
    part({ attachedBone: "jaw" }),
    ["type"],
    ".attachedBone",
  );

  // 3.
  refused(
    "zero width",
    part({
      geometry: {
        type: "primitive",
        shape: { type: "box", width: 0, height: 0.6, depth: 0.2 },
      },
    }),
    ["range"],
    ".width",
  );
  refused(
    "zero radius",
    part({
      geometry: { type: "primitive", shape: { type: "sphere", radius: 0 } },
    }),
    ["range"],
    ".radius",
  );
  const broken: IAutoMovieModel = meshed({
    ...triangle,
    normals: [0, 0, 1],
    indices: [0, -1, 2],
  });
  refused("normals length", broken, ["type"], ".mesh.normals");
  refused("index -1", broken, ["range"], ".mesh.indices[1]");
  refused(
    "repeated skin joint",
    meshed({
      ...triangle,
      normals: null,
      uvs: null,
      indices: null,
      skin: { ...skin, joints: ["leftUpperArm", "leftUpperArm"] },
    }),
    ["type"],
    ".skin.joints[1]",
  );
  refused(
    "colour buffer",
    meshed({ ...triangle, colors: [1, 0] }),
    ["type"],
    ".mesh.colors",
  );
  // A structurally invalid patch is an admission diagnostic: a warning.
  const omitted: IAutoMovieValidation = validate(
    part({
      geometry: {
        ...plane,
        patches: [
          {
            ...plane.patches[0]!,
            controlIds: plane.patches[0]!.controlIds.slice(1),
          },
        ],
      },
    }),
  );
  if (
    !omitted.success ||
    !(omitted.warnings ?? []).some(
      (v: IAutoMovieConstraintViolation): boolean =>
        v.kind === "type" && v.path === "$input.parts[0].geometry",
    )
  )
    misses.push("bicubic patch of 15 controls: no geometry warning");
  refused(
    "dual-quaternion scale",
    {
      ...meshed({
        ...triangle,
        normals: null,
        uvs: null,
        indices: null,
        skin: { ...skin, method: "dual-quaternion" },
      }),
      parts: [
        {
          ...base.parts[0]!,
          geometry: {
            type: "mesh",
            mesh: {
              ...triangle,
              normals: null,
              uvs: null,
              indices: null,
              skin: { ...skin, method: "dual-quaternion" },
            },
          },
          transform: transform({ scale: { x: 1, y: 2, z: 1 } }),
        },
      ],
    },
    ["range"],
    "parts[0].transform.scale",
  );

  // 4.
  const unit = IDENTITY_TRANSFORM.rotation;
  refused(
    "part rotation",
    part({ transform: transform({ rotation: { ...unit, w: 2 } }) }),
    both,
    "$input.parts[0].transform.rotation",
  );
  refused(
    "part scale",
    part({ transform: transform({ scale: { x: 1, y: 0, z: 1 } }) }),
    ["range"],
    "$input.parts[0].transform.scale.y",
  );
  refused(
    "rest rotation",
    bone({ rest: transform({ rotation: { ...unit, w: 2 } }) }),
    both,
    "$input.skeleton.bones[0].rest.rotation",
  );
  refused(
    "rest scale",
    bone({ rest: transform({ scale: { x: 1, y: 0, z: 1 } }) }),
    ["range"],
    "$input.skeleton.bones[0].rest.scale.y",
  );
  refused(
    "inverted twist",
    bone({
      constraint: {
        flexion: { min: -10, max: 10 },
        abduction: null,
        twist: { min: 15, max: -15 },
        swingDeg: 30,
      },
    }),
    both,
    "$input.skeleton.bones[0].constraint.twist",
  );
  refused(
    "parallel axes",
    bone({
      axes: {
        flexion: { x: 1, y: 0, z: 0 },
        abduction: { x: 1, y: 0, z: 0 },
        twist: { x: 0, y: 0, z: 1 },
      },
    }),
    ["range"],
    "$input.skeleton.bones[0].axes",
  );
  refused(
    "gaze without eyes",
    {
      ...base,
      lookAt: {
        type: "bone",
        horizontalInner: 45,
        horizontalOuter: 45,
        verticalDown: 30,
        verticalUp: 30,
      },
    },
    ["type"],
    "$input.lookAt.type",
  );

  // 5.
  refused("mass 0", body({ mass: 0 }), ["range"], ".body.mass");
  refused("friction 2", body({ friction: 2 }), ["range"], ".body.friction");
  refused(
    "restitution -0.1",
    body({ restitution: -0.1 }),
    ["range"],
    ".body.restitution",
  );
  refused(
    "kinetic above static",
    body({ friction: 0.5, kineticFriction: 0.7 }),
    ["range"],
    ".body.kineticFriction",
  );
  refused(
    "kinetic without static",
    {
      ...base,
      body: {
        mass: 1,
        centerOfMass: null,
        restitution: 0.5,
        kineticFriction: 0.3,
      },
    },
    ["type"],
    ".body.friction",
  );
  refused(
    "blank profile name",
    { ...base, profiles: [{ id: "p", name: " ", drivers: [], limits: [] }] },
    both,
    "$input.profiles[0].name",
  );

  // 6.
  refused(
    "affordance id",
    { ...base, affordances: [top, { ...handle, id: "top" }] },
    ["type"],
    ".affordances[1].id",
  );
  refused(
    "stack-top extent",
    { ...base, affordances: [{ ...top, extent: null }] },
    ["type"],
    ".affordances[0].extent",
  );
  refused(
    "handle parts",
    { ...base, affordances: [{ ...handle, parts: ["part-1"] }] },
    ["type"],
    ".affordances[0].parts",
  );
  refused(
    "empty image",
    { ...base, images: [{ id: "a", mimeType: "image/png", data: "" }] },
    ["type"],
    ".images[0].data",
  );
  refused(
    "image id",
    {
      ...base,
      images: [
        { id: "a", mimeType: "image/png", data: "" },
        { id: "a", mimeType: "image/png", data: "" },
      ],
    },
    ["type"],
    ".images[1].id",
  );

  TestValidator.equals("every rule decided", misses, []);
}
