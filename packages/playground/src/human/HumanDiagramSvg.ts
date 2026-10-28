/**
 * SVG primitives of the Human curve diagrams: pixel mapping, scale-bar length, number text and the line, path, text and document elements.
 *
 * @evidence contracts/common.md#principled-implementation Each primitive writes the SVG element its name says with two-decimal coordinates; the mapping keeps one scale on both axes unless asked not to.
 * @evidence contracts/common.md#clear-and-simple-design The diagrams' drawing vocabulary in one namespace, separate from what drawHumanCurveDiagram evaluates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Text content is escaped; a degenerate data box maps with unit extent instead of dividing by zero.
 * @evidence contracts/common.md#meaningful-documentation Each member states its output.
 * @evidence contracts/performance.md#efficient-algorithms Every primitive is linear in its points or text.
 * @evidence contracts/performance.md#reuse-equivalent-work The mapping closure is built once per plot and reused for every point.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns strings and closures; retains nothing.
 */
export namespace HumanDiagramSvg {
  /** Map a data box into a pixel rectangle; `equal` keeps one scale on both axes and flips nothing. */
  export function fit(
    x0: number,
    x1: number,
    y0: number,
    y1: number,
    [left, top, width, height]: [number, number, number, number],
    equal: boolean = true,
  ): (x: number, y: number) => [number, number] {
    const kx: number = width / (x1 - x0 || 1);
    const ky: number = height / (y1 - y0 || 1);
    if (!equal)
      return (x: number, y: number): [number, number] => [
        left + (x - x0) * kx,
        top + height - (y - y0) * ky * 0.9 - height * 0.05,
      ];
    const k: number = Math.min(kx, ky);
    const ox: number = left + (width - (x1 - x0) * k) / 2;
    const oy: number = top + (height - (y1 - y0) * k) / 2;
    return (x: number, y: number): [number, number] => [
      ox + (x - x0) * k,
      oy + (y - y0) * k,
    ];
  }

  /** Largest 1, 2 or 5 times a power of ten not above `value`. */
  export function roundLength(value: number): number {
    const power: number = 10 ** Math.floor(Math.log10(value));
    return (
      [5, 2, 1]
        .map((m: number): number => m * power)
        .find((v: number): boolean => v <= value) ?? power
    );
  }

  /** Fixed two-decimal number text. */
  export function f(value: number): string {
    return Number.isFinite(value) ? value.toFixed(2) : String(value);
  }

  /** SVG line element. */
  export function line(
    a: [number, number],
    b: [number, number],
    colour: string,
    width: number,
    opacity: number,
  ): string {
    return `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${colour}" stroke-width="${width}" stroke-opacity="${opacity}"/>`;
  }

  /** SVG polyline, closed unless `closed` is false. */
  export function path(
    points: Array<[number, number]>,
    colour: string,
    width: number,
    opacity: number,
    closed: boolean = true,
  ): string {
    const d: string = points
      .map(
        (p: [number, number], i: number): string =>
          `${i === 0 ? "M" : "L"}${f(p[0])} ${f(p[1])}`,
      )
      .join(" ");
    return `<path d="${d}${closed ? " Z" : ""}" fill="none" stroke="${colour}" stroke-width="${width}" stroke-opacity="${opacity}" stroke-linejoin="round"/>`;
  }

  /** SVG text element with escaped content. */
  export function text(
    x: number,
    y: number,
    value: string,
    colour: string,
    size: number,
  ): string {
    const escaped: string = value.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    return `<text x="${f(x)}" y="${f(y)}" fill="${colour}" font-size="${size}" font-family="ui-monospace, Consolas, monospace">${escaped}</text>`;
  }

  /** Standalone 1200 x 1200 SVG document on a white background. */
  export function svg(body: string[]): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"><rect width="100%" height="100%" fill="#fff"/>${body.join("")}</svg>`;
  }
}
