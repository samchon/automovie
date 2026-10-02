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
 * 5. A crown covered by 0.01 of tissue stops the pressed corner, which rested
 *    farther out, 0.01 off its face. A cover beyond its rest clearance asks
 *    for the capped rest floor, but the first lower-crown normal candidate
 *    approaches the upper crown and violates that original signed floor.
 *    The consumer refuses this unverified candidate rather than publishing
 *    a clearance inferred only from the lower crown's infinite face plane.
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
  // Distance to the pressed face's plane; the corner at rest, (0.5, -0.3,
  // 1.4), is nearest the crown's edge between (0.2, -0.3, 1) and (0, -0.3,
  // 1.2), at (0.15, -0.3, 1.05): its rest clearance is 0.35 * sqrt(2).
  const distance = (p: number[]) => (l1(p, 15) - 0.2) / Math.sqrt(3);
  const clearance = 0.35 * Math.SQRT2;
  const coverWith = (coverMetres: number) => {
    const covered = structuredClone(basis);
    covered.contact!.colliders[0].coverMetres = coverMetres;
    // The corner rests half a unit out: holding it there is a longer push.
    covered.contact!.soft[0].budgetMetres = 1;
    return articulatedPositions(
      createHumanFaceBasisBuilder(covered, { observe })({
        ...document,
        expression: { press: 1 },
      }),
      "mouth/all",
    );
  };
  const thin = coverWith(0.01);
  TestValidator.predicate(
    "a cover holds the corner off the face",
    clearance > 0.01 &&
      nclose(distance(thin), 0.01) &&
      nclose(last!.resolved[0].maxDepthMetres, depth + 0.01),
  );
  const step = (clearance + depth) / Math.sqrt(3);
  const candidate = [0.05 + step, -0.25 + step, 1.05 + step];
  // The upper octahedron's edge contains (0.1,0.3,1.1). Distance to this
  // actual collider point bounds the nearest surface distance from above.
  const upperDistance = Math.hypot(candidate[0] - 0.1, candidate[1] - 0.3, candidate[2] - 1.1);
  TestValidator.predicate(
    "the lower-crown plane candidate cannot satisfy the original combined crown floor",
    upperDistance < clearance && nclose(clearance - upperDistance, 0.06053475940191472, 1e-12),
  );
  TestValidator.predicate(
    "a cover past rest clearance refuses an unverified combined-crown candidate",
    throwsError(() => coverWith(1), ["mouth", "original contact floor", "vertex 4", "60.53 mm"]),
  );
};
