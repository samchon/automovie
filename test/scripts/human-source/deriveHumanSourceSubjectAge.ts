import { HUMAN_BODY_SIMPLE_SHAPE } from "@automovie/human/body/constants/HUMAN_BODY_SIMPLE_SHAPE";
import { humanBodySimpleShapeMath } from "@automovie/human/body/simple/humanBodySimpleShapeMath";
import { HUMAN_PERSON_POPULATION } from "@automovie/human/human/constants/HUMAN_PERSON_POPULATION";

import type { IHumanSourceSubjectAge } from "./structures/IHumanSourceSubjectAge.ts";

/**
 * Set one subject's body age. A subject with a recorded age in years takes the
 * body simple tier's own age curve (`HUMAN_BODY_SIMPLE_SHAPE`'s macroAge
 * term), one documented rule for every person. A subject without one takes the
 * inverse of the person population mapping from its face value where that
 * inverse is unique (face weight above the face's youngest end); the face's
 * youngest end stands for every younger body and is refused by name. A face
 * document that omits the age axis means zero by the document convention and
 * is carried as zero, not filled in.
 */
export function deriveHumanSourceSubjectAge(
  ageYears: number | undefined,
  approximate: boolean,
  face: number | undefined,
): IHumanSourceSubjectAge {
  if (ageYears !== undefined) {
    const term = HUMAN_BODY_SIMPLE_SHAPE.terms.find(
      (t) => t.channel === HUMAN_PERSON_POPULATION.ageChannel.body,
    );
    const curve = term?.curves.find((c) => c.parameter === "ageYears");
    if (term === undefined || curve === undefined)
      throw new Error("The body simple tier has no macroAge age curve.");
    return {
      macroAge:
        term.gain *
        humanBodySimpleShapeMath.curve(
          curve.points as [number, number][],
          ageYears,
        ),
      path: "subject-facts age through the body age curve",
      note: `${ageYears} years${approximate ? " (approximate in subject-facts)" : ""}`,
    };
  }
  if (face === undefined)
    return {
      macroAge: 0,
      path: "face value omitted (zero by document convention)",
      note: "the face document omits globalAgeStructure, which the document reads as zero",
    };
  if (face >= 0)
    return {
      macroAge: face,
      path: "face value inverse (unique)",
      note: `face ${face}`,
    };
  const { bodyChildNode, faceChildNode } = HUMAN_PERSON_POPULATION;
  if (face > -1)
    return {
      macroAge: (face * (0.5 - faceChildNode)) / (0.5 - bodyChildNode),
      path: "face value inverse (unique)",
      note: `face ${face}`,
    };
  return {
    macroAge: null,
    path: "refused",
    note: `face ${face} is the face's youngest end, which every body younger than it maps to; no unique body age`,
  };
}
