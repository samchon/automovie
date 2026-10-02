import { TestValidator } from "@nestia/e2e";

import { faceEyelashTransverseScale } from "../../../scripts/face-review/faceEyelashTransverseScale";
import { locateFaceEyelashTriangle } from "../../../scripts/face-review/locateFaceEyelashTriangle";
import type { IEyelashCard } from "../../../scripts/face-review/prepareEyelashBasis";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A physical diameter must use the transverse UV metric, even when a card's
 * texture axes scale differently or shear. The expected values are independent
 * triangle area and side-length calculations in metres.
 *
 * Scenarios:
 * 1. A 20 by 10 mm card over UV 0.8 by 0.6 gives 25 mm per UV unit across
 *    a vertical fibre and 16.666... mm across a horizontal fibre. A 0.1 mm
 *    vertical fibre on a 100-pixel texture is 0.4 pixels wide, not 0.6.
 * 2. A sheared map J(u,v)=(u+v,v,0) has transverse scale 1/sqrt(2) along
 *    UV v; a rigid rotation and UV winding reversal preserve that value.
 * 3. A collinear UV patch is skipped, shared edges are admitted, and an
 *    outside point, zero direction and collapsed physical patch refuse.
 * 4. Card arrays, UV point and direction remain unchanged.
 */
export const test_subject_eyelash_transverse_scale = (): void => {
  const triangle: IEyelashCard["triangles"][number] = {
    uv: [[0, 0], [0.8, 0], [0, 0.6]],
    xyz: [[0, 0, 0], [0.02, 0, 0], [0, 0.01, 0]],
  };
  const card: IEyelashCard = {
    root: [[0, 0], [0.8, 0]], tip: [[0, 0.6], [0.8, 0.6]],
    triangles: [triangle], lateralFirst: false,
  };
  const point: [number, number] = [0.2, 0.2];
  const direction: [number, number] = [0, 1];
  const snapshot = JSON.stringify({ card, point, direction });
  const vertical = faceEyelashTransverseScale(card, point, direction);
  TestValidator.predicate("vertical diameter uses horizontal physical scale",
    nclose(vertical, 0.025, 1e-12) && nclose(0.0001 * 100 / vertical, 0.4, 1e-12));
  TestValidator.predicate("horizontal diameter uses vertical physical scale",
    nclose(faceEyelashTransverseScale(card, point, [1, 0]), 0.01 / 0.6, 1e-12));
  const frames: IEyelashCard["triangles"][number]["xyz"][] = [
    [[0, 0, 0], [1, 0, 0], [1, 1, 0]],
    [[0, 0, 0], [0, 1, 0], [0, 1, 1]],
  ];
  for (const xyz of frames) {
    const sheared: IEyelashCard = { ...card, triangles: [{ uv: [[0, 0], [1, 0], [0, 1]], xyz }] };
    TestValidator.predicate("UV shear and rigid rotation preserve physical width",
      nclose(faceEyelashTransverseScale(sheared, point, direction), 1 / Math.sqrt(2), 1e-12));
    const reversed: IEyelashCard = { ...sheared, triangles: [{ uv: [sheared.triangles[0].uv[0], sheared.triangles[0].uv[2], sheared.triangles[0].uv[1]], xyz: [xyz[0], xyz[2], xyz[1]] }] };
    TestValidator.predicate("winding reversal keeps the metric",
      nclose(faceEyelashTransverseScale(reversed, point, direction), 1 / Math.sqrt(2), 1e-12));
  }
  const degenerate: typeof triangle = { ...triangle, uv: [[0, 0], [1, 0], [2, 0]] };
  TestValidator.predicate("zero UV area skips to a real patch",
    locateFaceEyelashTriangle({ ...card, triangles: [degenerate, triangle] }, point)?.triangle === triangle);
  TestValidator.predicate("shared edge point remains admitted",
    locateFaceEyelashTriangle(card, [0.4, 0.3]) !== null);
  const outside: [number, number][] = [[1, 1], [-1, 0.1], [0.1, -1]];
  for (const sample of outside)
    TestValidator.predicate("each triangle edge has an outside refusal",
      throwsError(() => faceEyelashTransverseScale(card, sample, direction), "point on its UV card"));
  TestValidator.predicate("zero path direction refuses",
    throwsError(() => faceEyelashTransverseScale(card, point, [0, 0]), "nonzero UV direction"));
  const collapsed: IEyelashCard = { ...card, triangles: [{ ...triangle, xyz: [[0, 0, 0], [1, 0, 0], [2, 0, 0]] }] };
  TestValidator.predicate("zero physical area refuses",
    throwsError(() => faceEyelashTransverseScale(collapsed, point, direction), "nondegenerate physical card"));
  TestValidator.equals("caller data remains unchanged", JSON.stringify({ card, point, direction }), snapshot);
};
