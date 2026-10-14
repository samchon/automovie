import type { IAutoMovieViewerDisplayMetadata } from "./IAutoMovieViewerDisplayMetadata.js";
import { createViewerDisplayPublication } from "./createViewerDisplayPublication.js";

/**
 * Copy a completed display before asynchronously encoding and saving it.
 * The caller owns completion, facts and commitment. One encoder/upload and
 * one latest pending bitmap bound work; failed snapshots retain the previous
 * pending and published frame. Owned superseded surfaces are released.
 * Prepare copies a provisional visible frame without starting an upload;
 * commit admits the same staged bitmap, or copies a direct active display.
 * Commit/change return whether synchronous copying succeeded; asynchronous
 * encoding or HTTP failures are reported separately and do not certify IO.
 *
 * @evidence contracts/common.md#principled-implementation Structured-clones completed metadata and copies original canvas pixels before PNG encoding, then posts the committed session/generation and monotone local sequence to the actual /display sink; copied facts/pixels must belong to one completed display, and synchronous success does not certify retain/encode/network completion.
 * @evidence contracts/common.md#clear-and-simple-design Owns browser bitmap/encoding/upload lifetime and delegates preparation/commit authority to createViewerDisplayPublication; optional paint and retain ports preserve existing visible-layer and graphics-recovery owners without a parallel render or solver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Saves actual copied pixels/metadata rather than a synthetic probe or fixture PNG; refused snapshot preserves the previous pending bitmap, and asynchronous failures are surfaced as AUTOMOVIE display-save warnings instead of a false saved receipt.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes provisional copy, committed upload, async failure and independent original-pixel retention; one-running/one-pending population and superseded-surface release are explicit.
 * @evidence contracts/performance.md#efficient-algorithms Copy/PNG/base64 serialization are O(frame pixels or encoded bytes plus cloned metadata); one encoder/upload runs while only latest pending bitmap survives, preventing a frame-per-draw backlog. Driver/browser serialization and network costs remain real work.
 * @evidence contracts/performance.md#reuse-equivalent-work Prepared original copy is reused by commit, successive pending copies replace superseded surfaces, and the running result is retained for graphics recovery; different completed pixels/facts require a new original snapshot rather than a metadata-only equivalence claim.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns at most one running surface/blob/data URL and one pending surface/facts, bounded in bytes by their raster/encoded sizes rather than a fixed byte cap; release zeros/discards pending canvas and closes future authority. In-flight FileReader/fetch is not actively aborted or time-bounded, though closed checks prevent later stages from starting after their waits.
 */
