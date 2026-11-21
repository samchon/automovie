import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSurface,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walk } from "../actions/walk";

type Params = IAutoMovieMotionHumanSurface.ISupportStepParams;
type Plan = IAutoMovieMotionHumanActionPlan;
type Posture = IAutoMovieMotionHumanPosture;

/** The two feet. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/** Where a point on a support has moved to: a world point at the step's start to the same material point at a later second. */
type Carry = (at: number, point: IAutoMovieVector3) => IAutoMovieVector3;

/**
 * Step from one support to another, either of which may move: from a fixed
 * landing onto an escalator tread or a walkway band, or off it onto the
 * landing. The walk (`walk`) is planned where everything stands at the
 * step's start. Each foot's last plant is on the support it arrives on and
 * its earlier plants on the one it leaves, and each plant is carried by its
 * own support's motion, so a planted foot never slides on what bears it.
 * A swinging foot is carried by a minimum-jerk blend of the two supports'
 * motions from lift-off to touchdown, and the pelvis by the share of the
 * feet that bear on each support. Supports are carried as rigid frames;
 * the feet keep their own orientation, so a support that turns is carried
 * in position only.
 *
 * @param context The standing entry, the target and the two supports.
 * @returns The walk with each foot and the pelvis carried by its support.
 * @throws {HumanRefusal} When the walk refuses its path.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the planning frame, the support of each plant, the swing and pelvis blends and the orientation limit.
 * @evidence contracts/development/implementation.md#principled-implementation A planted foot keeps its material point on the support that bears it; the free foot and the body move between the two supports' motions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Plan the walk once, assign each plant its support, then carry each sample's goals.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No support speed is assumed: each support's own displayed frame carries its feet.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two support frames per carried point; each sample scans the few plant windows.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the walk's footprints, timing and leg goals.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the walk plan and plant windows for the action.
 */
export function HumanSupportStep(
  context: IAutoMovieMotionHumanActionContext<Params>,
): Plan {
  const { to, from, onto }: Params = context.params;
  const walked: Plan = walk.plan({ ...context, params: { to } });
  const carrier = (prop: string | undefined): Carry => {
    if (prop === undefined)
      return (_at: number, point: IAutoMovieVector3): IAutoMovieVector3 =>
        point;
    const first: IAutoMovieRigidTransform = context
      .prop(prop)
      .frame(context.start);
    const back: IAutoMovieRigidTransform["rotation"] = Quaternion.inverse(
      first.rotation,
    );
    return (at: number, point: IAutoMovieVector3): IAutoMovieVector3 => {
      const now: IAutoMovieRigidTransform = context
        .prop(prop)
        .frame(context.start + at);
      return Vector3.add(
        now.position,
        Quaternion.rotateVector(
          now.rotation,
          Quaternion.rotateVector(
            back,
            Vector3.subtract(point, first.position),
          ),
        ),
      );
    };
  };
  const leaving: Carry = carrier(from);
  const arriving: Carry = carrier(onto);

  // Each foot's plants in time order; the last is on the arriving support.
  const plants: Record<
    AutoMovieHumanSide,
    IAutoMovieMotionHumanContactWindow[]
  > = { left: [], right: [] };
  for (const window of walked.contacts)
    if (
      window.kind === "plant" &&
      (window.part === "leftFoot" || window.part === "rightFoot")
    )
      plants[window.part === "leftFoot" ? "left" : "right"].push(window);
  for (const side of SIDES)
    plants[side].sort(
      (
        a: IAutoMovieMotionHumanContactWindow,
        b: IAutoMovieMotionHumanContactWindow,
      ): number => a.from - b.from,
    );

  // A foot's share on the arriving support at a share of the walk: 0 on its
  // earlier plants, 1 on its last, rising through the swing between.
  const arrived = (side: AutoMovieHumanSide, share: number): number => {
    const list: IAutoMovieMotionHumanContactWindow[] = plants[side];
    if (list.length < 2) return share >= (list[0]?.from ?? 0) ? 1 : 0;
    const last: IAutoMovieMotionHumanContactWindow = list[list.length - 1]!;
    const before: IAutoMovieMotionHumanContactWindow = list[list.length - 2]!;
    if (share <= before.to) return 0;
    if (share >= last.from) return 1;
    return minimumJerk.share((share - before.to) / (last.from - before.to));
  };
  const carried = (
    at: number,
    point: IAutoMovieVector3,
    weight: number,
  ): IAutoMovieVector3 =>
    Vector3.lerp(leaving(at, point), arriving(at, point), weight);
  const supportOf = (
    prop: string | undefined,
  ): IAutoMovieMotionHumanContactWindow.Support =>
    prop === undefined ? { kind: "ground" } : { kind: "prop", subject: prop };
  return {
    ...walked,
    contacts: walked.contacts.map(
      (
        window: IAutoMovieMotionHumanContactWindow,
      ): IAutoMovieMotionHumanContactWindow => {
        if (
          window.kind !== "plant" ||
          (window.part !== "leftFoot" && window.part !== "rightFoot")
        )
          return window;
        const list: IAutoMovieMotionHumanContactWindow[] =
          plants[window.part === "leftFoot" ? "left" : "right"];
        return {
          ...window,
          support: supportOf(window === list[list.length - 1] ? onto : from),
        };
      },
    ),
    posture: (at: number): Posture => {
      const posture: Posture = walked.posture(at);
      const share: number = at / walked.duration;
      const limbs: Posture["limbs"] = { ...posture.limbs };
      let weight: number = 0;
      for (const side of SIDES) {
        const onArrival: number = arrived(side, share);
        weight += onArrival / 2;
        const goal: IAutoMovieHumanLimbGoal | undefined = limbs[`${side}Leg`];
        if (goal === undefined) continue;
        limbs[`${side}Leg`] = {
          ...goal,
          point: carried(at, goal.point, onArrival),
          bend: carried(at, goal.bend, onArrival),
        };
      }
      return {
        ...posture,
        root: carried(at, posture.root, weight),
        limbs,
      };
    },
  };
}
