import { HUMAN_DEBUG_CAMERAS } from "../contracts/HUMAN_DEBUG_CAMERAS";
import { HumanDebugOptions } from "../contracts/HumanDebugOptions";
import { HumanDebugPattern } from "../contracts/HumanDebugPattern";
import type { IHumanDebugOptions } from "../contracts/IHumanDebugOptions";
import { HumanDebugPeople } from "../people/HumanDebugPeople";
import { HUMAN_DEBUG_PIECES } from "../pieces/HUMAN_DEBUG_PIECES";
import type { IHumanDebugPiece } from "../pieces/IHumanDebugPiece";

/**
 * The page's sidebar: every option as a control, each change handed back as new options.
 *
 * The controls never draw. Fields write the current options as URL text, replace one variable
 * and parse through `HumanDebugOptions`; row selections compose typed lists directly. Each event
 * stores its copied intent before handing it to the page, independently of pending draws.
 * The person and piece menus list the people registry and the piece registry
 * (each registered argument as its own entry), and the pose menu the whole figure's poses. A part or curve toggled in the lists is added to or
 * removed from `hide`/`curveHide` by its exact id, so broad `parts`/`curves` patterns stay readable.
 * {@link show} sets every control from options without reporting a change.
 *
 * @evidence contracts/common.md#principled-implementation Changes compose from copied latest intent before asynchronous page work; request revisions prevent older completed frames from overwriting newer selections.
 * @evidence contracts/common.md#clear-and-simple-design Owns requested sidebar state and DOM only; mount owns actual drawn options and ordered execution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses real parser and DOM events without dropping overlapping input or substituting a subject.
 * @evidence contracts/common.md#meaningful-documentation Describes URL parsing, exact visibility ids and the distinction between requested intent and completed state.
 * @evidence contracts/performance.md#efficient-algorithms An event copies O(P) option data; show visits existing fields and inventory rows, with pattern matching at each row.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the existing sidebar DOM and latest intent; distinct requests retain their separate page operations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains one current option record, one revision and DOM proportional to the current inventory; list replaces earlier rows without storing request history.
 */
export class HumanDebugControls {
  private readonly fields: Map<keyof IHumanDebugOptions, HTMLInputElement | HTMLSelectElement> = new Map();
  private readonly parts: HTMLDivElement = document.createElement("div");
  private readonly curves: HTMLDivElement = document.createElement("div");
  /** Latest requested intent, including changes whose page jobs have not drawn yet. */
  private options: IHumanDebugOptions = HumanDebugOptions.defaults();
  /** Latest admitted intent's monotonic revision; an older drawn completion cannot acknowledge it. */
  private revision: number = 0;
  /** Publishes each change only after storing its copied intent, so the next event composes from it. */
  private readonly changed: (options: IHumanDebugOptions, notices: string[]) => void;

