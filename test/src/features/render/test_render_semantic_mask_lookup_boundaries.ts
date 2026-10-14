import {
  IAutoMovieRenderSubject,
  deriveAutoMovieSemanticMask,
  resolveAutoMovieSemanticMask,
} from "@automovie/engine";
import {
  IAutoMovieSceneNode,
  IAutoMovieSemanticMask,
  IAutoMovieSemanticMaskEntry,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSemanticMaskTestInputs } from "../internal/createSemanticMaskTestInputs";

/**
 * Unknown colour keys and broken ownership chains do not fabricate an ancestor or alternate drawable in the selected lookups.
 *
 * Scenarios:
 * 1. An unknown colour returns null and lowercase input resolves the actual door leaf.
 * 2. A dangling owner yields no ancestor; a two-node ownership cycle stops after the one distinct ancestor.
 *
 * @evidence contracts/testing.md#behavioral-verification Resolves actual and authored exceptional masks, checking unknown/lowercase colour handling and finite ancestor prefixes for missing owners or cycles.
 * @evidence contracts/testing.md#independent-expectations The declared absent owner yields zero ancestors and the two-entry a/b cycle yields only b; the actual leaf's lowercase spelling must resolve its declared id. Exceptional masks are deliberately unverified and do not certify digest/schema admission.
 * @evidence contracts/testing.md#distinguishing-cases Unknown and case-normalized colour, dangling owner and a two-node cycle retain distinct lookup branches; palette derivation and evidence admission belong to other units.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_semantic_mask_lookup_boundaries owns its cases. Portable direct lookup over resident mask records, with no sampled pixel, renderer or dynamic test registry.
 */
export function test_render_semantic_mask_lookup_boundaries(): void {
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
