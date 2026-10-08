import type { IHumanBodyAnatomicalSourceMemberReadback } from "./IHumanBodyAnatomicalSourceMemberReadback";
import type { IHumanBodyNativeSubcutaneousMemberReadback } from "./IHumanBodyNativeSubcutaneousMemberReadback";

/**
 * Readback of a real static asset against its already constructed model.
 * Source members and native final boundary members keep distinct provenance.
 * @author Samchon
 */
export interface IHumanBodyAnatomicalAssetReadback {
  /** SHA-256 of the actual encoded GLB bytes. */
  glbSha256: string;

  /** Actual registered static member intervals and Float32 replay. */
  sourceMembers: IHumanBodyAnatomicalSourceMemberReadback[];

  /** Actual native subcutaneous member intervals and Float32 replay. */
  nativeSubcutaneousMembers: IHumanBodyNativeSubcutaneousMemberReadback[];

  /** Observation scope; anatomical quality and GPU appearance are independent. */
  qualification: string;
}
