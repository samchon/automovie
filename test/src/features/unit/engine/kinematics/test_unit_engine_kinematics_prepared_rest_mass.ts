import {
  prepareSkeletonPoseResolution as R,
  resolveAutoMovieCenterOfMass as M,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePhysicalProfile,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { qclose } from "../../../internal/qclose";
import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/**
 * Genuine prepared rest geometry supplies the same segmental mass equations
 * as raw rest FK, with snapshot lifetime and independent public output.
 *
 * Scenarios:
 * 1. Root position(1,2,3)/Rz90 carries a child at local(2,0,0)/Rx90 to
 *    world(1,4,3), with cyclic quaternion(0.5,0.5,0.5,0.5). Its inverse
 *    maps world-relative(x,y,z) to local(y,z,x).
 * 2. The2kg child centre is world(4,7,10), hence bone-local(3,7,3).
 *    Neutral identity plus principal Rz90 gives local axes Rx-90. A1kg root
 *    centre at(1,2,3) fixes total COM(3,16/3,23/3). Both constructors use
 *    these literal expectations, with raw construction only supplementary.
 * 3. Public rest/output point/axis edits cannot alter later reads/models.
 *    A separate posed-root/joint query also cannot replace neutral rest.
 *    Changing source child translation X2 to4 changes raw/new-rig rest and
 *    local mass point to(1,7,3); the original genuine rig remains unchanged.
 *    Principal-moment vectors retain their documented borrowed ownership.
 * 4. A structural rig copy with an owned throwing resolve is foreign. Both
 *    rest and mass construction reject it before invoking any public method.
 */
export function test_unit_engine_kinematics_prepared_rest_mass(): void {
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const z: IAutoMovieQuaternion = { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 };
  const x: IAutoMovieQuaternion = { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 };
  const skeleton: IAutoMovieSkeleton = { id: "rest-mass-kernel", bones: [
    { bone: "hips", parent: null, constraint: null,
      rest: { translation: { x: 1, y: 2, z: 3 }, rotation: z, scale: { x: 1, y: 1, z: 1 } } },
    { bone: "spine", parent: "hips", constraint: null,
      rest: { translation: { x: 2, y: 0, z: 0 }, rotation: x, scale: { x: 1, y: 1, z: 1 } } },
  ] };
  const profile: IAutoMoviePhysicalProfile = { id: skeleton.id, mass: 3,
    centerOfMass: { x: 3, y: 16 / 3, z: 23 / 3 }, joints: [], collisionExclusions: [], materials: [], provenance: "test",
    segments: [
      { bone: "hips", mass: 1, centerOfMass: { x: 0, y: 0, z: 0 },
        neutral: { position: { x: 1, y: 2, z: 3 }, rotation: { ...z } },
        inertia: { x: 1, y: 2, z: 3 }, inertiaRotation: { ...identity }, shapes: [] },
      { bone: "spine", mass: 2, centerOfMass: { x: 1, y: 2, z: 3 },
        neutral: { position: { x: 3, y: 5, z: 7 }, rotation: { ...identity } },
        inertia: { x: 2, y: 3, z: 4 }, inertiaRotation: { ...z }, shapes: [] },
    ] };
  const rig: ReturnType<typeof R> = R(skeleton);
  const first: ReturnType<typeof R.rest> = R.rest(rig);
  rest(first, 4);
  first[1]!.worldPosition.x = 999;
  first[1]!.localRotation.y = 777;
  first[1]!.worldRotation.w = 888;
  const again: ReturnType<typeof R.rest> = R.rest(rig);
  rest(again, 4);
  TestValidator.predicate("rest frames and nested transforms are independent public copies",
    first !== again && first[1] !== again[1] && first[1]!.worldPosition !== again[1]!.worldPosition &&
    first[1]!.worldRotation !== again[1]!.worldRotation && first[1]!.localRotation !== again[1]!.localRotation &&
    Object.is(first[1]!.worldPosition.x, 999) && Object.is(first[1]!.worldRotation.w, 888));
  const operated: ReturnType<typeof R.rest> = rig.resolve({ skeleton: skeleton.id,
    root: { translation: { x: 5, y: 6, z: 7 }, rotation: { ...identity }, scale: { x: 1, y: 1, z: 1 } },
    joints: [{ bone: "spine", flexion: 90, abduction: null, twist: null }] });
  TestValidator.predicate("the same genuine rig can produce an actual different posed root before mass preparation",
    vclose(operated.find((bone: ReturnType<typeof R.rest>[number]): boolean => bone.bone === "spine")!.worldPosition,
      { x: 6, y: 10, z: 10 }, 1e-12));
  rest(R.rest(rig), 4);
  const prepared: IAutoMovieResolveCenterOfMass.IModel = M.fromRig(rig, profile);
  mass(prepared, 3);
  mass(M(skeleton, profile), 3);
  TestValidator.predicate("placed segment masses retain the independently weighted world centre",
    vclose(M.place(prepared, new Map(again.map((bone: ReturnType<typeof R.rest>[number]):
      [AutoMovieHumanoidBone, ReturnType<typeof R.rest>[number]] => [bone.bone, bone]))),
    { x: 3, y: 16 / 3, z: 23 / 3 }, 1e-12));
  TestValidator.predicate("principal inertia vectors keep their original borrowed profile ownership",
    prepared.segments[1]!.inertia === profile.segments[1]!.inertia);
  prepared.segments[1]!.point.x = 999;
  prepared.segments[1]!.axes.w = 888;
  mass(M.fromRig(rig, profile), 3);
  skeleton.bones[1]!.rest.translation.x = 4;
  rest(R.rest(rig), 4);
  mass(M.fromRig(rig, profile), 3);
  rest(R.rest(R(skeleton)), 6);
  mass(M(skeleton, profile), 1);
  mass(M.fromRig(R(skeleton), profile), 1);
  let calls: number = 0;
  const foreign: typeof rig = { ...rig, resolve: (): never => { calls++; throw new Error("owned foreign resolver"); } };
  TestValidator.predicate("a structural foreign rig is refused before its resolver is consulted",
    throwsError((): ReturnType<typeof R.rest> => R.rest(foreign), ["rig", "prepareSkeletonPoseResolution"]) &&
    throwsError((): IAutoMovieResolveCenterOfMass.IModel => M.fromRig(foreign, profile), ["rig", "prepareSkeletonPoseResolution"]) && calls === 0);
}

/** Check exact parent-first rest geometry with a variable authored child joint translation. */
function rest(frames: ReturnType<typeof R.rest>, height: number): void {
  TestValidator.equals("genuine rest retains parent-first rooted names", frames.map(
    (bone: ReturnType<typeof R.rest>[number]): AutoMovieHumanoidBone => bone.bone), ["hips", "spine"]);
  TestValidator.predicate("genuine rest retains the independent parent/child rigid transforms",
    vclose(frames[0]!.worldPosition, { x: 1, y: 2, z: 3 }, 1e-12) &&
    vclose(frames[1]!.worldPosition, { x: 1, y: height, z: 3 }, 1e-12) &&
    qclose(frames[1]!.localRotation, { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 }, 1e-12) &&
    qclose(frames[1]!.worldRotation, { x: 0.5, y: 0.5, z: 0.5, w: 0.5 }, 1e-12));
}

/** The profile's actual world centre/axes are converted into the child's known cyclic frame. */
function mass(model: IAutoMovieResolveCenterOfMass.IModel, childX: number): void {
  TestValidator.predicate("mass construction preserves independent ordered masses, local centres and principal axes",
    nclose(model.mass, 3, 0) && model.segments.length === 2 && model.segments[0]!.bone === "hips" &&
    model.segments[1]!.bone === "spine" && nclose(model.segments[0]!.mass, 1, 0) && nclose(model.segments[1]!.mass, 2, 0) &&
    vclose(model.segments[0]!.point, { x: 0, y: 0, z: 0 }, 1e-12) &&
    vclose(model.segments[1]!.point, { x: childX, y: 7, z: 3 }, 1e-12) &&
    qclose(model.segments[1]!.axes, { x: -Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 }, 1e-12));
}
