import type { IAutoMovieInspectionKindStyle } from "@automovie/interface";

import { AutoMovieRenderInspectionPalette } from "./AutoMovieRenderInspectionPalette";

/**
 * The mark kinds the inspection itself produces, with the legend label and
 * colour each is drawn in, in the order a list of kinds shows them.
 *
 * `edge` and the `defect/<kind>` kinds are measured on the drawn meshes;
 * `trail` and `trail/now` are drawn from sampled trails. Every producer of
 * these kinds reads its label and colour here, and
 * `listInspectionKinds` lists them, so a panel, a capture plan and the
 * drawing agree. Supplied kinds are not listed: their producers own them.
 *
 * | Kind                  | Label                       | Colour               |
 * | --------------------- | --------------------------- | -------------------- |
 * | `edge`                | `mesh edge`                 | Dark blue `2b3a67`   |
 * | `defect/open`         | `open edge`                 | Red `ff3b30`         |
 * | `defect/non-manifold` | `non-manifold edge`         | Purple `b14aff`      |
 * | `defect/inconsistent` | `inconsistent edge`         | Yellow `ffcc00`      |
 * | `defect/degenerate`   | `degenerate triangle`       | White `ffffff`       |
 * | `defect/sliver`       | `sliver triangle`           | Orange `ff9500`      |
 * | `trail`               | `trail`                     | Chocolate `d2691e`   |
 * | `trail/now`           | `trail at the drawn second` | Dodger blue `1e90ff` |
 */
export const AutoMovieRenderInspectionKinds: Readonly<
  Record<string, Readonly<IAutoMovieInspectionKindStyle>>
> = {
  edge: { label: "mesh edge", color: AutoMovieRenderInspectionPalette.edge },
  "defect/open": {
    label: "open edge",
    color: AutoMovieRenderInspectionPalette.defect.open,
  },
  "defect/non-manifold": {
    label: "non-manifold edge",
    color: AutoMovieRenderInspectionPalette.defect["non-manifold"],
  },
  "defect/inconsistent": {
    label: "inconsistent edge",
    color: AutoMovieRenderInspectionPalette.defect.inconsistent,
  },
  "defect/degenerate": {
    label: "degenerate triangle",
    color: AutoMovieRenderInspectionPalette.defect.degenerate,
  },
  "defect/sliver": {
    label: "sliver triangle",
    color: AutoMovieRenderInspectionPalette.defect.sliver,
  },
  trail: { label: "trail", color: 0xd2691e },
  "trail/now": { label: "trail at the drawn second", color: 0x1e90ff },
};
