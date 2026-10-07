/**
 * Capture one ordered review matrix and compose its labels in Chromium's 2D
 * canvas. The injected capture operation owns GPU admission; this owner checks
 * that the source revision stays unchanged across the complete sheet. It
 * returns PNG bytes and writes no file or reference-photo layer.
 *
 * @evidence contracts/common.md#principled-implementation Serial cell capture and a final revision comparison prevent a sheet from mixing source generations.
 * @evidence contracts/common.md#clear-and-simple-design Sheet composition has explicit capture, revision and browser inputs instead of server-global ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Composes the actual captured cells and authored axis labels without fixture or subject recognition.
 * @evidence contracts/common.md#meaningful-documentation Defines GPU admission ownership, matrix ordering and the no-file-write boundary.
 */
import type { Page } from "playwright";

import type { HumanViewerAddress } from "./HumanViewerAddress";
import type { planHumanViewerSheet } from "./planHumanViewerSheet";

export async function renderHumanViewerSheet(props: {
  page: Page;
  cells: ReturnType<typeof planHumanViewerSheet>;
  capture: (address: HumanViewerAddress) => Promise<Buffer>;
  revision: () => string;
}): Promise<Buffer> {
  const frames = [];
  const selectedRevision = props.revision();
  for (const cell of props.cells)
    frames.push({
      png: (await props.capture(cell.address)).toString("base64"),
      label: cell.label,
    });
  if (props.revision() !== selectedRevision)
    throw new Error("Source changed during sheet capture");
  const result = await props.page.evaluate(
    async ({ frames, size }) => {
      const columns = Math.ceil(Math.sqrt(frames.length));
      const caption = 42;
      const canvas = document.createElement("canvas");
      canvas.width = columns * size;
      canvas.height = Math.ceil(frames.length / columns) * (size + caption);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#1c252e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = "12px sans-serif";
      for (const [index, frame] of frames.entries()) {
        const image = new Image();
        image.src = "data:image/png;base64," + frame.png;
        await image.decode();
        const x = (index % columns) * size,
          y = Math.floor(index / columns) * (size + caption);
        ctx.drawImage(image, x, y, size, size);
        ctx.fillStyle = "#eeeeee";
        ctx.fillText(frame.label, x + 6, y + size + 22, size - 12);
      }
      return canvas.toDataURL("image/png");
    },
    { frames, size: props.cells[0].address.size },
  );
  return Buffer.from(result.split(",")[1], "base64");
}
