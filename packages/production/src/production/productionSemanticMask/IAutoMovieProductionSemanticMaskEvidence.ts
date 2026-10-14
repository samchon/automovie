import { IAutoMovieSemanticMaskEvidence } from "@automovie/interface";

/**
 * One version-1 shot observation combines an engine palette and runtime coverage; it is supplied atomically by a capture owner, while the type alone does not prove the observation occurred.
 *
 * @evidence contracts/common.md#principled-implementation Uses the canonical interface evidence shape so shot/version/palette/coverage correspondence is verified without translation.
 * @evidence contracts/common.md#clear-and-simple-design The alias names production's admission input; engine palette validation and production shot/coverage checks remain separate runtime responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No synthetic complete coverage or scalar summary replaces the full palette and runtime gap record.
 * @evidence contracts/common.md#meaningful-documentation Documents atomic producer responsibility and that type assignment does not establish provenance or currentness; schema details remain canonical in interface.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An erased alias performs no computation; palette sorting/hash/schema and coverage scan costs occur at the verifier.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No completed or in-flight evidence is stored by the type; runtime owners decide if an observation is still current.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The alias acquires no bytes, handles or tasks. Capture and receipt consumers own referenced palette and coverage populations and their lifetime.
 */
export type IAutoMovieProductionSemanticMaskEvidence = IAutoMovieSemanticMaskEvidence;
