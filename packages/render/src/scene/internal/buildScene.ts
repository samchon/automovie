import { AutoMovieEngineRenderShadow } from "@automovie/engine";
import type {
  IAutoMovieCamera,
  IAutoMovieRenderSoftPropFrame,
  IAutoMovieScene,
  IAutoMovieSpace,
} from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieRenderModelObject } from "../IAutoMovieRenderModelObject.js";
import type { IAutoMovieRenderSceneObject } from "../IAutoMovieRenderSceneObject.js";
import type { IAutoMovieRenderSceneSoftProps } from "../IAutoMovieRenderSceneSoftProps.js";
import { applyAutoMovieShadowParticipation } from "../internal/applyAutoMovieShadowParticipation.js";
import { applySceneEnvironment } from "../internal/applySceneEnvironment.js";
import { applySceneFog } from "../internal/applySceneFog.js";
import { applyTransform } from "../internal/applyTransform.js";
import { buildLight } from "../internal/buildLight.js";
import { buildSceneSoftProps } from "../internal/buildSceneSoftProps.js";
import { AutoMovieRenderSceneSpace } from "../buildSpace.js";
import { applySceneMedium } from "../medium/internal/applySceneMedium.js";
import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/*
 * Build a `three.js` scene from an IAutoMovieScene.
 *
 * `getModelObject` resolves a node's `model` id to a built
 * IAutoMovieRenderModelObject. If the same model id appears in multiple nodes
 * it should return a distinct object each call (a `three.js` object can live in
 * one place only). Each node is wrapped in a group placed at its world
 * transform, so node placement and a pose's own root transform compose
 * cleanly.
 *
 * Cameras and the four light kinds (point, area, directional and spot) map onto
 * their `three.js` equivalents.
 *
 * **The first `scene.nodes.length` top-level children ARE the designed nodes,
 * in design order.** Both mask passes read that: the legacy ramp colours the
 * Nth child with the Nth colour, and the stable semantic palette resolves a
 * designed node to `root.children[index]` (see
 * `AutoMovieRenderSemanticMask.apply`). Anything this function adds of its own
 * goes after them, and a host that prepends a child of its own breaks the
 * second one exactly as it always broke the first.
 *
 * A scene carrying a `space` also gets its structural ground (#1173): the
 * standable surfaces become real meshes under one `AutoMovieRenderSpaceGroupName` group (see
 * AutoMovieRenderSceneSpace.buildObject), so guide passes describe a
 * world instead of actors floating in a void. Their ordinary material writes
 * no beauty colour or depth, because a semantic support declaration is not
 * evidence that physical floor geometry exists. The group follows the nodes
 * and lights so the whole ground reads as one mask colour rather than one per
 * surface.
 *
 * An optional frame of soft props follows the designed scene objects. Its
 * returned handle updates plain surfaces at later times and releases the
 * meshes. Pass an empty frame to opt in before the first prop appears.
 *
 * The cited refusal contribution covers the supplied shadow profile and
 * unresolved node model. Complete hierarchy, material and numeric admission,
 * lowering receipts and structured safe-retry policy remain with their
 * corresponding owners.
 */
export const buildScene: (
  scene: IAutoMovieScene,
  getModelObject: (modelId: string) => IAutoMovieRenderModelObject | undefined,
  environmentTexture?: THREE.Texture,
  softFrame?: readonly IAutoMovieRenderSoftPropFrame[],
) => IAutoMovieRenderSceneObject = (
  scene: IAutoMovieScene,
  getModelObject: (modelId: string) => IAutoMovieRenderModelObject | undefined,
  environmentTexture?: THREE.Texture,
  softFrame?: readonly IAutoMovieRenderSoftPropFrame[],
): IAutoMovieRenderSceneObject => {
  const shadowProfile: ReturnType<typeof AutoMovieEngineRenderShadow.resolveAutoMovieShadowProfile> =
    AutoMovieEngineRenderShadow.resolveAutoMovieShadowProfile({
      lights: scene.lights,
      shadows: scene.environment?.shadows,
    });
  if (!shadowProfile.success)
    throw new Error(
      "Unsupported shadow profile: " + JSON.stringify(shadowProfile.violations),
    );
  const root: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene();

  for (const node of scene.nodes) {
    const built: IAutoMovieRenderModelObject | undefined = getModelObject(node.model);
    // Caller data that cannot resolve is an error, not a skip (#1051): both
    // mask passes read a designed node off its top-level child INDEX, so a
    // silently dropped node would shift every later node one place over and a
    // mask consumer would attribute pixels to the wrong node.
    if (built === undefined)
      throw new Error(
        `scene node "${node.id}" references model "${node.model}", which getModelObject could not resolve`,
      );
    const nodeGroup: THREE.Group<THREE.Object3DEventMap> = new THREE.Group();
    // Named, so a consumer can find a node's group by its scene id instead of
    // by position among `root.children`. The two agree today only because this
    // loop appends in design order, which a host that prepends anything of its
    // own silently breaks.
    nodeGroup.name = node.id;
    applyTransform(nodeGroup, node.transform);
    nodeGroup.add(built.object);
    // Static posing (node.pose) is done by the caller via `applyPose`, since it
    // needs the model's skeleton, which buildScene does not resolve here.
    root.add(nodeGroup);
  }

  // Lights stay top-level children, after the nodes, so the designed nodes keep
  // the leading run of `root.children` that both mask passes read them off. The
  // id map is built alongside so a shot's `lightMotions` can find one without
  // depending on where it landed.
  const lights: Map<string, THREE.Light> = new Map<string, THREE.Light>();
  for (const light of scene.lights) {
    const object: THREE.Light = buildLight(light);
    root.add(object);
    lights.set(light.id, object);
  }

  const space: IAutoMovieSpace | null = scene.space ?? null;
  if (space !== null) root.add(AutoMovieRenderSceneSpace.buildObject(space));

  // The atmosphere is a scene property, not an object: it takes no top-level
  // child, so the mask palette's child indices are untouched by declaring it.
  applySceneFog(root, scene.fog);
  applySceneMedium(root, scene.medium);
  applySceneEnvironment(root, scene.environment, environmentTexture);

  applyAutoMovieShadowParticipation(root);

  const cameras: THREE.PerspectiveCamera[] = scene.cameras.map(buildCamera);
  if (softFrame === undefined) return { scene: root, cameras, lights };
  const softProps: IAutoMovieRenderSceneSoftProps = buildSceneSoftProps(root);
  try {
    softProps.update(softFrame);
  } catch (error) {
    restoreAutoMovieRenderModeState([softProps.dispose], { error });
  }
  return { scene: root, cameras, lights, softProps };
};

const buildCamera: (cam: IAutoMovieCamera) => THREE.PerspectiveCamera = (
  cam: IAutoMovieCamera,
): THREE.PerspectiveCamera => {
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    cam.fovY,
    1,
    cam.near,
    cam.far,
  );
  applyTransform(camera, cam.transform);
  return camera;
};
