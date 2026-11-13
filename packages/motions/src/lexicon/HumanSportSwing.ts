import { HumanActionRow } from "../law/HumanActionRow";
import { HumanSword } from "./HumanSword";
import { HumanSwordGuard } from "./HumanSwordGuard";

/**
 * Swings of a held implement under sport names, each a row of the cut that
 * blade work plans: the implement's striking part is carried through the
 * target on one of the eight lines, the edge leading, by the stroke planner.
 *
 * The composition gives the implement the hand holds (`blade`, with `tip`
 * naming its striking contact, such as a bat's `strike`), and the target
 * (the ball's place at contact); with neither, the row is a shadow swing of
 * the empty hand. First pass: the body's law is the arm's stroke with the
 * step or lunge the cut offers; the hips' and the trunk's turn of a real
 * swing are not planned, and the ball is not moved. A ball that flies is a
 * prop with a motion of its own, released by the scene at the row's
 * `stroke`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is a row of, what the composition gives and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a registered law (`HumanActionRow`), so it is data over a law that fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One row per swing a screenplay names; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; the line a swing comes from is the only value fixed.
 */
export namespace HumanSportSwing {
  /** A baseball swing: both hands, level from the bat hand's side. */
  export const batSwing = HumanActionRow.of("batSwing", HumanSword.cut, {
    from: "forehand",
    hands: 2,
  });

  /** A checked swing: the bat started and held back at half its path. */
  export const checkSwing = HumanActionRow.of("checkSwing", HumanSword.cut, {
    from: "forehand",
    hands: 2,
    feint: 0.5,
  });

  /** A bunt: the bat held level before the body in both hands. */
  export const bunt = HumanActionRow.of("bunt", HumanSwordGuard.guard, {
    guard: "middle",
    hands: 2,
  });

  /** A forehand drive of tennis, squash or table tennis. */
  export const forehand = HumanActionRow.of("forehand", HumanSword.cut, {
    from: "forehand",
  });

  /** A one-handed backhand drive. */
  export const backhandDrive = HumanActionRow.of(
    "backhandDrive",
    HumanSword.cut,
    { from: "backhand" },
  );

  /** A two-handed backhand drive. */
  export const twoHandBackhand = HumanActionRow.of(
    "twoHandBackhand",
    HumanSword.cut,
    { from: "backhand", hands: 2 },
  );

  /** A topspin stroke: the racket brushed up from below the ball. */
  export const topspin = HumanActionRow.of("topspin", HumanSword.cut, {
    from: "belowForehand",
  });

  /** A serve, a smash or a badminton clear: the racket brought down from overhead. */
  export const overheadSmash = HumanActionRow.of("overheadSmash", HumanSword.cut, {
    from: "above",
  });

  /** A volley: a short punch of the racket from high on its own side. */
  export const volley = HumanActionRow.of("volley", HumanSword.cut, {
    from: "aboveForehand",
  });

  /** A full golf swing: both hands, down from above the rear shoulder. */
  export const golfSwing = HumanActionRow.of("golfSwing", HumanSword.cut, {
    from: "aboveForehand",
    hands: 2,
  });

  /** A golf putt or chip: both hands, a level stroke along the ground line. */
  export const putt = HumanActionRow.of("putt", HumanSword.cut, {
    from: "forehand",
    hands: 2,
  });

  /** A volleyball spike or serve: the open hand brought down from overhead. */
  export const spike = HumanActionRow.of("spike", HumanSword.cut, {
    from: "above",
  });
}
