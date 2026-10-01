import { TestValidator } from "@nestia/e2e";

import { HumanViewerQueueFullError } from "../../../scripts/human-viewer/HumanViewerQueueFullError";
import { HumanViewerStartingError } from "../../../scripts/human-viewer/HumanViewerStartingError";
import { classifyHumanViewerRefusal } from "../../../scripts/human-viewer/classifyHumanViewerRefusal";
import { forHumanViewerComparison } from "../../../scripts/human-viewer/forHumanViewerComparison";
import { parseHumanViewerAddress } from "../../../scripts/human-viewer/parseHumanViewerAddress";

/**
 * Transient refusals answer 503 with a retry interval, the request's own 422,
 * and a comparison draws photograph-free captures.
 *
 * Scenarios:
 * 1. A full queue is 503 retry 10, a starting server is 503 retry 3.
 * 2. An ordinary error, a software-renderer error and a non-error value are
 *    422 with no retry advice.
 * 3. A comparison address for a document with a photograph and landmarks
 *    keeps every other field, takes the named document, and drops `ref` and
 *    `landmarks`, so two captures have equal dimensions.
 */
export const test_human_viewer_refusal_status = (): void => {
  TestValidator.equals("full", classifyHumanViewerRefusal(new HumanViewerQueueFullError("full")), { status: 503, retryAfter: 10 });
  TestValidator.equals("starting", classifyHumanViewerRefusal(new HumanViewerStartingError("starting")), { status: 503, retryAfter: 3 });
  TestValidator.equals("own", classifyHumanViewerRefusal(new Error("A real GPU is required: SwiftShader")), { status: 422, retryAfter: null });
  TestValidator.equals("non error", classifyHumanViewerRefusal("x"), { status: 422, retryAfter: null });
  const address = parseHumanViewerAddress("doc=a&ref=split&landmarks=on&view=left&size=300&calibrate=on");
  const first = forHumanViewerComparison(address, "a");
  const second = forHumanViewerComparison(address, "b");
  TestValidator.equals("photograph layers removed", [first.ref, first.landmarks, second.ref, second.landmarks], [null, false, null, false]);
  TestValidator.equals("document and display kept", [first.doc, second.doc, second.view, second.size, second.calibrate], ["a", "b", "left", 300, true]);
  TestValidator.equals("original untouched", [address.ref, address.landmarks], ["split", true]);
};
