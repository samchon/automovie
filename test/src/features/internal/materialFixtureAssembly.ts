import type {
  IAutoMovieMaterialAssembly,
  IAutoMovieMaterialLayer,
} from "@automovie/interface";

/**
 * Wrap the caller's layer sequence in an authored positive-Z build-up.
 *
 * Offset zero and concealed faces are baseline premises, with overrides applied last; the layer array is borrowed rather than copied or resolved. Existing assembly tests own the behavioral assertions and independently calculate signed prefix positions, total thickness, finish and wrap refusals. Each invocation allocates a fresh wrapper and face record, retains only its supplied references and registers no case or host.
 */
export function materialFixtureAssembly(
  layers: IAutoMovieMaterialLayer[],
  overrides: Partial<IAutoMovieMaterialAssembly> = {},
): IAutoMovieMaterialAssembly {
  return {
    id: "build-up",
    axis: "z",
    sense: "positive",
    offset: 0,
    faces: { first: "concealed", last: "concealed" },
    layers,
    ...overrides,
  };
}
