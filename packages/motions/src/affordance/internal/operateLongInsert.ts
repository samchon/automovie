import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanChannel,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanOperate,
  IAutoMovieMotionHumanOperateInsert,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "../../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTiming } from "../../compose/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../../compose/composeAutoMovieMotionHumanAction";
import { HumanGrasp } from "../../handling/HumanGrasp";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFrame } from "../../posture/HumanFrame";
import { HumanHand } from "../../posture/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { operateInsert } from "./operateInsert";
import type { operateInsertRoute } from "./operateInsertRoute";
import { operateLongInsertCourse } from "./operateLongInsertCourse";
import { operateLongInsertStaff } from "./operateLongInsertStaff";
import { operateLongInsertStep } from "./operateLongInsertStep";

/**
 * A staff driven down a bore deeper than one grip reaches, `operate`'s
 * long-insert mode: a sponge or a rammer down a gun's bore, as a gun crew's No.
 * 1 slides his hands along the staff and steps in toward the muzzle.
 *
 * The course is `operateLongInsertCourse`'s: the carrying hand presents the
 * working point at the mouth, then cycles drive the staff in with both hands,
 * slide the steadying hand and then the carrying hand back along the staff, and
 * step the body along the bore's line where the stance runs out; withdrawn, the
 * same cycles draw it out and the carrying hand returns to the place it took
 * the staff by. Both hands keep their attitude on the staff's line throughout,
 * so each moves only along the bore's axis: the carrying hand's from the
 * insertion's own grip at the presentation (`operateInsert`), the steadying
 * hand's a power grip on the line from its shoulder's side (`HumanGrasp.hand`).
 * The staff is carried by the hand that held it at entry the whole time; as
 * that hand slides along it the staff moves in the hand by the same amount (the
 * grip's in-hand motion, `IAutoMovieMotionHumanContactWindow.inHand`), so it
 * stays still in the world while the other hand steadies it. Each step is the
 * walk law's own plan from the stance it leaves, spliced in with the arms
 * overlaid.
 *
 * A stroke runs at `pace`, a slide in the aimed movement time over its length
 * (McIntosh et al. 2018), a step for its walk. Refused: a staff with no
 * grippable run along its line, a long insertion left in the bore (it would
 * leave the carrying hand off its grip), and whatever the course refuses.
 *
 * @param context The operation's context, its mechanism's depth resolved.
 * @param props The hand, the held staff, the socket and the timing.
 * @returns The plan.
 * @throws {HumanRefusal} As stated.
 */
