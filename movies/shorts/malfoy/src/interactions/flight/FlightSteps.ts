import type { IAutoMovieVector3 } from "@automovie/interface";

import type { Student } from "../../entities/cast/student/Student";
import { BodyFrame } from "../../laws/body/BodyFrame";
import type { IBodyState } from "../../laws/body/IBodyState";
import { BroomLaw } from "../../laws/flight/BroomLaw";
import type { StageAction } from "../../laws/staging/StageAction";
import type { EverydaySteps } from "../everyday/EverydaySteps";
import type { StageContext } from "../staging/StageContext";

/**
 * Broom riding and Quidditch actions on the stage. A rider's broom never
 * stops between actions: a `fly` follows its route at its speed, and every
 * other riding action carries the broom on along its heading at its current
 * speed (sinking under a hanging rider), so the flight is continuous.
 * Positions are the seat point in the air.
 *
 * ```ts
 * FlightSteps.time({ kind: "fly", route: [{ place: "eastSouthGap" }], speed: 15 }, from, context, harry);
 * ```
 *
 * @evidence docs/research/flight/broom-riding.md#speed Speeds of the route.
 * @evidence docs/research/flight/broom-riding.md#hanging A hanging rider's broom keeps its line and sinks.
 * @evidence docs/research/flight/broom-riding.md#transfer The five transfer phases.
 * @evidence docs/research/quidditch/practice-play.md#chasers A pass travels 8-15 m in 0.8-1.5 s.
 * @evidence docs/research/quidditch/practice-play.md#stopping A raised arm stops play.
 * @evidence contracts/development/behaviors.md#studied-laws Durations from the broom and play laws.
 * @evidence contracts/development/behaviors.md#relational-goals Rear offers and transfers resolve against the other rider's placed state.
 * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure functions of placed entries.
 * @evidence contracts/development/common.md#meaningful-documentation States the continuous-flight rule.
 */
export namespace FlightSteps {
  /** The timing of a flight action. */
  export function time(action: StageAction.Flight, from: IBodyState, context: StageContext, student: Student): EverydaySteps.ITime {
    switch (action.kind) {
      case "mount":
        return { duration: 1.0 };
      case "fly": {
        const points: IAutoMovieVector3[] = [from.position, ...action.route.map((t) => context.point(t))];
        const path: BroomLaw.IPath = BroomLaw.path(points);
        const end: IAutoMovieVector3 = points[points.length - 1]!;
        const tangent: IAutoMovieVector3 = path.tangent(path.length);
        return { duration: Math.max(0.1, path.length / action.speed), move: { position: end, heading: Math.atan2(tangent.x, tangent.z) }, route: points };
      }
      case "reach":
        return { duration: 0.6, contact: 0.5, point: context.point(action.for) };
      case "slip":
        return { duration: 0.6, contact: 0.3 };
      case "swingArm":
        return { duration: 0.8, contact: 0.5 };
      case "offerRear": {
        // Alongside where the hanging rider is when the approach ends, two seconds after its start.
        const other: IBodyState = context.body(action.to, (action.start ?? context.time) + 2.0);
        // Alongside on the hanging rider's free-hand side with the seat ahead of his chest: the shaft passes 0.4 m beside his
        // torso (which hangs below his grip, 0.3 m ahead of his seat point) at lower-chest height, so the rear seat half a
        // metre behind lies beside his torso, within reach of his free hand.
        const side: number = other.hands.left.place === "shaft" && other.hands.right.place !== "shaft" ? -1 : 1;
        const beside: IAutoMovieVector3 = BodyFrame.toWorld(other.position, other.heading, { forward: 0.3 + BroomLaw.TANDEM_SPACING, left: 0.4 * side, up: -0.8 });
        // The approach comes in wide of him, a metre out to the side and a little low behind his torso, then closes onto the station.
        const wide: IAutoMovieVector3 = BodyFrame.toWorld(other.position, other.heading, { forward: -0.4, left: 1.1 * side, up: -1.0 });
        return { duration: 2.0, move: { position: beside, heading: other.heading }, point: wide };
      }
      case "transfer": {
        // Admitted only when all three conditions hold as the free hand would start to close; otherwise he keeps hanging.
        // His grip and speed are the placed state's; where his broom has carried him by then is the previous pass's.
        const now: IBodyState = context.body(student.id, context.time);
        const rider: IBodyState = { ...from, position: now.position, heading: now.heading };
        const host: IBodyState = context.body(action.onto, context.time);
        const admitted: boolean = from.support === "hang" && FlightSteps.admits(rider, host, student);
        return { duration: BroomLaw.TRANSFER_PHASES.reduce((a, b) => a + b, 0), contact: BroomLaw.TRANSFER_PHASES[0]!, outcome: admitted ? "transferred" : "not-admitted" };
      }
      case "pass":
        return { duration: 0.6, contact: 0.45 };
      case "strike":
        return { duration: 0.5, contact: 0.3 };
      case "stopPlay":
        return { duration: 0.6, contact: 0.3 };
      case "hover":
        return { duration: Math.max(0.1, from.speed / BroomLaw.BRAKE) };
      case "escort":
        return { duration: Math.max(0.1, action.seconds) };
    }
  }

