import type { IHumanViewerPacketIdentities } from "./IHumanViewerPacketIdentities.js";
import type { IHumanViewerPersonSidecar } from "./IHumanViewerPersonSidecar.js";

/**
 * What the input reader learned from one sidecar file, kept until the file's stamp changes so a rescan neither rereads nor rehashes unchanged bytes.
 *
 * @evidence contracts/common.md#principled-implementation Memoized sidecar facts pair the provider's actual byte stamp and digest with one typed basis, packet or generation-view identity.
 * @evidence contracts/common.md#clear-and-simple-design One record groups mutually applicable decoded identities and a nullable failure while the provider owns reading.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unreadable sidecar keeps its failure and nullable identity fields rather than becoming a fabricated valid basis.
 * @evidence contracts/common.md#meaningful-documentation Documents stamp-based reuse, SHA-256, file-kind identities and the unreadable-byte state.
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Memoized sidecar facts pair the provider's actual byte stamp and digest with one typed basis, packet or generation-view identity.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity One record groups mutually applicable decoded identities and a nullable failure while the provider owns reading.
 * @author Samchon
 */
export interface IHumanViewerSidecarFacts {
  /**
   * The provider's version stamp the facts were read at.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure The provider's version stamp the facts were read at. Memoized sidecar facts pair the provider's actual byte stamp and digest with one typed basis, packet or generation-view identity.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The provider's version stamp the facts were read at. One record groups mutually applicable decoded identities and a nullable failure while the provider owns reading.
   */
  stamp: string;

  /**
   * Hex SHA-256 of the bytes.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Hex SHA-256 of the bytes. Memoized sidecar facts pair the provider's actual byte stamp and digest with one typed basis, packet or generation-view identity.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Hex SHA-256 of the bytes. One record groups mutually applicable decoded identities and a nullable failure while the provider owns reading.
   */
  digest: string;

  /**
   * The basis identity of a `.basis.json.gz`, or null for a person packet or a generation view.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure The basis identity of a `.basis.json.gz`, or null for a person packet or a generation view. Memoized sidecar facts pair the provider's actual byte stamp and digest with one typed basis, packet or generation-view identity.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The basis identity of a `.basis.json.gz`, or null for a person packet or a generation view. One record groups mutually applicable decoded identities and a nullable failure while the provider owns reading.
   */
  basis: string | null;

  /**
   * The identities of a `.person.json.gz`, or null for any other kind.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure The identities of a `.person.json.gz`, or null for any other kind. Memoized sidecar facts pair the provider's actual byte stamp and digest with one typed basis, packet or generation-view identity.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The identities of a `.person.json.gz`, or null for any other kind. One record groups mutually applicable decoded identities and a nullable failure while the provider owns reading.
   */
  packet: IHumanViewerPersonSidecar | null;

  /**
   * The identities of a published generation view, or null for any other kind.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure The identities of a published generation view, or null for any other kind. Memoized sidecar facts pair the provider's actual byte stamp and digest with one typed basis, packet or generation-view identity.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The identities of a published generation view, or null for any other kind. One record groups mutually applicable decoded identities and a nullable failure while the provider owns reading.
   */
  view: IHumanViewerPacketIdentities | null;

  /**
   * Why the bytes could not be read as their kind, or null when they could.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Why the bytes could not be read as their kind, or null when they could. Memoized sidecar facts pair the provider's actual byte stamp and digest with one typed basis, packet or generation-view identity.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Why the bytes could not be read as their kind, or null when they could. One record groups mutually applicable decoded identities and a nullable failure while the provider owns reading.
   */
  failure: string | null;
}
