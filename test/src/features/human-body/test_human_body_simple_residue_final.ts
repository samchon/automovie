import {
  type IAutoMovieHumanBodySimpleShape,
  expandHumanBodySimpleShape,
  measureHumanBodySimpleShape,
  projectHumanBodySimpleShape,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodySimpleFixture } from "../internal/humanBodySimpleFixture";
import { nclose } from "../internal/predicates";

/**
 * A simple body expanded over a detailed shape reads the requested values.
 *
 * The residue-bearing result is the old shape plus the difference of two
 * canonical expansions. That difference moves each reading by its change on
 * the canonical body, which is exact only where a reading adds up over the
 * channels, and a skin volume or a tape section does not. The result is
 * therefore solved again along the named directions and held to the same
 * budgets as a canonical expansion: 0.1 mm of stature, 50 g of mass and 1 mm
 * of tape. Expected readings come from the request, and the analytic box of
 * `humanBodySimpleFixture` supplies the surface.
 *
 * Scenarios:
 * 1. The plain difference of the two expansions, composed here from the
 *    public expansion, misses a budget when the age moves from 25 to 60 over
 *    a shape with edits on named channels, so the case discriminates.
 * 2. Over that shape the returned body meets the stature, mass and waist
 *    requests inside their budgets, and the channels outside the named
 *    directions (ptosis, firmness, the unnamed width) equal the plain
 *    difference exactly.
 * 3. A request equal to the body's own projection returns every channel
 *    within 1e-12, the rounding of adding and subtracting one expansion, so
 *    an unchanged value changes nothing.
 * 4. A residue that no weight can compensate is refused with the misses: the
 *    edit widens the body while the request asks for the lightest mass the
 *    weight channel reaches, and the weight composed from the difference
 *    stops at its lower envelope.
 */
export const test_human_body_simple_residue_final = (): void => {
  const { wide, narrow } = humanBodySimpleFixture.weights;
  const basis = humanBodySimpleFixture.basis(wide, narrow);
  const budgets = { stature: 1e-4, mass: 0.05, waist: 1e-3 };
  const base: IAutoMovieHumanBodySimpleShape = {
    sex: 1,
    ageYears: 25,
    statureMetres: 1.85,
    massKilograms: 22 * 1.85 * 1.85,
    muscle: 0.5,
  };
  const canonical = expandHumanBodySimpleShape(basis, base);
  const waistOf = (shape: Record<string, number>): number =>
    measureHumanBodySimpleShape.channel(basis, shape, "measureWaistCirc")!;
  const reach = [-1, 1].map((weight) =>
    waistOf({ ...canonical, measureWaistCirc: weight }),
  );
  const belted = expandHumanBodySimpleShape(basis, {
    ...base,
    waistMetres: reach[0] + 0.3 * (reach[1] - reach[0]),
  });
  const edited: Record<string, number> = {
    ...belted,
    buttocksPtosis: 0.35,
    macroFirmness: -0.4,
    width: 0.3,
  };
  const own = projectHumanBodySimpleShape(basis, edited, ["waistMetres"]);
  const errors = (
    shape: Record<string, number>,
    request: IAutoMovieHumanBodySimpleShape,
  ): { stature: number; mass: number; waist: number } => {
    const read = projectHumanBodySimpleShape(basis, shape, ["waistMetres"]);
    return {
      stature: Math.abs(read.statureMetres - request.statureMetres),
      mass: Math.abs(read.massKilograms - request.massKilograms),
      waist: Math.abs(read.waistMetres! - request.waistMetres!),
    };
  };
  const within = (found: { stature: number; mass: number; waist: number }) =>
    found.stature <= budgets.stature &&
    found.mass <= budgets.mass &&
    found.waist <= budgets.waist;
  // the plain difference of two canonical expansions, composed independently
  const composed = (
    request: IAutoMovieHumanBodySimpleShape,
  ): Record<string, number> => {
    const target = expandHumanBodySimpleShape(basis, request);
    const origin = expandHumanBodySimpleShape(basis, own);
    const result: Record<string, number> = {};
    for (const id of new Set([
      ...Object.keys(edited),
      ...Object.keys(target),
      ...Object.keys(origin),
    ])) {
      const channel = basis.channels.find((one) => one.id === id)!;
      result[id] = Math.min(
        channel.maximum,
        Math.max(
          channel.minimum,
          (edited[id] ?? 0) + (target[id] ?? 0) - (origin[id] ?? 0),
        ),
      );
    }
    return result;
  };

  const older = { ...own, ageYears: 60 };
  const plain = composed(older);
  TestValidator.predicate(
    "the plain difference misses a budget",
    !within(errors(plain, older)),
  );
  const result = expandHumanBodySimpleShape(basis, older, edited);
  TestValidator.predicate(
    "the residue-bearing body meets the request",
    within(errors(result, older)),
  );
  for (const id of ["buttocksPtosis", "macroFirmness", "width"])
    TestValidator.equals(`${id} keeps its residue`, result[id], plain[id]);
  TestValidator.predicate(
    "age moved",
    nclose(result.macroAge, 35 / 65, 1e-4),
  );

  const same = expandHumanBodySimpleShape(basis, own, edited);
  for (const id of new Set([...Object.keys(edited), ...Object.keys(same)]))
    TestValidator.predicate(
      `unchanged ${id}`,
      nclose(same[id] ?? 0, edited[id] ?? 0, 1e-12),
    );

  // The lightest body the weight channel reaches, plus five kilograms, with
  // no waist named (a body this light cannot keep the edited waist). The wide
  // edit adds far more than that to the composed body, which cannot go below
  // the lower envelope, so no weight meets the request.
  const floor = projectHumanBodySimpleShape(basis, {
    ...canonical,
    macroWeight: -1,
  });
  const light = {
    ...own,
    waistMetres: undefined,
    massKilograms: floor.massKilograms + 5,
  };
  let refusal = "";
  try {
    expandHumanBodySimpleShape(basis, light, edited);
  } catch (error) {
    refusal = error instanceof Error ? error.message : String(error);
  }
  TestValidator.predicate(
    "an uncompensable residue is refused with the mass miss",
    refusal.includes("cannot hold together") && refusal.includes("massKilograms"),
  );
  const unwidened = { ...edited };
  delete unwidened.width;
  const lighter = expandHumanBodySimpleShape(basis, light, unwidened);
  TestValidator.predicate(
    "the same request over the residue without the wide edit is met",
    nclose(
      projectHumanBodySimpleShape(basis, lighter, ["waistMetres"]).massKilograms,
      light.massKilograms,
      budgets.mass,
    ),
  );
};
