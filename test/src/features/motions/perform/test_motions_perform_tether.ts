import type {
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanTether,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import {
  HumanPerformanceTether,
  HumanRefusal,
  humanTetherCatenary,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { actingPerformanceState } from "../../internal/fixtures/actingPerformanceState";
import { testAffordance } from "../../internal/fixtures/testAffordance";

/**
 * How far a line's end, length or pulled place may stand from its closed form,
 * metres: a few sums and a reel's product, far above their rounding.
 */
const LINE: number = 1e-12;

/** A point. */
const P = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });

/**
 * `HumanPerformanceTether` lays the lines between props: `span` reads a line's
 * ends, length, tautness and drawn points; `pull` draws a resting far prop to
 * its lines' lengths; `stretch` reads how far a line is past its length; and
 * `index` lists the lines by far prop.
 *
 * A reel at the origin has its tip at (0, 1, 0), a free `line` of 2 m and a
 * `wind` of 3 m that the reel's spool takes in at 1 cm a degree; a lure rests
 * at (0, 1, 3). An action from 1 s turns the spool 50 degrees a second over its
 * 2 s.
 *
 * Scenarios:
 *
 * 1. At 0.5 s the line runs taut from the tip to the lure, 2 m long, stretched
 *    1 m; the wind is out its full 3 m, taut and unstretched.
 * 2. At 2 s the spool has turned 50 degrees: the wind is 2.5 m out; turned past
 *    its length it is out no line, never less.
 * 3. A lure 1 m off hangs a slack line as the catenary of its length.
 * 4. A resting lure is pulled to the free line's 2 m, keeping its height, to (0,
 *    1, 2); the wind pulls it only once paid in, to (0, 1, 2.5) at 2 s; a lure
 *    in a hand, or a prop no line holds, is where it rests.
 * 5. `index` lists the lure's two lines with their reel, in declaration order.
 * 6. Refused: an unknown line, prop or point, and a line of no metres.
 */
