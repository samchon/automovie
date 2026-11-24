import type { IAutoMovieRigidTransform } from "@automovie/interface";
import { HumanRefusal, HumanSupportFrame } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** The gait's speed the props are boarded at, m/s. */
const GAIT: number = 1.2;

/** How far past or short of the gait's speed the props move, m/s. */
const OVER: number = 1e-3;

/**
 * `HumanSupportFrame.board` refuses stepping from the ground onto a prop that
 * moves faster at the action's start than the gait can match, naming the prop's
 * speed and the feasible range up to the gait's; a prop no faster is boarded,
 * and a body already standing on the prop is not boarding.
 *
 * Scenarios, props translating along +X at constant speeds, boarded at 1.2 m/s:
 *
 * 1. A prop 1 mm/s slower than the gait is boarded.
 * 2. One 1 mm/s faster is refused on `on` with its speed and the range 0 to 1.2
 *    m/s.
 * 3. The same fast prop is not refused for a body already standing on it.
 */
export function test_unit_motions_carrier_human_support_frame_board(): void {
  const context: (
    supports: HumanSupportFrame.IBoardContext["entry"]["supports"],
  ) => HumanSupportFrame.IBoardContext = (
    supports: HumanSupportFrame.IBoardContext["entry"]["supports"],
  ): HumanSupportFrame.IBoardContext => ({
    entry: { supports },
    start: 0.5,
    prop: (
      subject: string,
    ): ReturnType<HumanSupportFrame.IBoardContext["prop"]> => ({
      frame: (seconds: number): IAutoMovieRigidTransform => ({
        position: {
          x: (subject === "fast" ? GAIT + OVER : GAIT - OVER) * seconds,
          y: 0,
          z: 0,
        },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      }),
    }),
    performer: (subject: string): never => {
      throw new Error(`no performer ${subject}`);
    },
  });
  HumanSupportFrame.board(context([]), "slow", GAIT);
  HumanSupportFrame.board(
    context([
      {
        part: "leftFoot",
        kind: "plant",
        support: { kind: "prop", subject: "fast" },
      },
    ]),
    "fast",
    GAIT,
  );
  let refusal: HumanRefusal | undefined;
  try {
    HumanSupportFrame.board(context([]), "fast", GAIT);
  } catch (error: unknown) {
    if (error instanceof HumanRefusal) refusal = error;
  }
  TestValidator.predicate(
    "a prop faster than the gait",
    refusal !== undefined &&
      refusal.kind === "base" &&
      refusal.axis === "on" &&
      refusal.feasible?.kind === "range" &&
      refusal.feasible.minimum === 0 &&
      refusal.feasible.maximum === GAIT &&
      nclose(Number(refusal.value), GAIT + OVER, 1e-9),
  );
}
