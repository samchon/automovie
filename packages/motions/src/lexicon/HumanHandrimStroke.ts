import {
  Quaternion,
  Vector3,
  minimumJerk,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanHandrimStroke,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionInterval } from "../compose/AutoMovieMotionInterval";
import { seated } from "../everyday/seated";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanObject } from "../perform/HumanObject";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HandrimMaterialTransfer } from "./HandrimMaterialTransfer";
import { HumanHandrimStrokeForm } from "./HumanHandrimStrokeForm";
import { HumanHandrimStrokeRefuseRim } from "./HumanHandrimStrokeRefuseRim";
import { HumanMountRider } from "./HumanMountRider";
import { HumanRide } from "./HumanRide";
import type { WorkingSeatRidePlan } from "./WorkingSeatRidePlan";

/** The point and directions a rider uses to take the rim. */
type Grip = Parameters<typeof HumanMountRider.hold>[3];

/** The phase endpoints and live reader for one of the riding hands. */
interface IHand {
  /** The hand controlled by this rim. */
  side: AutoMovieHumanSide;
  /** Read the rim's material point at an action second. */
  gripAt: (at: number, frame: IAutoMovieRigidTransform) => Grip;
  /** The catch grip in the chair's catch placement, solved with the plan. */
  caught: Grip;
  /** The release grip in the chair's release placement, solved with the plan. */
  released: Grip;
  /** The radius of the declared rim in metres. */
  radius: number;
  /** Material rotation rates in radians per second at the window boundaries. */
  rates: IRimRates;
  /** Finger joint angles fitted to the chair's coarse collider. */
  closed: IAutoMovieMotionHumanPosture["joints"];
}

/**
 * A rim's material rotation rates at the grip window's ends, radians per
 * second.
 */
interface IRimRates {
  /** The rate at the catch. */
  catch: number;
  /** The rate at the release. */
  release: number;
}

/** One hand's declared wheel geometry before building its contact reader. */
interface IRim {
  /** The side of the named wheel. */
  side: AutoMovieHumanSide;
  /** The wheel's affordance id. */
  rim: string;
  /** Its declared axle frame and radius. */
  geometry: IAutoMovieAffordance;
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
    point: Vector3.add(
      to.position,
      Quaternion.rotateVector(
        swing,
        Vector3.subtract(grip.point, from.position),
      ),
    ),
    normal: Quaternion.rotateVector(swing, grip.normal),
    axis: Quaternion.rotateVector(swing, grip.axis!),
  };
};

/**
 * One single-handed or bilateral handrim engagement over a seated ride.
 * Register the law and give the chair a circumferential contact reader, such as
 * `wheelchairHandrimFrame`. The hands approach, follow the rotating rim points
 * until release, and recover outward to the carried seated pose. Wheel travel
 * is supplied by the authored course.
 *
 * The contact and recovery phases follow the arcing path documented in Slowik
 * et al. (2015), Figure 1 and Table 1,
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC4631660/#T1 . The recovery clearance
 * is a staging dimension of one rider hand length. The wrist enters and leaves
 * at the rim's tangential rate, estimated from the material point inside the
 * grip window, then blends to the seated pose. The law checks seat alignment,
 * active wheel sides and solved wrists at nine points through the push before
 * publishing contact windows. Chénier et al. (2022),
 * https://pubmed.ncbi.nlm.nih.gov/34915435/, also measured asymmetric
 * propulsion during wheelchair basketball dribbles.
 *
 * The three phases last the author's `approach`, `push` and `recovery` seconds;
 * no natural value is defined (provisional: no wheelchair-propulsion timing
 * study was read); pushing a manual wheelchair.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the entry, prop reader, push and recovery phases, and the source of the wheel travel.
 */
