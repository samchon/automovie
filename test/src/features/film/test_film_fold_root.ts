import { Quaternion, foldRoot } from "@automovie/engine";
import { IAutoMovieTransform } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose, vclose } from "../internal/predicates";

/** A staged actor off the origin, turned 90 degrees about +Y. */
const BASE: IAutoMovieTransform = {
  translation: { x: 3, y: 0, z: -2 },
  rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
  scale: { x: 1, y: 1, z: 1 },
};

/**
 * `foldRoot` places a sampled pose root under its node's staged placement the
 * way the viewer draws it: the root travels in node space, turns with the
 * staging, and its scale is dropped because Engine FK and the viewer ignore
 * pose-root scale (#1052).
 *
 * Scenarios:
 *
 * 1. A null root returns the staged placement itself.
 * 2. A root 1 m along node +X under a +90 degree yaw lands 1 m along world -Z
 *    from the staged position, and its 90 degree yaw adds to the staging's.
 * 3. A root carrying scale 2 keeps the staged unit scale and the same position,
 *    since the viewer never draws a root scale.
 */
export const test_film_fold_root = (): void => {
  TestValidator.equals("a null root is the staged base", foldRoot(BASE, null), BASE);

  const root: IAutoMovieTransform = {
    translation: { x: 1, y: 0, z: 0 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
    scale: { x: 1, y: 1, z: 1 },
  };
  const folded: IAutoMovieTransform = foldRoot(BASE, root);
  TestValidator.predicate(
    "the root travels in node space",
    vclose(folded.translation, { x: 3, y: 0, z: -3 }, 1e-9),
  );
  TestValidator.predicate(
    "the root yaw composes onto the staged yaw",
    qclose(
      folded.rotation,
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 180),
      1e-9,
    ),
  );

  const scaled: IAutoMovieTransform = foldRoot(BASE, {
    ...root,
    scale: { x: 2, y: 2, z: 2 },
  });
  TestValidator.predicate(
    "a root scale is not drawn",
    vclose(scaled.scale, BASE.scale, 1e-9),
  );
  TestValidator.predicate(
    "a root scale does not move the root",
    vclose(scaled.translation, folded.translation, 1e-9),
  );
};
