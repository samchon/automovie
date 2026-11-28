import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
} from "../core";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";
import { StationeryDraw } from "./internal/StationeryDraw";

/** Constructs a loose sheet or a map with a hinged panel. */
export namespace AutoMovieArchetypePaper {
  /**
   * Build a loose sheet resting flat on its bottom face.
   *
   * Its head lies toward model `-Z` and its near pinch is inset 0.02 metres
   * from the `+Z` edge. The writing frame lies on the upper face.
   *
   * @param params Optional scene ID and finite sheet dimensions in their bands.
   * @param seed Numeric seed for omitted values. Omit it for the band midpoints.
   * @returns The sheet with `grip` and `face`.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function create(
    params?: AutoMovieArchetypePaper.ISheetParams,
    seed?: number,
  ): AutoMovieArchetype<AutoMovieArchetypePaper.SheetAffordance, AutoMovieArchetypePaper.Dimension>;

  /**
   * Build a folded map with a stationary layer and one moving panel.
   *
   * The `fold` axis follows `-Z` at the `+X` crease and carries `face`
   * and `fold-edge` through 180 degrees. The face follows the panel's
   * orientation, including a downward normal at full opening.
   *
   * @param params The `foldedMap` format, optional ID and applicable band dimensions.
   * @param seed Numeric seed for omitted values. Omit it for a 0.11 by 0.25
   *   metre map with total folded thickness of 0.007 metres.
   * @returns The map with moving panel and stationary support contacts.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function create(
    params: AutoMovieArchetypePaper.IFoldedMapParams,
    seed?: number,
  ): AutoMovieArchetype<AutoMovieArchetypePaper.Affordance, AutoMovieArchetypePaper.Dimension>;

  /**
   * Build a sheet or folded map from a caller-selected format.
   *
   * @param params Format plus the selected shape's optional ID and fixed values.
   * @param seed Numeric seed for the selected format's free dimensions.
   * @returns The chosen shape with the contact names applicable to that format.
   * @throws {AutoMovieArchetypeRefusal} If the format or a fixed value is inadmissible.
   */
  export function create(
    params: AutoMovieArchetypePaper.IParams,
    seed?: number,
  ): AutoMovieArchetype<AutoMovieArchetypePaper.Affordance, AutoMovieArchetypePaper.Dimension>;

  /**
   * Build the selected paper format. The default sheet and folded map use
   * their own dimension bands and contact geometry.
   */
  export function create(
    params: AutoMovieArchetypePaper.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<AutoMovieArchetypePaper.Affordance, AutoMovieArchetypePaper.Dimension> {
    const format: AutoMovieArchetypePaper.Format = ArchetypeDraw.choice(
      "stationery",
      "format",
      params.format === undefined ? "sheet" : params.format,
      AutoMovieArchetypePaper.FORMATS,
    );

    const {
      builder,
      d,
    }: ReturnType<
      typeof StationeryDraw.prepare<
        "grip" | "face" | "fold" | "fold-edge" | "support-grip"
      >
    > = StationeryDraw.prepare<
      "grip" | "face" | "fold" | "fold-edge" | "support-grip"
    >(format === "sheet" ? "paper" : "map", params, seed);
    const width: number = d.width!;
    const length: number = d.length!;
    const thick: number = d.thickness!;
    const folded: boolean = format === "foldedMap";
    const baseThickness: number = folded ? thick / 2 : thick;

    builder.box(
      folded ? "map" : "sheet",
      AutoMovieEngineVector3.create(width, baseThickness, length),
      AutoMovieEngineVector3.create(0, baseThickness / 2, 0),
      { color: "#f4f2ec" },
    );
    if (folded) {
      // The crease runs between the folded layers, so both rest on the same plane when unfolded.
      const panelHeight: number = baseThickness * 1.5;
      builder.box(
        "panel",
        AutoMovieEngineVector3.create(width, baseThickness, length),
        AutoMovieEngineVector3.create(0, panelHeight, 0),
        { color: "#e4e2cd" },
      );
      builder.affordance({
        id: "fold",
        kind: "hinge",
        frame: AutoMovieArchetypeFrame.facing(
          AutoMovieEngineVector3.create(width / 2, baseThickness, 0),
          AutoMovieEngineVector3.create(0, 0, -1),
          AutoMovieEngineVector3.create(-1, 0, 0),
        ),
        extent: null,
        travel: 180,
        parts: ["panel"],
      });
      builder.affordance({
        id: "support-grip",
        kind: "handle",
        symmetry: "none",
        frame: AutoMovieArchetypeFrame.facing(
          AutoMovieEngineVector3.create(0, baseThickness / 2, length / 2),
          AutoMovieEngineVector3.create(0, 1, 0),
          AutoMovieEngineVector3.create(1, 0, 0),
        ),
        extent: null,
        grip: "precision",
        aperture: baseThickness,
        length: width,
      });
      builder.affordance({
        id: "fold-edge",
        kind: "handle",
        symmetry: "none",
        frame: AutoMovieArchetypeFrame.facing(
          AutoMovieEngineVector3.create(-width / 2, panelHeight, 0),
          AutoMovieEngineVector3.create(0, 1, 0),
          AutoMovieEngineVector3.create(0, 0, 1),
        ),
        extent: null,
        grip: "precision",
        aperture: baseThickness,
        rides: "fold",
      });
    }
    StationeryDraw.addPanelContacts(
      builder,
      { width, length, thick },
      folded ? 0 : 0.02,
      folded ? "fold" : undefined,
    );
    return builder.build(d.mass!);
  }

  /* Authorable settings, formats and contact types for the paper producer. */
  /** Selects a flat loose sheet or a two-layer map with one fold. */
  export type Format = "sheet" | "foldedMap";

  /**
   * Optional object ID and format with finite dimensions in its applicable bands.
   */
  export interface IParams {
    /** Scene object ID, defaulting to `stationery` for both formats. */
    id?: string;
    /** Width along model X, in metres within the selected format's band. */
    width?: number;
    /**
     * Head-to-foot extent along model Z, in metres within the selected band.
     */
    length?: number;
    /** Closed thickness in metres, including both layers for a folded map. */
    thickness?: number;
    /** Whole paper prop mass in kilograms within the selected band. */
    mass?: number;
    /** Chooses flat sheet or folded map. Defaults to `sheet`. */
    format?: Format;
  }

  /** Options for the default loose paper sheet. */
  export interface ISheetParams extends IParams {
    /** Selects a loose sheet. Omission has the same effect. */
    format?: "sheet";
  }

  /** Options for a folded map with moving upper panel. */
  export interface IFoldedMapParams extends IParams {
    /** Selects the two-layer hinged map. */
    format: "foldedMap";
  }

  /** The loose sheet's near-edge `grip` and upward `face`. */
  export type SheetAffordance = "grip" | "face";

  /**
   * Width, length and closed thickness in metres. Whole prop mass is in kilograms.
   */
  export type Dimension = "length" | "mass" | "thickness" | "width";

  /**
   * Common near `grip` and `face`, plus the map's `fold`, moving `fold-edge` and fixed `support-grip`.
   */
  export type Affordance =
    | "grip"
    | "face"
    | "fold"
    | "fold-edge"
    | "support-grip";

  /** Format values accepted by `create`, in gallery order. */
  export const FORMATS: readonly Format[] = ["sheet", "foldedMap"];
}
