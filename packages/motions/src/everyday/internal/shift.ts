import {
  AutoMovieEngineMotionSampling,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanShift,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { HumanSupportFrame } from "../../carrier/internal/HumanSupportFrame";
import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanPreparedPlayback } from "../../perform/internal/HumanPreparedPlayback";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { prepareHumanSampledCourse } from "../../posture/internal/prepareHumanSampledCourse";
import { prepareSeatedMaterial } from "./prepareSeatedMaterial";
import { prepareSeatedPalms } from "./prepareSeatedPalms";
import { seated } from "./seated";
import { seatedHands } from "./seatedHands";

/*
 * Shifting along a bench while seated: the seat socket slides sideways along
 * the seat by the requested distance, while the feet stay planted and the hands
 * stay on the thighs.
 *
 * The goal is the socket's path; the root follows with the seated pitch kept,
 * and the legs and hands are solved by inverse kinematics. A seated person
 * edges along by unweighting the buttocks, not by lifting them off: the seat
 * bears throughout, sliding, so the body never stands on its feet alone with
 * its centre of mass behind them, and the socket keeps to the seat on the
 * slide's minimum-jerk share `s`; the slide lasts `0.6 + |d|` seconds for `d`
 * metres (provisional). The feet do not step, so a shift is limited to what the
 * planted legs allow sideways: 0.35 thigh lengths, which turns each thigh about
 * 19 degrees in abduction or adduction, inside their 30 degree range
 * (provisional); a longer shift is refused and takes several shifts, as people
 * edge along a bench a few tens of centimetres at a time.
 *
 * On a seat above 1.2 of the popliteal height, where a foot is off the floor,
 * the shift is refused: getting off and sitting down again moves the body
 * there.
 *
 * Events `seatOff` (the buttocks unweighted as the slide starts) and
 * `seatContact` (bearing fully again as it ends).
 */
export namespace shift {
  /*
   * Admit a sideways displacement in metres within the planted thigh span.
   */
  export function travel(thigh: number, by: number): number {
    const limit: number = 0.35 * thigh;
    if (!(Math.abs(by) <= limit))
      throw new AutoMovieMotionHumanRefusal({
        kind: "parameter",
        axis: "by",
        value: by,
        feasible: { kind: "range", minimum: -limit, maximum: limit, unit: "m" },
        reason: `a seated shift moves at most ${limit.toFixed(3)} m without stepping; shift several times`,
        fix: "shift several times, each within the limit",
      });
    return by;
  }
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionName = "shift";

