import {
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
  IAutoMovieTransform,
} from "@automovie/interface";
import {
  type IAutoMovieModelObject,
  type IAutoMovieRenderModeHandle,
  applyPose,
  applyRenderMode,
  buildModel,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createSkinnedTubeModel } from "../internal/createSkinnedTubeModel";

/**
 * Every CPU consumer of a posed skin reads the deformation its shader draws: vertex queries, bounds, culling spheres, Box3 framing and raycasts follow the skin's own method after morph targets, and neutral restoration returns them to rest. The unit observes Three objects built by buildModel and posed by applyPose, against the engine's skinAutoMovieMesh, not GPU pixels.
 *
 * Scenarios:
 * 1. For a dual-quaternion and a linear tube under a non-identity part transform (rotated, uniformly scaled 1.5), a 90 degree spine bend, a translated and rotated root and a live pose-driven morph target, every world vertex query equals skinAutoMovieMesh of the same pose within 1e-6 m.
 * 2. Box3.setFromObject and the culling sphere contain every engine vertex, and the mesh-frame box equals the exact mesh-frame extent grown by at most sqrt(3) times the stated GPU tolerance plus 1e-6 m (the world box only rotates it).
 * 3. A dual-quaternion tube's mesh-frame box is not Three's linear blend extent of the same pose: the bend's sides differ by more than 1 cm.
 * 4. A ray aimed from outside at the engine's outer-bend vertex of the joint ring hits at that vertex's distance within 1e-5 m.
 * 5. An outline shell clone placed beside its source answers the same vertex queries.
 * 6. A backward bend, whose driver leaves no morph live, keeps every engine vertex inside the joint-only culling sphere.
 * 7. Neutral restoration (no joints, null root) returns the box to the rest build's box and the driven morph influence to zero.
 * 8. The depth pass and the outline shell apply morph targets before skinning in their vertex shaders.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds through buildModel, poses through applyPose and reads getVertexPosition, Box3.setFromObject, boundingSphere, Raycaster hits, clone queries and render-mode shader sources; catches Three's linear CPU path on a dual-quaternion skin, rest or stale bounds after a pose, bounds without the morph, an unsafe joint-only sphere, a picking ray testing other geometry, unreset neutral state, a clone losing its method and guide passes that skip morph targets. A reproduction of the pre-fix build (a plain THREE.SkinnedMesh with the same geometry, material, skeleton and bind) fails scenarios 1 to 6 on the dual-quaternion skin and 2 and 6 on the linear skin, whose unpadded bounds exclude the engine's vertices by float rounding.
 * @evidence contracts/development/testing.md#independent-expectations Expected points come from the engine's skinAutoMovieMesh over resolvePose and resolveMorphTargetWeights, which the kinematics tests pin to closed-form rotations; the linear contrast is Three's own SkinnedMesh.applyBoneTransform, and shader expectations are Three's chunk order.
 * @evidence contracts/development/testing.md#distinguishing-cases Both skin methods; rest, forward and backward bends; identity and non-identity part and root transforms; live and zero morph weights, which select the exact and the joint-only sphere; joint-ring vertices where the methods disagree; a clone; and two material-swapping passes. GPU float rounding is bounded analytically and checked on a hardware renderer elsewhere.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit over CPU-side Three objects with a synthetic internal fixture; it starts no browser, GPU or process.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 8 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: For a dual-quaternion and a linear tube under a non-identity part transform (rotated, uniformly scaled 1.5), a 90 degree spine bend, a...).
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
  const neutral: IAutoMoviePose = {
    skeleton: "tube-rig",
    root: null,
    joints: [],
  };

  // Every scenario runs, and the failure lists every defect at once.
  const defects: string[] = [];
  const check: (name: string, ok: boolean) => void = (
    name: string,
    ok: boolean,
  ): void => {
    if (!ok) defects.push(name);
  };

  // A second bend, backwards: the driver reads zero below zero flexion, so no
  // morph is live and the culling sphere comes from the joints alone.
  const back: IAutoMoviePose = {
    ...pose,
    joints: [{ bone: "spine", flexion: -90, abduction: 0, twist: 0 }],
  };

  for (const method of ["dual-quaternion", "linear"] as const) {
    const source: IAutoMovieModel = model(method);
    const built: IAutoMovieModelObject = buildModel(source);
    const mesh: THREE.SkinnedMesh = built.parts.get(
      "tube",
    ) as THREE.SkinnedMesh;
    built.object.updateMatrixWorld(true);
    const rest: THREE.Box3 = new THREE.Box3().setFromObject(mesh);
    const posed: (target: IAutoMoviePose) => THREE.Vector3[] = (
      target: IAutoMoviePose,
    ): THREE.Vector3[] => {
      applyPose(built, target, source.skeleton!);
      built.object.updateMatrixWorld(true);
      return expectedSkin(source, target, neutral);
    };
    const expected: THREE.Vector3[] = posed(pose);
    const count: number = expected.length;
    const query: (of: THREE.SkinnedMesh, i: number) => THREE.Vector3 = (
      of: THREE.SkinnedMesh,
      i: number,
    ): THREE.Vector3 =>
      of.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(of.matrixWorld);

    // 1. vertex queries against the engine's skin of the same pose
    check(
      `${method}: world vertex queries equal the engine skin`,
      expected.every(
        (v: THREE.Vector3, i: number): boolean =>
          query(mesh, i).distanceTo(v) < 1e-6,
      ),
    );

    // 2. bounds: the world box and sphere contain the skin; the local box,
    // which the world box only rotates, is the exact extent plus the padding
    const world: THREE.Box3 = new THREE.Box3().setFromObject(mesh);
    const inverse: THREE.Matrix4 = mesh.matrixWorld.clone().invert();
    const local: THREE.Box3 = new THREE.Box3().setFromPoints(
      expected.map(
        (v: THREE.Vector3): THREE.Vector3 => v.clone().applyMatrix4(inverse),
      ),
    );
    const tolerance: number =
      "tolerance" in mesh
        ? (mesh as unknown as { tolerance(): number }).tolerance()
        : 0;
    check(
      `${method}: posed bounds contain the skin and are tight in the mesh frame`,
      expected.every((v: THREE.Vector3): boolean =>
        world.clone().expandByScalar(1e-9).containsPoint(v),
      ) &&
        sphereOf(mesh).every((s: THREE.Sphere): boolean =>
          expected.every(
            (v: THREE.Vector3): boolean => s.distanceToPoint(v) <= 1e-9,
          ),
        ) &&
        mesh.boundingBox.min.distanceTo(local.min) <=
          Math.sqrt(3) * tolerance + 1e-6 &&
        mesh.boundingBox.max.distanceTo(local.max) <=
          Math.sqrt(3) * tolerance + 1e-6 &&
        local.min.x >= mesh.boundingBox.min.x - 1e-9 &&
        local.max.x <= mesh.boundingBox.max.x + 1e-9 &&
        local.min.y >= mesh.boundingBox.min.y - 1e-9 &&
        local.max.y <= mesh.boundingBox.max.y + 1e-9 &&
        local.min.z >= mesh.boundingBox.min.z - 1e-9 &&
        local.max.z <= mesh.boundingBox.max.z + 1e-9,
    );

    // 3. the dual quaternion box is not the linear blend's, in the mesh frame
    if (method === "dual-quaternion") {
      const linear: THREE.Box3 = new THREE.Box3();
      for (let i: number = 0; i < count; ++i) {
        const v: THREE.Vector3 = THREE.Mesh.prototype.getVertexPosition.call(
          mesh,
          i,
          new THREE.Vector3(),
        );
        THREE.SkinnedMesh.prototype.applyBoneTransform.call(mesh, i, v);
        linear.expandByPoint(v);
      }
      check(
        "the dual quaternion bounds differ from the linear blend's",
        linear.min.distanceTo(mesh.boundingBox.min) +
          linear.max.distanceTo(mesh.boundingBox.max) >
          0.01,
      );
    }

    // 4. a ray aimed, from outside along its radial direction, at the engine's
    // outer-bend vertex of the joint ring hits there; the centroid lies
    // inside the bend
    const centroid: THREE.Vector3 = expected
      .reduce(
        (sum: THREE.Vector3, v: THREE.Vector3): THREE.Vector3 => sum.add(v),
        new THREE.Vector3(),
      )
      .divideScalar(count);
    const ring: THREE.Vector3[] = expected.slice(8 * 16, 9 * 16);
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
      `${method}: a ray at the engine's posed vertex hits the posed surface there`,
      hits.length > 0 &&
        Math.abs(hits[0]!.distance - origin.distanceTo(target)) < 1e-5,
    );

    // 5. an outline shell clone, placed beside its source, keeps the method
    const clone: THREE.SkinnedMesh = mesh.clone();
    mesh.parent!.add(clone);
    clone.updateMatrixWorld(true);
    check(
      `${method}: a clone answers the same vertex queries`,
      expected.every(
        (v: THREE.Vector3, i: number): boolean =>
          query(clone, i).distanceTo(v) < 1e-6,
      ),
    );
    clone.removeFromParent();

    // 6. a pose without a live morph: the joint-only sphere holds the skin
    const backward: THREE.Vector3[] = posed(back);
    check(
      `${method}: the joint-only culling sphere contains the skin`,
      mesh.morphTargetInfluences![mesh.morphTargetDictionary!.bulge!] === 0 &&
        sphereOf(mesh).every((s: THREE.Sphere): boolean =>
          backward.every(
            (v: THREE.Vector3): boolean => s.distanceToPoint(v) <= 1e-9,
          ),
        ),
    );

    // 7. neutral restoration resets bounds and the corrective
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

  // 8. guide passes morph before skinning
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
  const depthSource: string = (mesh.material as THREE.ShaderMaterial)
    .vertexShader;
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

/** The mesh's culling sphere in world space, computed as Three's frustum would. */
function sphereOf(mesh: THREE.SkinnedMesh): THREE.Sphere[] {
  const nullable: { boundingSphere: THREE.Sphere | null } = mesh;
  if (nullable.boundingSphere === null) mesh.computeBoundingSphere();
  return [mesh.boundingSphere.clone().applyMatrix4(mesh.matrixWorld)];
}

