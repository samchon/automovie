import type { IAutoMoviePreviewNavigation } from "./IAutoMoviePreviewNavigation";
import type { IAutoMoviePreviewNavigationItem } from "./IAutoMoviePreviewNavigationItem";

/**
 * Mounts navigation without owning the production's camera or identities. The returned disposer removes the panel and all of its event listeners.
 */
export const mountPreviewNavigation: (navigation: IAutoMoviePreviewNavigation) => (() => void) = (
  navigation: IAutoMoviePreviewNavigation,
): (() => void) => {
  const identities: Set<string> = new Set<string>();
  const entries: { search: string; id: string; label: string; group?: string; keywords?: readonly string[]; }[] = navigation.items.map((item: IAutoMoviePreviewNavigationItem) : { search: string; id: string; label: string; group?: string; keywords?: readonly string[]; } => {
    if (item.id.length === 0 || identities.has(item.id))
      throw new Error("Preview navigation requires unique, nonempty item IDs.");
    identities.add(item.id);
    return {
      ...item,
      search: [item.id, item.label, item.group ?? "", ...(item.keywords ?? [])]
        .join(" ")
        .normalize("NFKC")
        .toLowerCase(),
    };
  });
  const input: AbortController = new AbortController();
  const panel: HTMLElement = document.createElement("section");
  panel.id = "preview-navigation";
  panel.setAttribute("aria-label", "Scene navigation");
  const heading: HTMLDivElement = document.createElement("div");
  heading.className = "preview-navigation-heading";
  const title: HTMLElement = document.createElement("strong");
  title.textContent = "Scene navigation";
  const toggle: HTMLButtonElement = document.createElement("button");
  toggle.type = "button";
  toggle.textContent = "Collapse";
  toggle.setAttribute("aria-expanded", "true");
  toggle.setAttribute("aria-controls", "preview-navigation-content");
  heading.append(title, toggle);
  const content: HTMLDivElement = document.createElement("div");
  content.id = "preview-navigation-content";
  const searchLabel: HTMLLabelElement = document.createElement("label");
  searchLabel.textContent = "Search rooms, objects, or views";
  const search: HTMLInputElement = document.createElement("input");
  search.type = "search";
  search.placeholder = "Name, group, or keyword";
  search.autocomplete = "off";
  searchLabel.append(search);
  const selectLabel: HTMLLabelElement = document.createElement("label");
  selectLabel.textContent = "View";
  const select: HTMLSelectElement = document.createElement("select");
  selectLabel.append(select);
  const go: HTMLButtonElement = document.createElement("button");
  go.type = "button";
  go.textContent = "Go to view";
  const count: HTMLDivElement = document.createElement("div");
  count.className = "preview-navigation-count";
  count.setAttribute("role", "status");
  content.append(searchLabel, selectLabel, go, count);
  panel.append(heading, content);
  let selected: string = "";
  const refresh: () => void = (): void => {
    const terms: string[] = search.value
      .normalize("NFKC")
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const matches: { search: string; id: string; label: string; group?: string; keywords?: readonly string[]; }[] = entries.filter((item: { search: string; id: string; label: string; group?: string; keywords?: readonly string[]; }) : boolean =>
      terms.every((term: string) : boolean => item.search.includes(term)),
    );
    const placeholder: HTMLOptionElement = new Option(
      matches.length === 0 ? "No matching views" : "Choose a view",
      "",
    );
    placeholder.disabled = true;
    select.replaceChildren(placeholder);
    const groups: Map<string, HTMLOptGroupElement> = new Map<string, HTMLOptGroupElement>();
    for (const item of matches) {
      const option: HTMLOptionElement = new Option(item.label, item.id);
      if (item.group === undefined || item.group.length === 0)
        select.append(option);
      else {
        let group: HTMLOptGroupElement | undefined = groups.get(item.group);
        if (group === undefined) {
          group = document.createElement("optgroup");
          group.label = item.group;
          groups.set(item.group, group);
          select.append(group);
        }
        group.append(option);
      }
    }
    select.value = matches.some((item: { search: string; id: string; label: string; group?: string; keywords?: readonly string[]; }) : boolean => item.id === selected) ? selected : "";
    select.disabled = matches.length === 0;
    go.disabled = select.value.length === 0;
    count.textContent = `${matches.length} of ${entries.length} views`;
  };
  search.addEventListener("input", refresh, { signal: input.signal });
  select.addEventListener(
    "change",
    () : void => {
      selected = select.value;
      go.disabled = false;
      navigation.apply(selected);
    },
    { signal: input.signal },
  );
  go.addEventListener("click", () : void => navigation.apply(select.value), {
    signal: input.signal,
  });
  toggle.addEventListener(
    "click",
    () : void => {
      content.hidden = !content.hidden;
      toggle.textContent = content.hidden ? "Expand" : "Collapse";
      toggle.setAttribute("aria-expanded", String(!content.hidden));
    },
    { signal: input.signal },
  );
  refresh();
  document.body.append(panel);
  return () : void => {
    input.abort();
    panel.remove();
  };
};
