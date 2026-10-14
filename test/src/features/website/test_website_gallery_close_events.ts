import { TestValidator } from "@nestia/e2e";

import { GalleryController } from "../../../../website/src/gallery/GalleryController";
import { createGalleryHostFacts } from "../internal/createGalleryHostFacts";

/**
 * Close completion consumes current open-state facts. An older notification cannot release a newer opening; a reported closed state restores current focus through the owned callback port.
 *
 * Scenarios:
 * 1. Close, reopen, then deliver the old notification: the new lock remains.
 * 2. Report a closed state and duplicate notification: the current opener restores.
 * 3. Dispose an open gallery: closure and release are synchronous and idempotent.
 * 4. Close, unlock, focus and contents each throw: all are attempted once and authority stays retired.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises actual GalleryController close observations and disposal through its supplied effect port; assertions catch stale close unlocks, skipped later cleanup, repeated attempts and lost failure causes.
 * @evidence contracts/testing.md#independent-expectations A newer observed opening keeps its lock, while disposal ends the owner and attempts all four independent cleanups once; expected cause identities are test-owned values in callback order.
 * @evidence contracts/testing.md#distinguishing-cases Covers explicit and duplicate close observations, close/reopen races, successful repeated disposal and four concurrent cleanup failures with refused later activation; native Escape, focus containment and listener release are not observed here.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit directly imports GalleryController and uses the existing owned host-facts seam, with no browser, DOM host, foreign method replacement or new fixture.
 */
export function test_website_gallery_close_events(): void {
  const { host, facts }: ReturnType<typeof createGalleryHostFacts> = createGalleryHostFacts();
  const controller: GalleryController<string> = new GalleryController(host, [3, 3]);
  const click: { button: number; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean; } = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false };
  controller.open(0, "first", click, (): void => {});
  controller.close();
  TestValidator.equals("explicit close completed", [facts.open, facts.locked, facts.focused], [false, false, "first"]);
  controller.open(1, "second", click, (): void => {});
  const before: number = facts.effects.length;
  controller.closed();
  TestValidator.equals("delayed old event causes no effects", facts.effects.length, before);
  TestValidator.equals("reopening stays locked", [facts.open, facts.locked, facts.focused], [true, true, "first"]);
  facts.open = false;
  controller.closed();
  TestValidator.equals("observed closed-state facts restore current opener", [facts.locked, facts.focused], [false, "second"]);
  controller.closed();
  TestValidator.equals("duplicate completion preserves released state", [facts.locked, facts.focused], [false, "second"]);
  controller.open(0, "third", click, (): void => {});
  controller.dispose();
  TestValidator.equals("disposal completes closure synchronously", [facts.open, facts.locked, facts.focused, facts.effects.at(-1)], [false, false, "third", "dispose"]);
  const completed: number = facts.effects.length;
  controller.closed();
  controller.dispose();
  TestValidator.equals("late completion and repeated disposal are inert", facts.effects.length, completed);
  const failureHost: ReturnType<typeof createGalleryHostFacts> = createGalleryHostFacts();
  const causes: Error[] = [new Error("Close failed."), new Error("Unlock failed."), new Error("Focus failed."), new Error("Contents failed.")];
  const attempts: string[] = [];
  const failing: GalleryController<string> = new GalleryController({
    ...failureHost.host,
    closeModal: (): never => { attempts.push("close"); throw causes[0]; },
    setLocked: (locked: boolean): void => {
      if (locked) failureHost.host.setLocked(true);
      else { attempts.push("unlock"); throw causes[1]; }
    },
    focus: (): never => { attempts.push("focus"); throw causes[2]; },
    disposeContents: (): never => { attempts.push("contents"); throw causes[3]; },
  }, [1]);
  failing.open(0, "failing-opener", click, (): void => {});
  let receipt: unknown;
  try { failing.dispose(); }
  catch (error) { receipt = error; }
  TestValidator.predicate("all disposal causes retained in attempt order", receipt instanceof AggregateError && receipt.errors.length === 4 && receipt.errors.every((cause: unknown, index: number): boolean => cause === causes[index]));
  TestValidator.equals("every independent cleanup attempted", attempts, ["close", "unlock", "focus", "contents"]);
  let repeated: unknown;
  try { failing.dispose(); }
  catch (error) { repeated = error; }
  failing.closed();
  failing.close();
  TestValidator.predicate("repeat reports saved receipt", repeated === receipt);
  TestValidator.equals("failed disposal retires effect and opening authority", [attempts.length, failing.open(0, "other", click, (): void => {})], [4, false]);
}
