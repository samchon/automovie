import {
  type IAutoMovieHumanPersonDocument,
  deriveHumanPersonFace,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * A linked person states age and sex once, in the body, by hand.
 *
 * The body's `macroAge` is the macro 0.5 + w * 0.3125 below zero (its child
 * node is 0.1875) and 0.5 + w * 0.5 above; the face's `globalAgeStructure` is
 * (macro - 0.5) / 0.25 below the macro one half (its child node is 0.25) and
 * the same weight above, held at -1.
 *
 * Scenarios:
 * 1. Without `population: "linked"` the face is returned as it is, even with
 *    axes that disagree with the body's.
 * 2. Linked: a body age of -0.4 is the macro 0.375, so the face's is
 *    (0.375 - 0.5) / 0.25 = -0.5; a body age of -1 is the macro 0.1875, past the
 *    face's end, and is held at -1; +0.6 is +0.6; an omitted age is zero.
 * 3. The sex axis carries over one to one, and an omitted one is zero; the
 *    face's other channels are kept and the person's documents are not
 *    modified.
 * 4. A face that states either derived axis is refused.
 */
export const test_human_person_population = (): void => {
  const person = (
    body: Record<string, number>,
    face: Record<string, number> = { headWidth: 0.25 },
    population?: "linked",
  ): IAutoMovieHumanPersonDocument => ({
    id: "p",
    name: "p",
    face: { id: "f", name: "f", basis: "face/1", shape: face, expression: {} },
    body: { id: "b", name: "b", basis: "body/1", shape: body },
    ...(population === undefined ? {} : { population }),
  });
  const derived = (body: Record<string, number>) =>
    deriveHumanPersonFace(person(body, { headWidth: 0.25 }, "linked")).shape;

  const unlinked = person({ macroAge: -1 }, { globalAgeStructure: 0.7 });
  TestValidator.equals(
    "an unlinked face is returned as it is",
    deriveHumanPersonFace(unlinked),
    unlinked.face,
  );

  TestValidator.predicate(
    "a body age of -0.4 is the face's -0.5",
    nclose(derived({ macroAge: -0.4 }).globalAgeStructure, -0.5, 1e-12),
  );
  TestValidator.equals(
    "a body younger than the face's end is held at -1",
    derived({ macroAge: -1 }).globalAgeStructure,
    -1,
  );
  TestValidator.equals(
    "above the middle the axes are equal",
    derived({ macroAge: 0.6 }).globalAgeStructure,
    0.6,
  );
  TestValidator.equals(
    "an omitted age is zero",
    derived({}).globalAgeStructure,
    0,
  );
  TestValidator.equals(
    "sex carries over, other channels stay",
    derived({ macroGender: 1 }),
    { headWidth: 0.25, globalAgeStructure: 0, globalSexualDimorphism: 1 },
  );
  TestValidator.equals(
    "an omitted sex is zero",
    derived({ macroAge: 0.2 }).globalSexualDimorphism,
    0,
  );

  const linked = person({ macroAge: 0.2 }, { headWidth: 0.25 }, "linked");
  const before = JSON.stringify(linked);
  deriveHumanPersonFace(linked);
  TestValidator.equals("the person is not modified", JSON.stringify(linked), before);

  for (const channel of ["globalAgeStructure", "globalSexualDimorphism"])
    TestValidator.predicate(
      "a face stating " + channel + " is refused",
      throwsError(
        () =>
          deriveHumanPersonFace(
            person({ macroAge: 0.2 }, { [channel]: 0.1 }, "linked"),
          ),
        channel,
      ),
    );
};
