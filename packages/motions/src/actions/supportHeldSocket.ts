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

/** The alternatives of `SupportHeldSocketResult`'s site. */
type SupportHeldSocketResult = "heel" | "ball" | undefined;

/** The alternatives of `SupportHeldSocketHeldEntry`'s site. */
type SupportHeldSocketHeldEntry = "heel" | "ball";

/**
 * The sole socket each floor foot holds through its window: its ball, the point
 * a turning foot pivots on, unless at the key it is set down on the ball is off
 * the floor above a bearing heel (`HumanFoot.BEARING`), when its heel. A foot
 * whose stance turns the body over it rolls about that one point in every
 * interval of the window (`prepareSupportHeldFrames`), and the window declares
 * it (`IAutoMovieMotionHumanContactWindow.socket`), so the audits read the
 * point the foot holds: a heel swinging about a held ball as the body turns is
 * a pivot, not a slip (the staged clinch's 25 mm).
 *
 * @param body The body.
 * @param keys The solved keys in time order.
 * @returns The held socket by contact; none for a contact not on the floor.
 */
export function supportHeldSocket(
  body: IAutoMovieMotionHumanBody,
  keys: readonly supportPlan.IKey[],
): prepareSupportHeldFrames.Socket {
  const form: ReturnType<typeof prepareSupportContactForm> =
    prepareSupportContactForm(body, false);
  const held: Map<string, SupportHeldSocketHeldEntry> = new Map();
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
  ): SupportHeldSocketResult => held.get(supportContact.id(contact));
}
