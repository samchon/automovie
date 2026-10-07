import type { IHumanFaceResidentPart } from "./IHumanFaceResidentPart";
import type { IHumanFaceResidentSourceRegion } from "./IHumanFaceResidentSourceRegion";

/**
 * Native face parts and the exact source tables used to gather them.
 * The hair owner also receives the unchanged evaluated source surfaces.
 *
 * @author Samchon
 */
export interface IHumanFaceResidentParts {
  /** Owned native model parts; generated assemblies are composed afterward. */
  parts: IHumanFaceResidentPart[];

  /** Exact evaluated source surfaces retained for the existing hair generator. */
  evaluated: ReadonlyMap<string, readonly number[]>;

  /** Actual source correspondence of every emitted native region. */
  sourceRegions: readonly IHumanFaceResidentSourceRegion[];
}
