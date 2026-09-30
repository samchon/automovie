import { TestValidator } from "@nestia/e2e";

import { classifyViewerResponse } from "../../../scripts/viewer/classifyViewerResponse";

/**
 * Who answers the viewer's port decides whether the tool may use it.
 *
 * Scenarios:
 * 1. A refused connection is closed: nothing listens.
 * 2. A success page carrying the playground title marker is the playground.
 * 3. Negative twins, each listening but not the playground: a success page
 *    without the marker, the marker on an error status, and an answer that
 *    never arrived (a timeout, null text).
 * 4. The boundary of a success status: 200 and 299 count, 199 and 300 do not.
 */
export const test_viewer_response_classification = (): void => {
  const page = "<title>automovie: connected body editor</title>";
  TestValidator.equals("refused", classifyViewerResponse(null), {
    open: false,
    playground: false,
  });
  TestValidator.equals(
    "playground",
    classifyViewerResponse({ status: 200, text: page }),
    { open: true, playground: true },
  );
  TestValidator.equals(
    "another program page",
    classifyViewerResponse({ status: 200, text: "<title>nginx</title>" }),
    { open: true, playground: false },
  );
  TestValidator.equals(
    "marker on an error page",
    classifyViewerResponse({ status: 500, text: page }),
    { open: true, playground: false },
  );
  TestValidator.equals(
    "no answer in time",
    classifyViewerResponse({ status: 0, text: null }),
    { open: true, playground: false },
  );
  for (const [status, expected] of [
    [199, false],
    [200, true],
    [299, true],
    [300, false],
  ] as const)
    TestValidator.equals(
      `status ${status}`,
      classifyViewerResponse({ status, text: page }).playground,
      expected,
    );
};
