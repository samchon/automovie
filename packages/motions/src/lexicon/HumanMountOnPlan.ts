import { Quaternion, Vector3, minimumJerk, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSit,
  IAutoMovieRigidTransform,
  IAutoMovieSwivelSeed,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/internal/stand";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { courseHumanLegs } from "../compose/internal/courseHumanLegs";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { prepareSeatedPalms } from "../everyday/internal/prepareSeatedPalms";
import { seated } from "../everyday/internal/seated";
import { sitCarried } from "../everyday/internal/sitCarried";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPropFrame } from "../perform/HumanPropFrame";
import { HumanFrame } from "../posture/HumanFrame";
import { hipJoints } from "../posture/internal/hipJoints";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { resolveHumanPosture } from "../posture/internal/resolveHumanPosture";
import { HumanMount } from "./HumanMount";
import { HumanMountFlight } from "./HumanMountFlight";
import { HumanMountOnCourses } from "./HumanMountOnCourses";
import { HumanMountOnFrame } from "./HumanMountOnFrame";
import { HumanMountPlace } from "./HumanMountPlace";
import { HumanMountPush } from "./HumanMountPush";
import { HumanMountTrack } from "./HumanMountTrack";
import { HumanSwungLeg } from "./HumanSwungLeg";
import { prepareCoupledMount } from "./internal/prepareCoupledMount";
import { prepareMountMaterialSeat } from "./internal/prepareMountMaterialSeat";
import { prepareMountTransfer } from "./internal/prepareMountTransfer";

/** Where the pelvis is at an instant of getting on (`HumanMountOnFrame`). */
type Frame = HumanMountOnFrame.Frame;

/** The alternatives of `PlanLowerLimb`'s site. */
type PlanLowerLimb = "leftLeg" | "rightLeg";

/** The alternatives of `PlanPart`'s site. */
type PlanPart = "leftFoot" | "rightFoot";

/** The sit parameters the climb uses. */
type IPlanContext = Pick<IAutoMovieMotionHumanSit.IParams, "hold" | "manner">;

/**
 * Plan getting onto a seat.
 *
 * @param context The sit's context.
 * @param seat The seat.
 * @param final The seated back: its pitch and trunk angles, degrees.
 * @param turn The turn from the entry heading to the seat's, degrees.
 * @returns The plan, with the sit's events `seatContact` and `seated`.
 * @throws {HumanRefusal} When the pelvis stands more than a leg's length from
 *   its place on the seat, with that length.
 */
