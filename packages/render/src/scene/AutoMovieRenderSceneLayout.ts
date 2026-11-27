import type {
  IAutoMovieConstructionPolyline,
  IAutoMovieGeometry,
  IAutoMovieLight,
  IAutoMovieModel,
  IAutoMovieRenderSoftPropFrame,
  IAutoMovieScene,
} from "@automovie/interface";
import type * as THREE from "three";

import { type IAutoMovieRenderApplySectionPlanesProps } from "./IAutoMovieRenderApplySectionPlanesProps.js";
import { type IAutoMovieRenderBuiltPropArticulation } from "./IAutoMovieRenderBuiltPropArticulation.js";
import { type IAutoMovieRenderMaterialLibrary } from "./IAutoMovieRenderMaterialLibrary.js";
import type { IAutoMovieRenderModelObject } from "./IAutoMovieRenderModelObject.js";
import type { IAutoMovieRenderPixelPoint } from "./IAutoMovieRenderPixelPoint.js";
import { type IAutoMovieRenderPlantingObject } from "./IAutoMovieRenderPlantingObject.js";
import type { IAutoMovieRenderSceneObject } from "./IAutoMovieRenderSceneObject.js";
import { type IAutoMovieRenderSceneSoftProps } from "./IAutoMovieRenderSceneSoftProps.js";
import { type IAutoMovieRenderSoftBodyObject } from "./IAutoMovieRenderSoftBodyObject.js";
import type { IAutoMovieRenderTextureResolver } from "./IAutoMovieRenderTextureResolver.js";
import { type IAutoMovieRenderBuildMaterialLibraryProps } from "./IAutoMovieRenderBuildMaterialLibraryProps.js";
import { type IAutoMovieRenderBuildPropArticulationProps } from "./IAutoMovieRenderBuildPropArticulationProps.js";
import { type IBuildPlantingObjectProps } from "./internal/IBuildPlantingObjectProps.js";
import { type IBuildSoftBodyObjectProps } from "./internal/IBuildSoftBodyObjectProps.js";
import { applyAutoMovieSectionPlanes as applyAutoMovieSectionPlanesImplementation } from "./internal/applyAutoMovieSectionPlanes.js";
import { buildAutoMovieConstruction as buildConstructionImplementation } from "./internal/buildAutoMovieConstruction.js";
import { buildAutoMovieMaterialLibrary as buildAutoMovieMaterialLibraryImplementation } from "./internal/buildAutoMovieMaterialLibrary.js";
import { buildGeometry as buildGeometryImplementation } from "./internal/buildGeometry.js";
import { buildLight as buildLightImplementation } from "./internal/buildLight.js";
import { buildModel as buildModelImplementation } from "./internal/buildModel.js";
import { buildPlantingObject as buildPlantingObjectImplementation } from "./internal/buildPlantingObject.js";
import { buildPropArticulation as buildPropArticulationImplementation } from "./internal/buildPropArticulation.js";
import { buildScene as buildSceneImplementation } from "./internal/buildScene.js";
import { buildSceneSoftProps as buildSceneSoftPropsImplementation } from "./internal/buildSceneSoftProps.js";
import { buildSoftBodyObject as buildSoftBodyObjectImplementation } from "./internal/buildSoftBodyObject.js";
import { captureAutoMovieMetricFrame as captureMetricFrameImplementation } from "./internal/captureAutoMovieMetricFrame.js";
import { createAutoMovieClosedSphereGeometry as createClosedSphereGeometryImplementation } from "./internal/createAutoMovieClosedSphereGeometry.js";
import { createAutoMovieMetricOrthographicCamera as createMetricOrthographicCameraImplementation } from "./internal/createAutoMovieMetricOrthographicCamera.js";

