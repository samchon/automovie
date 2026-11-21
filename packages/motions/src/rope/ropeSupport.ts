import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanRope,
  IAutoMovieMotionHumanSupport,
  IAutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { support } from "../actions/support";
import { getUp } from "../floor/getUp";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { ropeLine } from "./ropeLine";

/** One hand's move along the rope, arm lengths (provisional: a hand-over-hand pull). */
const STEP: number = 0.45;

/** Seconds per hand or foot move on the rope (provisional). */
const BEAT: number = 0.6;

/** The locked feet below the lower hand, hip heights (provisional: knees drawn up to the lock). */
const LOCK: number = 0.95;

/** The fastest descent when none is asked, metres per second (provisional). */
const SPEED: number = 1;

/** A foot's offset from the rope in a lock, metres (provisional: the rope between the feet). */
const SPLIT: number = 0.04;

/**
 * Hand-over-hand rope crossings fitted by the shared support law: a climb
 * moves one hand up a step at a time and draws the locked feet up after
 * both; a descent replays the climb's stances downward, each move taking no
 * less than its step at the speed bound; a traverse moves the hands along a
 * level rope, the feet hanging or, in a monkey crawl, hooked over it behind.
 * Every contact is a point of the named line.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three crossings, their timing and their contacts.
 * @evidence contracts/development/design.md#principled-representation Three planners over the line record and the support law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The crossings planRope dispatches to.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every contact is on the line; the support law refuses a key that misses one.
 */
