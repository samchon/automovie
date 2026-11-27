import { AutoMovieEngineMotionSampling, AutoMovieEngineFilm, AutoMovieEnginePopulationRuntime } from "@automovie/engine";
import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import type {
  IAutoMovieCamera,
  IAutoMovieCompiledFormationLod,
  IAutoMovieCompiledInstancePrototype,
  IAutoMovieCompiledInstanceSet,
  IAutoMovieComputeModelRestExtent,
  IAutoMovieEnvironment,
  IAutoMovieModel,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieSceneNode,
} from "@automovie/interface";
import {
  AutoMovieRenderHumanPolygon,
  AutoMovieRenderSceneLayout,
  AutoMovieRenderSceneResource,
  AutoMovieRenderSceneMotion,
  AutoMovieRenderInstanceSet,
  type IAutoMovieRenderBuiltPropArticulation,
  type IAutoMovieRenderDrawScene,
  type IAutoMovieRenderDrawView,
  type IAutoMovieRenderInstanceSetViewerObject,
  type IAutoMovieRenderModelObject,
  type IAutoMovieRenderSceneObject,
} from "@automovie/render";
import * as THREE from "three";

import { compileEnvironmentExample } from "./compileEnvironmentExample";

/**
 * Mount a compiled production example at exact shot seconds. The normal capture
 * host reads the actual stage, authored object clips and compiled canonical
 * actor poses used by the integration test.
 */
