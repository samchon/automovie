import type { buildAutoMovieMeshQueryHierarchy } from "@automovie/engine";
import type { IHumanBodyUnderwearEnvelopeCentre } from "./IHumanBodyUnderwearEnvelopeCentre";

/** Actual immutable envelope centres and one complete posed material triangle. */
export interface IHumanBodyUnderwearFaceFieldInput {
  /** Three XYZ corners, in posed skin metres. */
  face: readonly number[];

  /** Complete qualified centre population, retaining original identities. */
  centres: readonly IHumanBodyUnderwearEnvelopeCentre[];

  /** Existing finite centre hierarchy; it owns no new geometric population. */
  root: ReturnType<typeof buildAutoMovieMeshQueryHierarchy<IHumanBodyUnderwearEnvelopeCentre>>;

  /** One actual qualified centre supplying the complete face distance bound. */
  seed: readonly number[];
}