  /**
   * Build the controls into a container.
   *
   * @param root Sidebar element the controls are appended to.
   * @param changed Receives every next options record and the notices of a rejected value.
   */
  public constructor(
    root: HTMLElement,
    changed: (options: IHumanDebugOptions, notices: string[]) => void,
  ) {
    this.changed = (next: IHumanDebugOptions, notices: string[]): void => {
      this.options = structuredClone(next);
      changed(next, notices);
    };
    const subject: HTMLFieldSetElement = this.group(root, "대상");
    this.select(subject, "person", "사람", HumanDebugPeople.aliases());
    this.select(subject, "piece", "조각 (비우면 전신)", [
      "",
      ...HUMAN_DEBUG_PIECES.flatMap((piece: IHumanDebugPiece): string[] =>
        piece.arguments.length === 0 ? [piece.name] : piece.arguments.map((argument: string): string => piece.name + ":" + argument),
      ),
    ]);
    this.text(subject, "piece", "조각 직접 입력");
    this.select(subject, "pose", "자세 (전신)", HumanDebugOptions.POSES);

    const view: HTMLFieldSetElement = this.group(root, "보기");
    this.select(view, "camera", "카메라", Object.keys(HUMAN_DEBUG_CAMERAS));
    for (const [name, text] of [["az", "방위각°"], ["el", "고도각°"], ["dist", "거리 mm"], ["fov", "시야각°"]] as const)
      this.number(view, name, text);
    this.text(view, "target", "목표 x,y,z mm");
    this.text(view, "focus", "근접 부위 패턴");
    this.flag(view, "ortho", "직교 투영");
    this.select(view, "shade", "음영", ["appearance", "clay", "normals", "curvature"]);
    this.select(view, "light", "조명", ["reference", "raking"]);
    this.select(view, "lightSide", "사광 방향", ["left", "right", "top", "bottom"]);
    this.number(view, "lightEl", "사광 고도°");
    this.number(view, "opacity", "표면 불투명도");
    this.flag(view, "wire", "와이어프레임");
    this.flag(view, "normals", "법선 표시");
    this.number(view, "normalLength", "법선 길이 mm");
    this.select(view, "section", "단면 축", ["none", "x", "y", "z"]);
    this.number(view, "sectionAt", "단면 위치 mm");
    this.flag(view, "sectionFlip", "단면 반대쪽");
    this.colour(view, "bg", "배경");
    this.number(view, "w", "캔버스 폭 px (0 채움)");
    this.number(view, "h", "캔버스 높이 px (0 채움)");
    this.flag(view, "axes", "좌표축");

    const curves: HTMLFieldSetElement = this.group(root, "곡선");
    this.text(curves, "curves", "보일 곡선 패턴");
    this.text(curves, "kinds", "종류 (section,axis,guide,path)");
    this.number(curves, "curveWidth", "기본 반지름 mm");
    this.select(curves, "labels", "라벨", ["0", "1", "marked"]);
    this.flag(curves, "xray", "표면 너머로 보기");
    curves.append(this.curves);

    const parts: HTMLFieldSetElement = this.group(root, "부위");
    this.text(parts, "parts", "보일 부위 패턴");
    this.text(parts, "hide", "숨길 부위 패턴");
    parts.append(this.parts);
  }

  /**
   * Fill the part and curve lists for a newly loaded subject.
   *
   * @param parts Part ids in subject order.
   * @param curves Curve ids in subject order.
   */
  public list(parts: readonly string[], curves: readonly string[]): void {
    this.parts.replaceChildren(...parts.map((id: string): HTMLElement => this.row(id, "human.skin.", "hide", "partColor")));

    // Curves are grouped by chain and collapsed, so a hundred guides do not bury the parts; the
    // chain's own box toggles every curve of the chain at once.
    const chains: Map<string, string[]> = new Map();
    for (const id of curves) {
      const chain: string = id.slice("human.construction.".length, id.lastIndexOf("/"));
      chains.set(chain, [...(chains.get(chain) ?? []), id]);
    }
    this.curves.replaceChildren(
      ...[...chains].map(([chain, ids]: [string, string[]]): HTMLElement => {
        const details: HTMLDetailsElement = document.createElement("details");
        const summary: HTMLElement = document.createElement("summary");
        summary.append(this.row("human.construction." + chain + "/*", "human.construction.", "curveHide", "curveColor"));
        summary.append(" (" + ids.length + ")");
        details.append(summary, ...ids.map((id: string): HTMLElement => this.row(id, "human.construction.", "curveHide", "curveColor")));
        return details;
      }),
    );
    this.show(this.options);
  }

  /**
   * Admit a full requested intent before asynchronous page work starts.
   *
   * @evidence contracts/common.md#principled-implementation Copies the actual next options and assigns a monotonic request revision; later changes derive from this intent rather than an older drawn frame.
   * @evidence contracts/common.md#clear-and-simple-design Requested controls and actual page state have separate owners; show can acknowledge only its own current revision.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Drops no input and disables no sidebar control to conceal overlap.
   * @evidence contracts/common.md#meaningful-documentation Names admission time, copied ownership and completion revision.
   * @evidence contracts/performance.md#efficient-algorithms One O(P) typed-option copy per admitted request.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Distinct user intents remain distinct requests.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains one latest option record and one counter; earlier requests remain owned by the page tail.
   */
  public request(options: IHumanDebugOptions): number {
    this.options = structuredClone(options);
    return ++this.revision;
  }