export function createViewerDisplaySave(props: {
  canvas: HTMLCanvasElement;
  observe: () => IAutoMovieViewerDisplayMetadata | undefined;
  /** Paint existing visible layers onto this owned surface, when applicable. */
  paint?: (surface: HTMLCanvasElement) => void;
  /** Keep the encoded completed bitmap for this display's graphics recovery. */
  retain?: (blob: Blob) => void;
}): {
  active: () => boolean;
  prepare: () => boolean;
  commit: (session: string, generation: number) => boolean;
  changed: () => boolean;
  dispose: () => void;
} {
  let sequence: number = 0;
  let running: boolean = false;
  const snapshot: () =>
    | {
        surface: HTMLCanvasElement;
        metadata: IAutoMovieViewerDisplayMetadata & {
          session?: string;
          generation?: number;
          width: number;
          height: number;
          displayedAt: string;
        };
      }
    | undefined = ():
    | {
        surface: HTMLCanvasElement;
        metadata: IAutoMovieViewerDisplayMetadata & {
          session?: string;
          generation?: number;
          width: number;
          height: number;
          displayedAt: string;
        };
      }
    | undefined => {
    const observed: IAutoMovieViewerDisplayMetadata | undefined =
      props.observe();
    if (observed === undefined) return undefined;
    const facts: IAutoMovieViewerDisplayMetadata = structuredClone(observed);
    const surface: HTMLCanvasElement = document.createElement("canvas");
    try {
      if (props.paint !== undefined) props.paint(surface);
      else {
        surface.width = props.canvas.width;
        surface.height = props.canvas.height;
        const context: CanvasRenderingContext2D | null =
          surface.getContext("2d");
        if (context === null)
          throw new Error(
            "A 2D surface is required to retain the completed display.",
          );
        context.drawImage(props.canvas, 0, 0);
      }
      return {
        surface,
        metadata: {
          ...facts,
          width: surface.width,
          height: surface.height,
          displayedAt: new Date().toISOString(),
        },
      };
    } catch (cause) {
      surface.width = 0;
      surface.height = 0;
      throw cause;
    }
  };
  let pending: ReturnType<typeof snapshot>;
  const flush: () => Promise<void> = async (): Promise<void> => {
    if (pending === undefined || running || !publication.active()) return;
    const {
      surface,
      metadata,
    }: {
      surface: HTMLCanvasElement;
      metadata: IAutoMovieViewerDisplayMetadata & {
        session?: string;
        generation?: number;
        width: number;
        height: number;
        displayedAt: string;
      };
    } = pending;
    pending = undefined;
    running = true;
    const sequenceId: number = ++sequence;
    try {
      const blob: Blob = await new Promise<Blob>(
        (
          resolve: (value: Blob | PromiseLike<Blob>) => void,
          reject: (reason?: any) => void,
        ): void => {
          surface.toBlob(
            (value: Blob | null): void =>
              value === null
                ? reject(new Error("The displayed frame could not be encoded."))
                : resolve(value),
            "image/png",
          );
          // The standard copies pixels before asynchronous serialization.
          surface.width = 0;
          surface.height = 0;
        },
      );
      if (!publication.active()) return;
      props.retain?.(blob);
      const data: string = await new Promise<string>(
        (
          resolve: (value: string | PromiseLike<string>) => void,
          reject: (reason?: any) => void,
        ): void => {
          const reader: FileReader = new FileReader();
          reader.onload = (): void => resolve(String(reader.result));
          reader.onerror = (): void =>
            reject(
              new Error("The encoded display could not be read.", {
                cause: reader.error,
              }),
            );
          reader.readAsDataURL(blob);
        },
      );
      if (!publication.active()) return;
      const response: Response = await fetch("/display", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...metadata, sequence: sequenceId, png: data }),
      });
      if (!response.ok) throw new Error(await response.text());
    } catch (cause) {
      console.warn("AUTOMOVIE_DISPLAY_SAVE " + String(cause));
    } finally {
      surface.width = 0;
      surface.height = 0;
      running = false;
      if (pending !== undefined && publication.active()) void flush();
    }
  };
  const copy: () => boolean = (): boolean => {
    try {
      const completed:
        | {
            surface: HTMLCanvasElement;
            metadata: IAutoMovieViewerDisplayMetadata & {
              session?: string;
              generation?: number;
              width: number;
              height: number;
              displayedAt: string;
            };
          }
        | undefined = snapshot();
      if (completed === undefined) return false;
      if (pending !== undefined) {
        pending.surface.width = 0;
        pending.surface.height = 0;
      }
      pending = completed;
      return true;
    } catch (cause) {
      console.warn("AUTOMOVIE_DISPLAY_SAVE " + String(cause));
      return false;
    }
  };
  const publication: {
    active: () => boolean;
    prepare: () => boolean;
    commit: (session: string, generation: number) => boolean;
    changed: () => boolean;
    dispose: () => void;
  } = createViewerDisplayPublication({
    copy,
    start: (session: string, generation: number): void => {
      // The lifecycle calls start only after a successful original copy.
      pending!.metadata.session = session;
      pending!.metadata.generation = generation;
      void flush();
    },
    release: (): void => {
      if (pending !== undefined) {
        pending.surface.width = 0;
        pending.surface.height = 0;
      }
      pending = undefined;
    },
  });
  return publication;
}
