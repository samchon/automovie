import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { tags } from "typia";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import type { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import type { HumanUnit } from "../law/HumanUnit";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";

/**
 * Taking a clinch grip on a partner standing within reach and holding it:
 * the two-handed neck tie of Muay Thai (`plum`), or judo's collar and sleeve
 * grip (`collarSleeve`, kumikata).
 *
 * The goals are the partner's regions, read on the partner's displayed body
 * at every second, so the grip follows the partner. In the plum both palms
 * lie on the back of the partner's neck (the `nape`), one each side of it
 * (`SPREAD` of the half shoulder width, provisional); in the collar and
 * sleeve grip the right hand closes on the partner's left collar (`neckLeft`)
 * and the left hand on the partner's right sleeve at the elbow (`elbowRight`),
 * mirrored for a left-handed grip. Each hand reaches its region in the aimed
 * movement time to a 5 cm grip (McIntosh et al. 2018), holds `hold` seconds
 * and lets go. The feet stay planted. Events: the phrase's `ready` (`grip`,
 * both hands closed), `strokeStart`, `stroke`, `strokeEnd`, `relax`
 * (`release`).
 *
 * With `under` the clinch is a throw's entry (tsukuri): the body lowers
 * through the reach until its fulcrum region stands at the height of the
 * partner's region that lies on it, the contact the throw turns over
 * (#3439); the throw itself is the partner's `perturb` under the pull.
 *
 * Not yet: pummelling, underhooks and overhooks, and the turn-in's own
 * footwork (Koshida et al. 2016).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two grips with their regions, the timing, the events and what is missing.
 * @evidence contracts/development/design.md#principled-representation A law record of two arm visits on the partner's regions over a standing base.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the grip table and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The grip places are the partner's own regions.
 */
export namespace clinch {
  /** The action's name. */
  export const name: HumanActionName = "clinch";

  /** Cancel table: a clinch goes into a knee or lets go at any time. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    knee: [
      { window: ["ready", 1], kind: "inertialize", entry: 0, blend: 0.15 },
    ],
    stand: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
  };

  /** A clinch grip. */
  export type Grip = "plum" | "collarSleeve";

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its default.
   * @evidence contracts/development/design.md#principled-representation The partner, a closed grip, a hand and a hold.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No hand place is typed.
   */
  export interface IParams {
    /** The partner gripped. */
    partner: string;

    /** The grip; `plum` when absent. */
    grip?: Grip;

    /** The collar hand of `collarSleeve`; `right` when absent. */
    hand?: HumanHand.Side;

    /** Seconds the grip is held; 2 when absent. */
    hold?: number & tags.Minimum<0> & HumanUnit<"s">;

    /**
     * A throw's entry (tsukuri, #3439): through the reach the body lowers,
     * its knees bending over the planted feet, until its own `fulcrum`
     * region stands at the height of the partner's `on` region, the contact
     * the throw turns the partner over; none when absent.
     */
    under?: {
      /** This body's region the partner turns over. */
      fulcrum: AutoMovieHumanoidRegion;

      /** The partner's region that lies on it. */
      on: AutoMovieHumanoidRegion;
    };

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /** How far each plum hand lies from the nape's middle, a share of the partner's half shoulder width (provisional). */
  export const SPREAD: number = 0.35;

  /**
   * The partner's region each hand grips and the sideways offset across it,
   * a share of the partner's half shoulder width toward the partner's left.
   *
   * @param grip The grip.
   * @param collar The collar hand.
   * @returns The region and offset by hand.
   */
  export function regions(
    grip: Grip,
    collar: HumanHand.Side,
  ): Record<
    HumanHand.Side,
    { region: AutoMovieHumanoidRegion; across: number }
  > {
    if (grip === "plum")
      return {
        left: { region: "nape", across: -SPREAD },
        right: { region: "nape", across: SPREAD },
      };
    const sleeve: HumanHand.Side = collar === "right" ? "left" : "right";
    return {
      [collar]: {
        region: collar === "right" ? "neckLeft" : "neckRight",
        across: 0,
      },
      [sleeve]: {
        region: collar === "right" ? "elbowRight" : "elbowLeft",
        across: 0,
      },
    } as Record<
      HumanHand.Side,
      { region: AutoMovieHumanoidRegion; across: number }
    >;
  }

  /**
   * A partner's region on displayed bones, moved across by a share of the
   * half shoulder width toward the partner's left.
   *
   * @param body The partner's body.
   * @param bones The partner's displayed bones.
   * @param region The region.
   * @param across The share across.
   * @returns The point and outward normal, world.
   */
  export function place(
    body: IHumanBody,
    bones: ReturnType<IHumanActionContext.IPerformer["bones"]>,
    region: AutoMovieHumanoidRegion,
    across: number,
  ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } {
    const frame: resolveAutoMovieHumanoidSurfaces.IFrame = body.surfaces.regions[region];
    const placed: ReturnType<typeof resolveAutoMovieHumanoidSurfaces.place> = resolveAutoMovieHumanoidSurfaces.place(
      frame,
      bones.get(frame.bone)!,
    );
    if (across === 0) return { point: placed.point, normal: placed.normal };
    const left: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(
        bones.get("leftUpperArm")!.worldPosition,
        bones.get("rightUpperArm")!.worldPosition,
      ),
    );
    return {
      point: Vector3.add(
        placed.point,
        Vector3.scale(left, across * body.measure.shoulderHalfWidth),
      ),
      normal: placed.normal,
    };
  }

  /**
   * Plan a clinch.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hold is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the partner, gripping regions, hold timing, optional throw-entry lowering and negative-hold refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Both arm visits follow the partner's actual regions over the standing base; an optional under entry lowers the fulcrum by the initial region-height difference.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Builds the clock/base and arm visits, wraps each displayed evaluation with a local partner reader, then adds optional root lowering.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every contact target and arm write still executes with the original timing and posture order; only equal partner/time reads within one synchronous posture call share their actual bones.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each posture retains the base/arm work but reads the partner at most once for its two matching target callbacks; zero sideways offsets skip unused shoulder-direction work. No measured speedup is claimed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The explicit posture invocation fixes this plan, partner, seconds and unchanged composition/stop state. Target callbacks share only that invocation's lazily read partner map, while another time or nested invocation gets its own scope.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A fresh scope holds at most one partner map during each synchronous posture call and restores an enclosing scope in finally on success or failure; returned postures retain only goal vectors and no scope/map.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const hold: number = context.params.hold ?? 2;
    HumanBound.least("hold", hold, 0, "s");
    const grip: Grip = context.params.grip ?? "plum";
    const table = regions(grip, context.params.hand ?? "right");
    const partner: IHumanActionContext.IPerformer = context.performer(
      context.params.partner,
    );
    const requested: Set<AutoMovieHumanoidBone> = new Set([
      partner.body.surfaces.regions[table.left.region].bone,
      partner.body.surfaces.regions[table.right.region].bone,
    ]);
    if (table.left.across !== 0 || table.right.across !== 0) {
      requested.add("leftUpperArm");
      requested.add("rightUpperArm");
    }
    /** Exact partner frames owned only by the current explicit posture call. */
    let scope: { seconds: number; bones?: ReturnType<IHumanActionContext.IPerformer["bones"]> } | undefined;
    /** Both hands may read one partner snapshot before this invocation returns. */
    const partnerAt: (seconds: number) => ReturnType<IHumanActionContext.IPerformer["bones"]> = (seconds: number): ReturnType<IHumanActionContext.IPerformer["bones"]> =>
      scope === undefined || scope.seconds !== seconds
        ? partner.bones(context.start + seconds, requested)
        : (scope.bones ??= partner.bones(context.start + seconds, requested));
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);
    const reach: number = AutoMovieMotionHumanTiming.aimed(
      0.85 * (body.measure.upperArm + body.measure.forearm),
      0.05,
    );
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: reach,
        attack: AutoMovieMotionHumanTiming.PAUSES.brief,
        hold,
        retract: reach,
      }),
      modifiers,
      { holds: ["strokeEnd"] },
    );
    const duration: number = clock.duration;
    // The body stands under the clinch, its sway signed in the gripping
    // hand's frame, so a left clinch mirrors a right one (`stand.plan`).
    const base: IHumanActionPlan = stand.plan(
      { ...context, params: { seconds: duration } },
      context.params.hand ?? "right",
    );
    const bones: ReturnType<typeof poseBones> = poseBones(body, context.entry.pose, undefined, new Set<AutoMovieHumanoidBone>(["leftHand", "rightHand"]));
    const arm = (side: HumanHand.Side) =>
      AutoMovieMotionHumanArm.visit({
        body,
        clock,
        side,
        origin: AutoMovieMotionHumanArm.origin(
          body,
          bones,
          {
            origin: context.entry.posture.root,
            yaw: context.entry.posture.yaw,
          },
          side,
          grip === "plum" ? "palm" : "grip",
        ),
        contact: {
          kind: "grip",
          support: {
            kind: "person",
            subject: context.params.partner,
            region: table[side].region,
          },
        },
        target: (posture: IHumanPosture, seconds: number) => {
          const at = place(
            partner.body,
            partnerAt(seconds),
            table[side].region,
            table[side].across,
          );
          return AutoMovieMotionHumanTarget.hand(body, posture, side, at, {
            surface: grip === "plum" ? "palm" : "grip",
            shape: "relaxed",
            ...(grip === "plum" ? {} : { curl: 40 }),
          });
        },
      });
    const composed: IHumanActionPlan = composeAutoMovieMotionHumanAction({
      base,
      clock,
      contact: "stroke",
      primitives: [arm("left"), arm("right")],
    });
    const sampled: IHumanActionPlan = {
      ...composed,
      posture: (seconds: number, channels?: readonly AutoMovieMotionHumanChannel[]): IHumanPosture => {
        const previous: typeof scope = scope;
        scope = { seconds };
        try {
          return composed.posture(seconds, channels);
        } finally {
          scope = previous;
        }
      },
    };
    const under: IParams["under"] = context.params.under;
    if (under === undefined) return sampled;

    // The entry: the fulcrum's height over the partner's region's, read on
    // both placed trunks at the start, taken off the root through the reach.
    const height = (
      who: IHumanBody,
      posture: IHumanPosture,
      region: AutoMovieHumanoidRegion,
    ): number => {
      const frame: IHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
        who.surfaces.regions[region];
      return resolveAutoMovieHumanoidSurfaces.place(
        frame,
        HumanTrunk.resolve(who, posture, undefined, undefined, new Set<AutoMovieHumanoidBone>([frame.bone])).get(frame.bone)!,
      ).point.y;
    };
    const theirs: IHumanPosture | undefined = partner.posture?.(context.start);
    const drop: number =
      theirs === undefined
        ? 0
        : Math.max(
            0,
            height(body, context.entry.posture, under.fulcrum) -
              height(partner.body, theirs, under.on),
          );
    return {
      ...sampled,
      posture: (seconds: number, channels?: readonly AutoMovieMotionHumanChannel[]): IHumanPosture => {
        const posture: IHumanPosture = sampled.posture(seconds, channels);
        const lowered: number =
          drop * clock.progress(AutoMovieMotionClock.START, "ready", seconds);
        return {
          ...posture,
          root: { ...posture.root, y: posture.root.y - lowered },
        };
      },
    };
  }
}
