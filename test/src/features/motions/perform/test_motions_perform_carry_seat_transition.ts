import { AutoMovieEngineTransform } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMoviePose,
} from "@automovie/interface";
import {
  carrySeatTransition
} from "../../../../../packages/motions/src/perform/internal/carrySeatTransition";
import { TestValidator } from "@nestia/e2e";

/**
 * A continuous material seat retains the destination root and lets the joints
 * decay normally. A world seat can hand that root over at a coincident cut.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Continuity requires a compatible seat throughout the blend or coincident ground staging. The return always retains the joint decay.
 * @evidence contracts/development/testing.md#behavioral-verification Builds typed entry and contact windows, runs `carrySeatTransition` with an explicit decay callback, and checks the root by identity and the returned joint value for each variant.
 * @evidence contracts/development/testing.md#independent-expectations At elapsed 0.2 the decay supplies flexion 2. The same named material seat or unnamed seat on the same carrier keeps destination root (1, 2, 3). Nonmatching or too-short contact uses the decay root (0.75, 2, 3), while ground staging keeps the destination only when roots coincide.
 */
export function test_motions_perform_carry_seat_transition(): void {
  type Entry = Parameters<typeof carrySeatTransition>[0];
  const support: IAutoMovieMotionHumanContactWindow.Support = {
    kind: "prop",
    subject: "horse",
    point: "saddle",
  };
  const contact: IAutoMovieMotionHumanContactWindow = {
    part: "seat",
    kind: "seat",
    from: 0.25,
    to: 0.5,
    support,
  };
  const entry = (frame: IAutoMovieMotionHumanContactWindow.Support): Entry => {
    const seat: IAutoMovieMotionHumanEntryState.ISupport = {
      part: "seat",
      kind: "seat",
      support: frame,
    };
    return { base: { kind: "seated" }, supports: [seat] };
  };
  const unit = { x: 0, y: 0, z: 0, w: 1 };
  const pose: IAutoMoviePose = {
    skeleton: "rider",
    root: AutoMovieEngineTransform.of({ x: 1, y: 2, z: 3 }, unit),
    joints: [],
  };
  const moved = AutoMovieEngineTransform.of({ x: 0.75, y: 2, z: 3 }, unit);
  const decay: Parameters<typeof carrySeatTransition>[2] = (
    elapsed,
    current,
  ) => ({
    ...current,
    root: moved,
    joints: [
      { bone: "leftUpperArm", flexion: 10 * elapsed, abduction: 0, twist: 0 },
    ],
  });
  const held: Parameters<typeof carrySeatTransition>[1] = {
    from: 0.25,
    until: 0.5,
    contacts: [contact],
    sourceRoot: moved.translation,
    targetRoot: pose.root!.translation,
  };
  const staged = { ...held, sourceRoot: { ...pose.root!.translation } };
  const cases: readonly [string, Entry, typeof held, boolean][] = [
    [
      "the same named saddle through both blend boundaries",
      entry(support),
      held,
      true,
    ],
    [
      "an unnamed seat on the same carrier",
      entry({ kind: "prop", subject: "horse" }),
      held,
      true,
    ],
    [
      "another point on the same carrier",
      entry({ kind: "prop", subject: "horse", point: "other-saddle" }),
      held,
      false,
    ],
    [
      "the same point name on a different carrier",
      entry({ kind: "prop", subject: "other-horse", point: "saddle" }),
      held,
      false,
    ],
    [
      "a coincident world staging handoff",
      entry({ kind: "ground" }),
      staged,
      true,
    ],
    [
      "a world staging handoff with separated roots",
      entry({ kind: "ground" }),
      held,
      false,
    ],
    [
      "a seat that ends before the blend",
      entry(support),
      { ...held, contacts: [{ ...contact, to: 0.4 }] },
      false,
    ],
  ];
  for (const [name, before, window, carried] of cases) {
    const seen: IAutoMoviePose = carrySeatTransition(
      before,
      window,
      decay,
    )(0.2, pose);
    TestValidator.predicate(
      name,
      seen.root === (carried ? pose.root : moved) &&
        seen.joints[0]?.flexion === 2,
    );
  }
}
