import {
  IAutoMovieCompiledShotSource,
  type IAutoMovieEffectSample,
  type IAutoMovieGeometryActorReader,
  type IAutoMovieGeometryMeasurementInput,
  type IAutoMovieGeometryQuery,
  IAutoMovieGeometryResult,
  type IAutoMovieResolvedCamera,
  IAutoMovieVector3,
} from "@automovie/interface";

import { createAutoMovieGeometryActorReader } from "./createAutoMovieGeometryActorReader";
import { sampleCompiledEffect } from "../effectRuntime/internal/sampleCompiledEffect";
import { resolveCameraAt } from "../film/internal/resolveCameraAt";
import { AutoMovieEngineQuaternion } from "../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../math/AutoMovieEngineVector3";

/*
 * Sample one compiled effect cue at shot-local seconds and report analytic
 * density, camera-ray intersection and subject-root inclusion; visibilityRisk
 * is a capped proxy rather than rendered occlusion.
 */
export function measureAutoMovieGeometryEffect(
  props: IAutoMovieGeometryMeasurementInput,
  request: Extract<IAutoMovieGeometryQuery, { query: "effect" }>,
): IAutoMovieGeometryResult {
  const reader: IAutoMovieGeometryActorReader =
    createAutoMovieGeometryActorReader(props.compiled);
  const shots: ReadonlyMap<string, IAutoMovieCompiledShotSource> =
    props.compiled;

  if (request.time < 0)
    throw new Error(
      `Effect sample time ${request.time} is invalid. Choose a finite non-negative shot time.`,
    );

  const compiled: IAutoMovieCompiledShotSource | undefined = shots.get(
    request.shot,
  );

  if (compiled === undefined)
    throw new Error(
      `Shot "${request.shot}" has no current compiled source. Recompile it before effect measurement.`,
    );

  if (request.time > compiled.shot.duration)
    throw new Error(
      `Effect sample time ${request.time} exceeds shot "${request.shot}" duration ${compiled.shot.duration}.`,
    );

  const zoneEffects: IAutoMovieCompiledShotSource["effects"] =
    compiled.effects.filter(
      (candidate: IAutoMovieCompiledShotSource["effects"][number]): boolean =>
        candidate.zone === request.zone,
    );

  const effect: IAutoMovieCompiledShotSource["effects"][number] | undefined =
    zoneEffects.find(
      (candidate: IAutoMovieCompiledShotSource["effects"][number]): boolean =>
        request.time >= candidate.start && request.time < candidate.end,
    ) ?? (zoneEffects.length === 1 ? zoneEffects[0] : undefined);

  if (effect === undefined)
    throw new Error(
      zoneEffects.length === 0
        ? `Shot "${request.shot}" has no compiled effect cue for zone "${request.zone}".`
        : `Shot "${request.shot}" has no unambiguous effect cue for zone "${request.zone}" at ${request.time}s.`,
    );

  const camera:
    | IAutoMovieCompiledShotSource["scene"]["cameras"][number]
    | undefined = compiled.scene.cameras.find(
    (
      candidate: IAutoMovieCompiledShotSource["scene"]["cameras"][number],
    ): boolean => candidate.id === compiled.shot.camera,
  );

  if (camera === undefined)
    throw new Error(
      `Shot "${request.shot}" has no current compiled camera "${compiled.shot.camera}".`,
    );

  if (props.design.production === null)
    throw new Error(
      "Effect measurement requires current production frame format. Restore production design and compile.",
    );

  const cameraTransform: IAutoMovieResolvedCamera = resolveCameraAt(
    camera.transform,
    compiled.shot.cameraMotion,
    camera.id,
    request.time,
  );

  const center: IAutoMovieVector3 = {
    x: (effect.bounds.min.x + effect.bounds.max.x) / 2,
    y: (effect.bounds.min.y + effect.bounds.max.y) / 2,
    z: (effect.bounds.min.z + effect.bounds.max.z) / 2,
  };

  const cameraDistance: number = AutoMovieEngineVector3.length(
    AutoMovieEngineVector3.subtract(cameraTransform.position, center),
  );

  const sample: IAutoMovieEffectSample = sampleCompiledEffect(
    effect,
    request.time,
    cameraDistance,
  );

  const volume: number =
    (effect.bounds.max.x - effect.bounds.min.x) *
    (effect.bounds.max.y - effect.bounds.min.y) *
    (effect.bounds.max.z - effect.bounds.min.z);

  const direction: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
    cameraTransform.rotation,
    {
      x: 0,
      y: 0,
      z: -1,
    },
  );

  const intersectionLength: number = rayBoundsIntersectionLength(
    cameraTransform.position,
    direction,
    effect.bounds,
    camera.far,
  );

  const subjects: string[] = request.subjects ?? [];

  if (subjects.length > 256 || new Set(subjects).size !== subjects.length)
    throw new Error(
      "Effect subjects must contain at most 256 unique compiled scene-node ids.",
    );

  const insideSubjects: number = subjects.filter((subject: string): boolean =>
    pointInsideBounds(
      reader.position(compiled, subject, request.time),
      effect.bounds,
    ),
  ).length;

  const density: number = sample.particles.length / volume;

  const maximumOpacity: number =
    effect.recipe.particle.opacity.max * sample.intensity;

  const visibilityRisk: number = Math.min(
    1,
    density * intersectionLength * maximumOpacity,
  );

  return {
    kind: "measurement",
    values: {
      active: sample.active,
      sampledTime: sample.time,
      particleCount: sample.particles.length,
      particleCap: effect.recipe.budget.maxParticles,
      intensity: sample.intensity,
      density,
      minimumOpacity: effect.recipe.particle.opacity.min * sample.intensity,
      maximumOpacity,
      cameraDistance,
      cameraIntersectionLength: intersectionLength,
      subjectCount: subjects.length,
      subjectsInside: insideSubjects,
      visibilityRisk,
      representativeFrame: Math.round(
        sample.time * props.design.production.frameFormat.fps,
      ),
      effectDigest: effect.digest,
    },
  };
}
const pointInsideBounds: (
  point: IAutoMovieVector3,
  bounds: IAutoMovieCompiledShotSource["effects"][number]["bounds"],
) => boolean = (
  point: IAutoMovieVector3,
  bounds: IAutoMovieCompiledShotSource["effects"][number]["bounds"],
): boolean =>
  point.x >= bounds.min.x &&
  point.x <= bounds.max.x &&
  point.y >= bounds.min.y &&
  point.y <= bounds.max.y &&
  point.z >= bounds.min.z &&
  point.z <= bounds.max.z;

const rayBoundsIntersectionLength: (
  origin: IAutoMovieVector3,
  direction: IAutoMovieVector3,
  bounds: IAutoMovieCompiledShotSource["effects"][number]["bounds"],
  maximumDistance: number,
) => number = (
  origin: IAutoMovieVector3,
  direction: IAutoMovieVector3,
  bounds: IAutoMovieCompiledShotSource["effects"][number]["bounds"],
  maximumDistance: number,
): number => {
  let enter: number = 0;
  let exit: number = maximumDistance;
  for (const axis of ["x", "y", "z"] as const) {
    const component: number = direction[axis];
    if (Math.abs(component) < 1e-12) {
      if (origin[axis] < bounds.min[axis] || origin[axis] > bounds.max[axis])
        return 0;
      continue;
    }
    const first: number = (bounds.min[axis] - origin[axis]) / component;
    const second: number = (bounds.max[axis] - origin[axis]) / component;
    enter = Math.max(enter, Math.min(first, second));
    exit = Math.min(exit, Math.max(first, second));
    if (enter >= exit) return 0;
  }
  return Math.max(0, exit - enter);
};
