/**
 * Disposable navigator for the tour's authored cameras. The host provides its
 * document, decoded first-party data and camera callbacks; this module owns
 * only the panel, search/filter state and selection indication. View links are
 * represented by stable ids, and the browser host keeps their URL in sync.
 * Selecting a room never invents a new pose. A collapsed panel remains keyboard
 * reachable, and mobile opens with the full canvas available.
 */
import type { TourData } from "./tourData";

export const mountTourUi = (
  document: Document,
  data: TourData,
  options: {
    select(id: string): void;
    collapsed: boolean;
  },
): { highlight(id: string): void; dispose(): void } => {
  const required = <T extends HTMLElement>(selector: string): T => {
    const element = document.querySelector<T>(selector);
    if (!element) throw new Error(`Missing tour control: ${selector}`);
    return element;
  };
  const title = required<HTMLElement>("#tour-title");
  const era = required<HTMLElement>("#tour-era");
  const source = required<HTMLAnchorElement>("#tour-source");
  const panel = required<HTMLElement>("#tour-panel");
  const toggle = required<HTMLButtonElement>("#panel-toggle");
  const search = required<HTMLInputElement>("#view-search");
  const list = required<HTMLElement>("#view-list");
  const count = required<HTMLElement>("#view-count");
  const current = required<HTMLElement>("#current-view");
  const canvas = required<HTMLCanvasElement>("#view");
  const reset = required<HTMLButtonElement>("#reset");
  const listeners: (() => void)[] = [];
  const listen = (
    element: EventTarget,
    type: string,
    handler: (event: Event) => void,
  ): void => {
    element.addEventListener(type, handler);
    listeners.push(() => element.removeEventListener(type, handler));
  };
  const collapse = (collapsed: boolean): void => {
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
  const buttons = new Map<string, HTMLButtonElement>();
  for (const view of data.views) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "view-option";
    const group = document.createElement("span");
    group.textContent = view.group;
    button.append(group, document.createTextNode(view.label));
    button.dataset.search =
      `${view.group} ${view.label} ${view.id}`.toLowerCase();
    listen(button, "click", () => options.select(view.id));
    buttons.set(view.id, button);
    list.append(button);
  }
  const filter = (): void => {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
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
  listen(toggle, "click", () => collapse(!panel.hidden));
  listen(reset, "click", () => options.select(data.initial));
  return {
    highlight: (id) => {
      for (const [key, button] of buttons)
        button.setAttribute("aria-current", String(key === id));
      const view = data.views.find((view) => view.id === id)!;
      current.textContent = `${view.group} / ${view.label}`;
    },
    dispose: () => {
      for (const remove of listeners) remove();
      list.replaceChildren();
    },
  };
};
