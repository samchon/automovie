import {
  autoMovieRenderHash32,
  deriveAutoMovieSemanticMask,
} from "@automovie/engine";
import { IAutoMovieSemanticMaskEntry } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSemanticMaskTestInputs } from "../internal/createSemanticMaskTestInputs";
import { modelsFixture, sceneFixture } from "../internal/renderFixtures";

/**
 * A genuine hash collision resolves by ascending semantic ID and forward palette probing.
 *
 * Scenarios:
 * 1. The two authored IDs produce the same standalone palette colour.
 * 2. The smaller ID keeps that colour and the other takes its arithmetic successor regardless of declaration order.
 * 3. Empty, ASCII, multibyte, astral and lone-surrogate strings match an independent UTF-8 Math.imul FNV-1a oracle.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual FNV hashing and palette derivation, detecting incorrect prime multiplication and checking deterministic id-order collision probing from independently derived expected colour.
 * @evidence contracts/testing.md#independent-expectations Node Buffer provides UTF-8 bytes and Math.imul multiplies by 0x01000193 after XOR; the documented nonbackground RGB mapping supplies the expected palette slot independently of derivation. This is a CPU byte/hash oracle, not GPU colour readback.
 * @evidence contracts/testing.md#distinguishing-cases Empty, ASCII, multibyte, astral and lone-surrogate inputs cover encoding; the genuine node:c429/node:c6250 pair authored in reverse order covers collision priority and successor assignment.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_semantic_mask_colour_collision owns its cases. Portable Engine hash and metadata calls with an independent CPU arithmetic oracle, without foreign mutation or renderer launch.
 */
export function test_render_semantic_mask_colour_collision(): void {
  const oracle: (text: string) => number = (text: string): number => {
    let hash: number = 0x811c9dc5;
    for (const byte of Buffer.from(text, "utf8"))
      hash = Math.imul(hash ^ byte, 0x01000193) >>> 0;
    return hash;
  };
  const samples: string[] = [
    "",
    "a",
    "foobar",
    "\u00E9",
    "\u{1F600}",
    String.fromCharCode(0xd800),
    String.fromCharCode(0xdc00),
  ];
  TestValidator.equals(
    "the hash multiplies by the actual FNV-1a prime",
    samples.map(autoMovieRenderHash32),
    samples.map(oracle),
  );
  const {
    bulk,
  }: Pick<
    ReturnType<typeof createSemanticMaskTestInputs>,
    "bulk"
  > = createSemanticMaskTestInputs();

  // Two ids that genuinely land on the same palette colour. The expectation is
  // the documented rule, not a stored colour: whichever id sorts first keeps
  // the colour it hashed to, and the other takes the next one. `node:c429`
  // sorts before `node:c6250`.
  const alone: (id: string) => string = (id: string): string =>
    deriveAutoMovieSemanticMask({
      scene: { ...sceneFixture(), nodes: [bulk(id)] },
      models: modelsFixture(),
    }).entries[0]!.color;

  const together: ReturnType<typeof deriveAutoMovieSemanticMask> =
    deriveAutoMovieSemanticMask({
      scene: {
        ...sceneFixture(),
        nodes: [bulk("node:c6250"), bulk("node:c429")],
      },
      models: modelsFixture(),
    });

  const base: string = `#${(1 + (oracle("node:c429") % 0xffffff)).toString(16).toUpperCase().padStart(6, "0")}`;
  TestValidator.equals(
    "the first palette slot follows the independent RGB hash law",
    alone("node:c429"),
    base,
  );

  TestValidator.equals(
    "a genuine colour collision is broken by the ids themselves, not by order",
    {
      collide: alone("node:c6250") === base,
      winner: together.entries.find(
        (entry: IAutoMovieSemanticMaskEntry): boolean =>
          entry.id === "node:c429",
      )?.color,
      loser: together.entries.find(
        (entry: IAutoMovieSemanticMaskEntry): boolean =>
          entry.id === "node:c6250",
      )?.color,
    },
    {
      collide: true,
      winner: base,
      loser: `#${(Number.parseInt(base.slice(1), 16) + 1)
        .toString(16)
        .toUpperCase()
        .padStart(6, "0")}`,
    },
  );
}
