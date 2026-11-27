import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanRope,
  IAutoMovieMotionHumanSupport,
  IAutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { support } from "../../actions/internal/support";
import { HumanHand } from "../../posture/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { ropeLine } from "./ropeLine";
import { ropeSupport } from "./ropeSupport";

/**
 * How far behind the rear hand a monkey crawl hooks its feet over a level rope,
 * hip heights (provisional: the shoulders to the hooked ankles with the knees
 * bent).
 */
const HOOKED: number = 1.2;

/**
 * The hanging tuck of a traverse: the hips and knees drawn up clear of what the
 * body stood on, the arms up on the line with the elbows bent (provisional
 * angles, degrees).
 */
const TUCK: IAutoMovieMotionHumanLieDown.IPose = {
  pitch: 0,
  roll: 0,
  joints: {
    ...HumanHand.shape("left", "fist"),
    ...HumanHand.shape("right", "fist"),
    leftUpperLeg: [70, 5, 0],
    rightUpperLeg: [70, 5, 0],
    leftLowerLeg: [100, 0, 0],
    rightLowerLeg: [100, 0, 0],
    leftUpperArm: [160, 20, 0],
    rightUpperArm: [160, 20, 0],
    leftLowerArm: [30, 0, 0],
    rightLowerArm: [30, 0, 0],
  },
};
/**
 * Traverse a level rope hand over hand.
 *
 * @param context The action's context, standing under the rope.
 * @param p The traverse.
 * @returns The crossing.
 * @throws {HumanRefusal} If the distance runs past the rope's ends or the rope
 *   is beyond the standing reach.
 */
export function ropeTraverse(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRope.IParams>,
  p: IAutoMovieMotionHumanRope.ITraverseRope,
): IAutoMovieMotionHumanActionPlan {
  const body: IAutoMovieMotionHumanBody = context.body;
  const measure: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const line: ropeLine.ILine = ropeLine.read(context, p.rope, p.line);
  const arm: number = measure.upperArm + measure.forearm;
  const step: number = ropeSupport.STEP * arm;
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
  const lead: number = here + (sign * step) / 2;
  let rear: number = here - (sign * step) / 2;
  const feet = (): IAutoMovieMotionHumanSupport.IContact[] =>
    monkey
      ? [
          hook("left", rear - sign * HOOKED * measure.hipHeight),
          hook("right", rear - sign * HOOKED * measure.hipHeight),
        ]
      : [];
  // The hanging body tucks clear of what it stood on; a monkey crawl's
  // hooked feet shape it instead.
  const hanging: IAutoMovieMotionHumanLieDown.IPose | undefined = monkey
    ? undefined
    : TUCK;
  let right: number = lead;
  let left: number = rear;
  const stances: IAutoMovieMotionHumanSupport.IStance[] = [
    {
      contacts: [
        ground("left"),
        ground("right"),
        hand("right", right),
        hand("left", left),
      ],
      seconds: ropeSupport.BEAT,
      event: "grip",
    },
    // The feet leave the stand one at a time into the hang; a monkey crawl
    // then swings them up over the rope one at a time.
    {
      contacts: [ground("right"), hand("right", right), hand("left", left)],
      seconds: ropeSupport.BEAT,
      event: "leftOff",
    },
    {
      contacts: [hand("right", right), hand("left", left)],
      seconds: ropeSupport.BEAT,
      event: "hang",
      prefer: TUCK,
    },
    ...(monkey
      ? [
          {
            contacts: [hand("right", right), hand("left", left), feet()[0]!],
            seconds: ropeSupport.BEAT,
            event: "hookLeft",
          },
          {
            contacts: [hand("right", right), hand("left", left), ...feet()],
            seconds: ropeSupport.BEAT,
            event: "hookRight",
          },
        ]
      : []),
  ];
  // Hand over hand: the rear hand passes the front one by a step, until the
  // front hand reaches the end.
  while (
    sign * (end - (sign > 0 ? Math.max(right, left) : Math.min(right, left))) >
    1e-6
  ) {
    if (sign * (right - left) < 0)
      right =
        sign > 0 ? Math.min(end, left + step) : Math.max(end, left - step);
    else
      left =
        sign > 0 ? Math.min(end, right + step) : Math.max(end, right - step);
    rear = sign > 0 ? Math.min(right, left) : Math.max(right, left);
    stances.push({
      contacts: [hand("right", right), hand("left", left), ...feet()],
      seconds: ropeSupport.BEAT,
      event: `move${stances.length}`,
      ...(hanging === undefined ? {} : { prefer: hanging }),
    });
  }
  return support.plan({
    ...context,
    params: { stances },
    aim: ropeLine.aim(context, p.rope, staged, line),
  });
}
