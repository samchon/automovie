import { Quaternion, Vector3, AutoMovieEngineMotionSampling, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, AutoMovieHumanoidSocket, IAutoMovieAffordance, IAutoMovieHumanLimbGoal, IAutoMovieMotionEvent, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanActionLaw, IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanBicycleEffort, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanProp, IAutoMovieQuaternion, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { seated } from "../../everyday/internal/seated";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { hipJoints } from "../../posture/internal/hipJoints";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { HumanMountRider } from "./HumanMountRider";
import { HumanRide } from "./HumanRide";
import type { WorkingSeatRidePlan } from "./WorkingSeatRidePlan";
import { humanBicycleEffortTimeline } from "./humanBicycleEffortTimeline";
import * as HumanBicycleEffortData from "./HumanBicycleEffortData";

/*
 * Rise from the saddle while both feet follow their pedals and both hands
 * follow the handlebar. The seated ride provides the moving contact targets. A
 * smooth rise into and out of the authored clearance moves the pelvis up and
 * forward, and the ankle is refit about its pedal point under the new hip. The
 * entry seat and each sole's ball must already align with their named supports.
 * The law uses the distinct body/support states described by the in-field
 * seated and standing sprint study https://www.mdpi.com/1424-8220/24/11/3453 .
 * Its clearance, timing and fore-aft transfer are staging decisions.
 */
export const HumanBicycleEffort: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanBicycleEffort> =
  {
    name: "bicycleEffort",
    interrupts: {
      any: [
        { window: { start: 0, end: "seatOff" }, kind: "inertialize", entry: 0 },
        { window: { start: "seatOn", end: 1 }, kind: "inertialize", entry: 0 },
      ],
    },
    yields: ["head"],
    plan: planHumanBicycleEffort,
  };

/*
 * Rise from the saddle while both feet follow their pedals and both hands
 * follow the handlebar. The seated ride provides the moving contact targets. A
 * smooth rise into and out of the authored clearance moves the pelvis up and
 * forward, and the ankle is refit about its pedal point under the new hip. The
 * entry seat and each sole's ball must already align with their named supports.
 * The law uses the distinct body/support states described by the in-field
 * seated and standing sprint study https://www.mdpi.com/1424-8220/24/11/3453 .
 * Its clearance, timing and fore-aft transfer are staging decisions.
 */
function planHumanBicycleEffort(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBicycleEffort>,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry, params }: typeof context = context;
  const {
    on,
    seat,
    feet,
    hands,
    duration: seconds,
    seatOff,
    up,
    lower,
    seatOn,
    lift,
  }: typeof params = params;
  const events: IAutoMovieMotionEvent[] = humanBicycleEffortTimeline(params);

  const bicycle: ReturnType<typeof context.prop> = context.prop(on);
  const points: readonly string[] = [
    seat,
    feet.left,
    feet.right,
    hands.left,
    hands.right,
  ];
  const point = (
    id: string,
  ): IAutoMovieMotionHumanProp.IPlacedPoint | undefined =>
    bicycle.prop.point?.(id, context.start);
  const saddle: IAutoMovieMotionHumanProp.IPlacedPoint | undefined =
    point(seat);
  const leftPedal: IAutoMovieMotionHumanProp.IPlacedPoint | undefined = point(
    feet.left,
  );
  const rightPedal: IAutoMovieMotionHumanProp.IPlacedPoint | undefined = point(
    feet.right,
  );
  if (
    new Set(points).size !== points.length ||
    saddle === undefined ||
    leftPedal === undefined ||
    rightPedal === undefined ||
    point(hands.left) === undefined ||
    point(hands.right) === undefined ||
    HumanBicycleEffortData.SIDES.some(
      (side: AutoMovieHumanSide): boolean => !entry.feet[side].planted,
    ) ||
    entry.supports.some(
      (support): boolean =>
        support.part === "seat" &&
        support.support.kind === "prop" &&
        support.support.subject !== on,
    )
  )
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "on",
      value: on,
      feasible: null,
      reason:
        "the effort needs its own saddle and distinct pedal and grip points under an established seated rider",
      fix: "seat the rider with both feet on the named bicycle and supply both pedal and grip points",
    });
  if (entry.base.kind === "seated") {
    const affordances: readonly IAutoMovieAffordance[] | undefined =
      bicycle.prop.affordances;
    const seatGeometry: IAutoMovieAffordance | undefined = affordances?.find(
      (affordance): boolean =>
        affordance.id === seat && affordance.kind === "seat",
    );
    if (affordances !== undefined && seatGeometry === undefined)
      throw new AutoMovieMotionHumanRefusal({
        kind: "affordance",
        axis: "seat",
        value: seat,
        feasible: null,
        reason: "the named point is not a saddle affordance",
        fix: "name the bicycle's saddle affordance",
      });
    const depth: number | undefined =
      seatGeometry === undefined ? entry.base.seat?.depth : seatGeometry.depth;
    const saddleOffset: IAutoMovieVector3 = seated.point(body, {
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
      ...(depth === undefined ? {} : { depth }),
    });
    const saddleRotation: IAutoMovieQuaternion =
      saddle.rotation ??
      Quaternion.multiply(
        bicycle.frame(context.start).rotation,
        seatGeometry?.frame.rotation ?? Quaternion.identity(),
      );
    const expectedSeat: IAutoMovieVector3 = Vector3.add(
      saddle.point,
      Quaternion.rotateVector(saddleRotation, saddleOffset),
    );
    const sockets: typeof body.surfaces.sockets = body.surfaces.sockets;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      entry.pose,
      undefined,
      new Set<AutoMovieHumanoidBone>([
        sockets.seat.bone,
        sockets.ballLeft.bone,
        sockets.ballRight.bone,
      ]),
    );
    const align = (
      axis: string,
      name: AutoMovieHumanoidSocket,
      expected: IAutoMovieVector3,
    ): void => {
      const socket: (typeof sockets)[AutoMovieHumanoidSocket] = sockets[name];
      const displayed: IAutoMovieVector3 =
        AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePoint(socket, bones.get(socket.bone)!);
      const gap: number = Vector3.distance(displayed, expected);
      if (gap <= HumanBicycleEffortData.FIT) return;
      throw new AutoMovieMotionHumanRefusal({
        kind: "base",
        axis,
        value: gap,
        feasible: { kind: "range", minimum: 0, maximum: HumanBicycleEffortData.FIT, unit: "m" },
        reason:
          "the entered rider's contact is out of alignment with the named bicycle point",
        fix: "seat the rider on the named saddle and both pedals before beginning the effort",
      });
    };
    align("seat", "seat", expectedSeat);
    align("feet.left", "ballLeft", leftPedal.point);
    align("feet.right", "ballRight", rightPedal.point);
  }
  const { postureWithFrame, ...ride }: WorkingSeatRidePlan.IPlan =
    HumanRide.ride.plan({
      ...context,
      params: { on, seat, feet, hands, duration: seconds },
    });

  /*
   * Move the pelvis relative to the bicycle while retaining the ridden grip and
   * pedal targets.
   */
  const posture = (at: number): IAutoMovieMotionHumanPosture => {
    if (at <= seatOff || at >= seatOn) return ride.posture(at);
    const { posture: seated, frame }: WorkingSeatRidePlan.IWritten =
      postureWithFrame(at);

    const share: number =
      AutoMovieEngineMotionSampling.minimumJerkShare((at - seatOff) / (up - seatOff)) *
      (1 - AutoMovieEngineMotionSampling.minimumJerkShare((at - lower) / (seatOn - lower)));
    const height: number = share * lift;
    const incline: ReturnType<typeof HumanTrunk.incline> = HumanTrunk.incline(
      seated.joints,
      HumanBicycleEffortData.INCLINE * share,
      0,
    );
    const out: IAutoMovieMotionHumanPosture = {
      ...seated,
      root: Vector3.add(
        seated.root,
        Quaternion.rotateVector(frame.rotation, {
          x: 0,
          y: height,
          z: HumanBicycleEffortData.FORWARD * height,
        }),
      ),
      joints: incline.joints,
      limbs: { ...seated.limbs },
    };
    const heading: IAutoMovieQuaternion = humanPostureHeading(out);
    const hips: ReturnType<typeof hipJoints> = hipJoints(
      body,
      out.root,
      heading,
      out.joints.hips,
    );
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(heading, {
      x: 0,
      y: 0,
      z: body.measure.thigh,
    });
    for (const side of HumanBicycleEffortData.SIDES) {
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
  const phases: readonly (readonly [number, number])[] = [
    [seatOff, up],
    [up, lower],
    [lower, seatOn],
  ];
  for (const [from, to] of phases) {
    for (let index: number = 0; index <= HumanBicycleEffortData.INTERVALS; ++index) {
      const at: number = from + ((to - from) * index) / HumanBicycleEffortData.INTERVALS;
      const sample: IAutoMovieMotionHumanPosture = posture(at);
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(body, resolveHumanPosture(body, sample));
      for (const side of HumanBicycleEffortData.SIDES) {
        for (const [bone, limb] of [
          [`${side}Hand`, `${side}Arm`],
          [`${side}Foot`, `${side}Leg`],
        ] as const) {
          const goal: IAutoMovieHumanLimbGoal | undefined = sample.limbs[limb];
          const joint: IAutoMovieResolvedBone = bones.get(bone)!;
          if (
            goal !== undefined &&
            Vector3.length(Vector3.subtract(joint.worldPosition, goal.point)) <=
              HumanBicycleEffortData.FIT
          )
            continue;
          throw new AutoMovieMotionHumanRefusal({
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
    (window: IAutoMovieMotionHumanContactWindow): boolean =>
      window.part === "seat",
  )!;
  const barContacts: IAutoMovieMotionHumanContactWindow[] = HumanBicycleEffortData.SIDES.map(
    (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
      part: `${side}Hand`,
      kind: "grip",
      from: HumanRide.TAKE / seconds,
      to: 1,
      support: { kind: "prop", subject: on },
    }),
  );
  return {
    ...ride,
    events,
    contacts: [
      ...ride.contacts.filter(
        (window: IAutoMovieMotionHumanContactWindow): boolean =>
          window.part !== "seat",
      ),
      { ...seatContact, to: seatOff / seconds },
      { ...seatContact, from: seatOn / seconds },
      ...barContacts,
    ],
    posture,
  };
}