/** Public operations for Auto Movie Render Scene Layout. */
export namespace AutoMovieRenderSceneLayout {
  /** Inputs for a calibrated horizontal metric pixel chart. */
  export interface ICreateMetricOrthographicCameraProps {
    /** Positive physical output width in pixels. */
    width: number;
    /** Positive physical output height in pixels. */
    height: number;
    /** Positive world metres represented by one horizontal pixel. */
    pixelPitchMeters: number;
    /** Principal point in pixel-edge coordinates. */
    principalPointPx: IAutoMovieRenderPixelPoint;
    /** Horizontal viewing azimuth in radians. */
    azimuthRadians: number;
    /** Positive camera distance in metres; selects depth admission only. */
    distanceMeters: number;
    /** Positive near depth in metres. */
    nearMeters: number;
    /** Far depth in metres, greater than near. */
    farMeters: number;
  }

  /** Inputs for capturing the supplied scene through an explicit camera. */
  export interface ICaptureMetricFrameProps {
    /** Borrowed renderer whose dimensions, framebuffer and raster are restored. */
    renderer: THREE.WebGLRenderer;
    /** Caller-owned scene to capture. */
    scene: THREE.Scene;
    /** Explicit calibrated camera. */
    camera: THREE.Camera;
    /** Positive physical output width in pixels. */
    width: number;
    /** Positive physical output height in pixels. */
    height: number;
    /** Maximum admitted output pixel count. */
    maxPixels: number;
    /** Surface appearance or black silhouette over white. */
    mode: "surface" | "silhouette";
  }

  /**
   * Construct a native camera for a supplied horizontal metric pixel chart.
   * Pixel centres use column+0.5,row+0.5. Image U projects cos(a) X + sin(a) Z;
   * image V projects negative Y, with pitch in metres per pixel and principal
   * point in pixel-edge coordinates. No image distortion, pose estimation or
   * resizing is performed. Distance and near/far only select orthographic depth
   * admission; image scale is supplied independently by pitch. Native
   * projection and inverse matrices must remain finite and nonsingular at the
   * supplied gauge.
   */
  export function createMetricOrthographicCamera(
    input: ICreateMetricOrthographicCameraProps,
  ): THREE.OrthographicCamera {
    return createMetricOrthographicCameraImplementation(input);
  }

  /**
   * Capture the caller's current scene through an explicit calibrated camera.
   * The requested dimensions are physical output pixels, independent of the
   * borrowed renderer's device ratio. A silhouette pass uses black meshes on
   * white, separately from neutral-lit surface judgment. The caller selects
   * which scene subjects/construction are visible and redraws its ordinary
   * camera after this operation restores renderer dimensions, framebuffer
   * selection/raster and scene state. Logical and effective physical rectangles
   * remain distinct.
   */
  export function captureMetricFrame(input: ICaptureMetricFrameProps): string {
    return captureMetricFrameImplementation(input);
  }

  /**
   * Own a scene's soft props without retaining film samples. Each update
   * supplies the already evaluated world-space surfaces for one instant.
   */
  export function buildSceneSoftProps(
    scene: THREE.Scene,
  ): IAutoMovieRenderSceneSoftProps {
    return buildSceneSoftPropsImplementation(scene);
  }

  /**
   * Build the exact model material identities requested by simulated surfaces.
   *
   * Model parts cite materials inside one model, but water, soft furnishing,
   * and planting records cite only a material id. Such a citation therefore
   * resolves across the compiled model population and must have exactly one
   * definition. Repeated declarations are one definition only when their
   * complete records are structurally equal. Missing and conflicting
   * declarations are refused before any material is built, so model order can
   * never decide a visible result.
   *
   * Each admitted id is built once and shared by every borrowing surface.
   * Texture assets are primed through the shot cache before synchronous
   * material construction, together with the images carried by the models that
   * declare the requested materials; that cache owns binding-private texture
   * clones and decoded sources, while the returned library owns only the
   * `THREE.Material` objects. Construction refusal retires already-built
   * materials independently. Disposal attempts every material once, retains
   * failed ownership and preserves the same failure for repeated callers.
   */
  export function buildMaterialLibrary(
    props: IAutoMovieRenderBuildMaterialLibraryProps,
  ): Promise<IAutoMovieRenderMaterialLibrary> {
    return buildAutoMovieMaterialLibraryImplementation(props);
  }

