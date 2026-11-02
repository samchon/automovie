import {
  type IAutoMovieResolvedBone,
  resolveMorphTargetWeights,
  resolvePose,
  skinAutoMovieMesh,
} from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshMorphTarget,
  IAutoMovieMeshSkin,
  IAutoMovieModel,
  IAutoMoviePose,
} from "@automovie/interface";
import {
  type IAutoMovieModelObject,
  type IAutoMovieRenderModeHandle,
  applyPose,
  applyRenderMode,
  buildModel,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createSkinnedTubeModel } from "../internal/createSkinnedTubeModel";

/**
 * Every CPU consumer of a posed skin reads the deformation its shader draws: vertex queries, bounds, culling spheres, Box3 framing and raycasts follow the skin's own method after morph targets, and neutral restoration returns them to rest. The unit observes Three objects built by buildModel and posed by applyPose, against the engine's skinAutoMovieMesh, not GPU pixels.
 *
 * Scenarios:
 * 1. For a dual-quaternion and a linear tube under a non-identity part transform, a 90 degree spine bend, a translated and rotated root and a pose-driven morph target, every world vertex query equals skinAutoMovieMesh of the same pose within 1e-6 m.
 * 2. Box3.setFromObject and the mesh's bounding sphere contain every posed vertex, and the box is the exact posed extent grown by no more than the stated GPU tolerance plus 1e-6 m.
 * 3. A dual-quaternion tube's posed box is not the linear blend's box of the same pose: the bend's outer side differs by more than 1 cm.
 * 4. A ray aimed at a posed outer-bend vertex hits at that vertex's distance within 1e-5 m.
 * 5. Neutral restoration (no joints, null root) returns the box to the rest build's box and the driven morph influence to zero.
 * 6. An outline shell clone keeps the dual-quaternion method and answers the same vertex queries.
 * 7. The depth pass and the outline shell apply morph targets before skinning in their vertex shaders.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds through buildModel, poses through applyPose and reads getVertexPosition, Box3.setFromObject, boundingSphere, Raycaster hits, clone queries and render-mode shader sources; catches Three's linear CPU path on a dual-quaternion skin, rest or stale bounds after a pose, bounds without the morph, a picking ray testing other geometry, unreset neutral state, a clone losing its method and guide passes that skip morph targets.
 * @evidence contracts/testing.md#independent-expectations Expected points come from the engine's skinAutoMovieMesh over resolvePose and resolveMorphTargetWeights, which the kinematics tests pin to closed-form rotations; the linear contrast is Three's own SkinnedMesh.applyBoneTransform, and shader expectations are Three's chunk order.
 * @evidence contracts/testing.md#distinguishing-cases Both skin methods; rest and posed; identity and non-identity part and root transforms; zero and nonzero morph weights; outer-bend vertices where the methods disagree; a clone; and two material-swapping passes. GPU float rounding is bounded analytically and checked on a hardware renderer elsewhere.
 * @evidence contracts/testing.md#execution-ownership A portable unit over CPU-side Three objects with a synthetic internal fixture; it starts no browser, GPU or process.
 */