export function HumanMountOnPlan(
  context: IAutoMovieMotionHumanActionContext<IPlanContext>,
  seat: IAutoMovieMotionHumanSeated.ISeat,
  final: HumanMountOnFrame.IFinal,

  turn: number,
): IAutoMovieMotionHumanActionPlan {
  const body: IAutoMovieMotionHumanBody = context.body;
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const astride: boolean = seat.astride === true;
  const yaw0: number = context.entry.posture.yaw;
  const yaw1: number = yaw0 + turn;
  const start: IAutoMovieVector3 = seated.socket(body, context.entry.posture);
  const finalFrame = (): Frame => ({
    root: context.entry.posture.root,
    yaw: yaw1,
    pitch: HumanTrunk.pelvisPitch(final.pitch) + (seat.pitch ?? 0),
    roll: seat.roll ?? 0,
    joints: final.joints.hips === undefined ? {} : { hips: final.joints.hips },
  });
  const material = prepareMountMaterialSeat.context(context, seat, finalFrame);
  const goal: IAutoMovieVector3 =
    material?.goal ??
    prepareMountMaterialSeat(context, seat, finalFrame) ??
    seated.point(body, seat);

  // The body gets on from within a leg's length of its place on the seat.
  const away: number = Math.hypot(goal.x - start.x, goal.z - start.z);
  const reach: number = m.thigh + m.shank;
  if (away > reach)
    throw new HumanRefusal({
      kind: "reach",
      axis: "seat",
      value: away,
      feasible: { kind: "range", minimum: 0, maximum: reach, unit: "m" },
      reason: `the pelvis stands ${away.toFixed(3)} m from its place on the seat, and a body gets onto a high seat from within a leg's length, ${reach.toFixed(3)} m`,
      fix: "walk up to the seat first",
    });

  const hold: number = context.params.hold ?? 1;
  HumanBound.least("hold", hold, 0, "s");

  // The seat's height above the floor the feet leave (`seated.floor`).
  const under: number = seated.floor(body, context.entry);

  // A body already on the seat, as when getting off was broken off, only settles: no climb and no hop. It is on it when nearer its place than a hop rises, so a climb would overshoot its own seat.
  const settled: boolean =
    Vector3.length(Vector3.subtract(goal, start)) < HumanMount.HOP * m.thigh;
  const climb: number =
    (settled
      ? HumanMount.SETTLE
      : Math.min(
          4,
          2 * (1 + 0.6 * Math.max(0, seated.ratio(body, seat, under) - 1)),
        )) * AutoMovieMotionManner(context, context.params.manner).tempo;
  const duration: number = climb + hold;
  const legged: ReturnType<typeof stand.prepareLegs> = stand.prepareLegs(
    body,
    yaw0,
  );
  const contact: number = 0.8 * climb;
  const hop: number = settled ? 0 : HumanMount.HOP * m.thigh;
  const crossing: readonly [number, number] = HumanMountOnFrame.crossing(
    climb,
    astride,
  );
  const course = (target: IAutoMovieVector3): ((t: number) => Frame) =>
    HumanMountOnFrame({
      body,
      seat,
      start,
      goal: target,
      climb,
      hop,
      yaw: yaw0,
      turn,
      final,
    });
  const nominal = course(goal);
  const end: Frame = nominal(climb);
  const seating =
    material === undefined
      ? undefined
      : prepareCoupledMount(body, material, { ...end, limbs: {} });
  const seatedKey = seating?.key;
  if (seating?.reason !== undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "footrests",
      value: seat.point ?? "seat",
      feasible: null,
      reason: seating.reason,
      fix: "use a seat and treads whose physical bearing areas fit this rider",
    });
  const placedFrame =
    seatedKey === undefined
      ? nominal
      : course(
          Vector3.add(goal, Vector3.subtract(seatedKey.posture.root, end.root)),
        );
  const pitchChange = (seatedKey?.posture.pitch ?? end.pitch) - end.pitch;
  const authoredFrame = (t: number): Frame => {
    const at = placedFrame(t);
    return pitchChange === 0
      ? at
      : { ...at, pitch: at.pitch + pitchChange * minimumJerk.share(t / climb) };
  };
  let frameAt = authoredFrame;
  const hipsAt = (t: number): Record<AutoMovieHumanSide, IAutoMovieVector3> => {
    const frame: Frame = frameAt(t);
    return hipJoints(
      body,
      frame.root,
      humanPostureHeading(frame),
      frame.joints.hips,
    );
  };

  // Where each foot ends: on its rest when the seated leg reaches it, on the floor when the hanging leg would pass it, hanging otherwise.
  const floor: Record<AutoMovieHumanSide, IAutoMovieVector3> = stand.feet(
    body,
    context.entry,
    yaw0,
  );
  const seatedHips: Record<AutoMovieHumanSide, IAutoMovieVector3> =
    hipsAt(climb);
  // The seated pelvis's pitch, which the hip's flexion to a rest is read off.
  const seatedPitch: number = frameAt(climb).pitch;
  const place = (side: AutoMovieHumanSide): HumanMountPlace.IPlace => {
    const held: IAutoMovieHumanLimbGoal | undefined = seatedKey?.feet[side];
    if (held !== undefined) {
      const rotation = held.rotation!;
      const forward = Quaternion.rotateVector(rotation, { x: 0, y: 0, z: 1 });
      return {
        foot: {
          ankle: held.point,
          bend: held.bend,
          yaw: Math.atan2(forward.x, forward.z) / Quaternion.DEG2RAD,
        },
        rests: true,
        tread: true,
        height:
          held.point.y + Quaternion.rotateVector(rotation, held.contact!).y,
      };
    }
    return HumanMountPlace(
      body,
      side,
      seatedHips[side],
      yaw1,
      seatedPitch,
      astride,
      seat.footrests?.[side],
      under,
    );
  };
  const places: Record<AutoMovieHumanSide, HumanMountPlace.IPlace> = {
    left: place("left"),
    right: place("right"),
  };

  // The leading foot, and when each foot leaves the floor and arrives.
  const lead: AutoMovieHumanSide =
    astride && HumanFrame.local({ origin: goal, yaw: seat.yaw }, start).x < 0
      ? "right"
      : "left";
  const push: AutoMovieHumanSide = lead === "left" ? "right" : "left";

  // A seat that is mounted from one side only refuses the other.
  if (
    astride &&
    seat.mount !== undefined &&
    seat.mount !== "either" &&
    seat.mount !== lead
  )
    throw new HumanRefusal({
      kind: "base",
      axis: "seat",
      value: lead,
      feasible: { kind: "alternatives", values: [seat.mount] },
      reason: `the performer stands on the seat's ${lead}, and this seat is mounted from its ${seat.mount}`,
      fix: `stand on the seat's ${seat.mount} side before sitting on it`,
    });
  const first = (
    from: number,
    to: number,
    found: (t: number) => boolean,
  ): number => {
    for (let t: number = from; t < to; t += 1 / 60) if (found(t)) return t;
    return to;
  };

  // A foot the entry already holds off the floor, on a rest, hanging or in flight, goes on from where it is, and one already on its rest stays there.
  const entry: IAutoMovieMotionHumanActionContext["entry"] = context.entry;
  const onFloor: Record<AutoMovieHumanSide, boolean> = {
    left: HumanMount.grounded(body, entry.feet.left),
    right: HumanMount.grounded(body, entry.feet.right),
  };
  const starts: Record<AutoMovieHumanSide, HumanMount.IFoot> = {
    left: HumanMount.held(entry, "left"),
    right: HumanMount.held(entry, "right"),
  };
  const stay = (side: AutoMovieHumanSide): boolean =>
    !onFloor[side] &&
    entry.feet[side].planted &&
    places[side].rests &&
    Vector3.length(
      Vector3.subtract(starts[side].ankle, places[side].foot.ankle),
    ) < HumanMount.ON;
  const stays: Record<AutoMovieHumanSide, boolean> = {
    left: stay("left"),
    right: stay("right"),
  };
  const longest: number = m.thigh + m.shank;
  const leadLeaves: number = onFloor[lead] ? 0.1 * climb : 0;
  const leadReady: number = 0.45 * climb;
  const nearCapture: number = crossing[0];
  const nearGoal: IAutoMovieHumanLimbGoal | undefined = seatedKey?.feet[lead];
  const transfer =
    !settled && astride && onFloor[push] && !stays[lead] && nearGoal !== undefined;
  // The far foot stays on its actual MTP as the rider first loads the near
  // tread. Both hips must share a feasible reach at that pose.
  const pushGround: IAutoMovieHumanLimbGoal | undefined = transfer
    ? legged(authoredFrame(0).root, floor)[`${push}Leg`]
    : undefined;
  if (transfer && pushGround !== undefined && nearGoal !== undefined) {
    const transferFrame = authoredFrame(nearCapture);
    const hips = hipJoints(
      body,
      transferFrame.root,
      humanPostureHeading(transferFrame),
      transferFrame.joints.hips,
    );
    const root = prepareMountTransfer(
      transferFrame.root,
      Vector3.add(
        transferFrame.root,
        Vector3.subtract(nearGoal.point, hips[lead]),
      ),
      Vector3.add(
        transferFrame.root,
        Vector3.subtract(pushGround.point, hips[push]),
      ),
      HumanMount.SWING_REACH * longest,
    );
    if (root === undefined)
      throw new HumanRefusal({
        kind: "reach",
        axis: "footrests",
        value: seat.point ?? "seat",
        reason: "the ground toe and near tread have no common reach",
        fix: "start closer to the tread or use a mounting step",
      });
    const captured: Frame = { ...transferFrame, root };
    const initial = authoredFrame(leadLeaves);
    const hipAt = (frame: Frame, side: AutoMovieHumanSide): IAutoMovieVector3 =>
      hipJoints(body, frame.root, humanPostureHeading(frame), frame.joints.hips)[
        side
      ];
    const pushStart = hipAt(initial, push);
    const pushEnd = hipAt(captured, push);
    frameAt = (t: number): Frame => {
      const nominal = authoredFrame(t);
      if (t <= leadLeaves || t >= climb) return nominal;
      if (t < nearCapture) {
        const hip = Vector3.lerp(
          pushStart,
          pushEnd,
          minimumJerk.share((t - leadLeaves) / (nearCapture - leadLeaves)),
        );
        return {
          ...nominal,
          root: Vector3.add(
            nominal.root,
            Vector3.subtract(hip, hipAt(nominal, push)),
          ),
        };
      }
      if (t <= leadReady) return captured;
      const share = minimumJerk.share((t - leadReady) / (contact - leadReady));
      const frame: Frame = {
        ...nominal,
        root: Vector3.lerp(captured.root, nominal.root, share),
        yaw: captured.yaw + AutoMovieEngineMath.wrapDegrees(nominal.yaw - captured.yaw) * share,
        pitch: captured.pitch + (nominal.pitch - captured.pitch) * share,
        roll: captured.roll + (nominal.roll - captured.roll) * share,
      };
      const hip = hipAt(frame, lead);
      const reachable = prepareMountTransfer.restrict(hip, nearGoal.point, longest);
      return { ...frame, root: Vector3.add(frame.root, Vector3.subtract(reachable, hip)) };
    };
  }
  // The pushing leg extends as it pushes: as the pelvis rises its knee straightens and its heel rolls up over the ball, by as much as the shank, in the knee's own plane, would bend the flat foot's ankle past what an unloaded ankle holds. The foot leaves when the extended leg's toes leave: when even the rolled foot's ankle is past the leg's reach, or the toes are extended as far as they go.
  const rolledAt = (t: number): HumanMountPush.IRoll =>
    pushGround === undefined
      ? HumanMountPush.roll(
          body,
          push,
          legged(frameAt(t).root, floor)[`${push}Leg`]!,
          hipsAt(t)[push],
          yaw0 + (push === "left" ? stand.TOE_OUT : -stand.TOE_OUT),
        )
      : {
          goal: pushGround,
          roll: 0,
          reach: Vector3.distance(pushGround.point, hipsAt(t)[push]),
        };
  const off: number = onFloor[push]
    ? transfer
      ? leadReady
      : first(0, astride ? 0.35 * climb : contact, (t: number): boolean => {
          const rolled: HumanMountPush.IRoll = rolledAt(t);
          return rolled.reach > longest || rolled.roll > HumanMount.TOE_ROLL;
        })
    : 0;
  // As the foot leaves the floor, read once.
  const leaving: HumanMountPush.IRoll | undefined = onFloor[push]
    ? rolledAt(off)
    : undefined;
  const left = (): HumanMountPush.IRoll => leaving!;
  const flight: Record<AutoMovieHumanSide, readonly [number, number]> = {
    left: [0, 0],
    right: [0, 0],
  };
  flight[lead] = [leadLeaves, transfer ? nearCapture : leadReady];
  // The far leg crosses a saddle's croup as the pelvis crosses onto it: a foot that crossed ahead of the pelvis would have to rise above its hip.
  flight[push] = [
    off,
    astride ? crossing[1] : Math.min(climb, off + 0.3 * climb),
  ];

  // Astride, the leading foot bears on its rest from its arrival: the body rises standing in the near stirrup while the far leg swings over (Geutjens, Clayton and Kaiser 2008). Any other foot bears once the seat has taken the body and the foot has arrived: before that the pelvis is still on its way, and nothing else holds that rest under it.
  const bears = (side: AutoMovieHumanSide): number =>
    stays[side]
      ? 0
      : astride && side === lead
        ? flight[side][1]
        : Math.max(contact, flight[side][1]);
  const bearing: Record<AutoMovieHumanSide, number> = {
    left: bears("left"),
    right: bears("right"),
  };
  const over: IAutoMovieVector3 = HumanFrame.point(
    { origin: goal, yaw: seat.yaw },
    {
      x: 0,
      y: HumanMount.OVER.above * m.thigh,
      z: -HumanMount.OVER.behind * m.thigh,
    },
  );

  // The seat bears from the contact, or from the start under a body already on it. The sitting is committed when the first foot leaves the floor: until then it can be abandoned for standing.
  const touch: number = settled ? 0 : contact;
  const commit: number = Math.min(
    onFloor.left ? flight.left[0] : 0,
    onFloor.right ? flight.right[0] : 0,
  );
  // The seat and its rests bear on the seat's carrier when it has one, and so move with it; the floor the feet leave stays the floor.
  const carried = (
    point?: string,
  ): IAutoMovieMotionHumanContactWindow.Support | undefined =>
    seat.carrier === undefined
      ? undefined
      : {
          kind: "prop",
          subject: seat.carrier,
          ...(point === undefined ? {} : { point }),
        };
  const contacts: IAutoMovieMotionHumanContactWindow[] = [
    {
      part: "seat",
      kind: "seat",
      from: touch / duration,
      to: 1,
      support: carried(material?.seat.affordance.id ?? seat.point) ?? {
        kind: "ground",
      },
    },
  ];
  for (const side of ["left", "right"] as const) {
    const part: PlanPart = `${side}Foot`;
    if (onFloor[side] && flight[side][0] > 0) {
      const plant: IAutoMovieMotionHumanContactWindow = {
        part,
        kind: "plant",
        from: 0,
        to: flight[side][0] / duration,
        support: { kind: "ground", height: under },
      };
      if (side === push && pushGround !== undefined) plant.socket = "ball";
      contacts.push(plant);
    }
    if (places[side].rests)
      contacts.push({
        part,
        kind: "plant",
        from: bearing[side] / duration,
        to: 1,
        // A foot rest bears at its own height, a stirrup's above the floor, under the ball the foot is placed on it by, on the carrier it hangs from when there is one.
        support: (places[side].tread
          ? carried(material?.treads[side].affordance.id ?? seat.footrestPoints?.[side])
          : undefined) ?? { kind: "ground", height: places[side].height },
        socket: seatedKey?.feet[side].contact ?? "ball",
      });
  }
  // A swinging leg's goal at an instant, before its toes turn down.
  const flown = HumanMountFlight({
    body,
    flight,
    frameAt,
    hipsAt,
    legged,
    floor,
    onFloor,
    starts,
    places,
    bearing,
    push,
    left,
    yaw: yaw0,
    astride,
    over,
  });
  // Each swinging foot's turn out of the knee's plane as it leaves and as it arrives, read once.
  const turnOf = (at: HumanMountFlight.IFlown): number =>
    HumanMountPush.twist(body, at.hip, at.goal)?.degrees ?? 0;
  const landsAt = (side: AutoMovieHumanSide): number =>
    places[side].rests
      ? Math.min(flight[side][1], bearing[side])
      : flight[side][1];
  const twists: Partial<Record<AutoMovieHumanSide, readonly [number, number]>> =
    {};
  for (const side of ["left", "right"] as const)
    if (!stays[side])
      twists[side] = [
        turnOf(flown(side, flight[side][0])),
        turnOf(flown(side, landsAt(side))),
      ];

  // The body over the climb with its legs' goals, before the hands.
  const lower = (
    t: number,
    without?: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanPosture => {
    const frame: Frame = frameAt(t);
    const standing: IAutoMovieMotionHumanPosture["limbs"] = legged(
      frame.root,
      floor,
    );
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
    const toes: IAutoMovieMotionHumanPosture["joints"] = {};
    for (const side of ["left", "right"] as const) {
      if (side === without) continue;
      const limb: PlanLowerLimb = `${side}Leg`;
      if (seatedKey !== undefined && t >= bearing[side]) {
        const goal = seatedKey.feet[side];
        // The terminal seed belongs to the hip on the seat. On the approach
        // the prepared climb course continues the leg on its actual branch.
        limbs[limb] = t < climb
          ? {
              point: goal.point,
              bend: goal.bend,
              rotation: goal.rotation!,
              contact: goal.contact!,
              planted: true,
            }
          : goal;
        const toe = `${side}Toes` as const;
        const turn = seatedKey.posture.joints[toe];
        if (turn !== undefined) toes[toe] = turn;
        continue;
      }
      if (stays[side]) {
        limbs[limb] = HumanMount.leg(body, side, places[side].foot, true);
        continue;
      }
      const planted: IAutoMovieHumanLimbGoal = standing[limb]!;
      const leaves: number = flight[side][0];
      if (onFloor[side] && t <= leaves) {
        if (side === push) {
          const rolled: HumanMountPush.IRoll = rolledAt(t);
          limbs[limb] = rolled.goal;
          toes[`${side}Toes`] = [rolled.roll, 0, 0];
        } else limbs[limb] = planted;
        continue;
      }
      const { share, hip, goal }: HumanMountFlight.IFlown = flown(side, t);
      // The foot's turn out of the knee's plane eases between its two ends, so the knee keeps its own side (`HumanMountPush.twist`). Once the foot is on its rest it keeps its own turn there.
      const landing: number = landsAt(side);
      const ends: readonly [number, number] = twists[side]!;
      // An empty swing is a step at its one instant.
      const eased: number =
        landing > leaves
          ? minimumJerk.share((t - leaves) / (landing - leaves))
          : t >= landing
            ? 1
            : 0;
      if (side === push && onFloor[side])
        toes[`${side}Toes`] = [left().roll * (1 - share), 0, 0];
      // A foot that bears nothing turns its toes down about its ball, so the ball, not the ankle, comes onto the rest; once on it the heel lowers about that ball as the seat takes the body, from its bearing to seated.
      const tipped = HumanMountPush.tip(
        body,
        side,
        hip,
        // The knee's plane is turned to hold the foot (`HumanMountTrack`).
        HumanMountTrack(
          body,
          hip,
          t < landing
            ? HumanMountPush.squared(
                body,
                hip,
                goal,
                ends[0] + AutoMovieEngineMath.wrapDegrees(ends[1] - ends[0]) * eased,
              )
            : goal,
        ),
        places[side].rests && t >= bearing[side]
          ? climb > bearing[side]
            ? 1 -
              minimumJerk.share((t - bearing[side]) / (climb - bearing[side]))
            : 0
          : 1,
      );
      if (transfer && side === lead && nearGoal?.rotation !== undefined) {
        // Land on the full admitted ankle and toe configuration. The
        // earlier flight's reach cap and heel tip do not own the hold.
        limbs[limb] = {
          ...tipped,
          point: Vector3.lerp(tipped.point, nearGoal.point, eased),
          bend: Vector3.lerp(tipped.bend, nearGoal.bend, eased),
          rotation: Quaternion.slerp(
            tipped.rotation ?? nearGoal.rotation,
            nearGoal.rotation,
            eased,
          ),
        };
        const toe = `${side}Toes` as const;
        const to = seatedKey?.posture.joints[toe];
        if (to !== undefined) {
          const from = frame.joints[toe] ?? [0, 0, 0];
          toes[toe] = [
            from[0] + (to[0] - from[0]) * eased,
            from[1] + (to[1] - from[1]) * eased,
            from[2] + (to[2] - from[2]) * eased,
          ];
        }
      } else limbs[limb] = tipped;
    }
    return { ...frame, joints: { ...frame.joints, ...toes }, limbs };
  };

  const swingOf = (side: AutoMovieHumanSide): HumanSwungLeg.Swing | null => {
    const leaves: number = flight[side][0];
    const lands: number = landsAt(side);
    return !stays[side] && lands > leaves ? [leaves, lands] : null;
  };
  // The far foot leaves the ground on its world path. The hip can lose its
  // connected swivel interval during the later crossing over the saddle.
  const flying: HumanSwungLeg.Swing | null =
    astride && onFloor[push] && places[push].tread ? swingOf(push) : null;
  // Begin the keyed crossing once the leading stirrup bears the rider.
  const crossingSwing: HumanSwungLeg.Swing | null =
    flying === null
      ? null
      : [
          Math.max(
            flying[0],
            crossing[0],
            places[lead].tread ? bearing[lead] : 0,
          ),
          flying[1],
        ];
  const freeCrossing = (t: number): boolean =>
    crossingSwing !== null && t > crossingSwing[0] && t < crossingSwing[1];
  const carry: sitCarried.Pose = sitCarried.prepare(
    context,
    seat,
    duration,
    contacts,
  );
  const materialReader: IAutoMovieMotionHumanPropReader | undefined =
    material === undefined ? undefined : context.prop(material.subject);
  const placed = (
    t: number,
    without?: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanPosture => carry(lower(t, without), t);
  // Establish the far foot's first supported branch on its own tread.
  const landing: number | undefined = crossingSwing?.[1];
  const far: PlanLowerLimb = `${push}Leg`;
  const seed: IAutoMovieSwivelSeed | null | undefined =
    landing === undefined
      ? undefined
      : resolveHumanPosture.seeded(body, placed(landing, lead)).seeds[far];
  const support = (t: number): IAutoMovieMotionHumanPosture => {
    const posture: IAutoMovieMotionHumanPosture = placed(
      t,
      freeCrossing(t) ? push : undefined,
    );
    const goal: IAutoMovieHumanLimbGoal | undefined = posture.limbs[far];
    if (
      seatedKey === undefined &&
      t === landing &&
      seed !== undefined &&
      seed !== null &&
      goal !== undefined
    )
      posture.limbs[far] = { ...goal, seed };
    return posture;
  };

  // Prepare the leg course and the palm geometry before laying the arms on
  // the displayed thighs.
  const palms: ReturnType<typeof prepareSeatedPalms> = prepareSeatedPalms(
    body,
    context.entry.posture,
  );
  const legs: courseHumanLegs.Seeded = courseHumanLegs({
    body,
    posture: support,
    span: { start: 0, end: duration },
    instants: [
      commit,
      touch,
      climb,
      ...flight.left,
      ...flight.right,
      ...(crossingSwing ?? []),
    ],
    entry: context.entry.pose,
  });
  const localHeld: IAutoMovieRigidTransform | undefined =
    seatedKey === undefined || material === undefined
      ? undefined
      : HumanPropFrame.relative(material.seat.frame, {
          position: seatedKey.posture.root,
          rotation: humanPostureHeading(seatedKey.posture),
        });
  const held =
    seatedKey === undefined
      ? undefined
      : {
          ...seatedKey.posture,
          limbs: {
            leftLeg: seatedKey.feet.left,
            rightLeg: seatedKey.feet.right,
          },
        };
  const settledAt = (t: number): IAutoMovieMotionHumanPosture => {
    const posture = carry(held!, t);
    const site: IAutoMovieRigidTransform | undefined = materialReader?.site?.(
      material!.seat.affordance.id,
      context.start + t,
    );
    if (site === undefined || localHeld === undefined) return posture;
    const carried: IAutoMovieRigidTransform = HumanPropFrame.compose(
      site,
      localHeld,
    );
    return {
      ...posture,
      root: carried.position,
      ...humanPostureHeading.angles(carried.rotation),
    };
  };
  const supported = (t: number): IAutoMovieMotionHumanPosture =>
    seatedKey !== undefined && t >= climb ? settledAt(t) : legs(support(t), t);
  const keys: HumanSwungLeg.IKeys | null =
    crossingSwing === null
      ? null
      : HumanSwungLeg.anchored(
          body,
          push,
          crossingSwing,
          supported,
          placed((crossingSwing[0] + crossingSwing[1]) / 2, lead),
        );
  const mounted: IAutoMovieMotionHumanActionPlan = {
    duration,
    events: [
      { name: "commit", share: commit / duration },
      { name: "seatContact", share: touch / duration },
      { name: "seated", share: climb / duration },
    ],
    contacts,
    contact: touch,
    base: { kind: "seated", seat },
    posture: (seconds: number): IAutoMovieMotionHumanPosture => {
      const t: number = Math.min(duration, Math.max(0, seconds));
      const posture: IAutoMovieMotionHumanPosture = supported(t);
      if (keys === null || !freeCrossing(t)) return posture;
      return {
        ...posture,
        joints: {
          ...posture.joints,
          ...HumanSwungLeg.at(
            body,
            keys,
            minimumJerk.share((t - keys.start) / (keys.end - keys.start)),
          ),
        },
      };
    },
  };

  // The swung legs and the hands are laid as courses over the climb (`HumanMountOnCourses`).
  return HumanMountOnCourses({
    body,
    plan: mounted,
    pose: context.entry.pose,
    palms,
    climb,
    duration,
    ...(seatedKey === undefined ? {} : { materialSeat: true }),
    ...(keys === null ? {} : { crossing: { side: push, landing: keys.end } }),
    swing: (side: AutoMovieHumanSide): HumanSwungLeg.Swing | null =>
      side === push && keys !== null ? null : swingOf(side),
  });
}
