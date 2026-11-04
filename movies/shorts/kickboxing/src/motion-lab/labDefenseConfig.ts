import { AutoMovieHumanRigControls, type AutoMovieHumanSkeleton } from "@automovie/human";
import * as THREE from "three";
import type { MotionAction } from "../motion/core/MotionAction";
import { DefenseMotion } from "../motion/defense/DefenseMotion";
import { displayedSurface } from "../displayedSurface";
import type { LabActor } from "./LabActor";

/**
 * Author one defense against its original actual actor and declared independent receiving task.
 * @evidence contracts/common.md#implementation-and-ownership Shares the existing measured guard/check configuration between an exchange and a standalone defense. Original Hand binding, anatomical support destination and check-ready FK remain unchanged; a clinical marker never becomes a WORLD fitting task.
 * @evidence contracts/common.md#authoring-interface The caller supplies this actor's original request and variation-resolved ready time. Receiving stays external until declared clinical withdrawal; this helper creates no contact event and samples no opponent.
 */
export function labDefenseConfig(actor: LabActor, request: MotionAction.Request, kind: DefenseMotion.Kind | "none", targetKind: string, readySeconds: number, strikeFamily: "punch" | "kick" = "punch"): DefenseMotion.Config {
    const patch: (side: MotionAction.Side) => DefenseMotion.Patch = (side: MotionAction.Side): DefenseMotion.Patch => {
      const context: MotionAction.Context = actor.context(side, [0, 0, 0]);
      return { bone: AutoMovieHumanRigControls.joint(`${side}Hand`), localPoint: context.geometry.handLocalPoint, target: context.geometry.hand!, radius: context.geometry.gloveRadiusMetres! };
    };
    const side: MotionAction.Side = request.side;
    const guard: Record<MotionAction.Side, DefenseMotion.Patch> = { left: patch("left"), right: patch("right") };
    let receiving: NonNullable<DefenseMotion.Config["receiving"]> = { ...guard[side], target: [guard[side].target[0] + .035, guard[side].target[1], guard[side].target[2]], restTarget: [...guard[side].target] };
    if (kind === "check") {
      const bone: string = `${side}LowerLeg`;
      const mesh: THREE.Mesh = actor.mesh(bone);
      const axis: THREE.Vector3 = new THREE.Vector3(...actor.person.point(bone)).lerp(new THREE.Vector3(...actor.person.point(`${side}Foot`)), .55);
      const world: THREE.Vector3 = displayedSurface.nearest(mesh, axis.clone().add(new THREE.Vector3(.2, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), actor.yaw)));
      const local: MotionAction.Vec3 = actor.local(world.toArray());
      mesh.geometry.computeBoundingSphere();
      receiving = { bone: AutoMovieHumanRigControls.joint(bone), localPoint: mesh.worldToLocal(world).toArray(), target: [...local], restTarget: local, radius: mesh.geometry.boundingSphere!.radius };
    }
    const bodyGuard: DefenseMotion.Config["bodyGuard"] = targetKind === "body" && (kind === "catch" || kind === "cover") ? strikeFamily === "kick" ? "forearm" : "glove" : undefined;
    if (bodyGuard) {
      // Measured chest extents locate these authored lower-guard targets; the offsets are staging choices, not anatomical measurements or collision exemptions.
      const chest: THREE.Mesh = actor.mesh("chest");
      const extent: THREE.Box3 = new THREE.Box3();
      const positions: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = chest.geometry.getAttribute("position");
      for (let index: number = 0; index < positions.count; index++) extent.expandByPoint(actor.person.object.worldToLocal(chest.localToWorld(new THREE.Vector3().fromBufferAttribute(positions, index))));
      const level: THREE.Vector3 = extent.getCenter(new THREE.Vector3());
      level.x = extent.max.x + (bodyGuard === "glove" ? guard[side].radius : .045);
      level.z += (side === "left" ? 1 : -1) * (extent.max.z - extent.min.z) * .18;
      if (bodyGuard === "forearm") {
        const bone: string = `${side}LowerArm`;
        const mesh: THREE.Mesh = actor.mesh(bone);
        const middle: THREE.Vector3 = new THREE.Vector3(...actor.person.point(bone)).lerp(new THREE.Vector3(...actor.person.point(`${side}Hand`)), .5);
        const actual: THREE.Vector3 = displayedSurface.nearest(mesh, middle.add(new THREE.Vector3(.2, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), actor.yaw)));
        mesh.geometry.computeBoundingSphere();
        receiving = { bone: AutoMovieHumanRigControls.joint(bone), localPoint: mesh.worldToLocal(actual.clone()).toArray(), target: level.toArray(), restTarget: actor.local(actual.toArray()), radius: mesh.geometry.boundingSphere!.radius };
      } else receiving = { ...guard[side], target: level.toArray(), restTarget: [...guard[side].target] };
    }
    const support: MotionAction.Vec3 | undefined = kind === "check" ? DefenseMotion.supportShift(actor.context(side, [0, 0, 0]), side) : undefined;
    const config: DefenseMotion.Config = { guard, guardBinding: "clinical", receivingReturn: "clinical", receiving, bodyGuard, parryDisplacement: [0, 0, side === "left" ? .06 : -.06], rootDropMetres: kind === "weave" ? .10 : .035, lateralMetres: targetKind === "miss" ? .23 : .06, supportShift: support };
    if (kind === "check") {
      const context: MotionAction.Context = actor.context(side, [0, 0, 0]);
      const peak: MotionAction.Sample = DefenseMotion.sample("check", request, context, readySeconds, config);
      const placement: AutoMovieHumanSkeleton.IPlacement | undefined = actor.person.evaluate(peak.pose).posed.find((point: AutoMovieHumanSkeleton.IPlacement): boolean => point.bone === receiving.bone);
      if (!placement) throw new Error("Missing actual peak check placement");
      receiving.target = new THREE.Vector3(...receiving.localPoint!).applyQuaternion(new THREE.Quaternion(...placement.rotation)).add(new THREE.Vector3(...placement.position)).toArray();
    }
    return config;
}