export function test_viewer_skinned_pose_parity(): void {
  const model: (method: IAutoMovieMeshSkin["method"]) => IAutoMovieModel = (
    method: IAutoMovieMeshSkin["method"],
  ): IAutoMovieModel => {
    const tube: IAutoMovieModel = createSkinnedTubeModel(method);
    const part: IAutoMovieModel["parts"][number] = tube.parts[0]!;
    part.transform = {
      translation: { x: 0.3, y: -0.2, z: 0.1 },
      rotation: { x: 0, y: Math.sin(0.35), z: 0, w: Math.cos(0.35) },
      scale: { x: 1.5, y: 1.5, z: 1.5 },
    };
    if (part.geometry.type === "mesh") {
      const mesh: IAutoMovieMesh = part.geometry.mesh;
      mesh.targets = [
        {
          name: "bulge",
          positions: mesh.positions.map(
            (value: number, index: number): number =>
              index % 3 === 1 ? 0 : value * 0.25,
          ),
          normals: null,
          driver: {
            bone: "spine",
            axis: "flexion",
            curve: {
              points: [
                { source: 0, output: 0 },
                { source: 90, output: 1 },
              ],
            },
          },
        },
      ];
    }
    return tube;
  };
  const pose: IAutoMoviePose = {
    skeleton: "tube-rig",
    root: {
      translation: { x: 1, y: 0.5, z: -2 },
      rotation: { x: 0, y: 0, z: Math.sin(0.2), w: Math.cos(0.2) },
      scale: { x: 1, y: 1, z: 1 },
    },
    joints: [{ bone: "spine", flexion: 90, abduction: 0, twist: 0 }],
  };
  const neutral: IAutoMoviePose = { skeleton: "tube-rig", root: null, joints: [] };

  // Every scenario runs, and the failure lists every defect at once.
  const defects: string[] = [];
  const check: (name: string, ok: boolean) => void = (
    name: string,
    ok: boolean,
  ): void => {
    if (!ok) defects.push(name);
  };

  for (const method of ["dual-quaternion", "linear"] as const) {
    const source: IAutoMovieModel = model(method);
    const built: IAutoMovieModelObject = buildModel(source);
    const mesh: THREE.SkinnedMesh = built.parts.get("tube") as THREE.SkinnedMesh;
    built.object.updateMatrixWorld(true);
    const rest: THREE.Box3 = new THREE.Box3().setFromObject(mesh);
    applyPose(built, pose, source.skeleton!);
    built.object.updateMatrixWorld(true);

    // 1. vertex queries against the engine's skin of the same pose
    const geometry: IAutoMovieModel["parts"][number]["geometry"] =
      source.parts[0]!.geometry;
    if (geometry.type !== "mesh") throw new Error("The tube is a mesh");
    const mesh0: IAutoMovieMesh = geometry.mesh;
    const placed: THREE.Matrix4 = new THREE.Matrix4().compose(
      new THREE.Vector3(0.3, -0.2, 0.1),
      new THREE.Quaternion(0, Math.sin(0.35), 0, Math.cos(0.35)),
      new THREE.Vector3(1.5, 1.5, 1.5),
    );
    const placedMesh: IAutoMovieMesh = {
      ...mesh0,
      positions: transformed(mesh0.positions, placed),
      targets: mesh0.targets!.map(
        (target: IAutoMovieMeshMorphTarget): IAutoMovieMeshMorphTarget => ({
          ...target,
          positions: transformed(target.positions, placed, 0),
        }),
      ),
    };
    const restBones: IAutoMovieResolvedBone[] = resolvePose(
      neutral,
      source.skeleton!,
    );
    const posedBones: IAutoMovieResolvedBone[] = resolvePose(
      pose,
      source.skeleton!,
    );
    const expected: number[] = skinAutoMovieMesh(
      placedMesh,
      restBones,
      posedBones,
      resolveMorphTargetWeights(mesh0.targets!, pose),
    );
    const count: number = expected.length / 3;
    const world: THREE.Vector3[] = Array.from(
      { length: count },
      (_: unknown, i: number): THREE.Vector3 =>
        mesh.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(mesh.matrixWorld),
    );
    check(
      `${method}: world vertex queries equal the engine skin`,
      world.every(
        (v: THREE.Vector3, i: number): boolean =>
          Math.hypot(
            v.x - expected[3 * i]!,
            v.y - expected[3 * i + 1]!,
            v.z - expected[3 * i + 2]!,
          ) < 1e-6,
      ),
    );

    // 2. bounds contain every posed vertex and are tight
    const box: THREE.Box3 = new THREE.Box3().setFromObject(mesh);
    const exact: THREE.Box3 = new THREE.Box3().setFromPoints(
      Array.from(
        { length: count },
        (_: unknown, i: number): THREE.Vector3 =>
          new THREE.Vector3(
            expected[3 * i],
            expected[3 * i + 1],
            expected[3 * i + 2],
          ),
      ),
    );
    const tolerance: number =
      "tolerance" in mesh
        ? (mesh as unknown as { tolerance(): number }).tolerance() * 1.5
        : 0;
    // Three's frustum and raycast compute the sphere only when it is unset.
    if (mesh.boundingSphere === null) mesh.computeBoundingSphere();
    const sphere: THREE.Sphere = mesh.boundingSphere!
      .clone()
      .applyMatrix4(mesh.matrixWorld);
    check(
      `${method}: posed bounds contain the skin and are tight`,
      exact.min.x >= box.min.x - 1e-9 &&
        exact.max.x <= box.max.x + 1e-9 &&
        exact.min.y >= box.min.y - 1e-9 &&
        exact.max.y <= box.max.y + 1e-9 &&
        exact.min.z >= box.min.z - 1e-9 &&
        exact.max.z <= box.max.z + 1e-9 &&
        box.min.distanceTo(exact.min) <= 2 * tolerance + 1e-6 &&
        box.max.distanceTo(exact.max) <= 2 * tolerance + 1e-6 &&
        world.every((v: THREE.Vector3): boolean => sphere.containsPoint(v)),
    );

    // 3. the dual quaternion box is not the linear blend's
    if (method === "dual-quaternion") {
      const linear: THREE.Box3 = new THREE.Box3();
      for (let i: number = 0; i < count; ++i) {
        const v: THREE.Vector3 = THREE.Mesh.prototype.getVertexPosition.call(
          mesh,
          i,
          new THREE.Vector3(),
        );
        THREE.SkinnedMesh.prototype.applyBoneTransform.call(mesh, i, v);
        linear.expandByPoint(v.applyMatrix4(mesh.matrixWorld));
      }
      check(
        "the dual quaternion bounds differ from the linear blend's",
        linear.min.distanceTo(box.min) + linear.max.distanceTo(box.max) > 0.01,
      );
    }

    // 4. a ray aimed at the joint ring's outer-bend vertex, from outside along
    // its radial direction, hits it; the centroid lies inside the bend
    const centroid: THREE.Vector3 = world
      .reduce(
        (sum: THREE.Vector3, v: THREE.Vector3): THREE.Vector3 => sum.add(v),
        new THREE.Vector3(),
      )
      .divideScalar(count);
    const ring: THREE.Vector3[] = world.slice(8 * 16, 9 * 16);
    const centre: THREE.Vector3 = ring
      .reduce(
        (sum: THREE.Vector3, v: THREE.Vector3): THREE.Vector3 => sum.add(v),
        new THREE.Vector3(),
      )
      .divideScalar(16);
    const away: THREE.Vector3 = centre.clone().sub(centroid);
    const target: THREE.Vector3 = ring.reduce(
      (best: THREE.Vector3, v: THREE.Vector3): THREE.Vector3 =>
        v.clone().sub(centre).dot(away) > best.clone().sub(centre).dot(away)
          ? v
          : best,
    );
    const origin: THREE.Vector3 = target
      .clone()
      .add(target.clone().sub(centre).setLength(3));
    const hits: THREE.Intersection[] = new THREE.Raycaster(
      origin,
      target.clone().sub(origin).normalize(),
    ).intersectObject(mesh, false);
    check(
      `${method}: a ray at a posed vertex hits the posed surface there`,
      hits.length > 0 &&
        Math.abs(hits[0]!.distance - origin.distanceTo(target)) < 1e-5,
    );

    // 6. an outline shell clone keeps the method
    const clone: THREE.SkinnedMesh = mesh.clone();
    clone.updateMatrixWorld(true);
    check(
      `${method}: a clone answers the same vertex queries`,
      world.every(
        (v: THREE.Vector3, i: number): boolean =>
          clone
            .getVertexPosition(i, new THREE.Vector3())
            .applyMatrix4(clone.matrixWorld)
            .distanceTo(v) < 1e-9,
      ),
    );

    // 5. neutral restoration resets bounds and the corrective
    applyPose(built, neutral, source.skeleton!);
    built.object.updateMatrixWorld(true);
    const restored: THREE.Box3 = new THREE.Box3().setFromObject(mesh);
    check(
      `${method}: neutral restoration resets bounds and corrective`,
      restored.min.distanceTo(rest.min) < 1e-9 &&
        restored.max.distanceTo(rest.max) < 1e-9 &&
        mesh.morphTargetInfluences![mesh.morphTargetDictionary!.bulge!] === 0,
    );
  }

  // 7. guide passes morph before skinning
  const scene: THREE.Scene = new THREE.Scene();
  const built: IAutoMovieModelObject = buildModel(model("dual-quaternion"));
  scene.add(built.object);
  const mesh: THREE.Mesh = built.parts.get("tube") as THREE.Mesh;
  const ordered: (source: string) => boolean = (source: string): boolean =>
    source.indexOf("#include <morphtarget_pars_vertex>") !== -1 &&
    source.indexOf("#include <begin_vertex>") <
      source.indexOf("#include <morphtarget_vertex>") &&
    source.indexOf("#include <morphtarget_vertex>") <
      source.indexOf("#include <skinning_vertex>");
  const depth: IAutoMovieRenderModeHandle = applyRenderMode(scene, "depth");
  const depthSource: string = (mesh.material as THREE.ShaderMaterial).vertexShader;
  depth.restore();
  const outline: IAutoMovieRenderModeHandle = applyRenderMode(scene, "outline");
  const shell: THREE.Mesh = built.object.children.find(
    (child: THREE.Object3D): boolean =>
      child !== mesh && (child as THREE.Mesh).isMesh === true,
  ) as THREE.Mesh;
  const shellSource: string = (shell.material as THREE.ShaderMaterial)
    .vertexShader;
  outline.restore();
  check(
    "depth and outline passes morph before skinning",
    ordered(depthSource) && ordered(shellSource),
  );
  TestValidator.equals(
    "every posed CPU consumer reads the drawn deformation",
    defects,
    [],
  );
}

/** Flat positions under an affine matrix; `w = 0` transforms displacements. */
function transformed(
  values: readonly number[],
  matrix: THREE.Matrix4,
  w: number = 1,
): number[] {
  const out: number[] = [];
  for (let i: number = 0; i < values.length; i += 3) {
    const v: THREE.Vector4 = new THREE.Vector4(
      values[i]!,
      values[i + 1]!,
      values[i + 2]!,
      w,
    ).applyMatrix4(matrix);
    out.push(v.x, v.y, v.z);
  }
  return out;
}
