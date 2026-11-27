import {
  IAutoMovieCompiledShotSource,
  type IAutoMovieGeometryActorReader,
  type IAutoMovieGeometryMeasurementInput,
  type IAutoMovieGeometryQuery,
  IAutoMovieGeometryResult,
  type IAutoMovieProjectToNdc,
  type IAutoMovieResolvedCamera,
  IAutoMovieVector3,
} from "@automovie/interface";

import { createAutoMovieGeometryActorReader } from "./createAutoMovieGeometryActorReader";
import { projectToNdc } from "../film/internal/projectToNdc";
import { resolveCameraAt } from "../film/internal/resolveCameraAt";

/*
 * Project unique requested actor root points through the sampled camera and
 * delivery crop at shot-local seconds; report depth/frame counts and margins,
 * with occlusionMeasured=false.
 */
export function measureAutoMovieGeometryCamera(
  props: IAutoMovieGeometryMeasurementInput,
  request: Extract<IAutoMovieGeometryQuery, { query: "camera" }>,
): IAutoMovieGeometryResult {
  const reader: IAutoMovieGeometryActorReader =
    createAutoMovieGeometryActorReader(props.compiled);
  const shots: ReadonlyMap<string, IAutoMovieCompiledShotSource> =
    props.compiled;

  const compiled: IAutoMovieCompiledShotSource | undefined = shots.get(
    request.shot,
  );

  const contract: ReturnType<typeof props.design.shots.get> =
    props.design.shots.get(request.shot);

  if (compiled === undefined || contract === undefined)
    throw new Error(
      `Shot "${request.shot}" is not current compiled output. Compile it before a camera query.`,
    );

  if (request.time < 0 || request.time > compiled.shot.duration)
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

  const camera:
    | IAutoMovieCompiledShotSource["scene"]["cameras"][number]
    | undefined = compiled.scene.cameras.find(
    (item: IAutoMovieCompiledShotSource["scene"]["cameras"][number]): boolean =>
      item.id === compiled.shot.camera,
  );

  if (camera === undefined)
    throw new Error(
      `Shot "${request.shot}" references missing camera "${compiled.shot.camera}". Recompile corrected source.`,
    );

  if (props.design.production === null)
    throw new Error(
      "Camera measurement requires current production frame format. Restore production design and compile.",
    );

  const resolvedCamera: IAutoMovieResolvedCamera = resolveCameraAt(
    camera.transform,
    compiled.shot.cameraMotion,
    camera.id,
    request.time,
  );

  const halfY: number = Math.tan((camera.fovY * Math.PI) / 360);

  const aspect: number =
    props.design.production.frameFormat.width /
    props.design.production.frameFormat.height;

  const crop: typeof props.design.production.frameFormat.crop =
    props.design.production.frameFormat.crop;

  const samples: { projection: IAutoMovieProjectToNdc.IResult }[] =
    request.subjects.flatMap(
      (subject: string): { projection: IAutoMovieProjectToNdc.IResult }[] => {
        const node:
          | IAutoMovieCompiledShotSource["scene"]["nodes"][number]
          | undefined = compiled.scene.nodes.find(
          (
            item: IAutoMovieCompiledShotSource["scene"]["nodes"][number],
          ): boolean => item.id === subject,
        );
        if (node === undefined) return [];
        const point: IAutoMovieVector3 = reader.position(
          compiled,
          subject,
          request.time,
        );
        const projection: IAutoMovieProjectToNdc.IResult = projectToNdc(
          resolvedCamera,
          point,
          halfY,
          aspect,
          crop,
        );
        return [{ projection }];
      },
    );

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
      : samples.reduce(
          (margin: number, { projection }: (typeof samples)[number]): number =>
            Math.min(
              margin,
              1 - Math.abs(projection.ndcX),
              1 - Math.abs(projection.ndcY),
            ),
          Number.POSITIVE_INFINITY,
        );

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