  /**
   * Build a `three.js` geometry from a automovie geometry node: tessellating a
   * parametric primitive or bicubic atlas through its engine owner, or
   * uploading raw mesh arrays. Finite partial atlas output remains drawable
   * with its processing diagnostics. Morph targets become relative
   * `morphAttributes` named after their targets, which a mesh constructed on
   * the geometry lists in `morphTargetDictionary`. Its buffer object is owned
   * before tessellation or attribute initialization; an initialization refusal
   * independently reports disposal and its original cause rather than leaving
   * an unreturned allocation with no owner.
   */
  export function buildGeometry(
    geometry: IAutoMovieGeometry,
  ): THREE.BufferGeometry {
    return buildGeometryImplementation(geometry);
  }

  /**
   * Build the `three.js` light one staged light plays on, aimed the way the
   * artifact says. The kind decides the class; every value INCLUDING the
   * placement is written by {@link applyLightState}, the same call a shot's
   * `lightMotions` uses each frame, so placing a light and animating it cannot
   * map `range`, `coneAngle` or the transform two different ways; the two aimed
   * kinds then get their target ({@link aimLight}), which is the half of a
   * light's placement `three.js` does not read off a quaternion.
   *
   * The placement is deliberately NOT applied a second time here. It used to
   * be, back when `applyLightState` wrote everything except the transform; now
   * that one writer owns the whole light, repeating the call would be a second
   * statement of the same fact, and the kind of duplicate that survives right
   * up until the two copies disagree.
   *
   * Exported because a host that assembles its own scene graph (a production's
   * film page) must light it from `scene.lights` rather than from a hardcoded
   * source of its own: a page that lights itself proves nothing about the
   * film's lighting, which is how the aim defect in #1356 survived every
   * capture.
   */
  export function buildLight(light: IAutoMovieLight): THREE.Light {
    return buildLightImplementation(light);
  }

  /**
   * Project one derived plant and its arrangement into GPU-instanced batches.
   *
   * A nonempty bed with branches and leaves uses two instanced batches: one for
   * every branch of every member and one for every leaf. A leafless bed has
   * only the branch batch, and an empty bed's branch batch is hidden. Deriving
   * one prototype structure and placements avoids duplicating a scene subtree
   * per plant; actual draw submission remains the renderer's decision.
   *
   * Every instance matrix is the placement's full transform composed with the
   * branch or leaf's own translation, unit quaternion and per-axis scale on
   * both sides, composed as `Matrix4`. Nothing is reduced to a yaw or to one
   * uniform number: a member scaled `(1.2, 0.9, 1.2)` is drawn with that same
   * per-axis scale.
   *
   * A structure that has not emerged, or a bed whose every slot was refused, is
   * a hidden batch bounded at a point rather than an empty one bounded by
   * nothing: a bounding sphere computed over zero instances has a radius of
   * `-Infinity`, and a camera would cull against it.
   *
   * A branch is a unit cylinder scaled to `(r, length, r)` with `r` the mean of
   * its two radii and rotated from `+y` onto its own axis. The taper a segment
   * carries in the derived structure is therefore averaged, which is the stated
   * cost of drawing every branch in one instanced batch; the derived record
   * keeps both radii for anything that needs them. A leaf is a unit plane
   * scaled by its per-axis size, which is exactly the prototype the derivation
   * emitted.
   */
  export function buildPlantingObject(
    props: IBuildPlantingObjectProps,
  ): IAutoMovieRenderPlantingObject {
    return buildPlantingObjectImplementation(props);
  }

