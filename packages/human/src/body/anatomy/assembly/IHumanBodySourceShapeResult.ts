import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanBodySourcePart } from "./IAutoMovieHumanBodySourcePart";
import type { IHumanBodySourceQuantityReading } from "./IHumanBodySourceQuantityReading";

/** Owned shape result on immutable source members, before the shared rig poses them. */
export interface IHumanBodySourceShapeResult {
  /** Changed actual source meshes by existing part and member identities. */
  meshes: ReadonlyMap<
    IAutoMovieHumanBodySourcePart["id"],
    ReadonlyMap<string, IAutoMovieMesh>
  >;
  /** Actual metric or named observation availability, without clinical certification. */
  readings: readonly IHumanBodySourceQuantityReading[];
}
