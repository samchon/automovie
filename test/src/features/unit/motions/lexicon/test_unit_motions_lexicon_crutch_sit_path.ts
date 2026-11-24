import type {
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { crutchSitPath } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** No turn. */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/** A contact at a point of the crutch. */
const contact = (id: string, y: number): IAutoMovieAffordance => ({
  id,
  kind: id === "grip" ? "handle" : "surface",
  frame: {
    translation: { x: 0, y, z: 0 },
    rotation: IDENTITY,
    scale: { x: 1, y: 1, z: 1 },
  },
  extent: null,
});

/** A crutch whose tip is at its origin and whose grip is 0.8 m up its shaft. */
const CRUTCH: crutchSitPath.ICrutch = crutchSitPath.crutch("crutch", [
  contact("grip", 0.8),
  contact("tip", 0),
]);

/** A point. */
const P = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });

/**
 * `crutchSitPath` reads a crutch's grip and tip, stands it on its tip and
 * carries it between frames on a minimum-jerk share, its tip lifted 4 cm at the
 * move's middle.
 *
 * Scenarios:
 *
 * 1. The crutch's grip is 0.8 m above its tip; a crutch with no tip is refused.
 * 2. Stood upright on a tip at (1, 0, 2), handgrip facing +Z, it is unturned and
 *    placed there.
 * 3. Carried half way between two upright frames a metre apart, it is half way and
 *    4 cm up; past the end it is at the second.
 */
export function test_unit_motions_lexicon_crutch_sit_path(): void {
  TestValidator.predicate(
    "the crutch",
    nclose(CRUTCH.length, 0.8, 1e-12) && vclose(CRUTCH.grip, P(0, 0.8, 0), 0),
  );
  TestValidator.error("no tip", () =>
    crutchSitPath.crutch("crutch", [contact("grip", 0.8)]),
  );

  const stood: IAutoMovieRigidTransform = crutchSitPath.slid(
    CRUTCH,
    P(1, 0, 2),
    P(1, 1, 2),
    P(0, 0, 1),
  );
  TestValidator.predicate(
    "stood upright",
    vclose(stood.position, P(1, 0, 2), 1e-12) &&
      Math.abs(Math.abs(stood.rotation.w) - 1) < 1e-12,
  );

  const from: IAutoMovieRigidTransform = {
    position: P(0, 0, 0),
    rotation: IDENTITY,
  };
  const to: IAutoMovieRigidTransform = {
    position: P(1, 0, 0),
    rotation: IDENTITY,
  };
  TestValidator.predicate(
    "carried",
    vclose(
      crutchSitPath.carried(from, to, 0.5).position,
      P(0.5, 0.04, 0),
      1e-12,
    ) && vclose(crutchSitPath.carried(from, to, 2).position, P(1, 0, 0), 1e-12),
  );
}
