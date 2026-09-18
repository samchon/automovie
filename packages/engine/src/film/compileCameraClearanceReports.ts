import { IAutoMovieCamera, IAutoMovieCameraClearanceReport, IAutoMovieClip, IAutoMovieModel, IAutoMovieMotion, IAutoMovieScene, IAutoMovieShot, IAutoMovieShotCoverage } from "@automovie/interface";
import { validateModel } from "../validation/validateModel";
import { ViolationCollector } from "../validation/ViolationCollector";
import { evaluateCameraClearance } from "./cameraClearance";
import { computeModelRestExtent } from "./computeModelRestExtent";
import { resolveCameraAt } from "./resolveCameraAt";
import { nodeSubjectBox } from "./nodeSubjectBox";
import { IAutoMovieCameraClearanceRuntime } from "./IAutoMovieCameraClearanceRuntime";

/**
 * Compile clearance reports for every envelope-bearing delivered take and add
 * author-addressed failures to the performance collector.
 *
 * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clearance Measures the hero and coverage camera bodies against every resolved modeled scene node.
 * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-dynamic-spatial-sampling Resolves camera, actor, and object state on one shared fixed clock before conservative interval comparison.
 * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-camera-path-constraints-refusal Converts missing geometry, stale state, and body or rig contact into author-addressed performance refusal.
 */
