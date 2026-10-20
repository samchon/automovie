import { resolveAutoMovieShadowProfile } from "@automovie/engine";
import type {
  IAutoMovieCamera,
  IAutoMovieScene,
  IAutoMovieSpace,
} from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieModelObject } from "./IAutoMovieModelObject.js";
import type { IAutoMovieSceneObject } from "./IAutoMovieSceneObject.js";
import { applyAutoMovieShadowParticipation } from "./applyAutoMovieShadowParticipation.js";
import { applySceneEnvironment } from "./applySceneEnvironment.js";
import { applySceneFog } from "./applySceneFog.js";
import { applyTransform } from "./applyTransform.js";
import { buildLight } from "./buildLight.js";
import { buildSpaceObject } from "./buildSpace.js";

/**
 * Build a `three.js` scene from an {@link IAutoMovieScene}.
 *
 * `getModelObject` resolves a node's `model` id to a built
 * {@link IAutoMovieModelObject}. If the same model id appears in multiple nodes
 * it should return a distinct object each call (a `three.js` object can live in
 * one place only). Each node is wrapped in a group placed at its world
 * transform, so node placement and a pose's own root transform compose
 * cleanly.
 *
 * Cameras and the four light kinds (point, area, directional and spot) map onto their `three.js` equivalents.
 *
 * **The first `scene.nodes.length` top-level children ARE the designed nodes,
 * in design order.** Both mask passes read that: the legacy ramp colours the
 * Nth child with the Nth colour, and the stable semantic palette resolves a
 * designed node to `root.children[index]` (see
 * {@link applyAutoMovieSemanticMask}). Anything this function adds of its own
 * goes after them, and a host that prepends a child of its own breaks the
 * second one exactly as it always broke the first.
 *
 * A scene carrying a `space` also gets its structural ground (#1173): the
 * standable surfaces become real meshes under one `SPACE_GROUP_NAME` group (see
 * {@link buildSpaceObject}), so guide passes describe a world instead of actors
 * floating in a void. Their ordinary material writes no beauty colour or depth,
 * because a semantic support declaration is not evidence that physical floor
 * geometry exists. The group is added LAST, after the nodes and lights, for
 * that reason, and so the whole ground reads as one mask colour rather than one
 * per surface.
 *
 * The cited refusal contribution covers the supplied shadow profile and unresolved node model. Complete hierarchy, material and numeric admission, lowering receipts and structured safe-retry policy remain with their corresponding owners.
 *
 * @evidence contracts/common.md#principled-implementation Preserves authored node order under placement groups, admits the shadow profile, builds native lights/cameras, optional semantic support, fog and environment; each resolver call must supply a distinct mutable model object and valid admitted TRS. Static pose/props/compiled populations are not lowered here and current production pages assemble their own graph rather than calling this producer.
 * @evidence contracts/common.md#clear-and-simple-design Owns the scene graph join and camera/light lookup result while model loading/building, articulation, temporal sampling and rendering remain external; leading node-child order exposes the existing positional semantic-mask dependency.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses unresolved models rather than dropping an authored child and shifting mask indices; no fixture nodes/lights are invented, but complete admission and partial-construction rollback are not supplied by this scene wrapper.
 * @evidence contracts/common.md#meaningful-documentation States resolver uniqueness, authored node order, placement/root composition, semantic-ground beauty exclusion, static-pose caller duty and explicit refusal/admission ownership boundary.
 * @evidence contracts/performance.md#efficient-algorithms Builds N placement groups, L lights and C cameras with id maps plus support tessellation and shadow participation traversal; dominant memory follows actual model/support resources returned by producers, and no anonymous member runtime is created here.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses canonical transform/light/fog/environment/space adapters and maps lights by semantic id; model object reuse across placements is invalid because native parenting is exclusive, and scene-level effectful construction is not cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Transfers new scene/group/light/camera/support references and adopts resolver model objects into the result; environment texture handoff has its separate exclusive owner. No universal scene disposer or late-refusal rollback is returned, so callers must own both retirement and partially assembled graph recovery rather than assuming this wrapper frees them.
 */
export const buildScene: (
  scene: IAutoMovieScene,
  getModelObject: (modelId: string) => IAutoMovieModelObject | undefined,
  environmentTexture?: THREE.Texture,
) => IAutoMovieSceneObject = (
  scene: IAutoMovieScene,
  getModelObject: (modelId: string) => IAutoMovieModelObject | undefined,
  environmentTexture?: THREE.Texture,
): IAutoMovieSceneObject => {
  const shadowProfile: ReturnType<typeof resolveAutoMovieShadowProfile> =
    resolveAutoMovieShadowProfile({
      lights: scene.lights,
      shadows: scene.environment?.shadows,
    });
  if (!shadowProfile.success)
    throw new Error(
      "Unsupported shadow profile: " + JSON.stringify(shadowProfile.violations),
    );
  const root: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene();

  for (const node of scene.nodes) {
    const built: IAutoMovieModelObject | undefined = getModelObject(node.model);
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
  if (space !== null) root.add(buildSpaceObject(space));

  // The atmosphere is a scene property, not an object: it takes no top-level
  // child, so the mask palette's child indices are untouched by declaring it.
  applySceneFog(root, scene.fog);
  applySceneEnvironment(root, scene.environment, environmentTexture);

  applyAutoMovieShadowParticipation(root);

  const cameras: THREE.PerspectiveCamera[] = scene.cameras.map(buildCamera);
  return { scene: root, cameras, lights };
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
