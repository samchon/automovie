import type {
  AutoMovieVector2Tuple,
  IAutoMovieFontSegment,
} from "@automovie/interface";

import type { TrueTypeByteReader } from "./TrueTypeByteReader";

/**
 * Deepest component nesting a composite glyph may use; real fonts nest one or
 * two levels.
 */
const MAX_COMPONENT_DEPTH: number = 16;

/**
 * Composite glyph flag (ISO/IEC 14496-22, section 5.3.4, the `glyf` composite
 * glyph description): the component's two arguments are 16-bit, else 8-bit.
 */
const ARG_1_AND_2_ARE_WORDS: number = 0x0001;

/** Composite flag: the arguments are signed x/y offsets, else point numbers. */
const ARGS_ARE_XY_VALUES: number = 0x0002;

/** Composite flag: one scale applies to both axes of the component. */
const WE_HAVE_A_SCALE: number = 0x0008;

/** Composite flag: another component follows this one. */
const MORE_COMPONENTS: number = 0x0020;

/** Composite flag: the component has separate x and y scales. */
const WE_HAVE_AN_X_AND_Y_SCALE: number = 0x0040;

/** Composite flag: a 2 × 2 matrix transforms the component. */
const WE_HAVE_A_TWO_BY_TWO: number = 0x0080;

/** Composite flag: the component's offset is scaled by its transform. */
const SCALED_COMPONENT_OFFSET: number = 0x0800;

/** Composite flag: the component's offset is not scaled by its transform. */
const UNSCALED_COMPONENT_OFFSET: number = 0x1000;

/**
 * Read one glyph's outline from `glyf` as closed chains of quadratic segments
 * in font units, resolving a composite glyph into its transformed components.
 *
 * A simple glyph's points are decoded from their run-length flags and delta
 * coordinates. Each contour is then walked in order: two consecutive off-curve
 * points imply an on-curve point at their midpoint, and a straight piece is
 * written as a quadratic with its control at the midpoint of its ends (ISO/IEC
 * 14496-22, section 5.3.4). A contour that starts off-curve starts at its last
 * point when that is on-curve, else at the midpoint of its last and first
 * points. Zero-length pieces are dropped, and a contour left with no piece,
 * such as a lone anchor point, is dropped.
 *
 * A composite glyph places each component by its x/y offset and its 2 × 2
 * transform, `x' = a·x + c·y + dx`, `y' = b·x + d·y + dy` with `a = xscale`, `b
 * = scale01`, `c = scale10`, `d = yscale`; the offset is transformed only when
 * `SCALED_COMPONENT_OFFSET` is set without `UNSCALED_COMPONENT_OFFSET`, the
 * Open Font Format default. Components placed by matching point numbers are
 * refused. Nesting deeper than 16 levels and a component that contains itself
 * are refused.
 *
 * Results are cached per glyph index in `cache`, so a component shared by
 * several glyphs is decoded once; callers must not mutate the returned arrays.
 *
 * @throws {Error} A field lies outside the glyph's `loca` span, a simple
 *   glyph's end points do not increase, a component uses point matching, nests
 *   too deep or contains itself.
 */
export function readTrueTypeGlyphOutline(props: {
  /** Bounds-checked reader over the font bytes. */
  reader: TrueTypeByteReader;

  /** Byte offset of the `glyf` table. */
  glyf: number;

  /**
   * `loca` offsets relative to `glyf`, one more than the glyph count, already
   * checked to increase within `glyf`.
   */
  loca: readonly number[];

  /** Glyph index to read. */
  glyph: number;

  /** Outlines already read, by glyph index. */
  cache: Map<number, IAutoMovieFontSegment[][]>;
}): IAutoMovieFontSegment[][] {
  return read(props, props.glyph, []);
}

/** Read one glyph with the component stack above it. */
function read(
  props: Parameters<typeof readTrueTypeGlyphOutline>[0],
  glyph: number,
  stack: readonly number[],
): IAutoMovieFontSegment[][] {
  const cached: IAutoMovieFontSegment[][] | undefined = props.cache.get(glyph);
  if (cached !== undefined) return cached;
  if (stack.includes(glyph))
    throw new Error(
      `TrueType composite glyph ${stack[0]} contains itself through glyph ${glyph}`,
    );
  if (stack.length > MAX_COMPONENT_DEPTH)
    throw new Error(
      `TrueType composite glyph ${stack[0]} nests components deeper than ${MAX_COMPONENT_DEPTH} levels`,
    );
  if (glyph < 0 || glyph + 1 >= props.loca.length)
    throw new Error(
      `TrueType glyph ${glyph} is past the font's ${props.loca.length - 1} glyphs`,
    );

  const start: number = props.glyf + props.loca[glyph]!;
  const end: number = props.glyf + props.loca[glyph + 1]!;
  let contours: IAutoMovieFontSegment[][];
  if (end === start) contours = [];
  else {
    const span: ISpan = { reader: props.reader, end, glyph };
    const count: number = at(span, start, 2, "i16");
    contours =
      count >= 0
        ? simple(span, start + 10, count)
        : composite(props, span, start + 10, [...stack, glyph]);
  }
  props.cache.set(glyph, contours);
  return contours;
}

