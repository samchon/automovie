import { realizeAutoMovieConstruction } from "@automovie/engine";
import {
  AutoMovieHumanConicSection as Conic,
  AutoMovieHumanConicLoft as Loft,
} from "@automovie/human";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { FamilyConicMpfbDigitTips as Tips } from "../../../reference-conics/FamilyConicMpfbDigitTips";
import { FamilyConicMpfbFanRootField as Root } from "../../../reference-conics/FamilyConicMpfbFanRootField";

/**
 * A made four-quarter finger has a long synthetic interval between two
 * near-corner controls. The stored conic resolves the actual box at every
 * station. Compiling the clipped guides separately can move the tangent behind
 * that box between the controls. The physical closure must use the valid field
 * and return the original distal owner after its measured root.
 *
 * @evidence contracts/development/testing.md#independent-expectations The made field has a 10 mm symmetric box and constant ellipse shares. Its synthetic guide excursion stresses the outline compilation; its distal sections are held exact.
 * @evidence contracts/development/testing.md#behavioral-verification The ordinary source realizes the closed child with and without the exact prefix and compares its retained local 2-jet after the root.
 */
export function test_human_mpfb_fan_root_field(): void {
  const knots: number[] = [0, 1, 10, 11, 12, 16, 20, 24, 28];
  const mark: number = 16;
  const tip: number = 30;
  const ellipse: number = Math.SQRT2 - 1;
  const values: number[][] = [
    10,
    0,
    0,
    10,
    -10,
    0,
    0,
    -10,
    ellipse,
    ellipse,
    ellipse,
    ellipse,
  ].map((value): number[] => knots.map((): number => value));
  values[5] = [0, -9.2, -9.2, 0, 0, 0, 0, 0, 0];
  const family: IAutoMovieHumanConicLoft.IFamily = {
    name: "made.ring",
    centres: [
      [0, 0, 0],
      [0, 35, 0],
    ],
    halves: [],
    up: [1, 0, 0],
    layout: Conic.limb(0),
    knots,
    values,
    rootSectionMark: mark,
  };
  const closed: IAutoMovieViewPart = Tips.close(family, knots, {
    from: 24,
    tip,
    pole: Loft.axis(family).at(tip).origin,
  });
  const exact: IAutoMovieViewPart = Root.close(family, knots, closed);
  const name: string = family.name;
  const read = (view: IAutoMovieViewPart) =>
    realizeAutoMovieConstruction(
      { name, root: { type: "source", name, source: name } },
      { chord: 0.001, skin: false, sources: new Map([[name, view]]) },
    );
  const raw = read(closed);
  if (
    !raw.diagnostics.some(({ detail }): boolean =>
      detail.includes("tangent lines meet behind"),
    )
  )
    throw new Error(
      "The made capped source lost its between-station tangent refusal",
    );
  const fixed = read(exact);
  if (fixed.diagnostics.length !== 0)
    throw new Error(JSON.stringify(fixed.diagnostics));
  const legacy = closed.originalSection!;
  const native = exact.originalSection!;
  for (const station of [mark, 20, 23]) {
    for (const phase of [0, Math.PI / 3, 1.2 * Math.PI]) {
      if (
        JSON.stringify(legacy.jet(station, phase)) !==
        JSON.stringify(native.jet(station, phase))
      )
        throw new Error(
          `The fitted prefix changed the distal 2-jet at ${station} mm`,
        );
    }
  }
}
