import type { IHumanViewerPersonSidecar } from "./IHumanViewerPersonSidecar";

/**
 * What the input reader learned from one sidecar file, kept until the file's
 * stamp changes so a rescan neither rereads nor rehashes unchanged bytes.
 *
 * @evidence contracts/common.md#principled-implementation Keys the derived facts by the provider's version stamp of the actual bytes.
 * @evidence contracts/common.md#meaningful-documentation Names each fact and when it is reused.
 * @author Samchon
 */
export interface IHumanViewerSidecarFacts {
  /** The provider's version stamp the facts were read at. */
  stamp: string;

  /** Hex SHA-256 of the bytes. */
  digest: string;

  /** The basis identity of a `.basis.json.gz`, or null for a person packet. */
  basis: string | null;

  /** The identities of a `.person.json.gz`, or null for a basis. */
  packet: IHumanViewerPersonSidecar | null;

  /** Why the bytes could not be read as their kind, or null when they could. */
  failure: string | null;
}
