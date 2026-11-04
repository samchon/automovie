import type { LabActor } from "../motion-lab/LabActor";
import type { ContactTrace } from "../motion/interaction/ContactTrace";
import { measureFilmImpact } from "./measureFilmImpact";

/**
 * Inspect the original first-witness pair on the actual displayed head carriers.
 * @evidence contracts/common.md#implementation-and-ownership Resolves both original participant IDs through each displayed person's current collision registry and uses those exact original meshes. A head-carried face attachment is eligible; a neck-only or wrong-actor interception is not. The pure public Engine measurement keeps the original point/time and distinguishes touch, bounded overlap and refusal.
 * @evidence contracts/common.md#authoring-interface seconds is absolute film time. The original pair's full query receipt and both actual world matrices remain attached. Original0.25mm precision is unchanged; inspection provides no force, tissue, medical, continuous-articulation or full-volume claim.
 */
export function inspectFilmImpact(
  attacker: LabActor,
  receiver: LabActor,
  trace: ContactTrace.Result,
  seconds: number,
): inspectFilmImpact.Receipt {
  const pair: ContactTrace.Receipt["pair"] = trace.receipt.pair;
  if (
    !pair ||
    !trace.event ||
    trace.event.actorId !== attacker.id ||
    trace.event.targetId !== receiver.id ||
    !pair.attack.startsWith(`${attacker.id}:`) ||
    !pair.receiver.startsWith(`${receiver.id}:`) ||
    !Number.isFinite(seconds)
  )
    throw new Error(
      "The finishing display requires its original participant pair",
    );
  const strike:
    | ReturnType<LabActor["person"]["collisionParts"]>[number]
    | undefined = attacker.person
    .collisionParts()
    .find(
      (
        part: ReturnType<LabActor["person"]["collisionParts"]>[number],
      ): boolean => `${attacker.id}:${part.id}` === pair.attack,
    );
  const head:
    | ReturnType<LabActor["person"]["collisionParts"]>[number]
    | undefined = inspectFilmImpact.headCarrier(receiver, pair.receiver);
  if (!strike || !head)
    throw new Error(
      "The original finishing pair is not an actual displayed head carrier",
    );
  return {
    ...measureFilmImpact(
      attacker.worldMesh(strike.mesh),
      receiver.worldMesh(head.mesh),
      trace,
    ),
    seconds,
    attackerId: attacker.id,
    targetId: receiver.id,
    pair: { ...pair },
    attackerWorldMatrix: [...attacker.person.object.matrixWorld.elements],
    receiverWorldMatrix: [...receiver.person.object.matrixWorld.elements],
    query: structuredClone(trace.receipt),
    limits: [
      "Original instantaneous head-carrier surfaces; no complete articulated CCD",
      "Vertex signed-depth proxy, not a complete overlap-volume calculation",
      "Original0.25mm contact precision; no geometry shrink or pair exemption",
      "No force, tissue, injury or medical mechanism is inferred",
    ],
  };
}

/**
 * Actual actor identity and WORLD observations attached to the contact classification.
 * @evidence contracts/common.md#implementation-and-ownership Extends the pure measured geometry with the original actual participants, root matrices and finite trace receipt without copying or changing a mesh.
 * @evidence contracts/common.md#authoring-interface Coordinates use world metres and seconds is absolute film time. The native query's uncertainty and the finite depth interpretation remain explicit.
 */
export namespace inspectFilmImpact {
  /**
   * Resolve the original cranial participant while excluding neck-only contact.
   * Current collision registry identity supplies the actual mesh and anatomical carrier. Head, jaw and eye carriers remain cranial; neck and atlas do not become a finishing head hit merely because the general trace groups them in one relation.
   * The full original participant ID is required. The returned registry row is borrowed for immediate WORLD inspection, never a substitute target or geometry exemption. Missing or noncranial rows return undefined.
   */
  export function headCarrier(
    actor: LabActor,
    participantId: string,
  ): ReturnType<LabActor["person"]["collisionParts"]>[number] | undefined {
    return actor.person
      .collisionParts()
      .find(
        (
          part: ReturnType<LabActor["person"]["collisionParts"]>[number],
        ): boolean =>
          `${actor.id}:${part.id}` === participantId &&
          ["head", "jaw", "leftEye", "rightEye"].includes(part.bone),
      );
  }
  /**
   * Actual displayed first-witness evidence, including the current head-carrier identity.
   * Stores detached measured numbers, original crossing triangle identities, original pair/time query metadata and actual root matrices. No live mesh or solver state escapes.
   * Matrix arrays use native column-major WORLD transforms. A valid touch can have zero strict crossings; source preparation still does not establish moving-picture acceptance.
   */
  export interface Receipt extends measureFilmImpact.Receipt {
    /** Absolute displayed film time. */ seconds: number;
    /** Original attacking performer. */ attackerId: string;
    /** Original receiving performer. */ targetId: string;
    /** Exact original queried carriers and receiver triangle. */ pair: NonNullable<
      ContactTrace.Receipt["pair"]
    >;
    /** Actual current attacking root transform. */ attackerWorldMatrix: number[];
    /** Actual current receiving root transform. */ receiverWorldMatrix: number[];
    /** Unchanged finite source query. */ query: ContactTrace.Receipt;
    /** Explicit unproved regions. */ limits: string[];
  }
}