export function operateLongInsert(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanOperate.IParams>,
  props: operateLongInsert.IProps,
): IAutoMovieMotionHumanActionPlan {
  const body: IAutoMovieMotionHumanBody = context.body;
  const mechanism: IAutoMovieMotionHumanOperateInsert.IMechanism =
    props.mechanism;
  if (mechanism.withdraw !== true)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "mechanism.withdraw",
      value: false,
      feasible: null,
      reason:
        "a staff driven deeper than one grip reaches is regripped along its length, and left in the bore it would leave the carrying hand off the grip it took",
      fix: "draw it back out (withdraw), or insert no deeper than the grip reaches",
    });
  const A: AutoMovieHumanSide = props.side;
  const B: AutoMovieHumanSide = A === "left" ? "right" : "left";
  const tool: IAutoMovieMotionHumanStrikingHeld.ITool = props.tool;
  const n: IAutoMovieVector3 = Vector3.normalize(props.socket.normal);
  const inward: IAutoMovieVector3 = Vector3.scale(n, -1);
  const at: (u: number) => IAutoMovieVector3 = (u: number): IAutoMovieVector3 =>
    Vector3.add(props.socket.point, Vector3.scale(n, u));
  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(body, context.entry.pose);
  const yaw: number = context.entry.posture.yaw;
  const level: IAutoMovieVector3 = { x: inward.x, y: 0, z: inward.z };
  const toward: IAutoMovieVector3 =
    Vector3.length(level) > 1e-6
      ? Vector3.normalize(level)
      : HumanFrame.forward(yaw);
  const breadth: number = operateLongInsert.BREADTH * body.measure.hand;
  const run: operateLongInsertStaff.IRun = operateLongInsertStaff(
    context,
    mechanism,
  );
  // The hands' attitudes on the staff's line: the carrying hand's at the
  // presentation, the steadying hand's a power grip from its side (its
  // approach, square to the bore's line from its shoulder, is the same
  // wherever along the line it holds).
  const presentation: IAutoMovieMotionHumanArmTarget.ITarget = operateInsert
    .prepareMoving(context, mechanism, tool, props.socket)
    .target(context.entry.posture, 0);
  const shoulderA: IAutoMovieVector3 = bones.get(`${A}UpperArm`)!.worldPosition;
  const shoulderB: IAutoMovieVector3 = bones.get(`${B}UpperArm`)!.worldPosition;
  const offB: IAutoMovieVector3 = Vector3.subtract(at(0), shoulderB);
  const approach: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(offB, Vector3.scale(n, Vector3.dot(offB, n))),
  );
  const turnB: IAutoMovieQuaternion = HumanGrasp.hand(body, B, {
    point: at(0),
    approach,
    axis: inward,
    width: run.width,
  }).rotation;
  // Each wrist lies a fixed offset behind its grip on the line, the grip's
  // own offset in the hand turned by the hand's fixed attitude; the arm's
  // reach bounds the wrist, so each grip reaches the line as from its
  // shoulder moved on by that offset.
  const wrist: (
    side: AutoMovieHumanSide,
    turn: IAutoMovieQuaternion,
  ) => IAutoMovieVector3 = (
    side: AutoMovieHumanSide,
    turn: IAutoMovieQuaternion,
  ): IAutoMovieVector3 =>
    Quaternion.rotateVector(
      turn,
      HumanHand.offset(body, side, "grip", "relaxed").point,
    );
  const course: operateLongInsertCourse.IResult = operateLongInsertCourse({
    mouth: props.socket.point,
    normal: n,
    shoulders: {
      A: Vector3.add(shoulderA, wrist(A, presentation.rotation)),
      B: Vector3.add(shoulderB, wrist(B, turnB)),
    },
    step: toward,
    reach: props.reach * (body.measure.upperArm + body.measure.forearm),
    grip: tool.length,
    shaft: run,
    clear: breadth / 2,
    gap: breadth,
    depth: mechanism.depth!,
    withdraw: true,
  });
  // Each step's walk, from the entry for the first, then from the legs the
  // walk before it ended on, read once per walk (`operateLongInsertStep`).
  const ended: Map<
    IAutoMovieMotionHumanActionPlan,
    IAutoMovieMotionHumanPosture
  > = new Map();
  let last: IAutoMovieMotionHumanPosture | undefined;
  const stepped: (
    from: number,
    to: number,
  ) => IAutoMovieMotionHumanActionPlan = (
    from: number,
    to: number,
  ): IAutoMovieMotionHumanActionPlan => {
    const walk: IAutoMovieMotionHumanActionPlan = operateLongInsertStep(
      context,
      toward,
      from,
      to,
      last,
    );
    ended.set(walk, (last = walk.posture(walk.duration)));
    return walk;
  };

  // The phases' lengths: a stroke at the pace, a slide in its aimed time, a
  // step for its walk; the first stance, when it is not the entry's, is
  // stepped to before the hands present the staff.
  const opening: IAutoMovieMotionHumanActionPlan | undefined =
    Math.abs(course.presented.x) > 1e-6
      ? stepped(0, course.presented.x)
      : undefined;
  const walks: (IAutoMovieMotionHumanActionPlan | undefined)[] =
    course.segments.map(
      (
        s: operateLongInsertCourse.ISegment,
      ): IAutoMovieMotionHumanActionPlan | undefined =>
        s.kind === "step" ? stepped(s.from.x, s.to.x) : undefined,
    );
  const lengths: number[] = course.segments.map(
    (s: operateLongInsertCourse.ISegment, k: number): number => {
      if (s.kind === "step") return walks[k]!.duration;
      if (s.kind === "push" || s.kind === "pull")
        return Math.abs(s.to.uA - s.from.uA) / props.pace;
      const travel: number =
        s.kind === "slideA"
          ? Math.abs(s.to.uA - s.from.uA)
          : Math.abs(s.to.uB - s.from.uB);
      return AutoMovieMotionHumanTiming.aimed(travel, props.width);
    },
  );
  const held: IAutoMovieResolvedBone = bones.get(`${A}Hand`)!;
  const entrySocket: IAutoMovieVector3 = Vector3.add(
    held.worldPosition,
    Quaternion.rotateVector(
      held.worldRotation,
      HumanHand.offset(body, A, "grip").point,
    ),
  );
  const reaching: number = AutoMovieMotionHumanTiming.aimed(
    Vector3.distance(entrySocket, presentation.point),
    props.width,
  );
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.phrase({
    prepare: (opening?.duration ?? 0) + reaching,
    wait: AutoMovieMotionHumanTiming.PAUSES.brief,
    attack: lengths.reduce((a: number, b: number): number => a + b, 0),
    hold: AutoMovieMotionHumanTiming.PAUSES.brief,
    retract: reaching,
  });
  const duration: number = clock.duration;
  const begin: number = clock.at("strokeStart");
  const starts: number[] = [];
  lengths.reduce((t: number, d: number): number => {
    starts.push(t);
    return t + d;
  }, begin);

  // The state at a second: the segment it lies in, eased between its ends.
  const state: (seconds: number) => operateLongInsertCourse.IState = (
    seconds: number,
  ): operateLongInsertCourse.IState => {
    let s: operateLongInsertCourse.IState = course.presented;
    for (let k: number = 0; k < course.segments.length; ++k) {
      const seg: operateLongInsertCourse.ISegment = course.segments[k]!;
      if (seconds < starts[k]!) return s;
      const u: number = AutoMovieEngineMotionSampling.minimumJerkShare(
        Math.min(1, (seconds - starts[k]!) / Math.max(lengths[k]!, 1e-9)),
      );
      if (seconds < starts[k]! + lengths[k]!)
        return {
          x: seg.from.x + (seg.to.x - seg.from.x) * u,
          uA: seg.from.uA + (seg.to.uA - seg.from.uA) * u,
          uB: seg.from.uB + (seg.to.uB - seg.from.uB) * u,
          slide: seg.from.slide + (seg.to.slide - seg.from.slide) * u,
        };
      s = seg.to;
    }
    return s;
  };

  // The base: standing at each stance, each step its walk.
  const windows: operateLongInsert.IWindow[] = [
    ...(opening === undefined
      ? []
      : [{ from: 0, plan: opening, to: course.presented.x }]),
    ...course.segments.flatMap(
      (
        s: operateLongInsertCourse.ISegment,
        k: number,
      ): operateLongInsert.IWindow[] =>
        s.kind === "step"
          ? [{ from: starts[k]!, plan: walks[k]!, to: s.to.x }]
          : [],
    ),
  ];
  // Standing between the steps: where the last finished walk ended.
  const stood: (seconds: number) => IAutoMovieMotionHumanPosture = (
    seconds: number,
  ): IAutoMovieMotionHumanPosture => {
    let done: operateLongInsert.IWindow | undefined;
    for (const w of windows) if (seconds >= w.from + w.plan.duration) done = w;
    return operateLongInsertStep.standing(
      context.entry.posture,
      toward,
      done?.to ?? 0,
      done === undefined ? undefined : ended.get(done.plan),
    );
  };
  // The feet stand on the entry's supports between the steps, and on each
  // walk's own windows through it.
  const stands: IAutoMovieMotionHumanContactWindow[] = [];
  const standing: (from: number, to: number) => void = (
    from: number,
    to: number,
  ): void => {
    if (to > from)
      for (const s of context.entry.supports)
        stands.push({ ...s, from: from / duration, to: to / duration });
  };
  let open: number = 0;
  for (const w of windows) {
    standing(open, w.from);
    for (const c of w.plan.contacts)
      stands.push({
        ...c,
        from: (w.from + c.from * w.plan.duration) / duration,
        to: (w.from + c.to * w.plan.duration) / duration,
      });
    open = w.from + w.plan.duration;
  }
  standing(open, duration);
  // The hands keep the grips they entered with through each step's walk.
  const gripping: IAutoMovieMotionHumanPosture["joints"] =
    operateLongInsertStep.grips(context.entry.posture);
  const base: IAutoMovieMotionHumanActionPlan = {
    duration,
    events: [],
    contacts: stands,
    posture: (
      seconds: number,
      channels?: readonly AutoMovieMotionHumanChannel[],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture => {
      for (const w of windows)
        if (seconds >= w.from && seconds < w.from + w.plan.duration) {
          const walked: IAutoMovieMotionHumanPosture = w.plan.posture(
            seconds - w.from,
            channels,
            resolution,
            projection,
          );
          return { ...walked, joints: { ...walked.joints, ...gripping } };
        }
      return stood(seconds);
    },
  };

  // The two arms, each translating along the axis with its fixed attitude.
  const ready: number = clock.at("ready");
  const relax: number = clock.at("relax");
  const arm: (
    side: AutoMovieHumanSide,
    goal: (seconds: number) => IAutoMovieMotionHumanArmTarget.ITarget,
  ) => IAutoMovieMotionHumanPrimitive = (
    side: AutoMovieHumanSide,
    goal: (seconds: number) => IAutoMovieMotionHumanArmTarget.ITarget,
  ): IAutoMovieMotionHumanPrimitive =>
    AutoMovieMotionHumanArm.carried({
      body,
      side,
      from: 0,
      to: duration,
      span: { start: 0, ready, relax, end: duration },
      rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
      // The hands carry the rigid staff, so a hand off its site moves the
      // insertion off its line by as much: the hand may land within half the
      // width the insertion is aimed at, the width its movement time reads.
      disc: props.width / 2,
      weight: (seconds: number): number =>
        clock.envelope(["start", "ready"], ["relax", "end"], seconds),
      goal: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieHumanLimbGoal =>
        AutoMovieMotionHumanArm.goal(body, side, {
          ...goal(seconds),
          bend: AutoMovieMotionHumanBend.hang(body, posture, side),
        }),
    });
  const carrying: IAutoMovieMotionHumanPrimitive = arm(
    A,
    (seconds: number): IAutoMovieMotionHumanArmTarget.ITarget => ({
      ...presentation,
      point: Vector3.add(
        presentation.point,
        Vector3.scale(n, state(seconds).uA - course.presented.uA),
      ),
    }),
  );
  const steadying: IAutoMovieMotionHumanPrimitive = arm(
    B,
    (seconds: number): IAutoMovieMotionHumanArmTarget.ITarget => ({
      surface: "grip",
      shape: "relaxed",
      point: at(state(seconds).uB),
      rotation: turnB,
      bend: { x: 0, y: 0, z: 0 },
    }),
  );
  // The steadying hand's bearing on the staff over a share of the act.
  const steadied: (
    from: number,
    to: number,
  ) => IAutoMovieMotionHumanContactWindow = (
    from: number,
    to: number,
  ): IAutoMovieMotionHumanContactWindow => ({
    part: `${B}Hand`,
    kind: "grip",
    from,
    to,
    support: { kind: "prop", subject: mechanism.prop, carries: false },
  });
  const composed: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base,
      clock,
      contact: "strokeEnd",
      primitives: [carrying, steadying],
    });
  // The carrying hand holds the staff throughout, the staff moving in it as
  // it slides; the steadying hand bears on it without carrying it wherever
  // it keeps its place on the staff, and lets go of it as it slides along.
  const along: IAutoMovieVector3 = tool.axis;
  const bears: IAutoMovieMotionHumanContactWindow[] = [];
  let since: number = ready;
  course.segments.forEach(
    (s: operateLongInsertCourse.ISegment, k: number): void => {
      if (s.kind !== "slideB") return;
      if (starts[k]! > since)
        bears.push(steadied(since / duration, starts[k]! / duration));
      since = starts[k]! + lengths[k]!;
    },
  );
  if (relax > since) bears.push(steadied(since / duration, relax / duration));
  return {
    ...composed,
    hands: [A, B],
    contacts: [
      ...composed.contacts,
      {
        part: `${A}Hand`,
        kind: "grip",
        from: 0,
        to: 1,
        support: { kind: "prop", subject: mechanism.prop },
        inHand: (share: number): IAutoMovieRigidTransform => ({
          position: Vector3.scale(along, state(share * duration).slide),
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        }),
      },
      ...bears,
    ],
  };
}

