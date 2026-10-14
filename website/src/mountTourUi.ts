/**
 * Disposable navigator for the tour's authored cameras. The host provides its document, decoded first-party data and camera callbacks; this module owns only the panel, search/filter state and selection indication. View links are represented by stable ids, and the browser host keeps their URL in sync. Selecting a room never invents a new pose. A collapsed panel remains keyboard reachable, and mobile opens with the full canvas available.
 */
import { runWebsiteCleanup } from "./internal/runWebsiteCleanup";
import type { TourData } from "./tourData";

/**
 * Connect authored camera ids to the tour panel and host selection callback. Data must contain unique ids and highlight must receive an existing id. Disposal retires listener authority before attempting every removal and clearing view buttons; repeated disposal reports a saved failure without reissuing effects. Partial native attachment failure before return has no transactional rollback here.
 *
 * @evidence contracts/common.md#principled-implementation Stable authored ids bind each button to its supplied selection callback, while substring matching filters lowercase group/label/id text; required DOM controls are looked up before binding.
 * @evidence contracts/common.md#clear-and-simple-design The panel owns display, search and selection indication; the tour host applies camera poses and synchronizes browser URLs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No pose is synthesized and no foreign DOM method is replaced; disposed listener callbacks lose authority before independent removal attempts, while partial attachment rollback remains a known gap.
 * @evidence contracts/common.md#meaningful-documentation The comment states id premises, display ownership, sticky cleanup failures and the pre-return rollback limit.
 * @evidence contracts/performance.md#efficient-algorithms Mount uses O(V + L) button/search-text work and storage for views and label characters; filtering scans current search texts, highlighting scans V buttons and views, and cleanup attempts O(V) listeners.
 * @evidence contracts/performance.md#reuse-equivalent-work Lowercase search text and button identity are prepared once for the mount; each new query and selected id updates only current owned display without cross-document caching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One mount retains its data, DOM controls, O(V) buttons/listeners and at most one arbitrary failure receipt; dispose retires authority and attempts listener removal plus list clearing once, while actual browser release and pre-return failures remain host concerns.
 */
export const mountTourUi: (
  document: Document,
  data: TourData,
  options: { select(id: string): void; collapsed: boolean },
) => { highlight(id: string): void; dispose(): void } = (
  document: Document,
  data: TourData,
  options: {
    /** Apply an existing authored camera id in the host and synchronize its URL. */
    select(id: string): void;

    /** Initial panel visibility; the toggle remains outside the hidden panel. */
    collapsed: boolean;
  },
): {
  /** Indicate one existing authored id and update current-view text. */
  highlight(id: string): void;

  /** Retire authority and attempt all owned listener removals once. */
  dispose(): void;
} => {
  const required: <T extends HTMLElement>(selector: string) => T = <
    T extends HTMLElement,
  >(
    selector: string,
  ): T => {
    const element: T | null = document.querySelector<T>(selector);
    if (!element) throw new Error(`Missing tour control: ${selector}`);
    return element;
  };
  const title: HTMLElement = required<HTMLElement>("#tour-title");
  const era: HTMLElement = required<HTMLElement>("#tour-era");
  const source: HTMLAnchorElement = required<HTMLAnchorElement>("#tour-source");
  const panel: HTMLElement = required<HTMLElement>("#tour-panel");
  const toggle: HTMLButtonElement =
    required<HTMLButtonElement>("#panel-toggle");
  const search: HTMLInputElement = required<HTMLInputElement>("#view-search");
  const list: HTMLElement = required<HTMLElement>("#view-list");
  const count: HTMLElement = required<HTMLElement>("#view-count");
  const current: HTMLElement = required<HTMLElement>("#current-view");
  const canvas: HTMLCanvasElement = required<HTMLCanvasElement>("#view");
  const reset: HTMLButtonElement = required<HTMLButtonElement>("#reset");
  const listeners: (() => void)[] = [];
  let disposed: boolean = false;
  const disposalFailure: unknown[] = [];
  const listen: (
    element: EventTarget,
    type: string,
    handler: (event: Event) => void,
  ) => void = (
    element: EventTarget,
    type: string,
    handler: (event: Event) => void,
  ): void => {
    const callback: (event: Event) => void = (event: Event): void => {
      if (!disposed) handler(event);
    };
    element.addEventListener(type, callback);
    listeners.push((): void => element.removeEventListener(type, callback));
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
  const buttons: Map<string, HTMLButtonElement> = new Map<
    string,
    HTMLButtonElement
  >();
  for (const view of data.views) {
    const button: HTMLButtonElement = document.createElement("button");
    button.type = "button";
    button.className = "view-option";
    const group: HTMLSpanElement = document.createElement("span");
    group.textContent = view.group;
    button.append(group, document.createTextNode(view.label));
    button.dataset.search =
      `${view.group} ${view.label} ${view.id}`.toLowerCase();
    listen(button, "click", (): void => options.select(view.id));
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
  listen(toggle, "click", (): void => collapse(!panel.hidden));
  listen(reset, "click", (): void => options.select(data.initial));
  return {
    highlight: (id: string): void => {
      if (disposed) return;
      for (const [key, button] of buttons)
        button.setAttribute("aria-current", String(key === id));
      const view: import("./tourData").TourView = data.views.find(
        (view: import("./tourData").TourView): boolean => view.id === id,
      )!;
      current.textContent = `${view.group} / ${view.label}`;
    },
    dispose: (): void => {
      if (disposed) {
        if (disposalFailure.length !== 0) throw disposalFailure[0];
        return;
      }
      disposed = true;
      try {
        runWebsiteCleanup([
          ...listeners.splice(0),
          (): void => list.replaceChildren(),
        ]);
      } catch (error) {
        disposalFailure.push(error);
        throw error;
      }
    },
  };
};
