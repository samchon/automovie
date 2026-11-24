import type {
  AutoMovieHumanSide,
  IAutoMovieMotionTarget,
} from "@automovie/interface";
import { touchLayouts } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** A touch's layout reader (`touchHold.Lay`). */
type Lay = Parameters<typeof touchLayouts>[1];

/**
 * `touchLayouts` decides each declared hand and target's layout once, in
 * declaration order, as the plan is built, and hands every later read of a
 * declared pair a fresh copy of that decision; a pair it was not given is read
 * anew.
 *
 * Scenarios:
 *
 * 1. Building it reads each declared pair once, in order.
 * 2. A declared pair's read reads nothing more and returns its decision.
 * 3. Each read is a fresh copy.
 * 4. An undeclared pair is read at its own call.
 */
export function test_unit_motions_touch_touch_layouts(): void {
  const shoulder: IAutoMovieMotionTarget = {
    kind: "person",
    subject: "b",
    region: "forehead",
  };
  const knee: IAutoMovieMotionTarget = { kind: "self", region: "forehead" };
  const calls: string[] = [];
  const read: Lay = (
    side: AutoMovieHumanSide,
    target: IAutoMovieMotionTarget,
  ): ReturnType<Lay> => {
    calls.push(`${side}:${target.kind}`);
    return { lay: "arm", tangent: "up" };
  };
  const layout: Lay = touchLayouts(
    [
      ["right", shoulder],
      ["left", knee],
    ],
    read,
  );

  // 1. The declared pairs, once each.
  TestValidator.equals("read in order", calls, ["right:person", "left:self"]);

  // 2 and 3. A declared pair.
  const first: ReturnType<Lay> = layout("right", shoulder);
  const again: ReturnType<Lay> = layout("right", shoulder);
  TestValidator.equals("no further read", calls.length, 2);
  TestValidator.equals("its decision", first, { lay: "arm", tangent: "up" });
  TestValidator.predicate("a fresh copy", first !== again);

  // 4. An undeclared pair.
  layout("left", shoulder);
  TestValidator.equals("an undeclared pair is read", calls.length, 3);
}
