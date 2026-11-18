import { ANKLE_DORSIFLEXION, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRise,
  IAutoMovieMotionHumanSeated,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { standUpright } from "../actions/standUpright";
import { HumanSupportFrame } from "../carrier/HumanSupportFrame";
import { AutoMovieMotionHumanArmChain } from "../compose/AutoMovieMotionHumanArmChain";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { HumanMountOff } from "../lexicon/HumanMountOff";
import { HumanFrame } from "../posture/HumanFrame";
import { hipJoints } from "../posture/hipJoints";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanTrunk } from "./HumanTrunk";
import { prepareRiseFeet } from "./prepareRiseFeet";
import { prepareSeatedRoot } from "./prepareSeatedRoot";
import { riseRested } from "./riseRested";
import { riseSeatOff } from "./riseSeatOff";
import { seated } from "./seated";
import { seatedCourse } from "./seatedCourse";

/**
 * Standing up from a seat, in the four phases of sit-to-stand (Schenkman,
 * Berger, Riley, Mann and Hodge 1990, Phys Ther 70:638): flexion momentum,
 * where the trunk flexes forward while the seat still bears the weight;
 * momentum transfer at seat-off, where the hips leave the seat and the body
 * moves forward over the feet; extension of the hips and knees; and
 * stabilisation.
 *
 * The goal is the seat socket's path from where it rests to where it stands
 * over the planted feet; the root follows from it and the trunk's pitch, and
 * the legs are solved onto the unmoved feet. The trunk flexes on a
 * minimum-jerk profile over the first half of the rise to a peak of at least
 * `35 + 50 (1 - r)` degrees, so it is still flexing fast when the seat is
 * left (peak trunk flexion closely follows seat-off, Schenkman et al.).
 * Seat-off comes at the first frame from 36 % of the rise, where the flexion
 * phase ends in healthy adults (McDonald, Villarejo Mayor and Lennon 2025,
 * Front Bioeng Biotechnol 13:1605524), to the trunk's peak, at which the extrapolated centre
 * of mass of the engine's whole-body model (Hof, Gazendam and Sinke 2005)
 * enters the feet's base of support: the forward momentum of the flexing
 * trunk then carries the body over the feet. When no frame does, the peak
 * is raised in 5 degree steps up to 70 degrees, then the feet are drawn
 * further back (below), and a rise whose feet stand too far ahead even then
 * is refused. From seat-off the socket travels forward and up to standing
 * at 85 %, the trunk returns upright by the end, and the hands leave the
 * thighs, or the armrests they pushed on, over the next 30 %. The time is `2 (1 + 0.6 (1 - r))` seconds for a seat at `r` of the popliteal
 * height, the seat height being where the socket rests (provisional, as the
 * sit's).
 *
 * Before it, a body sitting deep edges forward on the seat until its hip
 * joints stand at most one thigh length behind the ankles, so the knees come
 * near over the feet, as people do before rising from a deep seat (a
 * provisional rule, kept 0.6 thigh lengths inside the front edge when the
 * entered sit names its seat); the edging takes `0.4 + 1.5 d` seconds for
 * `d` metres (provisional).
 *
 * Then each foot standing ahead of its knee is drawn back, one at a time
 * over `DRAW` seconds with a `LIFT` clearance, until the ankle stands behind
 * the knee with the shank 12 degrees forward of vertical, inside the 10 to
 * 15 degrees of a prepared sit-to-stand (moving the feet behind the knees
 * reduces the trunk lean the rise needs; Shepherd and Koh 1996, Scand J
 * Rehabil Med 28:79; values provisional). A body that cannot leave the seat
 * over feet drawn that far draws them further, 2 degrees of shank at a time,
 * up to the ankle's 20 degrees of dorsiflexion (the rig's range of motion).
 * A pelvis that stands more than 1 cm aside of the feet's middle, as after a
 * shift along the seat, has both feet set across by that distance in the
 * same draws, the foot on that side first: the body rises between its feet,
 * not over the edge of their base.
 *
 * The rise reads only the seated posture it is entered from, so it follows
 * a sit, a shift or any posture with the socket on a seat. Events `seatOff`
 * and `standing`; the seat window ends at seat-off.
 *
 * A seat above 1.2 of the popliteal height with a foot off the floor, as a
 * bar stool or a saddle is sat on, is got off instead
 * ({@link HumanMountOff}), ahead of the seat or to the side `to` names, with
 * the same events.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the goal, the method, the timing, the events and the refusals, with sources and provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table and a pure plan of postures in world metres and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters and the plan the performance dispatches through, plus the helpers its tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, plan, hand and frame types; no body is special-cased.
 */
