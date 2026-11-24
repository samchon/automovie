import {
  AutoMovieHumanConicLoft,
  AutoMovieHumanConicSection,
  AutoMovieHumanHeadLipContact,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Both lip borders use a prescribed chord of one original mass surface. On a
 * vertical radius-10 cylinder, the forward surface at lateral ±6 is exactly
 * 8 mm. A border from height 15 therefore keeps both its forward and lateral
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
    radius, 0, 0, radius, -radius, 0, 0, -radius,
    ellipse, ellipse, ellipse, ellipse,
  ];
  const parent = AutoMovieHumanConicLoft.part(
    {
      name: "head.mass",
      centres: [[0, 0, 0], [0, 30, 0]],
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
    TestValidator.predicate("the contact lies on the forward cylinder", () =>
      nclose(rest.point[0], 8, 1e-9) && rest.point[1] === 15 && rest.point[2] === z,
    );
    for (const [height, side] of [[3, 1], [4, -1], [0, 1]] as const) {
      const { border, frame } = contact.section(z, height, side, [0, 0]);
      TestValidator.predicate("each border retains its requested signed chord", () =>
        nclose(border[0], 8, 1e-9) &&
        nclose(border[1], 15 + side * height, 1e-9) &&
        border[2] === z,
      );
      TestValidator.predicate("the chord midpoint is the new chart origin", () =>
        nclose(frame.origin[0], 8, 1e-9) &&
        nclose(frame.origin[1], 15 + side * height / 2, 1e-9) &&
        frame.origin[2] === z,
      );
    }
  }
}
