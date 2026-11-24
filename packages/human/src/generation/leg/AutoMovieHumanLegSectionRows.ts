import type {
  IAutoMovieHumanLegProfile,
  IAutoMovieHumanLegSectionRows,
} from "@automovie/interface";

/** Named guides and compartments on an independent circular leg section. */
export namespace AutoMovieHumanLegSectionRows {
  /**
   * Radial guide labels ordered from the anterior direction through the lateral
   * side.
   */
  const NAMES: readonly string[] = [
    "anterior",
    "anterolateral",
    "lateral",
    "posterolateral",
    "posterior",
    "posteromedial",
    "medial",
    "anteromedial",
  ];

  /** Landmarked thigh and shank compartments in the same angular order. */
  const COMPARTMENTS: readonly (readonly [string, string])[] = [
    ["quadricepsAnterior", "tibialisAnterior"],
    ["vastusLateralis", "extensorMass"],
    ["iliotibialBand", "peroneals"],
    ["bicepsFemoris", "gastrocnemiusLateral"],
    ["hamstringMedial", "gastrocnemiusMedial"],
    ["gracilisMagnus", "soleusMedial"],
    ["adductorLongus", "medialBorder"],
    ["vastusMedialis", "tibialFace"],
  ];

  /** Same analytic ordinate at quarter stations within either segment. */
  function rows(
    segment: "shank" | "thigh",
    values: readonly number[],
  ): IAutoMovieHumanLegProfile.IRow[] {
    return [1 / 4, 1 / 2, 3 / 4].map(
      (share: number): IAutoMovieHumanLegProfile.IRow => ({
        segment,
        share,
        values,
      }),
    );
  }

  /**
   * A circular section has normalized radius one and zero first and second
   * angular radius derivatives. Eight radial directions retain the named
   * anatomical guide addresses.
   */
  export const GUIDES: readonly IAutoMovieHumanLegSectionRows.IGuide[] =
    NAMES.map(
      (name: string, i: number): IAutoMovieHumanLegSectionRows.IGuide => ({
        name,
        angle: (2 * Math.PI * i) / NAMES.length,
        rows: [...rows("shank", [1, 0, 0]), ...rows("thigh", [1, 0, 0])],
      }),
    );

  /** Named compartments take the common guide interpolation with no added bulge. */
  export const SECTORS: readonly IAutoMovieHumanLegSectionRows.ISector[] =
    COMPARTMENTS.map(
      ([thigh, shank]): IAutoMovieHumanLegSectionRows.ISector => ({
        thigh,
        shank,
        thighRows: rows("thigh", [0]),
        shankRows: rows("shank", [0]),
      }),
    );
}
