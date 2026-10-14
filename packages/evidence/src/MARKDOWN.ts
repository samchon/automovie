import type { AutoMovieAuthoredDocumentLayer } from "./AutoMovieAuthoredDocumentLayer";

/**
 * Keep a layer's selected authored depths together with its collective obligation eligibility.
 *
 * @author Samchon
 */
interface IAutoMovieAuthoredEvidencePopulation {
  /** Authored depths required in every selected unit file. */
  headings: readonly (2 | 3 | 4)[];

  /** Whether this layer participates in shared distributed obligation coverage. */
  obligation: boolean;
}

/** Current authored heading topology and obligation eligibility; narrative delivery units keep H2/H3/H4 while technical branches use H2. */
export const MARKDOWN: Record<AutoMovieAuthoredDocumentLayer, IAutoMovieAuthoredEvidencePopulation> = {
  settings: { headings: [2], obligation: true },
  research: { headings: [2], obligation: true },
  maps: { headings: [2], obligation: true },
  models: { headings: [2], obligation: true },
  spaces: { headings: [2], obligation: true },
  materials: { headings: [2], obligation: true },
  instances: { headings: [2], obligation: true },
  motions: { headings: [2], obligation: true },
  systems: { headings: [2], obligation: true },
  treatments: {
    headings: [2],
    obligation: true,
  },
  scripts: {
    headings: [2, 3, 4],
    obligation: true,
  },
  screenplays: {
    headings: [2, 3, 4],
    obligation: true,
  },
  briefs: {
    headings: [2, 3, 4],
    obligation: true,
  },
};
