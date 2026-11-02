import type { AutoMovieHumanoidBone, IAutoMovieBone, IAutoMovieMesh, IAutoMovieMotion, IAutoMoviePose, IAutoMovieSkeleton, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { resolvePose } from "../../../../packages/engine/src/kinematics/resolvePose";
import { HUMANOID_JOINT_AXES } from "../../../../packages/engine/src/kinematics/constants/HUMANOID_JOINT_AXES";
import { HUMANOID_REST_FRAME } from "../../../../packages/engine/src/rom/constants/HUMANOID_REST_FRAME";
import { skinAutoMovieMesh } from "../../../../packages/engine/src/skinning/skinAutoMovieMesh";
import { bodyRegionBones } from "../../../../packages/engine/src/perform/bodyRegionBones";
import { retargetHumanoidMotion } from "../../../../packages/engine/src/motion/retargetHumanoidMotion";
import { humanoidBoneOfName } from "../../../../packages/ingest/src/internal/humanoidBoneOfName";
import { vrmHumanoidBones } from "../../../../packages/ingest/src/internal/vrmHumanoidBones";
import { mapImportedHumanoidBones } from "../../../../packages/viewer/src/mapImportedHumanoidBones";

/**
 * An optional scapular articulation reaches generic FK, skinning, region masks,
 * retargeting and node-name admission without becoming a VRM-standard slot.
 *
 * @evidence contracts/testing.md#behavioral-verification Resolves both canonical shoulder chains with separate clavicle and scapula, skins a scapular vertex by the public engine, retains its authored motion through retargeting and reads generic masks and imported-node mappings. Rejects the extension as a VRM slot. A legacy vertex attached to the clavicle is red against the closed-form scapular expectation while the retained scapular bone is green.
 * @evidence contracts/testing.md#independent-expectations The authored 0.15 metre clavicle, 0.3 metre upper arm, 15 degree clavicular elevation and 30 degree scapular upward rotation give explicit planar sine/cosine GH and elbow coordinates. The 55 VRM slots remain the standard importer vocabulary; optional extension names are only generic model slots. Retarget identity is integration parity, not physiological validation.
 * @evidence contracts/testing.md#distinguishing-cases Both reflections, zero and rotated scapula, rigid scapular versus collapsed clavicular skin, a target missing the authored optional bone, an absent optional bone at zero, exact normalized imported names, preserved clavicle aliases, and standard versus extension VRM declarations. Whole-person anatomy and contact belong to the Human pose tests.
 * @evidence contracts/testing.md#execution-ownership A portable synchronous unit with synthetic skeletons and CPU Three Object3D nodes, no body generation, browser, GPU or process.
 */
export function test_kinematics_scapular_articulation(): void {
  for (const side of [1, -1] as const) {
    const name: "left" | "right" = side === 1 ? "left" : "right";
    const rig: IAutoMovieSkeleton = skeleton(side, true);
    const request: IAutoMoviePose = pose(rig, name, 30);
    const rest: ReturnType<typeof resolvePose> = resolvePose({ skeleton: rig.id, root: null, joints: [] }, rig, HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME);
    const result: ReturnType<typeof resolvePose> = resolvePose(request, rig, HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME);
    const at = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 => result.find((row): boolean => row.bone === bone)!.worldPosition;
    const radians: number = Math.PI / 180;
    const gh: IAutoMovieVector3 = { x: side * (0.05 + 0.15 * Math.cos(15 * radians)), y: 1 + 0.15 * Math.sin(15 * radians), z: 0 };
    close("GH translation belongs to the clavicle", at(`${name}UpperArm`), gh);
    close("elbow includes scapular rotation", at(`${name}LowerArm`), { x: gh.x + side * 0.3 * Math.cos(45 * radians), y: gh.y + 0.3 * Math.sin(45 * radians), z: 0 });
    const mesh: IAutoMovieMesh = { positions: [side * 0.22, 1, 0], normals: null, uvs: null, indices: [], skin: { joints: [`${name}Scapula`], boneIndices: [0, 0, 0, 0], weights: [1, 0, 0, 0], method: "dual-quaternion" } };
    const expected: IAutoMovieVector3 = { x: gh.x + side * 0.02 * Math.cos(45 * radians), y: gh.y + 0.02 * Math.sin(45 * radians), z: 0 };
    const moved: number[] = skinAutoMovieMesh(mesh, rest, result);
    close("scapular skin follows its declared bone", { x: moved[0]!, y: moved[1]!, z: moved[2]! }, expected);
    const collapsed: IAutoMovieMesh = { ...mesh, skin: { ...mesh.skin!, joints: [`${name}Shoulder`] } };
    const wrong: number[] = skinAutoMovieMesh(collapsed, rest, result);
    TestValidator.predicate("collapsed clavicular binding is red", Math.hypot(wrong[0]! - expected.x, wrong[1]! - expected.y, wrong[2]! - expected.z) > 0.005);
    TestValidator.predicate("upper mask owns the new articulation", bodyRegionBones("upperBody").includes(`${name}Scapula`) && bodyRegionBones("fullBody").includes(`${name}Scapula`));

    const ordinary: IAutoMovieSkeleton = skeleton(side, false);
    const noBlade: ReturnType<typeof resolvePose> = resolvePose(pose(ordinary, name, undefined), ordinary, HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME);
    const zeroBlade: ReturnType<typeof resolvePose> = resolvePose(pose(rig, name, 0), rig, HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME);
    close("absent optional bone keeps ordinary FK", noBlade.find((row): boolean => row.bone === `${name}Hand`)!.worldPosition, zeroBlade.find((row): boolean => row.bone === `${name}Hand`)!.worldPosition);

    const motion: IAutoMovieMotion = { id: "scapular-motion", skeleton: rig.id, duration: 1, loop: false, keyframes: [0, 1].map((time: number) => ({ time, pose: request, expression: null, easing: "linear" as const, bezier: null })) };
    const retargeted: ReturnType<typeof retargetHumanoidMotion> = retargetHumanoidMotion({ motion, source: rig, target: rig, rootScale: 1, contacts: { enabled: false } });
    TestValidator.predicate("generic retarget keeps declared scapular motion", retargeted.motion?.keyframes[0]?.pose.joints.some((row): boolean => row.bone === `${name}Scapula` && row.flexion === 30) === true);
    const refused: ReturnType<typeof retargetHumanoidMotion> = retargetHumanoidMotion({ motion, source: rig, target: ordinary, rootScale: 1, contacts: { enabled: false } });
    TestValidator.predicate("missing optional motion target is explicit", refused.motion === null && !refused.validation.success);

    const node: THREE.Object3D = new THREE.Object3D();
    node.name = `${name}_Scapula`;
    TestValidator.predicate("generic node mapper retains exact optional slot", mapImportedHumanoidBones(node, [`${name}Scapula`]).get(`${name}Scapula`) === node);
    TestValidator.predicate("ingest names retain scapula", humanoidBoneOfName(node.name) === `${name}Scapula`);
    TestValidator.predicate("clavicle alias remains distinct", humanoidBoneOfName(`${name}_Clavicle`) === `${name}Shoulder`);
  }
  const accepted: ReturnType<typeof vrmHumanoidBones> = vrmHumanoidBones({ extensions: { VRMC_vrm: { humanoid: { humanBones: { leftShoulder: { node: 0 } } } } } }, [{}]);
  TestValidator.predicate("VRM shoulder is unchanged", accepted[0]?.bone === "leftShoulder");
  let refused: boolean = false;
  try { vrmHumanoidBones({ extensions: { VRMC_vrm: { humanoid: { humanBones: { leftScapula: { node: 0 } } } } } }, [{}]); }
  catch { refused = true; }
  TestValidator.predicate("scapular extension is not a VRM slot", refused);
}

/** Canonical T-pose chain, optionally retaining its scapular node. */
function skeleton(side: 1 | -1, scapula: boolean): IAutoMovieSkeleton {
  const name: "left" | "right" = side === 1 ? "left" : "right";
  const bones: IAutoMovieBone[] = [bone("hips", null, [0, 0, 0]), bone("chest", "hips", [0, 1, 0]), bone(`${name}Shoulder`, "chest", [side * 0.05, 0, 0])];
  if (scapula) bones.push(bone(`${name}Scapula`, `${name}Shoulder`, [side * 0.15, 0, 0]));
  bones.push(bone(`${name}UpperArm`, scapula ? `${name}Scapula` : `${name}Shoulder`, scapula ? [0, 0, 0] : [side * 0.15, 0, 0]), bone(`${name}LowerArm`, `${name}UpperArm`, [side * 0.3, 0, 0]), bone(`${name}Hand`, `${name}LowerArm`, [side * 0.25, 0, 0]));
  return { id: `scapular-${name}`, bones };
}

/** One admitted unit-scale rigid rest transform. */
function bone(name: AutoMovieHumanoidBone, parent: AutoMovieHumanoidBone | null, position: [number, number, number]): IAutoMovieBone {
  return { bone: name, parent, rest: { translation: { x: position[0], y: position[1], z: position[2] }, rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 } }, constraint: null };
}

/** Fifteen-degree clavicular elevation, optionally with independent blade rotation. */
function pose(rig: IAutoMovieSkeleton, side: "left" | "right", blade: number | undefined): IAutoMoviePose {
  return { skeleton: rig.id, root: null, joints: [{ bone: `${side}Shoulder`, flexion: 0, abduction: 15, twist: 0 }, ...(blade === undefined ? [] : [{ bone: `${side}Scapula` as AutoMovieHumanoidBone, flexion: blade, abduction: 0, twist: 0 }])] };
}

/** Independent model-space coordinate comparison. */
function close(label: string, actual: IAutoMovieVector3, expected: IAutoMovieVector3): void {
  TestValidator.predicate(label, Math.hypot(actual.x - expected.x, actual.y - expected.y, actual.z - expected.z) < 1e-10);
}
