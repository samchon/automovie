import {
  AutoMovieHumanConicLoft,
  AutoMovieHumanConicSection,
  AutoMovieHumanHandAttachment,
} from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanDigitWalk,
} from "@automovie/interface";
import assert from "node:assert/strict";

/**
 * Select a root whose whole oblique child plane has support in the parent
 * chart.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads both dorsal and all quarter exits from the actual parent field.
 * @evidence contracts/development/testing.md#independent-expectations The cylinder has radius 10 mm and starts at z=0. The deepest candidate on the initial line has x=0, z=1, but its positive dorsal ray reaches z=0 while still inside.
 * @evidence contracts/development/testing.md#distinguishing-cases Tests an oblique fallback, an already admissible joint, and an extension with no supported interior.
 * @evidence contracts/development/testing.md#execution-ownership Builds one straight independent parent and evaluates three exact child axes.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the six boundaries and the finite-domain cause of rejection.
 */
export function test_human_hand_attachment(): void {
  const family: IAutoMovieHumanConicLoft.IFamily = {
    name: "test.palm",
    centres: [
      [0, 0, 0],
      [0, 0, 40],
    ],
    halves: [],
    up: [0, 1, 0],
    layout: AutoMovieHumanConicSection.limb(0),
    knots: [0, 20, 40],
    values: [
      10,
      0,
      0,
      10,
      -10,
      0,
      0,
      -10,
      ...new Array<number>(4).fill(Math.SQRT2 - 1),
    ].map((value): number[] => [value, value, value]),
  };
  const parent = AutoMovieHumanHandAttachment.prepare({
    part: AutoMovieHumanConicLoft.part(family, [0, 10, 20, 30, 40]),
    view: null,
    diagnostics: [],
  });
  const digit = (
    name: string,
    centres: AutoMovieVector3Tuple[],
  ): IAutoMovieHumanDigitWalk.IInput => ({
    name,
    centres,
    dorsal: [1, 0, 0],
    tip: 1,
    law: () => ({
      breadth: 5,
      depth: 5,
      dorsal: 0.5,
      shoulder: Math.SQRT2 - 1,
    }),
    order: 16,
    gap: 2,
  });

  const oblique = digit("test.oblique", [
    [12, 0, 10],
    [28, 0, 22],
    [36, 0, 28],
  ]);
  const built = AutoMovieHumanHandAttachment.attach(parent, oblique);
  const { root, section, joint, jointSection, dorsalChord, quarterRays } =
    built.attachment;
  assert.deepEqual(joint, [12, 0, 10]);
  assert.ok(jointSection && jointSection.margin < 0);
  assert.deepEqual(built.centres.slice(1), oblique.centres.slice(1));
  assert.ok(root[0] > 0 && root[0] < 10 && section.margin > 0);
  assert.ok(Math.abs(root[2] - (1 + 0.75 * root[0])) < 1e-10);
  for (const ray of [dorsalChord.lower, dorsalChord.upper, ...quarterRays]) {
    assert.ok(ray.inside.margin > 0 && ray.outside.margin <= 0);
    assert.ok(Math.abs(ray.bracket[1] - ray.bracket[0]) <= 1e-7);
  }

  const perpendicular = digit("test.perpendicular", [
    [0, 0, 20],
    [0, 0, 30],
    [0, 0, 35],
  ]);
  assert.deepEqual(
    AutoMovieHumanHandAttachment.attach(parent, perpendicular).attachment.root,
    perpendicular.centres[0],
  );

  const unavailable = digit("test.unavailable", [
    [12, 0, 1],
    [28, 0, 13],
    [36, 0, 19],
  ]);
  assert.throws(
    () => AutoMovieHumanHandAttachment.attach(parent, unavailable),
    /no interior root with six qualified arm\/palm ray boundaries/,
  );
}
