import { judgeViewerFreshness } from "../../../scripts/viewer/judgeViewerFreshness";
import { TestValidator } from "@nestia/e2e";

/**
 * The browser build is fresh when it is not older than the newest source.
 *
 * Scenarios:
 * 1. Source older than the build is fresh; the reason is empty.
 * 2. Source and build at the same instant are fresh (a coarse file system).
 * 3. Source newer than the build by one millisecond is stale and the reason
 *    names the rebuild command: the boundary between 2 and 3.
 * 4. A missing build is stale whatever the source, including a tree without
 *    source files.
 * 5. A tree without source files and an existing build is fresh.
 */
export const test_viewer_freshness_judgement = (): void => {
  TestValidator.equals("older source", judgeViewerFreshness(100, 200), {
    fresh: true,
    reason: "",
  });
  TestValidator.equals("same instant", judgeViewerFreshness(200, 200), {
    fresh: true,
    reason: "",
  });
  const newer = judgeViewerFreshness(201, 200);
  TestValidator.predicate(
    "newer source is stale",
    !newer.fresh && newer.reason.includes("pnpm --filter @automovie/human build"),
  );
  const missing = judgeViewerFreshness(100, null);
  TestValidator.predicate(
    "missing build is stale",
    !missing.fresh && missing.reason.includes("does not exist"),
  );
  TestValidator.predicate(
    "missing build without source is stale",
    !judgeViewerFreshness(null, null).fresh,
  );
  TestValidator.predicate(
    "no source, existing build",
    judgeViewerFreshness(null, 200).fresh,
  );
};
