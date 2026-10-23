import type { EvidenceMarkdownSymbol } from "@wrtnlabs/evidence";

import type { AuthoredPass } from "./AuthoredPass";
import type { ProductionStage } from "./ProductionStage";

/**
 * Describes one work-local contract claim.
 *
 * A work owns contracts the shared config cannot state for it: a scale target,
 * a language-specific text floor, an episode-end standard. Each is a checklist
 * its selected hosts answer item by item, and the wiring is the same every
 * time — only the document, the hosts, and when the claim is off differ.
 */
export interface IPackageChecklistClaimProps {
  /** Names the claim in diagnostics. State what the hosts must reach. */
  name: string;

  /**
   * Locates the contract inside the effective local contract tree.
   *
   * Give the path as hosts cite it, such as
   * `work/principles/historical-record.md`. Several paths become several
   * references, so each document stays its own coverage obligation and a host
   * answers every item of every one.
   */
  document: string | string[];

  /** Selects the host files this checklist binds, relative to the selected pass root. */
  files: string[];

  /**
   * Selects which logical pass answers: `draft` for construction,
   * `final` for naturalness. Construction hosts body with detached evidence; naturalness
   * hosts its working text with inline evidence.
   *
   * @default "draft"
   */
  pass?: AuthoredPass;

  /** Sets the stage of the layer that owns the hosts. */
  stage: ProductionStage;

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
   * Whether every selected host answers every item of the document.
   *
   * A checklist is answered by each host for itself, so a strong sibling never
   * answers for a weak one. Turn it off for a role the population distributes
   * among its hosts instead, where one host realizing it answers for the rest.
   *
   * @default true
   */
  checklist?: boolean;

  /**
   * Turns the claim off for a reason beyond its stage.
   *
   * A scale target the current population cannot reach belongs here. A duty a
   * realized host owes whatever the population does not: leave this unset, or
   * the pilot silently drops the guard.
   *
   * @default false
   */
  inapplicable?: boolean;
}
