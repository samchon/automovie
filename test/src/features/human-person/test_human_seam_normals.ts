import { fairHumanSeamNormals } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * Fairing turns a step in the normals into a gradient inside a band and leaves
 * everything outside it exactly as it was.
 *
 * The mesh is a strip of ten columns (x = 0..9) and two rows, flat to the left
 * of the seam at column 5 and tilted 40 degrees about Z to its right. Its
 * normals are the vertex normals a fold gives: unit (0,1,0) for columns 0..4,
 * the tilted normal for columns 6..9, and their mean for the seam at 5.
 *
 * Scenarios:
 * 1. With three rings from the seam column, columns 0, 1 and 9 (beyond the
 *    rings) are exactly as given; columns 2..8 differ.
 * 2. The step between neighbouring columns at the seam is smaller after
 *    fairing than before, and every result is a unit vector.
 * 3. The tilt (the angle of the normal from +Y) rises monotonically across the
 *    columns, so the result is a gradient and no overshoot.
 * 4. No seeds, or zero rings, change nothing; the input is not modified.
 * 5. A negative or fractional ring count refuses.
 */
export const test_human_seam_normals = (): void => {
  const columns = 10;
  const tilt = (40 * Math.PI) / 180;
  const flat = [0, 1, 0];
  const tilted = [-Math.sin(tilt), Math.cos(tilt), 0];
  const seam = 5;
  const normalOf = (column: number): number[] =>
    column < seam
      ? flat
      : column > seam
        ? tilted
        : (() => {
            const mean = [
              (flat[0] + tilted[0]) / 2,
              (flat[1] + tilted[1]) / 2,
              0,
            ];
            const length = Math.hypot(mean[0], mean[1]);
            return mean.map((value) => value / length);
          })();
  // vertex = column * 2 + row; two triangles per cell
  const indices: number[] = [];
  for (let column = 0; column + 1 < columns; column++) {
    const [a, b, c, d] = [
      column * 2,
      column * 2 + 1,
      column * 2 + 2,
      column * 2 + 3,
    ];
    indices.push(a, c, b, b, c, d);
  }
  const normals = Array.from({ length: columns * 2 }, (_, v) =>
    normalOf(Math.floor(v / 2)),
  ).flat();
  const before = normals.slice();
  const seeds = [seam * 2, seam * 2 + 1];
  const faired = fairHumanSeamNormals({ indices, normals, seeds, rings: 3 });
  const at = (list: readonly number[], column: number): number[] =>
    list.slice(column * 6, column * 6 + 3);
  const same = (a: readonly number[], b: readonly number[]): boolean =>
    a.every((value, k) => value === b[k]);

  TestValidator.predicate(
    "columns beyond the rings are exactly as given",
    [0, 1, 9].every((column) => same(at(faired, column), at(before, column))),
  );
  TestValidator.predicate(
    "columns inside the rings change",
    [2, 3, 4, 5, 6, 7, 8].every(
      (column) => !same(at(faired, column), at(before, column)),
    ),
  );
  const angle = (list: readonly number[], column: number): number =>
    Math.acos(Math.min(1, list[column * 6 + 1]));
  const step = (list: readonly number[]): number =>
    Math.max(
      ...Array.from({ length: columns - 1 }, (_, k) =>
        Math.abs(angle(list, k + 1) - angle(list, k)),
      ),
    );
  TestValidator.predicate(
    "the largest step between columns shrinks",
    step(faired) < step(before),
  );
  TestValidator.predicate(
    "every normal is a unit vector",
    Array.from({ length: columns * 2 }, (_, v) =>
      nclose(Math.hypot(...faired.slice(v * 3, v * 3 + 3)), 1, 1e-12),
    ).every(Boolean),
  );
  TestValidator.predicate(
    "the tilt rises without overshoot",
    Array.from({ length: columns - 1 }, (_, k) => k).every(
      (k) => angle(faired, k + 1) >= angle(faired, k) - 1e-12,
    ) && angle(faired, 8) <= tilt + 1e-12,
  );

  TestValidator.equals(
    "no seeds change nothing",
    fairHumanSeamNormals({ indices, normals, seeds: [], rings: 3 }),
    before,
  );
  TestValidator.equals(
    "zero rings change nothing",
    fairHumanSeamNormals({ indices, normals, seeds, rings: 0 }),
    before,
  );
  TestValidator.equals("the input is not modified", normals, before);
  for (const bad of [-1, 1.5])
    TestValidator.predicate(
      bad + " rings refuse",
      throwsError(
        () => fairHumanSeamNormals({ indices, normals, seeds, rings: bad }),
        "nonnegative integer",
      ),
    );
};
