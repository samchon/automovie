import { runWebsiteCleanup } from "../internal/runWebsiteCleanup";
import type { IGalleryHost } from "./IGalleryHost";
import { acceptGalleryClick } from "./acceptGalleryClick";
import { galleryKeyDirection } from "./galleryKeyDirection";
import { isGalleryBackdropOutside } from "./isGalleryBackdropOutside";

/**
 * Own building/view selection and close admission independently of native DOM effects. Each building change resets its view; arrows wrap in that building. A close notification observes the current open state before unlocking, so an older delayed event cannot release a newer opening; the original opener remains the focus owner.
 *
 * Disposal ends controller authority before attempting its independent host effects. Callback failures are retained without a retry; the host owns native dialog, focus and resource-release observations. No timer or foreign browser method replacement is used.
 *
 * Selection coordination is constant plus host rendering work. The caller supplies the borrowed per-building view lengths; their population is not capped here. The controller retains current indices, one opener and at most one disposal receipt, while the mounting host owns image, listener and DOM lifetimes.
 *
 * @evidence contracts/common.md#principled-implementation Integer modular navigation follows authored building/view counts and the current host open observation guards delayed close notifications; valid indices and positive per-building image counts are caller premises.
 * @evidence contracts/common.md#clear-and-simple-design Selection and disposal authority stay in one controller while IGalleryHost owns native effects, allowing direct portable policy observations without replacing browser methods.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported native modal capability preserves authored-link behavior; once-only disposal retains failures instead of retrying effects or hiding a failed release.
 * @evidence contracts/common.md#meaningful-documentation The class and public methods explain wraparound, opener ownership, current-open reconciliation, caller premises and saved disposal failure behavior.
 * @evidence contracts/performance.md#efficient-algorithms Controller work is constant per navigation plus host rendering and its selected-image traversal; dispose attempts a fixed number of host operations, whose content cleanup depends on mounted listener counts.
 * @evidence contracts/performance.md#reuse-equivalent-work Borrowed view lengths and host identity are reused for one mount; current state is not shared across controllers, and effectful open/close requests are never cached as equivalent results.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One mount retains its borrowed counts, host, current indices and opener until disposal clears opener authority; one arbitrary failure receipt can remain until the controller is discarded, with no byte-size cap on host closures or failure values.
 */
export class GalleryController<Opener> {
  /** Current authored building index, initially the first article. */
  private building: number = 0;

  /** Current image index, reset to exterior on building changes. */
  private view: number = 0;

  /** Latest admitted activation's original focus destination. */
  private opener: Opener | null = null;

  /** Terminal callback-authority guard, set before cleanup effects. */
  private disposed: boolean = false;

  /** Presence preserves even an undefined thrown cleanup value. */
  private disposalFailure: unknown[] = [];

  /** Borrowed native effects for this mounted gallery. */
  private readonly host: IGalleryHost<Opener>;

  /** Borrowed authored image counts; valid active counts are positive. */
  private readonly views: readonly number[];

  /** Borrow host effects and view lengths; a supported modal requires a nonempty collection, whose actual view counts come from authored markup. */
  public constructor(host: IGalleryHost<Opener>, views: readonly number[]) {
    this.host = host;
    this.views = views;
    if (host.supportsModal && views.length === 0)
      throw new Error("The gallery needs a building.");
  }

  /**
   * Admit a plain primary activation, intercept its link, render the supplied building and enter the native modal. A host effect can throw after interception; this operation does not roll back an incomplete opening.
   *
   * @evidence contracts/common.md#principled-implementation Terminal/modal/click guards precede ordered host effects; the supplied index must address a building with images because the authored adapter owns index admission.
   * @evidence contracts/common.md#clear-and-simple-design Opening coordinates the existing selection helper and native host effects without acquiring DOM nodes itself.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported or modified activation stays native; a throwing host is not reported as a completed open or silently retried.
   * @evidence contracts/common.md#meaningful-documentation The comment states interception order, index premises and missing partial-open rollback.
   * @evidence contracts/performance.md#efficient-algorithms Coordination is constant plus selected building/image host rendering work.
   * @evidence contracts/performance.md#reuse-equivalent-work Existing host and view counts are reused while each activation performs its own modal effects.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The latest admitted opener is retained for focus restoration; native modal and listener ownership remain with the host until close or dispose.
   */
  public open(
    index: number,
    opener: Opener,
    click: Parameters<typeof acceptGalleryClick>[0],
    intercept: () => void,
  ): boolean {
    if (this.disposed || !this.host.supportsModal || !acceptGalleryClick(click))
      return false;
    intercept();
    this.opener = opener;
    this.selectBuilding(index);
    this.host.showModal();
    this.host.setLocked(true);
    return true;
  }

