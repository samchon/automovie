import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBicycleEffort,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { hipJoints } from "../posture/hipJoints";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanMountRider } from "./HumanMountRider";
import { HumanRide } from "./HumanRide";

/** Sides of the bicycle contact pairs. */
const SIDES: readonly ("left" | "right")[] = ["left", "right"];

/** Forward pelvic transfer as a share of vertical effort, provisional for film blocking. */
const FORWARD: number = 0.35;

/** Additional trunk inclination over the flying saddle, in provisional staging degrees. */
const INCLINE: number = 7;

/** Metres permitted between a held effector's goal and displayed joint. */
const FIT: number = 0.01;

/** Intervals checked in each rising, standing and lowering phase. */
const INTERVALS: number = 8;

/**
 * Rise from the saddle while both feet follow their pedals and both hands
 * follow the handlebar. The seated ride provides the moving contact targets.
 * A smooth rise into and out of the authored clearance moves the pelvis up
 * and forward, and the ankle is refit about its pedal point under the new hip.
 * The law uses the distinct body/support states described by the in-field
 * seated and standing sprint study https://www.mdpi.com/1424-8220/24/11/3453 .
 * Its clearance, timing and fore-aft transfer are staging decisions.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the fitted supports, the authored transitions and the measured reference.
 * @evidence contracts/development/design.md#principled-representation The original moving contact goals remain anchored while the independent pelvis follows a timed effort curve.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One action law composed over the seated ride and its existing ankle and prop-contact solvers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No separate crank or frame clock. Hold geometry comes from the same moving bicycle throughout.
 */
