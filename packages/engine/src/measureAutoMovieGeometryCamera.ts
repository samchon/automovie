import { AutoMovieGeometryQuery, IAutoMovieCompiledShotSource, IAutoMovieGeometryResult, IAutoMovieVector3 } from "@automovie/interface";
import { projectToNdc } from "./film/projectToNdc";
import { resolveCameraAt } from "./film/resolveCameraAt";
import { IAutoMovieGeometryMeasurementInput } from "./IAutoMovieGeometryMeasurementInput";
import { createAutoMovieGeometryActorReader } from "./createAutoMovieGeometryActorReader";


/**
 * Project unique requested actor root points through the sampled camera and delivery crop at shot-local seconds; report depth/frame counts and margins, with occlusionMeasured=false.
 *
 * @evidence contracts/common.md#principled-implementation Uses the current compiled camera, canonical projection helper and exact composed actor root positions, testing inclusive near/far depth and NDC [-1,1] bounds; root-point visibility does not measure body coverage or occlusion.
 * @evidence contracts/common.md#clear-and-simple-design The camera branch owns query admission and count aggregation while camera sampling, actor root placement and NDC projection stay in shared helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing shot/contract/camera/production, invalid time and empty/duplicate subjects refuse; absent nodes are counted as missing and a fully missing set reports margin -1 explicitly.
 * @evidence contracts/common.md#meaningful-documentation States root-point scope, shot-local time, crop-aware projection and absence of occlusion measurement.
 * @evidence contracts/performance.md#efficient-algorithms Camera lookup and per-subject actor lookup/sampling dominate cost; projection/count filters are linear in subjects, and minimum margin uses a reduction without argument-spread limits.
 * @evidence contracts/performance.md#reuse-equivalent-work One camera sample and one per-subject projection serve depth, frame and margin results; no cross-call cache assumes scene or camera motion is unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Call-local projection arrays scale with requested subjects and are released after completion; output has scalar counts/margins and acquires no renderer or GPU handle.
 */
export function measureAutoMovieGeometryCamera(props: IAutoMovieGeometryMeasurementInput, request: Extract<AutoMovieGeometryQuery, { query: "camera" }>): IAutoMovieGeometryResult {
const reader: ReturnType<typeof createAutoMovieGeometryActorReader> = createAutoMovieGeometryActorReader(props.compiled);
const shots: ReadonlyMap<string, IAutoMovieCompiledShotSource> = props.compiled;

      const compiled: IAutoMovieCompiledShotSource | undefined = shots.get(request.shot);

      const contract: ReturnType<typeof props.design.shots.get> = props.design.shots.get(request.shot);

      if (compiled === undefined || contract === undefined)
        throw new Error(
          `Shot "${request.shot}" is not current compiled output. Compile it before a camera query.`,
        );

      if (
        Number.isFinite(request.time) === false ||
        request.time < 0 ||
        request.time > compiled.shot.duration
      )
        throw new Error(
          `Camera sample time ${request.time} is outside shot "${request.shot}" duration 0..${compiled.shot.duration}. Choose a current in-range time.`,
        );

      if (
        request.subjects.length === 0 ||
        new Set(request.subjects).size !== request.subjects.length
      )
        throw new Error(
          "Camera subjects must be a non-empty list of unique compiled scene-node ids. Correct the subjects.",
        );

      const camera: IAutoMovieCompiledShotSource["scene"]["cameras"][number] | undefined = compiled.scene.cameras.find(
        (item: IAutoMovieCompiledShotSource["scene"]["cameras"][number]): boolean => item.id === compiled.shot.camera,
      );

      if (camera === undefined)
        throw new Error(
          `Shot "${request.shot}" references missing camera "${compiled.shot.camera}". Recompile corrected source.`,
        );

      if (props.design.production === null)
        throw new Error(
          "Camera measurement requires current production frame format. Restore production design and compile.",
        );

      const resolvedCamera: ReturnType<typeof resolveCameraAt> = resolveCameraAt(
        camera.transform,
        compiled.shot.cameraMotion,
        camera.id,
        request.time,
      );

      const halfY: number = Math.tan((camera.fovY * Math.PI) / 360);

      const aspect: number =
        props.design.production.frameFormat.width /
        props.design.production.frameFormat.height;

      const crop: typeof props.design.production.frameFormat.crop = props.design.production.frameFormat.crop;

      const samples: { projection: ReturnType<typeof projectToNdc> }[] = request.subjects.flatMap((subject: string): { projection: ReturnType<typeof projectToNdc> }[] => {
        const node: IAutoMovieCompiledShotSource["scene"]["nodes"][number] | undefined = compiled.scene.nodes.find((item: IAutoMovieCompiledShotSource["scene"]["nodes"][number]): boolean => item.id === subject);
        if (node === undefined) return [];
        const point: IAutoMovieVector3 = reader.position(compiled,
subject,
request.time);
        const projection: ReturnType<typeof projectToNdc> = projectToNdc(
          resolvedCamera,
          point,
          halfY,
          aspect,
          crop,
        );
        return [{ projection }];
      });

      const inDepth: typeof samples = samples.filter(
        ({ projection }: (typeof samples)[number]): boolean =>
          projection.depth >= camera.near && projection.depth <= camera.far,
      );

      const inFrame: typeof samples = inDepth.filter(
        ({ projection }: (typeof samples)[number]): boolean =>
          Math.abs(projection.ndcX) <= 1 && Math.abs(projection.ndcY) <= 1,
      );

      const minimumRootPointMargin: number =
        samples.length === 0
          ? -1
          : samples.reduce((margin: number, { projection }: (typeof samples)[number]): number =>
                Math.min(margin,
                  1 - Math.abs(projection.ndcX),
                  1 - Math.abs(projection.ndcY),
                ), Number.POSITIVE_INFINITY);

      return {
        kind: "measurement",
        values: {
          requestedSubjects: request.subjects.length,
          resolvedSubjectRootPoints: samples.length,
          missingSubjects: request.subjects.length - samples.length,
          inDepthRangeRootPoints: inDepth.length,
          inFrameRootPoints: inFrame.length,
          clippedOrBehindRootPoints: samples.length - inDepth.length,
          outsideFrameRootPoints: inDepth.length - inFrame.length,
          minimumRootPointMargin,
          maxAllowedOcclusionRatio: contract.camera.maxOcclusionRatio,
          occlusionMeasured: false,
          sampledTime: request.time,
        },
      };
}

