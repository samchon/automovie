/**
 * The navigation bar and part list of `/view`. The address in the page hash is committed navigation state: controls show the observed displayed address, while consecutive clicks compose fields with the latest pending intent. Only that intent's terminal acknowledgment returns composition to the observed address. Reload, back and pasted links use committed navigation. Choosing another document clears the part sets, whose names belong to the old document. The `/render` and `/sheet` links are built from the same address and therefore draw what the viewport shows.
 */
import type { IHumanCaptureCamera } from "@automovie/viewer/human/common/observation/IHumanCaptureCamera";
import type { HumanViewerAddress } from "@automovie/viewer/human/inspection/HumanViewerAddress";
import type { HumanViewerCatalogue } from "@automovie/viewer/human/inspection/HumanViewerCatalogue";
import type { IHumanViewerReferenceInfo } from "@automovie/viewer/human/inspection/IHumanViewerReferenceInfo";
import type { IHumanViewerIndexEntry } from "./IHumanViewerIndexEntry";
import { changeHumanViewerParts } from "./changeHumanViewerParts";
import { describeHumanViewerDocuments } from "./describeHumanViewerDocuments";
import { describeHumanViewerPass } from "@automovie/viewer/human/inspection/describeHumanViewerPass";
import { humanViewerChoices } from "@automovie/viewer/human/inspection/humanViewerChoices";
import { humanViewerLightDocuments } from "./humanViewerLightDocuments";
import { humanViewerPhotoLook } from "./humanViewerPhotoLook";
import { mountHumanViewerLightControls } from "./mountHumanViewerLightControls";
import { neighbourHumanViewerDocument } from "./neighbourHumanViewerDocument";
import { openHumanViewerHref } from "@automovie/viewer/human/inspection/openHumanViewerHref";

const element: <T extends HTMLElement>(id: string) => T = <T extends HTMLElement>(id: string): T =>
  document.querySelector<T>("#" + id)!;
/**
 * Bind ordinary controls to the caller's navigation transaction, displaying only acknowledged address/parts while newer gestures compose with the latest pending intent. Numerical documents and completed frames remain downstream. The supplied navigation owner reports refusals; this mount releases pending composition on that intent's terminal settlement and prevents unhandled rejection. Close withdraws composition, detaches owned event listeners and closes the light form while preserving caller-owned DOM.
 *
 * @evidence contracts/common.md#principled-implementation Controls compose over the latest pending address until its own terminal acknowledgment, while shown controls and capture links read the observed committed address; document changes clear old mesh selections.
 * @evidence contracts/common.md#clear-and-simple-design Navigation composition and DOM presentation stay in this mount, light parsing remains its child form owner, and actual display/admission/refusal belongs to the supplied host transaction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Pending gestures are not treated as committed display, failed navigation is reported by the host rather than an invented successful address, and exact reported mesh names are preserved.
 * @evidence contracts/common.md#meaningful-documentation The comment states pending-versus-observed address ownership, terminal acknowledgment, capture links, document-specific mesh invalidation, refusal owner and listener-only closure.
 * @evidence contracts/performance.md#efficient-algorithms Catalogue replacement scans n entries to create grouped options, and part redraw scans p names against w search words before creating a matching rows; show reads current options and selected mesh memberships, with DOM cost retained in those paths rather than numerical geometry work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This mount coordinates authored display effects rather than numerical result reuse; one pending composition key is retained until its matching terminal acknowledgment and source catalogue replacement rebuilds navigation metadata.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The mount retains one current and pending address plus catalogue ids and reported names; row replacement releases old listeners, and close aborts static/row listener ownership, withdraws pending composition and closes child lighting. In-flight navigation tasks remain host-owned until settlement.
 */
