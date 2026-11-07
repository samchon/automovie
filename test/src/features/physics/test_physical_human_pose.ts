import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { Vector3 } from "../../../../packages/engine/src/math/Vector3";
import { AutoMovieHumanPhysicalPose } from "../../../../packages/human/src/skeleton/AutoMovieHumanPhysicalPose";
import { HumanPeople } from "../internal/HumanPeople";

/** The actual Human's folded rig retains solved midfoot motion and authored finger detail. */
export function test_physical_human_pose(): void {
  const person: HumanPeople.IRigged = HumanPeople.rigged("m1");
  const reference: ReturnType<typeof person.evaluate> = person.evaluate({});
  const original: Map<string, P.ITransform> = new Map(
    reference.posed.map(
      (pose: (typeof reference.posed)[number]): [string, P.ITransform] => [
        pose.bone,
        {
          position: {
            x: pose.position[0],
            y: pose.position[1],
            z: pose.position[2],
          },
          rotation: {
            x: pose.rotation[0],
            y: pose.rotation[1],
            z: pose.rotation[2],
            w: pose.rotation[3],
          },
        },
      ],
    ),
  );
  const foot: P.ITransform = structuredClone(original.get("leftMidfoot")!);
  foot.position.x += 0.03;
  const hand: P.ITransform = structuredClone(original.get("leftHand")!);
  const turn: P.ITransform["rotation"] = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    30,
  );
  hand.position.z += 0.04;
  hand.rotation = Quaternion.multiply(turn, hand.rotation);
  const output: Record<string, P.ITransform> =
    AutoMovieHumanPhysicalPose.resolve({
      skeleton: person.rig.skeleton,
      reference,
      segments: { leftMidfoot: foot, leftHand: hand },
    });
  const expectedToe: P.ITransform["position"] = Vector3.add(
    original.get("leftHalluxProximal")!.position,
    { x: 0.03, y: 0, z: 0 },
  );
  const expectedFinger: P.ITransform["position"] = Vector3.add(
    hand.position,
    Quaternion.rotateVector(
      turn,
      Vector3.subtract(
        original.get("leftIndexProximal")!.position,
        original.get("leftHand")!.position,
      ),
    ),
  );
  const findings: string[] = [];
  const clinical: Record<string, P.ITransform> =
    AutoMovieHumanPhysicalPose.complete({
      reference,
      segments: { leftMidfoot: foot, leftHand: hand },
    });
  if (
    Object.keys(clinical).length !== reference.bones.length ||
    Vector3.length(
      Vector3.subtract(clinical.leftMidfoot!.position, foot.position),
    ) > 1e-10 ||
    Vector3.length(
      Vector3.subtract(clinical.leftIndexProximal!.position, expectedFinger),
    ) > 1e-10
  )
    findings.push(
      "complete clinical frames lost solved carriers or authored descendants before render-rig folding",
    );
  if (
    Vector3.length(Vector3.subtract(output.leftToes!.position, expectedToe)) >
    1e-10
  )
    findings.push("solved midfoot did not carry the folded toe rig");
  if (
    Vector3.length(
      Vector3.subtract(output.leftIndexProximal!.position, expectedFinger),
    ) > 1e-10
  )
    findings.push("authored finger detail did not follow its solved hand");
  if (
    Object.keys(output).length !== person.rig.skeleton.bones.length ||
    output.leftMidfoot !== undefined
  )
    findings.push(
      "render rig ownership was replaced with the clinical hierarchy",
    );
  TestValidator.equals(
    "actual Human physical-to-render rig mapping",
    findings,
    [],
  );
}
