import type { Page } from "playwright";

import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import type { planHumanViewerSheet } from "./planHumanViewerSheet.js";

/**
 * Capture one ordered review matrix and compose its labels in Chromium's 2D canvas. The injected capture operation owns GPU admission; this owner checks that the source revision stays unchanged across the complete sheet. It returns PNG bytes and writes no file. Captured cells can already include the requested local reference photograph; this owner adds no photograph itself and rescales every PNG to a square cell, including a widened split comparison.
 *
 * @evidence contracts/common.md#principled-implementation Captures planned cells through the guarded capture owner, composes their PNGs and labels in the page canvas and rechecks ready-generation identity after asynchronous composition.
 * @evidence contracts/common.md#clear-and-simple-design Cell planning remains external while one sequential capture loop and one browser composition operation own this sheet.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing canvas context or source change refuses; caption layout and camera/render values remain unchanged and no new synthetic scene validates them.
 * @evidence contracts/common.md#meaningful-documentation Documentation describes ordered cell captures, existing reference-photo composition, square rescaling, required context and the final source-generation refusal without claiming preserved split-image aspect.
 * @evidence contracts/performance.md#efficient-algorithms C cells retain their encoded frames before composition; drawing/encoding cost the combined sheet pixels, while the existing planner bounds the admitted cell population.
 * @evidence contracts/performance.md#reuse-equivalent-work Each capture delegates resident/cache reuse to the actual capture owner; composition is a request effect and the whole sheet is not cached locally.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The request awaits all capture and composition work and then releases temporary frame references; output bytes scale with sheet pixels and no separate byte cap is introduced here.
 */
export async function renderHumanViewerSheet(props: {
  page: Page;
  cells: ReturnType<typeof planHumanViewerSheet>;
  capture: (address: HumanViewerAddress) => Promise<Buffer>;
  revision: () => string;
}): Promise<Buffer> {
  const frames: { png: string; label: string }[] = [];
  const selectedRevision: string = props.revision();
  for (const cell of props.cells)
    frames.push({
      png: (await props.capture(cell.address)).toString("base64"),
      label: cell.label,
    });
  if (props.revision() !== selectedRevision)
    throw new Error("Source changed during sheet capture");
  const result: string = await props.page.evaluate(
    async ({ frames, size }: { frames: { png: string; label: string }[]; size: number }): Promise<string> => {
      const columns: number = Math.ceil(Math.sqrt(frames.length));
      const caption: number = 42;
      const canvas: HTMLCanvasElement = document.createElement("canvas");
      canvas.width = columns * size;
      canvas.height = Math.ceil(frames.length / columns) * (size + caption);
      const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
      if (ctx === null) throw new Error("A 2D canvas is required for a review sheet.");
      ctx.fillStyle = "#1c252e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = "12px sans-serif";
      for (const [index, frame] of frames.entries()) {
        const image: HTMLImageElement = new Image();
        image.src = "data:image/png;base64," + frame.png;
        await image.decode();
        const x: number = (index % columns) * size;
        const y: number = Math.floor(index / columns) * (size + caption);
        ctx.drawImage(image, x, y, size, size);
        ctx.fillStyle = "#eeeeee";
        ctx.fillText(frame.label, x + 6, y + size + 22, size - 12);
      }
      return canvas.toDataURL("image/png");
    },
    { frames, size: props.cells[0].address.size },
  );
  if (props.revision() !== selectedRevision)
    throw new Error("Source changed during sheet capture");
  return Buffer.from(result.split(",")[1], "base64");
}
