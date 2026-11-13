import {
  Vector3,
  clampPose,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../../body/IHumanBody";
import type { IHumanContactWindow } from "../../law/IHumanContactWindow";
import type { HumanPerformance } from "../../perform/HumanPerformance";
import type { HumanSegment } from "../../perform/HumanSegment";
import type { IHumanPosture } from "../../posture/IHumanPosture";
import type { StrikingRecord } from "../../striking/StrikingRecord";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { StrikingLimb } from "./StrikingLimb";

/**
 * The verdicts of a displayed strike, each measured on the shown bones
 * against the action's own goal, each able to fail and each printing its
 * bound.
 *
 * - Contact: a strike meant to hit stops with its limb within 15 mm of the
 *   other body's surface, on a part of a declared class when the scenario
 *   declares one; a feint or a declared miss never stops and stays clear of
 *   the other body up to its shown peak; a graze passes within -10 to +15 mm
 *   of it; a strike cut before its contact never stops; a strike the reach
 *   solve declared short stands only when its target lay beyond the bare
 *   limb's length from its root at the launch.
 * - Extension, for a strike at no body: at its peak the limb's surface lies
 *   within 15 mm of the planned point, or, when that point lay beyond the
 *   bare limb's length L from the root, no farther from it than that
 *   shortfall plus a tenth of L.
 * - Penetration: the limb never sinks more than 10 mm into the other body,
 *   sampled at 96 Hz.
 * - Support slip: the ball of every planted or pivoting foot stays within
 *   5 mm over its window, sampled at 48 Hz.
 * - Range of motion: no displayed joint leaves its limits.
 * - Leg goal, for a kick: the displayed ankle meets the plan's ankle goal
 *   within 2 mm from the launch to the stop or the peak.
 * - Defence: the defend plan's read, set and contact events class as the
 *   declared outcome.
 * - Refusal: a redirect after the chamber key is refused as an illegal cut.
 */
export namespace StrikingVerdicts {
  /** What part of a body a strike met. */
  export type Class = "guard" | "head" | "trunk" | "leg";

  /** One displayed strike under audit. */
  export interface IStrike {
    /** The performance it was shown in. */
    performance: HumanPerformance;

    /** The striker's subject id. */
    id: string;

    /** The striker's body. */
    body: IHumanBody;

    /** The other person, when there is one. */
    other: { id: string; body: IHumanBody } | undefined;

    /** The strike's segment. */
    segment: HumanSegment.ISegment;

    /** The end joint that carries it. */
    limb: StrikingLimb.End;

    /** What the strike decided; undefined when its plan records nothing. */
    record: StrikingRecord.IRecord | undefined;

    /** The film second the limb stopped on a surface, if it did. */
    stop: number | undefined;

    /** The part classes the scenario declares the strike meets; any when undefined. */
    meets: readonly Class[] | undefined;
  }

  /** The 15 mm within which a stopped limb touches a surface or an extended one its aim. */
  const TOUCH: number = 0.015;

  /** The 10 mm a limb may sink into the other body. */
  const SINK: number = 0.01;

  /** The 5 mm a planted or pivoting ball may drift. */
  const SLIP: number = 0.005;

  /** The 2 mm within which a displayed ankle meets its goal. */
  const GOAL: number = 0.002;

  /**
   * The film second of a segment's named event.
   *
   * @param segment The segment.
   * @param event The event's name.
   * @returns The second, or undefined when the plan has no such event.
   */
  export function at(
    segment: HumanSegment.ISegment,
    event: string,
  ): number | undefined {
    const share: number | undefined = segment.plan.events.find(
      (e: HumanSegment.ISegment["plan"]["events"][number]): boolean =>
        e.name === event,
    )?.share;
    return share === undefined
      ? undefined
      : segment.start + share * segment.plan.duration;
  }

  /**
   * The film second a strike shows its peak: its planned contact, else its
   * `shown` or `chamber` event, else its end, and never after its end.
   *
   * @param segment The strike's segment.
   * @returns The second.
   */
  export function peak(segment: HumanSegment.ISegment): number {
    return Math.min(
      segment.end,
      segment.plan.contact !== undefined
        ? segment.start + segment.plan.contact
        : (at(segment, "shown") ?? at(segment, "chamber") ?? segment.end),
    );
  }

  /**
   * The class of a body part by its bone: the head and the neck are the head,
   * the pelvis and the spine the trunk, the thigh, the shank and the foot the
   * leg, and the shoulder girdle, the arm, the hand and its digits the guard.
   *
   * @param bone The bone.
   * @returns Its class.
   */
  export function classify(bone: AutoMovieHumanoidBone): Class {
    if (/^(head|neck|jaw)$|Eye$/.test(bone)) return "head";
    if (/^(hips|spine|chest|upperChest)$/.test(bone)) return "trunk";
    if (/(UpperLeg|LowerLeg|Foot|Toes)$/.test(bone)) return "leg";
    return "guard";
  }

  /**
   * Every verdict of one strike.
   *
   * @param strike The strike.
   * @returns The contact (or extension), penetration, support slip, range of motion and, for a kick, leg goal verdicts.
   */
  export function of(strike: IStrike): IMotionCaptureCase.IVerdict[] {
    return [
      contact(strike),
      penetration(strike),
      slip(strike),
      rangeOfMotion(strike),
      ...(strike.segment.name === "kick" ? [goal(strike)] : []),
    ];
  }

  /**
   * What a strike met against what it declared.
   *
   * @param strike The strike.
   * @returns The contact verdict, or the extension verdict when there is no other body.
   */
  export function contact(strike: IStrike): IMotionCaptureCase.IVerdict {
    const g: HumanSegment.ISegment = strike.segment;
    const name: string = `${strike.id} ${g.id} contact`;
    const params: { feint?: number | boolean; accuracy?: unknown } = g.params;
    if (g.plan.contact !== undefined && g.end < g.start + g.plan.contact - 1e-9)
      return {
        name,
        passed: strike.stop === undefined,
        detail:
          strike.stop === undefined
            ? "cut before its contact and met nothing"
            : `cut before its contact but stopped at ${strike.stop.toFixed(3)} s`,
      };
    if (strike.other === undefined) return extension(strike);
    const declared: "feint" | "miss" | "graze" | undefined =
      params.feint !== undefined && params.feint !== false
        ? "feint"
        : params.accuracy === "miss" || params.accuracy === "graze"
          ? params.accuracy
          : undefined;
    if (declared !== undefined) {
      let closest: StrikingLimb.IGap & { at: number } = {
        ...gap(strike, g.entryTime),
        at: g.entryTime,
      };
      const until: number = peak(g);
      for (let t: number = g.entryTime; t <= until + 1e-9; t += 1 / 96) {
        const now: StrikingLimb.IGap = gap(strike, t);
        if (now.distance < closest.distance) closest = { ...now, at: t };
      }
      const measured: string = `closest ${(1000 * closest.distance).toFixed(1)} mm from ${closest.bone ?? "nothing"} (${closest.part}) at ${closest.at.toFixed(3)} s${strike.stop === undefined ? "" : `, stopped at ${strike.stop.toFixed(3)} s`}`;
      return declared === "graze"
        ? {
            name,
            passed: closest.distance >= -SINK && closest.distance <= TOUCH,
            detail: `a graze, ${measured}; bound -10 to +15 mm`,
          }
        : {
            name,
            passed: strike.stop === undefined && closest.distance > 0,
            detail: `a ${declared}, ${measured}; bound no stop and above 0 mm`,
          };
    }
    const record: StrikingRecord.IRecord | undefined = strike.record;
    if (strike.stop === undefined && record?.status === "short") {
      const length: number = StrikingLimb.length(
        strike.body,
        strike.limb,
        g.name === "knee",
      );
      const root: IAutoMovieVector3 = strike.performance
        .bones(strike.id, g.entryTime)
        .get(StrikingLimb.root(strike.limb))!.worldPosition;
      const beyond: number =
        Vector3.length(Vector3.subtract(record.planned, root)) - length;
      return {
        name,
        passed: beyond > 0,
        detail: `declared beyond reach by ${(1000 * Vector3.length(Vector3.subtract(record.planned, record.reached))).toFixed(0)} mm; the target lies ${(1000 * Math.abs(beyond)).toFixed(0)} mm ${beyond > 0 ? "beyond" : "within"} the bare limb's ${(1000 * length).toFixed(0)} mm from its root; bound beyond`,
      };
    }
    if (strike.stop === undefined)
      return {
        name,
        passed: false,
        detail: `declared to hit but met nothing${
          record === undefined
            ? ""
            : ` (solve ${record.status}; the limb at its peak lies ${(1000 * gap(strike, peak(g)).distance).toFixed(1)} mm from the other body)`
        }`,
      };
    const touch: StrikingLimb.IGap = gap(strike, strike.stop);
    const met: Class | undefined =
      touch.bone === undefined ? undefined : classify(touch.bone);
    const allowed: boolean =
      strike.meets === undefined ||
      (met !== undefined && strike.meets.includes(met));
    return {
      name,
      passed: Math.abs(touch.distance) <= TOUCH && allowed,
      detail: `met ${touch.bone ?? "nothing"} (${met ?? "none"}) with its ${touch.part} at ${strike.stop.toFixed(3)} s, gap ${(1000 * touch.distance).toFixed(1)} mm; bound 15 mm on ${strike.meets === undefined ? "any part" : strike.meets.join(" or ")}`,
    };
  }

  /**
   * How near a strike at no body comes to its planned point at its peak.
   *
   * @param strike The strike.
   * @returns The extension verdict.
   */
  export function extension(strike: IStrike): IMotionCaptureCase.IVerdict {
    const g: HumanSegment.ISegment = strike.segment;
    const name: string = `${strike.id} ${g.id} extension`;
    const record: StrikingRecord.IRecord | undefined = strike.record;
    if (record === undefined)
      return { name, passed: false, detail: "the plan records no aim" };
    const second: number = peak(g);
    const reach: number = Math.min(
      ...StrikingLimb.capsules(
        strike.body,
        strike.performance.bones(strike.id, second),
        strike.limb,
      ).map((c: StrikingLimb.ICapsule): number =>
        StrikingLimb.surface(record.planned, c),
      ),
    );
    const length: number = StrikingLimb.length(
      strike.body,
      strike.limb,
      g.name === "knee",
    );
    const root: IAutoMovieVector3 = strike.performance
      .bones(strike.id, g.entryTime)
      .get(StrikingLimb.root(strike.limb))!.worldPosition;
    const beyond: number =
      Vector3.length(Vector3.subtract(record.planned, root)) - length;
    const bound: number = beyond <= 0 ? TOUCH : beyond + 0.1 * length;
    return {
      name,
      passed: reach >= -TOUCH && reach <= bound,
      detail: `${(1000 * reach).toFixed(1)} mm from its planned point at ${second.toFixed(3)} s, which lies ${(1000 * Math.abs(beyond)).toFixed(0)} mm ${beyond > 0 ? "beyond" : "within"} the bare limb's ${(1000 * length).toFixed(0)} mm from its root; bound -15 to +${(1000 * bound).toFixed(0)} mm`,
    };
  }

  /**
   * How deep the limb sinks into the other body over the strike, the deepest
   * instant named with what it sank into, so a sink after the stop reads
   * apart from one before it.
   *
   * @param strike The strike.
   * @returns The penetration verdict.
   */
  export function penetration(strike: IStrike): IMotionCaptureCase.IVerdict {
    const g: HumanSegment.ISegment = strike.segment;
    let deepest: StrikingLimb.IGap & { at: number } = {
      distance: Infinity,
      bone: undefined,
      part: "nothing",
      at: g.entryTime,
    };
    for (let t: number = g.entryTime; t <= g.end + 1e-9; t += 1 / 96) {
      const now: StrikingLimb.IGap = gap(strike, t);
      if (now.distance < deepest.distance) deepest = { ...now, at: t };
    }
    return {
      name: `${strike.id} ${g.id} penetration`,
      passed: deepest.distance >= -SINK,
      detail: `deepest ${(1000 * Math.min(0, deepest.distance)).toFixed(1)} mm${deepest.distance < 0 ? ` into ${deepest.bone ?? "nothing"} (${deepest.part}) at ${deepest.at.toFixed(3)} s` : ""}; bound -10 mm`,
    };
  }

  /**
   * The largest drift of a foot's ball within the strike's plant and pivot
   * windows (a pivot turns about the ball, so the ball must stay), with that
   * window's start and the second its drift first passed 1 mm.
   *
   * @param strike The strike.
   * @returns The support slip verdict.
   */
  export function slip(strike: IStrike): IMotionCaptureCase.IVerdict {
    const g: HumanSegment.ISegment = strike.segment;
    let worst: number = 0;
    let where: string = "no plant or pivot window";
    const windows: IHumanContactWindow[] = g.plan.contacts;
    for (const c of windows) {
      if (
        (c.part !== "leftFoot" && c.part !== "rightFoot") ||
        (c.kind !== "plant" && c.kind !== "pivot")
      )
        continue;
      const from: number = Math.max(
        g.entryTime,
        g.start + c.from * g.plan.duration,
      );
      const to: number = Math.min(g.end, g.start + c.to * g.plan.duration);
      if (!(to > from)) continue;
      const frame: IHumanBody["surfaces"]["sockets"]["ballLeft"] =
        strike.body.surfaces.sockets[
          c.part === "leftFoot" ? "ballLeft" : "ballRight"
        ];
      const ball = (t: number): IAutoMovieVector3 =>
        resolveAutoMovieHumanoidSurfaces.place(
          frame,
          strike.performance.bones(strike.id, t).get(frame.bone)!,
        ).point;
      const origin: IAutoMovieVector3 = ball(from);
      let onset: number | undefined;
      for (let t: number = from; t <= to + 1e-9; t += 1 / 48) {
        const d: number = Vector3.length(Vector3.subtract(ball(t), origin));
        if (onset === undefined && d > 0.001) onset = t;
        if (d > worst) {
          worst = d;
          where = `${c.part} ${c.kind} window from ${from.toFixed(3)} s, past 1 mm at ${onset === undefined ? "none" : `${onset.toFixed(3)} s`}, worst at ${t.toFixed(3)} s`;
        }
      }
    }
    return {
      name: `${strike.id} ${g.id} support slip`,
      passed: worst <= SLIP,
      detail: `${(1000 * worst).toFixed(2)} mm (${where}); bound 5 mm`,
    };
  }

  /**
   * How far any displayed joint leaves its range of motion over the strike.
   *
   * @param strike The strike.
   * @returns The range of motion verdict.
   */
  export function rangeOfMotion(strike: IStrike): IMotionCaptureCase.IVerdict {
    const g: HumanSegment.ISegment = strike.segment;
    let over: number = 0;
    let where: string = "";
    for (let t: number = g.entryTime; t <= g.end + 1e-9; t += 1 / 48) {
      const pose: IAutoMoviePose = strike.performance.pose(strike.id, t);
      const clamped: IAutoMoviePose = clampPose(pose, strike.body.skeleton);
      for (const j of pose.joints) {
        const c: IAutoMoviePose["joints"][number] = clamped.joints.find(
          (x: IAutoMoviePose["joints"][number]): boolean => x.bone === j.bone,
        )!;
        const d: number = Math.max(
          Math.abs((c.flexion ?? 0) - (j.flexion ?? 0)),
          Math.abs((c.abduction ?? 0) - (j.abduction ?? 0)),
          Math.abs((c.twist ?? 0) - (j.twist ?? 0)),
        );
        if (d > over) {
          over = d;
          where = ` (${j.bone} at ${t.toFixed(3)} s)`;
        }
      }
    }
    return {
      name: `${strike.id} ${g.id} range of motion`,
      passed: over <= 1e-6,
      detail: `largest overshoot ${over.toFixed(6)} deg${where}; bound 0.000001 deg`,
    };
  }

  /**
   * How far a kick's displayed ankle lies from the ankle goal its plan asks
   * for, from the launch to the stop or the peak, so a leg the fit could not
   * bring onto its goal shows.
   *
   * @param strike The kick.
   * @returns The leg goal verdict.
   */
  export function goal(strike: IStrike): IMotionCaptureCase.IVerdict {
    const g: HumanSegment.ISegment = strike.segment;
    const side: "left" | "right" = StrikingLimb.side(strike.limb);
    const from: number = Math.max(g.entryTime, at(g, "launch") ?? g.entryTime);
    const to: number = Math.min(g.end, strike.stop ?? peak(g));
    let worst: number = 0;
    let when: number = from;
    let samples: number = 0;
    for (let t: number = from; t <= to + 1e-9; t += 1 / 48) {
      const asked: IHumanPosture.IGoal | undefined = g.plan.posture(t - g.start)
        .limbs[`${side}Leg`];
      if (asked === undefined) continue;
      samples++;
      const d: number = Vector3.length(
        Vector3.subtract(
          strike.performance.bones(strike.id, t).get(`${side}Foot`)!
            .worldPosition,
          asked.point,
        ),
      );
      if (d > worst) {
        worst = d;
        when = t;
      }
    }
    return {
      name: `${strike.id} ${g.id} leg goal`,
      passed: samples > 0 && worst <= GOAL,
      detail:
        samples === 0
          ? "the plan asks no ankle goal between the launch and the peak"
          : `the ankle lies at most ${(1000 * worst).toFixed(2)} mm from its goal (at ${when.toFixed(3)} s, ${samples} samples from ${from.toFixed(3)} to ${to.toFixed(3)} s); bound 2 mm`,
    };
  }

  /**
   * Whether a defence's own events class as its declared outcome: in time
   * when the guard is set by the contact, late when it is set within half its
   * movement after it, and failed otherwise.
   *
   * @param id The defender's subject id.
   * @param segment The defence's segment.
   * @returns The defence verdict; a plan missing its read, set or contact event fails.
   */
  export function defence(
    id: string,
    segment: HumanSegment.ISegment,
  ): IMotionCaptureCase.IVerdict {
    const name: string = `${id} ${segment.id} defence`;
    const read: number | undefined = at(segment, "read");
    const set: number | undefined = at(segment, "set");
    const met: number | undefined = at(segment, "contact");
    if (read === undefined || set === undefined || met === undefined)
      return {
        name,
        passed: false,
        detail: `the plan lacks its ${[
          ...(read === undefined ? ["read"] : []),
          ...(set === undefined ? ["set"] : []),
          ...(met === undefined ? ["contact"] : []),
        ].join(", ")} event`,
      };
    const margin: number = met - set;
    const movement: number = set - read;
    const shown: string =
      margin >= 0 ? "inTime" : margin > -0.5 * movement ? "late" : "fail";
    const params: { outcome?: string } = segment.params;
    return {
      name,
      passed: params.outcome === undefined || params.outcome === shown,
      detail: `read at ${read.toFixed(3)} s, set at ${set.toFixed(3)} s, contact at ${met.toFixed(3)} s: ${shown} (margin ${(1000 * margin).toFixed(0)} ms over a ${(1000 * movement).toFixed(0)} ms movement); declared ${params.outcome ?? "none"}`,
    };
  }

  /**
   * Whether a redirect after the chamber key is refused as an illegal cut
   * into a kick; any other error, or none, fails.
   *
   * @param attempt Builds the late redirect.
   * @returns The refusal verdict.
   */
  export function refusal(attempt: () => unknown): IMotionCaptureCase.IVerdict {
    let message: string | undefined;
    try {
      attempt();
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    return {
      name: "redirect after the chamber key refused",
      passed:
        message !== undefined && message.includes("cannot be cut into kick"),
      detail: `${message ?? "accepted"}; bound the "cannot be cut into kick" refusal`,
    };
  }

  /** The limb's gap to the other body at a film second; infinite when there is no other body. */
  function gap(strike: IStrike, seconds: number): StrikingLimb.IGap {
    if (strike.other === undefined)
      return { distance: Infinity, bone: undefined, part: "nothing" };
    return StrikingLimb.gap(
      strike.body,
      strike.performance.bones(strike.id, seconds),
      strike.limb,
      strike.other.body,
      strike.performance.bones(strike.other.id, seconds),
    );
  }
}
