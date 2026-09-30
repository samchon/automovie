import { findHumanBoundaryLoops } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanPersonTube } from "../internal/humanPersonTubeFixture";
import { throwsError } from "../internal/predicates";

/**
 * A boundary loop is read from the winding alone, in the direction its edges
 * run in the triangles that own them.
 *
 * Scenarios:
 * 1. One triangle (0,1,2) has the directed edges 0->1, 1->2, 2->0, none
 *    reversed, so its loop is [0,1,2] with the surface on its left.
 * 2. A tube of eight vertices per ring with no cap has two loops, the lower and
 *    the upper ring; a bottom cap removes the lower one, and a fully capped
 *    tube (two caps) is closed and has none. Every loop vertex belongs to its
 *    ring, and the upper loop runs opposite to the lower one (an oriented tube
 *    turns each loop the other way about its axis).
 * 3. An index list of a length not divisible by three, two triangles holding
 *    one directed edge alike, and two triangles meeting only at a vertex (a
 *    pinched boundary) each refuse.
 */
export const test_human_boundary_loops = (): void => {
  TestValidator.equals(
    "a single triangle is one loop in its own winding",
    findHumanBoundaryLoops([0, 1, 2]),
    [[0, 1, 2]],
  );

  const segments = 8;
  const open = humanPersonTube({
    rings: [0, 0.01, 0.02],
    segments,
    radius: 0.05,
    close: "none",
  });
  const loops = findHumanBoundaryLoops(open.indices);
  TestValidator.equals("an open tube has two loops", loops.length, 2);
  const lower = loops.find((loop) => open.rings[0].includes(loop[0]))!;
  const upper = loops.find((loop) => open.rings[2].includes(loop[0]))!;
  TestValidator.equals(
    "each loop is exactly its ring",
    [lower.length, [...lower].sort((a, b) => a - b), [...upper].sort((a, b) => a - b)],
    [segments, open.rings[0], open.rings[2]],
  );
  const step = (loop: number[], ring: number[]): number =>
    (ring.indexOf(loop[1]) - ring.indexOf(loop[0]) + segments) % segments;
  TestValidator.equals(
    "the two loops turn opposite ways about the axis",
    [step(lower, open.rings[0]), step(upper, open.rings[2])],
    [1, segments - 1],
  );
  TestValidator.equals(
    "a bottom cap leaves only the upper loop",
    findHumanBoundaryLoops(
      humanPersonTube({
        rings: [0, 0.01, 0.02],
        segments,
        radius: 0.05,
        close: "bottom",
      }).indices,
    ).length,
    1,
  );
  const capped = humanPersonTube({
    rings: [0, 0.01],
    segments,
    radius: 0.05,
    close: "bottom",
  });
  const top = capped.positions.length / 3;
  const closed = [
    ...capped.indices,
    ...capped.rings[1].flatMap((a, k) => [
      a,
      capped.rings[1][(k + 1) % segments],
      top,
    ]),
  ];
  TestValidator.equals(
    "a closed tube has no loop",
    findHumanBoundaryLoops(closed),
    [],
  );

  TestValidator.predicate(
    "an index list that is not a whole number of triangles refuses",
    throwsError(() => findHumanBoundaryLoops([0, 1]), "multiple of three"),
  );
  TestValidator.predicate(
    "two triangles holding one directed edge alike refuse",
    throwsError(
      () => findHumanBoundaryLoops([0, 1, 2, 0, 1, 3]),
      "hold the edge 0 -> 1 alike",
    ),
  );
  TestValidator.predicate(
    "two triangles meeting at one vertex are a pinched boundary",
    throwsError(
      () => findHumanBoundaryLoops([0, 1, 2, 0, 3, 4]),
      "leave the vertex 0",
    ),
  );
};
