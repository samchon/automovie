import {
  deriveAutoMovieSemanticMask,
  resolveAutoMovieSemanticMask,
} from "@automovie/engine";
import {
  TestValidator,
} from "@nestia/e2e";

import { createSemanticMaskTestInputs } from "../internal/createSemanticMaskTestInputs";

/**
 * Unknown pixels and broken ownership chains never fabricate an ancestor or alternate drawable.
 *
 * Scenarios:
 * 1. An unknown colour returns null and lowercase input resolves the actual door leaf.
 * 2. A dangling owner yields no ancestor; a two-node ownership cycle stops after the one distinct ancestor.
 */
export const test_render_semantic_mask_lookup_boundaries = (): void => {
  const { subject, broken, cyclic } = createSemanticMaskTestInputs();

  const mask = deriveAutoMovieSemanticMask(subject());

  const leaf = mask.entries.find(
      (entry) => entry.id === "element:tower/hall-door-leaf",
    )!;

  TestValidator.equals(
      "a colour nobody claimed, a dangling owner and a cycle never invent an answer",
      {
        unknown: resolveAutoMovieSemanticMask(mask, "#123456"),
        lowercase: resolveAutoMovieSemanticMask(mask, leaf.color.toLowerCase())!
          .entry.id,
        dangling: resolveAutoMovieSemanticMask(
          broken("space:tower/vanished"),
          "#ABCDEF",
        )!.ancestors.length,
        cyclic: resolveAutoMovieSemanticMask(cyclic(), "#ABCDEF")!.ancestors.map(
          (entry) => entry.id,
        ),
      },
      {
        unknown: null,
        lowercase: "element:tower/hall-door-leaf",
        dangling: 0,
        cyclic: ["b"],
      },
    );
};
