import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { AutoMovieEvidenceNarrativeScope } from "./AutoMovieEvidenceNarrativeScope";
import type { IAutoMovieEvidenceProductionConstruction } from "./IAutoMovieEvidenceProductionConstruction";

/** Selects the authored stages and native claims of a narrative route. */
export type IAutoMovieEvidenceNarrativeProps =
  | IAutoMovieEvidenceNarrativeProps.IShort
  | IAutoMovieEvidenceNarrativeProps.ILong;

export namespace IAutoMovieEvidenceNarrativeProps {
  /** Checks the whole short through its brief and screenplay. */
  export interface IShort extends INarrativeOptions {
    /** Brief and screenplay route. */
    mode: "short";

    /** Selects the complete short, also the default when omitted. */
    scope?: AutoMovieEvidenceNarrativeScope.ICompleteWork;
  }

  /** Checks settings, treatments, scripts and screenplay for a long work. */
  export interface ILong extends INarrativeOptions {
    /** Four-layer route with an optional settings outline. */
    mode: "long";

    /** Defaults to the whole work. A pilot names its one first part. */
    scope?: AutoMovieEvidenceNarrativeScope;
  }
}

interface INarrativeOptions {
  /**
   * Unspecified layers are disabled drafts. An omitted outline follows
   * settings.
   */
  construction?: Partial<IAutoMovieEvidenceProductionConstruction>;

  /** Adds native claims after the shared narrative claims. */
  claims?: IEvidenceClaim[];
}
