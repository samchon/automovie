import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEdgeRescue,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { support } from "../actions/support";
import { getUp } from "../floor/getUp";
import { lieDown } from "../floor/lieDown";
import { poseBones } from "../posture/poseBones";
import { edgeRescueScene } from "./edgeRescueScene";

/** A staged point on the ledge's top: its world point and its normal. */
interface IStaged {
  /** World metres. */
  point: IAutoMovieVector3;

  /** Outward normal. */
  normal: IAutoMovieVector3;
}

/** The knees' half spacing across the edge, metres (provisional). */
const KNEES: number = 0.12;

/** The free hand's place along the edge from the grip, metres (provisional: a shoulder's width). */
const BRACE: number = 0.3;

/**
 * The rescuer's part in an edge rescue on the shared support law: from
 * standing, down onto the knees and hands at the lip, then prone with the
 * chest behind the lip and the right arm hanging over it to the grip by the
 * release; holding the catch through the arrest; hauling back onto the knees
 * in two stances as the grip rises past the lip and back over the top; and
 * kneeling up at the end. From the catch to the end of the haul the right
 * hand's goal follows the scene's grip path exactly, so both hands share
 * one grip frame. A missed catch ends prone, the hand empty.
 *
 * @param context The rescuer's context, standing on the top behind the lip.
 * @param p The parameters.
 * @param scene The shared scene.
 * @returns The rescuer's plan.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each stance, the shared grip and the missed catch.
 * @evidence contracts/development/implementation.md#principled-implementation Staged top points and the grip on the support law; each stance's seconds land it on the scene's instants; the right arm's goal is the grip path while they hold.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Stage the points, list the stances, plan them, then pin the grip.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every contact is on the ledge's top or the grip; the spacings are provisional and stated as such.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the few stances; each fitted once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Staged points are looked up by name.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the staged points and the scene.
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
          back(behind, side === "left" ? -KNEES : KNEES),
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
  const brace: IAutoMovieMotionHumanSupport.IContact = bear(
    "leftHand",
    "brace",
    back(0.15, -BRACE),
  );
  const kneelAt: number = measure.hipHeight + 0.2;
  const proneFeet: IAutoMovieMotionHumanSupport.IContact[] = (
    ["left", "right"] as const
  ).map(
    (side: AutoMovieHumanSide): IAutoMovieMotionHumanSupport.IContact =>
      bear(
        `${side}Foot`,
        `${side}FootProne`,
        back(measure.stature * 0.85, side === "left" ? -KNEES : KNEES),
      ),
  );
  const prone: IAutoMovieMotionHumanSupport.IContact[] = [
    bear("front", "chest", back(0.3, 0)),
    ...proneFeet,
    brace,
    grip("catch", scene.grip),
  ];
  const stances: IAutoMovieMotionHumanSupport.IStance[] = [
    { contacts: feet, seconds: 0.3, event: "stand", prefer: getUp.POSES.stood },
    {
      contacts: [
        ...knees(kneelAt),
        bear("leftHand", "handL", back(0.2, -BRACE)),
        bear("rightHand", "handR", back(0.2, BRACE)),
      ],
      seconds: scene.release / 2 - 0.15,
      event: "down",
    },
    {
      contacts: prone,
      seconds: scene.release / 2 - 0.15,
      event: "reach",
      prefer: lieDown.POSES.prone,
    },
    {
      contacts: prone,
      seconds: scene.haul - scene.release,
      event: "catch",
      prefer: lieDown.POSES.prone,
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
    return {
      ...shown,
      limbs: {
        ...shown.limbs,
        rightArm: { point, bend: Vector3.add(point, elbow) },
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
