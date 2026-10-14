import type { IAutoMovieDesignLineage } from "@automovie/interface";
import { lineageDigest } from "./lineageDigest";

/**
 * One authored r1 revision without subjects, phases, lifecycles, variants, decisions or derived artifacts.
 *
 * Query and projection cases use this fresh empty input beside the populated renovation fixture.
 */
export const emptyLineage: () => IAutoMovieDesignLineage = (): IAutoMovieDesignLineage => ({
  version: 1,
  id: "bare",
  head: "r1",
  subjects: [],
  revisions: [{ id: "r1", parent: null, digest: lineageDigest("0f") }],
  phases: [],
  lifecycles: [],
  variants: [],
  decisions: [],
  derived: [],
});