  /**
   * Copy the latest admitted intent, including selections whose draw is still pending.
   *
   * @evidence contracts/common.md#principled-implementation Copies the typed plain options so a caller cannot mutate the state from which the next DOM event composes.
   * @evidence contracts/common.md#clear-and-simple-design Exposes requested intent without exposing the private live record or claiming it has drawn.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads actual current intent rather than reconstructing it from an older page result.
   * @evidence contracts/common.md#meaningful-documentation States copied ownership and pending-draw meaning.
   * @evidence contracts/performance.md#efficient-algorithms Copies O(P) option data once for the caller.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The current intent is mutable; a caller receives its own observation instead of a cached alias.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the fresh result; this read retains no history or additional DOM.
   */
  public requested(): IHumanDebugOptions {
    return structuredClone(this.options);
  }

  /**
   * Render controls without rolling a newer intent back to an older completed frame.
   *
   * @param options The completed page options.
   * @param revision That operation's admission revision; an unversioned inventory refresh keeps current intent.
   *
   * @evidence contracts/common.md#principled-implementation A matching revision may acknowledge its completed options; older completions render the latest requested values instead.
   * @evidence contracts/common.md#clear-and-simple-design Only the page owns drawn state; this method presents current requested sidebar state without emitting another change.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither matching equal values nor an older completion can discard a newer revision.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes completion acknowledgment from an unversioned list refresh.
   * @evidence contracts/performance.md#efficient-algorithms Copies current completed options only on acknowledgment, then visits existing fields and rows.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the current DOM controls; no source or geometry is rebuilt here.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Keeps only the latest requested record and existing DOM; no completion history is retained.
   */
  public show(options: IHumanDebugOptions, revision?: number): void {
    if (revision === this.revision || this.revision === 0) this.options = structuredClone(options);
    options = this.options;
    const text: URLSearchParams = new URLSearchParams(HumanDebugOptions.write(options));
    for (const [name, field] of this.fields) {
      const value: unknown = options[name];
      if (field instanceof HTMLInputElement && field.type === "checkbox") field.checked = value === true;
      else if (field instanceof HTMLInputElement && field.type === "color") field.value = "#" + String(value);
      // A null option is its default, which is each menu's first entry: the first person, the whole figure.
      else if (field instanceof HTMLSelectElement && value === null) field.selectedIndex = 0;
      else field.value = text.get(name) ?? (value === null ? "" : typeof value === "object" ? "" : String(value));
    }
    for (const row of [
      ...this.parts.querySelectorAll<HTMLElement>("[data-id]"),
      ...this.curves.querySelectorAll<HTMLElement>("[data-id]"),
    ]) {
      const id: string = row.dataset.id!;
      const curve: boolean = id.startsWith("human.construction.");
      const prefix: string = curve ? "human.construction." : "human.skin.";
      const visible: boolean = curve
        ? options.kinds.includes(HumanDebugOptions.kind(id)) &&
          HumanDebugPattern.matches(id, options.curves, prefix) &&
          !HumanDebugPattern.matches(id, options.curveHide, prefix)
        : HumanDebugPattern.matches(id, options.parts, prefix) && !HumanDebugPattern.matches(id, options.hide, prefix);
      row.querySelector<HTMLInputElement>("input[type=checkbox]")!.checked = visible;
      const colour: string | undefined = HumanDebugPattern.last(id, curve ? options.curveColor : options.partColor, prefix)?.colour;
      row.querySelector<HTMLInputElement>("input[type=color]")!.value = "#" + (colour ?? (curve ? "59a0f4" : "b9b9b9"));
      const thick: HTMLInputElement | null = row.querySelector<HTMLInputElement>("input[type=number]");
      if (thick !== null) thick.value = String(HumanDebugPattern.last(id, options.thick, prefix)?.radius ?? "");
    }
  }

