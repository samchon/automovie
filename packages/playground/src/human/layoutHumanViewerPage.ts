/**
 * Build the Human page's DOM with the classes `human.html` styles, and own its listeners.
 *
 * The page logic in `mountHumanViewerPage` owns state; this function only
 * creates elements, forwards control changes, renders links and the curve
 * list, and turns a click on the viewport (a press and release within four
 * pixels) into a curve pick, so every control stays reachable through the page
 * methods automation calls.
 *
 * @param root Element whose children are replaced.
 * @param cameras Camera names offered in the camera selector.
 * @returns Element references, updaters, a listener binder and a dispose that removes everything.
 *
 * @evidence contracts/common.md#principled-implementation Builds the DOM once with the classes human.html styles and turns a press/release within four pixels into a pick, so orbit drags never select curves.
 * @evidence contracts/common.md#clear-and-simple-design Owns elements and listeners only; mountHumanViewerPage owns all state and decisions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Controls call page methods; nothing here changes the model or URL directly.
 * @evidence contracts/common.md#meaningful-documentation States the ownership split and the click rule.
 * @evidence contracts/performance.md#efficient-algorithms O(cameras + aliases) elements at mount; the curve list holds one option per curve.
 * @evidence contracts/performance.md#reuse-equivalent-work The DOM is built once per page and updated in place.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One AbortController owns every listener; dispose aborts it and removes the DOM.
 */
