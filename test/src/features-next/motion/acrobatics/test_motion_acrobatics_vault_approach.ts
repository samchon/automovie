import {
  createLandingMat,
  createPlyoBox,
  createSpringboard,
} from "@automovie/archetypes";
import type {
  IAutoMovieComposition,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAcrobatics,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * Carry a vault from its run-up over the springboard and the table onto the
 * landing mat.
 *
 * Scenarios:
 * 1. A jogged run-up is cut at a left footfall before the springboard and
 *    hurdles onto it: both feet land on the board's top, inside its length
 *    and width, and bear on the board.
 * 2. From the board the gymnast's hands come down on the table's top and
 *    bear on the table, then the feet land on the mat and bear on it: the
 *    ground, the board, the table and the mat own the supports in that
 *    order.
 * 3. The same take with the table a metre further away is refused on `on`:
 *    the hands would come down off its top.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the phases, the supports in order and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Composes run, board hurdle and vault through the public chain over real board, table and mat models, reading displayed feet and contact windows.
 * @evidence contracts/development/testing.md#independent-expectations The board's and table's tops are the archetypes' own; the support order is the vault's (FIG Code of Points: run, board, table, landing).
 * @evidence contracts/development/testing.md#distinguishing-cases A table within the hands' reach beside one out of it.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on the shared Human fixture, without a render or external process.
 */
export function test_motion_acrobatics_vault_approach(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("f-average");
  const board: ReturnType<typeof createSpringboard> = createSpringboard();
  const plain: HumanPerformance = stage(body, board, 30, 0, undefined);
  const run: IAutoMovieMotionHumanSegment = plain.segments("a")[1]!;

  // The left footfall nearest 8 m down the runway; the board 1.3 m beyond.
  let cut: string = "";
  let ankle: number = 0;
  for (const event of run.plan.events) {
    if (!event.name.startsWith("leftHeelStrike")) continue;
    const at: number = run.start + event.share * run.plan.duration + 1e-3;
    const z: number = plain.bones("a", at).get("leftFoot")!.worldPosition.z;
    if (Math.abs(z - 8) < Math.abs(ankle - 8)) {
      ankle = z;
      cut = event.name;
    }
  }
  const boardAt: number = ankle + 1.3;
  const film: HumanPerformance = stage(body, board, boardAt, 0, cut);
  assertTakeClean("vault approach", film);
  const [, , hurdle, vault]: readonly IAutoMovieMotionHumanSegment[] =
    film.segments("a");

  // 1. The hurdle onto the board.
  const touchdown: number = when(hurdle!, "touchdown");
  const top: ReturnType<typeof board.affordance> = board.affordance("surface");
  for (const side of ["left", "right"] as const) {
    const foot: IAutoMovieVector3 = film
      .bones("a", touchdown + 1e-3)
      .get(`${side}Foot`)!.worldPosition;
    TestValidator.predicate(
      `the ${side} foot lands on the board's top`,
      Math.abs(foot.x) <= top.width! / 2 &&
        Math.abs(foot.z - boardAt) <= top.depth! / 2,
    );
  }
  const subjects: string[] = [hurdle!, vault!]
    .flatMap((s: IAutoMovieMotionHumanSegment): string[] =>
      [...s.plan.contacts]
        .sort(
          (
            a: IAutoMovieMotionHumanContactWindow,
            b: IAutoMovieMotionHumanContactWindow,
          ): number => a.from - b.from,
        )
        .map((c: IAutoMovieMotionHumanContactWindow): string =>
          c.support.kind === "prop" ? c.support.subject : "ground",
        ),
    )
    .filter((s: string, i: number, all: string[]): boolean => s !== all[i - 1]);

  // 2. Ground, board, table, mat.
  const order: number[] = ["board", "table", "mat"].map((s: string): number =>
    subjects.indexOf(s),
  );
  TestValidator.predicate(
    `the supports pass from the board to the table to the mat (${subjects.join(" > ")})`,
    order.every((i: number): boolean => i >= 0) &&
      order[0]! < order[1]! &&
      order[1]! < order[2]!,
  );

  // 3. A table out of reach.
  let refused: HumanRefusal | undefined;
  try {
    stage(body, board, boardAt, 1, cut);
  } catch (error) {
    if (!(error instanceof HumanRefusal)) throw error;
    refused = error;
  }
  TestValidator.predicate(
    "a table beyond the hands' reach is refused",
    refused?.axis === "on",
  );
}

/** A jog down the runway, hurdled onto the board at a footfall and vaulted over the table onto the mat when the footfall is given. */
function stage(
  body: IAutoMovieMotionHumanBody,
  board: ReturnType<typeof createSpringboard>,
  boardAt: number,
  further: number,
  cut: string | undefined,
): HumanPerformance {
  const top: number = board.affordance("surface").frame.translation.y;
  const table: ReturnType<typeof createPlyoBox> = createPlyoBox({
    kind: "wood",
    height: 0.762,
    width: 0.762,
    depth: 0.762,
  });
  // The lunge from the board brings the hands about 1.35 m ahead of the
  // board's middle (read off this take); the table's middle stands 0.25 m
  // short of that, so the hands come down inside its top.
  const tableAt: number = boardAt + 1.1 + further;
  const running: ReturnType<typeof HumanChain.subject> = HumanChain.subject("a")
    .stand({ hold: 0.3, sway: 0 })
    .run({ to: { x: 0, y: 0, z: 30 }, pace: "jog" });
  const node: IAutoMovieComposition =
    cut === undefined
      ? running.node
      : running
          .until({ event: cut })
          .jump({ to: { x: 0, y: top, z: boardAt }, on: "board" })
          .registered("handspringVault", { on: "table", landOn: "mat" }).node;
  return new HumanPerformance({
    seed: "vault-approach",
    laws: [AutoMovieMotionHumanAcrobatics.HumanGymnastics.handspringVault],
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
      HumanObject.prop("board", board, {
        at: { x: 0, y: 0, z: boardAt },
        yaw: 0,
      }),
      HumanObject.prop("table", table, {
        at: { x: 0, y: 0, z: tableAt },
        yaw: 0,
      }),
      HumanObject.prop("mat", createLandingMat({ kind: "highJump" }), {
        at: { x: 0, y: 0, z: tableAt + 3 },
        yaw: 0,
      }),
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
