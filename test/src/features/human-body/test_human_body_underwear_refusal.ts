import { createHumanBodyUnderwear } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyUnderwearFixture } from "../internal/humanBodyUnderwearFixture";

/**
 * The underwear refuses what its rules cannot read, and only when the style
 * reads it.
 *
 * Scenarios:
 * 1. A table whose material id the basis already uses is refused when
 *    compiled.
 * 2. A colour channel outside [0,1] is refused; 0 and 1 themselves are
 *    kept.
 * 3. A landmark the body lacks is refused.
 * 4. The bra refuses a nipple on a missing surface, past its surface, at a
 *    negative or fractional index; the boxer briefs, which read no nipple,
 *    keep the same table.
 */
export const test_human_body_underwear_refusal = (): void => {
  const { basis, table, rest, posed } = humanBodyUnderwearFixture();
  TestValidator.error("a basis material id is refused", () =>
    createHumanBodyUnderwear(basis, { ...table, material: "skin" }),
  );
  const dress = createHumanBodyUnderwear(basis, table);
  TestValidator.error("a colour past one is refused", () =>
    dress({
      underwear: { style: "boxer-briefs", color: { r: 1.01, g: 0, b: 0 } },
      rest,
      posed,
    }),
  );
  TestValidator.equals(
    "the colour's bounds are kept",
    dress({
      underwear: { style: "boxer-briefs", color: { r: 1, g: 0, b: 1 } },
      rest,
      posed,
    }).material.baseColor.r,
    1,
  );
  const { pelvis: _, ...landmarks } = rest.landmarks;
  TestValidator.error("a missing landmark is refused", () =>
    dress({
      underwear: { style: "boxer-briefs" },
      rest: { ...rest, landmarks },
      posed,
    }),
  );
  for (const nipple of [
    { surface: 7, vertex: 0 },
    { surface: 0, vertex: rest.surfaces[0]!.length / 3 },
    { surface: 0, vertex: -1 },
    { surface: 0, vertex: 0.5 },
  ]) {
    const wrong = createHumanBodyUnderwear(basis, {
      ...table,
      bra: { ...table.bra, nipple },
    });
    TestValidator.error(
      `the bra refuses nipple ${JSON.stringify(nipple)}`,
      () => wrong({ underwear: { style: "bra-and-briefs" }, rest, posed }),
    );
    TestValidator.equals(
      "the boxer briefs read no nipple",
      wrong({ underwear: { style: "boxer-briefs" }, rest, posed }).parts.length,
      2,
    );
  }
};
