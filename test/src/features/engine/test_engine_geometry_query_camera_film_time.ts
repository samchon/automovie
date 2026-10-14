import { measureAutoMovieGeometry } from "@automovie/engine";
import type {
  AutoMovieGeometryQuery,
  IAutoMovieCompiledShotSource,
  IAutoMovieFilmTimeline,
  IAutoMovieFilmTimelineSegment,
  IAutoMovieProductionDesign,
  IAutoMovieSceneNode,
  IAutoMovieShotContract,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../internal/createModel";
import { namedFacts, nclose, throwsError } from "../internal/predicates";

/** A 200 by 100 frame: aspect two, 24 frames per second, no crop. */
const production: Pick<IAutoMovieProductionDesign, "frameFormat"> = {
  frameFormat: { width: 200, height: 100, fps: 24, colorSpace: "srgb" },
};
const root: (id: string, z: number, x?: number) => IAutoMovieSceneNode = (
  id: string,
  z: number,
  x: number = 0,
): IAutoMovieSceneNode => ({
  id,
  model: "prop",
  transform: {
    translation: { x, y: 0, z },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  motion: null,
  pose: null,
});
/**
 * A camera at the origin looking down -Z with a 90 degree vertical field of
 * view, so a root `depth` metres ahead maps `x` to `x / (2 * depth)` across the
 * frame and `y` to `y / depth` up it.
 */
const look: (cameraId?: string) => IAutoMovieCompiledShotSource = (
  cameraId: string = "cam",
): IAutoMovieCompiledShotSource => ({
  eventSamples: [],
  scene: {
    id: "look-scene",
    name: null,
    nodes: [
      root("front", -5),
      root("wide", -5, 15),
      root("behind", 5),
      root("distant", -200),
    ],
    cameras: [
      {
        id: "cam",
        transform: {
          translation: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        fovY: 90,
        near: 0.1,
        far: 100,
        depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
      },
    ],
    lights: [],
  },
  motions: [],
  shot: {
    id: "look",
    name: null,
    scene: "look-scene",
    camera: cameraId,
    cameraMotion: null,
    performances: [],
    objectMotions: [],
    duration: 4,
  },
  models: [{ ...createModel(null), id: "prop" }],
  formations: [],
  instanceSets: [],
  formationMotions: [],
  formationSlotMotions: [],
  effects: [],
});

const contract: Pick<IAutoMovieShotContract, "participants" | "camera"> = {
  participants: [],
  camera: {
    intent: "hold the front subject",
    requiredSubjects: [],
    maxOcclusionRatio: 0.25,
  },
};

function segment(
  props: Pick<
    IAutoMovieFilmTimelineSegment,
    | "shot"
    | "sourceInFrame"
    | "startFrame"
    | "endFrame"
    | "transitionIn"
    | "transitionOut"
  >,
): IAutoMovieFilmTimelineSegment {
  return {
    ...props,
    sourceOutFrame: props.sourceInFrame + props.endFrame - props.startFrame,
    headHandleFrames: 0,
    tailHandleFrames: 0,
  };
}

/** Shot a plays frames 0 to 24; shot b dissolves in over a's last six frames. */
function timeline(
  segments: IAutoMovieFilmTimelineSegment[],
): Pick<IAutoMovieFilmTimeline, "id" | "fps" | "totalFrames" | "segments"> {
  return {
    id: "film",
    fps: 24,
    totalFrames: 48,
    segments,
  };
}

const OPENING: IAutoMovieFilmTimelineSegment = segment({
  shot: "a",
  sourceInFrame: 0,
  startFrame: 0,
  endFrame: 24,
  transitionIn: { kind: "cut" },
  transitionOut: { kind: "dissolve", durationFrames: 6 },
});
const CLOSING: IAutoMovieFilmTimelineSegment = segment({
  shot: "b",
  sourceInFrame: 12,
  startFrame: 18,
  endFrame: 48,
  transitionIn: { kind: "dissolve", durationFrames: 6 },
  transitionOut: { kind: "cut" },
});

function measure(props: {
  request: AutoMovieGeometryQuery;
  compiled?: ReadonlyMap<string, IAutoMovieCompiledShotSource>;
  contracts?: ReadonlyMap<
    string,
    Pick<IAutoMovieShotContract, "participants" | "camera">
  >;
  production?: Pick<IAutoMovieProductionDesign, "frameFormat"> | null;
  timeline?: Pick<
    IAutoMovieFilmTimeline,
    "id" | "fps" | "totalFrames" | "segments"
  > | null;
}): Record<string, number | string | boolean> {
  const result: ReturnType<typeof measureAutoMovieGeometry> =
    measureAutoMovieGeometry({
      request: props.request,
      design: {
        production:
          props.production === undefined ? production : props.production,
        world: null,
        formations: new Map(),
        shots: props.contracts ?? new Map([["look", contract]]),
      },
      compiled: props.compiled ?? new Map([["look", look()]]),
      timeline:
        props.timeline === undefined
          ? timeline([OPENING, CLOSING])
          : props.timeline,
    });
  if (result.kind !== "measurement")
    throw new Error("a measurement was expected");
  return result.values;
}

const camera: (
  subjects: string[],
  time?: number,
  shot?: string,
) => AutoMovieGeometryQuery = (
  subjects: string[],
  time: number = 1,
  shot: string = "look",
): AutoMovieGeometryQuery => ({
  query: "camera",
  shot,
  time,
  subjects,
});

const at: (
  value: { frame: number } | { seconds: number },
) => AutoMovieGeometryQuery = (
  value: { frame: number } | { seconds: number },
): AutoMovieGeometryQuery => ({
  query: "film-time",
  at: value,
});

/**
 * Camera and film-time queries report hand-computable projection and frame
 * facts, and refuse what they cannot place.
 *
 * With the camera at the origin looking down -Z, a 90 degree field of view and
 * a two-to-one frame, a root five metres ahead on the axis projects to the
 * centre, one fifteen metres to the right projects at 1.5 across and is out of
 * frame, one five metres behind has negative depth, and one two hundred metres
 * ahead is past the far plane. The film timeline is two segments whose dissolve
 * overlaps frames 18 to 23; the later segment owns an overlapped frame.
 *
 * Scenarios:
 *
 * 1. Five subjects, one of them absent, resolve four roots: two inside the depth
 *    range, one of those inside the frame, and a least margin of -0.5 from the
 *    wide root; occlusion is reported as not measured.
 * 2. Only absent subjects resolve no roots and report a margin of -1.
 * 3. A camera query refuses an absent shot, an absent contract, a time outside
 *    the shot, an empty or repeated subject list, an absent camera, and a
 *    production without a frame format.
 * 4. Frame 20, inside the dissolve, belongs to shot b at source frame 14; half a
 *    second is frame 12 of shot a; frame 47 is shot b's source frame 41.
 * 5. A film time off the frame grid, before the first frame, at or past the
 *    last, too large to be an exact frame, or not finite is refused; a frame no
 *    segment covers is refused; and a film-time query without a timeline is
 *    refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual geometry dispatcher over authored compiled roots/camera and timeline segments, observing projection counts/margins, explicit unmeasured occlusion, latest overlap ownership and correction-bearing query refusals.
 * @evidence contracts/testing.md#independent-expectations A 90-degree vertical pinhole lens, aspect two and literal root positions determine the projection oracle; literal half-open segment intervals and source offsets determine film/source frames independently of the query. Existing tolerances cover derived projection/seconds, while directly carried floating fields retain zero-tolerance comparisons.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts front/wide/behind/far/absent roots and an entirely missing population, invalid shot/contract/time/subjects/camera/frame-format inputs, overlap/interior/final frames and off-grid/negative/unsafe/nonfinite/gap/no-timeline failures. Root projection proves neither body visibility nor rendered occlusion.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns local compiled records/maps and query callbacks through the existing model fixture; it opens no filesystem, render host, browser or GPU and assumes caller-established current records rather than proving a native compile.
 */
export function test_engine_geometry_query_camera_film_time(): void {
  const framed: ReturnType<typeof measure> = measure({
    request: camera(["front", "wide", "behind", "distant", "absent"]),
  });
  const nothing: ReturnType<typeof measure> = measure({
    request: camera(["absent"]),
  });
  TestValidator.equals(
    "a camera query counts projected subject roots by hand geometry",
    namedFacts([
      [
        "requested",
        (): boolean =>
          framed.requestedSubjects === 5 && framed.missingSubjects === 1,
      ],
      ["resolved", (): boolean => framed.resolvedSubjectRootPoints === 4],
      [
        "inDepth",
        (): boolean =>
          framed.inDepthRangeRootPoints === 2 &&
          framed.clippedOrBehindRootPoints === 2,
      ],
      [
        "inFrame",
        (): boolean =>
          framed.inFrameRootPoints === 1 && framed.outsideFrameRootPoints === 1,
      ],
      [
        "margin",
        (): boolean =>
          nclose(framed.minimumRootPointMargin as number, -0.5, 1e-12),
      ],
      [
        "occlusion",
        (): boolean =>
          nclose(framed.maxAllowedOcclusionRatio as number, 0.25, 0) &&
          framed.occlusionMeasured === false,
      ],
      ["time", (): boolean => nclose(framed.sampledTime as number, 1, 0)],
      [
        "noRoots",
        (): boolean =>
          nothing.resolvedSubjectRootPoints === 0 &&
          nclose(nothing.minimumRootPointMargin as number, -1, 0),
      ],
    ]),
    {
      requested: true,
      resolved: true,
      inDepth: true,
      inFrame: true,
      margin: true,
      occlusion: true,
      time: true,
      noRoots: true,
    },
  );

  TestValidator.equals(
    "a camera query refuses what it cannot project",
    namedFacts([
      [
        "absentShot",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> =>
              measure({ request: camera(["front"], 1, "gone") }),
            'Shot "gone" is not current compiled output',
          ),
      ],
      [
        "absentContract",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> =>
              measure({ request: camera(["front"]), contracts: new Map() }),
            'Shot "look" is not current compiled output',
          ),
      ],
      [
        "late",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> =>
              measure({ request: camera(["front"], 5) }),
            'Camera sample time 5 is outside shot "look" duration 0..4',
          ),
      ],
      [
        "early",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> =>
              measure({ request: camera(["front"], -1) }),
            "Camera sample time -1 is outside",
          ),
      ],
      [
        "empty",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> => measure({ request: camera([]) }),
            "non-empty list of unique compiled scene-node ids",
          ),
      ],
      [
        "repeated",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> =>
              measure({ request: camera(["front", "front"]) }),
            "non-empty list of unique compiled scene-node ids",
          ),
      ],
      [
        "absentCamera",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> =>
              measure({
                request: camera(["front"]),
                compiled: new Map([["look", look("gone")]]),
              }),
            'Shot "look" references missing camera "gone"',
          ),
      ],
      [
        "noProduction",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> =>
              measure({ request: camera(["front"]), production: null }),
            "requires current production frame format",
          ),
      ],
    ]),
    {
      absentShot: true,
      absentContract: true,
      late: true,
      early: true,
      empty: true,
      repeated: true,
      absentCamera: true,
      noProduction: true,
    },
  );

  const dissolve: ReturnType<typeof measure> = measure({
    request: at({ frame: 20 }),
  });
  const halfSecond: ReturnType<typeof measure> = measure({
    request: at({ seconds: 0.5 }),
  });
  const last: ReturnType<typeof measure> = measure({
    request: at({ frame: 47 }),
  });
  TestValidator.equals(
    "a film time resolves to the segment that owns its frame",
    namedFacts([
      [
        "dissolveShot",
        (): boolean =>
          dissolve.shot === "b" &&
          dissolve.globalFrame === 20 &&
          dissolve.film === "film",
      ],
      [
        "dissolveSource",
        (): boolean =>
          dissolve.sourceFrame === 14 &&
          nclose(dissolve.shotTime as number, 14 / 24, 1e-12),
      ],
      [
        "dissolveTime",
        (): boolean => nclose(dissolve.globalTime as number, 20 / 24, 1e-12),
      ],
      [
        "dissolveTransitions",
        (): boolean =>
          dissolve.transitionIn === "dissolve" &&
          dissolve.transitionOut === "cut",
      ],
      [
        "halfSecond",
        (): boolean =>
          halfSecond.shot === "a" &&
          halfSecond.globalFrame === 12 &&
          halfSecond.sourceFrame === 12,
      ],
      [
        "halfSecondTransitions",
        (): boolean =>
          halfSecond.transitionIn === "cut" &&
          halfSecond.transitionOut === "dissolve",
      ],
      ["last", (): boolean => last.shot === "b" && last.sourceFrame === 41],
    ]),
    {
      dissolveShot: true,
      dissolveSource: true,
      dissolveTime: true,
      dissolveTransitions: true,
      halfSecond: true,
      halfSecondTransitions: true,
      last: true,
    },
  );

  const unresolved: string =
    "Film-global time does not resolve to one current frame in 0..47";
  TestValidator.equals(
    "a film time that names no current frame is refused",
    namedFacts([
      [
        "offGrid",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> =>
              measure({ request: at({ frame: 1.5 }) }),
            unresolved,
          ),
      ],
      [
        "offGridSeconds",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> =>
              measure({ request: at({ seconds: 1 / 48 }) }),
            unresolved,
          ),
      ],
      [
        "beforeFirst",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> =>
              measure({ request: at({ frame: -1 }) }),
            unresolved,
          ),
      ],
      [
        "pastLast",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> =>
              measure({ request: at({ frame: 48 }) }),
            unresolved,
          ),
      ],
      [
        "notExact",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> =>
              measure({ request: at({ frame: 2 ** 60 }) }),
            unresolved,
          ),
      ],
      [
        "notFinite",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> =>
              measure({ request: at({ seconds: Number.POSITIVE_INFINITY }) }),
            unresolved,
          ),
      ],
      [
        "uncovered",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> =>
              measure({
                request: at({ frame: 30 }),
                timeline: timeline([OPENING]),
              }),
            "Film-global frame 30 has no owning video segment",
          ),
      ],
      [
        "noTimeline",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> =>
              measure({ request: at({ frame: 0 }), timeline: null }),
            "Film-time measurement requires the canonical film timeline of the current compile",
          ),
      ],
    ]),
    {
      offGrid: true,
      offGridSeconds: true,
      beforeFirst: true,
      pastLast: true,
      notExact: true,
      notFinite: true,
      uncovered: true,
      noTimeline: true,
    },
  );
}
