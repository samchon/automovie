import { AutoMovieEngineVector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanLungeGrab,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTouch,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { step } from "../../striking/internal/step";
import { touch } from "./touch";

/*
 * A lunge that closes both hands on a victim
 * (`IAutoMovieMotionHumanLungeGrab`), as a shambler breaks from its walk. The
 * grab is the stage-fight grab, both palms squeezing the victim's regions
 * (`touch`), planned from where the lunge leaves the body: the leading foot
 * steps long toward the victim over one step period (`step.period`) while the
 * rear foot stays planted, and the root travels the length the arms lack on one
 * minimum-jerk profile, ending between the feet, so the hands reach as the body
 * arrives. The lunge's length is what the arms lack to reach the regions from
 * where the body stands; a victim further than the longest lunge is refused
 * with the distance named.
 */
export namespace lungeGrab {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionKey = "lungeGrab";

  /*
   * Cancel table: the grab's own.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    touch.interrupts;

  /*
   * The longest lunge, the hips' travel in hip heights: authored, with the
   * leading foot stepping `STRIDE` times as far.
   */
  export const LONGEST: number = 0.45;

  /*
   * How far the leading foot steps for the hips' travel: the hips end between
   * the planted rear foot and the landed front foot (authored).
   */
  export const STRIDE: number = 1.5;

  /*
   * How long the weight takes to shift onto the rear foot before the leading
   * foot lifts, seconds: authored, a gait initiation's anticipatory shift.
   */
  export const SHIFT: number = 0.15;

  /*
   * How high the leading foot lifts as it steps, metres: authored.
   */
  export const LIFT: number = 0.05;

  /*
   * Plan a lunge and grab.
   * Parameter context: The action's context.
   * Returns: The plan.
   * On `partner` when the victim lies beyond the longest
   * lunge, and whatever the grab refuses.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanLungeGrab.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const params: IAutoMovieMotionHumanLungeGrab.IParams = context.params;
    const side: AutoMovieHumanSide = params.side ?? "right";
    const rear: AutoMovieHumanSide = side === "left" ? "right" : "left";
    const region: AutoMovieHumanoidRegion =
      params.region ?? (side === "right" ? "shoulderLeft" : "shoulderRight");
    const other: AutoMovieHumanoidRegion | undefined =
      params.region === undefined
        ? side === "right"
          ? "shoulderRight"
          : "shoulderLeft"
        : undefined;

    // How far the arms fall short of the region from where the body stands.
    const entry: IAutoMovieMotionHumanEntryState = context.entry;
    const target: IAutoMovieVector3 = context.aim(
      { kind: "person", subject: params.partner, region },
      context.start,
    ).point;
    const shoulderBone: AutoMovieHumanoidBone = `${side}UpperArm`;
    const shoulder: IAutoMovieVector3 = poseBones(
      context.body,
      entry.pose,
      undefined,
      new Set<AutoMovieHumanoidBone>([shoulderBone]),
    ).get(shoulderBone)!.worldPosition;
    const flat: IAutoMovieVector3 = {
      x: target.x - shoulder.x,
      y: 0,
      z: target.z - shoulder.z,
    };
    const apart: number = AutoMovieEngineVector3.length(flat);
    const arm: number =
      touch.REACH *
      (context.body.measure.upperArm + context.body.measure.forearm);
    const length: number = Math.max(0, apart - arm);
    const longest: number = LONGEST * context.body.measure.hipHeight;
    if (length > longest)
      throw new AutoMovieMotionHumanRefusal({
        kind: "parameter",
        axis: "partner",
        value: params.partner,
        feasible: { kind: "range", unit: "m", minimum: 0, maximum: longest },
        reason: `the victim's ${region} lies ${length.toFixed(2)} m beyond the arms; the longest lunge covers ${longest.toFixed(2)} m`,
        fix: "start the lunge closer to the victim",
      });
    const along: IAutoMovieVector3 =
      apart > 1e-9 ? AutoMovieEngineVector3.scale(flat, 1 / apart) : { x: 0, y: 0, z: 1 };
    const travel: IAutoMovieVector3 = AutoMovieEngineVector3.scale(along, length);

    // The grab, planned from where the lunge leaves the body.
    const arrived: IAutoMovieMotionHumanPosture = {
      ...entry.posture,
      root: AutoMovieEngineVector3.add(entry.posture.root, travel),
    };
    const lunged: IAutoMovieMotionHumanEntryState = {
      ...entry,
      posture: arrived,
      pose: resolveHumanPosture(context.body, arrived, entry.pose),
      feet: {
        ...entry.feet,
        [side]: {
          ...entry.feet[side],
          ankle: AutoMovieEngineVector3.add(
            entry.feet[side].ankle,
            AutoMovieEngineVector3.scale(travel, STRIDE),
          ),
        },
      },
    };
    const grab: IAutoMovieMotionHumanTouch.IParams = {
      target: { kind: "person", subject: params.partner, region },
      ...(other === undefined
        ? {}
        : {
            other: { kind: "person", subject: params.partner, region: other },
          }),
      hand: side,
      effector: "palm",
      kind: "squeeze",
      count: 1,
    };
    const grabbed: IAutoMovieMotionHumanActionPlan = touch.plan({
      ...context,
      params: grab,
      entry: lunged,
    });

    // The lunge: the leading foot steps the length, the rear foot stays.
    const duration: number = grabbed.duration;
    const lunge: number = Math.min(step.period(context.body), duration - SHIFT);
    const from: IAutoMovieVector3 = entry.feet[side].ankle;
    const to: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      from,
      AutoMovieEngineVector3.scale(travel, STRIDE),
    );
    const stay: IAutoMovieVector3 = entry.feet[rear].ankle;
    // How far the hips sink for the lunge's stance: the leg, hip to ankle,
    // spans half the feet's spread at the depth it leaves.
    const hip: number = context.body.measure.hipHeight;
    const half: number =
      AutoMovieEngineVector3.distance(
        { x: to.x, y: 0, z: to.z },
        { x: stay.x, y: 0, z: stay.z },
      ) / 2;
    const sink: number = hip - Math.sqrt(Math.max(0, hip * hip - half * half));
    const knee: (ankle: IAutoMovieVector3) => IAutoMovieVector3 = (
      ankle: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      AutoMovieEngineVector3.add(ankle, {
        x: along.x * 0.3,
        y: 0.45 * context.body.measure.hipHeight,
        z: along.z * 0.3,
      });
    const feet: IAutoMovieMotionHumanContactWindow["part"][] = [
      "leftFoot",
      "rightFoot",
    ];
    // The grab's own stance base stood on the lunged feet from its start;
    // the lunge's feet are its contacts below, so the base is left out.
    const { base: _base, ...grabbing }: IAutoMovieMotionHumanActionPlan =
      grabbed;
    return {
      ...grabbing,
      events: [
        ...grabbed.events,
        { name: "lunged", share: (SHIFT + lunge) / duration },
      ],
      contacts: [
        ...grabbed.contacts.filter(
          (c: IAutoMovieMotionHumanContactWindow): boolean =>
            !feet.includes(c.part),
        ),
        {
          part: `${rear}Foot`,
          kind: "plant",
          from: 0,
          to: 1,
          support: { kind: "ground" },
        },
        {
          part: `${side}Foot`,
          kind: "plant",
          from: (SHIFT + lunge) / duration,
          to: 1,
          support: { kind: "ground" },
        },
      ],
      posture: (
        seconds: number,
        channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const shown: IAutoMovieMotionHumanPosture = grabbed.posture(
          t,
          channels,
          resolution,
          projection,
        );
        // The weight shifts onto the rear foot before the leading foot lifts.
        const s: number = AutoMovieEngineMotionSampling.minimumJerkShare(
          Math.min(1, Math.max(0, (t - SHIFT) / lunge)),
        );
        const lead: IAutoMovieVector3 = AutoMovieEngineVector3.add(AutoMovieEngineVector3.lerp(from, to, s), {
          x: 0,
          y: Math.sin(Math.PI * s) * LIFT,
          z: 0,
        });
        return {
          ...shown,
          // The hips sink as the feet part, so both legs reach the floor.
          root: AutoMovieEngineVector3.subtract(
            AutoMovieEngineVector3.subtract(shown.root, AutoMovieEngineVector3.scale(travel, 1 - s)),
            { x: 0, y: sink * s, z: 0 },
          ),
          limbs: {
            ...shown.limbs,
            [`${side}Leg`]: {
              point: lead,
              rotation: entry.feet[side].rotation,
              bend: knee(lead),
              planted: s >= 1,
            },
            [`${rear}Leg`]: {
              point: stay,
              rotation: entry.feet[rear].rotation,
              bend: knee(stay),
              planted: true,
            },
          },
        };
      },
    };
  }
}