function planHumanHandrimStroke(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHandrimStroke>,
): IAutoMovieMotionHumanActionPlan {
  const {
    on,
    rims,
    hand: side,
    approach,
    push,
    recovery,
  }: IAutoMovieMotionHumanHandrimStroke = context.params;
  const release: number = approach + push;
  const duration: number = release + recovery;
  for (const [axis, value] of Object.entries({
    approach,
    push,
    recovery,
  })) {
    if (!(value > 0))
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
  if (!(approach < release && release < duration))
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
  const { postureWithFrame, ...base }: WorkingSeatRidePlan.IPlan =
    HumanRide.ride.plan({
      ...context,
      params: { on, duration: duration },
    });
  const active: readonly AutoMovieHumanSide[] =
    side === undefined ? HumanHandrimStrokeForm.SIDES : [side];
  if (side === undefined && rims?.left === rims?.right)
    HumanHandrimStrokeRefuseRim(on, rims?.right ?? "", "right");
  const wheels: IRim[] = active.map((side: AutoMovieHumanSide): IRim => {
    const rim: string = rims?.[side];
    const geometry: IAutoMovieAffordance | undefined =
      chair.prop.affordances?.find(
        (part: IAutoMovieAffordance): boolean =>
          part.id === rim && part.kind === "wheel",
      );
    if (
      geometry === undefined ||
      !(geometry.radius! > 0)
    )
      return HumanHandrimStrokeRefuseRim(on, rim, side);
    return { side, rim, geometry };
  });

  const chairSeat: ReturnType<typeof HumanObject.seat> = HumanObject.seat(
    { affordances: chair.prop.affordances ?? [] },
    chair.frame(context.start),
  );
  const support: IAutoMovieMotionHumanContactWindow.Support | undefined =
    context.entry.supports.find(
      (entry: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
        entry.part === "seat",
    )?.support;
  const seatBone: IAutoMovieMotionHumanBody["surfaces"]["sockets"]["seat"] =
    context.body.surfaces.sockets.seat;
  const hips: IAutoMovieResolvedBone = poseBones(
    context.body,
    context.entry.pose,
  ).get(seatBone.bone)!;
  const socket: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
    seatBone,
    hips,
  ).point;
  const seatGap: number = Vector3.length(
    Vector3.subtract(socket, seated.point(context.body, chairSeat)),
  );
  const yawGap: number = context.entry.posture.yaw - chairSeat.yaw;
  if (
    (support?.kind === "prop" && support.subject !== on) ||
    support?.kind === "person" ||
    !(seatGap <= HumanHandrimStrokeForm.CONTACT_GAP) ||
    !(
      Math.abs(yawGap - 360 * Math.round(yawGap / 360)) <=
      HumanHandrimStrokeForm.SEAT_HEADING_GAP
    )
  )
    throw new HumanRefusal({
      kind: "base",
      axis: "seat",
      value: support?.kind === "prop" ? support.subject : seatGap,
      feasible: { kind: "alternatives", values: [on] },
      reason: "the entry seat is not aligned on the named chair",
      fix: "sit on the named chair before beginning the stroke",
    });

  const frameAt = (at: number): IAutoMovieRigidTransform =>
    chair.frame(context.start + at);
  const {
    posture: catchPosture,
    frame: catchFrame,
  }: WorkingSeatRidePlan.IWritten = postureWithFrame(approach);
  const seatCentre: number = chair.prop.affordances!.find(
    (affordance: IAutoMovieAffordance): boolean => affordance.kind === "seat",
  )!.frame.translation.x;
  const releaseFrame: IAutoMovieRigidTransform = frameAt(release);
  const probe: number = Math.min(
    HumanHandrimStrokeForm.RIM_RATE_INTERVAL,
    push,
  );
  const catchProbe: number = Math.min(release, approach + probe);
  const releaseProbe: number = Math.max(approach, release - probe);
  const catchProbeFrame: IAutoMovieRigidTransform = frameAt(catchProbe);
  const releaseProbeFrame: IAutoMovieRigidTransform = frameAt(releaseProbe);
  const hands: IHand[] = wheels.map(({ side, rim, geometry }: IRim): IHand => {
    const sideOffset: number =
      (side === "left" ? 1 : -1) * (geometry.frame.translation.x - seatCentre);
    if (!(sideOffset > 0)) return HumanHandrimStrokeRefuseRim(on, rim, side);
    const radius: number = geometry.radius!;

    /**
     * Read the point supplied by the rotating part and its tangent in world
     * metres.
     */
    const gripAt = (at: number, frame: IAutoMovieRigidTransform): Grip => {
      const hit: ReturnType<NonNullable<typeof chair.prop.point>> =
        chair.prop.point?.(rim, context.start + at);
      if (hit === undefined) return HumanHandrimStrokeRefuseRim(on, rim, side);
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
      if (
        !(
          Math.abs(Vector3.length(spoke) - radius) <= tolerance &&
          Math.abs(Vector3.dot(axle, spoke)) <= tolerance
        )
      )
        return HumanHandrimStrokeRefuseRim(on, rim, side);
      return {
        point: hit.point,
        normal,
        axis: Vector3.cross(axle, normal),
        across: -1,
      };
    };
    const caught: Grip = gripAt(approach, catchFrame);
    const released: Grip = gripAt(release, releaseFrame);
    const rates: IHand["rates"] = {
      catch: HandrimMaterialTransfer.rate(
        caught,
        carry(gripAt(catchProbe, catchProbeFrame), catchProbeFrame, catchFrame),
        catchProbe - approach,
      ),
      release: HandrimMaterialTransfer.rate(
        released,
        carry(
          gripAt(releaseProbe, releaseProbeFrame),
          releaseProbeFrame,
          releaseFrame,
        ),
        releaseProbe - release,
      ),
    };
    const closed: IAutoMovieMotionHumanPosture["joints"] =
      HumanMountRider.closed(
        context.body,
        side,
        catchPosture,
        caught,
        chair.prop.shapes ?? [],
        catchFrame,
      );
    return { side, gripAt, caught, released, radius, rates, closed };
  });

  const windows: IAutoMovieMotionHumanContactWindow[] = active.map(
    (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
      part: `${side}Hand`,
      kind: "grip",
      from: approach / duration,
      to: release / duration,
      support: { kind: "prop", subject: on },
    }),
  );
  /** Compose the carried seated posture and the selected wrist targets. */
  const posture = (seconds: number): IAutoMovieMotionHumanPosture => {
    const at: number = Math.max(0, Math.min(duration, seconds));
    if (at === 0 || at === duration) return base.posture(at);
    const { posture: seated, frame: chairFrame }: WorkingSeatRidePlan.IWritten =
      postureWithFrame(at);
    const recovering: number = Math.max(0, (at - release) / recovery);
    const share: number =
      at < approach
        ? AutoMovieMotionInterval.progress(0, approach, at)
        : 1 - minimumJerk.share(recovering);
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
      ...seated.limbs,
    };
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...seated.joints,
    };
    for (const hand of hands) {
      const grip: Grip =
        at < approach
          ? HandrimMaterialTransfer.advance(
              carry(hand.caught, catchFrame, chairFrame),
              hand.radius,
              hand.rates.catch,
              at - approach,
              Math.min(approach, push),
            )
          : at <= release
            ? hand.gripAt(at, chairFrame)
            : HandrimMaterialTransfer.advance(
                carry(hand.released, releaseFrame, chairFrame),
                hand.radius,
                hand.rates.release,
                at - release,
                Math.min(recovery, push),
              );
      if (recovering > 0) {
        // Disengage outboard before returning to the rest arm pose.
        const outward: IAutoMovieVector3 = Quaternion.rotateVector(
          chairFrame.rotation,
          {
            x: hand.side === "left" ? 1 : -1,
            y: 0,
            z: 0,
          },
        );
        grip.point = Vector3.add(
          grip.point,
          Vector3.scale(
            outward,
            context.body.measure.hand * Math.sin(Math.PI * recovering) ** 2,
          ),
        );
      }
      const held: ReturnType<typeof HumanMountRider.hold> =
        HumanMountRider.hold(
          context.body,
          hand.side,
          seated,
          grip,
          share,
          hand.closed,
        );
      limbs[`${hand.side}Arm`] = {
        ...held.arm,
        planted: at >= approach && at <= release,
      };
      Object.assign(joints, held.fingers);
    }
    return { ...seated, limbs, joints };
  };

  // The existing fit can clamp a goal. Verify the resulting wrists before
  // publishing grip ownership at any point in this staged push.
  for (
    let sample: number = 0;
    sample <= HumanHandrimStrokeForm.PUSH_INTERVALS;
    ++sample
  ) {
    const at: number =
      sample === HumanHandrimStrokeForm.PUSH_INTERVALS
        ? release
        : approach + (push * sample) / HumanHandrimStrokeForm.PUSH_INTERVALS;
    const posed: IAutoMovieMotionHumanPosture = posture(at);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      context.body,
      resolveHumanPosture(context.body, posed),
    );
    for (const side of active) {
      const wrist: IAutoMovieVector3 = bones.get(`${side}Hand`)!.worldPosition;
      const goal: IAutoMovieVector3 = posed.limbs[`${side}Arm`]!.point;
      const gap: number = Vector3.length(Vector3.subtract(wrist, goal));
      if (!(gap <= HumanHandrimStrokeForm.CONTACT_GAP))
        throw new HumanRefusal({
          kind: "reach",
          axis: `rims.${side}`,
          value: gap,
          feasible: {
            kind: "range",
            minimum: 0,
            maximum: HumanHandrimStrokeForm.CONTACT_GAP,
            unit: "m",
          },
          reason: `the ${side} wrist misses the rim grip at ${at.toFixed(3)} s`,
          fix: "choose a reachable contact arc or a chair that fits the performer",
        });
    }
  }
  return {
    ...base,
    hands: active,
    contact: approach,
    events: [
      { name: "catch", share: approach / duration },
      { name: "release", share: release / duration },
    ],
    contacts: [...base.contacts, ...windows],
    posture,
  };
}

