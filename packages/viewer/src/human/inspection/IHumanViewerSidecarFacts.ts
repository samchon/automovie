import type { IHumanViewerPacketIdentities } from "./IHumanViewerPacketIdentities.js";
import type { IHumanViewerPersonSidecar } from "./IHumanViewerPersonSidecar.js";

/**
 * What the input reader learned from one sidecar file, kept until the file's stamp changes so a rescan neither rereads nor rehashes unchanged bytes.
 *
 * @evidence contracts/common.md#principled-implementation Memoized sidecar facts pair the provider's actual byte stamp and digest with one typed basis, packet or generation-view identity.
 * @evidence contracts/common.md#clear-and-simple-design One record groups mutually applicable decoded identities and a nullable failure while the provider owns reading.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unreadable sidecar keeps its failure and nullable identity fields rather than becoming a fabricated valid basis.
 * @evidence contracts/common.md#meaningful-documentation Documents stamp-based reuse, SHA-256, file-kind identities and the unreadable-byte state.
 * @author Samchon
 */
export interface IHumanViewerSidecarFacts {
  /** The provider's version stamp the facts were read at. */
  stamp: string;

  /** Hex SHA-256 of the bytes. */
  digest: string;

  /**
   * The basis identity of a `.basis.json.gz`, or null for a person packet or a generation view.
   */
  basis: string | null;

  /** The identities of a `.person.json.gz`, or null for any other kind. */
  packet: IHumanViewerPersonSidecar | null;

  /**
   * The identities of a published generation view, or null for any other kind.
   */
  view: IHumanViewerPacketIdentities | null;

  /** Why the bytes could not be read as their kind, or null when they could. */
  failure: string | null;
}
