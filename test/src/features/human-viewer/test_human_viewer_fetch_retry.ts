import { TestValidator } from "@nestia/e2e";

import { retryHumanViewerFetch } from "../../../scripts/human-viewer/retryHumanViewerFetch";

/**
 * A connection reset is asked again a bounded number of times and nothing else is.
 *
 * Scenarios:
 * 1. A reset on the first attempt succeeds on the second after one growing pause.
 * 2. A reset every time ends with the last error after the bound.
 * 3. A refused connection and an error without a socket code are thrown at
 *    once with no pause.
 */
export const test_human_viewer_fetch_retry = async (): Promise<void> => {
  const pauses: number[] = [];
  const pause = async (ms: number): Promise<void> => {
    pauses.push(ms);
  };
  const failure = (code: string): Error => Object.assign(new Error("fetch failed"), { cause: { code } });
  let calls = 0;
  const value = await retryHumanViewerFetch(
    async () => {
      if (++calls === 1) throw failure("ECONNRESET");
      return "answer";
    },
    { attempts: 3, pause },
  );
  TestValidator.equals("second attempt", [value, calls, pauses], ["answer", 2, [500]]);
  pauses.length = 0;
  calls = 0;
  let last = "";
  try {
    await retryHumanViewerFetch(
      async () => {
        ++calls;
        throw failure("UND_ERR_SOCKET");
      },
      { attempts: 3, pause },
    );
  } catch (error) {
    last = (error as Error).message;
  }
  TestValidator.equals("bounded", [last, calls, pauses], ["fetch failed", 3, [500, 1000]]);
  for (const error of [failure("ECONNREFUSED"), new Error("plain")]) {
    pauses.length = 0;
    calls = 0;
    let thrown: unknown;
    try {
      await retryHumanViewerFetch(
        async () => {
          ++calls;
          throw error;
        },
        { attempts: 3, pause },
      );
    } catch (caught) {
      thrown = caught;
    }
    TestValidator.equals("immediate", [thrown === error, calls, pauses], [true, 1, []]);
  }
};
