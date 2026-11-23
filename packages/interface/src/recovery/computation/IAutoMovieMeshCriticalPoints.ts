import type {
  AutoMovieVector3Tuple,
  IAutoMovieMeshCriticalVertex,
  IAutoMovieRecoveryIndexedMesh,
} from "../../index";

/**
 * Classifies generic PL height vertices by connected lower and upper links.
 * Equal heights use a private symbolic address order without perturbing
 * physical coordinates. Bremer et al. 2004, sections II.C and III.A:
 * https://web.cs.ucdavis.edu/~hamann/BremerEdelsbrunnerHamannPascucci2004TVCG.pdf
 * The returned manifold flag denotes one cycle; other links remain legacy
 * unresolved observations. The default legacy-link-cycle-v1 policy preserves
 * that classification. Opt-in boundary-regular-path-v1 additionally omits a
 * strict regular boundary fan: a connected simple path, qualified incident
 * faces and radial edge incidence, no tied neighbor height, connected nonempty
 * lower/upper links and opposite boundary-end signs. This is a sufficient local
 * half-disk chart condition, not an embedding certificate. Turner, Robins and
 * Morgan 2024, Definition 4.6: https://doi.org/10.1007/s41468-024-00175-8
 */

export namespace IAutoMovieMeshCriticalPoints {
  /**
   * Classifies generic PL height vertices by connected lower and upper links.
   * Equal heights use a private symbolic address order without perturbing
   * physical coordinates. Bremer et al. 2004, sections II.C and III.A:
   * https://web.cs.ucdavis.edu/~hamann/BremerEdelsbrunnerHamannPascucci2004TVCG.pdf
   * The returned manifold flag denotes one cycle; other links remain legacy
   * unresolved observations. The default legacy-link-cycle-v1 policy preserves
   * that classification. Opt-in boundary-regular-path-v1 additionally omits a
   * strict regular boundary fan: a connected simple path, qualified incident
   * faces and radial edge incidence, no tied neighbor height, connected
   * nonempty lower/upper links and opposite boundary-end signs. This is a
   * sufficient local half-disk chart condition, not an embedding certificate.
   * Turner, Robins and Morgan 2024, Definition 4.6:
   * https://doi.org/10.1007/s41468-024-00175-8
   */

  export type Operation = (
    skin: IAutoMovieRecoveryIndexedMesh,
    axis?: AutoMovieVector3Tuple,
    scalarHeights?: readonly number[],
    policy?: "legacy-link-cycle-v1" | "boundary-regular-path-v1",
  ) => IAutoMovieMeshCriticalVertex[];
}
