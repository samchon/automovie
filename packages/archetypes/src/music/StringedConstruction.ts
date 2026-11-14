import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { type ArchetypeBuilder, ArchetypeFrame } from "../core";
import type { createInstrument } from "./createInstrument";

/** The builder every construction fills. */
type Builder = ArchetypeBuilder<
  createInstrument.Affordance,
  createInstrument.Dimension
>;

/** The drawn dimensions. */
type Drawn = Partial<Record<createInstrument.Dimension, number>>;

/** The shorthand every construction uses. */
const v: typeof Vector3.create = Vector3.create;

/** Varnished wood. */
const WOOD: string = "#8a5a2b";

/** An ebony fingerboard. */
const EBONY: string = "#1f1a17";

/**
 * Lay the strings from the nut to the bridge, each a `bar` named `string<n>`, `string1` on the `-Z` edge.
 *
 * @param builder The builder to fill.
 * @param count How many strings.
 * @param nut The nut's middle, where the strings leave it, metres.
 * @param bridge The bridge's middle, where the strings meet it, metres.
 * @param atNut The outer strings' span at the nut, metres.
 * @param atBridge Their span at the bridge, metres.
 */
function strings(
  builder: Builder,
  count: number,
  nut: IAutoMovieVector3,
  bridge: IAutoMovieVector3,
  atNut: number,
  atBridge: number,
): void {
  for (let k: number = 1; k <= count; k++) {
    const share: number = (k - 1) / (count - 1) - 0.5;
    const from: IAutoMovieVector3 = v(nut.x, nut.y, nut.z + share * atNut);
    const to: IAutoMovieVector3 = v(
      bridge.x,
      bridge.y,
      bridge.z + share * atBridge,
    );
    const along: IAutoMovieVector3 = Vector3.subtract(from, to);
    builder.affordance({
      id: `string${k}`,
      kind: "bar",
      symmetry: "round",
      frame: ArchetypeFrame.facing(
        Vector3.scale(Vector3.add(from, to), 0.5),
        v(0, 1, 0),
        along,
      ),
      extent: null,
      length: Vector3.length(along),
    });
  }
}

/**
 * How {@link createInstrument} builds its stringed instruments: a steel-string guitar and a violin, each lying on its back with its neck toward `+X`.
 *
 * Fret positions follow equal temperament: the `n`th fret stands `scale (1 - 2^(-n/12))` from the nut, since each fret shortens the sounding string by a semitone's ratio, the twelfth root of two. Every string, fret and grip is placed from the makers' and luthiers' read sizes; the estimates below size only parts no act reads.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is built, how it lies, the rule that places the frets and what the estimates may size.
 * @evidence contracts/development/design.md#principled-representation Code CAD over the builder's primitives from named dimensions; the frets and strings are contacts whose places follow from the scale, not a table.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two constructions, the fret count and the estimates they read; read only by `createInstrument`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Strings are contacts, not parts, since a string is thinner than any view resolves; every size no source gives is a named construction estimate here, none placing a contact.
 */
export namespace StringedConstruction {
  /** A steel-string guitar's frets, as the Martin D-28 has them. */
  export const FRETS: number = 20;

  /** The fret where the guitar's neck meets its body, as the Martin D-28 has it. */
  export const JOINT: number = 14;

  /**
   * The construction sizes no source read gives, metres, each an estimate no act reads and no band declares: `neck`, a guitar neck's depth under the soundboard's plane; `head`, its headstock's length; `scroll`, a violin's pegbox and scroll length.
   */
  export const ESTIMATES: Readonly<{
    neck: number;
    head: number;
    scroll: number;
  }> = {
    neck: 0.022,
    head: 0.19,
    scroll: 0.09,
  };

