import {
  type IAutoMovieHumanFaceContactSummary,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { articulatedPositions } from "../internal/humanFaceArticulationFixture";
import { humanFaceContactFixture } from "../internal/humanFaceContactFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Soft tissue keeps its rest clearance from the dental colliders.
 * Scenarios:
 * 1. A lip corner pressed 0.05 inside a face of the lower crown is moved back
 *    onto that face along its normal, its neighbours take half the push, and
 *    the summary counts one vertex at the excess depth.
 * 2. A corner that already rests inside the crown keeps that depth as its
 *    floor: a shallower press is left alone, a deeper one returns to it.
 * 3. A push past the tissue budget refuses by surface, vertex and depth; a
 *    collider whose reach is shorter than the penetration leaves it alone.
 * 4. With the crown left open, a corner whose nearest feature is the rim at
 *    rest or when posed is left alone.
 */
export const test_subject_human_contact_resolution = (): void => {
  const { basis, document } = humanFaceContactFixture();
  let last: IAutoMovieHumanFaceContactSummary | null = null;
  const observe = (summary: IAutoMovieHumanFaceContactSummary | null): void => {
    last = summary;
  };
  const build = createHumanFaceBasisBuilder(basis, { observe });
  // The region mesh lists the lower triangle as seam, left corner, right
  // corner, so the pressed right corner sits at offset 15.
  const l1 = (p: number[], at: number): number =>
    Math.abs(p[at]) + Math.abs(p[at + 1] + 0.3) + Math.abs(p[at + 2] - 1);
  const pressed = articulatedPositions(
    build({ ...document, expression: { press: 1 } }),
    "mouth/all",
  );
  const depth = 0.05 / Math.sqrt(3);
  TestValidator.predicate(
    "pressed corner returns to the crown face",
    nclose(l1(pressed, 15), 0.2) &&
      last!.resolved[0].vertices === 1 &&
      nclose(last!.resolved[0].maxDepthMetres, depth) &&
      last!.resolved[1].vertices === 0,
  );
  const plain = articulatedPositions(build(document), "mouth/all");
  const rows = [-0.45, 0.05, -0.35];
  const push = [0, 1, 2].map(
    (axis) => pressed[15 + axis] - (plain[15 + axis] + rows[axis]),
  );
  TestValidator.predicate(
    "the push has the face normal's length",
    nclose(Math.hypot(...push), depth),
  );
  for (const neighbour of [9, 12])
    TestValidator.predicate(
      "neighbours take half the push",
      [0, 1, 2].every((axis) =>
        nclose(
          pressed[neighbour + axis] - plain[neighbour + axis],
          push[axis] / 2,
        ),
      ),
    );
  const resting = structuredClone(basis);
  resting.surfaces[1].positions.splice(12, 3, 0.05, -0.25, 1.05);
  resting.surfaces[1].targets.pressTarget = [4, 0, 0, 0.03];
  const outward = articulatedPositions(
    createHumanFaceBasisBuilder(resting, { observe })({
      ...document,
      expression: { press: 1 },
    }),
    "mouth/all",
  );
  TestValidator.predicate(
    "a press above the rest floor is left alone",
    last!.resolved[0].vertices === 0 && nclose(outward[17], 1.08),
  );
  resting.surfaces[1].targets.pressTarget = [4, 0, 0, -0.03];
  const deep = articulatedPositions(
    createHumanFaceBasisBuilder(resting, { observe })({
      ...document,
      expression: { press: 1 },
    }),
    "mouth/all",
  );
  TestValidator.predicate(
    "a press below the rest floor returns to it",
    last!.resolved[0].vertices === 1 &&
      nclose(last!.resolved[0].maxDepthMetres, 0.03 / Math.sqrt(3)) &&
      nclose(l1(deep, 15), 0.15),
  );
  const tight = structuredClone(basis);
  tight.contact!.soft[0].budgetMetres = 0.02;
  TestValidator.predicate(
    "a push past the budget refuses",
    throwsError(
      () =>
        createHumanFaceBasisBuilder(tight)({
          ...document,
          expression: { press: 1 },
        }),
      [
        "mouth penetrates a rigid surface by 28.87 mm at vertex 4",
        "20.00 mm tissue budget",
      ],
    ),
  );
  const short = structuredClone(basis);
  short.contact!.colliders[0].reachMetres = 0.02;
  const left = articulatedPositions(
    createHumanFaceBasisBuilder(short, { observe })({
      ...document,
      expression: { press: 1 },
    }),
    "mouth/all",
  );
  TestValidator.predicate(
    "beyond reach is left alone",
    last!.resolved[0].vertices === 0 && nclose(left[17], 1.05),
  );
  const open = structuredClone(basis);
  open.contact!.colliders[0].closure = [];
  open.surfaces[1].targets.pressTarget = [4, -0.5, -0.01, -0.38];
  const rimmed = articulatedPositions(
    createHumanFaceBasisBuilder(open, { observe })({
      ...document,
      expression: { press: 1 },
    }),
    "mouth/all",
  );
  TestValidator.predicate(
    "a rim feature when posed is left alone",
    last!.resolved[0].vertices === 0 && nclose(rimmed[16], -0.31),
  );
  open.surfaces[1].positions.splice(12, 3, 0, -0.31, 1.02);
  open.surfaces[1].targets.pressTarget = [4, 0.05, 0.06, 0.03];
  const restRim = articulatedPositions(
    createHumanFaceBasisBuilder(open, { observe })({
      ...document,
      expression: { press: 1 },
    }),
    "mouth/all",
  );
  TestValidator.predicate(
    "a rim feature at rest is left alone",
    last!.resolved[0].vertices === 0 && nclose(restRim[17], 1.05),
  );
};
