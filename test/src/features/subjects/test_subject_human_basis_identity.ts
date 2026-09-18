import { createHumanFaceBasisBuilder } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

/** Z of the square's far corner, the vertex every endpoint here moves. */
const corner = (
  basis: Parameters<typeof createHumanFaceBasisBuilder>[0],
  document: Parameters<ReturnType<typeof createHumanFaceBasisBuilder>>[0],
): number => {
  const model = createHumanFaceBasisBuilder(basis)(document);
  const part = model.parts.find((entry) => entry.id === "first")!;
  if (part.geometry.type !== "mesh") throw new Error("mesh expected");
  // The region's third corner is the surface's vertex 2.
  return part.geometry.mesh.positions[8];
};

/**
 * A per-vertex identity moves the neutral, and everything else moves from it.
 *
 * The named channels reach the faces a basis was authored to reach and no
 * further, so a face fitted through them is right at its landmarks and free
 * between them. Carrying the rest as vertex geometry is the layer MetaHuman's
 * DNA has and this basis did not: the neutral is per character, the rig above
 * it is parametric.
 *
 * Which is why the order is the whole of it. Identity is applied first, so an
 * expression moves this face from the neutral this face actually has. Applied
 * afterwards it would be a constant added to every pose, and a wider jaw would
 * then open differently from a narrow one for no authored reason. Both
 * orderings agree on the neutral pose and disagree everywhere else, so the
 * check that separates them has to be a posed one, and scenario 2 is that
 * check: the delta and the expression sum exactly, with no interaction.
 *
 * Every number here is the sum by hand. The `raised` endpoint moves vertex 2 by
 * one metre along Z, and the identity row below moves the same vertex by a
 * quarter, so that vertex's Z is the identity plus the expression.
 *
 * Scenarios:
 * 1. An omitted identity is the shared neutral, exactly as before.
 * 2. Identity adds to the neutral and every pose evaluates from the moved one.
 * 3. A row naming a surface, a vertex or a value this basis does not have refuses.
 * 4. Rows are strictly increasing by vertex, so one packing has one meaning.
 */
export const test_subject_human_basis_identity = (): void => {
  const { basis, document } = humanFaceBasisFixture();
  const identity = { square: [2, 0, 0, 0.25] };

  TestValidator.predicate(
    "an omitted identity is the shared neutral",
    nclose(corner(basis, { ...document, expression: { lift: 0.5 } }), 0.5),
  );

  for (const lift of [0, 0.25, 1] as const)
    TestValidator.predicate(
      `identity moves the neutral the ${lift} expression is read from`,
      nclose(
        corner(basis, { ...document, identity, expression: { lift } }),
        0.25 + lift,
      ),
    );

  // A shape control moves a different vertex, so the identity on vertex 2 has
  // to survive it untouched rather than being scaled by it.
  TestValidator.predicate(
    "a shape control does not disturb the identity of another vertex",
    nclose(
      corner(basis, {
        ...document,
        identity,
        shape: { width: 1 },
        expression: { lift: 0.5 },
      }),
      0.75,
    ),
  );

  const refusals: [string, Record<string, number[]>][] = [
    ["a surface this basis does not declare", { nothing: [0, 0, 0, 1] }],
    ["a vertex beyond the surface", { square: [4, 0, 0, 1] }],
    ["a negative vertex", { square: [-1, 0, 0, 1] }],
    ["a fractional vertex", { square: [1.5, 0, 0, 1] }],
    ["a row that is not four numbers", { square: [1, 0, 0] }],
    ["a value that is not finite", { square: [1, 0, 0, Number.NaN] }],
    ["vertices that repeat", { square: [1, 0, 0, 1, 1, 0, 0, 1] }],
    ["vertices out of order", { square: [2, 0, 0, 1, 1, 0, 0, 1] }],
  ];
  for (const [what, rows] of refusals)
    TestValidator.predicate(
      `identity refuses ${what}`,
      throwsError(() =>
        createHumanFaceBasisBuilder(basis)({
          ...document,
          identity: rows,
        }),
      ),
    );
};
