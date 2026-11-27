import type { IObserveAutoMoviePlacedSceneResult } from "./IObserveAutoMoviePlacedSceneResult.js";
import type { IObserveAutoMoviePlacedSceneProps } from "./IObserveAutoMoviePlacedSceneProps.js";
import type { IObserveAutoMoviePlacedSceneCheck } from "./IObserveAutoMoviePlacedSceneCheck.js";
import type { ISelectAutoMoviePlacedChecksProps } from "./ISelectAutoMoviePlacedChecksProps.js";
import {
  type IAutoMovieMark,
  type IAutoMovieInspectionTrail,
  type IAutoMovieInspectionDiagnostics,
  type IAutoMovieInspectionLegendEntry,
  type IAutoMovieInspectionLabelPlacement,
  type IAutoMoviePlanInspectionTrailTimesProps,
  type IAutoMovieVector3,
  type IAutoMovieInspectionFocus,
  type AutoMovieInspectionShade,
  type IAutoMovieSectionPlane,
  type IAutoMovieSceneCollision,
  type IAutoMoviePreparePhysicalGeometry,
  type IAutoMovieSweptCapsuleCollision,
  type IAutoMovieObservedRenderResult,
} from "@automovie/interface";

import type * as THREE from "three";
import type { IAutoMovieSectionRenderer } from "./IAutoMovieSectionRenderer.js";
import type { IAutoMovieInspectionPath } from "./IAutoMovieInspectionPath.js";
import type { AutoMovieRenderInspectionGeometry } from "./AutoMovieRenderInspectionGeometry.js";
import type { IAutoMovieRendererFrameCounters } from "./IAutoMovieRendererFrameCounters.js";
import { observeAutoMovieRendererFrameImplementation } from "./inspection/internal/observeAutoMovieRendererFrameImplementation.js";
import { selectAutoMoviePlacedChecks as selectAutoMoviePlacedChecksImplementation } from "./inspection/internal/selectAutoMoviePlacedChecks.js";
import { observeAutoMoviePlacedSceneImplementation } from "./inspection/internal/observeAutoMoviePlacedSceneImplementation.js";
import { observeAutoMovieSceneCollisionImplementation } from "./inspection/internal/observeAutoMovieSceneCollisionImplementation.js";
import { observeAutoMovieCollisionMotionImplementation } from "./inspection/internal/observeAutoMovieCollisionMotionImplementation.js";
import type { IAutoMovieViewerSubjectBounds } from "./IAutoMovieViewerSubjectBounds.js";
import { focusAutoMovieInspection as focusAutoMovieInspectionImplementation } from "./inspection/internal/focusAutoMovieInspection.js";
import { applyAutoMovieInspectionSectionImplementation } from "./inspection/internal/applyAutoMovieInspectionSectionImplementation.js";
import { applyAutoMovieInspectionShadeImplementation } from "./inspection/internal/applyAutoMovieInspectionShadeImplementation.js";
import { markAutoMovieInspectionTrails as markAutoMovieInspectionTrailsImplementation } from "./inspection/internal/markAutoMovieInspectionTrails.js";
import { type IAutoMovieInspectionHandle } from "./IAutoMovieInspectionHandle.js";
import { type IApplyAutoMovieInspectionProps } from "./IApplyAutoMovieInspectionProps.js";
import { applyAutoMovieInspection as applyAutoMovieInspectionImplementation } from "./inspection/internal/applyAutoMovieInspection.js";
import { compareAutoMovieInspectionFindings as compareAutoMovieInspectionFindingsImplementation } from "./inspection/internal/compareAutoMovieInspectionFindings.js";
import { type IRenderAutoMovieInspectionDiagnosticsProps } from "./IRenderAutoMovieInspectionDiagnosticsProps.js";
import { renderWithAutoMovieInspectionDiagnostics as renderWithAutoMovieInspectionDiagnosticsImplementation } from "./inspection/internal/renderWithAutoMovieInspectionDiagnostics.js";

import { planAutoMovieInspectionTrailTimes as planAutoMovieInspectionTrailTimesImplementation } from "./inspection/internal/planAutoMovieInspectionTrailTimes.js";
import { sampleAutoMovieInspectionTrails as sampleAutoMovieInspectionTrailsImplementation } from "./inspection/internal/sampleAutoMovieInspectionTrails.js";
import { placeAutoMovieInspectionLabels as placeAutoMovieInspectionLabelsImplementation } from "./inspection/internal/placeAutoMovieInspectionLabels.js";

