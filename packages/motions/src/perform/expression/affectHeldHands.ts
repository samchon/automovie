import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../../everyday/internal/HumanTrunk";

/*
 * Keep the hands an action holds by contact on their contacts while a trunk
 * layer moves the chest, the shoulder girdles and the head under them.
 *
 * - A hand on something outside the performer (a partner, a prop, the ground)
 *   stays where the action put it: an arm the action poses by joint angles,
 *   such as a hug's, keeps the action's angle on every joint above the hand
 *   that the layer would turn, so the layer shows on the rest of the body alone
 *   and no goal is fitted. An arm the action already holds by a limb goal keeps
 *   that goal.
 * - A hand on the performer's own body, such as a palm over the face, moves with
 *   the bone it touches. An arm the action poses by joint angles keeps the
 *   action's angles on every joint between the touched bone and the hand, below
 *   the bone both hang from, so the layer sways the trunk under both alike and
 *   no goal is fitted. An arm held by a limb goal has the goal carried from the
 *   bone's frame before the layer to its frame after. Either way the contact
 *   neither slides nor sinks.
 *
 * A free hand, or one whose contact window is not open at the second, is left
 * to the layer. A new goal bends its elbow toward where the elbow stood before
 * the layer, so with the layer at rest the fit gives the arm the action gave it
 * and the goal comes and goes without a step.
 * Parameter before: The posture the action gives, before the layer.
 * Parameter after: The posture with the layer's joint angles added.
 * Parameter seconds: The film second.
 * Parameter context: The layer's context: the body, the active action and the
 * borrowed FK.
 * Returns: `after`, with a limb goal for each held hand.
 */
export function affectHeldHands(
  before: IAutoMovieMotionHumanPosture,
  after: IAutoMovieMotionHumanPosture,
  seconds: number,
  context: affectHeldHands.IContext,
): IAutoMovieMotionHumanPosture {
  const action: IAutoMovieMotionHumanLayer.IAction | undefined =
    context.action();
  if (action === undefined) return after;
  const share: number =
    action.to > action.from
      ? (seconds - action.from) / (action.to - action.from)
      : 0;
  // A hold eases in over `EASE` before its window opens and out over `EASE`
  // after it closes, so the layer neither steps the arm nor lets the hand
  // and the bone it nears drift into each other as they meet.
  const ease: number =
    action.to > action.from ? EASE / (action.to - action.from) : 0;
  const holds: IHold[] = [];
  for (const side of ["left", "right"] as const) {
    const window: IAutoMovieMotionHumanContactWindow | undefined =
      action.contacts.find(
        (item: IAutoMovieMotionHumanContactWindow): boolean =>
          item.part === HAND[side] &&
          share > item.from - ease &&
          share < item.to + ease,
      );
    if (window === undefined) continue;
    const weight: number =
      ease === 0
        ? 1
        : Math.min(
            1,
            AutoMovieEngineMotionSampling.minimumJerkShare((share - (window.from - ease)) / ease),
            AutoMovieEngineMotionSampling.minimumJerkShare((window.to + ease - share) / ease),
          );
    const own: boolean =
      window.support.kind === "person" &&
      window.support.subject === context.subject;
    if (!own && before.limbs[ARM[side]] !== undefined) continue;
    holds.push({
      side,
      weight,
      bone: !own
        ? undefined
        : window.support.kind === "person" && "bone" in window.support
          ? window.support.bone
          : window.support.kind === "person" && "region" in window.support
            ? context.body.surfaces.regions[window.support.region].bone
            : undefined,
    });
  }
  if (holds.length === 0) return after;

  // A hand the action poses by joint angles on its own body moves with the
  // touched bone when the joints between them keep the action's angles: the
  // layer still moves the trunk they both hang from, so the hand and, say,
  // the face it covers sway together and no goal is fitted.
  const joints: IAutoMovieMotionHumanPosture["joints"] = { ...after.joints };
  // A hand on something outside the body, posed by joint angles, stays put
  // when every joint the layer would turn above it keeps the action's angle:
  // the layer then shows on the rest of the body alone.
  const goaled: IHold[] = holds.filter((hold: IHold): boolean => {
    if (before.limbs[ARM[hold.side]] !== undefined) return true;
    const from: AutoMovieHumanoidBone =
      hold.bone ??
      context.body.skeleton.bones.find(
        (bone: IAutoMovieBone): boolean => bone.parent === null,
      )!.bone;
    for (const bone of between(context.body, from, HAND[hold.side])) {
      const layered: IAutoMovieMotionHumanPosture["joints"][AutoMovieHumanoidBone] =
        after.joints[bone];
      if (layered === undefined) continue;
      const own: readonly number[] = before.joints[bone] ?? [0, 0, 0];
      const blend: (i: number) => number = (i: number): number =>
        layered[i]! + (own[i]! - layered[i]!) * hold.weight;
      joints[bone] = [blend(0), blend(1), blend(2)];
    }
    return false;
  });
  if (goaled.length === 0) return { ...after, joints };
  const read: ReturnType<typeof HumanTrunk.prepareResolve> = reader(
    context.body,
    goaled,
  );
  const was: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = read(
    before,
    context.resolution,
  );
  const is: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> | undefined =
    goaled.some((hold: IHold): boolean => hold.bone !== undefined)
      ? read({ ...after, joints }, context.resolution)
      : undefined;
  const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...after.limbs };
  for (const hold of goaled) {
    const goal: IAutoMovieHumanLimbGoal | undefined =
      before.limbs[ARM[hold.side]];
    const hand: IAutoMovieResolvedBone = was.get(HAND[hold.side])!;
    const point: IAutoMovieVector3 = goal?.point ?? hand.worldPosition;
    const rotation: IAutoMovieQuaternion | undefined =
      goal === undefined ? hand.worldRotation : goal.rotation;
    const elbow: IAutoMovieVector3 = was.get(ELBOW[hold.side])!.worldPosition;
    if (hold.bone === undefined || is === undefined) {
      limbs[ARM[hold.side]] = {
        point,
        rotation: rotation ?? hand.worldRotation,
        bend: elbow,
      };
      continue;
    }

    // Carry the goal rigidly with the touched bone from before to after.
    const from: IAutoMovieResolvedBone = was.get(hold.bone)!;
    const to: IAutoMovieResolvedBone = is.get(hold.bone)!;
    const turn: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      to.worldRotation,
      AutoMovieEngineQuaternion.inverse(from.worldRotation),
    );
    const moved: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      to.worldPosition,
      AutoMovieEngineQuaternion.rotateVector(
        turn,
        AutoMovieEngineVector3.subtract(point, from.worldPosition),
      ),
    );
    limbs[ARM[hold.side]] = {
      ...(goal ?? { bend: elbow }),
      point: moved,
      ...(rotation === undefined
        ? {}
        : { rotation: AutoMovieEngineQuaternion.multiply(turn, rotation) }),
    };
  }
  return { ...after, joints, limbs };
}

