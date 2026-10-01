import { TestValidator } from "@nestia/e2e";

import { applyHumanViewerVisibility } from "../../../scripts/human-viewer/applyHumanViewerVisibility";
import { parseHumanViewerAddress } from "../../../scripts/human-viewer/parseHumanViewerAddress";
import { throwsError } from "../internal/predicates";

/**
 * A Face stage cannot pretend to apply the Body studio inspection API.
 * Scenarios:
 * 1. A nonnull light refuses before shadow or material mutation.
 * 2. Ordinary null light remains supported by the same Face stage.
 */
export function test_human_viewer_light_face_refusal(): void {
  let shadows = 0;
  const stage = { setShadows: (): void => { ++shadows; }, observe: {
    pass: (): void => {}, isolate: (): string[] => [], hide: (): string[] => [],
  } };
  TestValidator.predicate("unsupported light", throwsError(() => applyHumanViewerVisibility(stage, parseHumanViewerAddress("light=rim,0,-1,0")), "Body or Person viewport"));
  TestValidator.equals("refusal before mutation", shadows, 0);
  applyHumanViewerVisibility(stage, parseHumanViewerAddress(""));
  TestValidator.equals("ordinary face display", shadows, 1);
}