/** Public operations for Auto Movie Render Inspection. */
export namespace AutoMovieRenderInspection {
  /** Props for observing renderer-confirmed work from one complete frame. */
  export interface IObserveRendererFrameProps<Output> {
    /** Renderer submission counters for the drawn frame. */
    renderer: IAutoMovieRendererFrameCounters;
    /** Draw one complete frame. */
    draw: () => Output;
  }

  /**
   * Draw one complete frame while measuring renderer-confirmed submissions.
   *
   * `WebGLRenderer.info` is the authority for calls and triangles because it is
   * updated after camera layers, frustum culling, geometry groups, draw ranges,
   * and material visibility have selected the work that reaches the renderer.
   * Disabling its per-render reset makes the measurement frame-wide: a dissolve
   * therefore includes the outgoing draw, incoming draw, and composite pass.
   *
   * The remaining budget dimensions deliberately stay `null`. Three exposes
   * renderer-lifetime allocations for some of them and no post-culling frame
   * count for the rest; a scene traversal would be an estimate, not an
   * observation.
   */
  export function observeRendererFrame<Output>(
    props: IObserveRendererFrameProps<Output>,
  ): IAutoMovieObservedRenderResult<Output> {
    return observeAutoMovieRendererFrameImplementation(
      props.renderer,
      props.draw,
    );
  }
  /** Named input contract for applying a clipping section to a scene. */
    /** Scene, renderer and clipping plane for the inspection section. */
    export interface IApplySectionProps {
      /** Scene whose drawn materials receive the section plane. */
      scene: THREE.Scene;
      /** Renderer whose local clipping switch is borrowed. */
      renderer: IAutoMovieSectionRenderer;
      /** Half-space removed from the scene. */
      section: IAutoMovieSectionPlane;
    }
  /** Named input and result contracts for applying an inspection shade. */
    /** Scene and shade to apply to its materials. */
    export interface IApplyShadeProps {
      /** Scene whose materials are shaded. */
      scene: THREE.Scene;
      /** Inspection shade to apply. */
      shade: AutoMovieInspectionShade;
    }
    /** Controls for updating the shade and restoring the scene. */
    export interface IApplyShadeResult {
      /** Bring the shade up to date before drawing. */
      update: () => void;
      /** Restore the scene's original materials. */
      restore: () => void;
    }
  /** Cut drawn scene materials and return a restoration callback. */
  export function applySection(props: IApplySectionProps): () => void {
    return applyAutoMovieInspectionSectionImplementation(props);
  }
  /** Apply a named inspection shade and return update and restore operations. */
  export function applyShade(props: IApplyShadeProps): IApplyShadeResult {
    return applyAutoMovieInspectionShadeImplementation(props.scene, props.shade);
  }
  /** Named input contract for the focus operation. */
    /** A mark and the object whose frame it belongs to, when anchored. */
    export interface IFocusMark {
      /** Inspection mark to frame or highlight. */
      mark: IAutoMovieMark;
      /** Scene-space point used to anchor the mark. */
      anchor: THREE.Object3D | null;
    }

    /** What to frame and the drawn geometry from which its bounds are measured. */
    export interface IFocusProps {
      /** What to frame. */
      focus: IAutoMovieInspectionFocus;
      /** The drawn, selected objects. */
      objects: readonly IAutoMovieInspectionPath[];
      /** The drawn marks with the objects their frames belong to. */
      marks: readonly IFocusMark[];
    }
  /**
   * Measure the world-space box a view's focus frames: the drawn objects and
   * marks a path pattern matches, or every drawn flagged mark, so a close-up on a
   * part or on a defect's region is one request.
   *
   * The boxes are those `AutoMovieRenderInspectionGeometry.measurePaths` measures, joined into
   * one. It throws when a pattern matches nothing drawn, and when the flagged
   * focus finds no flagged mark, saying no mark is flagged.
   */
  export function focus(props: IFocusProps): IAutoMovieViewerSubjectBounds {
    return focusAutoMovieInspectionImplementation(props);
  }
  /** Operations for production policy active on a placed scene. */
    /** Named inputs for checking collisions between consecutive placed frames. */
      /** A collision layer readable at any placed instant. */
      export interface IPlacedSceneCollisionMotionLayer extends AutoMovieRenderInspectionGeometry.ILayer {
        /** Distinct layer identity, shared with placed-frame rows. */
        readonly id: string;
        /** Layer-local seconds at this instant. */
        readonly localSeconds: number;
        /** Whether delivery requires this layer's collision obligations. */
        readonly required?: boolean;
        /** Named permitted contact. */
        readonly allowances?: readonly IAutoMovieSceneCollision.IAllowance[];
      }

