import { HUMAN_DEBUG_POSES } from "../poses/HUMAN_DEBUG_POSES";
import { HUMAN_DEBUG_CAMERAS } from "./HUMAN_DEBUG_CAMERAS";
import { HumanDebugOptionField } from "./HumanDebugOptionField";
import type { IHumanDebugOptions } from "./IHumanDebugOptions";

/**
 * The one parser and writer of {@link IHumanDebugOptions}: URL text to options and back.
 *
 * Each variable is declared once in {@link FIELDS} with its reader and writer, and the order of that
 * table is the canonical order, so every spelling of one frame writes one canonical text.
 * {@link HumanDebugOptions.parse} never throws: an unknown variable or a rejected value keeps the
 * default and adds a notice naming what is accepted, so a batch of URLs reports its own typos. The
 * page, the image route, the batch route and the capture CLI all call this namespace; it imports
 * nothing from Node or the DOM, so both sides run the same code.
 */
export namespace HumanDebugOptions {
  /** The options of an empty URL. */
  export function defaults(): IHumanDebugOptions {
    return {
      person: null,
      piece: null,
      pose: "neutral",
      parts: ["*"],
      hide: [],
      partColor: [],
      curves: ["*"],
      curveHide: [],
      kinds: [...KINDS],
      curveWidth: 0.6,
      thick: [],
      curveColor: [],
      xray: false,
      labels: "0",
      camera: "three-quarter",
      az: null,
      el: null,
      dist: null,
      target: null,
      fov: 30,
      ortho: false,
      focus: [],
      shade: "clay",
      light: "reference",
      lightSide: "left",
      lightEl: 10,
      opacity: 1,
      wire: false,
      normals: false,
      normalLength: 3,
      section: "none",
      sectionAt: null,
      sectionFlip: false,
      bg: "f1f3f6",
      w: 0,
      h: 0,
      ui: true,
      axes: false,
    };
  }

  /**
   * Read search parameters into full options.
   *
   * @param params Search parameters; repeated variables are joined with `,`.
   * @param extra Variables a caller owns besides the options, such as the image route's `fresh`; they raise no notice.
   * @returns The options and one notice per ignored variable or rejected value.
   */
  export function parse(
    params: URLSearchParams,
    extra: readonly string[] = [],
  ): { options: IHumanDebugOptions; notices: string[] } {
    const options: IHumanDebugOptions = defaults();
    const notices: string[] = [];
    for (const name of new Set(params.keys()))
      if (!(name in FIELDS) && !extra.includes(name))
        notices.push(`Unknown URL variable "${name}" ignored`);
    for (const name of NAMES) {
      const values: string[] = params.getAll(name);
      if (values.length === 0) continue;
      const text: string = values.join(",");
      const read: { value: unknown } | string = (
        FIELDS[name] as HumanDebugOptionField<unknown>
      ).read(text);
      if (typeof read === "string")
        notices.push(
          `${name}=${text} is invalid (${read}); the default ${JSON.stringify(options[name])} is used`,
        );
      else (options as unknown as Record<string, unknown>)[name] = read.value;
    }
    return { options, notices };
  }

  /**
   * Write options as search text listing only the values that differ from the defaults.
   *
   * @param options Full options.
   * @param omit Variables left out, such as `ui` for a frame identity that ignores the sidebar.
   * @returns Search text without `?`; empty for the default frame.
   */
  export function write(
    options: IHumanDebugOptions,
    omit: readonly (keyof IHumanDebugOptions)[] = [],
  ): string {
    const base: IHumanDebugOptions = defaults();
    const out: URLSearchParams = new URLSearchParams();
    for (const name of NAMES) {
      if (omit.includes(name)) continue;
      if (JSON.stringify(options[name]) === JSON.stringify(base[name])) continue;
      out.set(
        name,
        (FIELDS[name] as HumanDebugOptionField<unknown>).write(options[name]),
      );
    }

    // URLSearchParams escapes the glob and list punctuation; it stays literal so a URL reads.
    return out
      .toString()
      .replace(/%2F/g, "/")
      .replace(/%2A/g, "*")
      .replace(/%3A/g, ":")
      .replace(/%2C/g, ",");
  }

  /**
   * The kind of a curve, read from the last segment of its id.
   *
   * @param id Curve id `human.construction.<chain>/<k|axis|g<j>|name>`.
   * @returns `section` for a number, `axis`, `guide` for `g<j>`, `path` otherwise.
   */
  export function kind(id: string): IHumanDebugOptions.CurveKind {
    const tail: string = id.slice(id.lastIndexOf("/") + 1);
    return tail === "axis"
      ? "axis"
      : /^g\d+$/.test(tail)
        ? "guide"
        : /^\d+$/.test(tail)
          ? "section"
          : "path";
  }

  /** Every pose name of the whole figure: the neutral default first, the bind, then the other shared poses. */
  export const POSES: readonly string[] = [
    "neutral",
    "bind",
    ...Object.keys(HUMAN_DEBUG_POSES).filter((name: string): boolean => name !== "neutral"),
  ];

