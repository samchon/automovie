import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanHeld } from "../../compose/internal/AutoMovieMotionHumanHeld";
import { courseArmGoal } from "../../compose/internal/courseArmGoal";
import { HumanPropFrame } from "../../perform/internal/HumanPropFrame";
import { wardrobeFoot } from "./wardrobeFoot";
import { wardrobeHands } from "./wardrobeHands";
import type { wardrobeModes } from "./wardrobeModes";
import { wardrobeSleeve } from "./wardrobeSleeve";

/**
 * Put coarse stage wearables onto or take them off a real performer.
 *
 * A previously held open-front jacket is carried into position while the other
 * hand passes into its named sleeve. It transfers from the grasping hand to the
 * chest. The remaining sleeve can be threaded, and either sleeve can be
 * cleared, with the pose on that same jacket. The zip moves with the hand on
 * its actual slider. Its travel is retained by the native prop drive. The
 * seated footwear modes reuse a chair and an opposite foot plant while
 * transferring the shell onto or out of the raised foot.
 *
 * Clegg et al. describe independent alignment and sleeve passage phases in
 * Animating Human Dressing (2015),
 * https://sites.cc.gatech.edu/gvu/people/faculty/greg.turk/paper_pages/2015_animating_human_dressing/index.html.
 * The jacket here uses explicit short openings and imposes staged rigid poses.
 */
export const wardrobe: IAutoMovieMotionHumanActionLaw<Params> = {
  name: "wardrobe",
  interrupts: {
    any: [{ window: ["relax", 1], kind: "inertialize", entry: 0 }],
  },
  accepts: {
    sit: [{ window: ["seated", 1], kind: "inertialize", entry: 0 }],
    pickUp: [
      { window: ["lifted", 1], kind: "inertialize", entry: 0, keep: ["grip"] },
    ],
  },
  plan: planWardrobe,
};

/** The installed wardrobe actions and their requested direction and side. */
type Params = wardrobeModes.Params;

/**
 * Put coarse stage wearables onto or take them off a real performer.
 *
 * A previously held open-front jacket is carried into position while the other
 * hand passes into its named sleeve. It transfers from the grasping hand to the
 * chest. The remaining sleeve can be threaded, and either sleeve can be
 * cleared, with the pose on that same jacket. The zip moves with the hand on
 * its actual slider. Its travel is retained by the native prop drive. The
 * seated footwear modes reuse a chair and an opposite foot plant while
 * transferring the shell onto or out of the raised foot.
 *
 * Clegg et al. describe independent alignment and sleeve passage phases in
 * Animating Human Dressing (2015),
 * https://sites.cc.gatech.edu/gvu/people/faculty/greg.turk/paper_pages/2015_animating_human_dressing/index.html.
 * The jacket here uses explicit short openings and imposes staged rigid poses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains entry ownership, what can be reversed, closure composition and coarse model scope.
 */
function planWardrobe(
  context: IAutoMovieMotionHumanActionContext<Params>,
): IAutoMovieMotionHumanActionPlan {
  const params: Params = context.params;
  const side: AutoMovieHumanSide =
    params.kind === "jacketOn" ? (params.hand ?? "right") : params.side;
  switch (params.kind) {
    case "jacketOn":
      return jacket(context, side);
    case "sleeveIn":
    case "sleeveOut":
      return thread(context, side, params.kind === "sleeveOut");
    case "closeZip":
    case "openZip":
      return wardrobeHands.zipper(context, side, params.kind === "openZip");
    case "footwearOn":
    case "footwearOff": {
      const hand: AutoMovieHumanSide = params.hand ?? opposite(side);
      return wardrobeFoot(context, side, hand, params.kind === "footwearOff");
    }
  }
}