      /** Work the observation may spend. */
      export interface IPlacedSceneCollisionMotionLimits {
        /** Extra instants that may be placed, including the preceding one. */
        placements: number;
        /** Halvings of the span allowed for one pair. */
        depth: number;
        /** Pair and witness comparisons. */
        comparisons: number;
        /** Posed surface vertices read for witnesses. */
        posedVertices: number;
        /** Triangle visits spent on closed surfaces. */
        surfaceTriangles: number;
        /** Collected parts over every placed instant, when bounded. */
        parts?: number;
      }

      /** The span, placement, layers and limits of one motion observation. */
      export interface IPlacedSceneCollisionMotionProps {
        /** The drawn sample's clock. */
        readonly time: IAutoMovieInspectionDiagnostics.ITime;
        /** Film seconds of the preceding output instant. */
        readonly fromSeconds: number;
        /** Whether the span between the two instants has a physical path. */
        readonly continuous: boolean;
        /** Places the scene at a film second through the playback placement. */
        readonly place: (filmSeconds: number) => void;
        /** Collision layers of the placed scene at a film second. */
        readonly layers: (filmSeconds: number) => readonly IPlacedSceneCollisionMotionLayer[];
        /** The initialized convex contact query. */
        readonly geometry: Pick<IAutoMoviePreparePhysicalGeometry.IQueries, "contact">;
        /** Work the observation may spend. */
        readonly limits: IPlacedSceneCollisionMotionLimits;
        /** Filled at return with the work spent. */
        readonly spent?: IPlacedSceneCollisionMotionLimits;
      }
    /** Named inputs and result for placed-scene collision observation. */
      /** Work one observation may spend, by kind. */
      export interface IPlacedSceneCollisionLimits {
        /** Group, region, part, shape and witness comparisons. */
        comparisons: number;
        /** Posed surface vertices read for witnesses. */
        posedVertices: number;
        /** Triangle visits spent testing points against closed surfaces. */
        surfaceTriangles: number;
        /** Elementary motion intervals. */
        sweptCells: number;
        /** Collected parts, when bounded; a frame that runs out defers its layer. */
        parts?: number;
      }

      /** Source-certified motion cell between two named parts. */
      export interface IPlacedSceneCollisionSweptCell {
        /** The two part paths. */
        readonly paths: readonly [string, string];
        /** The Engine cell, without the depth the layer's windows decide. */
        readonly props: Omit<IAutoMovieSweptCapsuleCollision.IProps, "maxPenetration">;
        /** Film seconds minus layer seconds. */
        readonly filmOffset: number;
      }

      /** One source-owned layer after placement and world-matrix update. */
      export interface IPlacedSceneCollisionLayer extends AutoMovieRenderInspectionGeometry.ILayer {
        /** Distinct layer identity, the first element of every coverage key. */
        id: string;
        /** Layer-local seconds of this placement. */
        localSeconds: number;
        /** The layer's shot path, when known. */
        shotPath?: string;
        /** Whether delivery requires every collision obligation of this layer. */
        required?: boolean;
        /** Named permitted contact for placed frames and motion cells. */
        allowances?: readonly IAutoMovieSceneCollision.IAllowance[];
        /** Source-certified motion cells with permitted depth from allowances. */
        sweeps?: readonly IPlacedSceneCollisionSweptCell[];
      }

