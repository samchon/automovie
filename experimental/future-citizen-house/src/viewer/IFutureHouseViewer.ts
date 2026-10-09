import type { createViewerPayload } from "./payload";

/** Existing source-backed browser observation controls, without a new authoring surface. */
export interface IFutureHouseViewer {
  renderer(): string | null;
  basis(): string | null;
  valid(): boolean;
  observations(): ReturnType<typeof createViewerPayload>["stations"];
  audit(): ReturnType<typeof createViewerPayload>["audit"] | null;
  select(space: string, id: string): void;
  readPixels(x: number, y: number, width: number, height: number): number[];
}