/** The engine's skin of the tube's part under `pose`, in world metres. */
function expectedSkin(
  source: IAutoMovieModel,
  pose: IAutoMoviePose,
  neutral: IAutoMoviePose,
): THREE.Vector3[] {
  const part: IAutoMovieModel["parts"][number] = source.parts[0]!;
  if (part.geometry.type !== "mesh" || part.transform === null)
    throw new Error("The tube is a placed mesh");
  const mesh: IAutoMovieMesh = part.geometry.mesh;
  const t: IAutoMovieTransform = part.transform;
  const placed: THREE.Matrix4 = new THREE.Matrix4().compose(
    new THREE.Vector3(t.translation.x, t.translation.y, t.translation.z),
    new THREE.Quaternion(
      t.rotation.x,
      t.rotation.y,
      t.rotation.z,
      t.rotation.w,
    ),
    new THREE.Vector3(t.scale.x, t.scale.y, t.scale.z),
  );
  const flat: number[] = skinAutoMovieMesh(
    {
      ...mesh,
      positions: transformed(mesh.positions, placed),
      targets: mesh.targets!.map(
        (target: IAutoMovieMeshMorphTarget): IAutoMovieMeshMorphTarget => ({
          ...target,
          positions: transformed(target.positions, placed, 0),
        }),
      ),
    },
    resolvePose(neutral, source.skeleton!),
    resolvePose(pose, source.skeleton!),
    resolveMorphTargetWeights(mesh.targets!, pose),
  );
  return Array.from(
    { length: flat.length / 3 },
    (_: unknown, i: number): THREE.Vector3 =>
      new THREE.Vector3(flat[3 * i], flat[3 * i + 1], flat[3 * i + 2]),
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
