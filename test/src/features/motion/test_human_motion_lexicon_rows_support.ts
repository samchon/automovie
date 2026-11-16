import type { AutoMovieMotionTarget } from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  HumanSupportRows,
  type IHumanBody,
  type IHumanContactWindow,
  seated,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanStance } from "../internal/motionHumanStance";

/**
 * Every row of the `support` family of the lexicon (`HumanSupportRows`:
 * the scramble and the slide off an edge) is something a body
 * can do on a surface at its own heights: on the average man and on the
 * small woman it is accepted and planned in its own name, and ends standing
 * on both feet.
 *
 * A row writes no motion; it fixes the stances of the support planner, and
 * the composition gives the surface (`on`), a level point the row's
 * contacts lie on, each on its own side. The surfaces, at each body's
 * heights:
 * - the slide off: a table's edge at the body's popliteal height
 *   (`seated.popliteal`), the seat height whose sitter's feet reach the
 *   floor (ANSI/HFES 100-2007, the seated reference posture), 0.1 m behind
 *   the heels as the law sweep stages its chair, the table behind it; the
 *   row starts seated, so the body first sits down on the table (`sit`);
 * - the scramble: a ledge's edge at the body's hip height (provisional: no
 *   study of a ledge's height relative to the climber was read), half the
 *   arm's length ahead of the toes, where a body standing at it can lay its
 *   hands on the top.
 * Where on the surface each contact lies is the row's own (its insets).
 * The toes are the quiet stance's (`motionHumanStance`). Whether a planned
 * row keeps the physical bounds is the verdict net's, and the planner's own
 * sequence its own test's (`test_human_motion_support_sequence`).
 *
 * Scenarios, for each row on each of the two bodies:
 * 1. The row plans, and an action placed under the row's name is there.
 * 2. It ends standing: both feet bear in windows that last to its end.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the rows through the public input and builds a performance of each on real bodies at surfaces of their own heights; a row that is refused, placed under another name, or that ends off its feet fails with the row, the body and the refusal's own message.
 * @evidence contracts/development/testing.md#independent-expectations That each row is humanly performable is what the row claims; the surfaces' heights are the seated standard's and the body's own, the ledge's marked provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases The family's two rows, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds one short performance per row and body; it runs wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the surfaces with their sources, what is left to the verdict net and to the planner's test, and the 2 scenarios.
 */
export function test_human_motion_lexicon_rows_support(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const stance = motionHumanStance(body);
    const toes: number =
      (stance.get("leftToes")!.worldPosition.z +
        stance.get("rightToes")!.worldPosition.z) /
      2;
    const surface = (height: number, ahead: number): AutoMovieMotionTarget =>
      ({
        kind: "point",
        at: { x: 0, y: height, z: toes + ahead },
        frame: "world",
        normal: { x: 0, y: 1, z: 0 },
      }) as AutoMovieMotionTarget;
    const arm: number = body.measure.upperArm + body.measure.forearm;
    // The table's front edge where the law sweep stages its chair, 0.1 m
    // behind the heels, the table behind it.
    const edge: number = body.rest.get("leftFoot")!.z - 0.1 - toes;
    const table: seated.ISeat = {
      at: { x: 0, y: seated.popliteal(body), z: toes + edge },
      yaw: 0,
      depth: 0.45,
    };
    const rows: readonly [string, AutoMovieMotionTarget][] = [
      ["scramble", surface(body.measure.hipHeight, arm / 2)],
      ["slideOff", surface(seated.popliteal(body), edge)],
    ];
    for (const [row, on] of rows) {
      const cell: string = `${row} on ${name}`;
      let performance: HumanPerformance;
      try {
        performance = new HumanPerformance({
          seed: "support-rows",
          laws: [
            HumanSupportRows.scramble,
            HumanSupportRows.slideOff,
          ],
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          // A slide off starts seated on its table: the body sits down on it
          // first.
          composition: (row === "slideOff"
            ? HumanChain.subject("a").sit({ seat: table, seconds: 0.5 })
            : HumanChain.subject("a")
          ).registered(row, { on }).node,
        });
      } catch (error) {
        complaints.check(
          `${cell}: refused, ${(error as Error).message}`,
          false,
        );
        continue;
      }
      const placed: HumanSegment.ISegment | undefined = performance
        .segments("a")
        .find((s: HumanSegment.ISegment): boolean => s.name === row);
      complaints.check(
        `${cell}: placed as ${placed?.name ?? "nothing"}`,
        placed?.name === row,
      );
      if (placed === undefined) continue;
      const ending: string[] = placed.plan.contacts
        .filter(
          (w: IHumanContactWindow): boolean =>
            w.part.endsWith("Foot") && w.to >= 1 - 1e-9,
        )
        .map((w: IHumanContactWindow): string => w.part)
        .sort((x: string, y: string): number => x.localeCompare(y));
      complaints.check(
        `${cell}: ends bearing on ${ending.join(" and ") || "no foot"}, both feet expected`,
        ending.length === 2 &&
          ending[0] === "leftFoot" &&
          ending[1] === "rightFoot",
      );
    }
  }
  complaints.assert("every support row is performable at its surface");
}
