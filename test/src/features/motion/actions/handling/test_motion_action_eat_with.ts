import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";

import { diningScene } from "../../../internal/diningScene";
import { diningTable } from "../../../internal/diningTable";
import { everydayTake } from "../../../internal/everydayTake";
import { motionActionUnit } from "../../../internal/motionActionUnit";
import { motionComplaints } from "../../../internal/motionComplaints";
import { motionHumanBody } from "../../../internal/motionHumanBody";

/**
 * How near a bite's working point comes to the head bone at the bite's middle,
 * metres: the dining scenarios' 0.15 m, read against the same bone
 * (`diningTable.mouth`).
 */
const BITE: number = 0.15;

/** The lift the dining scenes ask after each grasp, metres: theirs. */
const ASKED: number = 0.05;

/** One bite: the tool, its working point and the hand that holds it. */
interface IBite {
  /** The case, for failures. */
  label: string;

  /** The diner's body. */
  body: IAutoMovieMotionHumanBody;

  /** The take. */
  take: HumanPerformance;

  /** The held tool. */
  tool: string;

  /** The tool's model, for its working point. */
  model: everydayTake.IPosable;

  /** The working point. */
  point: string;

  /** The hand. */
  side: AutoMovieHumanSide;
}

/**
 * EatWith's own goal, the one owner of it: a held tool's working point brought
 * to the mouth and the tool kept in the hand through the bite, whatever the
 * tool carries. The dining scenarios read only what the bite carries (the
 * morsel between the tips, the cut piece on the fork) as it is handed on from
 * the take before it.
 *
 * Scenarios, seated at the dining scenes' table, the dominant hand right on the
 * average man and left on the small woman, each case gathering its own result:
 *
 * 1. Chopsticks in the dominant hand, their tips the working point
 *    (`test_motion_dining_utensils_chopsticks`).
 * 2. A fork in the other hand, its face the working point
 *    (`test_motion_dining_utensils_cut`).
 *
 * In each, at the bite's middle the working point lies within the scenarios'
 * 0.15 m of the head bone they read the mouth by; the tool rides the hand
 * through the bite within 5 mm; and the bite keeps the shipped bounds over its
 * span. Each tool is taken up just before the bite, nothing on it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the one goal this spec owns, the cases, the entry and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs sit > pickUp > eatWith and reads the tool's displayed working point against the displayed head bone, the tool in the hand's frame and the verdict report over the bite's span; a point short of the mouth, a tool sliding or a finding in the bite fails.
 * @evidence contracts/development/testing.md#independent-expectations The mouth bound is the dining scenarios' 0.15 m against the head bone; the custody bound is the everyday prop specs' 5 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Two tools in opposite hands on two statures; the food a bite carries is the dining scenarios', the tool's grasp `test_motion_action_pick_up`'s.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of one polygon man with the dining props, entered through `test_motion_action_eat_with`.
 */
export function test_motion_action_eat_with(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const)
    for (const stage of [sticks, fork]) {
      const label: string = `${name} ${stage.name}`;
      try {
        bite(checks, stage(motionHumanBody(name), name));
      } catch (error: unknown) {
        checks.check(`${label}: ${everydayTake.describe(error)}`, false);
      }
    }
  checks.assert("eatWith brings the tool's point to the mouth and keeps it");
}

/** The dining scenes' dominant hand: right on the man, left on the woman. */
function dominant(name: motionHumanBody.Name): AutoMovieHumanSide {
  return name === "m-average" ? "right" : "left";
}

/** Chopsticks in the dominant hand, brought to the mouth by their tips. */
function sticks(
  body: IAutoMovieMotionHumanBody,
  name: motionHumanBody.Name,
): IBite {
  const side: AutoMovieHumanSide = dominant(name);
  const s: diningScene.IChopsticks = diningScene.chopsticks(body, side);
  return {
    label: `${name} bites with the chopsticks`,
    body,
    take: diningScene.perform(
      `${name} chopsticks chopsticks`,
      body,
      s.props,
      HumanChain.subject("actor")
        .sit({ seat: s.stage.seat, hold: 1 })
        .pickUp({ prop: "sticks", handle: "grip", hand: side, lift: ASKED })
        .registered("eatWith", { held: "sticks", point: "tips", hand: side }),
    ),
    tool: "sticks",
    model: s.models.sticks!,
    point: "tips",
    side,
  };
}

/** A fork in the other hand, brought to the mouth by its face. */
function fork(
  body: IAutoMovieMotionHumanBody,
  name: motionHumanBody.Name,
): IBite {
  const s: diningScene.ICut = diningScene.cut(dominant(name));
  return {
    label: `${name} bites with the fork`,
    body,
    take: diningScene.perform(
      `${name} knife and fork cut`,
      body,
      s.props,
      HumanChain.subject("actor")
        .sit({ seat: s.stage.seat, hold: 1 })
        .pickUp({ prop: "fork", handle: "grip", hand: s.other, lift: ASKED })
        .registered("eatWith", { held: "fork", point: "face", hand: s.other }),
    ),
    tool: "fork",
    model: s.models.fork!,
    point: "face",
    side: s.other,
  };
}

/** One bite's checks. */
function bite(checks: motionComplaints.IGatherer, b: IBite): void {
  const act: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
    b.take,
    "actor",
    "eatWith",
  );
  const middle: number = (act.start + act.end) / 2;
  const off: number = Vector3.distance(
    everydayTake.point(b.take, b.model, b.tool, b.point, middle),
    diningTable.mouth(b.take, middle),
  );
  checks.check(
    `${b.label}: the ${b.point} reach the mouth (${(off * 1000).toFixed(0)} mm from the head bone)`,
    off <= BITE,
  );
  const drift: number = everydayTake.drift(
    b.take,
    b.side,
    b.tool,
    act.start,
    act.end,
  );
  checks.check(
    `${b.label}: the ${b.tool} rides the hand through the bite (${(drift * 1000).toFixed(1)} mm)`,
    drift <= motionActionUnit.HOLD,
  );
  motionActionUnit.bounds(checks, b.label, b.take, "actor", act);
}
