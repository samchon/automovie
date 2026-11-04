import {
  type AutoMovieHumanGrounding,
  AutoMovieHumanLegIk,
  AutoMovieHumanRigControls,
  type AutoMovieHumanSkeleton,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import * as THREE from "three";

import type { MotionAction } from "../motion/core/MotionAction";
import { MotionSupportChannels } from "../motion/core/MotionSupportChannels";
import type { FootworkMotion } from "../motion/defense/FootworkMotion";
import type { LabActor } from "./LabActor";
import type { LabFootworkStance } from "./LabFootworkStance";

/**
 * Adapt one reusable sole route to actual bone-bound foot targets and world support.
 *
 * @evidence contracts/common.md#implementation-and-ownership Fixed WORLD sole goals and declared initial-foot-relative turn quaternions define point/frame tasks. Direct route offsets move the original WORLD tuples; exact zero copies them without an inverse/forward roundtrip. Public supportHeight authors height; one same-problem preparation uses analytical leg initialization and whole-foot Grounding within the final host's unchanged16-update budget. Its realized pose/root stay paired, and final effector goals inverse-transform the original WORLD tasks around that realized root. Authored distal controls survive fitting; moving frames remain distinct from load.
 * @evidence contracts/common.md#authoring-interface Route and source stance share actual sole witnesses and fixed heading. Optional rootRotation and foot orientation use x/y/z/w actor-local quaternions; the actual support-frame delta is expressed in WORLD axes. A swinging foot has no ground-load patch. Full-foot floor and unchanged hard tolerances decide admission; the height envelope is not a global feasibility proof.
 */
export function labFootworkSample(
  actor: LabActor,
  route: FootworkMotion.Sample,
  seconds: number,
  duration: number,
  source?: LabFootworkStance,
): MotionAction.Sample {
  const patches: MotionAction.SupportPatch[] = [];
  const effectors: MotionAction.Effector[] = [];
  const initial: LabFootworkStance = source ?? {
    pose: actor.basePose,
    origin: actor.origin.toArray(),
    patches: { left: actor.patches.left.low, right: actor.patches.right.low },
  };
  const pose: IAutoMovieHumanPose = structuredClone(initial.pose);
  const heading: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    actor.yaw,
  );
  const worldGoals: Record<MotionAction.Side, MotionAction.Vec3> = {
    left: routeWorld(initial, route.feet.left, "left", heading),
    right: routeWorld(initial, route.feet.right, "right", heading),
  };
  const output: AutoMovieHumanSkeleton.IOutput = actor.person.evaluate(
    initial.pose,
  );
  const reference: AutoMovieHumanLegIk.ISupport[] = [];
  const requested: AutoMovieHumanLegIk.ISupport[] = [];
  for (const side of ["left", "right"] as const) {
    const patch: MotionAction.SupportPatch = initial.patches[side];
    const bone: AutoMovieHumanSkeleton.IPlacement | undefined =
      output.posed.find(
        (item: AutoMovieHumanSkeleton.IPlacement): boolean =>
          item.bone === patch.bone,
      );
    const ankle: AutoMovieHumanSkeleton.IPlacement | undefined =
      output.posed.find(
        (item: AutoMovieHumanSkeleton.IPlacement): boolean =>
          item.bone === `${side}Foot`,
      );
    if (!bone || !ankle)
      throw new Error(`Missing actual ${side} route ankle/sole frame`);
    const sole: THREE.Vector3 = new THREE.Vector3(...patch.localPoint)
      .applyQuaternion(new THREE.Quaternion(...bone.rotation))
      .add(new THREE.Vector3(...bone.position));
    const localOffset: THREE.Vector3 = new THREE.Vector3(...ankle.position).sub(
      sole,
    );
    const offset: THREE.Vector3 = localOffset.clone().applyQuaternion(heading);
    const requestedOffset: THREE.Vector3 = localOffset
      .applyQuaternion(
        new THREE.Quaternion(...(route.feet[side].orientation ?? [0, 0, 0, 1])),
      )
      .applyQuaternion(heading);
    const kneeFlexion: number = initial.pose.legs?.[side].knee?.flexion ?? 0;
    reference.push({
      side,
      position: new THREE.Vector3(...patch.world).add(offset).toArray(),
      kneeFlexion,
    });
    requested.push({
      side,
      position: new THREE.Vector3(...worldGoals[side])
        .add(requestedOffset)
        .toArray(),
      kneeFlexion,
    });
  }
  const root: AutoMovieHumanGrounding.IRoot = {
    translation: new THREE.Vector3(...route.rootOffset)
      .applyQuaternion(heading)
      .add(new THREE.Vector3(...initial.origin))
      .toArray(),
    rotation: heading
      .clone()
      .multiply(new THREE.Quaternion(...(route.rootRotation ?? [0, 0, 0, 1])))
      .toArray(),
  };
  const baseline: ReturnType<typeof AutoMovieHumanLegIk.supportHeight> =
    AutoMovieHumanLegIk.supportHeight(
      output,
      actor.person.neutral,
      { translation: [...initial.origin], rotation: heading.toArray() },
      reference,
    );
  const height: ReturnType<typeof AutoMovieHumanLegIk.supportHeight> =
    AutoMovieHumanLegIk.supportHeight(
      output,
      actor.person.neutral,
      root,
      requested,
    );
  if (!baseline.feasible || !height.feasible)
    throw new Error(
      "Independent route ankles exceed the measured leg support envelope",
    );
  const authoredOffset: MotionAction.Vec3 = [...route.rootOffset];
  authoredOffset[1] += height.height - baseline.height;
  const rootOffset: MotionAction.Vec3 = new THREE.Vector3(...authoredOffset)
    .add(
      new THREE.Vector3(...initial.origin)
        .sub(actor.origin)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), -actor.yaw),
    )
    .toArray();
  for (const side of ["left", "right"] as const) {
    const foot: FootworkMotion.Foot = route.feet[side];
    const witness: MotionAction.SupportPatch = initial.patches[side];
    const world: MotionAction.Vec3 = [...worldGoals[side]];
    const initialBone: AutoMovieHumanSkeleton.IPlacement | undefined =
      output.posed.find(
        (item: AutoMovieHumanSkeleton.IPlacement): boolean =>
          item.bone === witness.bone,
      );
    const currentBone: AutoMovieHumanSkeleton.IPlacement | undefined =
      actor.person
        .evaluate(actor.basePose)
        .posed.find(
          (item: AutoMovieHumanSkeleton.IPlacement): boolean =>
            item.bone === witness.bone,
        );
    if (!initialBone || !currentBone)
      throw new Error(`Missing ${side} immutable route orientation`);
    const originalFrame: THREE.Quaternion = witness.frameRotation
      ? new THREE.Quaternion(...witness.frameRotation)
      : new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          (-(witness.yawDegrees ?? 0) * Math.PI) / 180,
        );
    const rotation: THREE.Quaternion = heading
      .clone()
      .multiply(new THREE.Quaternion(...(foot.orientation ?? [0, 0, 0, 1])))
      .multiply(heading.clone().invert())
      .multiply(originalFrame)
      .multiply(heading)
      .multiply(new THREE.Quaternion(...initialBone.rotation))
      .multiply(new THREE.Quaternion(...currentBone.rotation).invert())
      .multiply(heading.clone().invert());
    const frame: MotionAction.SupportPatch = {
      ...witness,
      world,
      mode: "free",
      constraint: "hard",
      frameRotation: rotation.toArray(),
    };
    patches.push(frame);
    if (foot.phase === "planted")
      patches.push({
        side,
        bone: witness.bone,
        localPoint: [...witness.localPoint],
        world: [...world],
        mode: "planted",
        constraint: "hard",
      });
    const target: MotionAction.Vec3 = foot.target.map(
      (value: number, index: number): number => value - authoredOffset[index]!,
    ) as MotionAction.Vec3;
    effectors.push({
      bone: witness.bone,
      localPoint: [...witness.localPoint],
      target,
      role: foot.phase === "planted" ? "support" : "guide",
      radius: 0,
    });
  }
  const preservedChannels: AutoMovieHumanRigControls.DegreeChannel[] = (
    ["left", "right"] as const
  ).flatMap(
    (side: MotionAction.Side): AutoMovieHumanRigControls.DegreeChannel[] =>
      MotionSupportChannels.select(side, "planted").preserved,
  );
  const planned: MotionAction.BodyPlacement = actor.planSupport({
    pose,
    rootOffset,
    rootRotation: route.rootRotation,
    support: { ...route.support, patches },
    preservedChannels,
  });
  const translation: THREE.Vector3 = new THREE.Vector3(...planned.rootOffset)
    .applyQuaternion(heading)
    .add(new THREE.Vector3(...actor.origin.toArray()));
  const inverse: THREE.Quaternion = heading
    .clone()
    .multiply(new THREE.Quaternion(...(planned.rootRotation ?? [0, 0, 0, 1])))
    .invert();
  const realizedEffectors: MotionAction.Effector[] = effectors.map(
    (effector: MotionAction.Effector): MotionAction.Effector => ({
      ...effector,
      target: new THREE.Vector3(
        ...patches.find(
          (patch: MotionAction.SupportPatch): boolean =>
            patch.bone === effector.bone,
        )!.world,
      )
        .sub(translation)
        .applyQuaternion(inverse)
        .toArray(),
    }),
  );
  return {
    pose: structuredClone(planned.pose),
    rootOffset: [...planned.rootOffset],
    rootRotation: planned.rootRotation ? [...planned.rootRotation] : undefined,
    support: { ...route.support, patches },
    effectors: realizedEffectors,
    preservedChannels,
    phase: seconds >= duration ? "complete" : "delivery",
    elapsed: seconds,
    progress: Math.min(1, Math.max(0, seconds / duration)),
  };
}

/** Transport original declared WORLD authority by the producer's direct fixed-frame displacement. */
function routeWorld(
  source: LabFootworkStance,
  foot: FootworkMotion.Foot,
  side: MotionAction.Side,
  heading: THREE.Quaternion,
): MotionAction.Vec3 {
  if (foot.offset === undefined)
    return new THREE.Vector3(...foot.target)
      .applyQuaternion(heading)
      .add(new THREE.Vector3(...source.origin))
      .toArray();
  if (
    !Array.isArray(foot.offset) ||
    foot.offset.length !== 3 ||
    ![0, 1, 2].every((axis: number): boolean =>
      Number.isFinite(foot.offset![axis]),
    )
  )
    throw new Error(
      "A route offset requires three occupied finite actor-local metres",
    );
  const original: MotionAction.Vec3 = source.patches[side].world;
  if (foot.offset.every((value: number): boolean => value === 0))
    return [...original];
  const offset: THREE.Vector3 = new THREE.Vector3(
    ...foot.offset,
  ).applyQuaternion(heading);
  return [
    original[0] + offset.x,
    original[1] + offset.y,
    original[2] + offset.z,
  ];
}
