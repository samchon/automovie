import type { IHumanDebugSnapshot } from "../contracts/IHumanDebugSnapshot";

/** One drawn frame with the facts its response headers and receipt carry. */
export interface IHumanDebugFrame {
  /** PNG bytes of the page's `#viewport` element. */
  png: Buffer;

  /** Hash of the source the page's modules were loaded from. */
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

  /** Page loads the frame took; above one means saves interrupted loading. */
  attempts: number;
}
