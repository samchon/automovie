import {
  type IAutoMovieHumanBodyBuild,
  createHumanBodyHumeralHeads,
  createHumanBodyHumeralHeadsFromAnatomicalMeasurements,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * Adult CT head-radius allometry instantiates paired articular surfaces only
 * where its sampled population supports the body and rig centres exist.
 *
 * Scenarios:
 * 1. A 1.653 m neutral adult has the independently recorded 23.42 mm head
 *    estimate; the two sides share size but keep independent posed centres.
 * 2. Greater stature and male sex increase the fitted radius, while the
 *    stated age and stature boundaries admit their endpoints and refuse
 *    extrapolation beyond them.
 * 3. Nonfinite identity, invalid sex and missing or nonfinite joint centres
 *    refuse rather than placing a fictitious bone.
 */
export const test_human_body_humeral_heads = (): void => {
  const position = (x: number) => ({ x, y: 1, z: 0 });
  const transform = (x: number) => ({
    position: position(x),
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  });
  const bones = (["leftUpperArm", "rightUpperArm"] as const).map(
    (bone, index) => ({
      bone,
      rest: transform(index ? 0.2 : -0.2),
      posed: transform(index ? 0.3 : -0.3),
    }),
  ) satisfies IAutoMovieHumanBodyBuild["bones"];
  const at = (ageYears: number, statureMetres: number, sex = 0) =>
    createHumanBodyHumeralHeads({ ageYears, statureMetres, sex, bones });
  const neutral = at(30, 1.653);
  TestValidator.predicate(
    "neutral adult head estimate matches CT research probe",
    nclose(neutral[0].radiusMetres, 0.02342, 0.00002),
  );
  TestValidator.equals("paired heads retain distinct posed centres", neutral.map((head) => head.center.x), [-0.3, 0.3]);
  TestValidator.predicate("male head larger", at(30, 1.7, 1)[0].radiusMetres > at(30, 1.7, -1)[0].radiusMetres);
  TestValidator.predicate("taller head larger", at(30, 1.8)[0].radiusMetres > at(30, 1.6)[0].radiusMetres);
  TestValidator.predicate("adult age endpoints", at(18, 1.7).length === 2 && at(79, 1.7).length === 2);
  TestValidator.predicate("stature endpoints", at(30, 1.321).length === 2 && at(30, 1.93).length === 2);
  for (const [age, stature] of [[17.99, 1.7], [79.01, 1.7], [30, 1.32], [30, 1.931]])
    TestValidator.equals(`outside CT domain ${age}/${stature}`, at(age, stature), []);
  const direct = createHumanBodyHumeralHeads({
    ageYears: 12,
    statureMetres: 1.2,
    sex: 0,
    bones,
    radii: { leftRadiusMillimetres: 20 },
  });
  TestValidator.equals("direct measurement alone outside cohort", direct.map((head) => [head.bone, head.radiusMetres, head.source]), [["leftUpperArm", 0.02, "measured"]]);
  const mixed = createHumanBodyHumeralHeads({
    ageYears: 30,
    statureMetres: 1.7,
    sex: 0,
    bones,
    radii: { rightRadiusMillimetres: 25 },
  });
  TestValidator.equals("independent observed and estimated sides", mixed.map((head) => head.source), ["adult-ct-prior", "measured"]);
  TestValidator.predicate("nonpositive measured radius refuses", throwsError(() => createHumanBodyHumeralHeads({ ageYears: 30, statureMetres: 1.7, sex: 0, bones, radii: { leftRadiusMillimetres: 0 } })));
  TestValidator.predicate("nonfinite identity refuses", throwsError(() => at(NaN, 1.7)));
  TestValidator.predicate("negative age refuses", throwsError(() => at(-1, 1.7)));
  TestValidator.predicate("sex outside interface refuses", throwsError(() => at(30, 1.7, 2)));
  TestValidator.predicate(
    "missing head centre refuses",
    throwsError(() => createHumanBodyHumeralHeads({ ageYears: 30, statureMetres: 1.7, sex: 0, bones: bones.slice(0, 1) })),
  );
  TestValidator.predicate(
    "nonfinite head centre refuses",
    throwsError(() => createHumanBodyHumeralHeads({
      ageYears: 30,
      statureMetres: 1.7,
      sex: 0,
      bones: [{ ...bones[0], posed: transform(NaN) }, bones[1]],
    })),
  );
  neutral[0].center.x = 0;
  TestValidator.equals("returned centre does not mutate caller rig", bones[0].posed.position.x, -0.3);

  const anatomical = createHumanBodyHumeralHeadsFromAnatomicalMeasurements({
    bones,
    measurements: {
      leftUpperLimb: {
        upperArm: {
          humerus: {
            sphereFittedHeadRadius: {
              kind: "observed",
              millimetres: 20,
              modality: "ct",
              acquisitionPosture: "supine",
            },
          },
        },
      },
      rightUpperLimb: {
        upperArm: {
          humerus: {
            sphereFittedHeadRadius: { kind: "target", millimetres: 25 },
          },
        },
      },
    },
  });
  TestValidator.equals(
    "typed observed and target radii keep independent sides and provenance",
    anatomical.map(({ bone, radiusMetres, source, center }) => [bone, radiusMetres, source, center.x]),
    [["leftUpperArm", 0.02, "observed", -0.3], ["rightUpperArm", 0.025, "target", 0.3]],
  );
  TestValidator.equals(
    "the observed head retains CT and acquisition posture",
    anatomical[0].source === "observed" ? anatomical[0].observation : null,
    { kind: "observed", millimetres: 20, modality: "ct", acquisitionPosture: "supine" },
  );
  TestValidator.equals(
    "missing anatomical radius does not invent an unvalidated prior",
    createHumanBodyHumeralHeadsFromAnatomicalMeasurements({
      bones,
      measurements: { age: { kind: "target", years: 25 } },
    }),
    [],
  );
  TestValidator.predicate(
    "a radiograph cannot provide a sphere-fitted 3D radius",
    throwsError(() => createHumanBodyHumeralHeadsFromAnatomicalMeasurements({
      bones,
      measurements: {
        leftUpperLimb: {
          upperArm: {
            humerus: { sphereFittedHeadRadius: {
              kind: "observed",
              millimetres: 20,
              modality: "radiograph",
              acquisitionPosture: "supine",
            } as never },
          },
        },
      },
    })),
  );
};
