import type { IAutoMoviePropSpec } from "@automovie/interface";

/** Existing imported-prop readers carried into the LOD closure assertion group. */
export interface IFilmImportedLodInputs {
  /** Create the original sealed imported appearance. */
  createImportedPropSpec(): IAutoMoviePropSpec;

  /** Read the original addressed refusal after a registry mutation. */
  refuses(mutate: (spec: IAutoMoviePropSpec) => void, path: string, message: string): boolean;

  /** Read admission of the adjacent supported registry mutation. */
  tolerated(mutate: (spec: IAutoMoviePropSpec) => void): boolean;

  /** Construct the same synthetic sealed digest used by the original scenario. */
  digest(fill: string): `sha256:${string}`;

  /** Original sidecar asset path distinguished from hero bytes. */
  SIDECAR_BYTES: string;
}
