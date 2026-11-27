import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
} from "../../core";
import { PianoPedalConstruction } from "./PianoPedalConstruction";
import type { AutoMovieArchetypeInstrument } from "../AutoMovieArchetypeInstrument";

/** The builder the construction fills. */
type Builder = AutoMovieArchetypeBuilder<
  AutoMovieArchetypeInstrument.Affordance,
  AutoMovieArchetypeInstrument.Dimension
>;

/** The drawn dimensions. */
type Drawn = Partial<Record<AutoMovieArchetypeInstrument.Dimension, number>>;

/** The shorthand the construction uses. */
const v: typeof Vector3.create = Vector3.create;

/**
 * How {@link createInstrument} builds an upright piano with its case, keyboard
 * of 88 keys numbered from the bottom, fallboard and damper pedal.
 *
 * The piano stands with its back at the origin's `Z` and the keyboard toward
 * `+Z`, centred on `X`; a player faces it along `-Z`, so the bass, at the
 * player's left, is at `-X`.
 */
export namespace KeyboardConstruction {
  /** The keys of a modern piano. */
  export const KEYS: number = 88;

  /** The pitch classes of the black keys, counted in semitones up from C. */
  export const BLACK: ReadonlySet<number> = new Set([1, 3, 6, 8, 10]);

  /**
   * The construction sizes, metres, which place no contact: `white`, a white
   * key's thickness under its cited top; `blackWidth`, a black key's width, the
   * 13.7 mm the search for the keyboard's sizes gave; `gap`, the gap between
   * neighbouring white keys; `cheek`, a side arm's width; `fallboard`, the
   * fallboard's thickness; each but `blackWidth` an estimate.
   */
  export const ESTIMATES: Readonly<{
    white: number;
    blackWidth: number;
    gap: number;
    cheek: number;
    fallboard: number;
  }> = {
    white: 0.02,
    blackWidth: 0.0137,
    gap: 0.001,
    cheek: 0.06,
    fallboard: 0.015,
  };

  /**
   * The fallboard's travel, degrees: the quarter turn about its level hinge
   * that lays it, upright at rest, flat over the keys.
   */
  export const FALL: number = 90;

  /**
   * Whether a key of the 88, numbered from 1 at the bottom A, is black.
   *
   * @param key The key's number, 1 to 88.
   * @returns True for a black key.
   */
  export function black(key: number): boolean {
    return BLACK.has((key - 1 + 9) % 12);
  }

  /**
   * An upright piano: the case behind the keys from the floor to its height,
   * two cheeks either side of the keyboard carrying the key bed, the 88 keys on
   * it, each a part on its own `key<n>` button, and the fallboard standing open
   * behind the keys on its `lid` hinge.
   *
   * White keys are laid side by side at a seventh of the drawn octave each; a
   * black key sits on the line between its two white neighbours, raised the
   * drawn rise above them and shorter. Each key's site is its middle, and each
   * presses down by the drawn dip.
   *
   * @param builder The builder to fill.
   * @param d The drawn dimensions.
   */
  export function uprightPiano(builder: Builder, d: Drawn): void {
    const E: typeof ESTIMATES = ESTIMATES;
    const height: number = d.height!;
    const width: number = d.width!;
    const depth: number = d.depth!;
    const top: number = d.keyHeight!;
    const length: number = d.keyLength!;
    const back: number = depth - length;
    const white: number = d.octave! / 7;

    // The 88 keys (`KEYS`) are 52 white and 36 black.
    const whites: number = 52;
    const left: number = (-whites * white) / 2;
    const bed: number = top - E.white;
    const rise: number = d.blackRise!;
    builder.box("case", v(width, height, back), v(0, height / 2, back / 2), {
      color: "#1d1b1a",
    });
    PianoPedalConstruction(builder, back);
    for (const [id, sign] of [
      ["cheek-left", 1],
      ["cheek-right", -1],
    ] as const)
      builder.box(
        id,
        v(E.cheek, top + rise, length),
        v((sign * (width - E.cheek)) / 2, (top + rise) / 2, back + length / 2),
        { color: "#1d1b1a" },
      );
    builder.box(
      "key-bed",
      v(width - 2 * E.cheek, 0.04, length),
      v(0, bed - 0.02, back + length / 2),
      { color: "#1d1b1a" },
    );

    // The keys: a white key's X from the whites below it, a black key on the line after the white below it.
    let below: number = 0;
    for (let key: number = 1; key <= KEYS; key++) {
      const id: `key${number}` = `key${key}`;
      if (black(key)) {
        const x: number = left + below * white;
        const run: number = d.blackLength!;
        builder.box(
          `${id}-part`,
          v(E.blackWidth, E.white + rise, run),
          v(x, bed + (E.white + rise) / 2, back + run / 2),
          { color: "#121212" },
        );
        builder.affordance({
          id,
          kind: "button",
          frame: AutoMovieArchetypeFrame.upright(
            v(x, top + rise, back + run / 2),
          ),
          extent: null,
          travel: d.dip!,
          parts: [`${id}-part`],
        });
        continue;
      }
      const x: number = left + (below + 0.5) * white;
      below++;
      builder.box(
        `${id}-part`,
        v(white - E.gap, E.white, length),
        v(x, bed + E.white / 2, back + length / 2),
        { color: "#f3f1ea" },
      );
      builder.affordance({
        id,
        kind: "button",
        frame: AutoMovieArchetypeFrame.upright(v(x, top, back + length / 2)),
        extent: null,
        travel: d.dip!,
        parts: [`${id}-part`],
      });
    }

    // The fallboard stands open against the case over the keys' back ends; its travel lays it forward over them.
    builder.box(
      "fallboard",
      v(whites * white, length, E.fallboard),
      v(0, top + rise + E.fallboard + length / 2, back + E.fallboard / 2),
      { color: "#1d1b1a" },
    );
    builder.affordance({
      id: "lid",
      kind: "hinge",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, top + rise + E.fallboard, back),
        v(1, 0, 0),
        v(0, 1, 0),
      ),
      extent: null,
      travel: FALL,
      parts: ["fallboard"],
    });
    builder.affordance({
      id: "keybed",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, top, back + length / 2)),
      extent: null,
      width: whites * white,
      depth: length,
    });
  }
}
