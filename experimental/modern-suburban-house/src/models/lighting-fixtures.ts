/** Reviewed dimensional prototypes owned by this model design file. */
import { group } from "./specs";
import type { PrototypeSpec } from "./templates";

export const lightingFixtureSpecs: readonly PrototypeSpec[] = [
  ...group("17-light-fixtures.md", "src/models/lighting-fixtures.ts", [
    ["flush-ceiling-fixture","fixture",[0.24,0.05,0.24],"fixture-housing fixture-diffuser"],
    ["pendant-fixtures","fixture",[0.48,1.20,0.48],"fixture-canopy fixture-stem fixture-shade fixture-diffuser"],
    ["vanity-wall-fixture","fixture",[0.36,0.08,0.08],"fixture-housing fixture-diffuser"],
    ["porch-wall-sconce","fixture",[0.18,0.28,0.18],"fixture-housing fixture-stem fixture-glass"],
  ]),
];