  /*
   * Cancel table: after setting down a shift may continue sitting.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    rise: [
      {
        window: { start: "seatContact", end: 1 },
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
    shift: [
      {
        window: { start: "seatContact", end: 1 },
        kind: "inertialize",
        entry: 0,
      },
    ],
  };

  /*
   * Plan a shift.
   * Parameter context: The action's context.
   * Returns: The plan.
   * When the shift exceeds the planted legs' side reach.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanShift.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const by: number = travel(body.measure.thigh, context.params.by);
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const start: IAutoMovieVector3 = seated.socket(body, entry);
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(
      humanPostureHeading(entry),
      seated.offset(body),
    );
    const under: number = seated.floor(body, context.entry);

    // The shift pushes off the feet planted on the floor, which a high seat takes off it.
    if (seated.perched(body, context.entry, start, under))
      throw new AutoMovieMotionHumanRefusal({
        kind: "base",
        axis: "base",
        value: "a high seat",
        feasible: { kind: "alternatives", values: ["rise", "sit"] },
        reason: `a seated shift edges along on both planted feet, and this seat holds a foot off the floor`,
        fix: "get off the seat and sit down again where the shift would end",
      });
    const goal: IAutoMovieVector3 = HumanFrame.point(
      { origin: start, yaw: entry.yaw },
      { x: by, y: 0, z: 0 },
    );
    const travelX: number = goal.x - start.x;
    const travelZ: number = goal.z - start.z;
    const slide: number = 0.6 + Math.abs(by);
    const duration: number = slide + (context.params.hold ?? 0.5);
    const feet: Record<AutoMovieHumanSide, IAutoMovieVector3> = stand.feet(
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
    const entered: IAutoMovieMotionHumanEntryState.ISupport | undefined =
      context.entry.supports.find(
        (contact: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
          contact.part === "seat",
      );
    const support: IAutoMovieMotionHumanContactWindow.Support =
      entered?.support ?? HumanSupportFrame.contact(context, "seat");
    const named: prepareSeatedMaterial.ISeat | undefined =
      support.kind === "prop" && support.point !== undefined
        ? prepareSeatedMaterial(context, {
            at: start,
            yaw: entry.yaw,
            carrier: support.subject,
            point: support.point,
          })
        : undefined;
    const correction: ((seconds: number) => number[]) | undefined =
      named === undefined
        ? undefined
        : prepareHumanSampledCourse({
            from: 0,
            to: slide,
            marks: [lift, set],
            sample: (seconds: number): readonly number[] => {
              const bearing:
                | IAutoMovieMotionHumanContactWindow.IMaterial
                | undefined = named.bearing(
                raw(seconds),
                context.start + seconds,
              );
              if (bearing === undefined)
                throw prepareSeatedMaterial.refusal(
                  "seat",
                  support.kind === "prop" ? support.point : undefined,
                );
              return [-bearing.clearance / named.vertical];
            },
            tolerance: { kind: "absolute", absolute: 0.0005 },
            step: 1 / 120,
          });
    const end: IAutoMovieMotionHumanContactWindow.IMaterial | undefined =
      named?.bearing(placed(slide), context.start + slide);
    if (
      named !== undefined &&
      (end === undefined || Math.abs(end.clearance) > HumanFoot.BEARING)
    )
      throw prepareSeatedMaterial.refusal(
        "seat",
        support.kind === "prop" ? support.point : undefined,
      );
    const planned: IAutoMovieMotionHumanActionPlan = {
      duration,
      // A shift slides along the seat it was entered on and stays seated on
      // it (a base transition declares the base it ends in).
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
          to: end === undefined ? 1 : slide / duration,
          support,
        },
        ...(end === undefined
          ? []
          : [
              {
                part: "seat" as const,
                kind: "seat" as const,
                from: slide / duration,
                to: 1,
                support,
                material: end,
              },
            ]),
      ],
      posture: (seconds, channels, resolution, projection) =>
        read(seconds, channels, resolution, projection),
    };
    const bounds: readonly number[] = [0, lift, set, slide, duration];
    let palms: ReturnType<typeof prepareSeatedPalms> | undefined;
    HumanPreparedPlayback.attach(planned, body, {
      mode: "posture",
      prepare: (): void => {
        // A world digit goal can change the flat hand's local articulation.
        palms =
          entry.digits === undefined
            ? prepareSeatedPalms(body, entry)
            : undefined;
      },
      phases: bounds.slice(0, -1).map((from, index) => ({
        from,
        to: bounds[index + 1]!,
        sample: (seconds, channels, resolution, projection) =>
          palms !== undefined && entry.digits === undefined
            ? {
                posture: read(seconds, channels, resolution, projection, palms),
              }
            : undefined,
      })),
    });
    return planned;

    /*
     * Socket and leg goals before the finite seat's height correction.
     */
    function raw(seconds: number): IAutoMovieMotionHumanPosture {
      return placed(seconds, false);
    }

    /*
     * Keep the ankles placed while the hull follows the receiving surface.
     */
    function placed(
      seconds: number,
      corrected: boolean = true,
    ): IAutoMovieMotionHumanPosture {
      const s: number = AutoMovieEngineMotionSampling.minimumJerkShare(
        seconds / slide,
      );
      const socket: IAutoMovieVector3 = {
        x: start.x + travelX * s,
        y: start.y + (corrected ? (correction?.(seconds)[0] ?? 0) : 0),
        z: start.z + travelZ * s,
      };
      const root: IAutoMovieVector3 = Vector3.subtract(socket, offset);
      return { ...entry, root, limbs: legged(root, feet) };
    }

    /*
     * Follow the authored socket and observe the current legs at their plants.
     */
    function read(
      seconds: number,
      _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      prepared?: ReturnType<typeof prepareSeatedPalms>,
    ): IAutoMovieMotionHumanPosture {
      const t: number = Math.min(duration, Math.max(0, seconds));
      return seatedHands.arms(
        body,
        placed(t),
        1,
        resolution,
        projection,
        prepared,
      );
    }
  }

  /*
   * The share of the slide over which the buttocks unweight at its start, and
   * bear fully again before its end (provisional).
   */
  const UNWEIGHT: number = 0.15;
}
