import type { IAutoMovieRecoveryEventRegion } from "./IAutoMovieRecoveryEventRegion";
import type { IAutoMovieRecoveryEventRegionCells } from "./IAutoMovieRecoveryEventRegionCells";
import type { IAutoMovieRecoveryEventRegionSource } from "./IAutoMovieRecoveryEventRegionSource";
import type { IAutoMovieRecoveryEventRegionTopology } from "./IAutoMovieRecoveryEventRegionTopology";



/**
 * Attach contact and port ownership evidence after component topology is complete.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Attach contact and port ownership evidence after component topology is complete.
 * @evidence contracts/development/design.md#principled-representation Attach contact and port ownership evidence after component topology is complete.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryEventRegionPorts share IAutoMovieRecoveryEventRegionPorts's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoveryEventRegionPorts {
/**
 * Attach contact and port ownership evidence after component topology is complete.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Attach contact and port ownership evidence after component topology is complete.
 * @evidence contracts/development/design.md#principled-representation Attach contact and port ownership evidence after component topology is complete.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryEventRegionPorts share IAutoMovieRecoveryEventRegionPorts's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export type Operation = (source: Parameters<IAutoMovieRecoveryEventRegion.Operation>[0],
prepared: ReturnType<IAutoMovieRecoveryEventRegionSource.Operation>,
work: ReturnType<IAutoMovieRecoveryEventRegionCells.Operation>,
topology: ReturnType<IAutoMovieRecoveryEventRegionTopology.Operation>,
query: Parameters<ReturnType<IAutoMovieRecoveryEventRegion.Operation>>[0]) => ReturnType<ReturnType<IAutoMovieRecoveryEventRegion.Operation>>;
}

