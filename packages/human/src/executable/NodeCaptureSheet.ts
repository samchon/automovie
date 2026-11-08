import { type Canvas, type Image, type SKRSContext2D, createCanvas, loadImage } from "@napi-rs/canvas";

/**
 * Contact sheets and before/after pairs of the one-shot capture: one PNG grid
 * of labelled cells, each the downscaled frame of one selection, stage and
 * camera, or an explicit unavailable cell naming its cause. Display only: the
 * cells reuse the frames' exact PNG bytes, decoded and scaled by Skia.
 */
export namespace NodeCaptureSheet {
  /** One cell. */
  export interface ICell {
    /** First label line: the selection. */
    title: string;

    /** Second label line: stage, camera and frame. */
    subtitle: string;

    /** The frame's PNG bytes; null for an unavailable cell. */
    png: Buffer | null;

    /** Why the cell is unavailable; null when drawn. */
    cause: string | null;
  }

  /** Label band height above each cell image, px. */
  const LABEL: number = 34;

  /** Sheet title band height, px: the title and one legend line. */
  const HEADER: number = 62;

  /**
   * Compose rows of cells into one sheet. Each row lists its own cells left
   * to right, so a row with fewer cameras is shorter rather than padded with
   * blank cells.
   *
   * @param title Sheet title.
   * @param rows Cells per row.
   * @param size Cell image edge, px.
   * @param legend Colour legend line under the title; empty for none.
   * @param alert Red warning line under the legend, such as parts left out of the camera fit; empty for none.
   */
  export async function compose(title: string, rows: readonly (readonly ICell[])[], size: number, legend: string = "", alert: string = ""): Promise<Buffer> {
    const header: number = HEADER + (alert.length === 0 ? 0 : 20);
    const columns: number = Math.max(1, ...rows.map((r: readonly ICell[]): number => r.length));
    const width: number = columns * (size + 6) + 6;
    const height: number = header + rows.length * (size + LABEL + 6) + 6;
    const canvas: Canvas = createCanvas(width, height);
    const g: SKRSContext2D = canvas.getContext("2d");
    g.fillStyle = "#d9dee6";
    g.fillRect(0, 0, width, height);
    g.fillStyle = "#101820";
    g.font = "bold 20px Arial";
    g.fillText(clip(g, title, width - 20), 10, 28);
    g.font = "13px Arial";
    g.fillText(clip(g, legend, width - 20), 10, 50);
    if (alert.length !== 0) {
      g.fillStyle = "#c00000";
      g.font = "bold 14px Arial";
      g.fillText(clip(g, alert, width - 20), 10, 70);
    }
    for (let r: number = 0; r < rows.length; ++r)
      for (let c: number = 0; c < rows[r]!.length; ++c) {
        const cell: ICell = rows[r]![c]!;
        const x: number = 6 + c * (size + 6);
        const y: number = header + r * (size + LABEL + 6);
        g.fillStyle = "#ffffff";
        g.fillRect(x, y, size, LABEL);
        g.fillStyle = "#101820";
        g.font = "bold 12px Arial";
        g.fillText(clip(g, cell.title, size - 6), x + 3, y + 14);
        g.font = "12px Arial";
        g.fillText(clip(g, cell.subtitle, size - 6), x + 3, y + 29);
        if (cell.png !== null) {
          const image: Image = await loadImage(cell.png);
          g.imageSmoothingEnabled = true;
          g.imageSmoothingQuality = "high";
          g.drawImage(image, x, y + LABEL, size, size);
        } else {
          g.fillStyle = "#f4dede";
          g.fillRect(x, y + LABEL, size, size);
          g.fillStyle = "#a01010";
          g.font = "bold 16px Arial";
          g.fillText("UNAVAILABLE", x + 8, y + LABEL + 26);
          g.font = "12px Arial";
          wrap(g, cell.cause ?? "no cause recorded", size - 16).slice(0, Math.floor((size - 50) / 15)).forEach((l: string, k: number): void => {
            g.fillText(l, x + 8, y + LABEL + 48 + 15 * k);
          });
        }
      }
    return canvas.toBuffer("image/png");
  }

  /** A side-by-side pair at a common height: earlier on the left, new on the right, each labelled. */
  export async function pair(title: string, earlier: { label: string; png: Buffer }, current: { label: string; png: Buffer }, height: number): Promise<Buffer> {
    const a: Image = await loadImage(earlier.png);
    const b: Image = await loadImage(current.png);
    const wa: number = Math.round((a.width * height) / a.height);
    const wb: number = Math.round((b.width * height) / b.height);
    const canvas: Canvas = createCanvas(wa + wb + 18, height + HEADER + LABEL + 6);
    const g: SKRSContext2D = canvas.getContext("2d");
    g.fillStyle = "#d9dee6";
    g.fillRect(0, 0, canvas.width, canvas.height);
    g.fillStyle = "#101820";
    g.font = "bold 18px Arial";
    g.fillText(clip(g, title, canvas.width - 20), 10, 28);
    g.font = "13px Arial";
    g.fillText(clip(g, `BEFORE ${earlier.label}`, wa - 6), 6, HEADER + 20);
    g.fillText(clip(g, `AFTER ${current.label}`, wb - 6), wa + 12, HEADER + 20);
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    g.drawImage(a, 6, HEADER + LABEL, wa, height);
    g.drawImage(b, wa + 12, HEADER + LABEL, wb, height);
    return canvas.toBuffer("image/png");
  }

  function clip(g: SKRSContext2D, text: string, width: number): string {
    if (g.measureText(text).width <= width) return text;
    let lo: number = 0;
    let hi: number = text.length;
    while (lo < hi) {
      const mid: number = Math.ceil((lo + hi) / 2);
      if (g.measureText(`${text.slice(0, mid)}...`).width <= width) lo = mid;
      else hi = mid - 1;
    }
    return `${text.slice(0, lo)}...`;
  }

  /** Lines of `text` no wider than `width`, broken at spaces and, inside a longer token such as a file path, between characters. */
  function wrap(g: SKRSContext2D, text: string, width: number): string[] {
    const out: string[] = [];
    let line: string = "";
    const words: string[] = [];
    for (const token of text.split(/\s+/)) {
      let rest: string = token;
      while (rest.length > 1 && g.measureText(rest).width > width) {
        let n: number = rest.length - 1;
        while (n > 1 && g.measureText(rest.slice(0, n)).width > width) --n;
        words.push(rest.slice(0, n));
        rest = rest.slice(n);
      }
      words.push(rest);
    }
    for (const word of words) {
      const next: string = line.length === 0 ? word : `${line} ${word}`;
      if (g.measureText(next).width <= width || line.length === 0) line = next;
      else {
        out.push(line);
        line = word;
      }
    }
    if (line.length !== 0) out.push(line);
    return out;
  }
}
