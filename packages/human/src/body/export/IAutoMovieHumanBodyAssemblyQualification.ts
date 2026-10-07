import type { IAutoMovieHumanBodyAssemblyPartQualification } from "./IAutoMovieHumanBodyAssemblyPartQualification";

/** Coarse source assembly qualification, independently of clinical anatomical resolution. @author Samchon */
export interface IAutoMovieHumanBodyAssemblyQualification {
  /** Explicit static held-rest source support; omission denotes the existing articulated-source qualification. */
  mode?: "neutral-only";

  /** Exact version of the coarse assembly's independent primitive namespace. */
  version: 1;
  /** Body document/model identity from which the registered source members were exported. */
  sourceModel: string;
  /** Immutable common source graph/geometry generation; not a clinical cohort identity. */
  generation: string;
  /** Exact registered body basis revision used by the effective exported document. */
  basis: string;
  /** Actual effective dimensionless basis weights; omitted weights mean zero. */
  shape: Record<string, number>;
  /** Common-frame reference protocol and authored registration limits. */
  registration: string;
  /** Exact source member provenance in each carrying primitive's actual interval order. */
  parts: IAutoMovieHumanBodyAssemblyPartQualification[];
}
