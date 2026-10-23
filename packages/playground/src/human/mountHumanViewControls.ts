import type { normalizeHumanView } from "./normalizeHumanView";

/**
 * Add the free-view controls (axis view, azimuth, elevation, ortho, isolate, fit, garment) to the toolbar.
 *
 * Every change composes the controls into the same query text the URL uses
 * and hands it to `onChange`, so the page applies a toolbar change exactly as
 * it applies `?az=..&el=..&ortho=1&isolate=1&fit=selection&garment=0`. Choosing an axis
 * view fills azimuth and elevation, the canonical form of the shorthand. The
 * garment box starts checked, because garments are shown unless `garment=0`.
 *
 * @param toolbar Container the controls are appended to.
 * @param signal Removes every listener when aborted.
 * @param onChange Receives the composed free-view query text.
 * @returns A setter that shows a parsed view without firing `onChange`.
 *
 * @evidence contracts/common.md#principled-implementation Composes the URL variables from the controls, so toolbar and URL go through one parser and one apply path.
 * @evidence contracts/common.md#clear-and-simple-design Owns only these inputs and their listeners; validation and application stay with the page.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty angle inputs are omitted rather than sent as zero, so a named camera keeps its direction.
 * @evidence contracts/common.md#meaningful-documentation States the shared query form and the shorthand behaviour.
 * @evidence contracts/performance.md#efficient-algorithms Constant work per change.
 * @evidence contracts/performance.md#reuse-equivalent-work Inputs persist for the page's life.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Listeners are bound to the given AbortSignal.
 */
export function mountHumanViewControls(
  toolbar: HTMLElement,
  signal: AbortSignal,
  onChange: (query: string) => void,
): (view: normalizeHumanView.IView) => void {
  const input: (type: string, width: string) => HTMLInputElement = (
    type: string,
    width: string,
  ): HTMLInputElement => {
    const node: HTMLInputElement = document.createElement("input");
    node.type = type;
    node.style.width = width;
    if (type === "number") node.step = "any";
    return node;
  };
  const labelled: (text: string, control: HTMLElement) => HTMLLabelElement = (
    text: string,
    control: HTMLElement,
  ): HTMLLabelElement => {
    const label: HTMLLabelElement = document.createElement("label");
    label.append(text, control);
    return label;
  };

  const axis: HTMLSelectElement = document.createElement("select");
  for (const value of ["", "+x", "-x", "+y", "-y", "+z", "-z"]) {
    const option: HTMLOptionElement = document.createElement("option");
    option.value = value;
    option.textContent = value === "" ? "축 방향" : value;
    axis.append(option);
  }
  const azimuth: HTMLInputElement = input("number", "64px");
  const elevation: HTMLInputElement = input("number", "64px");
  const ortho: HTMLInputElement = input("checkbox", "auto");
  const isolate: HTMLInputElement = input("checkbox", "auto");
  const fit: HTMLInputElement = input("checkbox", "auto");
  const garment: HTMLInputElement = input("checkbox", "auto");
  garment.checked = true;
  toolbar.append(
    axis,
    labelled("az", azimuth),
    labelled("el", elevation),
    labelled("ortho", ortho),
    labelled("isolate", isolate),
    labelled("fit", fit),
    labelled("garment", garment),
  );

  // Compose the URL form; an axis choice becomes explicit angles.
  const compose: () => void = (): void => {
    const table: Record<string, [number, number]> = {
      "+x": [0, 0],
      "-x": [180, 0],
      "+z": [90, 0],
      "-z": [-90, 0],
      "+y": [0, 90],
      "-y": [0, -90],
    };
    if (axis.value !== "") {
      [azimuth.value, elevation.value] = table[axis.value]!.map(String) as [
        string,
        string,
      ];
      axis.value = "";
    }
    const query: string[] = [];
    if (azimuth.value !== "") query.push("az=" + azimuth.value);
    if (elevation.value !== "") query.push("el=" + elevation.value);
    if (ortho.checked) query.push("ortho=1");
    if (isolate.checked) query.push("isolate=1");
    if (fit.checked) query.push("fit=selection");
    if (!garment.checked) query.push("garment=0");
    onChange(query.join("&"));
  };
  for (const control of [
    axis,
    azimuth,
    elevation,
    ortho,
    isolate,
    fit,
    garment,
  ])
    control.addEventListener("change", compose, { signal });

  return (view: normalizeHumanView.IView): void => {
    azimuth.value = view.az === undefined ? "" : String(view.az);
    elevation.value = view.el === undefined ? "" : String(view.el);
    ortho.checked = view.ortho;
    isolate.checked = view.isolate;
    fit.checked = view.fit === "selection";
    garment.checked = view.garment;
  };
}
