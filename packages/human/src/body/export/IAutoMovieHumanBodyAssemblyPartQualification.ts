import type { IAutoMovieHumanBodySourcePart } from "../anatomy/assembly/IAutoMovieHumanBodySourcePart";
import type { IAutoMovieHumanBodySourcePartAttachment } from "../anatomy/assembly/IAutoMovieHumanBodySourcePartAttachment";
import type { IAutoMovieHumanBodyAtlasSource } from "../anatomy/atlas/IAutoMovieHumanBodyAtlasSource";
import type { IAutoMovieHumanBodyAssemblySourceVertices } from "./IAutoMovieHumanBodyAssemblySourceVertices";

/**
 * Original member provenance beside its actual static source-part interval.
 *
 * @evidence contracts/common.md#principled-implementation Emitted identity, anatomical tissue/member, original acquisition rights, registered mesh digest, optional original ordinals and source attachments retain one actual assembly member's provenance.
 * @evidence contracts/common.md#clear-and-simple-design Source qualification augments the generic part interval while diagnostic materials and final posed geometry remain separately owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Registered source SHA-256 cannot stand for final GLB identity or authentic personal anatomy, and clinical qualification stays explicitly unavailable.
 * @evidence contracts/common.md#meaningful-documentation Member comments distinguish emitted/source identities, digest scope, optional numbering, binding account, attachment authority and scientific limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The member record computes no digest, source correspondence or tissue deformation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Qualification fields implement no cross-export cache or geometry reuse decision.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This schema acquires no mesh bytes, source licence handle or running assembly.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAssemblyPartQualification {
  /** Actual emitted model part ID, including the person body prefix when present. */
  id: string;

  /** Closed anatomical owner retained from the source part catalogue. */
  part: IAutoMovieHumanBodySourcePart["id"];

  /** Source tissue material, independently of its diagnostic display finish. */
  tissue: IAutoMovieHumanBodySourcePart["tissue"];

  /** Independent source member ID within the anatomical owner. */
  surface: string;

  /** Original input identity, redistribution rights and acquired/authored source conditions. */
  source: IAutoMovieHumanBodyAtlasSource;

  /** SHA-256 of the actual registered source mesh serialization, not final posed GLB bytes. */
  compiledMeshSha256: string;

  /** Explicit original ordinals when unused source bookkeeping vertices are not resident; omission retains identity numbering. */
  sourceVertices?: IAutoMovieHumanBodyAssemblySourceVertices;

  /** Reproducible source weighting/site account rather than a clinical tissue-motion certificate. */
  bindingAccount: string;

  /** Shared source bone/site/role references carried with the surface. */
  attachments: readonly IAutoMovieHumanBodySourcePartAttachment[];

  /** Atlas or artist source meaning and its unresolved scientific limits. */
  qualification: string;

  /** Coarse source geometry never upgrades independently validated clinical resolution. */
  clinical: "unavailable";
}