  /**
   * Button directions wrap the nonempty collection and reset the selected view.
   *
   * @evidence contracts/common.md#principled-implementation Adding collection length before a signed unit step keeps modular indices nonnegative for the supplied nonempty collection.
   * @evidence contracts/common.md#clear-and-simple-design selectBuilding owns the common reset/render sequence used by activation and navigation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Disposed controllers ignore navigation and no building-specific wrap exception is introduced.
   * @evidence contracts/common.md#meaningful-documentation The comment states wraparound, nonempty premise and exterior reset.
   * @evidence contracts/performance.md#efficient-algorithms Index calculation is constant plus current host rendering work.
   * @evidence contracts/performance.md#reuse-equivalent-work Borrowed counts and the existing host are reused without rebuilding a collection index.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only current indices change; no new listener or task is acquired by this method.
   */
  public moveBuilding(direction: -1 | 1): void {
    if (this.disposed) return;
    this.selectBuilding(
      (this.building + this.views.length + direction) % this.views.length,
    );
  }

  /**
   * View controls address an existing view already admitted by the native content owner; this method performs no range check.
   *
   * @evidence contracts/common.md#principled-implementation The supplied authored button index becomes current view before the host renders that building/view pair.
   * @evidence contracts/common.md#clear-and-simple-design Direct view selection is shared by buttons and wrapped keyboard navigation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Disposed selection is inert; no invalid index is replaced by an invented fallback view.
   * @evidence contracts/common.md#meaningful-documentation The comment states external index admission and the missing local range guard.
   * @evidence contracts/performance.md#efficient-algorithms State mutation is constant plus image replacement and selected-view host work.
   * @evidence contracts/performance.md#reuse-equivalent-work The current building and host are reused, while image attachment remains an independent effect.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The method retains only the numeric view index; the host owns replaced-image listener cleanup.
   */
  public selectView(index: number): void {
    if (this.disposed) return;
    this.view = index;
    this.host.renderView(this.building, index);
  }

  /**
   * Intercept an unmodified horizontal arrow and wrap within the current building's positive image count; return false for every other key or disposed controller.
   *
   * @evidence contracts/common.md#principled-implementation galleryKeyDirection admits native key facts, then modular arithmetic advances one view within the authored positive count.
   * @evidence contracts/common.md#clear-and-simple-design Key admission remains a pure helper and selectView owns the resulting state/render mutation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Other keys retain native behavior; no timer or key-handler replacement is used.
   * @evidence contracts/common.md#meaningful-documentation The comment states interception return meaning and the positive-count premise.
   * @evidence contracts/performance.md#efficient-algorithms Key checks and modular arithmetic are constant plus selected-image host rendering work.
   * @evidence contracts/performance.md#reuse-equivalent-work Existing current indices/counts are reused; event interception is performed independently for each admitted key.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Key input and intercept callback are not retained after the call.
   */
  public key(
    input: Parameters<typeof galleryKeyDirection>[0],
    intercept: () => void,
  ): boolean {
    if (this.disposed) return false;
    const direction: -1 | 0 | 1 = galleryKeyDirection(input);
    if (direction === 0) return false;
    intercept();
    const length: number = this.views[this.building];
    this.selectView((this.view + length + direction) % length);
    return true;
  }

  /**
   * Close only when current native target/client-layout facts identify a backdrop click strictly outside the dialog.
   *
   * @evidence contracts/common.md#principled-implementation isGalleryBackdropOutside evaluates native target and rectangle observations before delegating to the normal close sequence.
   * @evidence contracts/common.md#clear-and-simple-design Boundary policy is separate from layout acquisition and shared close effects.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Descendant and exact-edge clicks are not guessed to be backdrop activity.
   * @evidence contracts/common.md#meaningful-documentation The comment states current native facts and strict-outside semantics.
   * @evidence contracts/performance.md#efficient-algorithms Constant rectangle checks precede the fixed close coordination and host effects.
   * @evidence contracts/performance.md#reuse-equivalent-work Each click uses its own current layout facts rather than cached bounds.
   * @evidence contracts/performance.md#bound-retention-and-release-resources No event or layout record is retained; native modal cleanup belongs to close and the host.
   */
  public backdrop(input: Parameters<typeof isGalleryBackdropOutside>[0]): void {
    if (this.disposed) return;
    if (isGalleryBackdropOutside(input)) this.close();
  }

