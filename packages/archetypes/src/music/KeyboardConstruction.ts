import { Vector3 } from "@automovie/engine";

import { type ArchetypeBuilder, ArchetypeFrame } from "../core";
import type { createInstrument } from "./createInstrument";

/** The builder the construction fills. */
type Builder = ArchetypeBuilder<
  createInstrument.Affordance,
  createInstrument.Dimension
>;

/** The drawn dimensions. */
type Drawn = Partial<Record<createInstrument.Dimension, number>>;

/** The shorthand the construction uses. */
const v: typeof Vector3.create = Vector3.create;

/**
 * How {@link createInstrument} builds an upright piano: its case, its keyboard of 88 keys numbered from the bottom, and its fallboard.
 *
 * The piano stands with its back at the origin's `Z` and the keyboard toward `+Z`, centred on `X`; a player faces it along `-Z`, so the bass, at the player's left, is at `-X`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the namespace builds, its frame and which end the bass is.
 * @evidence contracts/development/design.md#principled-representation Code CAD over the builder's primitives; the keys follow the keyboard's pitch pattern, so a key's colour and place come from its number, not from a table.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The piano's construction, the keyboard's count and the estimates it reads; read only by `createInstrument`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Black keys are centred on the line between their white neighbours, the coarse form of the real off-centre layout; that and every size no source gives are stated here.
 */
export namespace KeyboardConstruction {
  /** The keys of a modern piano. */
  export const KEYS: number = 88;

  /** The pitch classes of the black keys, counted in semitones up from C. */
  export const BLACK: ReadonlySet<number> = new Set([1, 3, 6, 8, 10]);

  /**
   * The construction sizes, metres, which place no contact: `white`, a white key's thickness under its cited top; `blackWidth`, a black key's width, the 13.7 mm the search for the keyboard's sizes gave; `gap`, the gap between neighbouring white keys; `cheek`, a side arm's width; `fallboard`, the fallboard's thickness; each but `blackWidth` an estimate.
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

  /** The fallboard's travel, degrees: the quarter turn about its level hinge that lays it, upright at rest, flat over the keys. */
  export const FALL: number = 90;

  /**
   * Whether a key of the 88, numbered from 1 at the bottom A, is black.
   *
   * @param key The key's number, 1 to 88.
   * @returns True for a black key.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the numbering and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The bottom key is A0, nine semitones above C; a key's pitch class is its offset from that C, and the five sharps are the black keys.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One modulus, one lookup.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function black(key: number): boolean {
    return BLACK.has((key - 1 + 9) % 12);
  }

  /**
   * An upright piano: the case behind the keys from the floor to its height, two cheeks either side of the keyboard carrying the key bed, the 88 keys on it, each a part on its own `key<n>` button, and the fallboard standing open behind the keys on its `lid` hinge.
   *
   * White keys are laid side by side at a seventh of the drawn octave each; a black key sits on the line between its two white neighbours, raised the drawn rise above them and shorter. Each key's site is its middle, and each presses down by the drawn dip.
   *
   * @param builder The builder to fill.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States how the keys are laid and where each is pressed.
   * @evidence contracts/development/implementation.md#principled-implementation Every key's place follows from its number: the count of white keys below it sets its `X`, and its colour sets its length and height; the keyboard is the drawn octave times the 52 white keys over seven, centred on the case.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The case and cheeks, the key bed, the keys in one pass, the fallboard, then the keybed contact.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pedals, music desk or action; the keys' thickness and the cheeks' and the fallboard's sizes are construction estimates, none placing a contact.
   * @evidence contracts/development/implementation.md#efficient-algorithms One part and one contact per key, ninety-odd parts, in one pass over the keys.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one instrument.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
    const whites: number = 52;
    const left: number = (-whites * white) / 2;
    const bed: number = top - E.white;
    const rise: number = d.blackRise!;
    builder.box("case", v(width, height, back), v(0, height / 2, back / 2), {
      color: "#1d1b1a",
    });
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
          frame: ArchetypeFrame.upright(v(x, top + rise, back + run / 2)),
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
        frame: ArchetypeFrame.upright(v(x, top, back + length / 2)),
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
      frame: ArchetypeFrame.facing(
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
      frame: ArchetypeFrame.upright(v(0, top, back + length / 2)),
      extent: null,
      width: whites * white,
      depth: length,
    });
  }
}
