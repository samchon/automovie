import type { IAutoMovieMesh } from "@automovie/interface";
import type { AutoMovieHumanBodyBoneId } from "@automovie/human/body/anatomy/identity/AutoMovieHumanBodyBoneId";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import type { IAutoMovieHumanPersonHeadView } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadView";
import type { IHumanBodyAnatomicalCompilePlan } from "../body-review/IHumanBodyAnatomicalCompilePlan.ts";

/** Actual acquired indexed surface, converted once to atlas metres. @author Samchon */
interface CranialSourceMesh extends IAutoMovieMesh {
  indices: number[];
  normals: number[];
}

/** Original acquired file identity and publisher header, without invented inventory fields. @author Samchon */
interface CranialAcquiredFile {
  file: string;
  sha256: string;
  anatomicalIdentity: string;
  vertices: number;
  triangles: number;
  sourceHeader: string[];
}

/** The actual bone population supplies membership; no fixed count supplies a source. @author Samchon */
interface CranialInventory {
  populationOwner: string;
  parts: CranialInventoryPart[];
}

/** Original acquired bone membership and its independently named files. @author Samchon */
interface CranialInventoryPart {
  id: AutoMovieHumanBodyBoneId;
  family: "bone";
  actualAcquiredFiles: CranialAcquiredFile[];
}

/** One byte-bound acquisition member and its original A-frame geometry. @author Samchon */
interface CranialSourceMember {
  part: AutoMovieHumanBodyBoneId;
  source: CranialAcquiredFile;
  uri: string;
  mesh: CranialSourceMesh;
}

/** Actual file provenance is distinct from a compiled mesh digest. @author Samchon */
interface CranialInputReceipt {
  uri: string;
  sha256: string;
  bytes: number;
}

/**
 * Immutable inputs of initial cranial source birth. Acquired surfaces and the
 * source exterior use A metres (+X left, +Y up, +Z anterior); the target head
 * and parent assembly use their explicitly declared held neutral frame.
 * The common similarity is an authored initialization, not personal anatomy.
 * Rights and historical recipes remain original metadata, including unknowns.
 * @author Samchon
 */
export interface IHumanCranialSourceInput {
  assembly: IAutoMovieHumanBodyAnatomicalAssembly;
  plan: IHumanBodyAnatomicalCompilePlan;
  head: IAutoMovieHumanPersonHeadView;
  inventory: CranialInventory;
  sources: CranialSourceMember[];
  sourceExterior: CranialSourceMesh;
  cutoffBone: AutoMovieHumanBodyBoneId;
  transportParent: AutoMovieHumanBodyBoneId;
  acquisition: Record<string, unknown>;
  provenance: Record<string, CranialInputReceipt>;
  physicalFiles: Record<string, string>;
  planDirectory: string;
}
