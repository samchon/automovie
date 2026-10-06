import type { IAutoMovieHumanBodyAtlasSource } from "../anatomy/atlas/IAutoMovieHumanBodyAtlasSource";
import type { IAutoMovieHumanBodySourcePart } from "../anatomy/assembly/IAutoMovieHumanBodySourcePart";
import type { IAutoMovieHumanBodySourcePartAttachment } from "../anatomy/assembly/IAutoMovieHumanBodySourcePartAttachment";
import type { IAutoMovieHumanBodyAssemblySourceVertices } from "./IAutoMovieHumanBodyAssemblySourceVertices";

/** Original member provenance carried beside its actual static source-part interval. @author Samchon */
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
