import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";

import { deriveHumanSourceSubjectAge } from "./deriveHumanSourceSubjectAge.ts";
import type { IHumanSourceSubjectBases } from "./structures/IHumanSourceSubjectBases.ts";
import type { IHumanSourceSubjectConversion } from "./structures/IHumanSourceSubjectConversion.ts";
import type { IHumanSourceSubjectFacts } from "./structures/IHumanSourceSubjectFacts.ts";
import type { IHumanSourceSubjectRecord } from "./structures/IHumanSourceSubjectRecord.ts";

/**
 * Convert one legacy subject face document into a linked person on the person
 * generation: the face moves to the head view's face basis without its age
 * and sex axes, the body is the neutral body view stating age and sex once.
 * Every other face value, expression and material carries unchanged, because
 * the head view's face channels are the published ones row for row. Sex is
 * carried as the same signed unit; age follows `deriveHumanSourceSubjectAge`.
 * A refused age returns no document, only the record.
 */
export function convertHumanSourceSubject(
  face: IAutoMovieHumanFaceBasisDocument,
  facts: IHumanSourceSubjectFacts | undefined,
  bases: IHumanSourceSubjectBases,
): IHumanSourceSubjectConversion {
  const shape = { ...face.shape };
  const faceAge = shape.globalAgeStructure;
  const sex = shape.globalSexualDimorphism ?? 0;
  delete shape.globalAgeStructure;
  delete shape.globalSexualDimorphism;
  const age = deriveHumanSourceSubjectAge(facts?.ageYears ?? undefined, facts?.ageApproximate === true, faceAge);
  const record: IHumanSourceSubjectRecord = { id: face.id, age, macroGender: sex, converted: age.macroAge !== null };
  if (age.macroAge === null) return { person: null, record };
  const bodyShape: Record<string, number> = {};
  if (age.macroAge !== 0) bodyShape.macroAge = age.macroAge;
  if (sex !== 0) bodyShape.macroGender = sex;
  return {
    person: {
      id: "person:" + face.id,
      name: face.name,
      population: "linked",
      face: { ...face, basis: bases.face, shape },
      body: { id: "person-body", name: "neutral body", basis: bases.body, shape: bodyShape },
    },
    record,
  };
}
