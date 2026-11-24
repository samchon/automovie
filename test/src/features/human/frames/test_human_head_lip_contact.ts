import {
  AutoMovieLoftViewFullSource,
  AutoMovieViewLoft,
} from "@automovie/engine";
import {
  AutoMovieHumanConicLoft,
  AutoMovieHumanConicSection,
  AutoMovieHumanHeadLipContact,
  AutoMovieHumanHeadLipSkin,
} from "@automovie/human";
import type { IAutoMovieViewPart } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Both lip borders use a prescribed chord of one original mass surface. On a
 * vertical radius-10 cylinder, the forward surface at lateral ±6 is exactly 8
 * mm. A border from height 15 therefore keeps both its forward and lateral
 * coordinates while its vertical displacement equals the supplied height.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the same original contact and signed border curves used by both lip parts.
 * @evidence contracts/development/testing.md#independent-expectations The 6–8–10 triangle determines the parent surface and Cartesian distances determine the border and section midpoint.
 * @evidence contracts/development/testing.md#distinguishing-cases Uses an asymmetric upper and lower height, both lateral signs, and a zero-height corner.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit with an original conic cylinder and no realized body.
 */
export function test_human_head_lip_contact(): void {
  const radius: number = 10;
  const ellipse: number = Math.SQRT2 - 1;
  const controls: number[] = [
    radius,
    0,
    0,
    radius,
    -radius,
    0,
    0,
    -radius,
    ellipse,
    ellipse,
    ellipse,
    ellipse,
  ];
  const parent = AutoMovieHumanConicLoft.part(
    {
      name: "head.mass",
      centres: [
        [0, 0, 0],
        [0, 30, 0],
      ],
      halves: [],
      up: [1, 0, 0],
      layout: AutoMovieHumanConicSection.limb(0),
      knots: [0, 30],
      values: controls.map((value): number[] => [value, value]),
    },
    [0, 15, 30],
    false,
  );
  const contact = AutoMovieHumanHeadLipContact.create(parent, 15);
  for (const z of [-6, 6]) {
    const rest = contact.at(z);
    TestValidator.predicate(
      "the contact lies on the forward cylinder",
      () =>
        nclose(rest.point[0], 8, 1e-9) &&
        rest.point[1] === 15 &&
        rest.point[2] === z,
    );
    for (const [height, side] of [
      [3, 1],
      [4, -1],
      [0, 1],
    ] as const) {
      const { border, frame } = contact.section(z, height, side, [0, 0]);
      TestValidator.predicate(
        "each border retains its requested signed chord",
        () =>
          nclose(border[0], 8, 1e-9) &&
          nclose(border[1], 15 + side * height, 1e-9) &&
          border[2] === z,
      );
      TestValidator.predicate(
        "the chord midpoint is the new chart origin",
        () =>
          nclose(frame.origin[0], 8, 1e-9) &&
          nclose(frame.origin[1], 15 + (side * height) / 2, 1e-9) &&
          frame.origin[2] === z,
      );
    }
  }

  const lip = (name: string, height: number): IAutoMovieViewPart => ({
    ...parent,
    name,
    front: {
      ...parent.front,
      positive: {
        knots: [
          { site: "cheilion.right", station: -6, value: 0 },
          { site: "labrale", station: 0, value: height / 2 },
          { site: "cheilion.left", station: 6, value: 0 },
        ],
      },
    },
  });
  const skin = AutoMovieHumanHeadLipSkin.of(
    parent,
    { mouthWidth: 6, stomion: 15, lips: [2, 1.5] },
    lip("lip.upper", 3),
    lip("lip.lower", 4),
  );
  const native = AutoMovieLoftViewFullSource.create(parent);
  const realized = AutoMovieLoftViewFullSource.create(skin);
  TestValidator.predicate(
    "the parent-owned face loft admits the whole lip field",
    () => AutoMovieViewLoft.create(skin).diagnostics.length === 0,
  );

  for (const [y, phi] of [
    [15, 0.3],
    [18, 0],
    [11, 0],
    [15, Math.asin(0.6)],
    [16, Math.PI],
    [14, 0.8],
  ] as const) {
    const before = native.jet(y, phi);
    const after = realized.jet(y, phi);
    TestValidator.predicate(
      "the inherited face point and its complete 2-jet stay at a named boundary or outside",
      () =>
        (["p", "u", "v", "uu", "uv", "vv"] as const).every((key) =>
          before[key].every((value, i) => nclose(value, after[key][i]!, 1e-10)),
        ),
    );
  }
  for (const [y, relief] of [
    [16.5, 2],
    [13, 1.5],
  ] as const)
    TestValidator.predicate(
      "the two interior lobe midpoints keep their own relief",
      () => nclose(realized.point(y, 0)[0], 10 + relief, 1e-10),
    );

  const y: number = 16.3;
  const phi: number = 0.21;
  const step: number = 1e-4;
  const jet = realized.jet(y, phi);
  const x = (station: number, phase: number): number =>
    realized.point(station, phase)[0];
  const dStation: number = (x(y + step, phi) - x(y - step, phi)) / (2 * step);
  const dPhase: number = (x(y, phi + step) - x(y, phi - step)) / (2 * step);
  const mixed: number =
    (x(y + step, phi + step) -
      x(y + step, phi - step) -
      x(y - step, phi + step) +
      x(y - step, phi - step)) /
    (4 * step ** 2);
  TestValidator.predicate(
    "the interior analytic jet differentiates the actual source point",
    () =>
      nclose(jet.u[0], dStation, 3e-6) &&
      nclose(jet.v[0], dPhase, 3e-6) &&
      nclose(jet.uv[0], mixed, 3e-6),
  );
  const perioral = AutoMovieLoftViewFullSource.create(
    AutoMovieHumanHeadLipSkin.of(
      parent,
      { mouthWidth: 6, stomion: 15, lips: [2, 1.5] },
      lip("lip.upper", 3),
      lip("lip.lower", 4),
      [
        { station: 27, depth: 1, width: 5, crest: 3 },
        { station: 5, depth: 1.5, width: 6 },
      ],
    ),
  );
  TestValidator.predicate(
    "both depressions keep their authored centre depth",
    () =>
      nclose(perioral.point(22.5, 0)[0], 9, 1e-10) &&
      nclose(perioral.point(8, 0)[0], 8.5, 1e-10),
  );
  for (const side of [-1, 1]) {
    const phase = Math.asin(side * 0.3);
    TestValidator.predicate(
      "a philtral column frames each side of the midline groove",
      () => perioral.point(22.5, phase)[0] > native.point(22.5, phase)[0],
    );
  }
}
