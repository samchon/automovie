import type { IAutoMovieHumanBodyAnatomicalAssembly } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import type { IHumanCranialSourceInput } from "./IHumanCranialSourceInput.ts";
import type { IHumanCranialSourceRepair } from "./IHumanCranialSourceRepair.ts";

/** Geometric bounds in explicitly identified metre frames. @author Samchon */
interface CranialBounds { low: number[]; high: number[] }

/** Each repair stays attached to its original acquired part and member. @author Samchon */
interface CranialMemberRepair {
  part: string;
  member: string;
  sourceSha256: string;
  repair: IHumanCranialSourceRepair["receipt"];
}

/** Original equivalent member and last-record representative retain both identities. @author Samchon */
interface CranialMemberAlias {
  part: string;
  duplicate: string;
  emitted: string;
  geometrySha256: string;
}

/** Byte-bound initial source birth; numerical placement is not rendered admission. @author Samchon */
interface CranialBirthReceipt {
  schema: "automovie-cranial-source-birth/1";
  generation: string;
  assemblySha256: string;
  headSha256: string;
  addedParts: string[];
  acquiredMembers: number;
  addedMembers: number;
  aliases: CranialMemberAlias[];
  topologyRepairs: CranialMemberRepair[];
  sourceBounds: CranialBounds;
  targetBounds: CranialBounds;
  scale: number;
  translation: number[];
  inputs: IHumanCranialSourceInput["provenance"];
  acquisition: Record<string, unknown>;
  qualification: string;
}

/**
 * Fresh assembly and complete initial cranial source receipt. The CLI owns
 * relocation of original plan paths into its fresh output directory.
 * The ordinary material loader consumes assemblySha256/headSha256/addedParts;
 * authoring preserves additional acquisition, alias and repair lineage.
 * No parent assembly, source file or old receipt is mutated by construction.
 * @author Samchon
 */
export interface IHumanCranialSourceResult {
  assembly: IAutoMovieHumanBodyAnatomicalAssembly;
  receipt: CranialBirthReceipt;
}
