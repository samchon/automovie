import type {
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisRun,
  IAutoMovieAnalysisSample,
} from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieAnalysisOverlayObject } from "./IAutoMovieAnalysisOverlayObject.js";
import { autoMovieAnalysisRampColor } from "./autoMovieAnalysisRampColor.js";

/**
 * Draw one analysis result as a field of coloured points.
 *
 * The overlay consumes the artifact's selected metric samples rather than
 * recomputing the measurement. That is also why it
 * refuses more than it draws: an `unsupported` or `not-run` run, a metric key
 * the run never carried, a metric that produced no value, and a metric with no
 * spatial field each throw with the run's own reason attached. A picture is the
 * most persuasive artifact a review sees, and a heatmap of an analysis nobody
 * ran would be the most effective way to launder a missing result.
 *
 * The ramp is normalized over the drawn samples unless the caller pins a
 * domain, which is what lets two instants of the same study be compared against
 * one scale instead of each being stretched to its own. A field whose values
 * are all equal is drawn at the middle of the ramp rather than dividing by a
 * zero span.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Requires a solved run, present nongapped metric and its spatial samples, then maps metric values linearly into a clamped blue/green/red ramp and Float32 point attributes; engine artifacts supply finite sample coordinates/values and meaningful units. Flat domains map to the middle; extreme finite domain subtraction and spread-argument limits remain unsupported numeric/population cases.
 * @evidence contracts/common.md#clear-and-simple-design Builds one Points object directly from the analysis artifact and attaches run/metric/unit/domain identity; the portable artifact owns measurement, while this declaration owns visualization and distinguishes borrowed from created point material.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses missing analysis/metric/field instead of manufacturing a successful image; ramp midpoint for a zero span is an explicit scale convention, and no fixture ids or foreign method replacement affect admission or color.
 * @evidence contracts/common.md#meaningful-documentation Documents solved-field admission, sample/pinned domain scaling, point size metres, flat-field convention and the borrowed-material option; disposal API states exactly which resources this object owns.
 * @evidence contracts/performance.md#efficient-algorithms Finds one metric and filters S run samples, then performs linear range/attribute construction for N selected samples; retains two 3N Float32 attributes and N sample references. The intermediate value list and variadic min/max impose an argument-count limitation for very large fields.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the artifact's completed measurement without rerunning its solver; each overlay has independent mutable geometry/material lifetime, and pinned versus automatic domains change colors so no artifact-id-only visualization cache is valid.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns one geometry and only its default material, released by returned dispose; borrowed material remains caller-owned and the selected sample array stays reachable through count. Disposal is not memoized and a geometry-dispose failure skips default-material release; partial-construction rollback is not guaranteed.
 */
export const buildAnalysisOverlayObject: (props: {
  run: IAutoMovieAnalysisRun;
  metric: string;
  size?: number;
  domain?: { min: number; max: number };
  material?: THREE.PointsMaterial;
}) => IAutoMovieAnalysisOverlayObject = (props: {
  /** Run to draw. */
  run: IAutoMovieAnalysisRun;
  /** Metric key whose spatial field is drawn. */
  metric: string;
  /**
   * Point size in world metres for the material this call creates; defaults to
   * `0.1`. A lent {@link material} keeps its own size, because the caller that
   * built it already decided.
   */
  size?: number;
  /** Explicit ramp domain; defaults to the drawn samples' own range. */
  domain?: { min: number; max: number };
  /** Point material; a vertex-coloured default is created when absent. */
  material?: THREE.PointsMaterial;
}): IAutoMovieAnalysisOverlayObject => {
  const run: IAutoMovieAnalysisRun = props.run;
  if (run.outcome.status !== "solved")
    throw new Error(
      `analysis run "${run.id}" is "${run.outcome.status}", so it has no field to draw: ${run.outcome.reason}`,
    );
  const metric: IAutoMovieAnalysisMetric | undefined = run.outcome.metrics.find(
    (entry: IAutoMovieAnalysisMetric): boolean => entry.key === props.metric,
  );
  if (metric === undefined)
    throw new Error(
      `analysis run "${run.id}" carries no metric "${props.metric}" to draw`,
    );
  if (metric.value === null)
    throw new Error(
      `analysis run "${run.id}" produced no value for "${props.metric}", so it has no field to draw: ${metric.gap!.reason}`,
    );
  const samples: IAutoMovieAnalysisSample[] = run.outcome.samples.filter(
    (sample: IAutoMovieAnalysisSample): boolean => sample.key === props.metric,
  );
  if (samples.length === 0)
    throw new Error(
      `analysis run "${run.id}" measured "${props.metric}" but recorded no spatial samples of it, so there is no field to draw`,
    );
  const size: number = props.size ?? 0.1;
  if (!Number.isFinite(size) || size <= 0)
    throw new Error(
      `an analysis overlay point size must be a finite number above zero, but was ${size}`,
    );

  const values: number[] = samples.map(
    (sample: IAutoMovieAnalysisSample): number => sample.value,
  );
  const min: number = props.domain?.min ?? Math.min(...values);
  const max: number = props.domain?.max ?? Math.max(...values);
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min)
    throw new Error(
      `an analysis overlay ramp domain must be a finite range with max at or above min, but was [${min}, ${max}]`,
    );
  const span: number = max - min;

  const positions: Float32Array<ArrayBuffer> = new Float32Array(
    samples.length * 3,
  );
  const colors: Float32Array<ArrayBuffer> = new Float32Array(
    samples.length * 3,
  );
  samples.forEach((sample: IAutoMovieAnalysisSample, index: number): void => {
    positions[index * 3] = sample.position.x;
    positions[index * 3 + 1] = sample.position.y;
    positions[index * 3 + 2] = sample.position.z;
    // A flat field has no spread to normalize, so it is drawn at the middle of
    // the ramp: the alternative is a division by zero that paints every sample
    // the same accidental colour.
    const color: { r: number; g: number; b: number } =
      autoMovieAnalysisRampColor(
        span === 0 ? 0.5 : (sample.value - min) / span,
      );
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  });

  const geometry: THREE.BufferGeometry<
    THREE.NormalBufferAttributes,
    THREE.BufferGeometryEventMap
  > = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  const owned: boolean = props.material === undefined;
  const material: THREE.PointsMaterial =
    props.material ??
    new THREE.PointsMaterial({
      size,
      vertexColors: true,
      sizeAttenuation: true,
    });
  const object: THREE.Points<
    THREE.BufferGeometry<
      THREE.NormalBufferAttributes,
      THREE.BufferGeometryEventMap
    >,
    THREE.PointsMaterial,
    THREE.Object3DEventMap
  > = new THREE.Points(geometry, material);
  object.name = `analysis:${run.id}:${props.metric}`;
  object.userData.autoMovieAnalysis = {
    run: run.id,
    domain: run.domain,
    metric: metric.key,
    unit: metric.unit,
    status: metric.status,
    min,
    max,
    digest: run.digest,
  };
  return {
    object,
    dispose: (): void => {
      geometry.dispose();
      if (owned) material.dispose();
    },
    count: (): number => samples.length,
    range: (): { min: number; max: number } => ({ min, max }),
  };
};