export namespace rise {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "rise";

  /** Cancel table: a rise cut before seat-off returns to sitting; after standing it may become anything a stand can. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    sit: [
      { window: [0, "seatOff"], kind: "inertialize", entry: 0, blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate },
    ],
    stand: [{ window: ["standing", 1], kind: "inertialize", entry: 0 }],
    walk: [
      { window: ["standing", 1], kind: "inertialize", entry: 0, blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate },
    ],
  };

  /** Seconds a foot takes to be drawn back (provisional). */
  export const DRAW: number = 0.5;

  /** How high a drawn foot lifts, metres (provisional). */
  export const LIFT: number = 0.03;

  /** Shank angles forward of vertical the feet are drawn back to, tried in order, degrees: from 12 (provisional, Shepherd and Koh 1996) by 2 up to the dorsiflexion of a foot that bears no weight (`ANKLE_DORSIFLEXION.unloaded`), as the seated foot being drawn does not. */
  export const SHANK: readonly number[] = Array.from(
    { length: Math.floor((ANKLE_DORSIFLEXION.unloaded - 12) / 2) + 1 },
    (_: unknown, i: number): number => 12 + 2 * i,
  );

  /** The least edging, metres, worth a move: below a millimetre's scale a body does not shift on its seat (provisional). */
  const EDGE: number = 0.005;

  /** The least horizontal correction of a foot, metres, that draws it back or across (provisional, the namespace's 1 cm). */
  const NUDGE: number = 0.01;

  /** The share of the rise at which the socket stands over the feet (provisional, the namespace's 85 %). */
  const STOOD: number = 0.85;

  /** The delay of the socket's rise behind its forward travel after seat-off, as a share of the rise (provisional). */
  const LAG: number = 0.03;

