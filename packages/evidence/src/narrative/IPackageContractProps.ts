import type { EvidenceMarkdownSymbol } from "@wrtnlabs/evidence";

import type { AuthoredLayer } from "./AuthoredLayer";
import type { AutoMovieEvidenceNarrativeScope } from "./AutoMovieEvidenceNarrativeScope";
import type { AutoMovieEvidenceProductionStage } from "./AutoMovieEvidenceProductionStage";

/*
 * Describes one contract this work adopted, and the layers that answer it.
 */
export interface IPackageContractProps {
  /*
   * Names the contract as its hosts cite it, such as
   * `work/principles/common.md`.
   */
  document: string | string[];

  /*
   * Lists the layers whose units answer it, with each layer's current stage.
   *
   * A contract is answered by whichever layers own it, so the layers are given
   * once here rather than by repeating the claim per layer. A layer at
   * `disabled` contributes a disabled claim, so the population is declared
   * whether or not it is active yet.
   */
  layers: Partial<Record<AuthoredLayer, AutoMovieEvidenceProductionStage>>;

  /*
   * Selects the complete work or one pilot slice, for the narrative globs.
   */
  narrativeScope: AutoMovieEvidenceNarrativeScope;

  /*
   * States what the hosts must reach. Each layer's claim names itself after it.
   */
  reason: string;

  /*
   * Selects which Markdown units are hosts.
   *
   * State it. This is the per-unit-or-per-population choice, and a default
   * would make it silently: a condition every unit answers for itself binds
   * `"h2"`, while a role the population distributes among its units binds
   * `"file"`, where one host answering covers the rest. Both compile, and the
   * wrong one lets a single owner answer for a whole layer.
   */
  symbol: EvidenceMarkdownSymbol | EvidenceMarkdownSymbol[];

  /*
   * Chooses whether every selected host answers every target independently.
   *
   * Keep `false` for an ordinary distributed relationship whose actual hosts
   * cover the targets between them. A whole-population comparison instead uses
   * `createPackagePopulationContract`, which the layer's documents answer once
   * at file level.
   */
  checklist?: boolean;

  /*
   * Turns every layer's claim off for a reason beyond its stage.
   */
  inapplicable?: boolean;
}
