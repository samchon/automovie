import type { EvidenceMarkdownSymbol } from "@wrtnlabs/evidence";

import type { AuthoredLayer } from "./AuthoredLayer";
import type { AuthoredPass } from "./AuthoredPass";
import type { NarrativeScope } from "./NarrativeScope";
import type { ProductionStage } from "./ProductionStage";

/**
 * Describes one contract this work adopted, and the layers that answer it.
 *
 * @evidence contracts/common.md#principled-implementation The object groups one adopted document set with owning layer stages; explicit symbol/checklist options preserve the distinction between per-unit and distributed duties.
 * @evidence contracts/common.md#clear-and-simple-design A document set and layer-stage map avoid repeated per-layer declarations while retaining explicit host/checklist granularity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts createPackageContract validates owning layers and delegates path/host constraints; the type suppresses no evidence.
 * @evidence contracts/common.md#meaningful-documentation Members state citation paths, layer ownership, defaults, pilot scope and per-host versus distributed answering.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Adopted contract expansion inputs is erased at runtime; producing and consuming functions account for concrete traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Adopted contract expansion inputs declares data and coordinates no reusable effects; consumers own equivalence and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Adopted contract expansion inputs acquires no resource or retained state; concrete owners determine instance bytes and lifetimes.
 */
export interface IPackageContractProps {
  /**
   * Names the contract as its hosts cite it, such as
   * `work/principles/common.md`.
   */
  document: string | string[];

  /**
   * Lists the layers whose units answer it, with each layer's current stage.
   *
   * A contract is answered by whichever layers own it, so the layers are given
   * once here rather than by repeating the claim per layer. A layer at
   * `disabled` contributes a disabled claim, so the population is declared
   * whether or not it is active yet.
   */
  layers: Partial<Record<AuthoredLayer, ProductionStage>>;

  /**
   * Selects which logical pass answers the rule. `draft` is construction,
   * `final` is naturalness and hosts the working text; construction hosts body.
   *
   * @default "draft"
   */
  pass?: AuthoredPass;

  /** Selects the complete work or one pilot slice, for the narrative globs. */
  narrativeScope: NarrativeScope;

  /** States what the hosts must reach. Each layer's claim names itself after it. */
  reason: string;

  /**
   * Selects which Markdown units are hosts.
   *
   * State it. This is the per-unit-or-per-population choice, and a default
   * would make it silently: a condition every unit answers for itself binds
   * `"h2"`, while a role the population distributes among its units binds
   * `"file"`, where one host answering covers the rest. Both compile, and the
   * wrong one lets a single owner answer for a whole layer.
   */
  symbol: EvidenceMarkdownSymbol | EvidenceMarkdownSymbol[];

  /**
   * Chooses whether every selected host answers every target independently.
   *
   * Keep `false` for an ordinary distributed relationship whose actual hosts
   * cover the targets between them. A whole-population comparison instead
   * uses `createPackagePopulationContract`, which the layer's documents answer
   * once at file level.
   *
   * @default true
   */
  checklist?: boolean;

  /**
   * Turns every layer's claim off for a reason beyond its stage.
   *
   * @default false
   */
  inapplicable?: boolean;
}