export namespace ropeSupport {
  /**
   * Climb or descend an upright rope.
   *
   * @param context The action's context, standing at the rope's foot or hanging on it.
   * @param p The climb or the descent.
   * @returns The crossing.
   * @throws {HumanRefusal} If the rope is too short for the rise or the descent's start.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the stances, the order, the speed rule and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Hand points rise a step each along the line; the lock follows the lower hand; a descent's moves take step over speed seconds at least, so the hands never outrun the bound.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Stage the points, build the stances, then the support plan.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rise past the anchor refuses; the step constants are provisional and stated as such.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the steps; each stance fitted once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Staged points are looked up by name.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the staged points for the plan's lifetime.
   */
  export function upright(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRope.IParams>,
    p: IAutoMovieMotionHumanRope.IClimb | IAutoMovieMotionHumanRope.IDescend,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const measure: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const line: ropeLine.ILine = ropeLine.read(context, p.rope, p.line);
    const arm: number = measure.upperArm + measure.forearm;
    const step: number = STEP * arm;
    const floor: number = line.low.y;
    const start: number = floor + measure.shoulderHeight + 0.5 * arm;
    // A descent starts where the entering hands hold the rope.
    const holding: ReturnType<typeof poseBones> = poseBones(
      body,
      context.entry.pose,
    );
    const rise: number =
      p.kind === "climb"
        ? p.rise
        : Math.max(
            holding.get("leftHand")!.worldPosition.y,
            holding.get("rightHand")!.worldPosition.y,
          ) - start;
    const top: number = start + Math.max(0, rise);
    if (top > line.high.y)
      throw ropeLine.refusal(
        p.kind === "climb" ? "rise" : "line",
        p.kind === "climb" ? p.rise : p.line,
        `the rope is ${(top - line.high.y).toFixed(3)} m too short`,
      );

    const staged: Map<string, IAutoMovieVector3> = new Map();
    const lateral: IAutoMovieVector3 = HumanFrame.forward(
      context.entry.posture.yaw + 90,
    );
    const on = (
      key: string,
      height: number,
      offset: number,
    ): IAutoMovieMotionTarget => {
      staged.set(
        key,
        Vector3.add(
          ropeLine.atHeight(line, height),
          Vector3.scale(lateral, offset),
        ),
      );
      return { kind: "prop", subject: p.rope, point: key };
    };
    const hand = (
      side: AutoMovieHumanSide,
      height: number,
    ): IAutoMovieMotionHumanSupport.IContact => ({
      part: `${side}Hand`,
      kind: "grip",
      target: on(`${side}Hand${height.toFixed(3)}`, height, 0),
    });
    const lock = (
      side: AutoMovieHumanSide,
      height: number,
    ): IAutoMovieMotionHumanSupport.IContact => ({
      part: `${side}Foot`,
      kind: "bear",
      target: on(
        `${side}Foot${height.toFixed(3)}`,
        height,
        side === "left" ? SPLIT : -SPLIT,
      ),
    });
    const entry: ReturnType<typeof poseBones> = poseBones(
      body,
      context.entry.pose,
    );
    const ground = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanSupport.IContact => ({
      part: `${side}Foot`,
      kind: "bear",
      target: {
        kind: "point",
        frame: "world",
        at: entry.get(`${side}Toes`)!.worldPosition,
        normal: { x: 0, y: 1, z: 0 },
      },
    });

    // The climb: grip, lock, then each cycle a right and a left hand step
    // and the lock drawn up below the lower hand.
    const climb: IAutoMovieMotionHumanSupport.IStance[] = [];
    let right: number = start;
    let left: number = start - step;
    const footAt = (): number =>
      Math.min(right, left) - LOCK * measure.hipHeight;
    climb.push({
      contacts: [ground("left"), ground("right")],
      seconds: BEAT,
      event: "floor",
      prefer: getUp.POSES.stood,
    });
    climb.push({
      contacts: [
        ground("left"),
        ground("right"),
        hand("right", right),
        hand("left", left),
      ],
      seconds: BEAT,
      event: "grip",
    });
    climb.push({
      contacts: [
        hand("right", right),
        hand("left", left),
        lock("left", footAt()),
        lock("right", footAt()),
      ],
      seconds: BEAT,
      event: "lock",
    });
    while (Math.min(right, left) < top - step) {
      if (right <= left) right += 2 * step;
      else left += 2 * step;
      const held: IAutoMovieMotionHumanSupport.IContact[] = climb
        .at(-1)!
        .contacts.filter((c: IAutoMovieMotionHumanSupport.IContact): boolean =>
          c.part.endsWith("Foot"),
        );
      climb.push({
        contacts: [hand("right", right), hand("left", left), ...held],
        seconds: BEAT,
        event: `hand${climb.length}`,
      });
      climb.push({
        contacts: [
          hand("right", right),
          hand("left", left),
          lock("left", footAt()),
          lock("right", footAt()),
        ],
        seconds: BEAT,
        event: `lock${climb.length}`,
      });
    }

    if (p.kind === "climb")
      return {
        ...support.plan({
          ...context,
          params: { stances: climb },
          aim: aimAt(context, p.rope, staged),
        }),
        base: { kind: "standing" },
      };

    // A descent replays the climb downward from its last stance, each move no
    // faster than the bound, and lets go on the floor.
    const speed: number = p.speed ?? SPEED;
    if (!(speed > 0))
      throw ropeLine.refusal(
        "speed",
        speed,
        "a descent needs a positive speed bound",
      );
    const seconds: number = Math.max(BEAT, step / speed);
    const descent: IAutoMovieMotionHumanSupport.IStance[] = [...climb]
      .reverse()
      .map(
        (
          stance: IAutoMovieMotionHumanSupport.IStance,
          i: number,
        ): IAutoMovieMotionHumanSupport.IStance => ({
          ...stance,
          seconds,
          event: i === 0 ? "onRope" : stance.event,
        }),
      );
    descent.push({
      contacts: [ground("left"), ground("right")],
      seconds: BEAT,
      event: "release",
      prefer: getUp.POSES.stood,
    });
    return {
      ...support.plan({
        ...context,
        params: { stances: descent },
        aim: aimAt(context, p.rope, staged),
      }),
      base: { kind: "standing" },
    };
  }