/** Transport the held jacket and thread the free hand before attaching it. */
function jacket(
  context: IAutoMovieMotionHumanActionContext<Params>,
  hand: AutoMovieHumanSide,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry, params }: typeof context = context;
  const reader: IAutoMovieMotionHumanPropReader = context.prop(params.prop);
  const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld(
    context,
    hand,
    params.prop,
  );
  const side: AutoMovieHumanSide = opposite(hand);
  if (entry.holds[side] !== undefined)
    throw wardrobeHands.refusal(
      "side",
      side,
      "the hand entering the sleeve must be free",
    );
  const wear: IAutoMovieAffordance = wardrobeHands.site(
    reader.prop,
    "wear",
    "socket",
  );
  const target: IAutoMovieRigidTransform = HumanPropFrame.parent(
    collar(context),
    wardrobeHands.frame(wear),
  );
  const reach: wardrobeSleeve.ISleeve = wardrobeSleeve(
    context,
    reader,
    target,
    side,
  );
  const kept: IAutoMovieRigidTransform = HumanPropFrame.parent(
    target,
    held.frame,
  );
  const carrying: IAutoMovieRigidTransform = wardrobeHands.grip(
    body,
    entry.posture,
    hand,
  );
  const free: IAutoMovieRigidTransform = wardrobeHands.grip(
    body,
    entry.posture,
    side,
  );
  const arrival: number = wardrobeHands.duration(carrying, kept);
  const across: number = wardrobeHands.duration(reach.before, reach.after);
  const over: number = arrival + across;
  const finish: number = over + 0.28;
  const durationSeconds: number =
    finish + wardrobeHands.duration(kept, carrying);

  const holding: (t: number) => IAutoMovieRigidTransform = (
    t: number,
  ): IAutoMovieRigidTransform =>
    t < finish
      ? wardrobeHands.path(carrying, kept, t / arrival)
      : wardrobeHands.path(
          kept,
          carrying,
          (t - finish) / (durationSeconds - finish),
        );

  // The free hand waits above the opening before the axial sleeve crossing.
  const inSleeve = (t: number): IAutoMovieRigidTransform =>
    t <= arrival
      ? wardrobeHands.path(free, reach.before, t / arrival)
      : wardrobeHands.path(reach.before, reach.after, (t - arrival) / across);
  const baseAt = (): IAutoMovieMotionHumanPosture => entry.posture;
  const knots: readonly number[] = [
    arrival,
    arrival + across * reach.passage,
    over,
    finish,
  ];
  const carry: ReturnType<typeof wardrobeHands.prepareArm> =
    wardrobeHands.prepareArm(
      body,
      baseAt,
      hand,
      holding,
      durationSeconds,
      knots,
    );
  const sleeve: ReturnType<typeof wardrobeHands.prepareArm> =
    wardrobeHands.prepareArm(
      body,
      baseAt,
      side,
      inSleeve,
      durationSeconds,
      knots,
    );
  const posture = (t: number): IAutoMovieMotionHumanPosture =>
    sleeve(carry(entry.posture, t), t);
  for (const [t, acting, goal] of [
    [arrival, hand, kept],
    [arrival, side, reach.before],
    [over, side, reach.after],
    [finish, hand, kept],
  ] as const)
    wardrobeHands.verify(context, posture(t), acting, goal, wardrobeHands.MISS);
  const time: number = finish / durationSeconds;
  const base: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
    context,
    durationSeconds,
  );
  return {
    ...base,
    events: [
      { name: "sleeveReady", share: arrival / durationSeconds },
      {
        name: "sleeveOpening",
        share: (arrival + across * reach.passage) / durationSeconds,
      },
      { name: "sleeveClear", share: over / durationSeconds },
      { name: "jacketWorn", share: time },
      { name: "relax", share: 1 },
    ],
    hands: [hand, side],
    contacts: [
      ...base.contacts,
      {
        ...wardrobeHands.contact(params.prop, hand, 0, time),
        inHand: (
          share: number,
          grip?: IAutoMovieRigidTransform,
        ): IAutoMovieRigidTransform => {
          const at: number = share * finish;
          return wardrobeHands.roll(
            body,
            grip === undefined ? posture(at) : entry.posture,
            hand,
            holding(at),
            at / arrival,
            grip,
          );
        },
      },
    ],
    wears: [{ prop: params.prop, bone: "chest", from: time }],
    posture,
  };
}