export const HumanBicycleEffort: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanBicycleEffort> =
  {
    name: "bicycleEffort",
    interrupts: {
      any: [
        { window: [0, "seatOff"], kind: "inertialize", entry: 0 },
        { window: ["seatOn", 1], kind: "inertialize", entry: 0 },
      ],
    },
    yields: ["head"],
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBicycleEffort>,
    ): IAutoMovieMotionHumanActionPlan => {
      const { body, entry, params }: typeof context = context;
      const { on, seat, feet, hands, seconds, seatOff, up, lower, seatOn, lift }: typeof params = params;
      HumanBound.above("seconds", seconds, HumanRide.TAKE, "s");
      HumanBound.least("seatOff", seatOff, HumanRide.TAKE, "s");
      HumanBound.above("up", up, seatOff, "s");
      HumanBound.least("lower", lower, up, "s");
      HumanBound.within("seatOn", seatOn, lower, seconds, "s", "minimum");
      HumanBound.above("lift", lift, 0, "m");

      const bicycle: ReturnType<typeof context.prop> = context.prop(on);
      const points: readonly string[] = [seat, feet.left, feet.right, hands.left, hands.right];
      if (
        new Set(points).size !== points.length ||
        points.some((point: string): boolean => bicycle.prop.point?.(point, context.start) === undefined) ||
        SIDES.some((side: "left" | "right"): boolean => !entry.feet[side].planted) ||
        entry.supports.some(
          (support): boolean =>
            support.part === "seat" && support.support.kind === "prop" && support.support.subject !== on,
        )
      )
        throw new HumanRefusal({
          kind: "affordance",
          axis: "on",
          value: on,
          feasible: null,
          reason: "the effort needs its own saddle and distinct pedal and grip points under an established seated rider",
          fix: "seat the rider with both feet on the named bicycle and supply both pedal and grip points",
        });
      const ride: IAutoMovieMotionHumanActionPlan = HumanRide.ride.plan({
        ...context,
        params: { on, seat, feet, hands, seconds },
      });

      /** Move the pelvis relative to the bicycle while retaining the ridden grip and pedal targets. */
      const posture = (at: number): IAutoMovieMotionHumanPosture => {
        const seated: IAutoMovieMotionHumanPosture = ride.posture(at);
        if (at <= seatOff || at >= seatOn) return seated;

        const share: number =
          minimumJerk.share((at - seatOff) / (up - seatOff)) *
          (1 - minimumJerk.share((at - lower) / (seatOn - lower)));
        const height: number = share * lift;
        const frame: IAutoMovieQuaternion = bicycle.frame(context.start + at).rotation;
        const incline: ReturnType<typeof HumanTrunk.incline> = HumanTrunk.incline(
          seated.joints,
          INCLINE * share,
          0,
        );
        const out: IAutoMovieMotionHumanPosture = {
          ...seated,
          root: Vector3.add(
            seated.root,
            Quaternion.rotateVector(frame, { x: 0, y: height, z: FORWARD * height }),
          ),
          joints: incline.joints,
          limbs: { ...seated.limbs },
        };
        const heading: IAutoMovieQuaternion = resolveHumanPosture.heading(out);
        const hips: ReturnType<typeof hipJoints> = hipJoints(body, out.root, heading, out.joints.hips);
        const forward: IAutoMovieVector3 = Quaternion.rotateVector(heading, { x: 0, y: 0, z: body.measure.thigh });
        for (const side of SIDES) {
          const goal: IAutoMovieHumanLimbGoal = seated.limbs[`${side}Leg`]!;
          out.limbs[`${side}Leg`] = HumanMountRider.ankled(
            body,
            side,
            { ...goal, bend: Vector3.add(hips[side], forward) },
            hips[side],
            heading,
          );
        }
        return out;
      };

      // Check achievable displayed joints before declaring a supported effort.
      const phases: readonly (readonly [number, number])[] = [[seatOff, up], [up, lower], [lower, seatOn]];
      for (const [from, to] of phases) {
        for (let index: number = 0; index <= INTERVALS; ++index) {
          const at: number = from + ((to - from) * index) / INTERVALS;
          const sample: IAutoMovieMotionHumanPosture = posture(at);
          const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, resolveHumanPosture(body, sample));
          for (const side of SIDES) {
            for (const [bone, limb] of [
              [`${side}Hand`, `${side}Arm`],
              [`${side}Foot`, `${side}Leg`],
            ] as const) {
              const goal: IAutoMovieHumanLimbGoal | undefined = sample.limbs[limb];
              const joint: IAutoMovieResolvedBone = bones.get(bone)!;
              if (goal !== undefined && Vector3.length(Vector3.subtract(joint.worldPosition, goal.point)) <= FIT)
                continue;
              throw new HumanRefusal({
                kind: "reach",
                axis: limb,
                value: at,
                feasible: null,
                reason: `the cyclist loses the ${bone} contact at ${at.toFixed(3)} s`,
                fix: "lower the effort clearance or fit the saddle, pedals and grips to the rider",
              });
            }
          }
        }
      }

      const seatContact: IAutoMovieMotionHumanContactWindow = ride.contacts.find(
        (window: IAutoMovieMotionHumanContactWindow): boolean => window.part === "seat",
      )!;
      const barContacts: IAutoMovieMotionHumanContactWindow[] = SIDES.map(
        (side: "left" | "right"): IAutoMovieMotionHumanContactWindow => ({
          part: `${side}Hand`,
          kind: "grip",
          from: HumanRide.TAKE / seconds,
          to: 1,
          support: { kind: "prop", subject: on },
        }),
      );
      return {
        ...ride,
        events: [
          { name: "seatOff", share: seatOff / seconds },
          { name: "standing", share: up / seconds },
          { name: "lower", share: lower / seconds },
          { name: "seatOn", share: seatOn / seconds },
        ],
        contacts: [
          ...ride.contacts.filter((window: IAutoMovieMotionHumanContactWindow): boolean => window.part !== "seat"),
          { ...seatContact, to: seatOff / seconds },
          { ...seatContact, from: seatOn / seconds },
          ...barContacts,
        ],
        posture,
      };
    },
  };
