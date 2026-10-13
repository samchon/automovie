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
 * @evidence contracts/common.md#principled-implementation Pixels and observed facts are synchronously copied before encoding.
 * @evidence contracts/common.md#clear-and-simple-design One bitmap queue serves supported producers without duplicating writers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads the supplied canvas using standard toBlob copying without another model render, forged camera or SDK mutation.
 * @evidence contracts/common.md#meaningful-documentation Defines completion, commitment, bounded work and failure ownership.
 * @evidence requirements/review/subject-inspection.md#review-subject-evidence Preserves original source, view and runtime facts with supplied display pixels.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-observation Transfers observed bytes and facts without granting review coverage or acceptance.
 */
export function createViewerDisplaySave(props: {
  canvas: HTMLCanvasElement;
  observe: () => IAutoMovieViewerDisplayMetadata | undefined;
  /** Paint existing visible layers onto this owned surface, when applicable. */
  paint?: (surface: HTMLCanvasElement) => void;
  /** Keep the encoded completed bitmap for this display's graphics recovery. */
  retain?: (blob: Blob) => void;
}) {
  let sequence = 0;
  let running = false;
  const snapshot = (): { surface: HTMLCanvasElement; metadata: IAutoMovieViewerDisplayMetadata & {
    session?: string; generation?: number; width: number; height: number; displayedAt: string;
  } } | undefined => {
    const observed = props.observe();
    if (observed === undefined) return undefined;
    const facts = structuredClone(observed);
    const surface = document.createElement("canvas");
    try {
      if (props.paint !== undefined) props.paint(surface);
      else {
        surface.width = props.canvas.width;
        surface.height = props.canvas.height;
        const context = surface.getContext("2d");
        if (context === null) throw new Error("A 2D surface is required to retain the completed display.");
        context.drawImage(props.canvas, 0, 0);
      }
      return { surface, metadata: {
        ...facts, width: surface.width, height: surface.height,
        displayedAt: new Date().toISOString(),
      } };
    } catch (cause) {
      surface.width = 0;
      surface.height = 0;
      throw cause;
    }
  };
  let pending: ReturnType<typeof snapshot>;
  const flush = async (): Promise<void> => {
    if (pending === undefined || running || !publication.active()) return;
    const { surface, metadata } = pending;
    pending = undefined;
    running = true;
    const sequenceId = ++sequence;
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        surface.toBlob((value) => value === null
          ? reject(new Error("The displayed frame could not be encoded."))
          : resolve(value), "image/png");
        // The standard copies pixels before asynchronous serialization.
        surface.width = 0;
        surface.height = 0;
      });
      if (!publication.active()) return;
      props.retain?.(blob);
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("The encoded display could not be read.", { cause: reader.error }));
        reader.readAsDataURL(blob);
      });
      if (!publication.active()) return;
      const response = await fetch("/display", {
        method: "POST", headers: { "Content-Type": "application/json" },
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
  const copy = (): boolean => {
    try {
      const completed = snapshot();
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
  const publication = createViewerDisplayPublication({
    copy,
    start: (session, generation) => {
      // The lifecycle calls start only after a successful original copy.
      pending!.metadata.session = session;
      pending!.metadata.generation = generation;
      void flush();
    },
    release: () => {
      if (pending !== undefined) {
        pending.surface.width = 0;
        pending.surface.height = 0;
      }
      pending = undefined;
    },
  });
  return publication;
}
