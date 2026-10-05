/**
 * How long a capture stage may go without progress before its request is
 * ended as stalled.
 *
 * Server stages read and collect the page and worker heaps: measured 0.17–0.8
 * s for a full collection of both (5176 and 5175, 2026-10-05), so thirty
 * seconds is far beyond any normal reading and still frees a stuck slot
 * quickly. The page stage reports progress at every display stage (the
 * page's work lines: cache read, build, reply, prepare, draw); the longest
 * gap measured between two of them is a numerical build, 77.5 s for a person
 * under heavy load (generated-white-girl-01, buildMs 77515) and 65.9 s for
 * `person:reference:heavy`. Twice that, 160 s, leaves room for a busier
 * machine without letting a page that stopped progressing hold the queue.
 *
 * @evidence contracts/common.md#principled-implementation Each bound is derived from the measured normal maximum of its stage.
 * @evidence contracts/common.md#meaningful-documentation States each measurement and margin.
 * @author Samchon
 */
export const humanViewerStageBounds = {
  /** Room before a capture and trim after it: heap readings and collections. */
  serverMs: 30_000,

  /** The page stage: no display stage reported for this long. */
  pageMs: 160_000,
} as const;
