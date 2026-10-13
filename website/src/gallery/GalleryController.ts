import type { IGalleryHost } from "./IGalleryHost";
import { acceptGalleryClick } from "./acceptGalleryClick";
import { galleryKeyDirection } from "./galleryKeyDirection";
import { isGalleryBackdropOutside } from "./isGalleryBackdropOutside";

/**
 * Own building/view selection and close admission independently of native DOM
 * effects. Each building change resets its view; arrows wrap in that building.
 * A close notification observes the real current open state before unlocking,
 * so an older delayed event cannot release a newer opening. The original
 * opener remains the focus owner. No timer or synthetic browser method is used.
 */
export class GalleryController<Opener> {
  private building = 0;
  private view = 0;
  private opener: Opener | null = null;
  private disposed = false;
  private readonly host: IGalleryHost<Opener>;
  private readonly views: readonly number[];

  public constructor(host: IGalleryHost<Opener>, views: readonly number[]) {
    this.host = host;
    this.views = views;
    if (host.supportsModal && views.length === 0)
      throw new Error("The gallery needs a building.");
  }

  /** Native adapter prevents default only when this opening was admitted. */
  public open(index: number, opener: Opener, click: Parameters<typeof acceptGalleryClick>[0], intercept: () => void): boolean {
    if (this.disposed || !this.host.supportsModal || !acceptGalleryClick(click)) return false;
    intercept();
    this.opener = opener;
    this.selectBuilding(index);
    this.host.showModal();
    this.host.setLocked(true);
    return true;
  }

  /** Button directions wrap the collection and reset the selected view. */
  public moveBuilding(direction: -1 | 1): void {
    if (this.disposed) return;
    this.selectBuilding((this.building + this.views.length + direction) % this.views.length);
  }

  /** View controls address a view already admitted by the native content owner. */
  public selectView(index: number): void {
    if (this.disposed) return;
    this.view = index;
    this.host.renderView(this.building, index);
  }

  /** Return whether the native key event should be intercepted. */
  public key(input: Parameters<typeof galleryKeyDirection>[0], intercept: () => void): boolean {
    if (this.disposed) return false;
    const direction = galleryKeyDirection(input);
    if (direction === 0) return false;
    intercept();
    const length = this.views[this.building];
    this.selectView((this.view + length + direction) % length);
    return true;
  }

  /** Boundary facts come from the actual native click and layout observation. */
  public backdrop(input: Parameters<typeof isGalleryBackdropOutside>[0]): void {
    if (this.disposed) return;
    if (isGalleryBackdropOutside(input)) this.close();
  }

  /**
   * Request native modal closure and reconcile the observed lock and opener focus.
   */
  public close(): void {
    if (this.disposed || !this.host.supportsModal) return;
    this.host.closeModal();
    this.closed();
  }

  /** An actual newer opening leaves its lock and focus untouched. */
  public closed(): void {
    if (this.disposed) return;
    if (this.host.isOpen()) return;
    this.host.setLocked(false);
    if (this.opener !== null) this.host.focus(this.opener);
  }

  /**
   * Close this controller once and release its mounted content and listener ownership.
   */
  public dispose(): void {
    if (this.disposed || !this.host.supportsModal) return;
    this.close();
    this.disposed = true;
    this.host.disposeContents();
  }

  private selectBuilding(index: number): void {
    this.building = index;
    this.view = 0;
    this.host.renderBuilding(index);
    this.host.renderView(index, 0);
  }
}
