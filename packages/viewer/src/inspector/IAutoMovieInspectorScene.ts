import type {
  IApplyAutoMovieInspectionProps,
  IAutoMovieCapturePlanRequest,
  IAutoMovieInspectionLegendEntry,
} from "@automovie/render";

/**
 * A subject mounted on the inspector's canvas by `mountAutoMovieInspectorScene`: the calls the component makes while it lives.
 *
 * @evidence contracts/development/design.md#principled-representation A mount is a live resource with a request in force, so it is a handle with one call to change the request and one to end it, the form the inspection handle has.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two calls the component's effects make; what the mount learns flows out through the `IReport` the component passes in.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `apply` never throws: a request the scene refuses is reported with the request still drawn, so the component sets that request back and the address stays equal to the picture.
 * @evidence contracts/development/common.md#meaningful-documentation States what the handle stands for and what each call does.
 */
export interface IAutoMovieInspectorScene {
  /**
   * Draw a new request from the next frame. Before the instance is ready the request is held and applied when it is.
   *
   * The inspection is re-applied when the request's inspection differs, the playhead moves to the request's first second when that differs, and the picture redraws. When the inspection refuses the request, such as a mark pattern that matches no kind, the previous request stays drawn and is reported through `IReport.refused` with the reason. The same request object again does nothing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when the request takes effect, what is re-applied, the refusal path and the identity rule.
   * @evidence contracts/development/implementation.md#principled-implementation The scene's inspection is restored before a new one is applied, as `applyAutoMovieInspection` requires a scene in its own state, and the previous request is re-applied when the new one throws, so the scene is never left uninspected.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call per request change, from the component's effect.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A refusal is reported and undone, never drawn half-applied.
   * @evidence contracts/development/implementation.md#efficient-algorithms One restore and one apply, each linear in the scene and its marks, only when the inspection changed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A request whose inspection writes the same text keeps the applied inspection.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one applied inspection; the replaced one is restored first.
   */
  apply(request: IAutoMovieCapturePlanRequest): void;

  /**
   * End the mount: cancel the pending frame, restore the inspection, dispose the renderer and the instance, or dispose the instance when it arrives if it has not yet. Calling it again does nothing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States everything released, the late-instance case and the repeated call.
   * @evidence contracts/development/implementation.md#principled-implementation Release runs in the reverse of acquisition, every step attempted even when one throws, so one failure cannot leak the rest.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call that the component's effect cleanup makes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The renderer's context is not forced lost, because StrictMode mounts again on the same canvas and a lost context would leave the next renderer black.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in what the inspection changed.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A release computes nothing to reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources After the call no frame is pending and the mount holds no renderer, instance or inspection.
   */
  dispose(): void;
}
export namespace IAutoMovieInspectorScene {
  /**
   * What a mount learns about its subject once the instance is ready, for the panels.
   *
   * @evidence contracts/development/design.md#principled-representation The identity paths a selection can name, the supplied marks the kinds are listed from, the view names a view can take, the subject's raster in pixels and its duration in seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Each member feeds one panel: paths the selection tree, marks the marks panel, views the view panel, the raster the canvas aspect, the duration the readout.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Paths and marks are those of the first second drawn, and the kinds are listed under the current request because a sliver limit or a trail adds kinds; marks that appear later are reached by typing a pattern.
   * @evidence contracts/development/common.md#meaningful-documentation States what each member lists and at which second.
   */
  export interface IFacts {
    /** Identity paths of every drawn object in scene order, then of every supplied mark, at the first second drawn. */
    paths: string[];

    /** The marks the subject supplies at the first second drawn; the marks panel lists the kinds a request can name from them with `listAutoMovieInspectionKinds`, under the request in force. */
    marks: NonNullable<IApplyAutoMovieInspectionProps["marks"]>;

    /** The subject's own view names, then the named viewpoints a fitted view takes. */
    views: string[];

    /** Width in pixels of a still of the subject. */
    width: number;

    /** Height in pixels of a still of the subject. */
    height: number;

    /** The subject's duration in seconds. */
    durationSeconds: number;
  }

  /**
   * The labels of one paused picture, placed for the canvas as laid out.
   *
   * @evidence contracts/development/design.md#principled-representation Positions and line height are CSS pixels of the canvas, converted from the picture pixels render's placement works in by the ratio of the canvas's size to the subject's raster, so an element placed at them sits where a capture stamps the same label.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The labels kept and the line height the component sizes them by; dropped labels are counted so the reader knows some were asked for.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No font or colour: the component owns how a label looks.
   * @evidence contracts/development/common.md#meaningful-documentation States the units and the conversion.
   */
  export interface ILabels {
    /** Each kept label: its path, its text, and its top-left corner in CSS pixels from the canvas's top-left. */
    labels: {
      /** The labelled path. */
      path: string;

      /** The text shown. */
      text: string;

      /** CSS pixels from the canvas's left edge. */
      left: number;

      /** CSS pixels from the canvas's top edge. */
      top: number;
    }[];

    /** Height of the stamp's label box in CSS pixels, which the overlap was decided for. */
    lineHeight: number;

    /** How many asked labels were dropped because they would overlap a kept one or fall outside the picture. */
    dropped: number;
  }

  /**
   * Where a mount reports what it learns; the component turns each report into state.
   *
   * @evidence contracts/development/design.md#principled-representation Five events: ready, a legend, labels, a drawing error or its end, and a refused request.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Each is read by the inspector component and nothing else.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A drawing error and a refused request are separate, because only the second changes the request.
   * @evidence contracts/development/common.md#meaningful-documentation States when each event fires.
   */
  export interface IReport {
    /**
     * The instance is ready and drawn once.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States when it fires.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback signature; the component implements it.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback signature; the component implements it.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback signature; the component implements it.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback signature; the component implements it.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback signature; the component implements it.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback signature; the component implements it.
     */
    ready(facts: IFacts): void;

    /**
     * The legend of the picture, after an apply and after every draw while paused.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States when it fires.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback signature; the component implements it.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback signature; the component implements it.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback signature; the component implements it.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback signature; the component implements it.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback signature; the component implements it.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback signature; the component implements it.
     */
    legend(entries: IAutoMovieInspectionLegendEntry[]): void;

    /**
     * The labels the request's `label` patterns place on the picture, after every draw while paused, and none once playing starts.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States when it fires and the empty case.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback signature; the component implements it.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback signature; the component implements it.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback signature; the component implements it.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback signature; the component implements it.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback signature; the component implements it.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback signature; the component implements it.
     */
    labels(placed: ILabels): void;

    /**
     * Why the last frame or the instance could not be drawn, or null once a frame draws again.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States when it fires and what null means.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback signature; the component implements it.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback signature; the component implements it.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback signature; the component implements it.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback signature; the component implements it.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback signature; the component implements it.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback signature; the component implements it.
     */
    error(message: string | null): void;

    /**
     * The scene refused a request; `request` is the one it still draws and `message` why.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States when it fires and what each argument is.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback signature; the component implements it.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A callback signature; the component implements it.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A callback signature; the component implements it.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A callback signature; the component implements it.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A callback signature; the component implements it.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A callback signature; the component implements it.
     */
    refused(request: IAutoMovieCapturePlanRequest, message: string): void;
  }
}