      /** The placed frame, layers, initialized contact query and work limits. */
      export interface IPlacedSceneCollisionProps {
        /** The sample clock. */
        time: IAutoMovieInspectionDiagnostics.ITime;
        /** The placed layers. */
        layers: readonly IPlacedSceneCollisionLayer[];
        /** The initialized convex contact query. */
        geometry: Pick<IAutoMoviePreparePhysicalGeometry.IQueries, "contact">;
        /** Broad-phase refinement of overlapping groups. */
        refinement?: IAutoMovieSceneCollision.IProps["refinement"];
        /** Work the observation may spend. */
        limits: IPlacedSceneCollisionLimits;
        /** Filled at return with the work actually spent, for budget measurement. */
        spent?: IPlacedSceneCollisionLimits;
      }

      /** Collision findings and coverage rows for the frame. */
      export type IPlacedSceneCollisionResult = Pick<IAutoMovieInspectionDiagnostics, "findings" | "coverage">;
    /**
     * Select the production's declared checks active at one placed sample, for
     * `AutoMovieRenderInspection.observePlacedScene`.
     *
     * A support or grip contributes its phase or window containing the sample
     * second. Custody contributes the holder its schedule allows at that second and
     * reads the actual holder from the displayed scene graph. A continuity track
     * contributes its authored record at the live shot clock and, from the second
     * output frame on, the step from the previous output frame. The cut decides
     * that step's boundary and both shot clocks, so a retime, a seam, a transition,
     * a cut and a declared break follow the playback mapping, and the rate limits
     * apply over the elapsed shot-local seconds. A step whose endpoint record is
     * itself invalid is not compared; the record check reports it.
     *
     * Nothing depends on a previous call, so a sample yields the same checks
     * whether it is reached forward, backward or by a jump.
     *
     * @param props The placed sample, the output rate and the declarations.
     * @returns The observer's checks for this sample, in declaration order.
     */
    export function selectPlacedChecks(
      props: ISelectAutoMoviePlacedChecksProps,
    ): IObserveAutoMoviePlacedSceneCheck[] {
      return selectAutoMoviePlacedChecksImplementation(props);
    }
    /**
     * Observe displayed native placement and the source checks selected for a
     * placed sample. It reads current world matrices and never seeks or chooses
     * intended contact ownership itself.
     *
     * @param props The original scene, delivery camera, placed clock and checks.
     * @returns Findings and coverage for this placed observation.
     */
    export function observePlacedScene(
      props: IObserveAutoMoviePlacedSceneProps,
    ): IObserveAutoMoviePlacedSceneResult {
      return observeAutoMoviePlacedSceneImplementation(props);
    }
    /**
     * Observe one already placed scene frame for external contact and certified
     * interval violations. Every drawn object of a layer is collected once; the
     * result reports confirmed findings and unresolved coverage under the
     * supplied work limits.
     *
     * @param props The clock, layers, contact query, refinement and work limits.
     * @returns Findings and coverage rows for the frame.
     */
    export function observePlacedSceneCollisions(
      props: IPlacedSceneCollisionProps,
    ): IPlacedSceneCollisionResult {
      return observeAutoMovieSceneCollisionImplementation(props);
    }
    /**
     * Check the motion between the preceding output instant and the placed one for
     * crossings that neither placed frame shows, by bounded subdivision.
     *
     * Both endpoints are placed through the subject's own synchronous placement. A
     * pair is examined when it is external, neither endpoint confirms it, its
     * motion exceeds half the thinner part's thickness, and its conservative swept
     * bounds overlap: each endpoint box enlarged by half of the part's largest
     * feature displacement, which covers a rotation of up to half a turn. The
     * interval is bisected at placed instants until a midpoint confirms the pair,
     * every remaining span moves less than that half-thickness or leaves the swept
     * bounds apart, or the placement or depth limit is reached. No interval
     * crossing a cut or a declared break is examined. The drawn instant is placed
     * again before returning, so every host keeps drawing it.
     *
     * @param props The span, its continuity, the placement and layer readers, the
     *   contact query and the work limits.
     * @returns Sub-frame findings with their bracketing span, and one coverage row
     *   per layer and per unresolved pair.
     */
    export function observePlacedSceneCollisionMotion(
      props: IPlacedSceneCollisionMotionProps,
    ): IPlacedSceneCollisionResult {
      return observeAutoMovieCollisionMotionImplementation(props);
    }
  /**
   * Draw sampled trails as marks for one drawn second: each moving object's path
   * as a line through its samples with a tick at every sample, and the sample of
   * the drawn second emphasised.
   *
   * Per trail, at path `<object path>/trail`: a polyline of kind `trail` through
   * the samples in time order, a points mark of the same kind with one tick per
   * sample, and a points mark of kind `trail/now` at the sample whose second is
   * nearest `seconds`, the earlier one on a tie. A stationary trail has no line
   * and one tick. Both kinds are in world metres and unanchored.
   *
   * | Kind        | Label                       | Colour               |
   * | ----------- | --------------------------- | -------------------- |
   * | `trail`     | `trail`                     | Chocolate `d2691e`   |
   * | `trail/now` | `trail at the drawn second` | Dodger blue `1e90ff` |
   *
   * @param trails The trails, as `AutoMovieRenderInspection.sampleTrails` returns them.
   * @param seconds The drawn film second.
   * @returns For each trail its line, when it moves, then its ticks, then its
   *   emphasised tick.
   */
  export function markTrails(trails: readonly IAutoMovieInspectionTrail[], seconds: number): IAutoMovieMark[] {
    return markAutoMovieInspectionTrailsImplementation(trails, seconds);
  }

