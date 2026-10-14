import { compileCameraMove, computeModelRestExtent, intersectsPerspectiveFrustumBox, nodeSubjectBox, nodeSubjectExtent, realizeShotContract, resolveCameraAt } from "@automovie/engine";
import type { IAutoMovieCamera, IAutoMovieCameraAction, IAutoMovieClip, IAutoMovieFormationDesign, IAutoMovieModel, IAutoMovieTransform, IAutoMovieVector3 } from "@automovie/interface";

import type { IFilmFacadeGrade } from "./IFilmFacadeGrade";
import type { IFilmFacadeSubject } from "./IFilmFacadeSubject";
import { createFilmFacadeContract } from "./createFilmFacadeContract";
import { createFilmFacadeTransform as transform } from "./createFilmFacadeTransform";

/** The existing width scenario's numerical producers, sharing its authored constants without introducing additional cases or expected values. */
interface IWidthFixture {
  facade: (id: string, offset: number) => IAutoMovieModel;
  meshFacade: (id: string, offset: number) => IAutoMovieModel;
  worldBox: (model: IAutoMovieModel, placement: IAutoMovieTransform) => ReturnType<typeof nodeSubjectBox>;
  solve: (subject: IFilmFacadeSubject) => IAutoMovieClip;
  grade: (model: IAutoMovieModel, placement: IAutoMovieTransform, motion: IAutoMovieClip) => IFilmFacadeGrade;
  framesPoint: (motion: IAutoMovieClip, point: IAutoMovieVector3) => boolean;
  solvedDistance: (motion: IAutoMovieClip, aim: IAutoMovieVector3) => number;
}

/** Reuse the width test's original model, camera, compilation and numerical-readability arrangement. All original values arrive from that scenario and every invocation creates its original fresh operands; assertions remain in the discoverable test. */
export function createFilmCameraWidthFixture(props: {
  node: string; width: number; height: number; depth: number;
  fovY: number; aspect: number; halfY: number;
}): IWidthFixture {
  const facade: IWidthFixture["facade"] = (id: string, offset: number): IAutoMovieModel => ({
    id, name: null, origin: "generated",
    parts: [{ id: "wall", name: null, geometry: { type: "primitive", shape: { type: "box", width: props.width, height: props.height, depth: props.depth } }, material: null, attachedBone: null, transform: transform(offset, props.height / 2, 0) }],
    skeleton: null, body: null, materials: [], asset: null,
  });
  const meshFacade: IWidthFixture["meshFacade"] = (id: string, offset: number): IAutoMovieModel => {
    const corners: number[] = [];
    for (const x of [-props.width / 2, props.width / 2])
      for (const y of [-props.height / 2, props.height / 2])
        for (const z of [-props.depth / 2, props.depth / 2]) corners.push(x, y, z);
    return { ...facade(id, offset), parts: [{ ...facade(id, offset).parts[0]!, geometry: { type: "mesh", mesh: { positions: corners, normals: null, uvs: null, indices: null, skin: null } } }] };
  };
  const camera: () => IAutoMovieCamera = (): IAutoMovieCamera => ({
    id: "cam", transform: transform(0, 2, 200), fovY: props.fovY, near: 0.1, far: 1000,
    depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
  });
  const action: IAutoMovieCameraAction = {
    verb: "frame", actor: "cam", start: 0, duration: "auto", framing: "full", move: "static", on: { kind: "node", node: props.node },
  };
  const worldBox: IWidthFixture["worldBox"] = (model: IAutoMovieModel, placement: IAutoMovieTransform): ReturnType<typeof nodeSubjectBox> => nodeSubjectBox(placement, nodeSubjectExtent(computeModelRestExtent(model), null));
  const solve: IWidthFixture["solve"] = (subject: IFilmFacadeSubject): IAutoMovieClip => compileCameraMove({ clipId: "clip", camera: camera(), entries: [{ action, subject: { ...subject, at: null } }], shotDuration: 2, aspect: props.aspect })!;
  const grade: IWidthFixture["grade"] = (model: IAutoMovieModel, placement: IAutoMovieTransform, cameraMotion: IAutoMovieClip): IFilmFacadeGrade => {
    const result: ReturnType<typeof realizeShotContract> = realizeShotContract({
      contract: createFilmFacadeContract(props.node), production: null, frameFormat: { width: 1920, height: 1080 }, world: null,
      formations: new Map<string, IAutoMovieFormationDesign>(),
      compiled: {
        eventSamples: [], scene: { id: "scene", name: null, nodes: [{ id: props.node, model: model.id, transform: placement, pose: null, motion: null }], cameras: [camera()], lights: [] }, motions: [],
        shot: { id: "shot-facade", name: null, scene: "scene", camera: "cam", duration: 2, performances: [], objectMotions: [], cameraMotion }, models: [model],
      }, collisions: [],
    });
    return { readable: result.realization.camera.map((entry: typeof result.realization.camera[number]): number => entry.readableSubjects), refused: result.diagnostics.length !== 0 };
  };
  const framesPoint: IWidthFixture["framesPoint"] = (cameraMotion: IAutoMovieClip, point: IAutoMovieVector3): boolean => intersectsPerspectiveFrustumBox({
    camera: resolveCameraAt(camera().transform, cameraMotion, "cam", 0),
    min: { x: point.x - 0.05, y: point.y - 0.05, z: point.z - 0.05 }, max: { x: point.x + 0.05, y: point.y + 0.05, z: point.z + 0.05 },
    near: camera().near, far: camera().far, halfY: props.halfY, aspect: props.aspect,
  });
  const solvedDistance: IWidthFixture["solvedDistance"] = (cameraMotion: IAutoMovieClip, aim: IAutoMovieVector3): number => {
    const eye: IAutoMovieVector3 = resolveCameraAt(camera().transform, cameraMotion, "cam", 0).position;
    return Math.hypot(eye.x - aim.x, eye.y - aim.y, eye.z - aim.z);
  };
  return { facade, meshFacade, worldBox, solve, grade, framesPoint, solvedDistance };
}