  /**
   * Request native modal closure and reconcile the observed lock and opener focus.
   *
   * @evidence contracts/common.md#principled-implementation Independent cleanup coordination attempts native close and current-state reconciliation even if the first operation throws, preserving both failure channels.
   * @evidence contracts/common.md#clear-and-simple-design Both backdrop and close-button paths share this close owner and closed supplies observed lock/focus handling.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Disposed or unsupported controllers issue no effect; a close failure is retained rather than swallowed to fake completion.
   * @evidence contracts/common.md#meaningful-documentation The comment separates native request from observed lock/focus reconciliation.
   * @evidence contracts/performance.md#efficient-algorithms Two callback attempts cost constant coordination plus actual browser close/focus work.
   * @evidence contracts/performance.md#reuse-equivalent-work Host and opener ownership are reused, but explicit close requests are effects and are not cached across calls.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The host owns native modal release; this request does not retire mount listeners or certify browser completion.
   */
  public close(): void {
    if (this.disposed || !this.host.supportsModal) return;
    runWebsiteCleanup([
      (): void => this.host.closeModal(),
      (): void => this.closed(),
    ]);
  }

  /**
   * An actual newer opening leaves its lock and focus untouched; otherwise attempt unlock and original-opener focus independently. The opener stays retained for this controller until disposal or another opening.
   *
   * @evidence contracts/common.md#principled-implementation A current isOpen observation guards delayed native close events before the two independent host cleanup effects.
   * @evidence contracts/common.md#clear-and-simple-design Native close events and synchronous close requests share the same reconciliation owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No timeout assumes event ordering, and one failing host effect cannot skip the other effect.
   * @evidence contracts/common.md#meaningful-documentation The comment states newer-opening protection, independent effects and opener retention.
   * @evidence contracts/performance.md#efficient-algorithms Current-state observation and two callback attempts require constant coordination work.
   * @evidence contracts/performance.md#reuse-equivalent-work The original opener identity remains shared across navigation; repeated close observations may repeat native focus and unlock effects.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Closing leaves the opener reference until disposal or the next open; no new resources are acquired and the host owns native lock/focus effects.
   */
  public closed(): void {
    if (this.disposed) return;
    if (this.host.isOpen()) return;
    const opener: Opener | null = this.opener;
    runWebsiteCleanup([
      (): void => this.host.setLocked(false),
      (): void => {
        if (opener !== null) this.host.focus(opener);
      },
    ]);
  }

  /**
   * Retire controller authority before attempting modal close, unlock, opener focus and owned-content cleanup independently. Repeated disposal reports its saved failure without repeating effects; successful callback returns do not prove native listener release.
   *
   * @evidence contracts/common.md#principled-implementation Setting disposed and clearing opener precede four independent cleanup attempts; an array receipt preserves even an undefined thrown value for later calls.
   * @evidence contracts/common.md#clear-and-simple-design The controller retires its own authority and delegates native/content owners through the existing effect port.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed effects are not retried or hidden and do not prevent later owner attempts; public callback return is not physical-release proof.
   * @evidence contracts/common.md#meaningful-documentation The comment states terminal ordering, saved failure behavior and native observation limits.
   * @evidence contracts/performance.md#efficient-algorithms Four effect attempts have constant coordination, plus host content cleanup proportional to its owned listener population.
   * @evidence contracts/performance.md#reuse-equivalent-work Repeated disposal reuses the terminal outcome without repeating effects; this sharing is scoped to the same controller ownership attempt.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Opener authority clears before cleanup; host and borrowed counts remain with the discarded controller, and at most one arbitrary failure receipt is retained with no byte cap.
   */
  public dispose(): void {
    if (this.disposed) {
      if (this.disposalFailure.length !== 0) throw this.disposalFailure[0];
      return;
    }
    this.disposed = true;
    if (!this.host.supportsModal) return;
    const opener: Opener | null = this.opener;
    this.opener = null;
    try {
      runWebsiteCleanup([
        (): void => this.host.closeModal(),
        (): void => this.host.setLocked(false),
        (): void => {
          if (opener !== null) this.host.focus(opener);
        },
        (): void => this.host.disposeContents(),
      ]);
    } catch (error) {
      this.disposalFailure.push(error);
      throw error;
    }
  }

  /** Set the current building and exterior index before attempting host renders. */
  private selectBuilding(index: number): void {
    this.building = index;
    this.view = 0;
    this.host.renderBuilding(index);
    this.host.renderView(index, 0);
  }
}
