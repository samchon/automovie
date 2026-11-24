import {
  deriveAutoMovieSemanticMask,
  resolveAutoMovieSemanticMask,
} from "@automovie/engine";
import {
  type IAutoMovieRenderSubject,
  IAutoMovieSceneNode,
  IAutoMovieSemanticMask,
  IAutoMovieSemanticMaskEntry,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSemanticMaskTestInputs } from "../../../internal/createSemanticMaskTestInputs";

/**
 * Unknown colour keys and broken ownership chains do not fabricate an ancestor or alternate drawable in the selected lookups.
 *
 * Scenarios:
 * 1. An unknown colour returns null and lowercase input resolves the actual door leaf.
 * 2. A dangling owner yields no ancestor; a two-node ownership cycle stops after the one distinct ancestor.
 */
export function test_unit_render_scene_semantic_mask_lookup_boundaries(): void {
  const {
    subject,
    broken,
    cyclic,
  }: {
    subject: () => IAutoMovieRenderSubject;
    bulk: (semantic: string) => IAutoMovieSceneNode;
    broken: (owner: string) => IAutoMovieSemanticMask;
    cyclic: () => IAutoMovieSemanticMask;
  } = createSemanticMaskTestInputs();

  const mask: IAutoMovieSemanticMask = deriveAutoMovieSemanticMask(subject());

  const leaf: IAutoMovieSemanticMaskEntry = mask.entries.find(
    (entry: IAutoMovieSemanticMaskEntry): boolean =>
      entry.id === "element:tower/hall-door-leaf",
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
        (entry: IAutoMovieSemanticMaskEntry): string => entry.id,
      ),
    },
    {
      unknown: null,
      lowercase: "element:tower/hall-door-leaf",
      dangling: 0,
      cyclic: ["b"],
    },
  );
}
