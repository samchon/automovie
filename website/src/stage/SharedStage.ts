import * as THREE from "three";

/**
 * One WebGL renderer for every 3D view of a page.
 *
 * A browser keeps a few WebGL contexts at once (Chrome: 16 on a desktop, 8
 * on Android) and drops the oldest beyond that, so a page of cards cannot
 * give each card its own. Here one renderer draws each view in turn into
 * the corner of its own canvas and copies that corner into the view's 2D
 * canvas. Views out of the window are neither posed nor drawn, a view draws
 * only when it says it changed, and `near` lets a view wait to load until it
 * comes near the window, so a page of cards costs what it shows.
 */
export namespace SharedStage {
  /** One registered view. */
  export interface IView {
    /** The 2D canvas the view is shown in; its CSS size is the view's size. */
    canvas: HTMLCanvasElement;

    /** What the view draws. */
    scene: THREE.Scene;

    /** The camera it draws through; its aspect is kept to the canvas. */
    camera: THREE.PerspectiveCamera;

    /**
     * Advance the view to a wall-clock time and say whether it must be drawn.
     *
     * @param now Milliseconds, `performance.now()`.
     * @returns Whether the picture changed since the last draw.
     */
    tick(now: number): boolean;
  }

  /** A registration, which ends the view's drawing. */
  export interface IRegistration {
    /** Stop drawing the view. */
    release(): void;

    /** Ask for the view to be drawn on the next frame, as after a change outside `tick`. */
    invalidate(): void;
  }

  /** The renderer's canvas grows to the largest view and never shrinks. */
  const MAX_PIXEL_RATIO: number = 2;

  interface IEntry {
    view: IView;
    visible: boolean;
    dirty: boolean;
  }

  let renderer: THREE.WebGLRenderer | null = null;
  let observer: IntersectionObserver | null = null;
  let frame: number | null = null;
  const entries: Map<HTMLCanvasElement, IEntry> = new Map();

  /**
   * Start drawing a view.
   *
   * @param view The view.
   * @returns Its registration.
   */
  export function register(view: IView): IRegistration {
    const entry: IEntry = { view, visible: false, dirty: true };
    entries.set(view.canvas, entry);
    watch().observe(view.canvas);
    loop();
    return {
      release: (): void => {
        observer?.unobserve(view.canvas);
        entries.delete(view.canvas);
        if (entries.size === 0) stop();
      },
      invalidate: (): void => {
        entry.dirty = true;
      },
    };
  }

  /**
   * Call once when an element first comes within a screen of the window.
   *
   * @param element The element, such as a view's canvas.
   * @param callback Called once, when it comes near.
   * @returns What stops waiting.
   */
  export function near(element: Element, callback: () => void): () => void {
    const watcher: IntersectionObserver = new IntersectionObserver(
      (records: IntersectionObserverEntry[]): void => {
        if (
          !records.some(
            (r: IntersectionObserverEntry): boolean => r.isIntersecting,
          )
        )
          return;
        watcher.disconnect();
        callback();
      },
      { rootMargin: "100% 0px" },
    );
    watcher.observe(element);
    return (): void => watcher.disconnect();
  }

  /** The observer that marks which views are in the window. */
  function watch(): IntersectionObserver {
    if (observer !== null) return observer;
    observer = new IntersectionObserver(
      (records: IntersectionObserverEntry[]): void => {
        for (const record of records) {
          const entry: IEntry | undefined = entries.get(
            record.target as HTMLCanvasElement,
          );
          if (entry === undefined) continue;
          entry.visible = record.isIntersecting;
          if (entry.visible) entry.dirty = true;
        }
      },
      { rootMargin: "64px" },
    );
    return observer;
  }

  /** The renderer, made on first use. */
  function gl(): THREE.WebGLRenderer {
    if (renderer !== null) return renderer;
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    return renderer;
  }

  /** Draw every visible view that changed, then ask for the next frame. */
  function loop(): void {
    if (frame !== null) return;
    const step: (now: number) => void = (now: number): void => {
      frame = requestAnimationFrame(step);
      for (const entry of entries.values()) {
        // A view out of the window is neither posed nor drawn; its clock is
        // read again when it comes back.
        if (!entry.visible) continue;
        const changed: boolean = entry.view.tick(now);
        if (!(changed || entry.dirty)) continue;
        draw(entry.view);
        entry.dirty = false;
      }
    };
    frame = requestAnimationFrame(step);
  }

  /**
   * Stop the frame loop and free the renderer when no view is left, its
   * WebGL context with it, so a page that mounts views again never holds two.
   */
  function stop(): void {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    observer?.disconnect();
    observer = null;
    renderer?.forceContextLoss();
    renderer?.dispose();
    renderer = null;
  }

  /** Draw one view into its canvas. */
  function draw(view: IView): void {
    const ratio: number = Math.min(
      MAX_PIXEL_RATIO,
      window.devicePixelRatio || 1,
    );
    const width: number = Math.max(
      1,
      Math.round(view.canvas.clientWidth * ratio),
    );
    const height: number = Math.max(
      1,
      Math.round(view.canvas.clientHeight * ratio),
    );
    if (view.canvas.width !== width || view.canvas.height !== height) {
      view.canvas.width = width;
      view.canvas.height = height;
    }

    // The renderer's canvas holds the largest view drawn so far; each view is
    // drawn into its lower-left corner.
    const r: THREE.WebGLRenderer = gl();
    const size: THREE.Vector2 = r.getSize(new THREE.Vector2());
    if (size.x < width || size.y < height)
      r.setSize(Math.max(size.x, width), Math.max(size.y, height), false);
    const full: THREE.Vector2 = r.getSize(new THREE.Vector2());
    view.camera.aspect = width / height;
    view.camera.updateProjectionMatrix();
    r.setViewport(0, 0, width, height);
    r.setScissor(0, 0, width, height);
    r.setScissorTest(true);
    r.render(view.scene, view.camera);

    const context: CanvasRenderingContext2D | null =
      view.canvas.getContext("2d");
    if (context === null) return;
    context.clearRect(0, 0, width, height);
    context.drawImage(
      r.domElement,
      0,
      full.y - height,
      width,
      height,
      0,
      0,
      width,
      height,
    );
  }
}
