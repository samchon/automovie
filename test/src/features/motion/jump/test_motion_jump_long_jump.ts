import { createJumpPit } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieComposition,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAcrobatics,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { motionHumanBody } from "../../internal/motionHumanBody";

/** The planted-contact bound, metres (the campaign's 5 mm). */
const PLANT: number = 0.005;

/** The authored jump, metres from the take-off line to the heel marks. */
const DISTANCE: number = 2.6;

/**
 * Carry a sprint over the board into a long jump's flight and sand landing.
 *
 * Scenarios:
 *
 * 1. The run's last three planted feet hold their forefoot pivots within 5 mm, and
 *    the run is cut at the left foot's footfall behind the board's take-off
 *    line.
 * 2. The jump pushes off that left foot, held within 5 mm until `takeoff`, and
 *    leaves with no more horizontal speed than the run brought.
 * 3. Between `takeoff` and `touchdown` neither foot is planted; at the touchdown
 *    both heels lie within 30 mm of the authored distance from the take-off
 *    line and both feet bear on the pit.
 * 4. A footfall whose toe passes the line is a foul, refused on `approach`; a
 *    distance the sprint cannot bring is refused on `distance`; a long jump
 *    from standing is refused on `approach`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the run-up, take-off, flight, landing and refusal cases and their bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Composes run and long jump through the public chain over a real pit model and measures displayed feet, centre of mass, events and contact windows.
 * @evidence contracts/development/testing.md#independent-expectations The take-off line and sand are the archetype's, the foul and the heel-mark measure are the rules' (TR30), a take-off cannot gain horizontal speed, and the 5 mm and 30 mm bounds are the campaign's contact and placement tolerances.
 * @evidence contracts/development/testing.md#distinguishing-cases A legal footfall beside a foul one, an admitted distance beside an unreachable one, and a run beside a standing entry.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on the shared Human fixture, without a render or external process.
 */
export function test_motion_jump_long_jump(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const pit: ReturnType<typeof createJumpPit> = createJumpPit({ gap: 1 });
  const run: HumanPerformance = stage(body, pit, 40, undefined);
  const plain: IAutoMovieMotionHumanSegment = run.segments("a")[1]!;

  // The left footfall nearest 12 m down the runway, and its toe there.
  let cut: string = "";
  let toe: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  let best: number = Infinity;
  for (const event of plain.plan.events) {
    if (!event.name.startsWith("leftHeelStrike")) continue;
    const at: number = plain.start + event.share * plain.plan.duration;
    const point: IAutoMovieVector3 = socket(
      run,
      body,
      at + 1e-3,
      "left",
      "toe",
    );
    if (Math.abs(point.z - 12) < best) {
      best = Math.abs(point.z - 12);
      cut = event.name;
      toe = point;
    }
  }

  // 1-3. The take-off line 80 mm ahead of that toe.
  const line: number = toe.z + 0.08;
  const film: HumanPerformance = stage(body, pit, line, {
    cut,
    distance: DISTANCE,
  });
  assertTakeClean("long jump", film);
  const [, approach, leap]: readonly IAutoMovieMotionHumanSegment[] =
    film.segments("a");
  TestValidator.predicate(
    "the run is cut into the long jump",
    approach?.name === "run" && leap?.name === "longJump",
  );
  const plants: IAutoMovieMotionHumanContactWindow[] = approach!.plan.contacts
    .filter(
      (c: IAutoMovieMotionHumanContactWindow): boolean =>
        c.kind === "plant" &&
        approach!.start + c.from * approach!.plan.duration < leap!.start - 1e-6,
    )
    .sort(
      (
        a: IAutoMovieMotionHumanContactWindow,
        b: IAutoMovieMotionHumanContactWindow,
      ): number => a.from - b.from,
    )
    .slice(-3);
  for (const c of plants) {
    const side: AutoMovieHumanSide = c.part === "leftFoot" ? "left" : "right";
    const from: number =
      approach!.start + c.from * approach!.plan.duration + 1e-3;
    const to: number =
      Math.min(approach!.start + c.to * approach!.plan.duration, leap!.start) -
      1e-3;
    const slip: number = Vector3.distance(
      socket(film, body, from, side, "mtp"),
      socket(film, body, to, side, "mtp"),
    );
    TestValidator.predicate(
      `the run's ${c.part} stance from ${from.toFixed(2)} s holds its forefoot pivot (${(slip * 1000).toFixed(1)} mm)`,
      slip <= PLANT,
    );
  }
  const takeoff: number = when(leap!, "takeoff");
  const touchdown: number = when(leap!, "touchdown");
  const pushed: number = Vector3.distance(
    socket(film, body, leap!.start, "left", "mtp"),
    socket(film, body, takeoff - 1e-3, "left", "mtp"),
  );
  const first: IAutoMovieMotionHumanContactWindow | undefined =
    leap!.plan.contacts.find(
      (c: IAutoMovieMotionHumanContactWindow): boolean => c.from === 0,
    );
  TestValidator.predicate(
    `the jump pushes off the left foot the run planted (${(pushed * 1000).toFixed(1)} mm)`,
    first?.part === "leftFoot" &&
      pushed <= PLANT &&
      socket(film, body, leap!.start, "left", "toe").z <= line,
  );
  const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
    film,
    "a",
    body,
    0,
  );
  const velocity: (from: number, to: number) => number = (
    from: number,
    to: number,
  ): number =>
    (HumanSignature.centre(reader, to).z -
      HumanSignature.centre(reader, from).z) /
    (to - from);
  const brought: number = velocity(leap!.start - 0.05, leap!.start);
  const left: number = velocity(takeoff + 0.01, takeoff + 0.06);
  TestValidator.predicate(
    `the take-off keeps no more speed than the run brought (${left.toFixed(2)} of ${brought.toFixed(2)} m/s)`,
    left <= brought + 0.05,
  );
  const airborne: boolean = leap!.plan.contacts.every(
    (c: IAutoMovieMotionHumanContactWindow): boolean => {
      const a: number = leap!.start + c.from * leap!.plan.duration;
      const b: number = leap!.start + c.to * leap!.plan.duration;
      return b <= takeoff + 1e-6 || a >= touchdown - 1e-6;
    },
  );
  const marks: number[] = (["left", "right"] as const).map(
    (side: AutoMovieHumanSide): number =>
      socket(film, body, touchdown + 1e-3, side, "heel").z - line,
  );
  TestValidator.predicate(
    `the heels land at the distance (${marks.map((m: number): string => m.toFixed(3)).join(", ")} m)`,
    airborne &&
      marks.every((m: number): boolean => Math.abs(m - DISTANCE) <= 0.03),
  );
  const borne: boolean = (["leftFoot", "rightFoot"] as const).every(
    (part: IAutoMovieMotionHumanContactWindow["part"]): boolean =>
      leap!.plan.contacts.some(
        (c: IAutoMovieMotionHumanContactWindow): boolean =>
          c.part === part &&
          leap!.start + c.from * leap!.plan.duration >= touchdown - 1e-6 &&
          c.support.kind === "prop" &&
          c.support.subject === "pit",
      ),
  );
  TestValidator.predicate("both feet land on the pit", borne);

  // 4. The refusals.
  const refused: (
    line: number,
    plan: IStage | undefined,
  ) => HumanRefusal | undefined = (
    line: number,
    plan: IStage | undefined,
  ): HumanRefusal | undefined => {
    try {
      stage(body, pit, line, plan);
    } catch (error) {
      if (error instanceof HumanRefusal) return error;
      throw error;
    }
    return undefined;
  };
  const foul: HumanRefusal | undefined = refused(toe.z - 0.05, {
    cut,
    distance: DISTANCE,
  });
  TestValidator.predicate(
    "a toe past the take-off line is a foul",
    foul?.kind === "parameter" && foul.axis === "approach",
  );
  const far: HumanRefusal | undefined = refused(line, { cut, distance: 8 });
  TestValidator.predicate(
    "a distance the sprint cannot bring is refused",
    far?.axis === "distance",
  );
  const standing: HumanRefusal | undefined = refused(line, {
    cut: undefined,
    distance: DISTANCE,
  });
  TestValidator.predicate(
    "a long jump from standing is refused",
    standing?.axis === "approach",
  );
}