  /**
   * Build the moving parts of a shot's props into the scene a host assembled.
   *
   * A prop's articulation is data everywhere else in the pipeline: `forgeProp`
   * gates it, `sceneToNodes` lowers it under the placement, and the performance
   * boundary bounds a clip that drives it. On screen it was nothing at all: the
   * viewer built one model object per scene node and added it to that node's
   * group, so a hinge existed in the artifact and had no object to turn. A shot
   * could therefore carry a validated, ROM-checked swing that rendered a door
   * standing still, which is the silent drop this package refuses everywhere
   * else.
   *
   * Two things make the joint real, and they are separate:
   *
   * - **The frame.** Each declared joint becomes a `THREE.Object3D` at its own
   *   local transform, parented to its declared parent joint or, for a root
   *   joint, to the placement group the host already built. Its name is
   *   {@link placementChildNode}'s, the engine's own lowering law, so the object
   *   a clip channel names is found by the same string the artifact was gated
   *   against rather than by a second spelling of the prefix.
   * - **The part.** A joint that names a `mesh` takes that part of the prop's
   *   model out of the model root and carries it, so turning the joint turns
   *   something visible. The part does not move when it changes hands: its
   *   authored transform stays MODEL-local, which is the frame
   *   `propOccupancyBounds` measures the prop's volume in and every
   *   containment, bearing and clearance judgment is made against. A leaf hung
   *   on a hinge therefore stands exactly where the record says it stands, and
   *   only what carries it changes.
   *
   * Anything that cannot resolve throws rather than being skipped, the rule
   * {@link buildScene} states for an unresolvable node: a silently unparented
   * leaf renders frozen at its model's origin while every other part of the
   * frame looks right, and nothing downstream would report it.
   *
   * A prop drawing an imported appearance has no addressable parts (see
   * {@link AutoMovieRenderImportedModel.create}), so a joint of one may name no
   * `mesh`; its frame is still built and still turns whatever it holds.
   *
   * What this does NOT do is run a prop profile's drivers. A profile's limits
   * and drivers are resolved by `resolveFrame`, which is the engine's frame
   * solver rather than the viewer's, so a handle declared to mirror its hinge
   * is honored where the shot is gated and stands still where the shot is
   * drawn. Only the channels a clip carries move here, exactly as
   * {@link applyObjectMotions} states for every other object it drives.
   */
  export function buildPropArticulation(
    props: IAutoMovieRenderBuildPropArticulationProps,
  ): IAutoMovieRenderBuiltPropArticulation {
    return buildPropArticulationImplementation(props);
  }

  /**
   * Project one canonical Engine cloth surface into an owned Three mesh.
   * Positions, normals and UVs become Float32 attributes; installed SDK
   * setIndex chooses index representation. Engine drawn-panel bounds define the
   * sphere and null bounds hide a cord, while required userData.status
   * preserves solved/rest/derived/not-run/unsupported meaning. Default material
   * and DoubleSide values are unchanged and supplied material is borrowed.
   * Compatible buffers update in place; changed dimensions/index width transfer
   * geometry ownership and retire the prior geometry once. Failed retirement
   * blocks further updates and keeps its cause/owner for independent final
   * close. Current maintained consumers are the existing viewer units; no
   * production rendering route or native appearance is certified here.
   */
  export function buildSoftBodyObject(
    props: IBuildSoftBodyObjectProps,
  ): IAutoMovieRenderSoftBodyObject {
    return buildSoftBodyObjectImplementation(props);
  }

  /**
   * Put an inspection-owned section on an already-built scene and return the
   * same world-space planes assigned to its materials.
   *
   * Geometry and hierarchy remain unchanged while existing material clipping
   * fields and the renderer switch are overwritten. Every encountered material
   * slot receives the same plane array; prior arbitrary clipping policy is not
   * saved for restoration.
   *
   * {@link IAutoMovieSectionPlane.normal} points toward the removed half-space.
   * Negating and normalizing it through the same coplanar point expresses
   * Three's retained positive-side convention. Ideal zero signed distance
   * remains on the boundary; actual fragments depend on shader arithmetic and
   * the material's alpha-to-coverage policy, so CPU plane agreement does not
   * certify rendered boundary pixels.
   *
   * `clipIntersection` is written false so any clipping plane can remove a
   * fragment, matching the Engine's intersection of retained half-spaces rather
   * than preserving an incoming union policy.
   *
   * An empty list assigns null material planes and disables local clipping.
   * This clears the applied policy rather than restoring an earlier arbitrary
   * one, and no before-and-after pixel equality is established here.
   *
   * This operation sets needsUpdate only when a material's plane count changes;
   * moving plane values still rebuilds the planes and traverses the subtree.
   * Three owns program selection and compilation, including intersection-count
   * changes, so one version update does not measure a compile count or a
   * cost-free render.
   */
  export function applySectionPlanes(
    props: IAutoMovieRenderApplySectionPlanesProps,
  ): THREE.Plane[] {
    return applyAutoMovieSectionPlanesImplementation(props);
  }
  /** Arguments for building caller-authored construction polylines. */
  export interface IBuildConstructionProps {
    /**
     * Generating polylines in model metres; closed lines omit the repeated
     * endpoint.
     */
    lines: readonly IAutoMovieConstructionPolyline[];
    /** Drawing color and total point budget for the generated lines. */
    options: { color: number; maxPoints: number };
  }