/**
 * One single-handed or bilateral handrim engagement over a seated ride.
 * Register the law and give the chair a circumferential contact reader, such as
 * `wheelchairHandrimFrame`. The hands approach, follow the rotating rim points
 * until release, and recover outward to the carried seated pose. Wheel travel
 * is supplied by the authored course.
 *
 * The contact and recovery phases follow the arcing path documented in Slowik
 * et al. (2015), Figure 1 and Table 1,
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC4631660/#T1 . The recovery clearance
 * is a staging dimension of one rider hand length. The wrist enters and leaves
 * at the rim's tangential rate, estimated from the material point inside the
 * grip window, then blends to the seated pose. The law checks seat alignment,
 * active wheel sides and solved wrists at nine points through the push before
 * publishing contact windows. Chénier et al. (2022),
 * https://pubmed.ncbi.nlm.nih.gov/34915435/, also measured asymmetric
 * propulsion during wheelchair basketball dribbles.
 *
 * The three phases last the author's `approach`, `push` and `recovery` seconds;
 * no natural value is defined (provisional: no wheelchair-propulsion timing
 * study was read); pushing a manual wheelchair.
 */
export const HumanHandrimStroke: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanHandrimStroke> =
  {
    name: "handrimStroke",
    interrupts: {},
    yields: ["head"],
    plan: planHumanHandrimStroke,
  };