  /**
   * Traverse a level rope hand over hand.
   *
   * @param context The action's context, standing under the rope.
   * @param p The traverse.
   * @returns The crossing.
   * @throws {HumanRefusal} If the distance runs past the rope's ends or the rope is beyond the standing reach.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the stances, the hang and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Hand points advance a step at a time along the line; a monkey crawl hooks both feet over the line behind the rear hand.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Stage the points, build the stances, then the support plan.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A distance past an end refuses; the step constants are provisional and stated as such.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the steps; each stance fitted once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Staged points are looked up by name.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the staged points for the plan's lifetime.
   */
  export function level(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRope.IParams>,
    p: IAutoMovieMotionHumanRope.ITraverseRope,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const measure: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const line: ropeLine.ILine = ropeLine.read(context, p.rope, p.line);
    const arm: number = measure.upperArm + measure.forearm;
    const step: number = STEP * arm;
    const reach: number = measure.shoulderHeight + arm;
    if (line.low.y - context.entry.posture.root.y > reach)
      throw ropeLine.refusal(
        "line",
        p.line,
        "the rope is beyond the standing reach",
      );
    const here: number = Vector3.dot(
      Vector3.subtract(context.entry.posture.root, line.low),
      line.axis,
    );
    const end: number = here + p.along;
    if (end < 0 || end > line.length)
      throw ropeLine.refusal(
        "along",
        p.along,
        "the traverse runs past the rope's end",
      );
    const sign: number = p.along >= 0 ? 1 : -1;
    const staged: Map<string, IAutoMovieVector3> = new Map();
    const at = (key: string, s: number): IAutoMovieMotionTarget => {
      staged.set(
        key,
        Vector3.add(
          line.low,
          Vector3.scale(line.axis, Math.max(0, Math.min(line.length, s))),
        ),
      );
      return { kind: "prop", subject: p.rope, point: key };
    };
    const hand = (
      side: AutoMovieHumanSide,
      s: number,
    ): IAutoMovieMotionHumanSupport.IContact => ({
      part: `${side}Hand`,
      kind: "grip",
      target: at(`${side}Hand${s.toFixed(3)}`, s),
    });
    const hook = (
      side: AutoMovieHumanSide,
      s: number,
    ): IAutoMovieMotionHumanSupport.IContact => ({
      part: `${side}Foot`,
      kind: "bear",
      target: at(`${side}Foot${s.toFixed(3)}`, s),
    });
    const entry: ReturnType<typeof poseBones> = poseBones(
      body,
      context.entry.pose,
    );
    const ground = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanSupport.IContact => ({
      part: `${side}Foot`,
      kind: "bear",
      target: {
        kind: "point",
        frame: "world",
        at: entry.get(`${side}Toes`)!.worldPosition,
        normal: { x: 0, y: 1, z: 0 },
      },
    });
    const monkey: boolean = p.style === "monkey";
    let lead: number = here + (sign * step) / 2;
    let rear: number = here - (sign * step) / 2;
    const feet = (): IAutoMovieMotionHumanSupport.IContact[] =>
      monkey
        ? [
            hook("left", rear - sign * LOCK * measure.hipHeight),
            hook("right", rear - sign * LOCK * measure.hipHeight),
          ]
        : [];
    const stances: IAutoMovieMotionHumanSupport.IStance[] = [
      {
        contacts: [
          ground("left"),
          ground("right"),
          hand("right", lead),
          hand("left", rear),
        ],
        seconds: BEAT,
        event: "grip",
      },
      {
        contacts: [hand("right", lead), hand("left", rear), ...feet()],
        seconds: BEAT,
        event: "hang",
      },
    ];
    while (sign * (end - lead) > 1e-6) {
      const next: number =
        sign > 0
          ? Math.min(end, rear + 2 * step)
          : Math.max(end, rear - 2 * step);
      rear = lead;
      lead = next;
      stances.push({
        contacts: [hand("right", lead), hand("left", rear), ...feet()],
        seconds: BEAT,
        event: `move${stances.length}`,
      });
    }
    return support.plan({
      ...context,
      params: { stances },
      aim: aimAt(context, p.rope, staged),
    });
  }

  /** Aim a staged rope point, else the context's own target. */
  function aimAt(
    context: IAutoMovieMotionHumanActionContext,
    rope: string,
    staged: ReadonlyMap<string, IAutoMovieVector3>,
  ): IAutoMovieMotionHumanActionContext["aim"] {
    return (reference: IAutoMovieMotionTarget, seconds: number) => {
      const point: IAutoMovieVector3 | undefined =
        reference.kind === "prop" && reference.subject === rope
          ? staged.get(reference.point)
          : undefined;
      return point === undefined
        ? context.aim(reference, seconds)
        : { point, normal: { x: 0, y: 1, z: 0 } };
    };
  }
}
