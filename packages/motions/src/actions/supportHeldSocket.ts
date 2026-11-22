import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanSupport,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { prepareSupportContactForm } from "./prepareSupportContactForm";
import type { prepareSupportHeldFrames } from "./prepareSupportHeldFrames";
import { supportContact } from "./supportContact";
import type { supportPlan } from "./supportPlan";

/**
 * The sole socket each floor foot holds through its window: its ball, the
 * point a turning foot pivots on, unless at the key it is set down on the ball is off the
 * floor above a bearing heel (`HumanFoot.BEARING`), when its heel. A
 * foot whose stance turns the body over it rolls about that one point in
 * every interval of the window (`prepareSupportHeldFrames`), and the window
 * declares it (`IAutoMovieMotionHumanContactWindow.socket`), so the audits
 * read the point the foot holds: a heel swinging about a held ball as the
 * body turns is a pivot, not a slip (the staged clinch's 25 mm).
 *
 * @param body The body.
 * @param keys The solved keys in time order.
 * @returns The held socket by contact; none for a contact not on the floor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the choice, where it is read and why one socket serves the window.
 * @evidence contracts/development/implementation.md#principled-implementation The foot rocker's point (Perry and Burnfield) chosen once per placement from the key that sets the foot down, the ball unless only the heel bears there.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the keys; one pose read per key that sets a floor foot down.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A raised contact keeps its own datum; only floor feet hold a sole socket.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each placement is decided once, at its first key.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the contact identity, the contact form's floor test and the sole sockets.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a reader over one small map.
 */
export function supportHeldSocket(
  body: IAutoMovieMotionHumanBody,
  keys: readonly supportPlan.IKey[],
): prepareSupportHeldFrames.Socket {
  const form: ReturnType<typeof prepareSupportContactForm> =
    prepareSupportContactForm(body, false);
  const held: Map<string, "heel" | "ball"> = new Map();
  for (const key of keys) {
    let bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> | undefined;
    for (const contact of key.contacts) {
      if (contact.part !== "leftFoot" && contact.part !== "rightFoot") continue;
      const id: string = supportContact.id(contact);
      if (held.has(id)) continue;
      if (form(contact, key.place(contact)).bearing === undefined) continue;
      bones ??= poseBones(body, resolveHumanPosture(body, key.posture));
      const side: AutoMovieHumanSide =
        contact.part === "leftFoot" ? "left" : "right";
      const sole: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
        body,
        bones,
        side,
      );
      const heel: IAutoMovieMotionHumanFoot.ISocket = sole.find(
        (s: IAutoMovieMotionHumanFoot.ISocket): boolean => s.socket === "heel",
      )!;
      const ball: IAutoMovieMotionHumanFoot.ISocket = sole.find(
        (s: IAutoMovieMotionHumanFoot.ISocket): boolean => s.socket === "ball",
      )!;
      held.set(
        id,
        ball.point.y - heel.point.y > HumanFoot.BEARING ? "heel" : "ball",
      );
    }
  }
  return (
    contact: IAutoMovieMotionHumanSupport.IContact,
  ): "heel" | "ball" | undefined => held.get(supportContact.id(contact));
}
