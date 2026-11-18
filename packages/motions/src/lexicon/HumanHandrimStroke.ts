import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanHandrimStroke,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanMountRider } from "./HumanMountRider";
import { HumanRide } from "./HumanRide";

/** The two hands that act together in this stroke. */
const SIDES: readonly ("left" | "right")[] = ["left", "right"];

/** The point and directions a rider uses to take the rim. */
type Grip = Parameters<typeof HumanMountRider.hold>[3];

/** The phase endpoints and live reader for one of the riding hands. */
interface IHand {
  /** The hand controlled by this rim. */
  side: "left" | "right";
  /** Read the rim's material point at an action second. */
  gripAt: (at: number, frame: IAutoMovieRigidTransform) => Grip;
  /** Cached catch grip in the chair's catch placement. */
  caught: Grip;
  /** Cached release grip in the chair's release placement. */
  released: Grip;
  /** Finger joint angles fitted to the chair's coarse collider. */
  closed: IAutoMovieMotionHumanPosture["joints"];
}

/** Carry a sampled grip from one chair placement into another. */
const carry = (
  grip: Grip,
  from: IAutoMovieRigidTransform,
  to: IAutoMovieRigidTransform,
): Grip => {
  const swing: IAutoMovieQuaternion = Quaternion.multiply(
    to.rotation,
    Quaternion.inverse(from.rotation),
  );
  return {
    ...grip,
    point: Vector3.add(to.position, Quaternion.rotateVector(swing, Vector3.subtract(grip.point, from.position))),
    normal: Quaternion.rotateVector(swing, grip.normal),
    axis: Quaternion.rotateVector(swing, grip.axis!),
  };
};

/** Refuse a wheel selection without a usable circumferential material point. */
const refuseRim = (on: string, rim: string, side: "left" | "right"): never => {
  throw new HumanRefusal({
    kind: "affordance",
    axis: `rims.${side}`,
    value: rim,
    feasible: null,
    reason: `${on} has no eligible moving contact on rim ${rim}`,
    fix: "name a distinct wheel rim with a radial material-point reader",
  });
};

/**
 * One bilateral handrim engagement over an ordinary seated ride.
 * Register the law and give the chair a circumferential contact reader,
 * such as `wheelchairHandrimFrame`. The hands approach, follow the
 * rotating rim points until release, and recover outward to the carried
 * seated pose. Wheel travel is supplied by the authored course.
 *
 * The contact and recovery phases follow the arcing path documented in
 * Slowik et al. (2015), Figure 1 and Table 1,
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC4631660/#T1 . The recovery
 * clearance is a staging dimension of one rider hand length.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the entry, prop reader, push and recovery phases, and the source of the wheel travel.
 * @evidence contracts/development/design.md#principled-representation The plan composes the ride's support path with a phase-clocked arm target and bilateral grip windows.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One registered action over the reusable HumanRide base and HumanMountRider hand fit.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The prop reader owns the handrim material trajectory. The law computes stage poses and leaves wheel dynamics to the authored course.
 */
