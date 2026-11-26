import type {
  AutoMovieVector2Tuple,
  IAutoMovieAssetProvenance,
  IAutoMovieBuildTextGeometry,
  IAutoMovieFontGlyph,
  IAutoMovieFontSource,
  IAutoMovieLayoutText,
  IAutoMovieMesh,
  IAutoMoviePlanarRegion,
  IAutoMovieTessellation,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { buildAutoMovieRaisedLettering as buildAutoMovieRaisedLetteringImplementation } from "./buildAutoMovieRaisedLettering";
import { buildAutoMovieTextGeometry as buildAutoMovieTextGeometryImplementation } from "./buildAutoMovieTextGeometry";
import { flattenAutoMovieQuadratic as flattenAutoMovieQuadraticImplementation } from "./flattenAutoMovieQuadratic";
import { layoutAutoMovieText as layoutAutoMovieTextImplementation } from "./layoutAutoMovieText";
import { regionsOfAutoMovieGlyph as regionsOfAutoMovieGlyphImplementation } from "./regionsOfAutoMovieGlyph";
import { validateAutoMovieFontSources as validateAutoMovieFontSourcesImplementation } from "./validateAutoMovieFontSources";

/** Deterministic font layout, glyph geometry and font-source admission. */
export namespace AutoMovieEngineTypography {
  /** Asset ledger context used to admit adopted font-source references. */
  export interface IFontSourceLedger {
    /** Production id whose asset uses authorize the font files. */
    production: string;

    /** Project asset provenance and use records. */
    assets: readonly IAutoMovieAssetProvenance[];
  }

  /** Extrudes a laid-out text run into closed raised lettering. */
  export function buildRaisedLettering(
    props: IAutoMovieBuildTextGeometry.IRaisedProps,
  ): IAutoMovieMesh {
    return buildAutoMovieRaisedLetteringImplementation(props);
  }

  /** Triangulates a laid-out text run as flat glyph geometry. */
  export function buildTextGeometry(
    props: IAutoMovieBuildTextGeometry.IProps,
  ): IAutoMovieTessellation {
    return buildAutoMovieTextGeometryImplementation(props);
  }

  /** Flattens a quadratic arc within a positive maximum chord error. */
  export function flattenQuadratic(
    start: Readonly<AutoMovieVector2Tuple>,
    control: Readonly<AutoMovieVector2Tuple>,
    end: Readonly<AutoMovieVector2Tuple>,
    tolerance: number,
  ): AutoMovieVector2Tuple[] {
    return flattenAutoMovieQuadraticImplementation(
      start,
      control,
      end,
      tolerance,
    );
  }

  /** Lays out text in a decoded font and a metre-sized box. */
  export function layoutText(
    props: IAutoMovieLayoutText.IProps,
  ): IAutoMovieLayoutText.IResult {
    return layoutAutoMovieTextImplementation(props);
  }

  /** Flattens and groups one glyph's contours into ink regions. */
  export function regionsOfGlyph(
    glyph: IAutoMovieFontGlyph,
    scale: number,
    tolerance: number,
  ): IAutoMoviePlanarRegion[] {
    return regionsOfAutoMovieGlyphImplementation(glyph, scale, tolerance);
  }

  /** Admits font-source records and appends any diagnostics to the collector. */
  export function validateFontSources(
    sources: readonly IAutoMovieFontSource[] | undefined,
    path: string,
    collector: IAutoMovieViolationCollector,
    ledger?: IFontSourceLedger,
  ): void {
    return validateAutoMovieFontSourcesImplementation(
      sources,
      path,
      collector,
      ledger,
    );
  }
}