/** The inputs of {@link operateLongInsert} and the staff's run it reads. */
export namespace operateLongInsert {
  /**
   * A hand's breadth as a share of its length: a 2016 adult hand survey gives
   * P50 breadths of 86 and 80 mm against lengths of 188 and 177 mm for men and
   * women (https://pmc.ncbi.nlm.nih.gov/articles/PMC9225906/, read through a
   * search summary). The two hands hold a breadth apart on the staff, and the
   * leading hand stops half a breadth off the muzzle's face.
   */
  export const BREADTH: number = 0.45;

  /** What `operate` passes. */
  export interface IProps extends operateInsertRoute.IConstants {
    /** The insertion, its depth resolved. */
    mechanism: IAutoMovieMotionHumanOperateInsert.IMechanism;

    /** The hand that holds the staff. */
    side: AutoMovieHumanSide;

    /** The staff as that hand holds it. */
    tool: IAutoMovieMotionHumanStrikingHeld.ITool;

    /** The socket's mouth and outward normal, world. */
    socket: IAutoMovieMotionHumanOperateInsert.ITargetSocket;
  }

  /** A step window of the base. */
  export interface IWindow {
    /** Its first second. */
    from: number;

    /** Its walk. */
    plan: IAutoMovieMotionHumanActionPlan;

    /** The stance it reaches. */
    to: number;
  }
}
