import type { AutoMovieViewerDisplay } from "../AutoMovieViewerDisplay";
import { createViewerDisplayPublication } from "./createViewerDisplayPublication";

/*
 * Copy a completed display before asynchronously encoding and saving it. The
 * caller owns completion, facts and commitment. One encoder/upload and one
 * latest pending bitmap bound work; failed snapshots retain the previous
 * pending and published frame. Owned superseded surfaces are released. Prepare
 * copies a provisional visible frame without starting an upload; commit admits
 * the same staged bitmap, or copies a direct active display. Commit/change
 * return whether synchronous copying succeeded; asynchronous encoding or HTTP
 * failures are reported separately and do not certify IO.
 */
export function createViewerDisplaySave(
  props: AutoMovieViewerDisplay.ISaveRequest,
): AutoMovieViewerDisplay.IPublication {
  let sequence: number = 0;
  let running: boolean = false;
  const cancellation: AbortController = new AbortController();
  let reader: FileReader | undefined;
  const snapshot: () =>
    | {
        surface: HTMLCanvasElement;
        metadata: AutoMovieViewerDisplay.IDisplayMetadata & {
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
        metadata: AutoMovieViewerDisplay.IDisplayMetadata & {
          session?: string;
          generation?: number;
          width: number;
          height: number;
          displayedAt: string;
        };
      }
    | undefined => {
    const observed: AutoMovieViewerDisplay.IDisplayMetadata | undefined =
      props.observe();
    if (observed === undefined) return undefined;
    const facts: AutoMovieViewerDisplay.IDisplayMetadata = structuredClone(observed);
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
      metadata: AutoMovieViewerDisplay.IDisplayMetadata & {
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
          reject: (reason?: unknown) => void,
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
          reject: (reason?: unknown) => void,
        ): void => {
          const reading: FileReader = new FileReader();
          reader = reading;
          reading.onload = (): void => resolve(String(reading.result));
          reading.onerror = (): void =>
            reject(
              new Error("The encoded display could not be read.", {
                cause: reading.error,
              }),
            );
          reading.onabort = (): void => reject(cancellation.signal.reason);
          reading.readAsDataURL(blob);
        },
      );
      reader = undefined;
      if (!publication.active()) return;
      const response: Response = await fetch("/display", {
        signal: cancellation.signal,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...metadata, sequence: sequenceId, png: data }),
      });
      if (!response.ok) throw new Error(await response.text());
    } catch (cause) {
      if (!cancellation.signal.aborted)
        console.warn("AUTOMOVIE_DISPLAY_SAVE " + String(cause));
    } finally {
      reader = undefined;
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
            metadata: AutoMovieViewerDisplay.IDisplayMetadata & {
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
  const publication: AutoMovieViewerDisplay.IPublication = createViewerDisplayPublication({
    copy,
    start: (session: string, generation: number): void => {
      // The lifecycle calls start only after a successful original copy.
      pending!.metadata.session = session;
      pending!.metadata.generation = generation;
      void flush();
    },
    release: (): void => {
      cancellation.abort();
      reader?.abort();
      if (pending !== undefined) {
        pending.surface.width = 0;
        pending.surface.height = 0;
      }
      pending = undefined;
    },
  });
  return publication;
}
