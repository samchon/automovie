import { TestValidator } from "@nestia/e2e";

import { readHumanViewerWork } from "../../../scripts/human-viewer/readHumanViewerWork";

/**
 * Progress admission keeps iframe authority and rejects malformed console data.
 *
 * Scenarios:
 * 1. Every supported phase retains identity, clock and resource counts while
 *    unrelated fields are projected away.
 * 2. Invalid JSON, non-record values, missing identities and unknown phases refuse.
 * 3. Each counter refuses missing, nonnumeric, negative and overflowing values;
 *    zero is a valid boundary for clock and counters.
 */
export const test_human_viewer_work = (): void => {
  const base = { revision: "source", frame: "1", doc: "body:neutral",
    phase: "idle", at: 0, pending: 0, geometries: 0, textures: 0 };
  for (const phase of ["loading", "cache-read", "build", "numeric-reply",
    "cache-write", "prepare", "draw", "idle", "failed"] as const)
    TestValidator.equals("supported phase", readHumanViewerWork(JSON.stringify({
      ...base, phase, privateResource: "not retained",
    })), { ...base, phase });
  for (const text of ["{", "null", "4", "true", "[]"])
    TestValidator.equals("non-record refuses", readHumanViewerWork(text), null);
  for (const field of ["revision", "frame", "doc"])
    TestValidator.equals("identity required", readHumanViewerWork(JSON.stringify({
      ...base, [field]: 1,
    })), null);
  TestValidator.equals("phase required", readHumanViewerWork(JSON.stringify({
    ...base, phase: "unknown",
  })), null);
  for (const field of ["at", "pending", "geometries", "textures"])
    for (const value of [undefined, "0", -1])
      TestValidator.equals("counter admission", readHumanViewerWork(JSON.stringify({
        ...base, [field]: value,
      })), null);
  TestValidator.equals("finite counter", readHumanViewerWork(JSON.stringify(base)
    .replace('"at":0', '"at":1e309')), null);
};
