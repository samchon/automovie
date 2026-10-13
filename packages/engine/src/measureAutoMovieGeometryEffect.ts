import { AutoMovieGeometryQuery, IAutoMovieCompiledShotSource, IAutoMovieGeometryResult, IAutoMovieVector3 } from "@automovie/interface";
import { resolveCameraAt } from "./film/resolveCameraAt";
import { Quaternion } from "./math/Quaternion";
import { Vector3 } from "./math/Vector3";
import { sampleCompiledEffect } from "./sampleCompiledEffect";
import { IAutoMovieGeometryMeasurementInput } from "./IAutoMovieGeometryMeasurementInput";
import { createAutoMovieGeometryActorReader } from "./createAutoMovieGeometryActorReader";


/**
 * Sample one compiled effect cue at shot-local seconds and report analytic density, camera-ray intersection and subject-root inclusion; visibilityRisk is a capped proxy rather than rendered occlusion.
 *
 * @evidence contracts/common.md#principled-implementation Selects the active cue in the named zone or its sole inactive cue, samples particles from its recipe, intersects the camera ray with the bounds by slab intervals, and estimates density times path length times maximum opacity.
 * @evidence contracts/common.md#clear-and-simple-design The effect branch owns cue admission and summaries; deterministic particle sampling, camera placement and actor root resolution stay in existing shared helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing/ambiguous cues and invalid shot time refuse; subject lists are limited to 256 unique ids. Parallel ray axes use a 1e-12 zero-direction tolerance and bounds admission belongs to compiled effect validation.
 * @evidence contracts/common.md#meaningful-documentation States shot-local time, scalar risk interpretation, subject-root scope and named failure; the returned digest identifies the sampled compiled cue.
 * @evidence contracts/performance.md#efficient-algorithms Cue/camera lookup and bounded deterministic particle sampling dominate work; each requested subject adds actor lookup and spatial sampling, while ray-box intersection examines three axes.
 * @evidence contracts/performance.md#reuse-equivalent-work One effect sample supplies activity, particle count, intensity and opacity fields; one resolved camera supplies distance and ray, with no cache over mutable compiled cues.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Particle samples and reader closures are call-local and bounded by the recipe's particle budget and 256 subjects; only scalars escape and no renderer resources are acquired.
 */
export function measureAutoMovieGeometryEffect(props: IAutoMovieGeometryMeasurementInput, request: Extract<AutoMovieGeometryQuery, { query: "effect" }>): IAutoMovieGeometryResult {
const reader: ReturnType<typeof createAutoMovieGeometryActorReader> = createAutoMovieGeometryActorReader(props.compiled);
const shots: ReadonlyMap<string, IAutoMovieCompiledShotSource> = props.compiled;

      if (Number.isFinite(request.time) === false || request.time < 0)
        throw new Error(
          `Effect sample time ${request.time} is invalid. Choose a finite non-negative shot time.`,
        );

      const compiled: IAutoMovieCompiledShotSource | undefined = shots.get(request.shot);

      if (compiled === undefined)
        throw new Error(
          `Shot "${request.shot}" has no current compiled source. Recompile it before effect measurement.`,
        );

      if (request.time > compiled.shot.duration)
        throw new Error(
          `Effect sample time ${request.time} exceeds shot "${request.shot}" duration ${compiled.shot.duration}.`,
        );

      const zoneEffects: IAutoMovieCompiledShotSource["effects"] = compiled.effects.filter(
        (candidate: IAutoMovieCompiledShotSource["effects"][number]): boolean => candidate.zone === request.zone,
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

      const camera: IAutoMovieCompiledShotSource["scene"]["cameras"][number] | undefined = compiled.scene.cameras.find(
        (candidate: IAutoMovieCompiledShotSource["scene"]["cameras"][number]): boolean => candidate.id === compiled.shot.camera,
      );

      if (camera === undefined)
        throw new Error(
          `Shot "${request.shot}" has no current compiled camera "${compiled.shot.camera}".`,
        );

      if (props.design.production === null)
        throw new Error(
          "Effect measurement requires current production frame format. Restore production design and compile.",
        );

      const cameraTransform: ReturnType<typeof resolveCameraAt> = resolveCameraAt(
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

      const cameraDistance: number = Vector3.length(Vector3.subtract(cameraTransform.position, center));

      const sample: ReturnType<typeof sampleCompiledEffect> = sampleCompiledEffect(effect, request.time, cameraDistance);

      const volume: number =
        (effect.bounds.max.x - effect.bounds.min.x) *
        (effect.bounds.max.y - effect.bounds.min.y) *
        (effect.bounds.max.z - effect.bounds.min.z);

      const direction: IAutoMovieVector3 = Quaternion.rotateVector(cameraTransform.rotation, {
        x: 0,
        y: 0,
        z: -1,
      });

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
          reader.position(compiled,
subject,
request.time),
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
const pointInsideBounds: (point: IAutoMovieVector3, bounds: IAutoMovieCompiledShotSource [ "effects" ] [ number ] [ "bounds" ]) => boolean = (
  point: IAutoMovieVector3,
  bounds: IAutoMovieCompiledShotSource["effects"][number]["bounds"],
): boolean =>
  point.x >= bounds.min.x &&
  point.x <= bounds.max.x &&
  point.y >= bounds.min.y &&
  point.y <= bounds.max.y &&
  point.z >= bounds.min.z &&
  point.z <= bounds.max.z;

const rayBoundsIntersectionLength: (origin: IAutoMovieVector3, direction: IAutoMovieVector3, bounds: IAutoMovieCompiledShotSource [ "effects" ] [ number ] [ "bounds" ], maximumDistance: number) => number = (
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
