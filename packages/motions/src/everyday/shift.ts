import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanShift,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { HumanSupportFrame } from "../carrier/HumanSupportFrame";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPreparedPlayback } from "../perform/HumanPreparedPlayback";
import { HumanFrame } from "../posture/HumanFrame";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareSeatedPalms } from "./prepareSeatedPalms";
import { seated } from "./seated";
import { seatedHands } from "./seatedHands";

/**
 * Shifting along a bench while seated: the seat socket slides sideways
 * along the seat by the requested distance, while the feet stay planted and
 * the hands stay on the thighs.
 *
 * The goal is the socket's path; the root follows with the seated pitch kept,
 * and the legs and hands are solved by inverse kinematics. A seated person
 * edges along by unweighting the buttocks, not by lifting them off: the
 * seat bears throughout, sliding, so the body never stands on its feet
 * alone with its centre of mass behind them, and the socket keeps to the
 * seat on the slide's minimum-jerk share `s`; the slide lasts `0.6 + |d|`
 * seconds for `d` metres (provisional). The feet do not step, so a shift is
 * limited to what the planted legs allow sideways: 0.35 thigh lengths, which
 * turns each thigh about 19 degrees in abduction or adduction, inside their
 * 30 degree range (provisional); a longer shift is refused and takes several
 * shifts, as people edge along a bench a few tens of centimetres at a time.
 *
 * On a seat above 1.2 of the popliteal height, where a foot is off the
 * floor, the shift is refused: getting off and sitting down again moves
 * the body there.
 *
 * Events `seatOff` (the buttocks unweighted as the slide starts) and
 * `seatContact` (bearing fully again as it ends).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the goal, the method, the timing, the events and the refusals, with sources and provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table and a pure plan of postures in world metres and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters and the plan the performance dispatches through, plus the helpers its tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, plan, hand and frame types; no body is special-cased.
 */
export namespace shift {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "shift";

  /** The share of the slide over which the buttocks unweight at its start, and bear fully again before its end (provisional). */
  const UNWEIGHT: number = 0.15;

  /** Cancel table: after setting down a shift may continue sitting. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    rise: [
      { window: ["seatContact", 1], kind: "inertialize", entry: 0, blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate },
    ],
    shift: [{ window: ["seatContact", 1], kind: "inertialize", entry: 0 }],
  };

  /**
   * Plan a shift.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the shift exceeds the planted legs' side reach.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States context/plan and lateral-reach refusal; the namespace gives world-metre socket travel, action seconds and seat/plant conventions.
   * @evidence contracts/development/implementation.md#principled-implementation The original minimum-jerk seat-socket slide derives the root under unchanged heading, while native planted-leg goals and thigh hand-rest targets keep their original geometry.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Validate side reach/base, prepare fixed feet, then evaluate the original socket course and hand-rest owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original body-scaled side bound and high-seat refusal remain, with no moved plant, added base transition, changed contact time or relaxed range.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed heading/contact/knee coefficients prepare once; each query evaluates socket/root geometry and current thigh frames. Native phases transport prepared skin hits and use prepared flat-hand extent readers.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed body/entry heading/ankles share leg metadata and fixed local thigh and flat-hand geometry. Current knee/root targets stay fresh and hand observations borrow parent FK/ROM sources only during that synchronous call.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns its fixed entry/feet and scalar timing until release; current hand maps and borrowed FK/ROM sources end on return or throw and never enter its retained geometry.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanShift.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const limit: number = 0.35 * body.measure.thigh;
    if (!(Math.abs(context.params.by) <= limit))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "by",
        value: context.params.by,
        feasible: { kind: "range", minimum: -limit, maximum: limit, unit: "m" },
        reason: `a seated shift moves at most ${limit.toFixed(3)} m without stepping; shift several times`,
        fix: "shift several times, each within the limit",
      });
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const start: IAutoMovieVector3 = seated.socket(body, entry);
    const under: number = seated.floor(body, context.entry);

    // The shift pushes off the feet planted on the floor, which a high seat takes off it.
    if (seated.perched(body, context.entry, start, under))
      throw new HumanRefusal({
        kind: "base",
        axis: "base",
        value: "a high seat",
        feasible: { kind: "alternatives", values: ["rise", "sit"] },
        reason: `a seated shift edges along on both planted feet, and this seat holds a foot off the floor`,
        fix: "get off the seat and sit down again where the shift would end",
      });
    const goal: IAutoMovieVector3 = HumanFrame.point(
      { origin: start, yaw: entry.yaw },
      { x: context.params.by, y: 0, z: 0 },
    );
    const slide: number = 0.6 + Math.abs(context.params.by);
    const duration: number = slide + (context.params.seconds ?? 0.5);
    const feet: Record<"left" | "right", IAutoMovieVector3> = stand.feet(
      body,
      context.entry,
      entry.yaw,
    );
    const legged: ReturnType<typeof stand.prepareLegs> = stand.prepareLegs(
      body,
      entry.yaw,
    );
    const lift: number = UNWEIGHT * slide;
    const set: number = (1 - UNWEIGHT) * slide;
    const planned: IAutoMovieMotionHumanActionPlan = {
      duration,
      // A shift slides along the seat it was entered on and stays seated on
      // it (#3363: a base transition declares the base it ends in).
      base:
        context.entry.base.kind === "seated"
          ? context.entry.base
          : { kind: "seated" },
      events: [
        { name: "seatOff", share: lift / duration },
        { name: "seatContact", share: set / duration },
      ],
      contacts: [
        {
          part: "leftFoot",
          kind: "plant",
          from: 0,
          to: 1,
          support: HumanSupportFrame.contact(context, "leftFoot"),
        },
        {
          part: "rightFoot",
          kind: "plant",
          from: 0,
          to: 1,
          support: HumanSupportFrame.contact(context, "rightFoot"),
        },
        {
          part: "seat",
          kind: "seat",
          from: 0,
          to: 1,
          support: HumanSupportFrame.contact(context, "seat"),
        },
      ],
      posture: (seconds, channels, resolution, projection) =>
        read(seconds, channels, resolution, projection),
    };
    const bounds: readonly number[] = [0, lift, set, slide, duration];
    let palms: ReturnType<typeof prepareSeatedPalms> | undefined;
    HumanPreparedPlayback.attach(planned, body, {
      mode: "posture",
      prepare: (): void => {
        palms = prepareSeatedPalms(body, entry);
      },
      phases: bounds.slice(0, -1).map((from, index) => ({
        from,
        to: bounds[index + 1]!,
        sample: (seconds, channels, resolution, projection) =>
          prepareHumanPoseResolution.isNativeSource(resolution)
            ? { posture: read(seconds, channels, resolution, projection, palms) }
            : undefined,
      })),
    });
    return planned;

    /** Follow the authored socket and observe the current legs at their plants. */
    function read(
      seconds: number,
      _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      prepared?: ReturnType<typeof prepareSeatedPalms>,
    ): IAutoMovieMotionHumanPosture {
      const t: number = Math.min(duration, Math.max(0, seconds));
      const s: number = minimumJerk.share(t / slide);
      const socket: IAutoMovieVector3 = {
        x: start.x + (goal.x - start.x) * s,
        y: start.y,
        z: start.z + (goal.z - start.z) * s,
      };
      const root: IAutoMovieVector3 = seated.root(body, socket, entry);
      const posture: IAutoMovieMotionHumanPosture = {
        ...entry,
        root,
        limbs: legged(root, feet),
      };
      return seatedHands.arms(body, posture, 1, resolution, projection, prepared);
    }
  }
}