  /**
   * Turn a built scene into the picture an inspection request asks for, in place,
   * and return the handle that keeps its shade and marks current and puts the
   * scene back.
   *
   * The applied scene is drawn by three.js like any other, so the inspector page
   * and the draw-only function show the same picture. In order:
   *
   * 1. **Kinds.** `listAutoMovieInspectionKindOptions` admits lifetime declarations,
   *    supplied kinds, and kinds the inspection measures under the request. A
   *    `marks` pattern that matches none throws and lists the available names.
   *    Matching supplied or measured marks provide the geometry to draw.
   * 2. **Measured marks.** Asked edges and defect kinds are measured on every drawn,
   *    visible mesh that `hide` does not leave out; batched meshes are not
   *    measured. Edges drawn over a surface show how its triangles follow the
   *    form, and with `surface` off they are drawn alone; no material is switched
   *    to wireframe.
   * 3. **Selection.** Every drawn object and every mark of an asked kind has a path,
   *    and a mark's path extends the path of the object it belongs to, so one
   *    pattern selects, hides, labels and colours objects and marks alike:
   *    `parts=hero/torso/section/3` draws one curve. An object or a mark is
   *    selected when `parts` is empty or one of its patterns matches, and no
   *    `hide` pattern matches; a mark whose anchor object is invisible or matched
   *    by `hide` is left out too. A `parts`, `hide`, `label` or `color` pattern
   *    that matches no object, mark or kind throws before anything changes, so a
   *    mistyped name is not an empty picture.
   * 4. **Isolation.** Unselected objects, and every mesh when `surface` is off, are
   *    taken off all layers. A layer is tested per object, so the objects beneath
   *    an isolated one stay as they were selected, which hiding it would not
   *    allow.
   * 5. **Shade.** Surfaces are coloured by `shade`. The `outline` pass draws its
   *    shells around the selected meshes only. The `pose` pass draws the skeleton
   *    of the whole scene, since a bone is not a drawn object and has no path to
   *    select.
   * 6. **Colours and marks.** Meshes a `color` pattern matches take its colour as
   *    `AutoMovieRenderInspectionMaterial.colorObjects` draws it. Selected marks are drawn in
   *    their kind's colour, or the `color` a pattern gives the kind, or the flag
   *    colour when flagged, as lines `stroke` pixels wide and points three
   *    strokes across. Two kinds in one picture never share a colour, and no kind
   *    takes the flag colour or the active shade's surface colours; a clash
   *    throws naming both. With `xray` marks ignore depth.
   * 7. **Section.** With `section`, the plane is given to every material in the
   *    scene, marks included. It cuts three.js's built-in materials, the guide
   *    passes and inspection shades, and the marks. A film's own shader material
   *    is cut only when its shader includes three.js's clipping chunks.
   *
   * The legend lists each drawn kind once with its number of marks, a flag entry
   * per kind with flagged marks, and under the faces shade the two surface
   * colours with the number of surfaces shaded. `selected` lists the paths the
   * request selected, and `labels` places the names the `label` patterns ask for
   * on a picture.
   *
   * A failure at any step undoes the steps before it and throws. An engine
   * refusal while measuring a mesh is rethrown naming the mesh's path.
   *
   * ```ts
   * const inspection = applyAutoMovieInspection({
   *   scene,
   *   request,
   *   marks: production.marks?.(2.4),
   * });
   * try {
   *   production.seek(2.4);
   *   inspection.update(production.marks?.(2.4));
   *   renderer.render(scene, camera);
   * } finally {
   *   inspection.restore();
   * }
   * ```
   */
  export function apply(props: IApplyAutoMovieInspectionProps): IAutoMovieInspectionHandle {
    return applyAutoMovieInspectionImplementation(props);
  }

