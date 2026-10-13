/**
 * Disposable navigator for the tour's authored cameras. The host provides its document, decoded first-party data and camera callbacks; this module owns only the panel, search/filter state and selection indication. View links are represented by stable ids, and the browser host keeps their URL in sync. Selecting a room never invents a new pose. A collapsed panel remains keyboard reachable, and mobile opens with the full canvas available.
 */
import type { TourData } from "./tourData";

/** Connects authored camera ids to the tour panel and host selection callback; the returned disposer removes its listeners and view buttons. */
export const mountTourUi: (document: Document, data: TourData, options: { select(id: string): void; collapsed: boolean; }) => { highlight(id: string): void; dispose(): void; } = (
  document: Document,
  data: TourData,
  options: {
    select(id: string): void;
    collapsed: boolean;
  },
): { highlight(id: string): void; dispose(): void } => {
  const required: <T extends HTMLElement>(selector: string) => T = <T extends HTMLElement>(selector: string): T => {
    const element: T | null = document.querySelector<T>(selector);
    if (!element) throw new Error(`Missing tour control: ${selector}`);
    return element;
  };
  const title: HTMLElement = required<HTMLElement>("#tour-title");
  const era: HTMLElement = required<HTMLElement>("#tour-era");
  const source: HTMLAnchorElement = required<HTMLAnchorElement>("#tour-source");
  const panel: HTMLElement = required<HTMLElement>("#tour-panel");
  const toggle: HTMLButtonElement = required<HTMLButtonElement>("#panel-toggle");
  const search: HTMLInputElement = required<HTMLInputElement>("#view-search");
  const list: HTMLElement = required<HTMLElement>("#view-list");
  const count: HTMLElement = required<HTMLElement>("#view-count");
  const current: HTMLElement = required<HTMLElement>("#current-view");
  const canvas: HTMLCanvasElement = required<HTMLCanvasElement>("#view");
  const reset: HTMLButtonElement = required<HTMLButtonElement>("#reset");
  const listeners: (() => void)[] = [];
  const listen: (element: EventTarget, type: string, handler: (event: Event) => void) => void = (
    element: EventTarget,
    type: string,
    handler: (event: Event) => void,
  ): void => {
    element.addEventListener(type, handler);
    listeners.push(() : void => element.removeEventListener(type, handler));
  };
  const collapse: (collapsed: boolean) => void = (collapsed: boolean): void => {
    panel.hidden = collapsed;
    toggle.setAttribute("aria-expanded", String(!collapsed));
    toggle.textContent = collapsed ? "Choose a view" : "Hide views";
  };
  collapse(options.collapsed);
  title.textContent = data.title;
  era.textContent = data.era;
  source.href = data.source;
  canvas.setAttribute(
    "aria-label",
    `${data.title} interactive 3D scene. Click for mouse look; WASD or arrows fly; Space rises, C descends; Shift moves slowly; R resets; Escape releases the mouse.`,
  );
  const buttons: Map<string, HTMLButtonElement> = new Map<string, HTMLButtonElement>();
  for (const view of data.views) {
    const button: HTMLButtonElement = document.createElement("button");
    button.type = "button";
    button.className = "view-option";
    const group: HTMLSpanElement = document.createElement("span");
    group.textContent = view.group;
    button.append(group, document.createTextNode(view.label));
    button.dataset.search =
      `${view.group} ${view.label} ${view.id}`.toLowerCase();
    listen(button, "click", () : void => options.select(view.id));
    buttons.set(view.id, button);
    list.append(button);
  }
  const filter: () => void = (): void => {
    const query: string = search.value.trim().toLowerCase();
    let visible: number = 0;
    for (const button of buttons.values()) {
      button.hidden = !button.dataset.search!.includes(query);
      if (!button.hidden) visible++;
    }
    count.textContent =
      visible === 0
        ? "No matching views. Try another room name."
        : `${visible} authored views`;
  };
  filter();
  listen(search, "input", filter);
  listen(toggle, "click", () : void => collapse(!panel.hidden));
  listen(reset, "click", () : void => options.select(data.initial));
  return {
    highlight: (id: string) : void => {
      for (const [key, button] of buttons)
        button.setAttribute("aria-current", String(key === id));
      const view: import("./tourData").TourView = data.views.find((view: import("./tourData").TourView) : boolean => view.id === id)!;
      current.textContent = `${view.group} / ${view.label}`;
    },
    dispose: () : void => {
      for (const remove of listeners) remove();
      list.replaceChildren();
    },
  };
};
