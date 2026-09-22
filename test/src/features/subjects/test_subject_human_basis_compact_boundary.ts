import {
  createHumanFaceBasisBuilder,
  parseHumanFaceBasisDocument,
  serializeHumanFaceBasisDocument,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * Geometry belongs to the shared basis at every document entry point.
 * A legacy sculpt must refuse explicitly, since silently dropping its field
 * would display a different face while claiming successful replay.
 *
 * Scenarios:
 * 1. Named shape and expression weights load, save and build normally.
 * 2. Even empty per-vertex identity or per-document correctives refuse at all
 *    three entry points, including already parsed objects supplied directly.
 */
export const test_subject_human_basis_compact_boundary = (): void => {
  const { basis, document } = humanFaceBasisFixture();
  const build = createHumanFaceBasisBuilder(basis);
  document.shape.width = -0.25;
  document.expression.lift = 0.5;
  TestValidator.equals(
    "parameter replay",
    parseHumanFaceBasisDocument(serializeHumanFaceBasisDocument(document)),
    document,
  );
  TestValidator.equals("parameter build", build(document).id, document.id);
  const fields: Record<string, unknown>[] = [
    { identity: {} },
    { identity: { square: [2, 0, 0, 0.25] } },
    { correctives: [] },
    {
      correctives: [
        {
          id: "sculpt",
          inputs: [{ channel: "lift", side: "positive" }],
          weight: 1,
          targets: { square: [2, 0, 0, 0.25] },
        },
      ],
    },
  ];
  for (const field of fields) {
    const legacy = { ...document, ...field };
    TestValidator.predicate(
      "load refuses geometry",
      throwsError(() => parseHumanFaceBasisDocument(JSON.stringify(legacy))),
    );
    TestValidator.predicate(
      "save refuses geometry",
      throwsError(() => serializeHumanFaceBasisDocument(legacy)),
    );
    TestValidator.predicate(
      "build refuses geometry",
      throwsError(() => build(legacy)),
    );
  }
};
