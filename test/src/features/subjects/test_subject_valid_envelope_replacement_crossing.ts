import {
  type IAutoMovieHumanFaceBasis,
  createPortraitMaterials,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { prepareValidEnvelopeBasis } from "../../../scripts/face-review/prepareValidEnvelopeBasis";
import { nclose, throwsError } from "../internal/predicates";

/** A vertical blade at a fixed Y, crossing z=0 within x=0.25..0.29545. */
const blade = (y: number): number[] => [
  0.25,
  y,
  -0.1,
  0.25,
  y,
  1,
  0.75,
  y,
  1,
];

/**
 * The basis preparer must reject a new crossing even when an old one disappears.
 * A unit XY host intersects the first blade at Y=0.25. A shape moves it toward
 * Y=2 while moving another blade from Y=2 toward Y=0.25. The latter enters the
 * host after weight 5/7, so the last clear tenth-step is 0.7. At weight one the
 * aggregate crossing count equals the source's one, but its pair is different.
 *
 * Scenarios:
 * 1. Automatic admission narrows the endpoint to 0.7 and preserves the source.
 * 2. An explicitly requested 0.9 endpoint refuses for its newly crossing pair.
 */
export const test_subject_valid_envelope_replacement_crossing = (): void => {
  const indices = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const basis: IAutoMovieHumanFaceBasis = {
    id: "replacement/1",
    channels: [
      {
        id: "swap",
        kind: "shape",
        minimum: 0,
        maximum: 1,
        positive: "swap.positive",
        negative: null,
      },
    ],
    surfaces: [
      {
        id: "skin",
        positions: [0, 0, 0, 1, 0, 0, 0, 1, 0, ...blade(0.25), ...blade(2)],
        indices,
        targets: {
          "swap.positive": [3, 4, 5, 6, 7, 8].flatMap((vertex) => [
            vertex,
            0,
            vertex < 6 ? 1.75 : -1.75,
            0,
          ]),
        },
        regions: [{ id: "skin/skin", material: "skin", indices, uvs: null }],
      },
    ],
    materials: createPortraitMaterials().filter((one) => one.id === "skin"),
  };
  const source = JSON.stringify(basis);
  const input = {
    basis,
    documents: [
      { id: "doc", name: "doc", basis: basis.id, shape: {}, expression: {} },
    ],
    controls: { basis: basis.id, groups: [] },
    revision: "replacement/2",
    surface: "skin",
    contact: [],
    step: 0.1,
    limits: [{ channel: "swap", side: "maximum" as const }],
  };
  const prepared = prepareValidEnvelopeBasis(input);
  TestValidator.predicate(
    "automatic end precedes the new pair",
    nclose(prepared.basis.channels[0].maximum, 0.7, 1e-12),
  );
  TestValidator.predicate(
    "requested crossing end refuses",
    throwsError(
      () =>
        prepareValidEnvelopeBasis({
          ...input,
          limits: [{ ...input.limits[0], value: 0.9 }],
        }),
      "not fault-free",
    ),
  );
  TestValidator.equals("caller basis is unchanged", JSON.stringify(basis), source);
};
