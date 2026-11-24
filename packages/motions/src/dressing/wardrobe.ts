import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
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
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanPropFrame } from "../perform/HumanPropFrame";
import { HumanHand } from "../posture/HumanHand";
import { wardrobeFoot } from "./wardrobeFoot";
import { wardrobeHands } from "./wardrobeHands";
import type { wardrobeModes } from "./wardrobeModes";

/** How far a hand clears the physical sleeve plane on each side, metres. */
const CLEAR: number = 0.034;

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
 * @evidence contracts/development/design.md#principled-representation Distinct registered modes describe which contact travels relative to which named sleeve or foot before a native custody transfer.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Reuses stock prop span, posture and approach owners and adds only the new fitting choreography.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Model-local contacts, real hand/foot goals and the native wear path keep one persistent prop identity.
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
  plan: (
    context: IAutoMovieMotionHumanActionContext<Params>,
  ): IAutoMovieMotionHumanActionPlan => {
    const params: Params = context.params;
    if (typeof params.prop !== "string" || params.prop.length === 0)
      throw wardrobeHands.refusal(
        "prop",
        params.prop,
        "name a declared wearable prop",
      );
    const side: AutoMovieHumanSide =
      params.kind === "jacketOn" ? (params.hand ?? "right") : params.side;
    if (side !== "left" && side !== "right")
      throw wardrobeHands.refusal(
        "side",
        side,
        "choose the actual left or right limb",
      );
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
        if (hand !== "left" && hand !== "right")
          throw wardrobeHands.refusal(
            "hand",
            hand,
            "choose the hand taking the footwear",
          );
        return wardrobeFoot(context, side, hand, params.kind === "footwearOff");
      }
      default:
        throw wardrobeHands.refusal(
          "kind",
          params,
          "choose a supported wardrobe action kind",
        );
    }
  },
};

/** Transport the held jacket and thread the free hand before attaching it. */
function jacket(
  context: IAutoMovieMotionHumanActionContext<Params>,
  hand: AutoMovieHumanSide,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry, params }: typeof context = context;
  const reader: IAutoMovieMotionHumanPropReader = context.prop(params.prop);
  const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
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
  const reach: ISleeve = sleeve(context, reader, target, side);
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
  const posture: (t: number) => IAutoMovieMotionHumanPosture = (
    t: number,
  ): IAutoMovieMotionHumanPosture => {
    const inSleeve: IAutoMovieRigidTransform =
      t <= arrival
        ? wardrobeHands.path(free, reach.before, t / arrival)
        : wardrobeHands.path(reach.before, reach.after, (t - arrival) / across);
    return wardrobeHands.arm(
      body,
      wardrobeHands.arm(body, entry.posture, hand, holding(t)),
      side,
      inSleeve,
    );
  };
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
        inHand: (share: number): IAutoMovieRigidTransform => {
          const at: number = share * finish;
          return wardrobeHands.roll(
            body,
            posture(at),
            hand,
            holding(at),
            at / arrival,
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
  if (
    !held &&
    Vector3.distance(mounted.position, collar(context).position) > 0.12
  )
    throw wardrobeHands.refusal(
      "prop",
      params.prop,
      "the jacket must be seated on the performer before threading this sleeve",
    );
  const { before, after, passage }: ISleeve = sleeve(
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

/** Two display grip targets lie on opposite sides of a real sleeve. */
interface ISleeve {
  /** Clear of the opening on the approach side. */
  before: IAutoMovieRigidTransform;
  /** Clear of the outlet after passage. */
  after: IAutoMovieRigidTransform;
  /** Time share at which the wrist crosses the opening plane. */
  passage: number;
}

/**
 * Fit a real path down the named sleeve axis, leaving positive radial
 * clearance.
 */
function sleeve(
  context: IAutoMovieMotionHumanActionContext<Params>,
  reader: IAutoMovieMotionHumanPropReader,
  model: IAutoMovieRigidTransform,
  side: AutoMovieHumanSide,
): ISleeve {
  const name: string = side + "Sleeve";
  const opening: IAutoMovieAffordance = wardrobeHands.site(
    reader.prop,
    name + "Opening",
    "aperture",
  );
  const middle: IAutoMovieRigidTransform = HumanPropFrame.compose(
    model,
    wardrobeHands.middle(opening),
  );
  const exit: IAutoMovieRigidTransform = HumanPropFrame.compose(
    model,
    wardrobeHands.frame(
      wardrobeHands.site(reader.prop, name + "Exit", "socket"),
    ),
  );
  const delta: IAutoMovieVector3 = Vector3.subtract(
    exit.position,
    middle.position,
  );
  const depth: number = Vector3.length(delta);
  const openingOut: IAutoMovieVector3 = Quaternion.rotateVector(
    middle.rotation,
    { x: 0, y: 0, z: 1 },
  );
  if (
    !(
      depth > 0 &&
      Vector3.dot(Vector3.scale(delta, -1 / depth), openingOut) > 0.999 &&
      opening.width! >=
        Math.max(
          2 * context.body.measure.upperArmRadius,
          0.55 * context.body.measure.hand,
        ) &&
      opening.height! >=
        Math.max(
          2 * context.body.measure.upperArmRadius,
          0.55 * context.body.measure.hand,
        )
    )
  )
    throw wardrobeHands.refusal(
      "opening",
      opening.id,
      "the named sleeve has no clear aligned hand passage",
    );
  const before: IAutoMovieVector3 = Vector3.add(
    middle.position,
    Vector3.scale(openingOut, CLEAR),
  );
  const after: IAutoMovieVector3 = Vector3.subtract(
    exit.position,
    Vector3.scale(openingOut, CLEAR),
  );
  const facing: IAutoMovieVector3 = Quaternion.rotateVector(model.rotation, {
    x: 0,
    y: 0,
    z: 1,
  });
  // A square sleeve leaves the hand's roll around the passage axis free.
  const rotations: IAutoMovieQuaternion[] = [
    0, 45, -45, 90, -90, 135, -135, 180,
  ].map(
    (angle: number): IAutoMovieQuaternion =>
      HumanHand.rotation(side, {
        fingers: Vector3.scale(openingOut, -1),
        palm: Quaternion.rotateVector(
          Quaternion.fromAxisAngle(openingOut, angle),
          facing,
        ),
      }),
  );
  // One roll serves both ends: the hand keeps its turn about the sleeve's
  // axis while it passes down the sleeve, as the zipper's hand keeps its own
  // along the slider. Rolling between two separately chosen ends would turn
  // the wrist inside the sleeve and pull the hand off the axis between them.
  const rotation: IAutoMovieQuaternion = wardrobeHands.fittedGrip(
    context,
    side,
    before,
    after,
    rotations,
    "the hand cannot pass this sleeve within its posed reach",
  );
  const endpoint: (position: IAutoMovieVector3) => IAutoMovieRigidTransform = (
    position: IAutoMovieVector3,
  ): IAutoMovieRigidTransform => ({ position, rotation });
  const crossing: number = CLEAR / (2 * CLEAR + depth);
  let earlier: number = 0;
  let later: number = 1;
  // Invert the monotonic timing curve at the actual axial distance to the opening.
  for (let step: number = 0; step < 14; ++step) {
    const middle: number = (earlier + later) / 2;
    if (minimumJerk.share(middle) < crossing) earlier = middle;
    else later = middle;
  }
  return {
    before: endpoint(before),
    after: endpoint(after),
    passage: (earlier + later) / 2,
  };
}

/** Use the unoccupied opposite limb. */
function opposite(side: AutoMovieHumanSide): AutoMovieHumanSide {
  return side === "left" ? "right" : "left";
}