/** The byte span one glyph owns, for reads that must stay inside it. */
interface ISpan {
  /** Reader over the font bytes. */
  reader: TrueTypeByteReader;

  /** First byte past the glyph's `loca` span. */
  end: number;

  /** Glyph index, for diagnostics. */
  glyph: number;
}

/** Read one field that must lie inside the glyph's span. */
function at(
  span: ISpan,
  offset: number,
  size: 1 | 2,
  type: "u8" | "i8" | "u16" | "i16",
): number {
  if (offset + size > span.end)
    throw new Error(
      `TrueType glyph ${span.glyph} reads byte ${offset + size - 1}, past its loca span ending at byte ${span.end}`,
    );
  const what: string = `glyph ${span.glyph}`;
  switch (type) {
    case "u8":
      return span.reader.u8(offset, what);
    case "i8":
      return span.reader.i8(offset, what);
    case "u16":
      return span.reader.u16(offset, what);
    case "i16":
      return span.reader.i16(offset, what);
  }
}

/** Decode a simple glyph's contours. */
function simple(
  span: ISpan,
  offset: number,
  count: number,
): IAutoMovieFontSegment[][] {
  if (count === 0) return [];
  const ends: number[] = [];
  for (let contour: number = 0; contour < count; ++contour) {
    const last: number = at(span, offset + contour * 2, 2, "u16");
    if (contour > 0 && last <= ends[contour - 1]!)
      throw new Error(
        `TrueType glyph ${span.glyph} contour end points must increase`,
      );
    ends.push(last);
  }
  const points: number = ends[count - 1]! + 1;
  const instructions: number = at(span, offset + count * 2, 2, "u16");
  let cursor: number = offset + count * 2 + 2 + instructions;

  // Flags, with bit 3 repeating a flag the following byte's count of times.
  const flags: number[] = [];
  while (flags.length < points) {
    const flag: number = at(span, cursor++, 1, "u8");
    flags.push(flag);
    if ((flag & 0x08) !== 0) {
      const repeat: number = at(span, cursor++, 1, "u8");
      for (let r: number = 0; r < repeat && flags.length < points; ++r)
        flags.push(flag);
    }
  }

  // Coordinates are deltas: a short delta is one unsigned byte signed by the
  // "same" bit, a long one an i16, and "same" without "short" repeats the last.
  const axis: (short: number, same: number) => number[] = (
    short: number,
    same: number,
  ): number[] => {
    const values: number[] = [];
    let value: number = 0;
    for (const flag of flags) {
      if ((flag & short) !== 0) {
        const delta: number = at(span, cursor++, 1, "u8");
        value += (flag & same) !== 0 ? delta : -delta;
      } else if ((flag & same) === 0) {
        value += at(span, cursor, 2, "i16");
        cursor += 2;
      }
      values.push(value);
    }
    return values;
  };
  const xs: number[] = axis(0x02, 0x10);
  const ys: number[] = axis(0x04, 0x20);

  const contours: IAutoMovieFontSegment[][] = [];
  let first: number = 0;
  for (const last of ends) {
    const ring: { point: AutoMovieVector2Tuple; on: boolean }[] = [];
    for (let index: number = first; index <= last; ++index)
      ring.push({
        point: [xs[index]!, ys[index]!],
        on: (flags[index]! & 1) !== 0,
      });
    first = last + 1;
    const segments: IAutoMovieFontSegment[] = quadratics(ring);
    if (segments.length > 0) contours.push(segments);
  }
  return contours;
}

