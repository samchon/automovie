import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { HumanChain, HumanPerformance, HumanRefusal } from "@automovie/motions";

import { everydayTake } from "../../../features/internal/everydayTake";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { carriageScene } from "../../internal/carriageScene";
import { motionActionUnit } from "../../internal/motionActionUnit";

/** One placing on a bone: the asked frame and the take that asks it. */
interface IPlacing {
  /** The case, for failures. */
  label: string;

  /** The bone the prop is put on. */
  bone: AutoMovieHumanoidBone;

  /** The prop. */
  prop: string;

  /** The asked frame in the bone's posed frame. */
  asked: IAutoMovieRigidTransform;

  /** The props. */
  props: readonly IAutoMovieMotionHumanProp[];

  /** The chain, ending in the putDown on the bone. */
  chain: IAutoMovieMotionHumanChain;
}

/**
 * The out-of-reach owner (`root-cause-report.md` D5): a goal the body cannot
 * reach is refused, never clamped. Here the goal is a putDown `on` a bone of
 * the performer's own body: the prop lands at the asked frame in the bone's
 * posed frame, or the putDown is refused on reach. Landing elsewhere without a
 * refusal is the one wrong outcome, whatever the solver.
 *
 * Scenarios, on the average man and the small woman, each case gathering its
 * own result:
 *
 * 1. A backpack put on the back from the right hand, at the worn frame behind the
 *    chest the carriage scene authors: at `placed` its frame on the chest lies
 *    within the touch contract's 10 mm of the asked one, or the take is refused
 *    on reach.
 * 2. A porter's tray set on the crown, at the frame 0.18 m above the head joint
 *    the carriage scene authors: the same.
 * 3. Either putDown, when it lands, keeps the shipped bounds over its span.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the owner's contract, its two outcomes, the cases and the bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs each placing through the public chain and reads the displayed prop on the displayed bone at `placed`, or the refusal's kind; a prop landed off its frame without a refusal, a refusal of another kind or a finding in the putDown fails.
 * @evidence contracts/development/testing.md#independent-expectations The putDown contract refuses a placing frame beyond the arm's reach (`IAutoMovieMotionHumanPutDown`) and wears the prop at its offset in the bone's posed frame from `placed`; the authoring rule "Out of reach" asks a refusal with the reachable range rather than a clamp; the placement bound is the touch contract's 10 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases A frame behind the trunk and one above the head, on two statures; the pickUp before each is `test_motion_action_pick_up`'s and the carried custody after it the carriage scenario's.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_owner_out_of_reach`.
 */
export function test_motion_owner_out_of_reach(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const)
    for (const build of [pack, basket]) {
      let p: IPlacing | undefined;
      try {
        p = build(motionHumanBody(name), name);
        verify(checks, motionHumanBody(name), p);
      } catch (error: unknown) {
        checks.check(
          `${p?.label ?? name}: ${everydayTake.describe(error)}`,
          false,
        );
      }
    }
  checks.assert("a placing on the body lands where asked or is refused");
}

/** The backpack on the back, as the carriage scene stages it. */
function pack(body: IAutoMovieMotionHumanBody, name: string): IPlacing {
  const a: carriageScene.IArrival = carriageScene.arrival(body);
  return {
    label: `${name} puts the backpack on the back`,
    bone: "chest",
    prop: "pack",
    asked: a.worn,
    props: a.props,
    chain: carriageScene.don(HumanChain.subject("actor").stand(), a),
  };
}

/** The porter's tray on the crown, as the carriage scene stages it. */
function basket(body: IAutoMovieMotionHumanBody, name: string): IPlacing {
  const h: carriageScene.IHeadLoad = carriageScene.headLoad(body);
  return {
    label: `${name} sets the load on the crown`,
    bone: "head",
    prop: "basket",
    asked: h.crown,
    props: h.props,
    chain: carriageScene.place(HumanChain.subject("actor").stand(), h),
  };
}

/** One placing's outcome: landed at its frame, or refused on reach. */
function verify(
  checks: motionComplaints.IGatherer,
  body: IAutoMovieMotionHumanBody,
  p: IPlacing,
): void {
  const take: HumanPerformance | undefined = attempt(checks, body, p);
  if (take === undefined) return;
  const act: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
    take,
    "actor",
    "putDown",
  );
  const placed: number = motionActionUnit.event(act, "placed");
  const off: number = Vector3.distance(
    carriageScene.relative(take, p.bone, p.prop, placed).position,
    p.asked.position,
  );
  checks.check(
    `${p.label}: landed without a refusal, so at its asked frame (${(off * 1000).toFixed(1)} mm)`,
    off <= motionActionUnit.GRIP,
  );
  motionActionUnit.bounds(checks, p.label, take, "actor", act);
}

/**
 * The placing's take, or undefined when it is refused, the refusal checked to
 * be on reach.
 */
function attempt(
  checks: motionComplaints.IGatherer,
  body: IAutoMovieMotionHumanBody,
  p: IPlacing,
): HumanPerformance | undefined {
  try {
    const take: HumanPerformance = carriageScene.perform(
      p.label,
      body,
      p.props,
      p.chain,
    );
    take.bones("actor", take.duration);
    return take;
  } catch (error: unknown) {
    checks.check(
      `${p.label}: refused, and on reach (${everydayTake.describe(error)})`,
      error instanceof HumanRefusal && error.kind === "reach",
    );
    return undefined;
  }
}