  /**
   * A fret's distance from the nut along the string.
   *
   * @param scale The string's sounding length from the nut to the saddle, metres.
   * @param fret The fret's number, 0 for the nut.
   * @returns The distance, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the unit and the nut's case.
   * @evidence contracts/development/implementation.md#principled-implementation Equal temperament: each fret leaves `2^(-1/12)` of the string sounding, so fret `n` is `scale (1 - 2^(-n/12))` from the nut.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One formula.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function fret(scale: number, fret: number): number {
    return scale * (1 - Math.pow(2, -fret / 12));
  }

  /**
   * A steel-string guitar lying on its back: the body from its tail at `-X` to the neck joint at the origin's `X`, the neck from there to the nut at the fourteenth fret's distance, and the headstock beyond.
   *
   * The strings and frets lie in the soundboard's plane, the body's depth above the floor. `fret<n>` is the place a fingertip stops the strings behind the `n`th fret, the middle of the space from fret `n - 1`, a bar across the fingerboard; `string<n>` each string from the nut to the saddle, `string1` the high E on the `-Z` edge, the outer strings as far apart at the nut as the nut is wide; `neck` the neck between the nut and the body, gripped by the fretting hand; `body` the soundboard between the neck's end and the saddle, where the strumming hand meets the strings.
   *
   * @param builder The builder to fill.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States how the guitar lies, the plane of its strings and every contact's place.
   * @evidence contracts/development/implementation.md#principled-implementation The nut stands the fourteenth fret's distance from the body and the saddle the scale from the nut; frets and strings follow from the scale, and the fingerboard widens linearly from the maker's nut width to the maker's string spacing at the saddle.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Body, neck, headstock, then the frets, the strings, the neck grip and the body.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body is a box at its widest bout, without a waist, soundhole or bridge; the fingerboard's rise over the soundboard is not drawn; the neck's depth and the headstock's length are construction estimates.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three parts and one contact per fret and string.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one instrument.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function guitar(builder: Builder, d: Drawn): void {
    const E: typeof ESTIMATES = ESTIMATES;
    const scale: number = d.scale!;
    const top: number = d.bodyDepth!;
    const nutX: number = fret(scale, JOINT);
    const saddleX: number = nutX - scale;
    const nutWidth: number = d.nut!;
    const saddleWidth: number = d.saddle!;
    const boardWidth = (x: number): number =>
      nutWidth + ((saddleWidth - nutWidth) * (nutX - x)) / scale;
    builder.box(
      "body",
      v(d.bodyLength!, top, d.bodyWidth!),
      v(-d.bodyLength! / 2, top / 2, 0),
      { color: WOOD },
    );
    builder.box(
      "neck",
      v(nutX, E.neck, boardWidth(nutX / 2)),
      v(nutX / 2, top - E.neck / 2, 0),
      { color: EBONY },
    );
    builder.box(
      "headstock",
      v(E.head, E.neck / 2, nutWidth * 1.6),
      v(nutX + E.head / 2, top - E.neck / 4, 0),
      { color: WOOD },
    );
    for (let n: number = 1; n <= FRETS; n++) {
      const x: number = nutX - (fret(scale, n - 1) + fret(scale, n)) / 2;
      builder.affordance({
        id: `fret${n}`,
        kind: "bar",
        symmetry: "half",
        frame: ArchetypeFrame.facing(v(x, top, 0), v(0, 1, 0), v(0, 0, 1)),
        extent: null,
        length: boardWidth(x),
      });
    }
    strings(builder, 6, v(nutX, top, 0), v(saddleX, top, 0), nutWidth, saddleWidth);
    builder.affordance({
      id: "neck",
      kind: "bar",
      symmetry: "half",
      frame: ArchetypeFrame.facing(v(nutX / 2, top, 0), v(0, 1, 0), v(1, 0, 0)),
      extent: null,
      grip: "power",
      length: nutX,
    });
    builder.affordance({
      id: "body",
      kind: "surface",
      frame: ArchetypeFrame.upright(v(saddleX / 2, top, 0)),
      extent: null,
      width: -saddleX,
      depth: saddleWidth,
    });
  }

  /**
   * A violin lying on its back: the body as its lower bout, waist and upper bout from the tail at `-X` to the neck's root at the origin's `X`, the rib height deep, the neck to the nut and the pegbox and scroll beyond.
   *
   * `string<n>` is each string from the nut, at the neck's thickness above the top, to the bridge, at the bridge's height, `string1` the E on the `-Z` edge, spaced as the luthiers' table gives at the nut and the bridge; `neck` the neck gripped by the left hand. The chinrest is not built: no source read places it.
   *
   * The strings run their 327 mm from the nut, the neck's 138 mm off the body, so the bridge falls 5 mm short of the 194 mm body stop the sheet also gives: the string length wins, as the length the fingers stop.
   *
   * @param builder The builder to fill.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States how the violin lies, every contact's place, why there is no chinrest and how the two conflicting lengths are reconciled.
   * @evidence contracts/development/implementation.md#principled-implementation The body's three boxes at the maker's three bout widths over the back's length, split two fifths, one fifth and two fifths, a construction proportion; the nut at the neck's length off the body and the bridge the string length from the nut; the neck as thick and the fingerboard as wide as the luthiers' table gives.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Bouts, neck, scroll, then the strings and the neck grip.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No arching, f-holes or tailpiece; the bouts' split and the scroll's length are construction estimates.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Five parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one instrument.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function violin(builder: Builder, d: Drawn): void {
    const E: typeof ESTIMATES = ESTIMATES;
    const length: number = d.bodyLength!;
    const rib: number = d.rib!;
    const parts: readonly [string, number, number, number][] = [
      ["lower-bout", -length, -0.6 * length, d.lowerBout!],
      ["waist", -0.6 * length, -0.4 * length, d.waist!],
      ["upper-bout", -0.4 * length, 0, d.upperBout!],
    ];
    for (const [id, from, to, width] of parts)
      builder.box(id, v(to - from, rib, width), v((from + to) / 2, rib / 2, 0), {
        color: WOOD,
      });
    const nutX: number = d.neck!;
    const thick: number = d.neckThickness!;
    const board: number = d.fingerboard!;
    builder.box(
      "neck",
      v(nutX, thick, board),
      v(nutX / 2, rib + thick / 2, 0),
      { color: EBONY },
    );
    builder.box(
      "scroll",
      v(E.scroll, thick, board),
      v(nutX + E.scroll / 2, rib + thick / 2, 0),
      { color: WOOD },
    );
    strings(
      builder,
      4,
      v(nutX, rib + thick, 0),
      v(nutX - d.scale!, rib + d.bridgeHeight!, 0),
      d.nutSpacing!,
      d.bridgeSpacing!,
    );
    builder.affordance({
      id: "neck",
      kind: "bar",
      symmetry: "half",
      frame: ArchetypeFrame.facing(
        v(nutX / 2, rib + thick / 2, 0),
        v(0, 1, 0),
        v(1, 0, 0),
      ),
      extent: null,
      grip: "power",
      aperture: thick,
      length: nutX,
    });
  }
}