  /**
   * Plan a rise.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the feet stand too far ahead to rise over them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the context/plan and reach refusal; the namespace gives world-metre socket/plant goals, phase timing, degree bounds and seat-off conventions.
   * @evidence contracts/development/implementation.md#principled-implementation The original socket course, planted legs, trunk flexion and extrapolated mass-centre seat-off rule retain their canonical owners; high seats delegate to the existing dismount law.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Original foot/pitch/seat-off selection precedes one prepared foot course and two current rise branches sharing the native lowering/hand-rest owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All foot/angle candidates, seat-off scan samples, extrapolation, joint ranges and contact thresholds remain; infeasible feet are refused rather than moved outside the original search.
   * @evidence contracts/development/implementation.md#efficient-algorithms Planning retains all original seat-off candidates/full solves with native observation/FK/ROM preparation. Fixed foot courses, actual edging vector endpoints and constant entry-heading seat offset prepare once; each current posture retains actual hip lowering and active hand observations.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Seat-off construction releases its native metadata before the returned plan is built; only selected feet/peak/off data escape. Both current branches delegate raw hip lowering and hand resting to riseRested, sharing only synchronous parent FK/ROM prerequisites while every changed posture/fit remains evaluated.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns its fixed course/scalars and original entry geometry until release; current-query FK/ROM loans end on return or throw without entering the retained plan or goals.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRise.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const start: IAutoMovieVector3 = seated.socket(body, context.entry.posture);
    const under: number = seated.floor(body, context.entry);
    const r: number = (start.y - under) / seated.popliteal(body);

    // A seat above the band with a foot off the floor is got off, not risen from over the feet.
    if (seated.perched(body, context.entry, start, under))
      return HumanMountOff.plan(context, start, r);
    const rising: number =
      seatedCourse.descent(r) *
      AutoMovieMotionManner.of(context, context.params.manner).tempo;
    const yaw: number = context.entry.posture.yaw;
    const legged: ReturnType<typeof stand.prepareLegs> = stand.prepareLegs(
      body,
      yaw,
    );
    const rests: IAutoMovieMotionHumanBase.ISeat["armrests"] =
      context.entry.base.kind === "seated"
        ? context.entry.base.seat?.armrests
        : undefined;
    const pitch0: number = context.entry.posture.pitch;
    const entryHeading: Pick<IAutoMovieMotionHumanPosture, "yaw" | "pitch" | "roll"> = {
      yaw,
      pitch: pitch0,
      roll: 0,
    };
    const entryRoot: ReturnType<typeof prepareSeatedRoot> = prepareSeatedRoot(
      body,
      entryHeading,
    );
    const feet: Record<"left" | "right", IAutoMovieVector3> = stand.feet(
      body,
      context.entry,
      yaw,
    );
    const relaxed: IAutoMovieMotionHumanPosture["joints"] = {
      ...stand.relaxed(body),
      ...standUpright.of(body).joints,
    };

    // Shallow sitting first: the pelvis edges forward on the seat until the
    // hip joints stand at most one thigh length behind the ankles, staying
    // 0.6 thigh lengths inside the front edge when the entered sit names its
    // seat.
    const forwardDir: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 0, y: 0, z: 1 },
    );
    const along: (p: IAutoMovieVector3) => number = (p: IAutoMovieVector3): number =>
      p.x * forwardDir.x + p.z * forwardDir.z;

    // The hip joints' middle along the heading, under the entry's pitch.
    const hipJointAt: (socket: IAutoMovieVector3) => number = (
      socket: IAutoMovieVector3,
    ): number => {
      const hips: Record<"left" | "right", IAutoMovieVector3> = hipJoints(
        body,
        entryRoot(socket),
        resolveHumanPosture.heading(entryHeading),
      );
      return (along(hips.left) + along(hips.right)) / 2;
    };
    const ankles: number = (along(feet.left) + along(feet.right)) / 2;
    let scoot: number = Math.max(
      0,
      ankles - hipJointAt(start) - body.measure.thigh,
    );
    const from: IAutoMovieMotionHumanEntryState["from"] = context.entry.from;
    const sat: IAutoMovieMotionHumanSeated.ISeat | undefined =
      from !== undefined && from.family === "sit"
        ? (from.params as { seat?: IAutoMovieMotionHumanSeated.ISeat }).seat
        : undefined;
    if (sat !== undefined)
      scoot = Math.min(
        scoot,
        Math.max(0, along(sat.at) - 0.6 * body.measure.thigh - along(start)),
      );
    const edging: number = scoot > EDGE ? 0.4 + 1.5 * scoot : 0;
    const begin: IAutoMovieVector3 = Vector3.add(
      start,
      Vector3.scale(forwardDir, scoot),
    );
    const edged: ReturnType<typeof Vector3.prepareLerp> | undefined =
      edging > 0 ? Vector3.prepareLerp(start, begin) : undefined;

    // Then the feet are drawn back, one at a time, until each ankle stands
    // behind its knee with the shank at an angle forward of vertical, and
    // across, until their middle stands under the pelvis again.
    const leftDir: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 1, y: 0, z: 0 },
    );
    const across: (p: IAutoMovieVector3) => number = (p: IAutoMovieVector3): number =>
      p.x * leftDir.x + p.z * leftDir.z;
    const aside: number =
      across(begin) - (across(feet.left) + across(feet.right)) / 2;
    const hipBegin: number = hipJointAt(begin);
    const drawAt: (angle: number) => Record<"left" | "right", IAutoMovieVector3> = (
      angle: number,
    ): Record<"left" | "right", IAutoMovieVector3> => {
      const behind: number =
        hipBegin +
        body.measure.thigh -
        body.measure.shank * Math.sin((angle * Math.PI) / 180);
      const out: Record<"left" | "right", IAutoMovieVector3> = {
        left: feet.left,
        right: feet.right,
      };
      for (const side of ["left", "right"] as const) {
        const back: number = along(feet[side]) - behind;
        if (back > NUDGE)
          out[side] = Vector3.subtract(
            out[side],
            Vector3.scale(forwardDir, back),
          );
        if (Math.abs(aside) > NUDGE)
          out[side] = Vector3.add(out[side], Vector3.scale(leftDir, aside));
      }
      return out;
    };

    // Seat-off at the first frame whose extrapolated centre of mass is over
    // the feet, raising the peak flexion until one is, then drawing the feet
    // further back.
    const flex: number = 0.5 * rising;
    const pitchAt: (t: number, peak: number) => number = (t: number, peak: number): number =>
      pitch0 + (peak - pitch0) * minimumJerk.share(t / flex);
    const level: IAutoMovieVector3 = seated.root(body, begin, {
      yaw,
      pitch: 0,
      roll: 0,
    });
    const { drawn, peak, off }: ReturnType<typeof riseSeatOff> = riseSeatOff({
      body,
      begin,
      level,
      yaw,
      relaxed,
      angles: SHANK,
      rising,
      flexed: flex,
      ratio: r,
      legged,
      drawAt,
      pitchAt,
    });

    const swings: Partial<Record<"left" | "right", [number, number]>> = {};
    let clock: number = edging;
    // The foot on the side the feet move to leads, so they never cross.
    for (const side of aside < 0
      ? (["right", "left"] as const)
      : (["left", "right"] as const)) {
      if (drawn[side] === feet[side]) continue;
      swings[side] = [clock, clock + DRAW];
      clock += DRAW;
    }
    const prepared: number = clock;
    const legsAt: ReturnType<typeof prepareRiseFeet> = prepareRiseFeet({
      feet,
      drawn,
      swings,
      draw: DRAW,
      lift: LIFT,
      legged,
    });

    // The standing posture the rise ends in: the stand law's pelvis over the drawn feet.
    const standRoot: IAutoMovieVector3 = stand.root(body, drawn, yaw);
    const goal: IAutoMovieVector3 = seated.socket(body, {
      root: standRoot,
      yaw,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    });
    const away: number = off;
    const seatOff: number = prepared + away;
    const duration: number = prepared + rising;
    const share: (t: number) => number = (t: number): number => t / duration;
    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      {
        part: "seat",
        kind: "seat",
        from: 0,
        to: share(seatOff),
        support: HumanSupportFrame.contact(context, "seat"),
      },
    ];
    for (const side of ["left", "right"] as const) {
      const swing: [number, number] | undefined = swings[side];
      const windows: [
        IAutoMovieMotionHumanContactWindow["part"],
        number,
        number,
      ][] =
        swing === undefined
          ? [[`${side}Foot`, 0, 1]]
          : [
              [`${side}Foot`, 0, share(swing[0])],
              [`${side}Foot`, share(swing[1]), 1],
            ];

      // A hand on an armrest pushes on it until the seat leaves the seat.
      if (rests?.[side] !== undefined)
        windows.push([`${side}Hand`, 0, share(seatOff)]);
      for (const [part, from, to] of windows)
        contacts.push({
          part,
          kind: "plant",
          from,
          to,
          support: HumanSupportFrame.contact(context, part),
        });
    }

    // The hands' goals at each second, on the thighs or the armrests and
    // leaving them, are fitted along the rise's course, each second
    // continuing the swivel the course chose before it.
    const rose: (seconds: number) => IAutoMovieMotionHumanPosture =
      AutoMovieMotionHumanArmChain.continued(
        body,
        duration,
        (seconds: number): IAutoMovieMotionHumanPosture => {
          const t: number = Math.min(duration, Math.max(0, seconds));
          const joints: IAutoMovieMotionHumanPosture["joints"] = { ...relaxed };
          if (t < prepared) {
            const socket: IAutoMovieVector3 =
              edged !== undefined
                ? edged(minimumJerk.share(t / edging))
                : begin;
            const root: IAutoMovieVector3 = entryRoot(socket);
            return riseRested(
              body,
              {
                root,
                yaw,
                pitch: pitch0,
                roll: 0,
                joints,
                limbs: legsAt(root, t),
              },
              rests,
              yaw,
              1,
            );
          }
          const u: number = t - prepared;
          const forward: number = minimumJerk.share(
            (u - away) / (STOOD * rising - away),
          );
          const up: number = minimumJerk.share(
            (u - away - LAG * rising) / ((STOOD - LAG) * rising - away),
          );
          const socket: IAutoMovieVector3 = {
            x: begin.x + (goal.x - begin.x) * forward,
            y: begin.y + (goal.y - begin.y) * up,
            z: begin.z + (goal.z - begin.z) * forward,
          };
          const pitch: number =
            u < flex
              ? pitchAt(u, peak)
              : peak * (1 - minimumJerk.share((u - flex) / (rising - flex)));
          const tilt: ReturnType<typeof HumanTrunk.incline> = HumanTrunk.incline(
            joints,
            pitch,
            HumanTrunk.pelvisLimit(
              body,
              seated.root(body, socket, { yaw, pitch: 0, roll: 0 }),
              yaw,
              drawn,
            ),
          );
          const root: IAutoMovieVector3 = seated.root(body, socket, {
            yaw,
            pitch: tilt.pitch,
            roll: 0,
          });
          const posture: IAutoMovieMotionHumanPosture = {
            root,
            yaw,
            pitch: tilt.pitch,
            roll: 0,
            joints: tilt.joints,
            limbs: legged(root, drawn),
          };
          return riseRested(
            body,
            posture,
            rests,
            yaw,
            1 - minimumJerk.share((u - away) / (0.3 * rising)),
          );
        },
      );

    return {
      duration,
      events: [
        { name: "seatOff", share: share(seatOff) },
        { name: "standing", share: share(prepared + STOOD * rising) },
      ],
      contacts,
      base: { kind: "standing" },
      posture: (seconds: number): IAutoMovieMotionHumanPosture => rose(seconds),
    };
  }
}