/** Pass a free hand through a sleeve on the staged jacket in either direction. */
function thread(
  context: IAutoMovieMotionHumanActionContext<Params>,
  side: AutoMovieHumanSide,
  reverse: boolean,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry, params }: typeof context = context;
  if (entry.holds[side] !== undefined)
    throw wardrobeHands.refusal(
      "side",
      side,
      "clear the selected hand before threading the sleeve",
    );
  const reader: IAutoMovieMotionHumanPropReader = context.prop(params.prop);
  const wear: IAutoMovieAffordance = wardrobeHands.site(
    reader.prop,
    "wear",
    "socket",
  );
  // A jacket another performer holds open at this performer's collar is
  // where that hold puts it, its wear socket on the collar, so the wearer
  // threads without reading the holder, who reads the wearer (`coatPartner`).
  const held: boolean = "held" in params && params.held === true;
  const model: IAutoMovieRigidTransform = held
    ? HumanPropFrame.parent(collar(context), wardrobeHands.frame(wear))
    : reader.frame(context.start - 1e-6);
  const mounted: IAutoMovieRigidTransform = HumanPropFrame.compose(
    model,
    wardrobeHands.frame(wear),
  );
  if (!held)
    wardrobeHands.sleeveMount(
      params.prop,
      Vector3.distance(mounted.position, collar(context).position),
    );
  const { before, after, passage }: wardrobeSleeve.ISleeve = wardrobeSleeve(
    context,
    reader,
    model,
    side,
  );
  const first: IAutoMovieRigidTransform = reverse ? after : before;
  const last: IAutoMovieRigidTransform = reverse ? before : after;
  const home: IAutoMovieRigidTransform = wardrobeHands.grip(
    body,
    entry.posture,
    side,
  );
  const prepare: number = wardrobeHands.duration(home, first);
  const across: number = wardrobeHands.duration(first, last);
  const finish: number = prepare + across;
  const total: number = finish + 0.18;
  // Through a jacket a partner holds open, the threaded arm has no further
  // part in the dressing (the partner's release puts the jacket on), so it
  // returns to the arm it entered with: a free-space transfer as long as the
  // reach (the retraction that closes a reach, McNeill 1992), on the same
  // planned course, so it comes down clear of the body instead of being
  // blended back in joint space by the next action. A wearer dressing alone
  // keeps the threaded arm where it is for the next garment act (a zip, a
  // sleeve pulled out), which reaches on from there.
  const back: number = held ? wardrobeHands.duration(last, home) : 0;
  const end: number = total + back;
  // A demand that leaves the arm out (`courseArmGoal`, the arm on its
  // course) takes no goal of it (`wardrobeHands.arm`). After the hold the
  // plan's goal is the entry grip, the course's return's end.
  const posture: (
    t: number,
    channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
  ) => IAutoMovieMotionHumanPosture = (
    t: number,
    channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
  ): IAutoMovieMotionHumanPosture =>
    wardrobeHands.arm(
      body,
      entry.posture,
      side,
      t > total
        ? home
        : t <= prepare
          ? wardrobeHands.path(home, first, t / prepare)
          : wardrobeHands.path(first, last, (t - prepare) / across),
      channels,
    );
  wardrobeHands.verify(
    context,
    posture(prepare),
    side,
    first,
    wardrobeHands.MISS,
  );
  wardrobeHands.verify(
    context,
    posture(finish),
    side,
    last,
    wardrobeHands.MISS,
  );
  // The threading arm is laid as one course over the hand's goal
  // (`courseArmGoal`): the planner's reach to the sleeve's near end, then
  // the passage read at every second with branch and swivel continuity, in
  // place of a fresh fit at each second, where two nearly tied solutions
  // let one frame turn the hand over. The checks above read the goal.
  return courseArmGoal({
    context,
    side,
    rest: AutoMovieMotionHumanArm.angles(entry.pose, side),
    span: { start: 0, ready: prepare, relax: total, end },
    plan: {
      ...AutoMovieMotionHumanBase.under(context, end),
      events: [
        { name: "sleeveReady", share: prepare / end },
        {
          name: "sleeveOpening",
          share: (prepare + across * (reverse ? 1 - passage : passage)) / end,
        },
        { name: "sleeveClear", share: finish / end },
        { name: "relax", share: total / end },
      ],
      hands: [side],
      posture,
    },
  });
}

/** The torso origin set by the wearer's actual left and right shoulders. */
function collar(
  context: IAutoMovieMotionHumanActionContext<Params>,
): IAutoMovieRigidTransform {
  const rotation: IAutoMovieRigidTransform["rotation"] =
    Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, context.entry.posture.yaw);
  const shoulder: (name: AutoMovieHumanoidBone) => IAutoMovieVector3 = (
    name: AutoMovieHumanoidBone,
  ): IAutoMovieVector3 =>
    wardrobeHands.bone(context.body, context.entry.posture, name).position;
  return {
    position: Vector3.add(
      Vector3.lerp(shoulder("leftUpperArm"), shoulder("rightUpperArm"), 0.5),
      Quaternion.rotateVector(rotation, { x: 0, y: -0.085, z: 0.1 }),
    ),
    rotation,
  };
}

/** Use the unoccupied opposite limb. */
function opposite(side: AutoMovieHumanSide): AutoMovieHumanSide {
  return side === "left" ? "right" : "left";
}
