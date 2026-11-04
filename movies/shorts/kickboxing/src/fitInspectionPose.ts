import {
  AutoMovieHumanClinicalIk,
  AutoMovieHumanGrounding,
  AutoMovieHumanLegIk,
  AutoMovieHumanRigControls,
  type AutoMovieHumanSkeleton,
  type AutoMovieHumanSupportFrame,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import * as THREE from "three";

import type { InspectionPerson } from "./InspectionPerson";

/**
 * Fit a static guard to its real head and both soles to the visible floor.
 *
 * @evidence contracts/common.md#implementation-and-ownership Public clinical IK moves actual hand-bound glove centres to the lower cheeks. Public Grounding consumes every emitted foot vertex and an independently selected real low witness per foot; it changes anatomical leg controls and actor root height, never shoes or proportions. Point support is not a full flat sole or balance certificate.
 * @evidence contracts/common.md#authoring-interface Input is an authored clinical seed. Result retains unresolved residuals and the exact applied pose/root. The static Viewer must inspect guard, sole shape and knee direction before any motion is authored.
 */
export function fitInspectionPose(
  person: InspectionPerson,
  seed: IAutoMovieHumanPose,
  guard: boolean,
): { support: AutoMovieHumanGrounding.IResult; guardErrors: number[] } {
  let pose: IAutoMovieHumanPose = structuredClone(seed);
  person.pose(pose);
  const guardErrors: number[] = [];
  if (guard) {
    const head: THREE.Box3 = new THREE.Box3().setFromObject(
      person.drawing.head.object,
      true,
    );
    const extent: THREE.Vector3 = head.getSize(new THREE.Vector3());
    const center: THREE.Vector3 = head.getCenter(new THREE.Vector3());
    for (const side of ["left", "right"] as const) {
      const glove: THREE.Object3D | undefined = person.object.getObjectByName(
        `${side}-glove`,
      );
      if (!glove) throw new Error(`Missing ${side} glove geometry`);
      const target: AutoMovieHumanClinicalIk.ITarget = {
        bone: AutoMovieHumanRigControls.joint(`${side}Hand`),
        localPoint: glove.position.toArray(),
        position: [
          head.max.x + 0.11 + (side === "left" ? 0.04 : 0),
          head.min.y + extent.y * 0.32,
          center.z + (side === "left" ? 1 : -1) * (extent.z * 0.45 + 0.025),
        ],
      };
      const result: AutoMovieHumanClinicalIk.IResult =
        AutoMovieHumanClinicalIk.solve(person.evaluate, pose, {
          chain: { region: "arm", side },
          targets: [target],
          iterations: 16,
          tolerance: 0.0005,
        });
      pose = result.pose;
      guardErrors.push(result.error);
    }
    person.pose(pose);
  }

  // Keep the complete emitted foot population, including independently bound toes.
  const vertices: AutoMovieHumanSupportFrame.IPoint[] = [];
  const lowest: Map<
    "left" | "right",
    { point: AutoMovieHumanSupportFrame.IPoint; position: THREE.Vector3 }
  > = new Map();
  for (const [bone, mesh] of person.drawing.parts) {
    if (
      !/(Foot|Subtalar|Midfoot|Toe|Hallux|Second|Third|Fourth|Fifth)/.test(bone)
    )
      continue;
    const side: "left" | "right" = bone.startsWith("left") ? "left" : "right";
    const identity: AutoMovieHumanRigControls.Joint =
      AutoMovieHumanRigControls.joint(bone);
    const positions: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
      mesh.geometry.getAttribute("position");
    for (let index: number = 0; index < positions.count; index++) {
      const local: THREE.Vector3 = new THREE.Vector3().fromBufferAttribute(
        positions,
        index,
      );
      const point: AutoMovieHumanSupportFrame.IPoint = {
        bone: identity,
        localPoint: local.toArray(),
      };
      vertices.push(point);
      const position: THREE.Vector3 = local.applyMatrix4(mesh.matrixWorld);
      const previous:
        | { point: AutoMovieHumanSupportFrame.IPoint; position: THREE.Vector3 }
        | undefined = lowest.get(side);
      if (!previous || position.y < previous.position.y)
        lowest.set(side, { point, position });
    }
  }
  const targets: AutoMovieHumanClinicalIk.ITarget[] = [];
  for (const side of ["left", "right"] as const) {
    const witness:
      | { point: AutoMovieHumanSupportFrame.IPoint; position: THREE.Vector3 }
      | undefined = lowest.get(side);
    if (!witness) throw new Error(`Missing actual ${side} sole`);
    targets.push({
      ...witness.point,
      position: [witness.position.x, 0, witness.position.z],
    });
  }
  const channels: AutoMovieHumanRigControls.DegreeChannel[] = [
    ...AutoMovieHumanRigControls.chain({ region: "leg", side: "left" }),
    ...AutoMovieHumanRigControls.chain({ region: "leg", side: "right" }),
  ];
  const initial: AutoMovieHumanGrounding.IRoot = {
    translation: [0, 0, 0],
    rotation: [0, 0, 0, 1],
  };
  if (guard) {
    const ankles: AutoMovieHumanLegIk.ISupport[] = (
      ["left", "right"] as const
    ).map((side: "left" | "right"): AutoMovieHumanLegIk.ISupport => {
      const ankle: AutoMovieHumanSkeleton.IPlacement | undefined =
        person.output.posed.find(
          (item: AutoMovieHumanSkeleton.IPlacement): boolean =>
            item.bone === `${side}Foot`,
        );
      const low:
        | { point: AutoMovieHumanSupportFrame.IPoint; position: THREE.Vector3 }
        | undefined = lowest.get(side);
      if (!ankle || !low)
        throw new Error(`Missing ${side} anatomical support input`);
      return {
        side,
        position: [
          ankle.position[0],
          ankle.position[1] - low.position.y,
          ankle.position[2],
        ],
        kneeFlexion: pose.legs?.[side].knee?.flexion ?? 30,
      };
    });
    const height: ReturnType<typeof AutoMovieHumanLegIk.supportHeight> =
      AutoMovieHumanLegIk.supportHeight(
        person.output,
        person.neutral,
        initial,
        ankles,
      );
    if (height.feasible) {
      initial.translation[1] = height.height;
      for (const ankle of ankles)
        pose = AutoMovieHumanLegIk.seed(
          pose,
          ankle.side,
          [
            ankle.position[0],
            ankle.position[1] - height.height,
            ankle.position[2],
          ],
          person.evaluate(pose),
          person.neutral,
        );
    }
  }
  const fit: AutoMovieHumanGrounding.IPrepared =
    AutoMovieHumanGrounding.prepare(person.evaluate, vertices);
  const support: AutoMovieHumanGrounding.IResult = fit(pose, initial, {
    targets,
    channels,
    rootAxes: ["y"],
    iterations: 16,
    tolerance: 0.00025,
    floorTolerance: 0.000001,
  });
  person.pose(support.pose);
  person.object.position.set(...support.root.translation);
  person.object.updateWorldMatrix(true, true);
  return { support, guardErrors };
}
