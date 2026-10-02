import type { IAutoMovieHumanBodyShoulderPose } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { createBodyCorrectiveDrivers } from "../../../scripts/body-basis/createBodyCorrectiveDrivers";
import { readBodyCorrectiveShoulderMotion } from "../../../scripts/body-basis/readBodyCorrectiveShoulderMotion";
import { nclose, throwsError } from "../internal/predicates";

/**
 * The solver's TT driver keeps its complete orientation and same-shape rest,
 * while channel and clinical ramps retain their prior independent domains.
 * No motion and no conditional input cannot become an unconditional row.
 *
 * Scenarios:
 * 1. A lateral 45-to135-degree motion at full1/onset0.5 has centre135 and
 *    outer45, independently of the named shape and clinical ramps.
 * 2. Body population rows retain only macro traits; shape populations retain
 *    other nonzero traits too, with positive and negative sides distinguished.
 * 3. Motion records own their poses and refuse missing shaped rests.
 * 4. A stationary TT goal emits no kernel; absent activation authority refuses.
 */
export const test_human_body_tt_corrective_drivers = (): void => {
  const rest: IAutoMovieHumanBodyShoulderPose = {
    bone: "leftUpperArm", plane: 0, elevation: 45, axialRotation: 0,
  };
  const target: IAutoMovieHumanBodyShoulderPose = {
    ...rest, elevation: 135,
  };
  const motion = readBodyCorrectiveShoulderMotion({
    rests: [rest], goals: [target],
  });
  TestValidator.predicate("full physical travel is ninety degrees", nclose(motion[0].travelDegrees, 90));
  TestValidator.predicate("motion poses are separately owned", motion[0].rest !== rest && motion[0].target !== target);
  const input: Parameters<typeof createBodyCorrectiveDrivers>[0] = {
    state: {
      name: "analytic", set: "bodies", group: "shoulders",
      shape: { tall: 1, width: -0.5, absent: 0 }, pose: [],
      shoulders: [target],
    },
    macros: new Set(["tall"]),
    axes: [{ bone: "spine", axis: "flexion", angle: 60, rest: 20 }],
    shoulderMotion: motion, onset: 0.5, full: 1, from: 0.2, to: 0.8,
  };
  const drivers = createBodyCorrectiveDrivers(input);
  const trait = drivers[0], clinical = drivers[1];
  TestValidator.predicate("body population keeps its macro trait",
    "channel" in trait && trait.channel === "tall" && trait.side === "positive" &&
    nclose(trait.onset!, 0.2) && nclose(trait.full!, 0.8),
  );
  TestValidator.predicate("clinical ramp measures forty degrees from its rest",
    "bone" in clinical && clinical.bone === "spine" && clinical.axis === "flexion" &&
    clinical.side === "positive" && nclose(clinical.onset, 20) && nclose(clinical.full, 40),
  );
  const kernel = drivers[2];
  TestValidator.predicate("TT output is a shoulder kernel", "shoulder" in kernel);
  if (!("shoulder" in kernel)) throw new Error("Missing TT kernel.");
  TestValidator.predicate("the complete endpoint orientation is preserved",
    nclose(kernel.orientation.plane, 0) && nclose(kernel.orientation.elevation, 135) &&
    nclose(kernel.orientation.axialRotation, 0),
  );
  TestValidator.predicate("kernel support comes from the physical onset", kernel.innerDegrees === 0 && nclose(kernel.outerDegrees, 45));
  const shapeDrivers = createBodyCorrectiveDrivers({
    ...input, state: { ...input.state, set: "shapes" },
    axes: [{ bone: "spine", axis: "flexion", angle: -20, rest: 20 }],
  });
  const width = shapeDrivers[1], opposite = shapeDrivers[2];
  TestValidator.predicate("shape population retains a negative nonmacro trait",
    "channel" in width && width.channel === "width" && width.side === "negative" &&
    nclose(width.onset!, 0.1) && nclose(width.full!, 0.4),
  );
  TestValidator.predicate("opposite clinical travel uses its negative side",
    "bone" in opposite && opposite.bone === "spine" && opposite.axis === "flexion" &&
    opposite.side === "negative" && nclose(opposite.onset, 20) && nclose(opposite.full, 40),
  );
  TestValidator.equals("bodyposes applies the same macro selection", createBodyCorrectiveDrivers({
    ...input, state: { ...input.state, set: "bodyposes" },
  }).length, drivers.length);
  TestValidator.predicate("missing shaped rest refuses", throwsError(() =>
    readBodyCorrectiveShoulderMotion({ goals: [target], rests: [] }), "same shaped rest",
  ));
  TestValidator.equals("no authored TT goal needs no motion", readBodyCorrectiveShoulderMotion({ goals: [], rests: [] }), []);
  const stationary = readBodyCorrectiveShoulderMotion({ goals: [rest], rests: [rest] });
  TestValidator.equals("stationary shoulder contributes no kernel", createBodyCorrectiveDrivers({
    ...input, shoulderMotion: stationary,
  }).length, 2);
  TestValidator.predicate("no activation authority refuses publication", throwsError(() =>
    createBodyCorrectiveDrivers({
      ...input, state: { ...input.state, shape: {} }, axes: [], shoulderMotion: stationary,
    }), "no conditional activation authority",
  ));
};
