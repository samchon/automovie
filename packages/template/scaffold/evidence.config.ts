import {
  createAutoMovieEvidenceConfig,
  createAutoMovieStandaloneEvidenceConfig,
} from "@automovie/evidence";
import type { IEvidenceConfig } from "@wrtnlabs/evidence";

import { productionEvidence } from "./lint.config";

const graph = createAutoMovieEvidenceConfig(productionEvidence);

/**
 * Derive the standalone evaluator from the sole tracked production declaration.
 * The normal evidence command selects this entry; production readers import
 * that same named declaration from lint.config.ts rather than another copy.
 */
export default createAutoMovieStandaloneEvidenceConfig(
  graph,
  productionEvidence.location,
) satisfies IEvidenceConfig;
