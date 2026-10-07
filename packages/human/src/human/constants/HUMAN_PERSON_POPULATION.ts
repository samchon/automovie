/**
 * How the body's population axes carry over to the face's, for a person whose
 * age and sex are stated once (`IAutoMovieHumanPersonDocument.population`).
 *
 * Both bases were built from the same MakeHuman/MPFB macro targets, so they
 * share axes and differ only in where their negative ends stand.
 *
 * - The sex axes are the same signed unit: the body's `macroGender` and the
 *   face's `globalSexualDimorphism` both run from female at -1 to male at +1.
 * - The age axes share the macro that MakeHuman's `human.py` builds a person
 *   from (`age = 0.5 + (years - 25) / 130` from 25 years up, `(years - 1) / 48`
 *   below it, the macro being in [0, 1]). Above the macro one half the two axes
 *   are the same (`(macro - 0.5) / 0.5`, +1 at the macro 1). Below it they
 *   differ: the body's negative end is the macro `bodyChildNode` (0.1875, the
 *   study's `macroAge` child node) and the face's is `faceChildNode` (0.25,
 *   the study's mapping of years to `globalAgeStructure`), so a body weight
 *   `w < 0` stands at the macro `0.5 + w * (0.5 - bodyChildNode)` and the same
 *   macro is the face weight `(macro - 0.5) / (0.5 - faceChildNode)`, held at
 *   -1 below the face's end (a body younger than the face's youngest is drawn
 *   with the face's youngest head, as the study's mapping holds it).
 *
 * By that macro the body's node is 10 years (MakeHuman's child node) and the
 * face's 13 years.
 *
 * The values are the two studies' published node positions, read from the body
 * study README (`macroAge`, child node 0.1875) and the face study's
 * population mapping; the age macro itself is the source's, not a measured
 * growth curve, so a person's head is as young as the source's youngest face.
 *
 * @author Samchon
 */
export const HUMAN_PERSON_POPULATION = {
  bodyChildNode: 0.1875,
  faceChildNode: 0.25,
  ageChannel: { body: "macroAge", face: "globalAgeStructure" },
  sexChannel: { body: "macroGender", face: "globalSexualDimorphism" },
} as const;
