import { HumanDebugPattern } from "../contracts/HumanDebugPattern";
import type { IHumanDebugOptions } from "../contracts/IHumanDebugOptions";

/**
 * Draw the view comparison's legend into its box over the viewport: one swatch and name per part
 * the `part` variable shows, in the subject's order, in columns of twenty at the upper left below
 * the notices; the box is emptied and hidden without a legend, with `legend=0`, or when no part is
 * shown. The box lies inside the viewport, so the image route's frame carries it.
 *
 * @param box The legend's element, a child of the viewport.
 * @param legend The subject's part colours, or undefined for a subject without one.
 * @param options Frame options; `legend` and `part` are read.
 */
export function HumanDebugLegend(
  box: HTMLDivElement,
  legend: readonly { label: string; colour: string }[] | undefined,
  options: IHumanDebugOptions,
): void {
  const shown: { label: string; colour: string }[] = (legend ?? []).filter((entry: { label: string; colour: string }): boolean =>
    HumanDebugPattern.matches(entry.label, options.part, ""),
  );
  box.replaceChildren();
  box.style.cssText =
    "position:absolute;left:8px;top:36px;z-index:2;padding:4px 6px;background:rgba(255,255,255,0.85);" +
    "font:11px ui-monospace,monospace;line-height:1.35;columns:" + Math.max(1, Math.ceil(shown.length / 20)) + ";pointer-events:none;";
  if (!options.legend || shown.length === 0) {
    box.style.display = "none";
    return;
  }
  for (const entry of shown) {
    const row: HTMLDivElement = document.createElement("div");
    const swatch: HTMLSpanElement = document.createElement("span");
    swatch.style.cssText = "display:inline-block;width:10px;height:10px;margin-right:4px;vertical-align:middle;background:#" + entry.colour;
    row.append(swatch, entry.label);
    box.append(row);
  }
}
