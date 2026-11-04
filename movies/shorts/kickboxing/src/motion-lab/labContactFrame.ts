import type { MotionAction } from "../motion/core/MotionAction";
import type { ContactTrace } from "../motion/interaction/ContactTrace";
import type { LabActor } from "./LabActor";
import type { LabSettings } from "./LabSettings";
import { requireLabSupport } from "./requireLabSupport";
import { LabArmAnatomy } from "./LabArmAnatomy";

/**
 * Snapshot the existing complete actual limb/receiver registry for a declared strike side.
 * @evidence contracts/common.md#implementation-and-ownership Shares the exact original full surfaces between single actions and an overlapping pair. Every native source mesh retains actor ownership and all preceding guard/body/check surfaces participate. Actual support admission precedes any collision event.
 * @evidence contracts/common.md#authoring-interface Settings select query roles, never geometry exemptions. Returned world triangles are detached and finite sampling remains ContactTrace's responsibility; this function invents no contact or physical success.
 */
export function labContactFrame(attacker: LabActor, receiver: LabActor, sample: MotionAction.Sample, settings: Pick<LabSettings,"action"|"side"|"defense">, defenseSide: MotionAction.Side): ContactTrace.Frame {
    requireLabSupport([attacker, receiver], sample.elapsed);
    const receivers: ContactTrace.Receiver[] = [];
    for (const part of receiver.person.collisionParts()) {
      const bone: string = part.bone;
      const relation: MotionAction.ContactEvent["relation"] = ["head", "jaw", "leftEye", "rightEye", "neck", "atlas"].includes(bone) ? "head" : LabArmAnatomy.contains(bone) ? "guard" : settings.defense === "check" && bone === `${defenseSide}LowerLeg` ? "shin-check" : "body";
      receivers.push({ id: `${receiver.id}:${part.id}`, relation, mesh: receiver.worldMesh(part.mesh) });
    }
    const attacks: ContactTrace.Attack[] = [];
    const kick: boolean = settings.action.endsWith("kick");
    for (const part of attacker.person.collisionParts()) {
      const strike: boolean = kick ? part.bone.startsWith(settings.side) && /^(LowerLeg|Foot|Subtalar|Midfoot|Hallux.*|Toe.*)$/u.test(part.bone.slice(settings.side.length)) : part.mesh === attacker.glove(settings.side);
      attacks.push({ id: `${attacker.id}:${part.id}`, role: strike ? "strike" : "clearance", mesh: attacker.worldMesh(part.mesh) });
    }
    return { sample, attacks, receivers };
}