export function layoutHumanViewerPage(
  root: HTMLElement,
  cameras: readonly string[],
): layoutHumanViewerPage.IHandles {
  const events: AbortController = new AbortController();
  const signal: AbortSignal = events.signal;
  const element: <K extends keyof HTMLElementTagNameMap>(
    tag: K,
    properties?: Partial<HTMLElementTagNameMap[K]>,
    ...children: (Node | string)[]
  ) => HTMLElementTagNameMap[K] = <K extends keyof HTMLElementTagNameMap>(
    tag: K,
    properties: Partial<HTMLElementTagNameMap[K]> = {},
    ...children: (Node | string)[]
  ): HTMLElementTagNameMap[K] => {
    const node: HTMLElementTagNameMap[K] = document.createElement(tag);
    Object.assign(node, properties);
    node.append(...children);
    return node;
  };
  const options: (values: readonly string[]) => HTMLOptionElement[] = (
    values: readonly string[],
  ): HTMLOptionElement[] =>
    values.map(
      (value: string): HTMLOptionElement =>
        element("option", { value, textContent: value }),
    );
  const button: (text: string, primary?: boolean) => HTMLButtonElement = (
    text: string,
    primary: boolean = false,
  ): HTMLButtonElement =>
    element("button", {
      className: primary ? "primary" : "",
      textContent: text,
      type: "button",
    });

  // Sidebar: input, curve selection, PNG links and model facts.
  const alias: HTMLSelectElement = element(
    "select",
    { id: "human-alias" },
    ...options(["f1", "f2", "m1", "m2"]),
  );
  const generate: HTMLButtonElement = button("생성", true);
  const curves: HTMLInputElement = element("input", {
    id: "human-curves",
    placeholder: "finger.left.*,trunk/7",
    spellcheck: false,
  });
  const apply: HTMLButtonElement = button("적용");
  const clear: HTMLButtonElement = button("해제");
  const list: HTMLSelectElement = element("select", {
    id: "human-curve-list",
    size: 10,
    multiple: true,
  });
  list.style.width = "100%";
  const png: HTMLAnchorElement = element("a", {
    className: "human-link",
    textContent: "PNG 열기",
    target: "_blank",
  });
  const copy: HTMLButtonElement = button("PNG URL 복사");
  const model: HTMLAnchorElement = element("a", {
    className: "human-link",
    textContent: "모델 JSON",
    target: "_blank",
  });
  const diagram: HTMLAnchorElement = element("a", {
    className: "human-link",
    textContent: "곡선 도면",
    target: "_blank",
  });
  const pngPath: HTMLElement = element("code", { id: "human-png-path" });
  const state: HTMLElement = element("code", { id: "human-state" });
  const parameters: HTMLElement = element("code", { id: "human-parameters" });
  const section: (title: string, ...children: Node[]) => HTMLElement = (
    title: string,
    ...children: Node[]
  ): HTMLElement =>
    element(
      "section",
      { className: "human-section" },
      element("h2", { textContent: title }),
      ...children,
    );
  const sidebar: HTMLElement = element(
    "aside",
    { className: "human-sidebar" },
    element("h1", { textContent: "AutoMovie Human" }),
    element("p", {
      className: "human-muted",
      textContent:
        "AutoMovieHuman.generate 결과를 표시합니다. PNG 서비스도 이 페이지의 같은 장면, 카메라, 조명으로 그립니다.",
    }),
    section(
      "입력",
      element("div", { className: "human-row" }, alias, generate),
    ),
    section(
      "로프팅 곡선 선택",
      element("p", {
        className: "human-muted",
        textContent:
          "쉼표로 구분한 곡선 id와 * 패턴. 목록에서 고르거나 overlay/construction 패스에서 곡선을 클릭하면 추가됩니다.",
      }),
      element("div", { className: "human-row" }, curves, apply, clear),
      list,
    ),
    section(
      "PNG 서비스",
      element("div", { className: "human-row" }, png, copy, model, diagram),
      pngPath,
    ),
    section("모델", state),
    element(
      "section",
      { className: "human-section" },
      element(
        "details",
        {},
        element("summary", { textContent: "파라미터" }),
        parameters,
      ),
    ),
  );

  // Main column: pass and camera toolbar, viewport, status line.
  const pass: HTMLSelectElement = element(
    "select",
    { id: "human-pass" },
    element("option", { value: "surface", textContent: "surface (피부)" }),
    element("option", {
      value: "overlay",
      textContent: "overlay (피부 + 로프팅 곡선)",
    }),
    element("option", {
      value: "construction",
      textContent: "construction (로프팅 곡선)",
    }),
  );
  const legend: HTMLElement = element("span", { className: "human-muted" });
  legend.style.display = "flex";
  legend.style.gap = "12px";

  const camera: HTMLSelectElement = element(
    "select",
    { id: "human-camera" },
    ...options(cameras),
  );
  const canvas: HTMLCanvasElement = element("canvas");
  const emptyDetail: HTMLParagraphElement = element("p", {
    id: "human-empty-detail",
  });
  const empty: HTMLDivElement = element(
    "div",
    { id: "human-empty" },
    element("strong", { textContent: "표시할 Human 모델이 없습니다" }),
    emptyDetail,
  );
  const status: HTMLParagraphElement = element("p", {
    id: "human-status",
    role: "status",
  });
  const toolbar: HTMLDivElement = element(
    "div",
    { className: "human-toolbar" },
    element("label", {}, "패스", pass),
    element("label", {}, "카메라", camera),
    legend,
  );
  const main: HTMLDivElement = element(
    "div",
    { className: "human-main" },
    toolbar,
    element("div", { id: "human-viewport" }, canvas, empty),
    status,
  );
  root.replaceChildren(sidebar, main);

  const initial: string | null = new URL(location.href).searchParams.get(
    "alias",
  );
  if (initial !== null) alias.value = initial;

  return {
    canvas,
    status,
    empty,
    emptyDetail,
    state,
    parameters,
    camera,
    toolbar,
    setPassAvailability: (construction: boolean, value: string): void => {
      for (const option of pass.options)
        option.disabled = !construction && option.value !== "surface";
      pass.value = value;
    },
    setLinks: (
      name: string | null,
      view: string,
      value: string,
      selection: string,
      free: string,
      curve: string | null,
    ): void => {
      diagram.removeAttribute("href");
      if (name === null) {
        png.removeAttribute("href");
        model.removeAttribute("href");
        pngPath.textContent = "";
        return;
      }
      const query: string = [selection, free]
        .filter((part: string): boolean => part !== "")
        .join("&");
      const image: string =
        "/human-images/" +
        name +
        "/" +
        view +
        "." +
        value +
        ".png" +
        (query === "" ? "" : "?" + query);
      png.href = image;
      model.href = "/human-images/" + name + ".model.json";
      pngPath.textContent = image;
      if (curve !== null && selection !== "")
        diagram.href = "/human-curves/" + name + ".png?" + selection;
    },
    setLegend: (
      colours: { axis: string | null; section: string | null },
      selection: ReadonlyArray<{ id: string; colour: string }>,
    ): void => {
      const entries: Array<[string, string | null]> = [
        ["중심축 (axis)", colours.axis],
        ["단면 (section)", colours.section],
        ...selection.map(
          (entry: { id: string; colour: string }): [string, string] => [
            entry.id,
            entry.colour,
          ],
        ),
      ];
      legend.style.flexWrap = "wrap";
      legend.replaceChildren(
        ...entries
          .filter(
            ([, colour]: [string, string | null]): boolean => colour !== null,
          )
          .map(([label, colour]: [string, string | null]): HTMLElement => {
            const swatch: HTMLElement = element("span", { textContent: "■ " });
            swatch.style.color = colour!;
            return element("span", {}, swatch, label);
          }),
      );
    },
    setCurves: (ids: readonly string[], selection: string): void => {
      curves.value = selection;
      if (list.options.length !== ids.length)
        list.replaceChildren(...options(ids));
    },
    listen: (handlers: layoutHumanViewerPage.IHandlers): void => {
      generate.addEventListener(
        "click",
        (): void => handlers.alias(alias.value),
        { signal },
      );
      pass.addEventListener("change", (): void => handlers.pass(pass.value), {
        signal,
      });
      camera.addEventListener(
        "change",
        (): void => handlers.camera(camera.value),
        { signal },
      );
      apply.addEventListener(
        "click",
        (): void => handlers.curves(curves.value),
        { signal },
      );
      curves.addEventListener(
        "keydown",
        (event: KeyboardEvent): void => {
          if (event.key === "Enter") handlers.curves(curves.value);
        },
        { signal },
      );
      clear.addEventListener("click", (): void => handlers.curves(""), {
        signal,
      });

      // Choosing ids in the list replaces the selection with them.
      list.addEventListener(
        "change",
        (): void =>
          handlers.curves(
            [...list.selectedOptions]
              .map((option: HTMLOptionElement): string => option.value)
              .join(","),
          ),
        { signal },
      );
      copy.addEventListener(
        "click",
        (): void => {
          if (png.href !== "")
            void navigator.clipboard.writeText(png.href).catch(console.error);
        },
        { signal },
      );

      // A click without a drag toggles the curve under the pointer.
      let pressed: { x: number; y: number } | undefined;
      canvas.addEventListener(
        "pointerdown",
        (event: PointerEvent): void => {
          pressed = { x: event.clientX, y: event.clientY };
        },
        { signal },
      );
      canvas.addEventListener(
        "pointerup",
        (event: PointerEvent): void => {
          if (
            pressed === undefined ||
            Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) > 4
          )
            return;
          const box: DOMRect = canvas.getBoundingClientRect();
          const id: string | null = handlers.pick(
            ((event.clientX - box.left) / box.width) * 2 - 1,
            -((event.clientY - box.top) / box.height) * 2 + 1,
          );
          if (id === null) return;
          const chosen: string[] = curves.value
            .split(",")
            .map((text: string): string => text.trim())
            .filter((text: string): boolean => text !== "");
          handlers.curves(
            (chosen.includes(id)
              ? chosen.filter((text: string): boolean => text !== id)
              : [...chosen, id]
            ).join(","),
          );
        },
        { signal },
      );
    },
    dispose: (): void => {
      events.abort();
      root.replaceChildren();
    },
  };
}

