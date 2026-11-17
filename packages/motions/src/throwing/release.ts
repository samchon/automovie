import {
  Quaternion,
  Vector3,
  integrateMotionTrajectory,
} from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBendTrack } from "../compose/AutoMovieMotionHumanBendTrack";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanPropFrame } from "../perform/HumanPropFrame";
import type { IHumanProp } from "../perform/IHumanProp";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { placeHumanHandSurface } from "../posture/placeHumanHandSurface";
import { poseBones } from "../posture/poseBones";

/**
 * Letting go: a hand opens on what it holds, and the held prop leaves it.
 *
 * The hand stays where the hold kept it on the trunk (its grip frame at the
 * entry, read in the chest's frame and carried with the chest the carrier
 * shows), and opens at `open`, the decisive instant, a brief pause
 * (`AutoMovieMotionHumanTiming.PAUSES.brief`, provisional) after the entry.
 * Until then its grip window on the prop takes the hand over from the hold;
 * at `open` the prop is launched (`IHumanActionPlan.launches`) with the
 * hand's velocity there, the central difference of the carried grip point at
 * the engine's plan-time step (`integrateMotionTrajectory.STEP`), so a drop
 * from a still hand falls and one from a moving carrier carries its speed.
 *
 * A prop that rests on something the hand held back (an arrow on a drawn
 * string, #3487) is launched by `launch` instead: along its line from one of
 * its points to another, at the speed the launcher gives (a bow's
 * `launchSpeed` at the string's travel), plus the hand's velocity.
 *
 * It is performed over a carrier and claims only that hand's arm. A hand
 * that holds nothing is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the hand does, the decisive instant, the launch velocity's derivation, the launcher case, the overlay and the refusal.
 * @evidence contracts/development/design.md#principled-representation A law record of one arm primitive over the carrier, a grip window ending at the opening and a launch there.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The velocity is the hand's own; the opening time reads the shared pause table.
 */
export namespace release {
  /** The action's name. */
  export const name: HumanActionName = "release";

  /** Cancel table: anything may follow once the hand has opened. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    any: [{ window: ["open", 1], kind: "inertialize", entry: 0, blend: 0.15 }],
  };

  /** Performed over a carrier: it claims only the opening hand's arm. */
  export const overlay: boolean = true;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The hand, the held prop and a launcher's own launch.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The launch speed is the launcher's, given by the row that knows it.
   */
  export interface IParams {
    /** The opening hand; `right` when absent. */
    hand?: HumanHand.Side;

    /** The prop it lets go of; the one the hand holds at the entry when absent. */
    prop?: string;

    /**
     * A prop launched along its own line at a launcher's speed instead of
     * the held prop's drop: an arrow on the drawn string.
     */
    launch?: {
      /** The launched prop's subject. */
      prop: string;
      /** The prop's point its line starts from, such as an arrow's `nock`. */
      from: string;
      /** The point its line runs to, such as the arrow's `tip`. */
      to: string;
      /** The launcher's speed along the line, metres per second. */
      speed: number;
    };
  }

