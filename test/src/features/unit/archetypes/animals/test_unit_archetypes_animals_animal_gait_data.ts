import {
  AutoMovieArchetypeEquineGait,
  AutoMovieArchetypeQuadrupedGait,
  createHorse,
  createQuadruped,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * A single observed gait speed is a point, not an invented interpolation band.
 *
 * Scenarios:
 * 1. One authored point has a 0.6s cycle with0.3s fore and0.24s hind stance:
 *    the actual timing reader must return finite duty0.5/0.4 at exactly2.5m/s.
 * 2. Both adjacent out-of-range speeds refuse. Adding pace does not add a
 *    measured horse gait, while the generic phase reader accepts lateral pairs.
 * 3. Existing measured two-row horse timing remains ordinary interpolation.
 */
export function test_unit_archetypes_animals_animal_gait_data(): void {
  const findings: string[] = [];
  const point: createQuadruped.ISpecies = {
    archetype: "authored-point",
    stance: { fore: [0, 0, 0, 0], hind: [0, 0, 0, 0] },
    nodding: [],
    table: {
      reference: 1,
      scaling: "absolute",
      hysteresis: 0,
      follow: { fore: 0, hind: 0 },
      order: ["pace"],
      gaits: {
        pace: {
          rows: [
            {
              speed: 2.5,
              stride: 0.6,
              deviation: 0,
              stance: 0.3,
              hindStance: 0.24,
            },
          ],
          phases: { leftFore: 0, leftHind: 0, rightFore: 0.5, rightHind: 0.5 },
          bob: 0,
          nod: { range: 0, timing: "support" },
          fold: { fore: 0, hind: 0 },
          lift: { fore: 0, hind: 0 },
        },
      },
    },
  };
  const value: AutoMovieArchetypeQuadrupedGait.ITiming =
    AutoMovieArchetypeQuadrupedGait.timing(point, "pace", 2.5, 1, 1);
  if (
    !nclose(value.stride, 0.6, 1e-15) ||
    !nclose(value.duty, 0.5, 1e-15) ||
    !nclose(value.hindDuty!, 0.4, 1e-15) ||
    value.deviation !== 0
  )
    findings.push(
      "a single actual speed did not retain its finite cycle and distinct duties",
    );
  for (const speed of [2.5 - 1e-8, 2.5 + 1e-8]) {
    try {
      AutoMovieArchetypeQuadrupedGait.timing(point, "pace", speed);
      findings.push("an unobserved point speed was invented");
    } catch {}
  }
  for (const [limb, phase] of [
    ["leftFore", 0],
    ["leftHind", 0],
    ["rightFore", 0.5],
    ["rightHind", 0.5],
  ] as const)
    if (
      AutoMovieArchetypeQuadrupedGait.phase(
        point,
        { gait: "pace", lead: "left" },
        limb,
      ) !== phase
    )
      findings.push(`${limb} did not retain its lateral pace phase`);
  const horse: createQuadruped.ISpecies = createQuadruped.species(
    createHorse({}, 1),
  );
  try {
    AutoMovieArchetypeQuadrupedGait.of(horse, "pace");
    findings.push("an unmeasured horse pace was fabricated");
  } catch {}
  if (
    JSON.stringify(AutoMovieArchetypeEquineGait.GAITS) !==
    '["walk","trot","canter","gallop"]'
  )
    findings.push("the existing equine gait sequence changed");
  const middle: AutoMovieArchetypeQuadrupedGait.ITiming =
    AutoMovieArchetypeQuadrupedGait.timing(
      horse,
      "walk",
      1.25,
      0,
      AutoMovieArchetypeEquineGait.REFERENCE,
    );
  if (
    !nclose(middle.stride, 1.0125, 1e-15) ||
    !nclose(middle.duty, 0.6365 / 1.0125, 1e-15)
  )
    findings.push("the existing distinct-row interpolation changed");
  TestValidator.equals(
    "point measurements and species gait vocabulary",
    findings,
    [],
  );
}
