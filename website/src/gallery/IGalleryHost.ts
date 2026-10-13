/**
 * The gallery controller's owned effect port. mountGallery supplies real native
 * dialog/DOM operations; policy consumes observations without replacing those
 * foreign methods. Native focus containment, Escape and inertness remain the
 * browser's responsibility.
 * @author Samchon
 */
export interface IGalleryHost<Opener> {
  /** Native modal availability; false retains ordinary authored links. */
  supportsModal: boolean;

  /** Real current dialog state, including a newer opening after a delayed close. */
  isOpen(): boolean;

  /** Replace building content and its view controls, releasing old listeners. */
  renderBuilding(index: number): void;

  /** Replace the image before binding its own current error handler. */
  renderView(building: number, view: number): void;

  /** Native modal entry; may throw its actual browser failure. */
  showModal(): void;

  /** Native close request, distinct from the subsequent close observation. */
  closeModal(): void;

  /** Update only the gallery's owned document-scroll lock. */
  setLocked(locked: boolean): void;

  /** Restore the original authored opener's focus. */
  focus(opener: Opener): void;

  /** Release current image, view and mounted event listeners. */
  disposeContents(): void;
}
