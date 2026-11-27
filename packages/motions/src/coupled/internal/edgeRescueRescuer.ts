import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEdgeRescue,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieMotionTarget,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { support } from "../../actions/internal/support";
import { getUp } from "../../floor/internal/getUp";
import { lieDown } from "../../floor/internal/lieDown";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { stuntFallPose } from "../../reaction/internal/stuntFallPose";
import { edgeRescueScene } from "./edgeRescueScene";

/**
 * The rescuer's part in an edge rescue on the shared support law: from
 * standing, down onto the knees and hands at the lip, then prone with the right
 * arm hanging straight down over the lip to the grip by the release; holding
 * the catch through the arrest; hauling back onto the knees in two stances as
 * the grip rises past the lip and back over the top; and kneeling up at the
 * end. From the catch to the end of the haul the right hand's goal follows the
 * scene's grip path exactly, so both hands share one grip frame. A missed catch
 * ends prone, the hand empty.
 *
 * @param context The rescuer's context, standing on the top behind the lip.
 * @param p The parameters.
 * @param scene The shared scene.
 * @returns The rescuer's plan.
 */
export function edgeRescueRescuer(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanEdgeRescue.IParams>,
  p: IAutoMovieMotionHumanEdgeRescue.IParams,
  scene: edgeRescueScene.IScene,
): IAutoMovieMotionHumanActionPlan {
  const measure: IAutoMovieMotionHumanActionContext["body"]["measure"] =
    context.body.measure;
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const staged: Map<string, IStaged> = new Map();
  const back: (behind: number, aside: number) => IAutoMovieVector3 = (
    behind: number,
    aside: number,
  ): IAutoMovieVector3 =>
    Vector3.add(
      Vector3.add(scene.lip, Vector3.scale(scene.out, -behind)),
      Vector3.scale(scene.along, aside),
    );
  const on: (
    key: string,
    point: IAutoMovieVector3,
    normal?: IAutoMovieVector3,
  ) => IAutoMovieMotionTarget = (
    key: string,
    point: IAutoMovieVector3,
    normal: IAutoMovieVector3 = up,
  ): IAutoMovieMotionTarget => {
    staged.set(key, { point, normal });
    return { kind: "prop", subject: p.ledge, point: key };
  };
  const bear: (
    part: IAutoMovieMotionHumanSupport.Part,
    key: string,
    point: IAutoMovieVector3,
  ) => IAutoMovieMotionHumanSupport.IContact = (
    part: IAutoMovieMotionHumanSupport.Part,
    key: string,
    point: IAutoMovieVector3,
  ): IAutoMovieMotionHumanSupport.IContact => ({
    part,
    kind: "bear",
    target: on(key, point),
  });
  const knees: (behind: number) => IAutoMovieMotionHumanSupport.IContact[] = (
    behind: number,
  ): IAutoMovieMotionHumanSupport.IContact[] =>
    (["left", "right"] as const).map(
      (side: AutoMovieHumanSide): IAutoMovieMotionHumanSupport.IContact =>
        bear(
          `${side}Knee`,
          `${side}Knee${behind}`,
          back(behind, side === "left" ? KNEES : -KNEES),
        ),
    );
  const grip: (
    key: string,
    point: IAutoMovieVector3,
  ) => IAutoMovieMotionHumanSupport.IContact = (
    key: string,
    point: IAutoMovieVector3,
  ): IAutoMovieMotionHumanSupport.IContact => ({
    part: "rightHand",
    kind: "grip",
    target: on(key, point, Vector3.scale(scene.out, -1)),
  });
  const entry: ReturnType<typeof poseBones> = poseBones(
    context.body,
    context.entry.pose,
  );
  const feet: IAutoMovieMotionHumanSupport.IContact[] = (
    ["left", "right"] as const
  ).map(
    (side: AutoMovieHumanSide): IAutoMovieMotionHumanSupport.IContact =>
      bear(
        `${side}Foot`,
        `${side}FootStart`,
        entry.get(`${side}Toes`)!.worldPosition,
      ),
  );
  const kneelAt: number = measure.hipHeight + 0.2;
  // Prone, the body lies as the reaching pose holds it: its right palm over
  // the grip, so the arm hangs straight down to it from its own shoulder,
  // and its front, knees and free palm each bearing on the top where that
  // pose puts their surfaces (a prone foot's sole faces up, so it bears
  // nothing), above the top by their height over the pose's lowest point.
  const prone0: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: REACHING.pitch,
    roll: REACHING.roll,
    joints: REACHING.joints,
    limbs: {},
  };
  const lying: ReturnType<typeof poseBones> = poseBones(
    context.body,
    resolveHumanPosture.seeded(context.body, prone0).pose,
  );
  // The surface it rests on is read with the arm along the body, as the
  // lying pose holds it: the reaching arm hangs below the top, over the lip.
  const low: number = stuntFallPose.lowest(context.body, {
    ...prone0,
    joints: lieDown.POSES.prone.joints,
  });
  const surface: (region: AutoMovieHumanoidRegion) => IAutoMovieVector3 = (
    region: AutoMovieHumanoidRegion,
  ): IAutoMovieVector3 => {
    const area: IAutoMovieMotionHumanActionContext["body"]["surfaces"]["regions"][AutoMovieHumanoidRegion] =
      context.body.surfaces.regions[region];
    const bone: IAutoMovieResolvedBone = lying.get(area.bone)!;
    return Vector3.add(
      bone.worldPosition,
      Quaternion.rotateVector(bone.worldRotation, area.point),
    );
  };
  const palm: IAutoMovieVector3 = surface("palmRight");
  // At yaw 0 the prone head lies toward +Z, the edge's `out` for a body
  // facing out over it, and its left toward +X, along the edge's `along`.
  const lain: (region: AutoMovieHumanoidRegion) => IAutoMovieVector3 = (
    region: AutoMovieHumanoidRegion,
  ): IAutoMovieVector3 => {
    const at: IAutoMovieVector3 = surface(region);
    return Vector3.add(
      Vector3.add(
        { x: scene.grip.x, y: scene.lip.y + at.y - low, z: scene.grip.z },
        Vector3.scale(scene.out, at.z - palm.z),
      ),
      Vector3.scale(scene.along, at.x - palm.x),
    );
  };
  // The free hand braces on the top where the reaching pose lays it beside
  // the head, prone and through the haul.
  const shoulder: IAutoMovieVector3 = surface("palmLeft");
  const under: IAutoMovieVector3 = Vector3.add(
    Vector3.add(
      { x: scene.grip.x, y: scene.lip.y, z: scene.grip.z },
      Vector3.scale(scene.out, shoulder.z - palm.z),
    ),
    Vector3.scale(scene.along, shoulder.x - palm.x),
  );
  // A brace that would lie out over the lip is drawn back a hand's length
  // behind it.
  const past: number =
    Vector3.dot(Vector3.subtract(under, scene.lip), scene.out) + measure.hand;
  const brace: IAutoMovieMotionHumanSupport.IContact = bear(
    "leftHand",
    "brace",
    past > 0 ? Vector3.subtract(under, Vector3.scale(scene.out, past)) : under,
  );
  const prone: IAutoMovieMotionHumanSupport.IContact[] = [
    bear("front", "chest", lain("abdomen")),
    bear("leftKnee", "leftKneeProne", lain("kneeLeft")),
    bear("rightKnee", "rightKneeProne", lain("kneeRight")),
    grip("catch", scene.grip),
  ];
  const stances: IAutoMovieMotionHumanSupport.IStance[] = [
    { contacts: feet, seconds: 0.3, event: "stand", prefer: getUp.POSES.stood },
    {
      contacts: [
        ...knees(kneelAt),
        bear("leftHand", "handL", back(0.2, BRACE)),
        bear("rightHand", "handR", back(0.2, -BRACE)),
      ],
      seconds: scene.release / 2 - 0.15,
      event: "down",
    },
    {
      contacts: prone,
      seconds: scene.release / 2 - 0.15,
      event: "reach",
      prefer: REACHING,
      // Prone, the free hand lets go of the top and rests as the lying pose
      // lays it: braced on the top it would drag the trunk off its front.
      free: ["leftHand"],
    },
    {
      contacts: prone,
      seconds: scene.haul - scene.release,
      event: "catch",
      prefer: REACHING,
    },
  ];
  if (scene.holds) {
    const half: number = (scene.kneel - scene.haul) / 2;
    stances.push(
      {
        contacts: [
          ...knees(0.7),
          brace,
          grip("haulMid", scene.gripAt(scene.haul + half)),
        ],
        seconds: half,
        event: "haul",
        // Hauling, the trunk rises off the top onto the knees.
        free: ["front"],
      },
      {
        contacts: [
          ...knees(kneelAt),
          brace,
          grip("haulTop", scene.gripAt(scene.kneel)),
        ],
        seconds: half,
        event: "hauled",
      },
      {
        contacts: knees(kneelAt),
        seconds: scene.end - scene.kneel,
        event: "kneel",
        prefer: getUp.POSES.halfKneel,
      },
    );
  }
  const aim: IAutoMovieMotionHumanActionContext["aim"] = (
    reference: IAutoMovieMotionTarget,
    seconds: number,
  ) => {
    const known: IStaged | undefined =
      reference.kind === "prop" && reference.subject === p.ledge
        ? staged.get(reference.point)
        : undefined;
    return known === undefined ? context.aim(reference, seconds) : known;
  };
  const plan: IAutoMovieMotionHumanActionPlan = support.plan({
    ...context,
    params: { stances },
    aim,
  });

  // The shared grip: the right hand on the scene's grip path from the catch to the haul's end.
  const span: number = plan.duration;
  const elbow: IAutoMovieVector3 = Vector3.add(Vector3.scale(scene.out, -0.2), {
    x: 0,
    y: 0.25,
    z: 0,
  });
  const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
    seconds: number,
    channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
  ): IAutoMovieMotionHumanPosture => {
    const shown: IAutoMovieMotionHumanPosture = plan.posture(
      seconds,
      channels,
      resolution,
      projection,
    );
    if (!scene.holds || seconds < scene.caught || seconds > scene.kneel)
      return shown;
    const point: IAutoMovieVector3 = scene.gripAt(seconds);
    // The support's own arm goal carried onto the shared grip, its bend moved
    // with it, so the elbow keeps the side the support's course gave it.
    const own: IAutoMovieHumanLimbGoal | undefined = shown.limbs.rightArm;
    return {
      ...shown,
      limbs: {
        ...shown.limbs,
        rightArm:
          own === undefined || own.on !== undefined
            ? { point, bend: Vector3.add(point, elbow) }
            : {
                ...own,
                point,
                bend: Vector3.add(own.bend, Vector3.subtract(point, own.point)),
              },
      },
    };
  };
  const share: (seconds: number) => number = (seconds: number): number =>
    Math.min(1, seconds / span);
  const contacts: IAutoMovieMotionHumanContactWindow[] = plan.contacts.filter(
    (window: IAutoMovieMotionHumanContactWindow): boolean =>
      !(window.part === "rightHand" && window.kind === "grip"),
  );
  if (scene.holds)
    contacts.push({
      part: "rightHand",
      kind: "grip",
      support: { kind: "person", subject: p.partner, bone: "rightHand" },
      from: share(scene.caught),
      to: share(scene.kneel),
    });
  return { ...plan, posture, contacts, base: { kind: "kneeling" } };
}

/** A staged point on the ledge's top: its world point and its normal. */
interface IStaged {
  /** World metres. */
  point: IAutoMovieVector3;

  /** Outward normal. */
  normal: IAutoMovieVector3;
}

/** The knees' half spacing across the edge, metres (provisional). */
const KNEES: number = 0.12;

/**
 * Lying prone reaching over the lip: the right arm hanging straight down to the
 * grip, the elbow nearly straight, the left arm resting along the body, out
 * clear of the hips (provisional angles, degrees).
 */
const REACHING: IAutoMovieMotionHumanLieDown.IPose = {
  ...lieDown.POSES.prone,
  joints: {
    ...lieDown.POSES.prone.joints,
    rightUpperArm: [90, 0, 0],
    rightLowerArm: [10, 0, 0],
    leftUpperArm: [0, 25, 0],
  },
};

/**
 * The free hand's place along the edge from the grip, metres (provisional: a
 * shoulder's width).
 */
const BRACE: number = 0.3;
