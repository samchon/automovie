import type { IHumanSourcePublicationRecord } from "./IHumanSourcePublicationRecord.ts";

/** Owned bytes verified against a completed, explicitly qualified publication.
 * Consumers decode these exact bytes instead of rereading mutable files.
 * @author Samchon
 */
export interface IHumanSourcePublicationAdmission {
  record: IHumanSourcePublicationRecord;
  outputs: ReadonlyMap<string, Buffer>;
}
