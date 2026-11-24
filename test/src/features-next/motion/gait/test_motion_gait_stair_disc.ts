import { createStairs } from "@automovie/archetypes";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanClimbStairs,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The disc's turning rate, degrees per second (provisional): a roundabout turned slowly for boarding, its deck 0.28 m/s at the step, far under the 5 m/s peripheral speed EN 1176-5 allows a roundabout; boarding a faster deck asks the boarder to step along with it, which this climb does not stage. */
const RATE: number = 8;

/** The disc's centre, world metres: the step's deck lies at its rim. */
const CENTRE: IAutoMovieVector3 = { x: 0, y: 0, z: 2 };

/** A grounded foot's largest travel over its plant, metres: the plant audit's 5 mm. */
const STILL: number = 0.005;

/**
 * One step up onto a turning disc's raised deck (`climbStairs` with `on`
 * naming a moving prop).
 *
 * Scenarios, on the average man and the small woman:
 * 1. The foot still on the floor stays where it stands in the world through
 *    its plant, though the disc turns under the stepping foot.
 * 2. The foot on the tread is carried by the disc from its touchdown: its
 *    toes stay put in the disc's frame through that plant.
 * Every take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staging, the two feet's frames and the verdicts.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed toes over each plant window, in the world for the floor and in the disc's frame for the tread.
 * @evidence contracts/development/testing.md#independent-expectations The disc's frame is the scene's own course; the floor is the world.
 * @evidence contracts/development/testing.md#distinguishing-cases A floor plant and a tread plant, two bodies.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain.
 */
export function test_motion_gait_stair_disc(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const riser: number = 0.17;
  const tread: number = 0.3;
  const model: ReturnType<typeof createStairs> = createStairs({
    // A flight has at least two risers; the climb takes the first.
    steps: 2,
    riser,
    tread,
  });
  // The deck turns about the disc's centre at `RATE`.
  const placed: (seconds: number) => IAutoMovieMotionHumanObject.Placement = (
    seconds: number,
  ): IAutoMovieMotionHumanObject.Placement => {
    const a: number = (RATE * seconds * Math.PI) / 180;
    return {
      at: {
        x: CENTRE.x - Math.sin(a) * CENTRE.z,
        y: 0,
        z: CENTRE.z - Math.cos(a) * CENTRE.z,
      },
      yaw: RATE * seconds,
    };
  };
  const deck: IAutoMovieMotionHumanProp = HumanObject.prop(
    "deck",
    model,
    placed(0),
    placed,
  );
  for (const fit of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(fit);
    const performer = {
      subject: "a",
      body,
      at: { x: 0, y: 0, z: -0.45 },
      yaw: 0,
      proficiency: { level: "trained" as const },
    };
    const standing: HumanPerformance = new HumanPerformance({
      seed: "stair-disc-standing",
      performers: [performer],
      composition: HumanChain.subject("a").stand({ hold: 0.25 }).node,
    });
    const entered = standing.bones("a", 0);
    const start: number = -Math.max(
      HumanFoot.sockets(body, entered, "left")[2]!.point.z,
      HumanFoot.sockets(body, entered, "right")[2]!.point.z,
    );
    try {
      const p: IAutoMovieMotionHumanClimbStairs.IParams = {
        count: 1,
        riser,
        tread,
        start,
        on: "deck",
      };
      const take: HumanPerformance = new HumanPerformance({
        seed: "stair-disc",
        performers: [performer],
        props: [deck],
        composition: HumanChain.subject("a").climbStairs(p).node,
      });
      assertTakeClean(`${fit} step onto a turning disc`, take);
      const climb: IAutoMovieMotionHumanSegment = take.segments("a")[0]!;
      const span: number = climb.end - climb.start;
      const toes: (
        part: IAutoMovieMotionHumanContactWindow["part"],
        seconds: number,
      ) => IAutoMovieVector3 = (
        part: IAutoMovieMotionHumanContactWindow["part"],
        seconds: number,
      ): IAutoMovieVector3 =>
        take
          .bones("a", seconds)
          .get(part === "leftFoot" ? "leftToes" : "rightToes")!.worldPosition;
      for (const window of climb.plan.contacts.filter(
        (w: IAutoMovieMotionHumanContactWindow): boolean =>
          (w.part === "leftFoot" || w.part === "rightFoot") &&
          w.kind === "plant",
      )) {
        const part: IAutoMovieMotionHumanContactWindow["part"] = window.part;
        const from: number = climb.start + window.from * span;
        const to: number = climb.start + Math.min(window.to, 1) * span;
        if (!(to > from)) continue;
        const a: IAutoMovieVector3 = toes(part, from);
        const b: IAutoMovieVector3 = toes(part, to);
        if (window.support.kind === "ground") {
          const moved: number = Math.hypot(b.x - a.x, b.z - a.z);
          all.check(
            `${fit} the ${part} on the floor stays in the world (${(moved * 1000).toFixed(1)} mm)`,
            moved <= STILL,
          );
        } else {
          // In the disc's frame: undo its turn about the centre.
          const local: (
            q: IAutoMovieVector3,
            seconds: number,
          ) => IAutoMovieVector3 = (
            q: IAutoMovieVector3,
            seconds: number,
          ): IAutoMovieVector3 => {
            const r: number = (-RATE * seconds * Math.PI) / 180;
            const dx: number = q.x - CENTRE.x;
            const dz: number = q.z - CENTRE.z;
            return {
              x: dx * Math.cos(r) + dz * Math.sin(r),
              y: q.y,
              z: -dx * Math.sin(r) + dz * Math.cos(r),
            };
          };
          const la: IAutoMovieVector3 = local(a, from);
          const lb: IAutoMovieVector3 = local(b, to);
          const moved: number = Math.hypot(lb.x - la.x, lb.z - la.z);
          all.check(
            `${fit} the ${part} on the tread rides the disc (${(moved * 1000).toFixed(1)} mm)`,
            moved <= STILL,
          );
        }
      }
    } catch (error: unknown) {
      all.check(`${fit} step onto a turning disc: ${String(error)}`, false);
    }
  }
  all.assert("stair disc");
}