  /** Every curve kind, in canonical order. */
  export const KINDS: readonly IHumanDebugOptions.CurveKind[] = [
    "section",
    "axis",
    "guide",
    "path",
  ];

  /** Every variable's reader and writer, in canonical order. */
  const FIELDS: {
    [K in keyof IHumanDebugOptions]: HumanDebugOptionField<IHumanDebugOptions[K]>;
  } = {
    person: HumanDebugOptionField.nullable(
      HumanDebugOptionField.name(
        /^[A-Za-z_][A-Za-z0-9_]*$/,
        "an export name of the typed people",
      ),
    ),
    piece: HumanDebugOptionField.nullable(
      HumanDebugOptionField.name(
        /^[A-Za-z0-9_.-]+(:[A-Za-z0-9_.*,/-]+)?$/,
        "<name> or <name>:<argument>",
      ),
    ),
    pose: HumanDebugOptionField.choice(POSES),
    parts: HumanDebugOptionField.globs(),
    hide: HumanDebugOptionField.globs(),
    partColor: HumanDebugOptionField.entries(
      HumanDebugOptionField.colour(),
      (pattern: string, colour: string): IHumanDebugOptions.IColour => ({
        pattern,
        colour,
      }),
      (entry: IHumanDebugOptions.IColour): string => entry.colour,
    ),
    curves: HumanDebugOptionField.globs(),
    curveHide: HumanDebugOptionField.globs(),
    kinds: HumanDebugOptionField.words(KINDS),
    curveWidth: HumanDebugOptionField.number(0, 20, true),
    thick: HumanDebugOptionField.entries(
      HumanDebugOptionField.number(0, 50, true),
      (pattern: string, radius: number): IHumanDebugOptions.IRadius => ({
        pattern,
        radius,
      }),
      (entry: IHumanDebugOptions.IRadius): number => entry.radius,
    ),
    curveColor: HumanDebugOptionField.entries(
      HumanDebugOptionField.colour(),
      (pattern: string, colour: string): IHumanDebugOptions.IColour => ({
        pattern,
        colour,
      }),
      (entry: IHumanDebugOptions.IColour): string => entry.colour,
    ),
    xray: HumanDebugOptionField.flag(),
    labels: HumanDebugOptionField.choice(["0", "1", "marked"] as const),
    camera: HumanDebugOptionField.choice(
      Object.keys(HUMAN_DEBUG_CAMERAS) as (keyof typeof HUMAN_DEBUG_CAMERAS)[],
    ),
    az: HumanDebugOptionField.nullable(
      HumanDebugOptionField.number(-360, 360, false),
    ),
    el: HumanDebugOptionField.nullable(
      HumanDebugOptionField.number(-90, 90, false),
    ),
    dist: HumanDebugOptionField.nullable(
      HumanDebugOptionField.number(0, 1e6, true),
    ),
    target: HumanDebugOptionField.nullable(HumanDebugOptionField.point()),
    fov: HumanDebugOptionField.number(5, 120, false),
    ortho: HumanDebugOptionField.flag(),
    focus: HumanDebugOptionField.globs(),
    shade: HumanDebugOptionField.choice([
      "appearance",
      "clay",
      "normals",
      "curvature",
    ] as const),
    light: HumanDebugOptionField.choice(["reference", "raking"] as const),
    lightSide: HumanDebugOptionField.choice([
      "left",
      "right",
      "top",
      "bottom",
    ] as const),
    lightEl: HumanDebugOptionField.number(0, 80, false),
    opacity: HumanDebugOptionField.number(0, 1, true),
    wire: HumanDebugOptionField.flag(),
    normals: HumanDebugOptionField.flag(),
    normalLength: HumanDebugOptionField.number(0, 50, true),
    section: HumanDebugOptionField.choice(["none", "x", "y", "z"] as const),
    sectionAt: HumanDebugOptionField.nullable(
      HumanDebugOptionField.number(-1e6, 1e6, false),
    ),
    sectionFlip: HumanDebugOptionField.flag(),
    bg: HumanDebugOptionField.colour(),

    // A canvas side of 0 fills the viewport; below 64 pixels nothing reads.
    w: size(),
    h: size(),
    ui: HumanDebugOptionField.flag(),
    axes: HumanDebugOptionField.flag(),
  };

  /** Variable names in canonical order. */
  const NAMES: readonly (keyof IHumanDebugOptions)[] = Object.keys(
    FIELDS,
  ) as (keyof IHumanDebugOptions)[];

  /** A canvas side: 0, or an integer pixel count in [64, 4096]. */
  function size(): HumanDebugOptionField<number> {
    const inner: HumanDebugOptionField<number> = HumanDebugOptionField.number(
      64,
      4096,
      false,
      true,
    );
    return {
      read: (text: string): { value: number } | string =>
        text === "0" ? { value: 0 } : typeof inner.read(text) === "string" ? "0 or an integer in [64, 4096]" : inner.read(text),
      write: inner.write,
    };
  }
}
