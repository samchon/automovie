import { lookRotation } from "@automovie/engine";
import type {
  AutoMovieGrammarStyleIntent, IAutoMovieCameraIntent, IAutoMovieCompiledShotSource,
  IAutoMovieDiagnostic, IAutoMovieFilmTimeline, IAutoMovieModel, IAutoMovieMotion,
  IAutoMovieShotContract, IAutoMovieTransform, IAutoMovieVector3,
} from "@automovie/interface";
import { filmGrammarDiagnostics } from "@automovie/production";

import { keyframe, makeMotion, makePose, makeProp, primitivePart } from "./fixtures";

const FPS: number = 24;
const ASPECT: number = 16 / 9;
const SECONDS: number = 4;

function point(x: number, y: number, z: number): IAutoMovieVector3 { return { x, y, z }; }
function placed(translation: IAutoMovieVector3): IAutoMovieTransform {
  return { translation, rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 } };
}

/** The original skeleton-less figure, with authored measurable primitive height. */
function boxModel(id: string, height: number): IAutoMovieModel {
  return { ...makeProp([primitivePart("body", { type: "box", width: 0.4, height, depth: 0.3 })]), id };
}

/** The original empty model supplies no geometry measurement. */
function emptyModel(id: string): IAutoMovieModel { return { ...makeProp([]), id }; }

/** The original four-metre positive-X root motion over the four-second shot. */
function walk(): IAutoMovieMotion {
  return makeMotion([
    keyframe(0, makePose([], placed(point(0, 0, 0)))),
    keyframe(SECONDS, makePose([], placed(point(4, 0, 0)))),
  ], SECONDS);
}

interface ISubject {
  id: string;
  position: IAutoMovieVector3;
  model?: string;
  motion?: string;
}

/** Construct the original staged scene, camera and optional root performance without changing input identities. */
function compiledShot(props: {
  id: string;
  camera: IAutoMovieVector3;
  subjects: readonly ISubject[];
  liveCamera?: string;
  models?: IAutoMovieModel[];
  motions?: IAutoMovieMotion[];
  cameraIntent?: IAutoMovieCameraIntent[];
}): IAutoMovieCompiledShotSource {
  return {
    eventSamples: [],
    scene: {
      id: "stage", name: null,
      nodes: props.subjects.map((subject: ISubject): IAutoMovieCompiledShotSource["scene"]["nodes"][number] => ({
        id: subject.id, model: subject.model ?? "figure", transform: placed(subject.position), motion: null, pose: null,
      })),
      cameras: [{
        id: "lens",
        transform: {
          translation: props.camera,
          rotation: lookRotation({ x: -props.camera.x, y: 0.9 - props.camera.y, z: -props.camera.z }),
          scale: { x: 1, y: 1, z: 1 },
        },
        fovY: 50, near: 0.1, far: 200,
        depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
      }],
      lights: [],
    },
    motions: props.motions ?? [],
    shot: {
      id: props.id, name: null, scene: "stage", camera: props.liveCamera ?? "lens", cameraMotion: null,
      performances: props.subjects.flatMap((subject: ISubject): IAutoMovieCompiledShotSource["shot"]["performances"] =>
        subject.motion === undefined ? [] : [{ node: subject.id, motion: subject.motion, startOffset: 0 }]),
      objectMotions: [], events: [], cameraIntent: props.cameraIntent ?? [], coverage: [], duration: SECONDS,
    },
    models: props.models ?? [boxModel("figure", 1.8)],
    formations: [], instanceSets: [], formationMotions: [], formationSlotMotions: [], effects: [],
  };
}

/** The original contract keeps its exact source, shot, beat, subject and review-frame identities. */
function shotContract(props: {
  id: string;
  requiredSubjects: string[];
  styleIntent?: AutoMovieGrammarStyleIntent[];
}): IAutoMovieShotContract {
  return {
    id: props.id, beat: `beat-${props.id}`, source: { module: `src/shots/${props.id}.ts`, export: props.id },
    durationSeconds: SECONDS,
    ...(props.styleIntent === undefined ? {} : { styleIntent: props.styleIntent }),
    participants: [], opening: [], closing: [],
    camera: { intent: "hold the marked pair readable across the cut", requiredSubjects: props.requiredSubjects, maxOcclusionRatio: 0.2 },
    events: [], reviewFrames: [{ id: `${props.id}-entry`, time: 0, passes: ["beauty"] }],
  };
}

/** The original cut-only edit uses exclusive source-out and contiguous four-second placements. */
function segmentOf(shot: string, index: number): IAutoMovieFilmTimeline["segments"][number] {
  return {
    shot, sourceInFrame: 0, sourceOutFrame: SECONDS * FPS,
    startFrame: index * SECONDS * FPS, endFrame: (index + 1) * SECONDS * FPS,
    headHandleFrames: 0, tailHandleFrames: 0,
    transitionIn: { kind: "cut" }, transitionOut: { kind: "cut" },
  };
}

interface IPlacement {
  contract: IAutoMovieShotContract;
  compiled: IAutoMovieCompiledShotSource;
}

/** Forward the original ordered placements and exact object references to production grammar diagnostics. */
function readEdit(placements: readonly IPlacement[]): IAutoMovieDiagnostic[] {
  return filmGrammarDiagnostics({
    segments: placements.map((placement: IPlacement, index: number): IAutoMovieFilmTimeline["segments"][number] => segmentOf(placement.contract.id, index)),
    fps: FPS, aspect: ASPECT,
    contracts: new Map(placements.map((placement: IPlacement): [string, IAutoMovieShotContract] => [placement.contract.id, placement.contract])),
    compiled: new Map(placements.map((placement: IPlacement): [string, IAutoMovieCompiledShotSource] => [placement.contract.id, placement.compiled])),
  });
}

function codes(diagnostics: readonly IAutoMovieDiagnostic[]): string[] {
  return diagnostics.map((diagnostic: IAutoMovieDiagnostic): string => diagnostic.code);
}

/** The original stationary marks defining the line of action. */
const PAIR: readonly ISubject[] = [
  { id: "alpha", position: { x: -1, y: 0, z: 0 } },
  { id: "bravo", position: { x: 1, y: 0, z: 0 } },
];

/**
 * Expose only the film-grammar diagnostic test's existing authored constructors,
 * clocks and two marks. Constructor references and PAIR retain shared identity;
 * each constructed scene/contract remains fresh and caller model/motion arrays
 * keep their original borrowing behavior. No new fixture value, expected answer,
 * geometry asset, driver or physical project is introduced by this split.
 */
export function createFilmGrammarFixtures(): {
  FPS: typeof FPS; ASPECT: typeof ASPECT; point: typeof point;
  boxModel: typeof boxModel; emptyModel: typeof emptyModel; walk: typeof walk;
  compiledShot: typeof compiledShot; shotContract: typeof shotContract;
  segmentOf: typeof segmentOf; readEdit: typeof readEdit; codes: typeof codes; PAIR: typeof PAIR;
} {
  return { FPS, ASPECT, point, boxModel, emptyModel, walk, compiledShot, shotContract, segmentOf, readEdit, codes, PAIR };
}
