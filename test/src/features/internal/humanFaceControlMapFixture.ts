import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";

/** Unequal endpoint units make normalization distinguishable from averaging weights. */
export function humanFaceControlMapFixture(): {
  basis: Pick<IAutoMovieHumanFaceBasis, "id" | "channels">;
  map: IAutoMovieHumanFaceControlMap;
} {
  return {
    basis: {
      id: "analytic-coordinate-map",
      channels: [
        ["left", -2, 4],
        ["right", -4, 2],
        ["unlisted", -1, 1],
        ["positive", 0, 3],
      ].map(([id, minimum, maximum]) => ({
        id: String(id),
        kind: "shape",
        minimum: Number(minimum),
        maximum: Number(maximum),
        positive: String(id) + "+",
        negative: minimum === 0 ? null : String(id) + "-",
      })),
    },
    map: {
      basis: "analytic-coordinate-map",
      groups: [
        {
          id: "pair",
          label: "Paired feature",
          description: "A common normalized change with independent sides.",
          channels: ["left", "right"],
        },
        {
          id: "one",
          label: "One-sided domain",
          description: "A nonnegative authoring coordinate.",
          channels: ["positive"],
        },
      ],
    },
  };
}
