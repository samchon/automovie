import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
} from "../core";
import { StationeryDraw } from "./StationeryDraw";

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
 * @evidence contracts/development/common.md#meaningful-documentation Loose paper sheet or folding map with a shared writing-surface contract.
 * @evidence contracts/development/implementation.md#principled-implementation The folded map has a fixed base and an equal moving panel with a crease at their boundary.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The folded shape has one rigid crease. The loose sheet exposes its grip and face.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds one rigid sheet or two hinged panels with a fixed inventory of named contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createPaper(
  params?: createPaper.ISheetParams,
  seed?: number | string,
): AutoMovieArchetype<createPaper.SheetAffordance, createPaper.Dimension>;

/** The folded map adds a crease and separate grips for its two layers. */
export function createPaper(
  params: createPaper.IFoldedMapParams,
  seed?: number | string,
): AutoMovieArchetype<createPaper.Affordance, createPaper.Dimension>;

/**
 * A format selected by an authored scene resolves to one of the two paper
 * models.
 */
export function createPaper(
  params: createPaper.IParams,
  seed?: number | string,
): AutoMovieArchetype<createPaper.Affordance, createPaper.Dimension>;

/** Produce the requested format according to the contact contract above. */
export function createPaper(
  params: createPaper.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createPaper.Affordance, createPaper.Dimension> {
  const format: createPaper.Format = ArchetypeDraw.choice(
    "stationery",
    "format",
    params.format === undefined ? "sheet" : params.format,
    createPaper.FORMATS,
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

/** The paper formats and their stable names in authored scenes. */
export namespace createPaper {
  /** A loose sheet or a map that opens at one crease. */
  export type Format = "sheet" | "foldedMap";

  /** The optional scene ID, format and fixed paper dimensions. */
  export interface IParams extends Pick<
    StationeryDraw.IParams,
    "id" | "width" | "length" | "thickness" | "mass"
  > {
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