export function compileCameraClearanceReports(props: {
  scene: IAutoMovieScene;
  hero: { camera: IAutoMovieCamera; motion: IAutoMovieShot["cameraMotion"] };
  coverage: readonly IAutoMovieShotCoverage[];
  duration: number;
  motions: Readonly<Record<string, IAutoMovieMotion>>;
  objectMotions: readonly IAutoMovieClip[];
  models: readonly IAutoMovieModel[];
  runtime: IAutoMovieCameraClearanceRuntime | undefined;
  out: ViolationCollector;
}): IAutoMovieCameraClearanceReport[] | undefined {
  const cameras = new Map(
    props.scene.cameras.map((camera, index) => [camera.id, { camera, index }]),
  );
  const takes = [
    props.hero,
    ...props.coverage.map((take) => ({
      camera: cameras.get(take.camera)!.camera,
      motion: take.cameraMotion,
    })),
  ].filter((take) => take.camera.clearance !== undefined);
  if (takes.length === 0) return undefined;
  if (props.runtime === undefined) {
    props.out.push(
      "type",
      "$input.cameraClearance",
      "a camera with a physical clearance envelope requires builder-owned geometry revision and fixed-clock context",
      undefined,
    );
    return undefined;
  }
  if (
    !(Number.isFinite(props.runtime.sampleRate) && props.runtime.sampleRate > 0)
  ) {
    props.out.push(
      "range",
      "$input.cameraClearance.sampleRate",
      "camera clearance sample rate must be finite and greater than zero",
      props.runtime.sampleRate,
    );
    return undefined;
  }
  if (props.runtime.revision !== props.runtime.currentRevision) {
    for (const take of takes)
      props.out.push(
        "type",
        "$input.cameraClearance.currentRevision",
        `camera "${take.camera.id}" clearance read geometry revision "${props.runtime.revision}", but "${props.runtime.currentRevision}" is current; recompile against one current snapshot`,
        props.runtime.currentRevision,
      );
    return undefined;
  }

  props.objectMotions.forEach((clip, clipIndex) =>
    clip.tracks.forEach((track, trackIndex) => {
      if (track.channel.kind === "node" && track.channel.path === "weights")
        props.out.push(
          "type",
          `$input.objectMotions[${clipIndex}].tracks[${trackIndex}].channel.path`,
          `camera clearance cannot conservatively bound morph weights in clip "${clip.id}" because the portable model carries no morph-target expansion envelope`,
          track.channel.path,
        );
    }),
  );
  if (props.out.items.length > 0) return undefined;

  const models = new Map(props.models.map((model) => [model.id, model]));
  const animatedNodes = new Set(Object.keys(props.motions));
  for (const clip of props.objectMotions)
    for (const track of clip.tracks)
      if (track.channel.kind === "node") animatedNodes.add(track.channel.node);

  const measured: IMeasuredObstacle[] = [];
  props.scene.nodes.forEach((node, index) => {
    const model = models.get(node.model);
    let extent: ReturnType<typeof computeModelRestExtent> = null;
    let radius = 0;
    try {
      if (model !== undefined) {
        const validation = validateModel({ model });
        if (validation.success === false) {
          const first = validation.violations[0]!;
          throw new Error(
            `model contract fails at ${first.path}: ${first.expected}`,
          );
        }
      }
      const rigReach = model === undefined ? 0 : maximumRigReach(model);
      extent = model === undefined ? null : computeModelRestExtent(model);
      if (extent !== null && model !== undefined)
        radius = conservativeDeformationRadius(model, extent, rigReach);
    } catch (error) {
      props.out.push(
        "type",
        `$staged.scene.nodes[${index}].model`,
        `camera clearance cannot derive a conservative current bound for obstacle "${node.id}": ${safeThrownDescription(error)}`,
        node.model,
      );
      return;
    }
    if (extent === null) {
      props.out.push(
        "type",
        `$staged.scene.nodes[${index}].model`,
        `camera clearance cannot measure current obstacle "${node.id}" because model "${node.model}" is absent or has no geometry`,
        node.model,
      );
      return;
    }
    measured.push({
      node,
      extent,
      radius,
      dynamic: animatedNodes.has(node.id),
    });
  });
  if (props.out.items.length > 0) return undefined;

  const reports: IAutoMovieCameraClearanceReport[] = [];
  for (const take of takes) {
    const cameraEntry = cameras.get(take.camera.id)!;
    let report: IAutoMovieCameraClearanceReport;
    try {
      const times = clearanceSampleTimes({
        duration: props.duration,
        sampleRate: props.runtime.sampleRate,
        cameraMotion: take.motion,
        motions: props.motions,
        objectMotions: props.objectMotions,
      });
      report = evaluateCameraClearance({
        camera: take.camera.id,
        envelope: take.camera.clearance!,
        revision: props.runtime.revision,
        currentRevision: props.runtime.currentRevision,
        sampleRate: props.runtime.sampleRate,
        duration: props.duration,
        samples: times.map((time) => {
          const resolved = resolveCameraAt(
            take.camera.transform,
            take.motion,
            take.camera.id,
            time,
          );
          return {
            time,
            camera: {
              translation: resolved.position,
              rotation: resolved.rotation,
              scale: take.camera.transform.scale,
            },
            obstacles: measured.map((obstacle) => {
              const transform = nodeTransformAt(
                obstacle.node,
                props.motions[obstacle.node.id],
                props.objectMotions,
                time,
              );
              if (obstacle.dynamic) {
                const scale = Math.max(
                  Math.abs(transform.scale.x),
                  Math.abs(transform.scale.y),
                  Math.abs(transform.scale.z),
                );
                const radius = obstacle.radius * scale;
                return {
                  node: obstacle.node.id,
                  bounds: {
                    min: {
                      x: transform.translation.x - radius,
                      y: transform.translation.y - radius,
                      z: transform.translation.z - radius,
                    },
                    max: {
                      x: transform.translation.x + radius,
                      y: transform.translation.y + radius,
                      z: transform.translation.z + radius,
                    },
                  },
                };
              }
              return {
                node: obstacle.node.id,
                bounds: nodeSubjectBox(transform, obstacle.extent),
              };
            }),
          };
        }),
      });
    } catch (error) {
      props.out.push(
        "range",
        `$staged.scene.cameras[${cameraEntry.index}].clearance`,
        `camera clearance could not evaluate its fixed-clock input: ${safeThrownDescription(error)}`,
        take.camera.clearance,
      );
      continue;
    }
    for (const finding of report.findings)
      props.out.push(
        "range",
        `$staged.scene.cameras[${cameraEntry.index}].clearance.${finding.part === "body" ? "body" : "parentRig"}`,
        `camera "${take.camera.id}" ${finding.part} contacts obstacle "${finding.obstacle}" over the inclusive interval [${finding.start}, ${finding.end}]s; change the path, rig, or scene clearance`,
        finding,
      );
    if (report.status === "clear") reports.push(report);
  }
  return props.out.items.length === 0 ? reports : undefined;
}
