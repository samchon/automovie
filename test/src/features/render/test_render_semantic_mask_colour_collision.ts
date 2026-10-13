import {
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

/**
 * A genuine hash collision resolves by ascending semantic ID and forward palette probing.
 *
 * Scenarios:
 * 1. Two independently derived IDs first demonstrate the shared hash colour.
 * 2. The smaller ID keeps that colour and the other takes its arithmetic successor regardless of declaration order.
 */
export const test_render_semantic_mask_colour_collision = (): void => {
  const { bulk } = createSemanticMaskTestInputs();

  // Two ids that genuinely land on the same palette colour. The expectation is
    // the documented rule, not a stored colour: whichever id sorts first keeps
    // the colour it hashed to, and the other takes the next one. `node:c37680`
    // sorts before `node:c5678`.
    const alone = (id: string): string =>
      deriveAutoMovieSemanticMask({
        scene: { ...sceneFixture(), nodes: [bulk(id)] },
        models: modelsFixture(),
      }).entries[0]!.color;

  const together = deriveAutoMovieSemanticMask({
      scene: {
        ...sceneFixture(),
        nodes: [bulk("node:c5678"), bulk("node:c37680")],
      },
      models: modelsFixture(),
    });

  const base = alone("node:c37680");

  TestValidator.equals(
      "a genuine colour collision is broken by the ids themselves, not by order",
      {
        collide: alone("node:c5678") === base,
        winner: together.entries.find((entry) => entry.id === "node:c37680")
          ?.color,
        loser: together.entries.find((entry) => entry.id === "node:c5678")?.color,
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
};