export function mountHumanViewerControls(props: {
  /** Submit the composed display address; settlement acknowledges this intent, while the host reports any refusal. */
  navigate: (address: HumanViewerAddress) => Promise<void>;
}): {
  /** Route an address through the same pending-intent composition as control gestures. */
  navigate: (address: HumanViewerAddress) => void;

  /** Replace document choices and light-capability ids from current catalogue authority. */
  catalogue: (catalogue: HumanViewerCatalogue) => void;

  /** Reflect observed address and exact mesh names without declaring pending gestures committed. */
  show: (address: HumanViewerAddress, parts: readonly string[]) => void;

  /** Show optional local-photo comparison metadata without changing numerical documents. */
  photo: (info: Pick<IHumanViewerReferenceInfo, "available" | "camera">) => void;

  /** Detach owned control events and withdraw pending composition while preserving caller DOM. */
  close: () => void;
} {
  const listeners: AbortController = new AbortController();
  const rowListeners: AbortController[] = [];
  let closed: boolean = false;
  let photoCamera: IHumanCaptureCamera | null = null;
  let current: HumanViewerAddress | null = null;
  // Display acknowledgments can arrive while a newer gesture is still pending.
  // Subsequent controls compose with the latest requested intent; only its own
  // terminal acknowledgment releases that intent back to observed display state.
  let requested: HumanViewerAddress | null = null;
  let requestVersion: number = 0;
  const navigate: (address: HumanViewerAddress) => void = (address: HumanViewerAddress): void => {
    if (closed) return;
    requested = address;
    const version: number = ++requestVersion;
    void props.navigate(address).finally((): void => {
      if (version === requestVersion) requested = null;
    }).catch((): undefined => undefined);
  };
  let ids: string[] = [];
  let names: string[] = [];
  let lightDocuments: Set<string> = new Set();
  const doc: HTMLSelectElement = element<HTMLSelectElement>("doc");
  const pass: HTMLSelectElement = element<HTMLSelectElement>("pass");
  const size: HTMLSelectElement = element<HTMLSelectElement>("size");
  const pitch: HTMLInputElement = element<HTMLInputElement>("pitch");
  const zoom: HTMLInputElement = element<HTMLInputElement>("zoom");
  const ao: HTMLInputElement = element<HTMLInputElement>("ao");
  const filter: HTMLInputElement = element<HTMLInputElement>("part-filter");
  const list: HTMLDivElement = element<HTMLDivElement>("part-list");
  const views: HTMLElement = element<HTMLElement>("views");
  const change: (fields: Partial<HumanViewerAddress>) => void = (fields: Partial<HumanViewerAddress>): void => {
    const base: HumanViewerAddress | null = requested ?? current;
    if (base !== null) navigate({ ...base, ...fields });
  };
  const lighting: ReturnType<typeof mountHumanViewerLightControls> = mountHumanViewerLightControls({
    form: element<HTMLFormElement>("light-controls"),
    name: element<HTMLSelectElement>("light-name"),
    components: [
      element<HTMLInputElement>("light-x"),
      element<HTMLInputElement>("light-y"),
      element<HTMLInputElement>("light-z"),
    ],
    reset: element<HTMLButtonElement>("light-reset"),
    error: element<HTMLElement>("light-error"),
    navigate: (light: HumanViewerAddress["light"]): void => change({ light }),
  });
  for (const view of humanViewerChoices.views) {
    const button: HTMLButtonElement = document.createElement("button");
    button.dataset.view = view;
    button.textContent = view.replace("-three-quarter", " 3/4");
    button.addEventListener("click", (): void => change({ view, look: null }), { signal: listeners.signal });
    views.append(button);
  }
  for (const name of humanViewerChoices.passes) {
    const option: HTMLOptionElement = new Option(name, name);
    option.title = describeHumanViewerPass(name);
    pass.append(option);
  }
  doc.addEventListener("change", (): void =>
    change({ doc: doc.value, parts: [], hide: [], frame: null, light: null, look: null }),
    { signal: listeners.signal },
  );
  for (const [id, step] of [
    ["prev", -1],
    ["next", 1],
  ] as const)
    element(id).addEventListener("click", (): void => {
      const base: HumanViewerAddress | null = requested ?? current;
      if (base !== null && ids.length !== 0)
        change({
          doc: neighbourHumanViewerDocument(ids, base.doc, step),
          parts: [],
          hide: [],
          frame: null,
          light: null,
          look: null,
        });
    }, { signal: listeners.signal });
  pass.addEventListener("change", (): void =>
    change({ pass: pass.value as HumanViewerAddress["pass"] }),
    { signal: listeners.signal },
  );
  size.addEventListener("change", (): void => change({ size: Number(size.value) }), { signal: listeners.signal });
  ao.addEventListener("change", (): void => change({ ao: ao.checked }), { signal: listeners.signal });
  // A slider moves continuously: it shows its number while it moves and
  // navigates when it is released.
  pitch.addEventListener("input", (): void => {
    element("pitch-out").textContent = pitch.value + " deg";
  }, { signal: listeners.signal });
  pitch.addEventListener("change", (): void =>
    change({ pitch: Number(pitch.value), look: null }),
    { signal: listeners.signal },
  );
  zoom.addEventListener("input", (): void => {
    element("zoom-out").textContent = Number(zoom.value).toFixed(2) + "x";
  }, { signal: listeners.signal });
  zoom.addEventListener("change", (): void => change({ zoom: Number(zoom.value), look: null }), { signal: listeners.signal });
  const ref: HTMLSelectElement = element<HTMLSelectElement>("ref");
  const mix: HTMLInputElement = element<HTMLInputElement>("opacity");
  const against: HTMLSelectElement = element<HTMLSelectElement>("against");
  ref.addEventListener("change", (): void =>
    change({ ref: (ref.value || null) as HumanViewerAddress["ref"] }),
    { signal: listeners.signal },
  );
  mix.addEventListener("change", (): void => change({ opacity: Number(mix.value) }), { signal: listeners.signal });
  element("photo-camera").addEventListener("click", (): void => {
    if (photoCamera !== null)
      change({ look: humanViewerPhotoLook(photoCamera), frame: null });
  }, { signal: listeners.signal });
  const landmarks: HTMLInputElement = element<HTMLInputElement>("landmarks-toggle");
  landmarks.addEventListener("change", (): void =>
    change({ landmarks: landmarks.checked }),
    { signal: listeners.signal },
  );
  against.addEventListener("change", (): void => {
    const link: HTMLAnchorElement = element<HTMLAnchorElement>("compare-link");
    link.hidden = against.value === "";
    if (current !== null && against.value !== "")
      link.href =
        openHumanViewerHref(current.doc, current).render.replace(
          "/render?",
          "/compare?",
        ) +
        "&against=" +
        encodeURIComponent(against.value);
  }, { signal: listeners.signal });
  element("part-reset").addEventListener("click", (): void =>
    change({ parts: [], hide: [], look: null }),
    { signal: listeners.signal },
  );
  filter.addEventListener("input", (): void => draw(), { signal: listeners.signal });
  for (const [id, target] of [
    ["copy-render", "render-link"],
    ["copy-sheet", "sheet-link"],
  ] as const)
    element(id).addEventListener("click", (): void => {
      const href: string = element<HTMLAnchorElement>(target).href;
      void navigator.clipboard?.writeText(href).catch((): void => {});
    }, { signal: listeners.signal });

  function draw(): void {
    if (closed) return;
    for (const owner of rowListeners.splice(0)) owner.abort();
    const rowOwner: AbortController = new AbortController();
    rowListeners.push(rowOwner);
    const words: string[] = filter.value
      .toLowerCase()
      .split(/\s+/)
      .filter((word: string): boolean => word !== "");
    const shown: string[] = names.filter((name: string): boolean =>
      words.every((word: string): boolean => name.toLowerCase().includes(word)),
    );
    element("part-count").textContent =
      `${shown.length} of ${names.length} parts`;
    list.replaceChildren();
    for (const name of shown) {
      const row: HTMLDivElement = document.createElement("div");
      row.className = "part";
      const label: HTMLSpanElement = document.createElement("span");
      label.textContent = name;
      label.title = name;
      row.append(label);
      for (const [set, text] of [
        ["parts", "only"],
        ["hide", "hide"],
      ] as const) {
        const box: HTMLInputElement = document.createElement("input");
        box.type = "checkbox";
        box.checked = current?.[set].includes(name) ?? false;
        box.addEventListener("change", (): void => {
          const base: HumanViewerAddress | null = requested ?? current;
          if (base !== null)
            navigate(
              { ...changeHumanViewerParts(base, name, set, box.checked), look: set === "parts" ? null : base.look },
            );
        }, { signal: rowOwner.signal });
        const wrapper: HTMLLabelElement = document.createElement("label");
        wrapper.append(box, text);
        row.append(wrapper);
      }
      list.append(row);
    }
  }
  return {
    close: (): void => {
      if (closed) return;
      closed = true;
      ++requestVersion;
      requested = null;
      current = null;
      photoCamera = null;
      ids = [];
      names = [];
      lightDocuments.clear();
      listeners.abort();
      for (const owner of rowListeners.splice(0)) owner.abort();
      lighting.close();
    },
    /** Route an address entry through the same pending-intent owner as controls. */
    navigate,
    /** Rebuild the document list from a fresh catalogue. */
    catalogue: (catalogue: HumanViewerCatalogue): void => {
      if (closed) return;
      lightDocuments = humanViewerLightDocuments(catalogue.documents);
      const entries: IHumanViewerIndexEntry[] = describeHumanViewerDocuments(catalogue);
      ids = entries.map((entry: IHumanViewerIndexEntry): string => entry.id);
      doc.replaceChildren();
      against.replaceChildren(new Option("difference against...", ""));
      for (const entry of entries)
        against.append(new Option(entry.label, entry.id));
      const groups: Map<string, HTMLOptGroupElement> = new Map();
      for (const entry of entries) {
        let group: HTMLOptGroupElement | undefined = groups.get(entry.section);
        if (group === undefined) {
          group = document.createElement("optgroup");
          group.label = entry.section;
          groups.set(entry.section, group);
          doc.append(group);
        }
        group.append(new Option(entry.label, entry.id));
      }
    },

    /** Show the displayed address and the meshes the viewport reports. */
    show: (address: HumanViewerAddress, parts: readonly string[]): void => {
      if (closed) return;
      current = address;
      lighting.show(address.light ?? null, lightDocuments.has(address.doc));
      if (!ids.includes(address.doc))
        doc.append(new Option(address.doc, address.doc));
      doc.value = address.doc;
      pass.value = address.pass;
      if (
        ![...size.options].some(
          (option: HTMLOptionElement): boolean => option.value === String(address.size),
        )
      )
        size.append(new Option(String(address.size), String(address.size)));
      size.value = String(address.size);
      pitch.value = String(address.pitch);
      zoom.value = String(address.zoom);
      ao.checked = address.ao;
      landmarks.checked = address.landmarks;
      element("pitch-out").textContent = address.pitch + " deg";
      element("zoom-out").textContent = address.zoom.toFixed(2) + "x";
      for (const button of views.querySelectorAll<HTMLButtonElement>("button"))
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.view === address.view),
        );
      const hrefs: ReturnType<typeof openHumanViewerHref> = openHumanViewerHref(address.doc, address);
      element<HTMLAnchorElement>("render-link").href = hrefs.render;
      element<HTMLAnchorElement>("sheet-link").href = hrefs.sheet;
      names = [...parts];
      draw();
      ref.value = address.ref ?? "";
      mix.value = String(address.opacity);
    },

    /** Show the photograph controls when a local photograph exists, else hide them silently. */
    photo: (info: Pick<IHumanViewerReferenceInfo, "available" | "camera">): void => {
      if (closed) return;
      photoCamera = info.camera;
      element("photo").hidden = !info.available;
      element<HTMLButtonElement>("photo-camera").disabled =
        info.camera === null;
    },
  };
}
