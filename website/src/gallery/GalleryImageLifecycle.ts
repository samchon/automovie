/**
 * Own current image error authority and its listener release. Replacing or
 * disposing an image invalidates the prior callback before it can affect a
 * newer picture, independently of when the browser delivers its queued error.
 */
export class GalleryImageLifecycle {
  private generation = 0;
  private release: () => void = () => {};

  /** The adapter installs the real image first, then binds its current handler. */
  public replace(attach: (whenCurrent: (effect: () => void) => void) => (() => void)): void {
    this.release();
    const generation = ++this.generation;
    this.release = attach((effect) => {
      if (this.generation === generation) effect();
    });
  }

  /** Invalidate current callbacks and synchronously release their native binding. */
  public dispose(): void {
    this.generation++;
    this.release();
    this.release = () => {};
  }
}
