import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineMotionSampling, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanHeld } from "../../compose/internal/AutoMovieMotionHumanHeld";
import { courseArmGoal } from "../../compose/internal/courseArmGoal";
import { HumanPropFrame } from "../../perform/internal/HumanPropFrame";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { wardrobeFootRaisedLeg } from "./wardrobeFootRaisedLeg";
import { wardrobeHands } from "./wardrobeHands";

/*
 * Stage seated shoe or sock transfer with one foot raised and the other
 * grounded.
 *
 * The seat and opposite foot carry the body while the working foot rises. The
 * thigh and lower leg lift while the spine leans over the working foot. The
 * five distinct phases recorded in the seated shoe study include raising a leg
 * and inserting the foot (Jin et al., Table 2,
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC6451954/). The slow hand phase here
 * is an authored stage timing.
 * Parameter context: The live entry and held or worn footwear.
 * Parameter side: The foot that enters or leaves the footwear.
 * Parameter hand: The hand that holds the prop.
 * Parameter remove: Whether to take it off instead of putting it on.
 * Returns: A seated performance with an actual aperture crossing and custody
 * transfer.
 * For a failed seat, reach, identity or fit.
 */
export function wardrobeFoot(
  context: IAutoMovieMotionHumanActionContext<wardrobeHands.IPropParams>,
  side: AutoMovieHumanSide,
  hand: AutoMovieHumanSide,
  remove: boolean,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry, params }: typeof context = context;
  if (remove && entry.holds[hand] !== undefined)
    throw wardrobeHands.refusal(
      "hand",
      hand,
      "clear the hand that removes the footwear",
    );
  const base: IAutoMovieMotionHumanActionPlan = wardrobeFootRaisedLeg(
    context,
    side,
  );
  const holdStart: number = event(base, "footRaised");
  const holdEnd: number = event(base, "footLowering");
  const hold: number = holdEnd - holdStart;
  const gripTime: number = holdStart + hold * 0.24;
  const passTime: number = holdStart + hold * 0.49;
  const finish: number = holdStart + hold * 0.7;
  const atWork: IAutoMovieMotionHumanPosture = base.posture(
    holdStart + hold / 2,
  );
  const reader: IAutoMovieMotionHumanPropReader = context.prop(params.prop);
  const opening: IAutoMovieAffordance = wardrobeHands.site(
    reader.prop,
    "opening",
    "aperture",
  );
  wardrobeHands.middle(opening);
  const wear: IAutoMovieAffordance = wardrobeHands.site(
    reader.prop,
    "wear",
    "socket",
  );
  const grip: IAutoMovieAffordance = wardrobeHands.site(
    reader.prop,
    "hold",
    "handle",
  );
  const foot: AutoMovieHumanoidBone =
    side === "left" ? "leftFoot" : "rightFoot";
  const own: IAutoMovieRigidTransform = footFrame(body, atWork, side);
  if (
    !(opening.height! >= body.measure.footLength + AIR) ||
    !(opening.width! >= body.measure.footBreadth + AIR / 2)
  )
    throw wardrobeHands.refusal(
      "opening",
      params.prop,
      "the footwear opening cannot clear the selected foot",
    );
  const seated: IAutoMovieRigidTransform = HumanPropFrame.parent(
    own,
    wardrobeHands.frame(wear),
  );
  const up: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(seated.rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  const depth: number = AutoMovieEngineVector3.dot(
    AutoMovieEngineVector3.subtract(
      wardrobeHands.middle(opening).position,
      wear.frame.translation,
    ),
    { x: 0, y: 1, z: 0 },
  );
  if (!(depth > 0))
    throw wardrobeHands.refusal(
      "opening",
      opening.id,
      "the heel seat must lie below the actual opening",
    );
  const aligned: IAutoMovieRigidTransform = wardrobeHands.displaced(
    seated,
    AutoMovieEngineVector3.scale(up, -depth),
  );
  const outside: IAutoMovieRigidTransform = wardrobeHands.displaced(
    aligned,
    AutoMovieEngineVector3.scale(up, -AIR),
  );
  const resting: IAutoMovieRigidTransform = wardrobeHands.grip(
    body,
    atWork,
    hand,
  );
  const picked: IAutoMovieMotionHumanHeld.IHeld | undefined = remove
    ? undefined
    : AutoMovieMotionHumanHeld(context, hand, params.prop);

  // A worn foot determines the approach frame without asking the hand that will take over.
  const worn: IAutoMovieRigidTransform = remove
    ? HumanPropFrame.compose(
        wardrobeHands.bone(body, atWork, foot),
        HumanPropFrame.relative(
          wardrobeHands.bone(body, entry.posture, foot),
          reader.frame(context.start - 1e-6),
        ),
      )
    : seated;
  if (
    remove &&
    (AutoMovieEngineVector3.distance(worn.position, seated.position) > wardrobeHands.MISS ||
      AutoMovieEngineQuaternion.angle(worn.rotation, seated.rotation) > Math.PI / 12)
  )
    throw wardrobeHands.refusal(
      "opening",
      params.prop,
      "the named prop is not fitted to the selected foot",
    );
  const removalGrip: IAutoMovieRigidTransform = gripFrame(worn, grip, hand);
  const caught: IAutoMovieRigidTransform = wardrobeHands.grip(
    body,
    wardrobeHands.arm(body, atWork, hand, removalGrip),
    hand,
  );
  const offset: IAutoMovieRigidTransform =
    picked?.frame ?? HumanPropFrame.relative(caught, worn);
  const fit: (goal: IAutoMovieRigidTransform) => IAutoMovieRigidTransform = (
    goal: IAutoMovieRigidTransform,
  ): IAutoMovieRigidTransform => HumanPropFrame.parent(goal, offset);
  const taking: IAutoMovieRigidTransform = remove ? removalGrip : fit(outside);
  const crossing: IAutoMovieRigidTransform = fit(aligned);
  const terminal: IAutoMovieRigidTransform = fit(remove ? outside : seated);
  const target: (seconds: number) => IAutoMovieRigidTransform = (
    seconds: number,
  ): IAutoMovieRigidTransform => {
    if (seconds <= gripTime)
      return wardrobeHands.path(
        resting,
        taking,
        (seconds - holdStart) / (gripTime - holdStart),
      );
    if (seconds <= passTime)
      return wardrobeHands.path(
        taking,
        crossing,
        (seconds - gripTime) / (passTime - gripTime),
      );
    if (seconds <= finish)
      return wardrobeHands.path(
        crossing,
        terminal,
        (seconds - passTime) / (finish - passTime),
      );
    return wardrobeHands.path(
      terminal,
      resting,
      (seconds - finish) / (holdEnd - finish),
    );
  };
  // A demand that leaves the arm out (`courseArmGoal`, the arm on its
  // course) takes no goal of it (`wardrobeHands.arm`).
  const posture: (
    seconds: number,
    channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
  ) => IAutoMovieMotionHumanPosture = (
    seconds: number,
    channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
  ): IAutoMovieMotionHumanPosture => {
    const support: IAutoMovieMotionHumanPosture = base.posture(seconds);
    return seconds < holdStart || seconds > holdEnd
      ? support
      : wardrobeHands.arm(body, support, hand, target(seconds), channels);
  };
  for (const at of [gripTime, passTime, finish])
    wardrobeHands.verify(
      context,
      posture(at),
      hand,
      target(at),
      wardrobeHands.MISS,
    );
  const from: number = remove ? gripTime : 0;
  const to: number = remove ? base.duration : finish;

  // The coursed plan, whose posture is the hand the performance shows: the
  // shell's custody reads that hand, so the shown shell lands on its target
  // whatever branch or swivel the course took. Set once the course is laid.
  const course: ICourse = {};
  const held: (seconds: number) => IAutoMovieMotionHumanPosture = (
    seconds: number,
  ): IAutoMovieMotionHumanPosture =>
    course.shown === undefined
      ? posture(seconds)
      : course.shown.posture(seconds);
  const contact: IAutoMovieMotionHumanContactWindow = {
    ...wardrobeHands.contact(
      params.prop,
      hand,
      from / base.duration,
      to / base.duration,
    ),
    // The small round pull can roll and slide in the fingers as the shell
    // aligns to the foot. Once aligned the shell lies on its own admitted
    // frame, its attitude and its place, not on where the fitted hand lands
    // within its 10 mm, so the passage keeps the opening square to the foot
    // and the worn offset taken at `finish` is the seated frame itself.
    inHand: (
      share: number,
      grip?: IAutoMovieRigidTransform,
    ): IAutoMovieRigidTransform => {
      const time: number = from + share * (to - from);
      const at: number = Math.min(time, finish);
      const rollStart: number = remove ? gripTime : holdStart;
      const rollEnd: number = remove ? passTime : gripTime;
      const fraction: number = (at - rollStart) / (rollEnd - rollStart);
      if (!(fraction > 0))
        return wardrobeHands.roll(
          body,
          entry.posture,
          hand,
          target(at),
          fraction,
        );
      const full: IAutoMovieRigidTransform = HumanPropFrame.relative(
        (at === time ? grip : undefined) ??
          wardrobeHands.grip(body, held(at), hand),
        target(at),
      );
      const u: number = AutoMovieEngineMotionSampling.minimumJerkShare(fraction);
      return {
        position: AutoMovieEngineVector3.scale(full.position, u),
        rotation: AutoMovieEngineQuaternion.slerp(
          { x: 0, y: 0, z: 0, w: 1 },
          full.rotation,
          u,
        ),
      };
    },
  };
  // The hand is laid as one course over its target (`courseArmGoal`): the
  // planner's reach to the footwear, the passage read at every second with
  // branch and swivel continuity, and the planner's return, in place of a
  // fresh fit at each second, whose seeded display could take another
  // forearm twist than the fit the shell's custody reads. The checks above
  // read the goal.
  const shown: IAutoMovieMotionHumanActionPlan = courseArmGoal({
    context,
    side: hand,
    rest: AutoMovieMotionHumanArm.angles(entry.pose, hand),
    span: { start: holdStart, ready: gripTime, relax: finish, end: holdEnd },
    plan: {
      ...base,
      events: [
        ...base.events,
        { name: "footwearReady", share: gripTime / base.duration },
        { name: "footwearOpening", share: passTime / base.duration },
        {
          name: remove ? "footwearClear" : "footwearWorn",
          share: finish / base.duration,
        },
        { name: "relax", share: 1 },
      ],
      contacts: [...base.contacts, contact],
      hands: [hand],
      ...(remove
        ? {
            holds: [
              { prop: params.prop, side: hand, from: gripTime / base.duration },
            ],
          }
        : {
            wears: [
              { prop: params.prop, bone: foot, from: finish / base.duration },
            ],
          }),
      posture,
    },
  });
  course.shown = shown;
  return shown;
}

