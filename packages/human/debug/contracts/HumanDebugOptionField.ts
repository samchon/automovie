import { HumanInspectionSelection } from "../../src/inspection/HumanInspectionSelection";
/**
 * The reader and writer of one URL variable, and the constructors of every kind the viewer uses.
 *
 * A field reads the joined text of its variable (repeated values joined with `,`) into a value, or
 * into a string that says what it accepts, and writes a value back as canonical text. Writing then
 * reading returns the same value, so the canonical URL of a frame is unique.
 */
export interface HumanDebugOptionField<T> {
  /** Parse text; a string result names what was accepted instead. */
  read(text: string): { value: T } | string;

  /** Canonical text of a value. */
  write(value: T): string;
}

export namespace HumanDebugOptionField {
  /** Characters a glob may use. */
  const GLOB: RegExp = /^[A-Za-z0-9_.*/-]+$/;

  /**
   * One of a closed set of words.
   *
   * @param options Accepted words.
   */
  export function choice<T extends string>(
    options: readonly T[],
  ): HumanDebugOptionField<T> {
    return {
      read: (text: string): { value: T } | string =>
        (options as readonly string[]).includes(text)
          ? { value: text as T }
          : options.join(" | "),
      write: (value: T): string => value,
    };
  }

  /** `0` or `1`. */
  export function flag(): HumanDebugOptionField<boolean> {
    return {
      read: (text: string): { value: boolean } | string =>
        text === "0" || text === "1" ? { value: text === "1" } : "0 | 1",
      write: (value: boolean): string => (value ? "1" : "0"),
    };
  }

  /**
   * A finite number in a range.
   *
   * @param low Lower bound.
   * @param high Upper bound, inclusive.
   * @param open Whether the lower bound is excluded.
   * @param integer Whether only integers are accepted.
   */
  export function number(
    low: number,
    high: number,
    open: boolean,
    integer: boolean = false,
  ): HumanDebugOptionField<number> {
    const accepted: string =
      (open ? "(" : "[") + low + ", " + high + "]" + (integer ? " integer" : "");
    return {
      read: (text: string): { value: number } | string => {
        const value: number = text.trim() === "" ? NaN : Number(text);
        return Number.isFinite(value) &&
          (open ? value > low : value >= low) &&
          value <= high &&
          (!integer || Number.isInteger(value))
          ? { value }
          : accepted;
      },
      write: (value: number): string => String(value),
    };
  }

  /**
   * A field whose empty value is null.
   *
   * @param inner The field of the present value.
   */
  export function nullable<T>(
    inner: HumanDebugOptionField<T>,
  ): HumanDebugOptionField<T | null> {
    return {
      read: (text: string): { value: T | null } | string =>
        text === "" ? { value: null } : inner.read(text),
      write: (value: T | null): string =>
        value === null ? "" : inner.write(value),
    };
  }

  /**
   * A name matching an expression.
   *
   * @param expression Accepted spelling.
   * @param accepted What the expression accepts, for the notice.
   */
  export function name(
    expression: RegExp,
    accepted: string,
  ): HumanDebugOptionField<string> {
    return {
      read: (text: string): { value: string } | string =>
        expression.test(text) ? { value: text } : accepted,
      write: (value: string): string => value,
    };
  }

  /** A comma list of globs; `none` is the empty list. */
  export function globs(): HumanDebugOptionField<string[]> {
    return {
      read: (text: string): { value: string[] } | string => {
        return HumanInspectionSelection.globs(text);
      },
      write: (value: string[]): string =>
        value.length === 0 ? "none" : value.join(","),
    };
  }

  /**
   * A comma list of words from a closed set; `none` is the empty list.
   *
   * @param options Accepted words, in canonical order.
   */
  export function words<T extends string>(
    options: readonly T[],
  ): HumanDebugOptionField<T[]> {
    return {
      read: (text: string): { value: T[] } | string => {
        const items: string[] = split(text);
        if (items.length === 1 && items[0] === "none") return { value: [] };
        return items.every((item: string): boolean =>
          (options as readonly string[]).includes(item),
        )
          ? {
              value: options.filter((option: T): boolean =>
                items.includes(option),
              ),
            }
          : "comma list of " + options.join(", ") + ", or none";
      },
      write: (value: T[]): string =>
        value.length === 0 ? "none" : value.join(","),
    };
  }

  /**
   * A comma list of `pattern:value` entries.
   *
   * @param value The field of the value after the last `:`.
   * @param make Record of one entry.
   * @param take Value of one entry.
   */
  export function entries<V, E extends { pattern: string }>(
    value: HumanDebugOptionField<V>,
    make: (pattern: string, value: V) => E,
    take: (entry: E) => V,
  ): HumanDebugOptionField<E[]> {
    return {
      read: (text: string): { value: E[] } | string => {
        const out: E[] = [];
        for (const item of split(text)) {
          const at: number = item.lastIndexOf(":");
          const parsed: { value: V } | string =
            at <= 0 ? "pattern:value" : value.read(item.slice(at + 1));
          if (typeof parsed === "string" || !GLOB.test(item.slice(0, at)))
            return "comma list of pattern:value, value " + String(parsed);
          out.push(make(item.slice(0, at), parsed.value));
        }
        return { value: out };
      },
      write: (list: E[]): string =>
        list
          .map((entry: E): string => entry.pattern + ":" + value.write(take(entry)))
          .join(","),
    };
  }

  /** Six hexadecimal digits, with or without a leading `#`. */
  export function colour(): HumanDebugOptionField<string> {
    return {
      read: (text: string): { value: string } | string => {
        const hex: string = text.trim().replace(/^#/, "").toLowerCase();
        return /^[0-9a-f]{6}$/.test(hex) ? { value: hex } : "rrggbb";
      },
      write: (value: string): string => value,
    };
  }

  /** An `x,y,z` point in mm. */
  export function point(): HumanDebugOptionField<[number, number, number]> {
    return {
      read: (text: string): { value: [number, number, number] } | string => {
        const values: number[] = text
          .split(",")
          .map((item: string): number => (item.trim() === "" ? NaN : Number(item)));
        return values.length === 3 && values.every(Number.isFinite)
          ? { value: values as [number, number, number] }
          : "x,y,z in mm";
      },
      write: (value: [number, number, number]): string => value.join(","),
    };
  }

  /** Trimmed non-empty comma items. */
  function split(text: string): string[] {
    return text
      .split(",")
      .map((item: string): string => item.trim())
      .filter((item: string): boolean => item !== "");
  }
}
