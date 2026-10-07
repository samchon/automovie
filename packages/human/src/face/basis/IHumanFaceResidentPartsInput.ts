import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import type { IHumanFacePoseResult } from "./IHumanFacePoseResult";

/**
 * The current face construction's native-region gather inputs.
 * Actual generated ownership selects retained incidence; appearance changes
 * neither that incidence nor the pose arrays supplied by its owner.
 *
 * @author Samchon
 */
export interface IHumanFaceResidentPartsInput {
  /** Resolved current numerical document, including its appearance fields. */
  document: IAutoMovieHumanFaceBasisDocument;

  /** Exact pose whose coordinates, normals and optical replacement population are emitted. */
  pose: IHumanFacePoseResult;

  /** Actual source-card vertices replaced by the generated brow assembly. */
  browReplacements: ReadonlyMap<string, ReadonlySet<number>>;

  /** Actual lash regions replaced by requested shaft rows, including zero populations. */
  replacedLashes: ReadonlySet<string>;

  /** Source-vertex reflectance gains supplied by the fibre population owners. */
  fibreTints: ReadonlyMap<string, readonly number[]>;

  /** Independent named skin reflectance gains on the same source vertices. */
  skinGains: ReadonlyMap<string, readonly number[]>;
}
