import { TestValidator } from "@nestia/e2e";

import { drawEyelashTexture, type IEyelashCard, type IEyelashNorm } from "../../../scripts/face-review/prepareEyelashBasis";

/**
 * The same 5mm fibre stays continuous when its UV atlas is sheared and
 * translated. Its 20 by10mm physical card and0.05mm diameter remain fixed.
 * UV spans0.6 of the100px atlas across10mm, so5mm crosses30 image rows;
 * every interior row52..78 must contain positive coverage in every phase.
 * Disk stamps previously left missing rows at shifts0.002 and0.006.
 *
 * Scenarios:
 * 1. Five UV translations cover the same interior rows on a sheared card.
 * 2. Every image is repeatable, and geometry/norm inputs stay unchanged.
 */
export const test_subject_eyelash_subpixel_continuity = (): void => {
  const norm: IEyelashNorm = { region: "lash", material: "lash", count: 1,
    length: { medial: 5, central: 5, lateral: 5 }, diameter: 0.05, growing: 0 };
  for (const shift of [0, 0.002, 0.004, 0.006, 0.008]) {
    const left = 0.2 + shift;
    const right = 0.8 + shift;
    const card: IEyelashCard = {
      root: [[left, 0.8], [right, 0.8]], tip: [[left + 0.05, 0.2], [right + 0.05, 0.2]], lateralFirst: false,
      triangles: [
        { uv: [[left, 0.8], [right, 0.8], [right + 0.05, 0.2]], xyz: [[0, 0, 0], [0.02, 0, 0], [0.02, 0.01, 0]] },
        { uv: [[left, 0.8], [right + 0.05, 0.2], [left + 0.05, 0.2]], xyz: [[0, 0, 0], [0.02, 0.01, 0], [0, 0.01, 0]] },
      ],
    };
    const snapshot = JSON.stringify({ card, norm });
    const image = drawEyelashTexture({ cards: [card], norm, size: 100, seed: 3 });
    for (let y = 52; y <= 78; ++y)
      TestValidator.predicate("continuous physical fibre across UV phase",
        new Array<number>(100).fill(0).some((_, x) => image[4 * (100 * y + x) + 3] > 0));
    TestValidator.equals("deterministic atlas pixels", image,
      drawEyelashTexture({ cards: [card], norm, size: 100, seed: 3 }));
    TestValidator.equals("caller card and norm remain unchanged", JSON.stringify({ card, norm }), snapshot);
  }
};
