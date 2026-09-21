import { createHash } from "node:crypto";

import type { prepareFineBasisArtifacts } from "../../../scripts/face-review/prepareFineBasisArtifacts";
import { humanFaceBasisFixture } from "./humanFaceBasisFixture";

/**
 * A square, a discarded triangle and an independent attachment exercise the
 * preparation recipe without portrait data, Git or files. The retained square
 * is triangle one of its first region before clipping, and triangle zero after.
 * Native fields translate it in Z; unchanged document weights remain zero.
 */
export function fineBasisPreparationFixture(): Parameters<
  typeof prepareFineBasisArtifacts
>[0] {
  const { basis, document } = humanFaceBasisFixture();
  const surface = basis.surfaces[0];
  surface.positions.push(0, -2, 0, 1, -2, 0, 0, -1, 0);
  surface.indices.unshift(4, 5, 6);
  surface.regions[0].indices.unshift(4, 5, 6);
  surface.regions[0].uvs!.unshift(0, 0, 1, 0, 0, 1);
  const entries = [
    {
      id: "nativeDepth",
      channel: "depth",
      description: "Positive moves forward.",
      minimum: -1,
      maximum: 1,
      negative: "back",
    },
    {
      id: "nativeCleft",
      channel: "cleft",
      description: "Positive adds a cleft.",
      minimum: 0,
      maximum: 1,
      negative: null,
    },
  ];
  return {
    basis,
    source: structuredClone(basis),
    entries,
    components: {
      attachment: [{ id: "fixed", vertices: [0, 1, 2], motion: "fixed" }],
    },
    native: {
      surfaces: basis.surfaces.map((one, index) => {
        const bytes = Buffer.alloc(one.positions.length * 8);
        one.positions.forEach((value, i) => bytes.writeDoubleLE(value, 8 * i));
        const targets: Record<string, number[]> =
          index === 0
            ? {
                "nativeDepth.negative": [0, 0, 0, -0.1],
                "nativeDepth.positive": [0, 0, 0, 0.1],
                "nativeCleft.positive": [2, 0, 0, 0.2],
              }
            : {};
        return {
          id: one.id,
          neutralFloat64LESha256: createHash("sha256")
            .update(bytes)
            .digest("hex"),
          targets,
        };
      }),
    },
    grooms: {
      locks: {
        id: "locks",
        basis: basis.id,
        finish: { ...basis.materials[0], id: "hair", name: "Hair" },
        profile: {
          segments: 2,
          widthScale: 1,
          tipWidth: 0.5,
          taperStart: 0,
          seed: 7,
          fibres: 4,
          coverage: 0.9,
        },
        cards: [
          {
            part: "first",
            triangle: 1,
            weights: [0.25, 0.25],
            guide: [
              [0, 0, 0.01],
              [0, 0, 0.1],
            ],
            across: [
              [1, 0, 0],
              [1, 0, 0],
            ],
            width: 0.01,
          },
          {
            part: "attached",
            triangle: 0,
            weights: [0.25, 0.25],
            guide: [
              [0, 0, 0.01],
              [0, 0, 0.1],
            ],
            across: [
              [1, 0, 0],
              [1, 0, 0],
            ],
            width: 0.01,
          },
        ],
      },
    },
    documents: [
      { ...document, hair: "locks", skin: { square: [] } },
      { ...document, id: "bare" },
    ],
    controls: {
      basis: basis.id,
      groups: [
        {
          id: "depth",
          label: "Depth",
          description: "Moves forward.",
          channels: ["depth"],
        },
      ],
    },
    revision: "analytic-square/2",
    cutSurface: "square",
    minimumY: 0,
  };
}
