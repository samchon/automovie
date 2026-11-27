import type { IAutoMovieIntent, IAutoMovieVector3 } from "@automovie/interface";
import { AutoMovieMotionHumanChain } from "@automovie/motions";
import {
  HumanTabletop
} from "../../../../../packages/motions/src/lexicon/internal/HumanTabletop";
import { TestValidator } from "@nestia/e2e";

import { compositionIntents } from "../../internal/compositionIntents";

/** Each intent's capability and its parameters, in order. */
const steps = (chain: ReturnType<typeof AutoMovieMotionHumanChain.subject>): unknown[] =>
  compositionIntents(chain.node).map((i: IAutoMovieIntent): unknown => [
    i.capability,
    i.parameters?.params,
  ]);

/** A lift of a prop by its grip in the right hand. */
const lift = (prop: string, height: number): unknown => [
  "pickUp",
  { prop, handle: "grip", hand: "right", lift: height },
];

/** Two seats at the table. */
const SEATS: IAutoMovieVector3[] = [
  { x: 0, y: 0.8, z: 1 },
  { x: 1, y: 0.8, z: 0 },
];

/**
 * `HumanTabletop` writes tabletop play as pick-ups and put-downs: a chess move
 * lifts any captured piece aside first, a deal goes round the seats, a lay puts
 * each card on its own place.
 *
 * Scenarios, the right hand on a chain for subject `a`, a knight on g1 and a
 * pawn on f3:
 *
 * 1. The knight to h3 is lifted 5 cm and set on h3 by its base; capturing the pawn
 *    on f3 lifts the pawn aside first.
 * 2. A move onto the pawn without capturing it, a capture with nowhere aside, and
 *    a piece on no square are refused.
 * 3. Three cards dealt to two seats are each lifted 4 cm and go to the first, the
 *    second and the first again; a deal with no seat is refused.
 * 4. Laying two cards on one place is refused.
 */
export function test_motions_lexicon_tabletop(): void {
  const occupancy: Record<string, string> = { g1: "knight", f3: "pawn" };
  const onto = (square: string): unknown => [
    "putDown",
    {
      prop: "knight",
      onto: { prop: "board", point: square, via: "base" },
      hand: "right",
    },
  ];
  TestValidator.equals(
    "a quiet move",
    steps(
      HumanTabletop.chessMove(AutoMovieMotionHumanChain.subject("a"), {
        board: "board",
        piece: "knight",
        to: "h3",
        occupancy,
      }),
    ),
    [lift("knight", 0.05), onto("h3")],
  );
  const aside: IAutoMovieVector3 = { x: 1, y: 0.8, z: 0 };
  TestValidator.equals(
    "a capture",
    steps(
      HumanTabletop.chessMove(AutoMovieMotionHumanChain.subject("a"), {
        board: "board",
        piece: "knight",
        to: "f3",
        occupancy,
        capture: "pawn",
        aside,
      }),
    ),
    [
      lift("pawn", 0.05),
      ["putDown", { prop: "pawn", to: aside, hand: "right" }],
      lift("knight", 0.05),
      onto("f3"),
    ],
  );
  TestValidator.error("onto a piece not captured", () =>
    HumanTabletop.chessMove(AutoMovieMotionHumanChain.subject("a"), {
      board: "board",
      piece: "knight",
      to: "f3",
      occupancy,
    }),
  );
  TestValidator.error("a capture with nowhere aside", () =>
    HumanTabletop.chessMove(AutoMovieMotionHumanChain.subject("a"), {
      board: "board",
      piece: "knight",
      to: "f3",
      occupancy,
      capture: "pawn",
    }),
  );
  TestValidator.error("a piece on no square", () =>
    HumanTabletop.chessMove(AutoMovieMotionHumanChain.subject("a"), {
      board: "board",
      piece: "queen",
      to: "h3",
      occupancy,
    }),
  );

  TestValidator.equals(
    "round the seats",
    steps(
      HumanTabletop.deal(AutoMovieMotionHumanChain.subject("a"), {
        cards: ["c1", "c2", "c3"],
        seats: SEATS,
      }),
    ),
    ["c1", "c2", "c3"].flatMap((card: string, i: number): unknown[] => [
      lift(card, 0.04),
      ["putDown", { prop: card, to: SEATS[i % 2], hand: "right" }],
    ]),
  );
  TestValidator.error("no seat", () =>
    HumanTabletop.deal(AutoMovieMotionHumanChain.subject("a"), { cards: ["c1"], seats: [] }),
  );
  TestValidator.error("two cards on one place", () =>
    HumanTabletop.lay(AutoMovieMotionHumanChain.subject("a"), {
      cards: ["c1", "c2"],
      places: [{ at: SEATS[0]!, rotation: { x: 0, y: 0, z: 0, w: 1 } }],
    }),
  );
}
