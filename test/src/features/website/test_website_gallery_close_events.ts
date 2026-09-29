import { mountGallery } from "@automovie/website/gallery";
import { TestValidator } from "@nestia/e2e";

import { websiteGalleryFixture } from "../internal/websiteGalleryFixture";

/**
 * Native close is delivered after the open property changes. Synchronous
 * cleanup must survive teardown, and an older notification must not unlock
 * or move focus out of a gallery that has since reopened.
 *
 * Scenarios:
 * 1. Defer close notification, close then reopen: the late event is ignored.
 * 2. Deliver a native Escape close: it unlocks and restores the current opener.
 * 3. Dispose before a pending close notification: the document still unlocks.
 */
export const test_website_gallery_close_events = (): void => {
  const f = websiteGalleryFixture();
  f.dialog.close = () => {
    f.dialog.open = false;
  };
  const dispose = mountGallery(f.document);
  f.openers[0].click();
  f.element<HTMLButtonElement>("#gallery-close").click();
  TestValidator.predicate(
    "close releases lock synchronously",
    !f.document.documentElement.classList.contains("gallery-open"),
  );
  f.openers[1].click();
  const focused = f.element<HTMLButtonElement>("#gallery-close");
  focused.focus();
  f.dialog.dispatchEvent(new f.dom.window.Event("close"));
  TestValidator.predicate(
    "late close cannot change reopened modal",
    f.dialog.open &&
      f.document.documentElement.classList.contains("gallery-open") &&
      f.document.activeElement === focused,
  );
  f.dialog.open = false;
  f.dialog.dispatchEvent(new f.dom.window.Event("close"));
  TestValidator.predicate(
    "native close restores current opener",
    !f.document.documentElement.classList.contains("gallery-open") &&
      f.document.activeElement === f.openers[1],
  );
  f.openers[2].click();
  f.dialog.close();
  dispose();
  f.dialog.dispatchEvent(new f.dom.window.Event("close"));
  TestValidator.predicate(
    "teardown survives pending close",
    !f.dialog.open &&
      !f.document.documentElement.classList.contains("gallery-open") &&
      f.document.activeElement === f.openers[2],
  );
  f.dom.window.close();
};