  /** The state a flight action ends in. */
  export function end(action: StageAction.Flight, from: IBodyState, context: StageContext, _student: Student, t: EverydaySteps.ITime): IBodyState {
    const hands = { left: { ...from.hands.left }, right: { ...from.hands.right } };
    const carried = (seconds: number): IAutoMovieVector3 => {
      const f: IAutoMovieVector3 = BodyFrame.forward(from.heading);
      return { x: from.position.x + f.x * from.speed * seconds, y: Math.max(0.5, from.position.y + from.climb * seconds), z: from.position.z + f.z * from.speed * seconds };
    };
    switch (action.kind) {
      case "mount":
        return { ...from, hands: { left: { place: "shaft", point: null, holds: hands.left.holds }, right: { place: "shaft", point: null, holds: hands.right.holds } }, support: "ride", broom: action.broom, position: { ...from.position, y: from.position.y + 1.2 } };
      case "fly": {
        const speed: number = action.speed;
        return { ...from, hands, position: t.move!.position, heading: t.move!.heading, speed, climb: 0, support: from.support === "hang" ? "hang" : from.support };
      }
      case "reach":
        if (!action.close) hands[action.hand] = { ...hands[action.hand], place: "extended", point: t.point! };
        else hands[action.hand] = { ...hands[action.hand], place: "shaft", point: null };
        return { ...from, hands, position: carried(t.duration) };
      case "slip":
        hands[action.hang] = { ...hands[action.hang], place: "shaft", point: null };
        hands[action.hang === "right" ? "left" : "right"] = { place: "side", point: null, holds: null };
        return { ...from, hands, support: "hang", position: carried(t.duration), climb: -BroomLaw.HANG_SINK };
      case "swingArm":
        return { ...from, hands, position: carried(t.duration) };
      case "offerRear":
        return { ...from, hands, position: t.move!.position, heading: t.move!.heading, speed: context.body(action.to).speed, climb: context.body(action.to).climb };
      case "transfer": {
        if (t.outcome === "not-admitted") return { ...from, hands };
        const host: IBodyState = context.body(action.onto, (action.start ?? context.time) + BroomLaw.TRANSFER_PHASES.reduce((a, b) => a + b, 0));
        const behind: IAutoMovieVector3 = BodyFrame.toWorld(host.position, host.heading, { forward: -BroomLaw.TANDEM_SPACING, left: 0, up: 0 });
        return { ...from, hands: { left: { place: "shaft", point: null, holds: null }, right: { place: "shaft", point: null, holds: null } }, support: "tandem", broom: host.broom, position: behind, heading: host.heading, speed: host.speed, climb: 0 };
      }
      case "pass":
      case "strike":
        return { ...from, hands, position: carried(t.duration) };
      case "stopPlay":
        // The arm stays up until the hand goes back to the shaft.
        hands.right = { place: "raised", point: null, holds: hands.right.holds };
        return { ...from, hands, position: carried(t.duration) };
      case "hover": {
        const s: number = (from.speed * from.speed) / (2 * BroomLaw.BRAKE);
        const f: IAutoMovieVector3 = BodyFrame.forward(from.heading);
        const position: IAutoMovieVector3 = { x: from.position.x + f.x * s, y: from.position.y, z: from.position.z + f.z * s };
        const heading: number = action.facing === undefined ? from.heading : BodyFrame.headingTo(position, context.point(action.facing));
        return { ...from, hands, position, heading, speed: 0, climb: 0 };
      }
      case "escort": {
        // At the end it keeps station beside the escorted rider: same heading, speed and climb.
        const other: IBodyState = context.body(action.subject, context.time + t.duration);
        const station: IAutoMovieVector3 = BodyFrame.toWorld(other.position, other.heading, { forward: 0, left: (action.side === "left" ? 1 : -1) * action.distance, up: 0 });
        return { ...from, hands, position: station, heading: other.heading, speed: other.speed, climb: other.climb };
      }
    }
  }
  /**
   * Whether a hanging rider may transfer onto a host's rear seat: the shafts
   * parallel within 10°, the speeds within 0.5 m/s, and the host's empty rear
   * section (half a metre behind its seat point) within 0.5 m of the hanging
   * rider's free hand, which hangs at his side 0.45 m above the pelvis.
   *
   * @param rider The hanging rider's state.
   * @param host The front rider's state.
   * @param student The hanging rider.
   * @returns Whether the transfer is admitted.
   * @evidence docs/research/flight/broom-riding.md#transfer The three conditions.
   * @evidence docs/research/flight/broom-riding.md#outcomes Any condition missing: not admitted.
   */
  export function admits(rider: IBodyState, host: IBodyState, student: Student): boolean {
    const m = student.measure;
    const c = BroomLaw.TRANSFER_CONDITIONS;
    if (Math.abs(BodyFrame.turn(rider.heading, host.heading)) > c.parallel) return false;
    if (Math.abs(rider.speed - host.speed) > c.speed) return false;
    const side: number = rider.hands.left.place === "shaft" && rider.hands.right.place !== "shaft" ? -1 : 1;
    const grip: IAutoMovieVector3 = BodyFrame.toWorld(rider.position, rider.heading, { forward: 0.3, left: 0, up: -0.02 });
    const pelvis: IAutoMovieVector3 = { x: grip.x, y: grip.y - (m.shoulder - m.hip) - 0.95 * m.armReach, z: grip.z };
    const hand: IAutoMovieVector3 = BodyFrame.toWorld(pelvis, rider.heading, { forward: 0, left: 0.3 * side, up: 0.45 });
    const rear: IAutoMovieVector3 = BodyFrame.toWorld(host.position, host.heading, { forward: -BroomLaw.TANDEM_SPACING, left: 0, up: 0 });
    return Math.hypot(hand.x - rear.x, hand.y - rear.y, hand.z - rear.z) <= c.reach;
  }
}
