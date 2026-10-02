import type { AutoMovieHumanoidBone } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { neighboursOf } from "../../../scripts/body-basis/bodyContactGeometry";
import type { BodyContactBones } from "../../../scripts/body-basis/bodyContactPlanes";
import {
  type IBodyContactWork,
  resolveBodyCrease,
} from "../../../scripts/body-basis/resolveBodyContactPair";
import { createBodyContactPatchFixture } from "../internal/bodyContactPatchFixture";

const identity = { x: 0, y: 0, z: 0, w: 1 };

const bone = (z: number, parent: AutoMovieHumanoidBone | null) => ({
  position: { x: 0, y: 0, z },
  rotation: identity,
  length: 0.005,
  parent,
});

/**
 * Resolving a segment that passes through itself: relaxed into one fold, or
 * split into sheets and pushed apart.
 *
 * The skin is the two-patch fixture (see `createBodyContactPatchFixture`) read
 * as one segment whose tent pierces its flat patch. The bones are hand-placed.
 *
 * Scenarios:
 * 1. A shallow crease relaxes: the log says `relax:ok` and only that, and
 *    vertices moved.
 * 2. A crease too deep for a digit's 8 mm budget does not relax and is split
 *    into the sheets of each tangle, each pushed apart: the log has the failed
 *    relaxation and then one solved line per tangle, with a parent joint to
 *    offer a fold plane and at the root, where none is offered.
 */
export const test_human_body_resolve_crease = (): void => {
  const work = (
    fixture: ReturnType<typeof createBodyContactPatchFixture>,
    part: string,
    parent: AutoMovieHumanoidBone | null,
    bones: BodyContactBones,
  ): IBodyContactWork => ({
    segments: new Map([[part, [...fixture.a, ...fixture.b]]]),
    near: neighboursOf(fixture.indices, fixture.vertices),
    parents: new Map<AutoMovieHumanoidBone, AutoMovieHumanoidBone | null>([
      [part as AutoMovieHumanoidBone, parent],
    ]),
    dominant: () => part,
    bones,
    base: fixture.positions.slice(),
    positions: fixture.positions.slice(),
    posed: new Map(),
    standing: new Map(),
    log: [],
  });

  // 1. relaxed
  const creased = work(
    createBodyContactPatchFixture(),
    "spine",
    "hips",
    new Map([
      ["spine" as const, bone(0.02, "hips")],
      ["hips" as const, bone(-0.02, null)],
    ]),
  );
  resolveBodyCrease(creased, "spine");
  TestValidator.equals("a shallow crease relaxes", creased.log.length, 1);
  TestValidator.predicate(
    "the log says so",
    creased.log[0].endsWith("relax:ok@5"),
  );
  TestValidator.predicate("vertices moved", creased.posed.size > 0);

  // 2. split into sheets
  const deep = createBodyContactPatchFixture(3, 0.03);
  for (const [title, parent] of [
    ["with a parent joint", "leftHand"],
    ["at the root", null],
  ] as const) {
    const sheets = work(
      deep,
      "leftIndexProximal",
      parent,
      new Map([
        ["leftIndexProximal" as const, bone(0, null)],
        ["leftHand" as const, bone(-0.01, null)],
      ]),
    );
    resolveBodyCrease(sheets, "leftIndexProximal");
    TestValidator.equals(
      title + ": relaxation fails within 8 mm",
      sheets.log[0],
      "[leftIndexProximal]relax:left@60",
    );
    TestValidator.predicate(
      title + ": each tangle is pushed apart and solved",
      sheets.log.length > 1 &&
        sheets.log
          .slice(1)
          .every((line) => /^\[leftIndexProximal\]#\d+:ok:/.test(line)),
    );
  }
};