  /**
   * Plan a release.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hand holds nothing and no prop is launched.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes the held-hand refusal, chest-carried opening, original opening event and launch; runtime FK is borrowed only for that current chest read.
   * @evidence contracts/development/implementation.md#principled-implementation The entry grip is rigidly carried in the current raw chest frame; the original hand-local surface offset places one actual wrist for the full default bend and original contact-goal assembler. Central differences at the engine step retain the actual carrier velocity.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Entry frames and clock precede one carried-frame reader, one actual arm writer and the original drop/launcher outputs; shared placement and goal owners keep surface arithmetic in one place.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every current bend sweep, shape transition, opening/contact window, launch point, central-difference sample and missing-affordance refusal remains unchanged; no solved point or sampled pose is reused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Entry FK requests chest/hand only and its actual grip-point read omits two unused normal/forward rotations. Each used fist/flat local offset prepares once rather than three times per writer; one current wrist serves bend plus goal, while actual chest FK and the full bounded bend remain. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The immutable body, hand and each of the two original grip shapes fix only their local offset. Current world chest, rotation, point, shape selection and bend remain inputs; composer FK loans reach the original raw chest policy without applying ROM projection.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns fixed entry frames and at most two copied local offsets until release. Each write releases its borrowed FK source on return or throw and returns fresh point/contact payloads, without retaining a query, reader, sampled pose or history.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanActionContext["body"] = context.body;
    const side: HumanHand.Side = context.params.hand ?? "right";
    const held: string | undefined =
      context.params.prop ?? context.entry.holds[side];
    if (held === undefined && context.params.launch === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "hand",
        value: side,
        reason: `${context.subject}'s ${side} hand holds nothing to let go of`,
        fix: "take a prop in that hand first, or release the other hand",
      });

    // The grip's frame at the entry, kept in the chest's frame.
    const bones: ReturnType<typeof poseBones> = poseBones(body, context.entry.pose,
      undefined, new Set<AutoMovieHumanoidBone>(["chest", `${side}Hand`]));
    const chest: IHumanProp.IFrame = HumanPropFrame.bone(bones.get("chest")!);
    const grip: IHumanProp.IFrame = {
      position: HumanHand.preparePoint(body, side, "grip")(bones),
      rotation: bones.get(`${side}Hand`)!.worldRotation,
    };
    const kept: IHumanProp.IFrame = HumanPropFrame.relative(chest, grip);
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.sequence([
      { name: "hold", seconds: AutoMovieMotionHumanTiming.PAUSES.brief },
      { name: "open", seconds: AutoMovieMotionHumanTiming.PAUSES.brief },
    ]);
    const open: number = clock.at("open");
    const base: IHumanActionPlan = AutoMovieMotionHumanBase.under(
      context,
      clock.duration,
    );
    const carried: (posture: IHumanPosture, resolution?: Parameters<IHumanActionPlan["posture"]>[2]) => IHumanProp.IFrame =
      (posture: IHumanPosture, resolution?: Parameters<IHumanActionPlan["posture"]>[2]): IHumanProp.IFrame =>
      HumanPropFrame.compose(
        HumanPropFrame.bone(HumanTrunk.resolve(body, posture, undefined, resolution, CHEST).get("chest")!),
        kept,
      );
    const offsets: Partial<Record<"fist" | "flat", IAutoMovieVector3>> = {};
    const placed: (posture: IHumanPosture, seconds: number,
      resolution?: Parameters<IHumanActionPlan["posture"]>[2]) => { wrist: HumanHand.IWrist; contact: IAutoMovieVector3 } = (
      posture: IHumanPosture,
      seconds: number,
      resolution?: Parameters<IHumanActionPlan["posture"]>[2],
    ): { wrist: HumanHand.IWrist; contact: IAutoMovieVector3 } => {
      const at: IHumanProp.IFrame = carried(posture, resolution);
      const shape: "fist" | "flat" = seconds < open ? "fist" : "flat";
      const contact: IAutoMovieVector3 = offsets[shape] ??=
        { ...HumanHand.offset(body, side, "grip", shape).point };
      return { wrist: placeHumanHandSurface(contact, at.position, at.rotation), contact };
    };

    // The elbow is solved once over the span, when the action is planned,
    // and continued through it (`AutoMovieMotionHumanBendTrack`).
    const elbow: AutoMovieMotionHumanBendTrack.ITrack = AutoMovieMotionHumanBendTrack.of({
      body, side, from: 0, to: clock.duration, fallback: "hang",
      goal: (posture: IHumanPosture, seconds: number): HumanHand.IWrist => placed(posture, seconds).wrist,
    });
    const hand: IAutoMovieMotionHumanPrimitive = {
      channels: [`${side}Arm`, `${side}Hand`],
      from: 0,
      to: clock.duration,
      prepare: (before: IAutoMovieMotionHumanPrimitive.Reader): void => elbow.prepare(before),
      ...(held === undefined
        ? {}
        : {
            contacts: [
              {
                part: `${side}Hand`,
                kind: "grip",
                from: 0,
                to: open / clock.duration,
                support: { kind: "prop", subject: held },
              },
            ],
          }),
      write: (posture: IHumanPosture, seconds: number,
        _before?: IAutoMovieMotionHumanPrimitive.Reader,
        resolution?: Parameters<IHumanActionPlan["posture"]>[2]): IHumanPosture => {
        const { wrist, contact }: ReturnType<typeof placed> = placed(posture, seconds, resolution);
        return {
          ...posture,
          limbs: {
            ...posture.limbs,
            [`${side}Arm`]: AutoMovieMotionHumanArmTarget.fromWrist(wrist,
              elbow.elbow(posture, seconds, wrist), { ...contact }),
          },
        };
      },
    };
    const composed: IHumanActionPlan = composeAutoMovieMotionHumanAction({
      base,
      clock,
      contact: "open",
      primitives: [hand],
    });

    // The hand's velocity at the opening, from the carrier's motion.
    const h: number = integrateMotionTrajectory.STEP;
    const point: (s: number) => IAutoMovieVector3 = (s: number): IAutoMovieVector3 =>
      carried(base.posture(Math.max(0, Math.min(clock.duration, s)))).position;
    const velocity: IAutoMovieVector3 = Vector3.scale(
      Vector3.subtract(point(open + h), point(open - h)),
      1 / (2 * h),
    );
    const launches: IHumanActionPlan.ILaunch[] = [];
    if (held !== undefined && context.params.launch?.prop !== held)
      launches.push({
        prop: held,
        seconds: open,
        point: point(open),
        velocity,
      });
    const launch: IParams["launch"] = context.params.launch;
    if (launch !== undefined) {
      const prop: IHumanActionContext.IProp = context.prop(launch.prop);
      const frame: IHumanProp.IFrame = prop.frame(context.start + open);
      const place: (id: string) => IAutoMovieVector3 = (id: string): IAutoMovieVector3 => {
        const local: IHumanProp["points"][string] | undefined = prop.prop.points[id];
        if (local === undefined)
          throw new HumanRefusal({
            kind: "affordance",
            axis: "launch",
            value: `${launch.prop}.${id}`,
            feasible: {
              kind: "alternatives",
              values: Object.keys(prop.prop.points),
            },
            reason: `${launch.prop} has no point named ${id}`,
            fix: "name points the launched prop declares",
          });
        return Vector3.add(
          frame.position,
          Quaternion.rotateVector(frame.rotation, local.point),
        );
      };
      const along: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(place(launch.to), place(launch.from)),
      );
      launches.push({
        prop: launch.prop,
        seconds: open,
        point: frame.position,
        velocity: Vector3.add(velocity, Vector3.scale(along, launch.speed)),
        rotation: frame.rotation,
      });
    }
    return { ...composed, launches };
  }
}

/** The frame whose fixed offset carries the released hand. */
const CHEST: ReadonlySet<AutoMovieHumanoidBone> = new Set(["chest"]);