  /** One list row: visibility, colour, a thickness for curves and a close-up button for parts. */
  private row(id: string, prefix: string, hide: "hide" | "curveHide", colours: "partColor" | "curveColor"): HTMLElement {
    const short: string = id.slice(prefix.length);
    const row: HTMLSpanElement = document.createElement("span");
    row.className = "row";
    row.dataset.id = id;
    const box: HTMLInputElement = document.createElement("input");
    box.type = "checkbox";
    box.addEventListener("change", (): void => {
      const next: IHumanDebugOptions = structuredClone(this.options);
      const shown: string[] = hide === "hide" ? next.parts : next.curves;
      next[hide] = next[hide].filter((p: string): boolean => p !== short);
      if (!box.checked) next[hide].push(short);
      else if (!HumanDebugPattern.matches(id, shown, prefix)) shown.push(short);
      this.changed(next, []);
    });
    const colour: HTMLInputElement = document.createElement("input");
    colour.type = "color";
    colour.addEventListener("change", (): void => {
      const next: IHumanDebugOptions = structuredClone(this.options);
      next[colours] = [
        ...next[colours].filter((p: IHumanDebugOptions.IColour): boolean => p.pattern !== short),
        { pattern: short, colour: colour.value.slice(1) },
      ];
      this.changed(next, []);
    });
    const name: HTMLSpanElement = document.createElement("span");
    name.textContent = short;
    row.append(box, colour);
    if (hide === "curveHide") {
      const thick: HTMLInputElement = document.createElement("input");
      thick.type = "number";
      thick.step = "any";
      thick.placeholder = "r mm";
      thick.title = "튜브 반지름 mm (비우면 기본값)";
      thick.addEventListener("change", (): void => {
        const next: IHumanDebugOptions = structuredClone(this.options);
        next.thick = next.thick.filter((p: IHumanDebugOptions.IRadius): boolean => p.pattern !== short);
        if (Number(thick.value) > 0) next.thick.push({ pattern: short, radius: Number(thick.value) });
        this.changed(next, []);
      });
      row.append(thick);
    } else {
      const close: HTMLButtonElement = document.createElement("button");
      close.textContent = "근접";
      close.addEventListener("click", (): void => this.changed({ ...structuredClone(this.options), focus: [short] }, []));
      row.append(close);
    }
    row.append(name);
    return row;
  }

  /** A titled group. */
  private group(root: HTMLElement, title: string): HTMLFieldSetElement {
    const set: HTMLFieldSetElement = document.createElement("fieldset");
    const legend: HTMLLegendElement = document.createElement("legend");
    legend.textContent = title;
    set.append(legend);
    root.append(set);
    return set;
  }

  /** A labelled field whose change is parsed through the URL grammar. */
  private field(
    root: HTMLElement,
    name: keyof IHumanDebugOptions,
    text: string,
    field: HTMLInputElement | HTMLSelectElement,
    read: () => string,
  ): void {
    const label: HTMLLabelElement = document.createElement("label");
    label.append(text, field);
    root.append(label);
    if (!this.fields.has(name)) this.fields.set(name, field);
    field.addEventListener("change", (): void => {
      const query: URLSearchParams = new URLSearchParams(HumanDebugOptions.write(this.options));
      const value: string = read();
      if (value === "") query.delete(name);
      else query.set(name, value);
      const parsed: { options: IHumanDebugOptions; notices: string[] } = HumanDebugOptions.parse(query);
      this.changed(parsed.options, parsed.notices);
    });
  }

  /** A number field; empty means the default. */
  private number(root: HTMLElement, name: keyof IHumanDebugOptions, text: string): void {
    const input: HTMLInputElement = document.createElement("input");
    input.type = "number";
    input.step = "any";
    this.field(root, name, text, input, (): string => input.value);
  }

  /** A free text field holding the URL form of the value. */
  private text(root: HTMLElement, name: keyof IHumanDebugOptions, text: string): void {
    const input: HTMLInputElement = document.createElement("input");
    input.type = "text";
    this.field(root, name, text, input, (): string => input.value.trim());
  }

  /** A checkbox for a 0/1 variable. */
  private flag(root: HTMLElement, name: keyof IHumanDebugOptions, text: string): void {
    const input: HTMLInputElement = document.createElement("input");
    input.type = "checkbox";
    this.field(root, name, text, input, (): string => (input.checked ? "1" : "0"));
  }

  /** A colour picker for an `rrggbb` variable. */
  private colour(root: HTMLElement, name: keyof IHumanDebugOptions, text: string): void {
    const input: HTMLInputElement = document.createElement("input");
    input.type = "color";
    this.field(root, name, text, input, (): string => input.value.slice(1));
  }

  /** A choice among fixed values. */
  private select(root: HTMLElement, name: keyof IHumanDebugOptions, text: string, options: readonly string[]): void {
    const select: HTMLSelectElement = document.createElement("select");
    for (const value of options) {
      const option: HTMLOptionElement = document.createElement("option");
      option.value = value;
      option.textContent = value === "" ? "(전신)" : value;
      select.append(option);
    }
    this.field(root, name, text, select, (): string => select.value);
  }
}
