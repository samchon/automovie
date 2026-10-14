import { TestValidator } from "@nestia/e2e";

import { shouldDisposeGalleryPage } from "../../../../website/src/gallery/shouldDisposeGalleryPage";
import { createGalleryHostFacts } from "../internal/createGalleryHostFacts";
import { GalleryController } from "../../../../website/src/gallery/GalleryController";
import { runWebsiteCleanup } from "../../../../website/src/internal/runWebsiteCleanup";
import { runWebsiteAsyncCleanup } from "../../../../website/src/internal/runWebsiteAsyncCleanup";

/**
 * The persisted pagehide policy preserves the enhancement for BFcache restoration; a final pagehide policy disposes it. The collection's actual callback consumes this portable decision, while real BFcache restoration remains a browser observation.
 *
 * Scenarios:
 * 1. Persisted pagehide keeps an opening and subsequent view navigation.
 * 2. Final pagehide disposes, unlocks and prevents subsequent activation.
 * 3. Independent synchronous and asynchronous page cleanups preserve every failure and later attempt.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises the Gallery pagehide decision, actual controller retirement and the cleanup functions used by Tour/Manor page teardown; callback order and cause identities expose an early failure that skips later work or loses an original rollback cause.
 * @evidence contracts/testing.md#independent-expectations Persisted pages retain their owner, final pages retire it, and independent acquired resources each receive a cleanup attempt despite prior failure; expected callback names and error identities are supplied independently.
 * @evidence contracts/testing.md#distinguishing-cases Covers retained/final pagehide, prevented later activation, empty cleanup, one Error-only callback failure, original-plus-cleanup rollback failure and simultaneous sync/async failures with a successful final callback; arbitrary foreign thrown values, native BFcache and GPU release remain unobserved.
 * @evidence contracts/testing.md#execution-ownership The named asynchronous unit directly imports controller and cleanup implementations and uses existing host facts plus local callbacks and promises; it creates no browser, DOM host, foreign patch or asset and does not observe actual page lifecycle dispatch.
 */
export async function test_website_gallery_page_lifecycle(): Promise<void> {
  const { host, facts }: ReturnType<typeof createGalleryHostFacts> = createGalleryHostFacts();
  const controller: GalleryController<string> = new GalleryController(host, [3]);
  const click: { button: number; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean; } = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false };
  controller.open(0, "capture", click, (): void => {});
  TestValidator.equals("BFcache keeps enhancement", shouldDisposeGalleryPage(true), false);
  if (shouldDisposeGalleryPage(true)) controller.dispose();
  controller.selectView(1);
  TestValidator.equals("restored page remains interactive", [facts.open, facts.locked, facts.view], [true, true, 1]);
  TestValidator.equals("final pagehide releases enhancement", shouldDisposeGalleryPage(false), true);
  if (shouldDisposeGalleryPage(false)) controller.dispose();
  TestValidator.equals("final page releases opening", [facts.open, facts.locked, facts.focused], [false, false, "capture"]);
  TestValidator.equals("final page cannot reopen", controller.open(0, "capture", click, (): void => {}), false);
  runWebsiteCleanup([]);
  let threw: boolean = false;
  const singleCause: Error = new Error("Single callback failed.");
  let singleFailure: unknown = null;
  try { runWebsiteCleanup([(): never => { throw singleCause; }]); }
  catch (error) { threw = true; singleFailure = error; }
  TestValidator.predicate("a single failure is thrown unchanged", threw && singleFailure === singleCause);
  const original: Error = new Error("Scene creation failed.");
  const cleanup: Error = new Error("Scene cleanup failed.");
  const attempts: string[] = [];
  let rollback: unknown;
  try {
    runWebsiteCleanup([
      (): never => { attempts.push("failed"); throw cleanup; },
      (): void => { attempts.push("last"); },
    ], [original]);
  } catch (error) { rollback = error; }
  TestValidator.predicate("rollback retains original and cleanup causes", rollback instanceof AggregateError && rollback.errors.length === 2 && rollback.errors[0] === original && rollback.errors[1] === cleanup);
  TestValidator.equals("rollback attempts later cleanup", attempts, ["failed", "last"]);
  const synchronous: Error = new Error("Controls failed.");
  const asynchronous: Error = new Error("Textures failed.");
  const asyncAttempts: string[] = [];
  let asyncFailure: unknown;
  try {
    await runWebsiteAsyncCleanup([
      (): never => { asyncAttempts.push("sync"); throw synchronous; },
      (): Promise<void> => { asyncAttempts.push("async"); return Promise.reject(asynchronous); },
      (): void => { asyncAttempts.push("last"); },
    ]);
  } catch (error) { asyncFailure = error; }
  TestValidator.equals("async owner attempts all callbacks in order", asyncAttempts, ["sync", "async", "last"]);
  TestValidator.predicate("async owner preserves both independent causes", asyncFailure instanceof AggregateError && asyncFailure.errors.length === 2 && asyncFailure.errors[0] === synchronous && asyncFailure.errors[1] === asynchronous);
}