/**
 * How a take is staged: the run's cut, or none for a standing entry, and the
 * distance.
 */
interface IStage {
  /** The run's footfall event the jump cuts it at; absent jumps from standing. */
  cut: string | undefined;

  /** The authored distance, metres. */
  distance: number;
}

/** A sprint down the runway, cut into a long jump when staged. */
function stage(
  body: IAutoMovieMotionHumanBody,
  pit: ReturnType<typeof createJumpPit>,
  line: number,
  plan: IStage | undefined,
): HumanPerformance {
  const start: ReturnType<typeof HumanChain.subject> = HumanChain.subject(
    "a",
  ).stand({ hold: 0.3, sway: 0 });
  const running: ReturnType<typeof HumanChain.subject> = start.run({
    to: { x: 0, y: 0, z: 30 },
    pace: "sprint",
  });
  const node: IAutoMovieComposition =
    plan === undefined
      ? running.node
      : plan.cut === undefined
        ? start.registered("longJump", { pit: "pit", distance: plan.distance })
            .node
        : running
            .until({ event: plan.cut })
            .registered("longJump", { pit: "pit", distance: plan.distance })
            .node;
  return new HumanPerformance({
    seed: "long-jump",
    laws: [AutoMovieMotionHumanAcrobatics.HumanGymnastics.longJump],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      HumanObject.prop("pit", pit, { at: { x: 0, y: 0, z: line }, yaw: 0 }),
    ],
    composition: node,
  });
}

/** The absolute film second of a required event. */
function when(segment: IAutoMovieMotionHumanSegment, name: string): number {
  const event:
    | IAutoMovieMotionHumanSegment["plan"]["events"][number]
    | undefined = segment.plan.events.find(
    (
      candidate: IAutoMovieMotionHumanSegment["plan"]["events"][number],
    ): boolean => candidate.name === name,
  );
  if (event === undefined)
    throw new Error(segment.name + " has no " + name + " event");
  return segment.start + event.share * segment.plan.duration;
}

/** A displayed foot socket at a film second. */
function socket(
  film: HumanPerformance,
  body: IAutoMovieMotionHumanBody,
  time: number,
  side: AutoMovieHumanSide,
  point: Parameters<typeof HumanFoot.point>[2],
): IAutoMovieVector3 {
  const foot: IAutoMovieResolvedBone = film
    .bones("a", time)
    .get(`${side}Foot`)!;
  return HumanFoot.point(body, side, point, {
    ankle: foot.worldPosition,
    rotation: foot.worldRotation,
  });
}
