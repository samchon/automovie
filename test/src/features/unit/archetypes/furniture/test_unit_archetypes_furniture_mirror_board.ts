import {
  AutoMovieArchetypeUnits,
  createBoard,
  createMirror,
} from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../../internal/archetypeExtent";
import { archetypeModelSweep } from "../../../internal/archetypeModelSweep";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/**
 * Mirrors and wall boards hang at their sources' sizes and heights.
 *
 * Scenarios:
 * 1. Over 200 seeds a wall mirror's glass is exactly one of Bobrick's seven standard sizes, 18 x 30 to 24 x 72 in, width and height together, each drawn; its bottom edge at the ADA's 40 in, its face 3/4 in off the wall.
 * 2. A standing mirror is IKEA IKORNNES's 52 x 167 x 52 cm.
 * 3. Over 200 seeds each board is exactly one of its maker's standard sizes, height and width together, each drawn: Ghent M1's eleven, Claridge's eleven and Ghent 059's five. A whiteboard's base stands at the classroom standard's 915 mm, its tray 3 1/8 in out; a blackboard's and a notice board's bottoms lie on the floor's line, the notice board with no tray.
 */
export function test_unit_archetypes_furniture_mirror_board(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };
  const inch: number = AutoMovieArchetypeUnits.INCH;

  // 1. The wall mirror.
  findings.push(
    ...archetypeModelSweep([
      {
        name: "wall mirror size",
        measure: (seed: number): readonly number[] => {
          const face: IAutoMovieAffordance = createMirror(
            { kind: "wall" },
            seed,
          ).affordance("face");
          return [face.width!, face.depth!];
        },
        models: [
          [18, 30],
          [18, 36],
          [24, 30],
          [24, 36],
          [24, 48],
          [24, 60],
          [24, 72],
        ].map((size: number[]): number[] =>
          size.map((n: number): number => n * inch),
        ),
        source: "Bobrick B-290",
      },
      ...(
        [
          [
            "whiteboard",
            "Ghent M1",
            [
              [24, 36 + 7 / 16],
              [36 + 7 / 16, 48 + 15 / 32],
              [36 + 7 / 16, 60 + 15 / 32],
              [48 + 15 / 32, 48 + 15 / 32],
              [48 + 15 / 32, 60 + 15 / 32],
              [48 + 15 / 32, 72 + 1 / 2],
              [48 + 15 / 32, 87 + 29 / 32],
              [48 + 15 / 32, 96 + 17 / 32],
              [48 + 15 / 32, 120 + 19 / 32],
              [48 + 15 / 32, 144 + 19 / 32],
              [48 + 15 / 32, 192 + 19 / 32],
            ],
          ],
          [
            "blackboard",
            "Claridge Series 8",
            [
              [24, 36],
              [24, 48],
              [36, 48],
              [48, 48],
              [48, 60],
              [48, 72],
              [48, 96],
              [48, 120],
              [48, 144],
              [48, 168],
              [48, 192],
            ],
          ],
          [
            "noticeBoard",
            "Ghent 059",
            [
              [36, 60],
              [48, 48],
              [48, 60],
              [48, 72],
              [48, 96],
            ],
          ],
        ] as const
      ).map(
        ([kind, source, sizes]: readonly [
          createBoard.Kind,
          string,
          readonly (readonly [number, number])[],
        ]): archetypeModelSweep.IRow => ({
          name: `${kind} size`,
          measure: (seed: number): readonly number[] => {
            const board: ReturnType<typeof createBoard> = createBoard(
              { kind },
              seed,
            );
            return [
              archetypeExtent(board, "y", ["board"]).size,
              archetypeExtent(board, "x", ["board"]).size,
            ];
          },
          models: sizes.map((size: readonly [number, number]): number[] => [
            size[0] * inch,
            size[1] * inch,
          ]),
          source,
        }),
      ),
    ]),
  );
  const wall: ReturnType<typeof createMirror> = createMirror(
    { kind: "wall" },
    3,
  );
  const face: IAutoMovieAffordance = wall.affordance("face");
  near(
    "the glass's bottom edge",
    face.frame.translation.y - face.depth! / 2,
    40 * inch,
  );
  near("the face off the wall", face.frame.translation.z, 0.75 * inch);

  // 2. The standing mirror.
  const cheval: ReturnType<typeof createMirror> = createMirror(
    { kind: "cheval" },
    3,
  );
  near("the standing mirror's width", archetypeExtent(cheval, "x").size, 0.52);
  near("the standing mirror's height", archetypeExtent(cheval, "y").size, 1.67);
  near("the standing mirror's depth", archetypeExtent(cheval, "z").size, 0.52);

  // 3. The boards.
  const white: ReturnType<typeof createBoard> = createBoard(
    { kind: "whiteboard" },
    3,
  );
  near(
    "the whiteboard's base",
    archetypeExtent(white, "y", ["board"]).low,
    0.915,
  );
  near(
    "the whiteboard's tray",
    white.affordance("tray").frame.translation.z,
    (3 + 1 / 8) * inch,
  );
  const black: ReturnType<typeof createBoard> = createBoard(
    { kind: "blackboard" },
    3,
  );
  near("the blackboard's foot", archetypeExtent(black, "y", ["board"]).low, 0);
  const notice: ReturnType<typeof createBoard> = createBoard(
    { kind: "noticeBoard" },
    3,
  );
  if (notice.affordances.some((a: { id: string }): boolean => a.id === "tray"))
    findings.push("the notice board declares a tray");
  TestValidator.equals(
    "mirrors and boards hang at their sources",
    findings,
    [],
  );
}