/**
 * Types of the Human page layout's handles and control callbacks.
 *
 * @evidence contracts/common.md#principled-implementation The handles expose exactly the elements and updaters mountHumanViewerPage uses, and the callbacks carry raw control values the page validates.
 * @evidence contracts/common.md#clear-and-simple-design Groups the layout's two contracts under the function they belong to.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Callbacks pass raw values; no validation is duplicated in the layout.
 * @evidence contracts/common.md#meaningful-documentation Each member states its role.
 * @evidence contracts/performance.md#efficient-algorithms Types only; no runtime cost.
 * @evidence contracts/performance.md#reuse-equivalent-work One handle record serves the page for its whole life.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Types only; the layout's dispose owns listener release.
 */
export namespace layoutHumanViewerPage {
  /** Element references and updaters returned to the page. */
  export interface IHandles {
    /** Canvas the renderer draws into. */
    canvas: HTMLCanvasElement;

    /** Status line. */
    status: HTMLParagraphElement;

    /** Overlay shown while no model is displayed. */
    empty: HTMLDivElement;

    /** Failure detail inside the empty overlay. */
    emptyDetail: HTMLParagraphElement;

    /** Model facts block. */
    state: HTMLElement;

    /** Parameter JSON block. */
    parameters: HTMLElement;

    /** Camera selector, set by the page when the camera changes. */
    camera: HTMLSelectElement;

    /** Enable overlay/construction only when the model has construction, and show the pass. */
    setPassAvailability: (construction: boolean, pass: string) => void;

    /** Point the PNG, model and curve-diagram links at the current alias, camera, pass, curves query (`curves=a&curves=b`) and free view; `curve` non-null enables the diagram link. */
    setLinks: (
      alias: string | null,
      camera: string,
      pass: string,
      curves: string,
      free: string,
      curve: string | null,
    ) => void;

    /** Toolbar the page appends its free-view controls to. */
    toolbar: HTMLDivElement;

    /** Show the legend swatches; a null colour omits its entry. */
    setLegend: (
      colours: { axis: string | null; section: string | null },
      selection: ReadonlyArray<{ id: string; colour: string }>,
    ) => void;

    /** Show the model's curve ids and the canonical selection. */
    setCurves: (ids: readonly string[], curves: string) => void;

    /** Bind control handlers once; dispose removes them. */
    listen: (handlers: IHandlers) => void;

    /** Remove listeners and the page DOM. */
    dispose: () => void;
  }

  /** Callbacks from the controls to the page. */
  export interface IHandlers {
    /** Generate the chosen alias. */
    alias: (alias: string) => void;

    /** Switch pass. */
    pass: (pass: string) => void;

    /** Move to a named camera. */
    camera: (camera: string) => void;

    /** Replace the curve selection with a raw comma list. */
    curves: (curves: string) => void;

    /** Curve id under a normalized device coordinate, or null. */
    pick: (x: number, y: number) => string | null;
  }
}
