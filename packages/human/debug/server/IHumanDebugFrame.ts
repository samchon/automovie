import type { IHumanDebugSnapshot } from "../contracts/IHumanDebugSnapshot";

/** One drawn frame with the facts its response headers and receipt carry. */
export interface IHumanDebugFrame {
  /** PNG bytes of the page's `#viewport` element. */
  png: Buffer;

  /** Disk source inventory hash checked around the page's load, retained with this frame. */
  source: string;

  /** Canonical options the page drew. */
  query: string;

  /** `new-requested-frame` when drawn for this request, `existing-png` when a kept frame answered. */
  cache: "new-requested-frame" | "existing-png";

  /** UTC time the PNG was taken. */
  capturedUtc: string;

  /** SHA-256 of {@link png}. */
  pngSha256: string;

  /** The page's report after the draw. */
  snapshot: IHumanDebugSnapshot;

  /** Frame attempts used; above one records a source-change or module-load retry. */
  attempts: number;
}
