import {
  deriveAutoMovieSemanticMask,
} from "@automovie/engine";
import {
  TestValidator,
} from "@nestia/e2e";
import {
  namedFacts,
} from "../internal/predicates";
import {
  sceneFixture,
} from "../internal/renderFixtures";

import { createSemanticMaskTestInputs } from "../internal/createSemanticMaskTestInputs";

/**
 * Palette identity depends on semantic IDs rather than staged node order or unrelated additions.
 *
 * Scenarios:
 * 1. Every colour is unique, opaque hexadecimal and distinct from reserved background; entries are ascending by ID.
 * 2. Reversing nodes preserves the digest, while an unrelated prop preserves all old colours and adds one addressable identity.
 */
export const test_render_semantic_mask_palette_stability = (): void => {
  const { subject } = createSemanticMaskTestInputs();

  const mask = deriveAutoMovieSemanticMask(subject());

  TestValidator.equals(
      "the palette is collision-free, opaque hexadecimal, and never background",
      namedFacts([
        [
          "unique",
          () =>
            new Set(mask.entries.map((entry) => entry.color)).size ===
            mask.entries.length,
        ],
        [
          "format",
          () => mask.entries.every((entry) => /^#[0-9A-F]{6}$/.test(entry.color)),
        ],
        [
          "background reserved",
          () => mask.entries.every((entry) => entry.color !== mask.background),
        ],
        [
          "ascending",
          () =>
            mask.entries.every(
              (entry, index) =>
                index === 0 || mask.entries[index - 1]!.id < entry.id,
            ),
        ],
      ]),
      {
        unique: true,
        format: true,
        "background reserved": true,
        ascending: true,
      },
    );

  const reversed = deriveAutoMovieSemanticMask({
      ...subject(),
      scene: sceneFixture({ reversed: true }),
    });

  TestValidator.equals(
      "reversing the staged nodes reproduces a byte-identical mask",
      reversed.digest,
      mask.digest,
    );

  const grown = deriveAutoMovieSemanticMask({
      ...subject(),
      scene: sceneFixture({ extra: true }),
    });

  const before = new Map(
      mask.entries.map((entry) => [entry.id, entry.color] as const),
    );

  TestValidator.equals(
      "an unrelated prop repaints nothing and takes a colour of its own",
      namedFacts([
        [
          "existing colours held",
          () =>
            grown.entries
              .filter((entry) => before.has(entry.id))
              .every((entry) => before.get(entry.id) === entry.color),
        ],
        ["one new entry", () => grown.entries.length === mask.entries.length + 1],
        [
          "new entry addressable",
          () => grown.entries.some((entry) => entry.id === "node:crate"),
        ],
        [
          "still collision-free",
          () =>
            new Set(grown.entries.map((entry) => entry.color)).size ===
            grown.entries.length,
        ],
        ["digest moved", () => grown.digest !== mask.digest],
      ]),
      {
        "existing colours held": true,
        "one new entry": true,
        "new entry addressable": true,
        "still collision-free": true,
        "digest moved": true,
      },
    );
};