  /**
   * Display caller-supplied generating polylines in model metres without
   * refitting. Closed lines omit the repeated endpoint. The builder owns one
   * material and one geometry per line, registers allocations before attachment
   * and transfers an idempotent asynchronous disposer. Public disposal attempts
   * every owned resource; it does not certify physical GPU-driver retirement.
   * The caller owns mounting.
   */
  export function buildConstruction(props: IBuildConstructionProps): {
    object: THREE.Group;
    dispose: () => Promise<void>;
  } {
    return buildConstructionImplementation(props.lines, props.options);
  }

  /** Inputs to build a rendered scene from authored scene data and model owners. */
  export interface IBuildSceneProps {
    /** Authored scene graph: nodes, cameras, lights, space, and environment. */
    scene: IAutoMovieScene;
    /** Resolve each node's model identifier to an already built object. */
    getModelObject: (modelId: string) => IAutoMovieRenderModelObject | undefined;
    /** Optional image environment assigned to the built scene. */
    environmentTexture?: THREE.Texture;
    /** Optional initial soft-prop frame, including an empty opt-in frame. */
    softFrame?: readonly IAutoMovieRenderSoftPropFrame[];
  }
  /**
   * Build a `three.js` scene from an {@link IAutoMovieScene}.
   *
   * `getModelObject` resolves a node's `model` id to a built
   * {@link IAutoMovieRenderModelObject}. If the same model id appears in multiple
   * nodes it should return a distinct object each call (a `three.js` object can
   * live in one place only). Each node is wrapped in a group placed at its
   * world transform, so node placement and a pose's own root transform compose
   * cleanly.
   *
   * Cameras and the four light kinds (point, area, directional and spot) map
   * onto their `three.js` equivalents.
   *
   * **The first `scene.nodes.length` top-level children ARE the designed nodes,
   * in design order.** Both mask passes read that: the legacy ramp colours the
   * Nth child with the Nth colour, and the stable semantic palette resolves a
   * designed node to `root.children[index]` (see
   * `AutoMovieRenderSemanticMask.apply`). Anything this function adds of its
   * own goes after them, and a host that prepends a child of its own breaks the
   * second one exactly as it always broke the first.
   *
   * A scene carrying a `space` also gets its structural ground (#1173): the
   * standable surfaces become real meshes under one `AutoMovieRenderSpaceGroupName` group
   * (see {@link AutoMovieRenderSceneSpace.buildObject}), so guide passes
   * describe a world instead of actors floating in a void. Their ordinary
   * material writes no beauty colour or depth, because a semantic support
   * declaration is not evidence that physical floor geometry exists. The group
   * follows the nodes and lights so the whole ground reads as one mask colour
   * rather than one per surface.
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
  export function buildScene(props: IBuildSceneProps): IAutoMovieRenderSceneObject {
    return buildSceneImplementation(
      props.scene,
      props.getModelObject,
      props.environmentTexture,
      props.softFrame,
    );
  }
  /** Inputs for a complete, seam-closed sphere geometry. */
  export interface ICreateClosedSphereGeometryProps {
    /**
     * Positive finite local-metre radius whose output remains representable.
     * Defaults to 1.
     */
    radius?: number;
    /**
     * Finite longitude segment count, floored with a minimum of three. Defaults
     * to 32.
     */
    widthSegments?: number;
    /**
     * Finite latitude segment count, floored with a minimum of two. Defaults to
     * 16.
     */
    heightSegments?: number;
  }

