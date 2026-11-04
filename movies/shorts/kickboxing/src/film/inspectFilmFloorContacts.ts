import * as THREE from "three";

import type { AudioMix } from "../audio/AudioMix";
import type { LabActor } from "../motion-lab/LabActor";
import type { KnockdownMotion } from "../motion/down/KnockdownMotion";

/**
 * Observe first hip and shoulder arrival on the actual displayed full-body surface.
 * @evidence contracts/common.md#implementation-and-ownership Uses the same original bone-local vertices and actual drawing matrices after each admitted public Grounding sample. A finite 60Hz collapse grid records the first near-floor regional vertex with unchanged native tolerances, not a scheduled impact or a proxy-shrunk body. The caller display is restored afterwards.
 * @evidence contracts/common.md#authoring-interface Returns absolute film floor receipts for the conditioned audio mix. Floor metres and original hip/shoulder carrier identities remain explicit. Finite near-contact observation is not continuous impact-force, swept collision or audible material proof.
 */
export function inspectFilmFloorContacts(
  actor: LabActor,
  down: KnockdownMotion,
  floorY: number,
): AudioMix.FloorContact[] {
  const receipts: AudioMix.FloorContact[] = [];
  const rollback: () => void = actor.checkpoint();
  const regions: {
    bodyPart: "hip" | "shoulder";
    points: ReturnType<LabActor["bodyPoints"]>;
  }[] = [
    {
      bodyPart: "hip",
      points: actor
        .bodyPoints()
        .filter(
          (point: ReturnType<LabActor["bodyPoints"]>[number]): boolean =>
            point.bone === "hips" || point.bone.endsWith("UpperLeg"),
        ),
    },
    {
      bodyPart: "shoulder",
      points: actor
        .bodyPoints()
        .filter((point: ReturnType<LabActor["bodyPoints"]>[number]): boolean =>
          point.bone.endsWith("UpperArm"),
        ),
    },
  ];
  const world: THREE.Vector3 = new THREE.Vector3();
  try {
    for (let frame: number = 0; frame <= 96; frame++) {
      const local: number = frame / 60;
      const sample: KnockdownMotion.Sample = down.sample(local);
      actor.apply(sample);
      if (actor.support?.status !== "admitted")
        throw new Error("Collapse floor contact is unresolved", {
          cause: actor.inspect(),
        });
      for (const region of regions) {
        if (
          receipts.some(
            (row: AudioMix.FloorContact): boolean =>
              row.bodyPart === region.bodyPart,
          )
        )
          continue;
        let minimum: number = Infinity;
        for (const point of region.points) {
          const bone: THREE.Group | undefined = actor.person.drawing.bones.get(
            point.bone,
          );
          if (!bone)
            throw new Error(
              `Missing actual floor-region carrier ${point.bone}`,
            );
          world.set(...point.localPoint).applyMatrix4(bone.matrixWorld);
          minimum = Math.min(minimum, world.y);
        }
        if (minimum >= floorY - 0.000001 && minimum <= floorY + 0.00025)
          receipts.push({
            eventId: `down-${region.bodyPart}`,
            actorId: "b",
            seconds: 150 + local,
            bodyPart: region.bodyPart,
            provenance:
              "First actual original hip/shoulder vertex within the host's unchanged 0.25mm floor-contact tolerance, after complete-body Grounding admission, sampled at 60Hz; no continuous impact-force proof",
          });
      }
    }
  } finally {
    rollback();
  }
  return receipts;
}
