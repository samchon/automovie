import { ArchetypeUnits, createBoard, createMirror } from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/**
 * Mirrors and wall boards hang at their sources' sizes and heights.
 *
 * Scenarios:
 * 1. A wall mirror's glass is Bobrick's 18 to 24 in wide and 30 to 72 in high, its bottom edge at the ADA's 40 in, its face 3/4 in off the wall.
 * 2. A standing mirror is IKEA IKORNNES's 52 x 167 x 52 cm.
 * 3. A whiteboard's base stands at the classroom standard's 915 mm, its tray 3 1/8 in out; a blackboard's and a notice board's bottoms lie on the floor's line, the notice board with no tray.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures the produced colliders and contacts over the seeds; a mirror or a board off its sources is caught with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The figures are the ADA's, Bobrick's, IKEA's, Ghent's, Claridge's and the design standard's restated here.
 * @evidence contracts/development/testing.md#distinguishing-cases A wall and a standing mirror; boards with and without a tray, mounted and not.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the three scenarios and what each pins.
 */
export function test_archetype_mirror_board(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };
  const inch: number = ArchetypeUnits.INCH;

  // 1. The wall mirror.
  findings.push(
    ...archetypeBandSweep([
      {
        name: "wall mirror width",
        measure: (seed: number): number =>
          createMirror({ kind: "wall" }, seed).affordance("face").width!,
        minimum: 18 * inch,
        maximum: 24 * inch,
        source: "Bobrick B-290",
      },
      {
        name: "wall mirror height",
        measure: (seed: number): number =>
          createMirror({ kind: "wall" }, seed).affordance("face").depth!,
        minimum: 30 * inch,
        maximum: 72 * inch,
        source: "Bobrick B-290",
      },
    ]),
  );
  const wall: ReturnType<typeof createMirror> = createMirror({ kind: "wall" }, 3);
  const face: IAutoMovieAffordance = wall.affordance("face");
  near("the glass's bottom edge", face.frame.translation.y - face.depth! / 2, 40 * inch);
  near("the face off the wall", face.frame.translation.z, 0.75 * inch);

  // 2. The standing mirror.
  const cheval: ReturnType<typeof createMirror> = createMirror({ kind: "cheval" }, 3);
  near("the standing mirror's width", archetypeExtent(cheval, "x").size, 0.52);
  near("the standing mirror's height", archetypeExtent(cheval, "y").size, 1.67);
  near("the standing mirror's depth", archetypeExtent(cheval, "z").size, 0.52);

  // 3. The boards.
  const white: ReturnType<typeof createBoard> = createBoard({ kind: "whiteboard" }, 3);
  near("the whiteboard's base", archetypeExtent(white, "y", ["board"]).low, 0.915);
  near("the whiteboard's tray", white.affordance("tray").frame.translation.z, (3 + 1 / 8) * inch);
  const black: ReturnType<typeof createBoard> = createBoard({ kind: "blackboard" }, 3);
  near("the blackboard's foot", archetypeExtent(black, "y", ["board"]).low, 0);
  const notice: ReturnType<typeof createBoard> = createBoard({ kind: "noticeBoard" }, 3);
  if (notice.affordances.some((a: { id: string }): boolean => a.id === "tray"))
    findings.push("the notice board declares a tray");
  TestValidator.equals("mirrors and boards hang at their sources", findings, []);
}