  /**
   * Order two observations of one finding identity by how bad their evidence is.
   *
   * Confidence orders first, a confirmed observation above a candidate; then
   * category, an error above any other; then the checker's rank, larger worse,
   * with an absent rank below every present one. Rank is compared only among
   * findings of the same identity, as `IAutoMovieInspectionDiagnostics.IWitness`
   * states, so callers pass two observations of one identity.
   *
   * @param current The observation being placed.
   * @param previous The observation it is compared with.
   * @returns A positive number when `current` is worse, a negative number when it
   *   is better, and zero when neither is.
   */
  export function compareFindings(current: IAutoMovieInspectionDiagnostics.IFinding, previous: IAutoMovieInspectionDiagnostics.IFinding): number {
    return compareAutoMovieInspectionFindingsImplementation(current, previous);
  }

  /**
   * Render one review picture with translucent red wire cubes for confirmed
   * errors and amber cubes for possible errors.
   *
   * A one-shot use of `createAutoMovieInspectionDiagnosticOverlay`: the cubes are
   * built for this picture and released before returning, including on render
   * failure.
   *
   * @param props The review scene, draw callback, actual draw raster, stroke
   *   width and optional placed diagnostics.
   * @returns Legend entries for the kinds of witnesses drawn.
   */
  export function renderDiagnostics(props: IRenderAutoMovieInspectionDiagnosticsProps): IAutoMovieInspectionLegendEntry[] {
    return renderWithAutoMovieInspectionDiagnosticsImplementation(props);
  }
  /**
   * Return ascending sample seconds around the drawn second, clipped to the
   * running interval. The drawn second is included when in range. Runtime
   * predicates remain duration > 0, closed-interval seconds, and reach/ticks
   * > 0 only; no finite check is added.
   */
  export function planTrailTimes(
    props: IAutoMoviePlanInspectionTrailTimesProps,
  ): number[] {
    return planAutoMovieInspectionTrailTimesImplementation(props);
  }

  /** Explicit input for sequential scene-trail sampling. */
  export interface ISampleTrailsProps {
    /** The scene containing the built subject. */
    scene: THREE.Scene;
    /** Path pattern selecting the objects whose trails are sampled. */
    pattern: string;
    /** Film seconds, sorted by the sampler before seeking. */
    times: readonly number[];
    /** Places the subject at a film second and resolves when it can be read. */
    seek: (seconds: number) => Promise<void>;
  }

  /**
   * Sample shallowest selected object paths in scene order, awaiting sequential
   * seeks. The scene remains at the final sample. Empty times, unmatched paths,
   * and seek failures reject. The current nonempty-times predicate does not
   * reject nonfinite entries.
   */
  export function sampleTrails(
    props: ISampleTrailsProps,
  ): Promise<IAutoMovieInspectionTrail[]> {
    return sampleAutoMovieInspectionTrailsImplementation(props);
  }

  /** Explicit input for projected inspection labels. */
  export interface IPlaceLabelsProps {
    /** Paths to label with their world-space bounds in metres. */
    boxes: readonly { path: string; min: IAutoMovieVector3; max: IAutoMovieVector3 }[];
    /** The camera used to draw the picture, with current world and projection matrices. */
    camera: THREE.Camera;
    /** Picture width in pixels. */
    width: number;
    /** Picture height in pixels. */
    height: number;
    /** Size of one label font pixel in picture pixels. */
    scale: number;
  }

  /**
   * Place labels in input order and report out-of-picture, behind-camera or
   * overlapping labels in dropped. Runtime checks dimensions and scale with
   * > 0 only, preserving acceptance of fractional and positive-infinite values.
   */
  export function placeLabels(
    props: IPlaceLabelsProps,
  ): IAutoMovieInspectionLabelPlacement {
    return placeAutoMovieInspectionLabelsImplementation(props);
  }
}
