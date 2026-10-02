import type { AutoMovieHumanoidBone } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  crossedCorners,
  neighboursOf,
} from "../../../scripts/body-basis/bodyContactGeometry";
import type { BodyContactBones } from "../../../scripts/body-basis/bodyContactPlanes";
import {
  type IBodyContactWork,
  resolveBodyPair,
} from "../../../scripts/body-basis/resolveBodyContactPair";
import { createBodyContactPatchFixture } from "../internal/bodyContactPatchFixture";

const identity = { x: 0, y: 0, z: 0, w: 1 };

const bone = (
  z: number,
  parent: AutoMovieHumanoidBone | null,
  length = 0.005,
  rotation = identity,
) => ({ position: { x: 0, y: 0, z }, rotation, length, parent });

/**
 * Resolving two different crossing segments: pushed apart, or left alone
 * when a bone passes through the other's skin.
 *
 * The skin is the two-patch fixture (see `createBodyContactPatchFixture`), the
 * flat patch and the pierced tent. The bones are hand-placed: a bone runs from
 * its head along its rotation's local Y column.
 *
 * Scenarios:
 * 1. Two segments that cross are parted against a plane: the log names the
 *    pair, the rule and that it was solved, nothing crosses afterwards and
 *    vertices moved.
 * 2. A bone that runs through the other segment's skin leaves the pair alone:
 *    the log says so and no vertex moved; the negative twin, the same pair
 *    with a short bone, is parted (scenario 1).
 */
export const test_human_body_resolve_contact = (): void => {
  const fixture = createBodyContactPatchFixture();
  const remaining = (work: IBodyContactWork, a: number[], b: number[]) =>
    crossedCorners(work.positions, a, b).size +
    crossedCorners(work.positions, b, a).size;
  const work = (
    positions: number[],
    indices: number[],
    vertices: number,
    segments: Map<string, number[]>,
    parents: Map<AutoMovieHumanoidBone, AutoMovieHumanoidBone | null>,
    bones: BodyContactBones,
  ): IBodyContactWork => ({
    segments,
    near: neighboursOf(indices, vertices),
    parents,
    dominant: (v) => (v < 9 ? "flat" : "tent"),
    bones,
    base: positions.slice(),
    positions: positions.slice(),
    posed: new Map(),
    standing: new Map(),
    log: [],
  });
  const pair = (bones: BodyContactBones) =>
    work(
      fixture.positions,
      fixture.indices,
      fixture.vertices,
      new Map([
        ["flat", fixture.a],
        ["tent", fixture.b],
      ]),
      new Map<AutoMovieHumanoidBone, AutoMovieHumanoidBone | null>([
        ["hips", null],
        ["spine", "hips"],
      ]),
      bones,
    );
  const short: BodyContactBones = new Map([
    ["flat" as const, bone(-0.02, null)],
    ["tent" as const, bone(0.02, "hips")],
  ] as never);

  // 1. parted
  const parted = pair(short);
  resolveBodyPair(parted, "flat", "tent");
  TestValidator.equals("one line for the pair", parted.log.length, 1);
  TestValidator.predicate(
    "the line names the pair, its rule and that it was solved",
    /^flatxtent\[[a-z-]+\]:ok:[a-z-]+@\d+$/.test(parted.log[0]),
  );
  TestValidator.equals(
    "nothing crosses afterwards",
    remaining(parted, fixture.a, fixture.b),
    0,
  );
  TestValidator.predicate("vertices moved", parted.posed.size > 0);

  // 2. a bone through the skin
  const through = pair(
    new Map([
      [
        "flat" as const,
        bone(-0.02, null, 1, { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 }),
      ],
      ["tent" as const, bone(0.02, "hips")],
    ] as never),
  );
  resolveBodyPair(through, "flat", "tent");
  TestValidator.equals("the pair is left alone", through.log, [
    "flatxtent:bone through skin",
  ]);
  TestValidator.equals("and nothing moved", through.posed.size, 0);
  const other = pair(
    new Map([
      ["flat" as const, bone(-0.02, null)],
      [
        "tent" as const,
        {
          ...bone(0.02, "hips", 1, {
            x: -Math.SQRT1_2,
            y: 0,
            z: 0,
            w: Math.SQRT1_2,
          }),
          position: { x: 0.0031, y: 0.0017, z: 0.02 },
        },
      ],
    ] as never),
  );
  resolveBodyPair(other, "flat", "tent");
  TestValidator.predicate(
    "the other segment's bone counts as well",
    other.log.length === 1 && other.log[0].endsWith("bone through skin"),
  );
};
