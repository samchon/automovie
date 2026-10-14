import { IAutoMovieSceneNode, IAutoMovieSemanticMask, IAutoMovieSemanticMaskEntry } from "@automovie/interface";
import { IAutoMovieRenderSubject } from "../../../../packages/engine/src/render/IAutoMovieRenderSubject";
import { deriveAutoMovieSemanticMask } from "../../../../packages/engine/src/render/deriveAutoMovieSemanticMask";
import { TestValidator } from "@nestia/e2e";
import { namedFacts } from "../internal/predicates";
import { sceneFixture } from "../internal/renderFixtures";
import { createSemanticMaskTestInputs } from "../internal/createSemanticMaskTestInputs";
/**
 * Palette metadata is invariant to node order and retains old colours for this selected crate addition; arbitrary additions can change collision-probing chains.
 *
 * Scenarios:
 * 1. Every colour is unique, opaque hexadecimal and distinct from reserved background; entries are ascending by ID.
 * 2. Reversing nodes preserves the digest, while the selected crate addition preserves all old colours and adds one addressable identity.
 *
 * @evidence contracts/testing.md#behavioral-verification Derives actual palettes and checks uniqueness, opaque hex/background exclusion, id ordering, node-order digest invariance and the selected added prop's retained old colours.
 * @evidence contracts/testing.md#independent-expectations The declared RGB/background convention and hand-known id population supply structural expectations; comparing reordered or extended derivations is a metamorphic consistency check, not an independent colour oracle. This particular nonconflicting addition does not prove every addition preserves existing colours when probing chains change.
 * @evidence contracts/testing.md#distinguishing-cases The original subject, reversed nodes and one authored crate addition retain count/digest and existing-colour witnesses; genuine colliding ids and FNV arithmetic belong to the collision test.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_semantic_mask_palette_stability owns its cases. Portable CPU palette metadata only, without producing or reading segmentation pixels.
 */
export function test_render_semantic_mask_palette_stability(): void {
  const { subject }: { subject: () => IAutoMovieRenderSubject; bulk: (semantic: string) => IAutoMovieSceneNode; broken: (owner: string) => IAutoMovieSemanticMask; cyclic: () => IAutoMovieSemanticMask; } = createSemanticMaskTestInputs();

  const mask: IAutoMovieSemanticMask = deriveAutoMovieSemanticMask(subject());

  TestValidator.equals(
      "the palette is collision-free, opaque hexadecimal, and never background",
      namedFacts([
        [
          "unique",
          (): boolean =>
            new Set(mask.entries.map((entry: IAutoMovieSemanticMaskEntry): string => entry.color)).size ===
            mask.entries.length,
        ],
        [
          "format",
          (): boolean => mask.entries.every((entry: IAutoMovieSemanticMaskEntry): boolean => /^#[0-9A-F]{6}$/.test(entry.color)),
        ],
        [
          "background reserved",
          (): boolean => mask.entries.every((entry: IAutoMovieSemanticMaskEntry): boolean => entry.color !== mask.background),
        ],
        [
          "ascending",
          (): boolean =>
            mask.entries.every(
              (entry: IAutoMovieSemanticMaskEntry, index: number): boolean =>
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

  const reversed: IAutoMovieSemanticMask = deriveAutoMovieSemanticMask({
      ...subject(),
      scene: sceneFixture({ reversed: true }),
    });

  TestValidator.equals(
      "reversing the staged nodes reproduces a byte-identical mask",
      reversed.digest,
      mask.digest,
    );

  const grown: IAutoMovieSemanticMask = deriveAutoMovieSemanticMask({
      ...subject(),
      scene: sceneFixture({ extra: true }),
    });

  const before: Map<string, string> = new Map(
      mask.entries.map((entry: IAutoMovieSemanticMaskEntry): readonly [string, string] => [entry.id, entry.color] as const),
    );

  TestValidator.equals(
      "an unrelated prop repaints nothing and takes a colour of its own",
      namedFacts([
        [
          "existing colours held",
          (): boolean =>
            grown.entries
              .filter((entry: IAutoMovieSemanticMaskEntry): boolean => before.has(entry.id))
              .every((entry: IAutoMovieSemanticMaskEntry): boolean => before.get(entry.id) === entry.color),
        ],
        ["one new entry", (): boolean => grown.entries.length === mask.entries.length + 1],
        [
          "new entry addressable",
          (): boolean => grown.entries.some((entry: IAutoMovieSemanticMaskEntry): boolean => entry.id === "node:crate"),
        ],
        [
          "still collision-free",
          (): boolean =>
            new Set(grown.entries.map((entry: IAutoMovieSemanticMaskEntry): string => entry.color)).size ===
            grown.entries.length,
        ],
        ["digest moved", (): boolean => grown.digest !== mask.digest],
      ]),
      {
        "existing colours held": true,
        "one new entry": true,
        "new entry addressable": true,
        "still collision-free": true,
        "digest moved": true,
      },
    );
}
