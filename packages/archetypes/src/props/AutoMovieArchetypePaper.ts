import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
} from "../core";
import { StationeryDraw } from "./StationeryDraw";

/** Constructs the paper sheet or folded map according to its recipe. */
export namespace AutoMovieArchetypePaper {
  /**
   * Loose paper sheet or folding map with a shared writing-surface contract.
   *
   * A flat sheet's grip edge lies toward model `+Z` and its head edge toward
   * model `-Z`, so `face` reads with model `-Z` as its top. A folded map's `face`
   * rides its `fold`.
   *
   * @param params The optional scene ID, paper format and any fixed dimension in
   *   metres or kilograms. The default format is a single sheet.
   * @param seed The seed for the recorded recipe. Without a seed, the draw uses
   *   the original defaults.
   * @returns The model with its named contact frames in model space.
   * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
   *   outside its admitted recipe.
   */
  export function create(
    params?: AutoMovieArchetypePaper.ISheetParams,
    seed?: number,
  ): AutoMovieArchetype<AutoMovieArchetypePaper.SheetAffordance, AutoMovieArchetypePaper.Dimension>;

  /** The folded map adds a crease and separate grips for its two layers. */
  export function create(
    params: AutoMovieArchetypePaper.IFoldedMapParams,
    seed?: number,
  ): AutoMovieArchetype<AutoMovieArchetypePaper.Affordance, AutoMovieArchetypePaper.Dimension>;

  /**
   * A format selected by an authored scene resolves to one of the two paper
   * models.
   */
  export function create(
    params: AutoMovieArchetypePaper.IParams,
    seed?: number,
  ): AutoMovieArchetype<AutoMovieArchetypePaper.Affordance, AutoMovieArchetypePaper.Dimension>;

  /** Produce the requested format according to the contact contract above. */
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
      Vector3.create(width, baseThickness, length),
      Vector3.create(0, baseThickness / 2, 0),
      { color: "#f4f2ec" },
    );
    if (folded) {
      // The crease runs between the folded layers, so both rest on the same plane when unfolded.
      const panelHeight: number = baseThickness * 1.5;
      builder.box(
        "panel",
        Vector3.create(width, baseThickness, length),
        Vector3.create(0, panelHeight, 0),
        { color: "#e4e2cd" },
      );
      builder.affordance({
        id: "fold",
        kind: "hinge",
        frame: AutoMovieArchetypeFrame.facing(
          Vector3.create(width / 2, baseThickness, 0),
          Vector3.create(0, 0, -1),
          Vector3.create(-1, 0, 0),
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
          Vector3.create(0, baseThickness / 2, length / 2),
          Vector3.create(0, 1, 0),
          Vector3.create(1, 0, 0),
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
          Vector3.create(-width / 2, panelHeight, 0),
          Vector3.create(0, 1, 0),
          Vector3.create(0, 0, 1),
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
}

/** Authorable settings, formats and contact types for the paper producer. */
export namespace AutoMovieArchetypePaper {
  /** A loose sheet or a map that opens at one crease. */
  export type Format = "sheet" | "foldedMap";

  /** The optional scene ID, format and fixed paper dimensions. */
  export interface IParams {
    /** The model's id, unique in a scene; `stationery` when absent. */
    id?: string;
    /** Fixed width along model +X, metres, within the format's band. */
    width?: number;
    /** Fixed length along model +Z, metres, within the format's band. */
    length?: number;
    /** Fixed thickness along model +Y, metres, within the format's band. */
    thickness?: number;
    /** Fixed mass in kilograms, within the format's band. */
    mass?: number;
    /** The paper shape. Omit to produce a loose sheet. */
    format?: Format;
  }

  /** The parameters of a loose sheet, the default format. */
  export interface ISheetParams extends IParams {
    /** The loose sheet, or absent for it. */
    format?: "sheet";
  }

  /** The parameters of a map that opens at one crease. */
  export interface IFoldedMapParams extends IParams {
    /** The folded map. */
    format: "foldedMap";
  }

  /** The contacts of a loose sheet. */
  export type SheetAffordance = "grip" | "face";

  /** The dimensions both formats draw, in metres and the mass in kilograms. */
  export type Dimension = "length" | "mass" | "thickness" | "width";

  /**
   * Contacts present across both formats. Only the map has the crease and the
   * layer grips.
   */
  export type Affordance =
    | "grip"
    | "face"
    | "fold"
    | "fold-edge"
    | "support-grip";

  /** Formats in their gallery order. */
  export const FORMATS: readonly Format[] = ["sheet", "foldedMap"];
}
