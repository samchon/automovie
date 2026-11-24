import type {
  IAutoMovieMotionHumanSupport,
  IAutoMovieMotionHumanWallClimb,
} from "@automovie/interface";
import { HumanRefusal, wallClimbSupport } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `wallClimbSupport` turns a wall route into support stances: the start's four
 * holds, then one stance after each move, the hands gripping and the feet
 * bearing on their holds; a release leaves its limb free, allowed only while
 * the other three hold, and no two limbs share one hold.
 *
 * Scenarios, a wall `w` with holds `a` to `f`:
 *
 * 1. Starting on `a`, `b`, `c` and `d` and moving the right foot to `e` at 1 s,
 *    the route has two stances: the hands gripping `a` and `b` and the feet
 *    bearing on `c` and `d`, then the same with the right foot on `e`, timed at
 *    1 s.
 * 2. Releasing the right foot leaves three contacts.
 * 3. Releasing a second limb while one is free is refused on `moves`.
 * 4. Two limbs starting on the same hold are refused on `start`.
 */
export function test_unit_motions_climbing_wall_climb_support(): void {
  const hold: (point: string) => IAutoMovieMotionHumanWallClimb.Hold = (
    point: string,
  ): IAutoMovieMotionHumanWallClimb.Hold => ({
    kind: "prop",
    subject: "w",
    point,
  });
  const start: IAutoMovieMotionHumanWallClimb["start"] = {
    leftHand: hold("a"),
    rightHand: hold("b"),
    leftFoot: hold("c"),
    rightFoot: hold("d"),
  };
  const parts: (stance: IAutoMovieMotionHumanSupport.IStance) => string[] = (
    stance: IAutoMovieMotionHumanSupport.IStance,
  ): string[] =>
    stance.contacts.map(
      (c: IAutoMovieMotionHumanSupport.IContact): string =>
        `${c.part}:${c.kind}:${c.target !== undefined && c.target !== "on" && c.target.kind === "prop" ? c.target.point : "?"}`,
    );
  const route: IAutoMovieMotionHumanSupport.IParams = wallClimbSupport({
    start,
    moves: [{ limb: "rightFoot", to: hold("e"), seconds: 1 }],
  });
  TestValidator.equals(
    "the stances",
    [route.stances.map(parts), route.stances[1]!.seconds],
    [
      [
        [
          "leftHand:grip:a",
          "rightHand:grip:b",
          "leftFoot:bear:c",
          "rightFoot:bear:d",
        ],
        [
          "leftHand:grip:a",
          "rightHand:grip:b",
          "leftFoot:bear:c",
          "rightFoot:bear:e",
        ],
      ],
      1,
    ],
  );
  const released: IAutoMovieMotionHumanSupport.IParams = wallClimbSupport({
    start,
    moves: [{ limb: "rightFoot", to: null }],
  });
  TestValidator.equals("a release", parts(released.stances[1]!), [
    "leftHand:grip:a",
    "rightHand:grip:b",
    "leftFoot:bear:c",
  ]);
  const refused: (
    route: IAutoMovieMotionHumanWallClimb,
  ) => string | undefined = (
    route: IAutoMovieMotionHumanWallClimb,
  ): string | undefined => {
    try {
      wallClimbSupport(route);
    } catch (error: unknown) {
      return error instanceof HumanRefusal ? error.axis : "other";
    }
    return undefined;
  };
  TestValidator.equals(
    "refusals",
    [
      refused({
        start,
        moves: [
          { limb: "rightFoot", to: null },
          { limb: "leftFoot", to: null },
        ],
      }),
      refused({ start: { ...start, rightHand: hold("a") }, moves: [] }),
    ],
    ["moves", "start"],
  );
}