export const HumanHandrimStroke: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanHandrimStroke> = {
  name: "handrimStroke",
  interrupts: {},
  yields: ["head"],
  plan: (
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHandrimStroke>,
  ): IAutoMovieMotionHumanActionPlan => {
    const { on, rims, approach, push, recovery }: IAutoMovieMotionHumanHandrimStroke = context.params;
    const release: number = approach + push;
    const duration: number = release + recovery;
    for (const [axis, value] of Object.entries({ approach, push, recovery })) {
      if (!Number.isFinite(value) || value <= 0)
        throw new HumanRefusal({
          kind: "parameter",
          axis,
          value,
          feasible: {
            kind: "range",
            minimum: 0,
            maximum: null,
            unit: "s",
            open: "minimum",
          },
          reason: "the phase needs positive, finite seconds",
          fix: "give a positive duration in seconds for this phase",
        });
    }
    if (!(Number.isFinite(duration) && approach < release && release < duration))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "duration",
        value: duration,
        feasible: null,
        reason: "the phase durations do not produce distinct finite times",
        fix: "give positive phase seconds of comparable scale",
      });

    const chair: IAutoMovieMotionHumanPropReader = context.prop(on);
    if (chair.prop.motion === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "on",
        value: on,
        feasible: null,
        reason: "a handrim stroke follows a chair on a declared course",
        fix: "bind the chair's course as the prop motion",
      });
    const base: IAutoMovieMotionHumanActionPlan = HumanRide.ride.plan({
      ...context,
      params: { on, seconds: duration },
    });
    if (rims?.left === rims?.right) refuseRim(on, rims?.right ?? "", "right");

    const frameAt = (at: number): IAutoMovieRigidTransform => chair.frame(context.start + at);
    const catchFrame: IAutoMovieRigidTransform = frameAt(approach);
    const releaseFrame: IAutoMovieRigidTransform = frameAt(release);
    const hands: IHand[] = SIDES.map((side: "left" | "right"): IHand => {
      const rim: string = rims?.[side];
      const affordance: IAutoMovieAffordance | undefined = chair.prop.affordances?.find(
        (part: IAutoMovieAffordance): boolean => part.id === rim && part.kind === "wheel",
      );
      if (affordance === undefined || !(Number.isFinite(affordance.radius) && affordance.radius! > 0))
        return refuseRim(on, rim, side);
      const geometry: IAutoMovieAffordance = affordance;
      const radius: number = geometry.radius!;

      /** Read the point supplied by the rotating part and its tangent in world metres. */
      const gripAt = (at: number, frame: IAutoMovieRigidTransform): Grip => {
        const hit: ReturnType<NonNullable<typeof chair.prop.point>> =
          chair.prop.point?.(rim, context.start + at);
        if (hit === undefined) return refuseRim(on, rim, side);
        const centre: IAutoMovieVector3 = Vector3.add(
          frame.position,
          Quaternion.rotateVector(frame.rotation, geometry.frame.translation),
        );
        const axle: IAutoMovieVector3 = Quaternion.rotateVector(
          Quaternion.multiply(frame.rotation, geometry.frame.rotation),
          { x: 0, y: 1, z: 0 },
        );
        const spoke: IAutoMovieVector3 = Vector3.subtract(hit.point, centre);
        const normal: IAutoMovieVector3 = Vector3.scale(spoke, 1 / radius);
        const tolerance: number = radius * Math.sqrt(Number.EPSILON);
        if (!(Math.abs(Vector3.length(spoke) - radius) <= tolerance &&
              Math.abs(Vector3.dot(axle, spoke)) <= tolerance))
          return refuseRim(on, rim, side);
        return {
          point: hit.point,
          normal,
          axis: Vector3.cross(axle, normal),
          across: -1,
        };
      };
      const caught: Grip = gripAt(approach, catchFrame);
      const released: Grip = gripAt(release, releaseFrame);
      const closed: IAutoMovieMotionHumanPosture["joints"] = HumanMountRider.closed(
        context.body, side, base.posture(approach), caught, chair.prop.shapes ?? [], catchFrame,
      );
      return { side, gripAt, caught, released, closed };
    });

    const windows: IAutoMovieMotionHumanContactWindow[] = SIDES.map(
      (side: "left" | "right"): IAutoMovieMotionHumanContactWindow => ({
        part: `${side}Hand`,
        kind: "grip",
        from: approach / duration,
        to: release / duration,
        support: { kind: "prop", subject: on },
      }),
    );
    return {
      ...base,
      hands: SIDES,
      contact: approach,
      events: [
        { name: "catch", share: approach / duration },
        { name: "release", share: release / duration },
      ],
      contacts: [...base.contacts, ...windows],
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const at: number = Math.max(0, Math.min(duration, seconds));
        const seated: IAutoMovieMotionHumanPosture = base.posture(at);
        if (at === 0 || at === duration) return seated;
        const chairFrame: IAutoMovieRigidTransform = frameAt(at);
        const recovering: number = Math.max(0, (at - release) / recovery);
        const share: number = at < approach
          ? minimumJerk(at / approach).s
          : 1 - minimumJerk(recovering).s;
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...seated.limbs };
        const joints: IAutoMovieMotionHumanPosture["joints"] = { ...seated.joints };
        for (const hand of hands) {
          const grip: Grip = at < approach
            ? carry(hand.caught, catchFrame, chairFrame)
            : at <= release
              ? hand.gripAt(at, chairFrame)
              : carry(hand.released, releaseFrame, chairFrame);
          if (recovering > 0) {
            // Disengage outboard before returning to the rest arm pose.
            const outward: IAutoMovieVector3 = Quaternion.rotateVector(chairFrame.rotation, {
              x: hand.side === "left" ? 1 : -1, y: 0, z: 0,
            });
            grip.point = Vector3.add(grip.point, Vector3.scale(
              outward,
              context.body.measure.hand * Math.sin(Math.PI * recovering) ** 2,
            ));
          }
          const held: ReturnType<typeof HumanMountRider.hold> = HumanMountRider.hold(
            context.body, hand.side, seated, grip, share, hand.closed,
          );
          limbs[`${hand.side}Arm`] = {
            ...held.arm,
            planted: at >= approach && at <= release,
          };
          Object.assign(joints, held.fingers);
        }
        return { ...seated, limbs, joints };
      },
    };
  },
};
