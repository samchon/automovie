import {
  autoMovieRenderHash32,
  deriveAutoMovieSemanticMask,
} from "@automovie/engine";
import {
  TestValidator,
} from "@nestia/e2e";
import {
  modelsFixture,
  sceneFixture,
} from "../internal/renderFixtures";

import { createSemanticMaskTestInputs } from "../internal/createSemanticMaskTestInputs";
import type { IAutoMovieSemanticMaskEntry } from "@automovie/interface";

/**
 * A genuine hash collision resolves by ascending semantic ID and forward palette probing.
 *
 * Scenarios:
 * 1. Two independently derived IDs first demonstrate the shared hash colour.
 * 2. The smaller ID keeps that colour and the other takes its arithmetic successor regardless of declaration order.
 * 3. Empty, ASCII, multibyte, astral and lone-surrogate strings match an independent UTF-8 Math.imul FNV-1a oracle.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the real hash and mask derivation; the independent multiplication oracle rejects the omitted +hash term, and the collision pair checks deterministic forward probing through actual semantic entries.
 * @evidence contracts/testing.md#independent-expectations Buffer supplies UTF-8 bytes and Math.imul multiplies by hexadecimal prime 0x01000193 after each XOR, independently of the producer's shift/add multiplication. IDs node:c429 and node:c6250 collide at RGB slot 14896115; lexical order assigns the first id that slot and the second its successor.
 * @evidence contracts/testing.md#distinguishing-cases Empty input pins the offset basis; ASCII, multibyte, astral and unpaired UTF-16 cover byte encoding, while genuinely colliding ids in reverse authored order distinguish hash arithmetic from collision resolution. Palette additions and background exclusion belong to test_render_semantic_mask_palette_stability.
 * @evidence contracts/testing.md#execution-ownership The exported portable test_render_semantic_mask_colour_collision owns synchronous cases and calls engine output without replacing globals or foreign methods; it launches no renderer, consumer or dynamic registry.
 */
export function test_render_semantic_mask_colour_collision(): void {
  const oracle: (text: string) => number = (text: string): number => {
    let hash: number = 0x811c9dc5;
    for (const byte of Buffer.from(text, "utf8"))
      hash = Math.imul(hash ^ byte, 0x01000193) >>> 0;
    return hash;
  };
  const samples: string[] = ["", "a", "foobar", "\u00E9", "\u{1F600}", String.fromCharCode(0xd800), String.fromCharCode(0xdc00)];
  TestValidator.equals("the hash multiplies by the actual FNV-1a prime", samples.map(autoMovieRenderHash32), samples.map(oracle));
  const { bulk }: Pick<ReturnType<typeof createSemanticMaskTestInputs>, "bulk"> = createSemanticMaskTestInputs();

  // Two ids that genuinely land on the same palette colour. The expectation is
    // the documented rule, not a stored colour: whichever id sorts first keeps
    // the colour it hashed to, and the other takes the next one. `node:c429`
    // sorts before `node:c6250`.
    const alone: (id: string) => string = (id: string): string =>
      deriveAutoMovieSemanticMask({
        scene: { ...sceneFixture(), nodes: [bulk(id)] },
        models: modelsFixture(),
      }).entries[0]!.color;

  const together: ReturnType<typeof deriveAutoMovieSemanticMask> = deriveAutoMovieSemanticMask({
      scene: {
        ...sceneFixture(),
        nodes: [bulk("node:c6250"), bulk("node:c429")],
      },
      models: modelsFixture(),
    });

  const base: string = alone("node:c429");

  TestValidator.equals(
      "a genuine colour collision is broken by the ids themselves, not by order",
      {
        collide: alone("node:c6250") === base,
        winner: together.entries.find((entry: IAutoMovieSemanticMaskEntry): boolean => entry.id === "node:c429")
          ?.color,
        loser: together.entries.find((entry: IAutoMovieSemanticMaskEntry): boolean => entry.id === "node:c6250")?.color,
        next: `#${(Number.parseInt(base.slice(1), 16) + 1)
          .toString(16)
          .toUpperCase()
          .padStart(6, "0")}`,
      },
      {
        collide: true,
        winner: base,
        loser: `#${(Number.parseInt(base.slice(1), 16) + 1)
          .toString(16)
          .toUpperCase()
          .padStart(6, "0")}`,
        next: `#${(Number.parseInt(base.slice(1), 16) + 1)
          .toString(16)
          .toUpperCase()
          .padStart(6, "0")}`,
      },
    );
}