export async function test_motions_perform_tether(): Promise<void> {
  const line: IAutoMovieMotionHumanTether = {
    id: "line",
    from: "tip",
    to: { prop: "lure", point: "eye" },
    length: { kind: "free", metres: 2 },
  };
  const wind: IAutoMovieMotionHumanTether = {
    id: "wind",
    from: "tip",
    to: { prop: "lure", point: "eye" },
    length: {
      kind: "driven",
      metres: 3,
      per: 0.01,
      articulation: { prop: "reel", point: "spool" },
    },
  };
  const reel: IAutoMovieMotionHumanProp = {
    ...HumanObject.prop(
      "reel",
      {
        affordances: [
          testAffordance("tip", "handle", P(0, 1, 0)),
          testAffordance("spool", "crank", P(0, 0.5, 0), undefined, {
            travel: 3600,
          }),
        ],
      },
      { at: P(0, 0, 0), yaw: 0 },
    ),
    tethers: [line, wind],
  };
  const lure = (at: IAutoMovieVector3): IAutoMovieMotionHumanProp =>
    HumanObject.prop(
      "lure",
      { affordances: [testAffordance("eye", "handle", P(0, 0, 0))] },
      { at, yaw: 0 },
    );
  const reeling = [
    {
      start: 1,
      end: 3,
      duration: 2,
      plan: {
        drives: [
          {
            prop: "reel",
            articulation: "spool",
            from: 0,
            to: 1,
            travel: (seconds: number): number => 50 * seconds,
          },
        ],
      },
    },
  ];
  const self: IAutoMovieMotionHumanPerformanceState =
    await actingPerformanceState([reel, lure(P(0, 1, 3))], reeling);
  const frame = (prop: string): IAutoMovieRigidTransform =>
    self.props.get(prop)!.frame;
  const span = (
    id: string,
    seconds: number,
    within: IAutoMovieMotionHumanPerformanceState = self,
  ): IAutoMovieMotionHumanTether.ISpan =>
    HumanPerformanceTether.span(within, "reel", id, seconds, (prop) =>
      within.props.get(prop)!.frame,
    );

  // 1. Taut lines.
  const free = span("line", 0.5);
  const full = span("wind", 0.5);
  TestValidator.predicate(
    "taut lines",
    near(free.from, P(0, 1, 0)) &&
      near(free.to, P(0, 1, 3)) &&
      free.length === 2 &&
      free.taut &&
      free.points.length === 2 &&
      Math.abs(HumanPerformanceTether.stretch(free) - 1) <= LINE &&
      full.length === 3 &&
      full.taut &&
      HumanPerformanceTether.stretch(full) === 0,
  );

  // 2. A driven line.
  const greedy: IAutoMovieMotionHumanProp = {
    ...reel,
    tethers: [
      {
        ...wind,
        length: {
          kind: "driven",
          metres: 3,
          per: 1,
          articulation: { prop: "reel", point: "spool" },
        },
      },
    ],
  };
  const over = await actingPerformanceState(
    [greedy, lure(P(0, 1, 3))],
    reeling,
  );
  TestValidator.predicate(
    "the reel takes the line in",
    Math.abs(span("wind", 2).length - 2.5) <= LINE &&
      span("wind", 2, over).length === 0,
  );

  // 3. A slack line.
  const near1 = await actingPerformanceState([reel, lure(P(0, 1, 1))], reeling);
  const slack = span("line", 0.5, near1);
  TestValidator.predicate(
    "a slack line hangs",
    !slack.taut &&
      slack.points.length === humanTetherCatenary.SAMPLES + 1 &&
      slack.points[humanTetherCatenary.SAMPLES / 2]!.y < 1,
  );

  // 4. Pulls.
  const rest: IAutoMovieRigidTransform = frame("lure");
  const tethered = (
    lines: IAutoMovieMotionHumanPerformanceState.ITethered[],
    within: IAutoMovieMotionHumanPerformanceState = self,
  ): IAutoMovieMotionHumanPerformanceState => ({
    ...within,
    tethered: new Map([["lure", lines]]),
  });
  const pulled = (
    within: IAutoMovieMotionHumanPerformanceState,
    seconds: number,
  ): IAutoMovieVector3 =>
    HumanPerformanceTether.pull(within, "lure", seconds, rest, frame).position;
  const held: IAutoMovieMotionHumanPerformanceState = {
    ...tethered([{ owner: reel, tether: line }]),
    grips: new Map([
      ["lure", [{ subject: "actor", side: "right", from: 0, to: 5 }]],
    ]),
  };
  TestValidator.predicate(
    "pulled to the lines",
    near(pulled(tethered([{ owner: reel, tether: line }]), 0.5), P(0, 1, 2)) &&
      near(pulled(tethered([{ owner: reel, tether: wind }]), 0.5), P(0, 1, 3)) &&
      near(pulled(tethered([{ owner: reel, tether: wind }]), 2), P(0, 1, 2.5)) &&
      near(pulled(held, 0.5), P(0, 1, 3)) &&
      HumanPerformanceTether.pull(self, "reel", 0.5, frame("reel"), frame) ===
        frame("reel"),
  );

  // 5. The index.
  const index = HumanPerformanceTether.index(self.props);
  TestValidator.predicate(
    "lines by far prop",
    index.size === 1 &&
      index.get("lure")!.length === 2 &&
      index.get("lure")![0]!.owner === reel &&
      index.get("lure")![0]!.tether === line &&
      index.get("lure")![1]!.tether === wind,
  );

  // 6. Refusals.
  const dead: IAutoMovieMotionHumanProp = {
    ...reel,
    tethers: [{ ...line, length: { kind: "free", metres: 0 } }],
  };
  const pointless: IAutoMovieMotionHumanProp = {
    ...reel,
    tethers: [{ ...line, from: "butt" }],
  };
  const none = await actingPerformanceState(
    [dead, lure(P(0, 1, 3))],
    reeling,
  );
  const blind = await actingPerformanceState(
    [pointless, lure(P(0, 1, 3))],
    reeling,
  );
  TestValidator.predicate(
    "refused lines",
    refused(() => span("cast", 0.5), "cast") &&
      refused(
        () =>
          HumanPerformanceTether.span(self, "rod", "line", 0.5, frame),
        "rod",
      ) &&
      refused(() => span("line", 0.5, blind), "butt") &&
      refused(() => span("line", 0.5, none), 0),
  );
}

/** Whether two points agree within the line bound. */
function near(a: IAutoMovieVector3, b: IAutoMovieVector3): boolean {
  return (
    Math.abs(a.x - b.x) <= LINE &&
    Math.abs(a.y - b.y) <= LINE &&
    Math.abs(a.z - b.z) <= LINE
  );
}

/** Whether a task refuses a tether with the value. */
function refused(task: () => unknown, value: string | number): boolean {
  try {
    task();
    return false;
  } catch (error) {
    return (
      error instanceof HumanRefusal &&
      error.axis === "tether" &&
      error.value === value
    );
  }
}
