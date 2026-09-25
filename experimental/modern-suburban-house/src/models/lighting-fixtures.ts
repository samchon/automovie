/** Reviewed dimensional prototypes owned by this model design file. */
import { group } from "./specs";
import type { PrototypeSpec } from "./templates";

/** Local dimensions of the two fixture variants specified by one design H2. */
export const pendantDimensions = {
  island: [0.28,0.80,0.28],
  dining: [0.48,1.20,0.48],
} as const;
export const flushCeilingSizes={rooms:[0.24,0.05,0.24],garage:[0.40,0.05,0.40]} as const;

export const lightingFixtureSpecs: readonly PrototypeSpec[] = [
  ...group("17-light-fixtures.md", "src/models/lighting-fixtures.ts", [
    ["flush-ceiling-fixture","fixture",flushCeilingSizes.rooms,"fixture-housing fixture-diffuser",{ceiling:"flush"}],
    ["pendant-fixtures","fixture",pendantDimensions.dining,"fixture-canopy fixture-stem fixture-shade fixture-diffuser",{pendant:"dining"}],
    ["vanity-wall-fixture","fixture",[0.36,0.06,0.08],"fixture-housing fixture-diffuser",{wallBar:true}],
    ["porch-wall-sconce","fixture",[0.18,0.28,0.18],"fixture-housing fixture-stem fixture-glass"],
  ]),
];
