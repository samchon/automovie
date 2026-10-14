import type { IAutoMovieMaterialSubstance } from "@automovie/interface";

/**
 * Construct an authored substance whose measured properties start unmeasured.
 *
 * The id and null-valued baseline are fixture inputs, never validator output; caller overrides distinguish absent measurements, admitted measurements and deliberate range or text defects. Every call owns a fresh wrapper, while object-valued overrides are borrowed by the ordinary spread. Material substance tests own all assertions and refusal expectations; this portable builder registers no test and starts no host.
 */
export function materialFixtureSubstance(
  id: string,
  overrides: Partial<IAutoMovieMaterialSubstance> = {},
): IAutoMovieMaterialSubstance {
  return {
    id,
    name: null,
    classification: "authored",
    density: null,
    thermalConductivity: null,
    specificHeat: null,
    soundAbsorption: null,
    vapourResistance: null,
    serviceLife: null,
    surface: null,
    ...overrides,
  };
}