  /**
   * Create a complete sphere with one exact positional sample at its periodic
   * seam. The two UV columns keep separate indices and coordinates, while the
   * last column reuses the first column's position and normal. This preserves
   * exact closure after a shared rigid world transform. Nonfinite Float32
   * output, zero normals or collapsed indexed triangles refuse; the admissible
   * radius depends on the requested tessellation. The returned geometry is
   * caller-owned and should be disposed when its consumers retire.
   */
  export function createClosedSphereGeometry(
    props: ICreateClosedSphereGeometryProps = {},
  ): THREE.SphereGeometry {
    return createClosedSphereGeometryImplementation(
      props.radius,
      props.widthSegments,
      props.heightSegments,
    );
  }

  /**
   * Build a renderable `three.js` object from an {@link IAutoMovieModel}.
   *
   * Constructs the bone hierarchy, then attaches each part. A rigid part is
   * parented to its `attachedBone` and rides that bone. A mesh with skin data
   * and no rigid attachment becomes a `THREE.SkinnedMesh` bound to the
   * skeleton. If both signals are present, `attachedBone` wins: the part is
   * treated as a rigid prop and its skin payload is ignored by the viewer. An
   * `attachedBone` the skeleton does not carry throws, the same class as a skin
   * referencing a missing bone (#1106): a silently root-parented prop renders
   * frozen at the origin while everything else looks right.
   *
   * A skin whose `method` is `"dual-quaternion"` takes a material variant with
   * the dual quaternion vertex patch, and its mesh casts shadows through its
   * own patched depth and distance materials, so the shadow deforms like the
   * surface; the mesh is flagged so guide passes patch the materials they swap
   * in. Every skinned part is an {@link AutoMovieRenderSkinnedMesh} of its skin's
   * method, so bounds, culling, raycasts and vertex queries read the blend the
   * shader draws. Parts with the same ordered joint slots share one skeleton
   * and bone texture within this model; each mesh retains its own bind matrix
   * and blend method. Separate model builds own independent skeletons and pose
   * state.
   *
   * A mesh's morph targets reach `morphTargetDictionary` by name, so
   * {@link applyExpression} drives them, and its driven targets are recorded on
   * the mesh for {@link applyPose}.
   *
   * The returned `bones` map is what {@link applyPose} drives, and the model's
   * `lookAt` rides along so {@link AutoMovieRenderPlayer} can turn its eye
   * bones.
   *
   * `resolveTexture` is how a declared PBR finish gets its pixels, and it is
   * the host's to supply because this package performs no I/O: the caller
   * decodes the model's bindings first (an `AutoMovieRenderTextureCache` primes them
   * in one pass) and hands over an {@link IAutoMovieRenderTextureResolver} that
   * answers synchronously. Omitting it builds every material with its scalar
   * coefficients and no maps, which is exactly what a model declaring no
   * texture renders and what every pre-texture production still renders. The
   * resolver must answer with a texture object PER BINDING, because
   * {@link AutoMovieRenderMaterial.build} writes that binding's color space, UV
   * transform and sampler onto whatever it is given, and two slots sharing one
   * object would fight over one repeat. Every returned geometry and material is
   * registered as soon as it is acquired, before a later part, binding or
   * attachment can fail. Failure independently retires those owned objects,
   * including objects not yet attached to the group; successful return
   * transfers them to the caller. Texture wrappers stay with the resolver's
   * owner. A nested producer retires its own failed allocation. An anisotropic
   * rigid mesh without morph targets or normal maps receives native computed
   * tangents when its indexed normal/UV geometry supports them. Mapped and
   * deforming meshes retain their derivative frame: a rest tangent cannot
   * follow a morph or replace a transformed normal-map frame. This changes no
   * source arrays or material coefficients, is not a MikkTSpace bake guarantee
   * and leaves degenerate UVs on their existing fallback. Fully transparent,
   * non-transmissive parts stay hidden when a guide swaps materials. A part
   * whose material declares `wear` gets its own material instance and is drawn
   * non-indexed with its bind-pose feature edges, by
   * `AutoMovieRenderWearShading.apply`; disposing that material also disposes
   * its edge texture.
   */
  export function buildModel(
    model: IAutoMovieModel,
    resolveTexture?: IAutoMovieRenderTextureResolver,
  ): IAutoMovieRenderModelObject {
    return buildModelImplementation(model, resolveTexture);
  }
}
