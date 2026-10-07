import type { AutoMovieProductionFrameCapture } from "@automovie/interface";
import {
  AUTOMOVIE_REGISTERED_ARCHETYPES,
  type IAutoMovieProductionContextOptions,
} from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { createLibraryCompletionEvidence } from "../internal/createLibraryCompletionEvidence";
import { loadSourceModule } from "../internal/loadSourceModule";

const { resolveAutoMovieProductionContextOptions } = loadSourceModule<{
  resolveAutoMovieProductionContextOptions(props: {
    input:
      | IAutoMovieProductionContextOptions
      | AutoMovieProductionFrameCapture
      | undefined;
    legacy: Omit<IAutoMovieProductionContextOptions, "capture">;
  }): IAutoMovieProductionContextOptions;
}>(
  path.resolve(
    __dirname,
    "../../../../packages/production/src/production/resolveAutoMovieProductionContextOptions.ts",
  ),
);

/**
 * Context dependency capture preserves the supported constructor's meaning.
 *
 * Scenarios:
 * 1. Named options keep each instrument, namespace and evidence identity and
 *    capture the property choices without retaining the caller's record.
 * 2. Callable and omitted positional captures preserve the same named choices.
 * 3. Empty named input is distinct from the positional constructor's defaults.
 */
export const test_production_context_options = (): void => {
  const evidence = createLibraryCompletionEvidence([]);
  const root = evidence.root;
  const capture: AutoMovieProductionFrameCapture = async () => {
    throw new Error("This instrument refuses capture without a renderer.");
  };
  const currentAuthoringEvidence = () => evidence;
  const named: IAutoMovieProductionContextOptions = {
    capture,
    projectRoot: root,
    productionId: "harbor",
    archetypes: AUTOMOVIE_REGISTERED_ARCHETYPES,
    authoringEvidence: evidence,
    currentAuthoringEvidence,
  };
  const selected = resolveAutoMovieProductionContextOptions({
    input: named,
    legacy: { productionId: "ignored" },
  });
  TestValidator.predicate(
    "named choices retain exact dependency identities",
    selected !== named &&
      selected.capture === capture &&
      selected.archetypes === named.archetypes &&
      selected.authoringEvidence === evidence &&
      selected.currentAuthoringEvidence === currentAuthoringEvidence,
  );
  TestValidator.equals(
    "named root and namespace do not borrow legacy values",
    { root: selected.projectRoot, production: selected.productionId },
    { root, production: "harbor" },
  );
  named.productionId = "changed-later";
  TestValidator.equals(
    "later option reassignment cannot change the context choice",
    selected.productionId,
    "harbor",
  );
  TestValidator.predicate(
    "the captured live reader remains usable",
    selected.currentAuthoringEvidence!() === evidence,
  );
  const legacy = {
    projectRoot: root,
    productionId: "harbor",
    archetypes: AUTOMOVIE_REGISTERED_ARCHETYPES,
    authoringEvidence: evidence,
    currentAuthoringEvidence,
  };
  for (const input of [capture, undefined]) {
    const normalized = resolveAutoMovieProductionContextOptions({
      input,
      legacy,
    });
    TestValidator.predicate(
      "positional capture and dependencies retain their identities",
      normalized.capture === input &&
        normalized.archetypes === legacy.archetypes &&
        normalized.authoringEvidence === evidence &&
        normalized.currentAuthoringEvidence === currentAuthoringEvidence,
    );
    TestValidator.equals(
      "positional root and namespace retain their meaning",
      { root: normalized.projectRoot, production: normalized.productionId },
      { root, production: "harbor" },
    );
  }
  TestValidator.equals(
    "empty named input does not inherit positional defaults",
    resolveAutoMovieProductionContextOptions({ input: {}, legacy }),
    {},
  );
};
