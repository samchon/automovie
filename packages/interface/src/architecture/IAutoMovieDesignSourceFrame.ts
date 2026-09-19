import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieDesignScaleCandidate } from "./IAutoMovieDesignScaleCandidate";

/**
 * One page, sheet, or image of a design reference and how its own coordinates
 * are read as world coordinates.
 *
 * The frame owns the mapping, not the observation: a primitive is always
 * recorded in the source's own units, so a corrected scale or a corrected north
 * never rewrites what was seen. A frame whose {@link scale} is null has an
 * unsettled scale, and nothing read through it can become metric geometry.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `IAutoMovieDesignSourceFrame` as the portable data boundary for the production design generated reference requirement.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `IAutoMovieDesignSourceFrame` for the narrative intent reference lineage system contract.
 */
export interface IAutoMovieDesignSourceFrame {
  /**
   * Stable frame identity within the document.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `id` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `id` for the narrative intent reference lineage system contract.
   */
  id: string;

  /**
   * One-based page or image index inside the asset.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `page` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `page` for the narrative intent reference lineage system contract.
   */
  page: number;

  /**
   * Drawing family this frame shows.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `view` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `view` for the narrative intent reference lineage system contract.
   */
  view: "plan" | "section" | "elevation" | "detail" | "perspective";

  /**
   * Storey or datum label this frame belongs to, or null.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `level` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `level` for the narrative intent reference lineage system contract.
   */
  level: string | null;

  /**
   * Source-space extent: pixels for raster, user units for vector.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `bounds` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `bounds` for the narrative intent reference lineage system contract.
   */
  bounds: {
    /** Strictly positive width in source units. */
    width: number;

    /** Strictly positive height in source units. */
    height: number;
  };

  /**
   * Source-space point that maps onto {@link origin}.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `anchor` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `anchor` for the narrative intent reference lineage system contract.
   */
  anchor: {
    /** Finite source-space x, inside `[0, bounds.width]`. */
    x: number;

    /** Finite source-space y, inside `[0, bounds.height]`. */
    y: number;
  };

  /**
   * Every scale reading; more than one means the scale is not settled.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `scaleCandidates` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `scaleCandidates` for the narrative intent reference lineage system contract.
   */
  scaleCandidates: IAutoMovieDesignScaleCandidate[];

  /**
   * Chosen scale candidate id, or null while the scale is unknown.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `scale` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `scale` for the narrative intent reference lineage system contract.
   */
  scale: string | null;

  /**
   * World direction the frame's own +x axis points along; non-zero.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `axisX` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `axisX` for the narrative intent reference lineage system contract.
   */
  axisX: IAutoMovieVector3;

  /**
   * World direction the frame's own +y axis points along; non-zero.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `axisY` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `axisY` for the narrative intent reference lineage system contract.
   */
  axisY: IAutoMovieVector3;

  /**
   * World position of {@link anchor}, in metres.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `origin` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `origin` for the narrative intent reference lineage system contract.
   */
  origin: IAutoMovieVector3;

  /**
   * World direction the drawing calls up; non-zero.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `up` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `up` for the narrative intent reference lineage system contract.
   */
  up: IAutoMovieVector3;

  /**
   * World direction the drawing calls north, or null when unmarked.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `north` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `north` for the narrative intent reference lineage system contract.
   */
  north: IAutoMovieVector3 | null;

  /**
   * Extra world placement applied after the axis mapping, or null.
   *
   * @evidence requirements/production-design/references-and-provenance.md#production-design-generated-reference Exposes `transform` as the portable data boundary for the production design generated reference requirement.
   * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-lineage Types `transform` for the narrative intent reference lineage system contract.
   */
  transform: IAutoMovieTransform | null;
}
