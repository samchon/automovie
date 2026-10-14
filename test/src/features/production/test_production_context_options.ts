import type { AutoMovieProductionFrameCapture } from "@automovie/interface";
import {
  AUTOMOVIE_REGISTERED_ARCHETYPES,
  type IAutoMovieProductionContextOptions,
} from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { createLibraryCompletionEvidence } from "../internal/createLibraryCompletionEvidence";
import { loadSourceModule } from "../internal/loadSourceModule";

const { resolveAutoMovieProductionContextOptions }: {
  resolveAutoMovieProductionContextOptions(props: {
    input: IAutoMovieProductionContextOptions | AutoMovieProductionFrameCapture | undefined;
    legacy: Omit<IAutoMovieProductionContextOptions, "capture">;
  }): IAutoMovieProductionContextOptions;
} = loadSourceModule<{
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
 *
 * @evidence contracts/testing.md#behavioral-verification Normalizes named or legacy context options, asserting copied top-level choices, exact nested dependency identities, an intact live callback and empty named options independent of legacy defaults.
 * @evidence contracts/testing.md#independent-expectations The supported constructor arms and shallow-capture contract define identity, value and reassignment expectations independently of normalized output. This tests normalization rather than actual project-root admission or rendering.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts named options, later property reassignment, callable legacy capture, omitted legacy capture and empty named input; constructor namespace/root admission and service reuse belong to other context units.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit reaches the production normalizer through the existing source loader with resident evidence and callbacks. The refusing capture is retained but never called, so no renderer, filesystem host or dynamic test is started.
 */
export function test_production_context_options(): void {
  const evidence: ReturnType<typeof createLibraryCompletionEvidence> = createLibraryCompletionEvidence([]);
  const root: string = evidence.root;
  const capture: AutoMovieProductionFrameCapture = async (): ReturnType<AutoMovieProductionFrameCapture> => {
    throw new Error("This instrument refuses capture without a renderer.");
  };
  const currentAuthoringEvidence: () => typeof evidence = (): typeof evidence => evidence;
  const named: IAutoMovieProductionContextOptions = {
    capture,
    projectRoot: root,
    productionId: "harbor",
    archetypes: AUTOMOVIE_REGISTERED_ARCHETYPES,
    authoringEvidence: evidence,
    currentAuthoringEvidence,
  };
  const selected: IAutoMovieProductionContextOptions = resolveAutoMovieProductionContextOptions({
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
  const legacy: Omit<IAutoMovieProductionContextOptions, "capture"> = {
    projectRoot: root,
    productionId: "harbor",
    archetypes: AUTOMOVIE_REGISTERED_ARCHETYPES,
    authoringEvidence: evidence,
    currentAuthoringEvidence,
  };
  for (const input of [capture, undefined]) {
    const normalized: IAutoMovieProductionContextOptions = resolveAutoMovieProductionContextOptions({
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
}
