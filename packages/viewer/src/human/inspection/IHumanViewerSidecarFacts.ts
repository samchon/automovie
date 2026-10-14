import type { IHumanViewerPacketIdentities } from "./IHumanViewerPacketIdentities.js";
import type { IHumanViewerPersonSidecar } from "./IHumanViewerPersonSidecar.js";

/**
 * What the input reader learned from one sidecar file, reused while its provider stamp matches. The current mtime/size provider can miss a byte rewrite preserving both values; stamp equality is not fresh-byte proof.
 *
 * @evidence contracts/common.md#principled-implementation File-stamped facts separate compressed-byte digest from basis, person-packet and generation-view identities, with explicit parse/read failure.
 * @evidence contracts/common.md#clear-and-simple-design One small record exposes the metadata catalogue admission needs while keeping large sidecar bytes outside catalogue reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Identities are scanned from the supplied file rather than inferred from file names; failure remains available instead of being hidden.
 * @evidence contracts/common.md#meaningful-documentation Members explain the stamp, SHA-256 bytes, kind-specific nullable identities and nullable failure cause.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The metadata shape implements no inflation or structural scan; createHumanViewerSidecarFacts owns those costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Equal provider stamps reuse facts; changed stamps start a new read and publication refuses a stamp differing from the current tracked stamp. Repeated stamps do not distinguish request generations, and the mtime/size provider misses rewrites preserving both values.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The facts owner retains one metadata entry per encountered filename without an eviction bound; this record retains no compressed or inflated buffers.
 *
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
