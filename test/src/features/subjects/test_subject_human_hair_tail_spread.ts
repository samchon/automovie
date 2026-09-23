import { Vector3 } from "@automovie/engine";
import { createHumanFaceHairTailSpread } from "@automovie/human/face/anatomy/hair/createHumanFaceHairTailSpread";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

/**
 * A gathered tail carries volume through a continuous radial velocity.
 * Scenarios:
 * 1. A 10 mm entry grows to a 30 mm target over 100 mm: the smoothstep
 *    derivative is zero at both ends and 0.3 transversely at its midpoint.
 * 2. Contraction reverses direction; an axial entry uses its root side and a
 *    collinear root uses deterministic phase without changing the inputs.
 */
export const test_subject_human_hair_tail_spread = (): void => {
  const axis = Vector3.create(0, -1, 0);
  const anchor = Vector3.create();
  const entry = Vector3.create(0.01, 0, 0);
  const root = Vector3.create(1, 0, 0);
  const input = {
    axis,
    anchor,
    entry,
    root,
    phase: 0,
    radialFraction: 1,
    radius: 0.03,
    reach: 0.1,
  };
  const spread = createHumanFaceHairTailSpread(input);
  TestValidator.predicate(
    "smooth volume starts and ends tangent to the tail",
    vclose(spread(0), Vector3.create()) &&
      vclose(spread(0.1), Vector3.create()) &&
      vclose(spread(0.2), Vector3.create()),
  );
  TestValidator.predicate(
    "hand-derived midpoint radial velocity",
    vclose(spread(0.05), Vector3.create(0.3, 0, 0)),
  );
  TestValidator.predicate(
    "tube fill turns and scales a target cross-section",
    vclose(
      createHumanFaceHairTailSpread({ ...input, phase: Math.PI / 2 })(0.05),
      Vector3.create(-0.15, 0, 0.45),
    ) &&
      vclose(
        createHumanFaceHairTailSpread({ ...input, radialFraction: 0.5 })(0.05),
        Vector3.create(0.075, 0, 0),
      ),
  );
  const contraction = createHumanFaceHairTailSpread({ ...input, radius: 0 });
  TestValidator.predicate(
    "contraction points toward the axis",
    vclose(contraction(0.05), Vector3.create(-0.15, 0, 0)),
  );
  const rootSide = createHumanFaceHairTailSpread({
    ...input,
    entry: anchor,
  });
  TestValidator.predicate(
    "root supplies a zero-entry radial side",
    vclose(rootSide(0.05), Vector3.create(0.45, 0, 0)),
  );
  const parallel = { ...input, entry: anchor, root: axis };
  const first = createHumanFaceHairTailSpread(parallel)(0.05);
  const second = createHumanFaceHairTailSpread({
    ...parallel,
    phase: Math.PI / 2,
  })(0.05);
  TestValidator.predicate(
    "phase resolves a collinear root",
    nclose(Vector3.length(first), 0.45) &&
      nclose(Vector3.length(second), 0.45) &&
      nclose(Vector3.dot(first, second), 0),
  );
  TestValidator.predicate(
    "caller vectors remain owned",
    vclose(entry, Vector3.create(0.01, 0, 0)) &&
      vclose(root, Vector3.create(1, 0, 0)),
  );
};