/** Turn one contour's on- and off-curve points into closed quadratic segments. */
function quadratics(
  ring: readonly { point: AutoMovieVector2Tuple; on: boolean }[],
): IAutoMovieFontSegment[] {
  const n: number = ring.length;
  const first: { point: AutoMovieVector2Tuple; on: boolean } = ring[0]!;
  const last: { point: AutoMovieVector2Tuple; on: boolean } = ring[n - 1]!;
  let start: AutoMovieVector2Tuple;
  let sequence: readonly { point: AutoMovieVector2Tuple; on: boolean }[];
  if (first.on) {
    start = first.point;
    sequence = ring.slice(1);
  } else if (last.on) {
    start = last.point;
    sequence = ring.slice(0, n - 1);
  } else {
    start = midpoint(last.point, first.point);
    sequence = ring;
  }

  const segments: IAutoMovieFontSegment[] = [];
  const push: (
    from: AutoMovieVector2Tuple,
    control: AutoMovieVector2Tuple,
    to: AutoMovieVector2Tuple,
  ) => void = (
    from: AutoMovieVector2Tuple,
    control: AutoMovieVector2Tuple,
    to: AutoMovieVector2Tuple,
  ): void => {
    if (
      from[0] === to[0] &&
      from[1] === to[1] &&
      control[0] === to[0] &&
      control[1] === to[1]
    )
      return;
    segments.push({ start: [...from], control: [...control], end: [...to] });
  };
  let current: AutoMovieVector2Tuple = start;
  let pending: AutoMovieVector2Tuple | null = null;
  for (const entry of [...sequence, { point: start, on: true }]) {
    if (entry.on) {
      push(current, pending ?? midpoint(current, entry.point), entry.point);
      current = entry.point;
      pending = null;
    } else if (pending === null) pending = entry.point;
    else {
      const implied: AutoMovieVector2Tuple = midpoint(pending, entry.point);
      push(current, pending, implied);
      current = implied;
      pending = entry.point;
    }
  }
  return segments;
}

/** The point halfway between two points. */
function midpoint(
  a: AutoMovieVector2Tuple,
  b: AutoMovieVector2Tuple,
): AutoMovieVector2Tuple {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

/** Resolve a composite glyph's components into transformed contours. */
function composite(
  props: Parameters<typeof readTrueTypeGlyphOutline>[0],
  span: ISpan,
  offset: number,
  stack: readonly number[],
): IAutoMovieFontSegment[][] {
  const contours: IAutoMovieFontSegment[][] = [];
  let cursor: number = offset;
  let flags: number;
  do {
    flags = at(span, cursor, 2, "u16");
    const component: number = at(span, cursor + 2, 2, "u16");
    cursor += 4;
    if ((flags & ARGS_ARE_XY_VALUES) === 0)
      throw new Error(
        `TrueType composite glyph ${span.glyph} places component ${component} by matching point numbers, which is not supported; use x/y offsets`,
      );
    let dx: number;
    let dy: number;
    if ((flags & ARG_1_AND_2_ARE_WORDS) !== 0) {
      dx = at(span, cursor, 2, "i16");
      dy = at(span, cursor + 2, 2, "i16");
      cursor += 4;
    } else {
      dx = at(span, cursor, 1, "i8");
      dy = at(span, cursor + 1, 1, "i8");
      cursor += 2;
    }

    let a: number = 1;
    let b: number = 0;
    let c: number = 0;
    let d: number = 1;
    const fixed: (index: number) => number = (index: number): number =>
      at(span, cursor + index * 2, 2, "i16") / 16384;
    if ((flags & WE_HAVE_A_SCALE) !== 0) {
      a = fixed(0);
      d = a;
      cursor += 2;
    } else if ((flags & WE_HAVE_AN_X_AND_Y_SCALE) !== 0) {
      a = fixed(0);
      d = fixed(1);
      cursor += 4;
    } else if ((flags & WE_HAVE_A_TWO_BY_TWO) !== 0) {
      a = fixed(0);
      b = fixed(1);
      c = fixed(2);
      d = fixed(3);
      cursor += 8;
    }
    if (
      (flags & SCALED_COMPONENT_OFFSET) !== 0 &&
      (flags & UNSCALED_COMPONENT_OFFSET) === 0
    )
      [dx, dy] = [a * dx + c * dy, b * dx + d * dy];

    const map: (point: AutoMovieVector2Tuple) => AutoMovieVector2Tuple = (
      point: AutoMovieVector2Tuple,
    ): AutoMovieVector2Tuple => [
      a * point[0] + c * point[1] + dx,
      b * point[0] + d * point[1] + dy,
    ];
    for (const contour of read(props, component, stack))
      contours.push(
        contour.map(
          (segment: IAutoMovieFontSegment): IAutoMovieFontSegment => ({
            start: map(segment.start),
            control: map(segment.control),
            end: map(segment.end),
          }),
        ),
      );
  } while ((flags & MORE_COMPONENTS) !== 0);
  return contours;
}