/*
 * Positive axial clearance at either end of a visible hand-foot exchange.
 */
const AIR: number = 0.025;

/*
 * The coursed plan once it is laid, read by the shell's custody through the
 * hand it shows.
 */
interface ICourse {
  /*
   * The coursed plan; absent until the course is laid.
   */
  shown?: IAutoMovieMotionHumanActionPlan;
}

/*
 * Find an actual phase boundary in seconds.
 */
function event(plan: IAutoMovieMotionHumanActionPlan, name: string): number {
  return (
    plan.events.find(
      (key: IAutoMovieMotionEvent): boolean => key.name === name,
    )!.share * plan.duration
  );
}

/*
 * Construct the actual heel-based foot frame held during the seated lift: the
 * heel, its forward axis toward the ball and its across axis from the ankle,
 * all rigid on the foot bone.
 */
function footFrame(
  body: IAutoMovieMotionHumanActionContext["body"],
  posture: IAutoMovieMotionHumanPosture,
  side: AutoMovieHumanSide,
): IAutoMovieRigidTransform {
  const bones: ReturnType<typeof poseBones> = poseBones(
    body,
    resolveHumanPosture(body, posture),
  );
  // The heel and the ball both ride the foot bone (the toe socket rides the
  // toes, whose joint differs from one seating to the next), so the frame is
  // rigid on the foot: footwear worn on the foot bone keeps it whatever the
  // toes do, and a removal finds the shoe where it was put on.
  const [heel, ball]: ReturnType<typeof HumanFoot.sockets> = HumanFoot.sockets(
    body,
    bones,
    side,
  );
  const ankle: IAutoMovieVector3 = bones.get(
    side === "left" ? "leftFoot" : "rightFoot",
  )!.worldPosition;
  const forward: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
    AutoMovieEngineVector3.subtract(ball!.point, heel!.point),
  );
  const across: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
    AutoMovieEngineVector3.cross(AutoMovieEngineVector3.subtract(ankle, heel!.point), forward),
  );
  const up: IAutoMovieVector3 = AutoMovieEngineVector3.cross(forward, across);
  return {
    position: heel!.point,
    rotation: AutoMovieEngineMath.quaternionFromBasis(across, up, forward),
  };
}

/*
 * At removal, align the hand across the rear pull while it still rides the
 * foot.
 */
function gripFrame(
  prop: IAutoMovieRigidTransform,
  hold: IAutoMovieAffordance,
  hand: AutoMovieHumanSide,
): IAutoMovieRigidTransform {
  const world: IAutoMovieRigidTransform = HumanPropFrame.compose(
    prop,
    wardrobeHands.frame(hold),
  );
  const axis: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(world.rotation, {
    x: 1,
    y: 0,
    z: 0,
  });
  const normal: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(world.rotation, {
    x: 0,
    y: -1,
    z: 0,
  });
  return {
    position: world.position,
    rotation: HumanHand.rotation(hand, { fingers: axis, palm: normal }),
  };
}