export function drawEnvironmentExample(
  input: compileEnvironmentExample.IInput,
  views?: Readonly<
    Record<string, (seconds: number) => IAutoMovieRenderDrawView>
  >,
): IAutoMovieRenderDrawScene {
  const { shot, body }: compileEnvironmentExample.IOutput =
    compileEnvironmentExample(input);
  const modelTable: Map<string, IAutoMovieModel> = new Map(
    (input.environment.runtime.models ?? []).map(
      (model: IAutoMovieModel): [string, IAutoMovieModel] => [model.id, model],
    ),
  );
  const modelObjects: Map<string, IAutoMovieRenderModelObject> = new Map();
  const figures: Map<string, AutoMovieRenderHumanPolygon.IDrawing> = new Map();
  const prepared: IAutoMovieRenderSceneObject = AutoMovieRenderSceneLayout.buildScene({
    scene: shot.source.scene,
    getModelObject: (modelId: string): IAutoMovieRenderModelObject | undefined => {
      const node: IAutoMovieSceneNode | undefined =
        shot.source.scene.nodes[modelObjects.size];
      if (node === undefined) return undefined;
      if (modelId === body.skeleton.id) {
        const drawing: AutoMovieRenderHumanPolygon.IDrawing = AutoMovieRenderHumanPolygon.build(
          AutoMovieHumanCanonicalBody.display(body),
        );
        const object: THREE.Group = new THREE.Group();
        object.matrixAutoUpdate = false;
        object.matrix.fromArray([...AutoMovieHumanCanonicalBody.REFLECTION]);
        object.add(drawing.object);
        const actor: IAutoMovieRenderModelObject = {
          object,
          bones: new Map(),
          parts: new Map(),
        };
        modelObjects.set(node.id, actor);
        figures.set(node.id, drawing);
        return actor;
      }
      const model: IAutoMovieModel | undefined = modelTable.get(modelId);
      if (model === undefined) return undefined;
      const object: IAutoMovieRenderModelObject = AutoMovieRenderSceneLayout.buildModel(model);
      modelObjects.set(node.id, object);
      return object;
    }
  });
  prepared.scene.background = new THREE.Color("#e2e8ee");
  const cameraIndex: number = shot.source.scene.cameras.findIndex(
    (camera: IAutoMovieCamera): boolean =>
      camera.id === shot.source.shot.camera,
  );
  const camera: THREE.PerspectiveCamera | undefined =
    prepared.cameras[cameraIndex];
  const stagedCamera: IAutoMovieCamera | undefined =
    shot.source.scene.cameras[cameraIndex];
  if (camera === undefined || stagedCamera === undefined)
    throw new Error("A compiled environment example needs a live camera");
  camera.aspect = 640 / 360;
  camera.updateProjectionMatrix();

  const nodeObjects: Map<string, THREE.Object3D> = new Map();
  for (const node of shot.source.scene.nodes) {
    const placed: THREE.Object3D | undefined = prepared.scene.getObjectByName(
      node.id,
    );
    if (placed === undefined)
      throw new Error(`A compiled node "${node.id}" has no scene object`);
    nodeObjects.set(node.id, placed);
  }
  const props: IAutoMovieEnvironment["runtime"]["props"] =
    input.environment.runtime.props;
  const articulation: IAutoMovieRenderBuiltPropArticulation = AutoMovieRenderSceneLayout.buildPropArticulation({
    props: props ?? [],
    scene: shot.source.scene,
    modelObjects,
    nodeObjects,
  });
  const motionTable: Map<string, IAutoMovieMotion> = new Map(
    shot.source.motions.map(
      (motion: IAutoMovieMotion): [string, IAutoMovieMotion] => [
        motion.id,
        motion,
      ],
    ),
  );
  const world: IAutoMovieEnvironment["runtime"]["world"] =
    input.environment.runtime.world;
  const projectionRadii: Map<string, number> = new Map();
  for (const set of world.instanceSets ?? []) {
    const model: IAutoMovieModel | undefined = modelTable.get(set.model);
    if (model === undefined || projectionRadii.has(model.id)) continue;
    const extent: IAutoMovieComputeModelRestExtent.IResult =
      AutoMovieEngineFilm.computeModelRestExtent(model);
    if (extent !== null)
      projectionRadii.set(
        model.id,
        Math.hypot(
          Math.max(Math.abs(extent.min.x), Math.abs(extent.max.x)),
          Math.max(Math.abs(extent.min.y), Math.abs(extent.max.y)),
          Math.max(Math.abs(extent.min.z), Math.abs(extent.max.z)),
        ),
      );
  }
  const instances: IAutoMovieRenderInstanceSetViewerObject[] = Object.values(
    AutoMovieEnginePopulationRuntime.materializeCompiledInstanceSetInventory({
      world,
      models: modelTable,
      projectionRadii,
    }),
  ).map(
    (
      instanceSet: IAutoMovieCompiledInstanceSet,
    ): IAutoMovieRenderInstanceSetViewerObject => {
      const tiers: readonly IAutoMovieCompiledFormationLod[] =
        instanceSet.prototypes?.flatMap(
          (
            prototype: IAutoMovieCompiledInstancePrototype,
          ): IAutoMovieCompiledFormationLod[] => prototype.lod,
        ) ?? instanceSet.lod;
      const runtimeModels: Map<string, IAutoMovieModel> = new Map();
      for (const tier of tiers) {
        const model: IAutoMovieModel | undefined = modelTable.get(tier.model);
        if (model !== undefined) runtimeModels.set(tier.runtimeModel, model);
      }
      return AutoMovieRenderInstanceSet.buildInstancedInstanceSet({ instanceSet, models: runtimeModels });
    },
  );
  for (const population of instances) prepared.scene.add(population.object);
  return {
    scene: prepared.scene,
    camera,
    durationSeconds: input.seconds,
    fps: 24,
    width: 640,
    height: 360,
    views,
    seek: async (seconds: number): Promise<void> => {
      for (const node of shot.source.scene.nodes)
        AutoMovieRenderSceneMotion.applyTransform(nodeObjects.get(node.id)!, node.transform);
      AutoMovieRenderSceneMotion.applyTransform(camera, stagedCamera.transform);
      articulation.restore();
      AutoMovieRenderSceneMotion.applyObjectMotions(
        shot.source.shot.objectMotions,
        seconds,
        (id: string): THREE.Object3D | undefined =>
          nodeObjects.get(id) ?? articulation.joints.get(id),
      );
      if (shot.source.shot.cameraMotion !== null)
        AutoMovieRenderSceneMotion.applyObjectMotion(shot.source.shot.cameraMotion, seconds, () => camera);
      for (const performance of shot.source.shot.performances) {
        const figure: AutoMovieRenderHumanPolygon.IDrawing | undefined = figures.get(
          performance.node,
        );
        const motion: IAutoMovieMotion | undefined =
          performance.motion === null
            ? undefined
            : motionTable.get(performance.motion);
        if (figure === undefined || motion === undefined) continue;
        const pose: IAutoMoviePose = AutoMovieEngineMotionSampling.sampleMotion(
          motion,
          Math.max(0, seconds - performance.startOffset),
        ).pose;
        figure.setPose({
          posed: AutoMovieHumanCanonicalBody.display(body, pose).posed,
        });
      }
      prepared.scene.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);
      for (const population of instances) population.update(camera, 360);
    },
    dispose: (): void => {
      for (const population of instances) population.dispose();
      for (const figure of figures.values()) {
        figure.object.removeFromParent();
        figure.dispose();
      }
      for (const resource of AutoMovieRenderSceneResource.collectOwnedResources(prepared.scene))
        resource.dispose();
      prepared.scene.clear();
    },
  };
}