/*
 * The layer inputs read while securing a held prop's contacts.
 */
export namespace affectHeldHands {
  /*
   * What the hold reads of a layer's context: the performer, its body, the
   * active action and the borrowed FK.
   */
  export type IContext = Pick<
    IAutoMovieMotionHumanLayer.IContext,
    "subject" | "body" | "action" | "resolution"
  >;
}

/*
 * The bones on the way from one bone to another, below the lowest bone both
 * hang from, each end included.
 */
function between(
  body: IAutoMovieMotionHumanBody,
  a: AutoMovieHumanoidBone,
  b: AutoMovieHumanoidBone,
): AutoMovieHumanoidBone[] {
  const up: (bone: AutoMovieHumanoidBone) => AutoMovieHumanoidBone[] = (
    bone: AutoMovieHumanoidBone,
  ): AutoMovieHumanoidBone[] => {
    const chain: AutoMovieHumanoidBone[] = [];
    for (
      let at: AutoMovieHumanoidBone | null = bone;
      at !== null;
      at = body.bones.get(at)?.parent ?? null
    )
      chain.push(at);
    return chain;
  };
  const above: AutoMovieHumanoidBone[] = up(b);
  const shared: Set<AutoMovieHumanoidBone> = new Set(up(a));
  const common: AutoMovieHumanoidBone | undefined = above.find(
    (bone: AutoMovieHumanoidBone): boolean => shared.has(bone),
  );
  const below: (chain: AutoMovieHumanoidBone[]) => AutoMovieHumanoidBone[] = (
    chain: AutoMovieHumanoidBone[],
  ): AutoMovieHumanoidBone[] =>
    common === undefined ? chain : chain.slice(0, chain.indexOf(common));
  return [...below(up(a)), ...below(above)];
}

/*
 * A hand the layer keeps on its contact: the bone it rides, when the contact is
 * on the performer's own body.
 */
interface IHold {
  /*
   * The hand's side.
   */
  side: AutoMovieHumanSide;

  /*
   * How far the hold applies, 0 to 1, eased at its window's edges.
   */
  weight: number;

  /*
   * The performer's own bone the hand touches; absent for a contact outside the
   * body.
   */
  bone: AutoMovieHumanoidBone | undefined;
}

/*
 * Seconds over which a hold eases in before its contact window and out after it
 * (provisional: a tenth of a second, as a lifted foot's turn eases).
 */
const EASE: number = 0.1;

/*
 * Each side's arm limb.
 */
const ARM: Readonly<Record<AutoMovieHumanSide, AutoMovieHumanLimb>> = {
  left: "leftArm",
  right: "rightArm",
};

/*
 * Each side's elbow bone, whose pre-layer place hints a new goal's bend.
 */
const ELBOW: Readonly<Record<AutoMovieHumanSide, AutoMovieHumanoidBone>> = {
  left: "leftLowerArm",
  right: "rightLowerArm",
};

/*
 * Each side's hand bone, which is also the hand's contact part.
 */
const HAND: Readonly<Record<AutoMovieHumanSide, AutoMovieHumanoidBone>> = {
  left: "leftHand",
  right: "rightHand",
};

/*
 * The body's prepared reader of both hands and every touched bone.
 */
function reader(
  body: IAutoMovieMotionHumanBody,
  holds: readonly IHold[],
): ReturnType<typeof HumanTrunk.prepareResolve> {
  const names: AutoMovieHumanoidBone[] = [
    "leftHand",
    "rightHand",
    "leftLowerArm",
    "rightLowerArm",
    ...holds.flatMap((hold: IHold): AutoMovieHumanoidBone[] =>
      hold.bone === undefined ? [] : [hold.bone],
    ),
  ];
  return HumanTrunk.prepareResolve(body, new Set(names));
}
