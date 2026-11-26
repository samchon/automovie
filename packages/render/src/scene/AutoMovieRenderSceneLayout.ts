import { type IAutoMovieMaterialLibrary } from "./IAutoMovieMaterialLibrary.js";
import { type IBuildAutoMovieMaterialLibraryProps } from "./IBuildAutoMovieMaterialLibraryProps.js";
import { buildAutoMovieMaterialLibrary as buildAutoMovieMaterialLibraryImplementation } from "./internal/buildAutoMovieMaterialLibrary.js";
import { type IAutoMovieGeometry, type IAutoMovieLight } from "@automovie/interface";
import { buildGeometry as buildGeometryImplementation } from "./internal/buildGeometry.js";
import { buildLight as buildLightImplementation } from "./internal/buildLight.js";
import { type IAutoMoviePlantingObject } from "./IAutoMoviePlantingObject.js";
import { type IBuildPlantingObjectProps } from "./internal/IBuildPlantingObjectProps.js";
import { buildPlantingObject as buildPlantingObjectImplementation } from "./internal/buildPlantingObject.js";
import { type IAutoMovieBuiltPropArticulation } from "./IAutoMovieBuiltPropArticulation.js";
import { type IBuildPropArticulationProps } from "./IBuildPropArticulationProps.js";
import { buildPropArticulation as buildPropArticulationImplementation } from "./internal/buildPropArticulation.js";
import { type IAutoMovieSoftBodyObject } from "./IAutoMovieSoftBodyObject.js";
import { type IBuildSoftBodyObjectProps } from "./internal/IBuildSoftBodyObjectProps.js";
import { buildSoftBodyObject as buildSoftBodyObjectImplementation } from "./internal/buildSoftBodyObject.js";
import { type IApplyAutoMovieSectionPlanesProps } from "./IApplyAutoMovieSectionPlanesProps.js";
import { applyAutoMovieSectionPlanes as applyAutoMovieSectionPlanesImplementation } from "./internal/applyAutoMovieSectionPlanes.js";

import type * as THREE from "three";
import { type IAutoMovieSceneSoftProps } from "./IAutoMovieSceneSoftProps.js";
import { buildSceneSoftProps as buildSceneSoftPropsImplementation } from "./internal/buildSceneSoftProps.js";

/** Public operations for Auto Movie Render Scene Layout. */
export namespace AutoMovieRenderSceneLayout {
  /**
   * Own a scene's soft props without retaining film samples. Each update supplies
   * the already evaluated world-space surfaces for one instant.
   */
  export function buildSceneSoftProps(scene: THREE.Scene): IAutoMovieSceneSoftProps {
    return buildSceneSoftPropsImplementation(scene);
  }

  /**
   * Build the exact model material identities requested by simulated surfaces.
   *
   * Model parts cite materials inside one model, but water, soft furnishing, and
   * planting records cite only a material id. Such a citation therefore resolves
   * across the compiled model population and must have exactly one definition.
   * Repeated declarations are one definition only when their complete records are
   * structurally equal. Missing and conflicting declarations are refused before
   * any material is built, so model order can never decide a visible result.
   *
   * Each admitted id is built once and shared by every borrowing surface. Texture
   * assets are primed through the shot cache before synchronous material
   * construction, together with the images carried by the models that declare the
   * requested materials; that cache owns binding-private texture clones and
   * decoded sources, while the returned library owns only the `THREE.Material`
   * objects. Construction refusal retires already-built materials independently.
   * Disposal attempts every material once, retains failed ownership and preserves
   * the same failure for repeated callers.
   */
  export function buildMaterialLibrary(props: IBuildAutoMovieMaterialLibraryProps): Promise<IAutoMovieMaterialLibrary> {
    return buildAutoMovieMaterialLibraryImplementation(props);
  }

  /**
   * Build a `three.js` geometry from a automovie geometry node: tessellating a
   * parametric primitive or bicubic atlas through its engine owner, or uploading
   * raw mesh arrays. Finite partial atlas output remains drawable with its
   * processing diagnostics. Morph targets become relative `morphAttributes` named
   * after their targets, which a mesh constructed on the geometry lists in
   * `morphTargetDictionary`. Its buffer object is owned before tessellation or
   * attribute initialization; an initialization refusal independently reports
   * disposal and its original cause rather than leaving an unreturned allocation
   * with no owner.
   */
  export function buildGeometry(geometry: IAutoMovieGeometry): THREE.BufferGeometry {
    return buildGeometryImplementation(geometry);
  }

  /**
   * Build the `three.js` light one staged light plays on, aimed the way the
   * artifact says. The kind decides the class; every value INCLUDING the
   * placement is written by {@link applyLightState}, the same call a shot's
   * `lightMotions` uses each frame, so placing a light and animating it cannot
   * map `range`, `coneAngle` or the transform two different ways; the two aimed
   * kinds then get their target ({@link aimLight}), which is the half of a light's
   * placement `three.js` does not read off a quaternion.
   *
   * The placement is deliberately NOT applied a second time here. It used to be,
   * back when `applyLightState` wrote everything except the transform; now that
   * one writer owns the whole light, repeating the call would be a second
   * statement of the same fact, and the kind of duplicate that survives right up
   * until the two copies disagree.
   *
   * Exported because a host that assembles its own scene graph (a production's
   * film page) must light it from `scene.lights` rather than from a hardcoded
   * source of its own: a page that lights itself proves nothing about the film's
   * lighting, which is how the aim defect in #1356 survived every capture.
   */
  export function buildLight(light: IAutoMovieLight): THREE.Light {
    return buildLightImplementation(light);
  }

  /**
   * Project one derived plant and its arrangement into GPU-instanced batches.
   *
   * A nonempty bed with branches and leaves uses two instanced batches: one for
   * every branch of every member and one for every leaf. A leafless bed has only
   * the branch batch, and an empty bed's branch batch is hidden. Deriving one
   * prototype structure and placements avoids duplicating a scene subtree per
   * plant; actual draw submission remains the renderer's decision.
   *
   * Every instance matrix is the placement's full transform composed with the
   * branch or leaf's own translation, unit quaternion and per-axis scale on both
   * sides, composed as `Matrix4`. Nothing is reduced to a yaw or to one uniform
   * number: a member scaled `(1.2, 0.9, 1.2)` is drawn with that same per-axis
   * scale.
   *
   * A structure that has not emerged, or a bed whose every slot was refused, is a
   * hidden batch bounded at a point rather than an empty one bounded by nothing:
   * a bounding sphere computed over zero instances has a radius of `-Infinity`,
   * and a camera would cull against it.
   *
   * A branch is a unit cylinder scaled to `(r, length, r)` with `r` the mean of
   * its two radii and rotated from `+y` onto its own axis. The taper a segment
   * carries in the derived structure is therefore averaged, which is the stated
   * cost of drawing every branch in one instanced batch; the derived record keeps
   * both radii for anything that needs them. A leaf is a unit plane scaled by its
   * per-axis size, which is exactly the prototype the derivation emitted.
   */
  export function buildPlantingObject(props: IBuildPlantingObjectProps): IAutoMoviePlantingObject {
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
   *   {@link placementChildNode}'s, the engine's own lowering law, so the object a
   *   clip channel names is found by the same string the artifact was gated
   *   against rather than by a second spelling of the prefix.
   * - **The part.** A joint that names a `mesh` takes that part of the prop's model
   *   out of the model root and carries it, so turning the joint turns something
   *   visible. The part does not move when it changes hands: its authored
   *   transform stays MODEL-local, which is the frame `propOccupancyBounds`
   *   measures the prop's volume in and every containment, bearing and clearance
   *   judgment is made against. A leaf hung on a hinge therefore stands exactly
   *   where the record says it stands, and only what carries it changes.
   *
   * Anything that cannot resolve throws rather than being skipped, the rule
   * {@link buildScene} states for an unresolvable node: a silently unparented leaf
   * renders frozen at its model's origin while every other part of the frame
   * looks right, and nothing downstream would report it.
   *
   * A prop drawing an imported appearance has no addressable parts (see
   * {@link createImportedModelObject}), so a joint of one may name no `mesh`; its
   * frame is still built and still turns whatever it holds.
   *
   * What this does NOT do is run a prop profile's drivers. A profile's limits and
   * drivers are resolved by `resolveFrame`, which is the engine's frame solver
   * rather than the viewer's, so a handle declared to mirror its hinge is honored
   * where the shot is gated and stands still where the shot is drawn. Only the
   * channels a clip carries move here, exactly as {@link applyObjectMotions}
   * states for every other object it drives.
   */
  export function buildPropArticulation(props: IBuildPropArticulationProps): IAutoMovieBuiltPropArticulation {
    return buildPropArticulationImplementation(props);
  }

  /**
   * Project one canonical Engine cloth surface into an owned Three mesh.
   * Positions, normals and UVs become Float32 attributes; installed SDK setIndex
   * chooses index representation. Engine drawn-panel bounds define the sphere and
   * null bounds hide a cord, while required userData.status preserves
   * solved/rest/derived/not-run/unsupported meaning. Default material and
   * DoubleSide values are unchanged and supplied material is borrowed. Compatible
   * buffers update in place; changed dimensions/index width transfer geometry
   * ownership and retire the prior geometry once. Failed retirement blocks
   * further updates and keeps its cause/owner for independent final close.
   * Current maintained consumers are the existing viewer units; no production
   * rendering route or native appearance is certified here.
   */
  export function buildSoftBodyObject(props: IBuildSoftBodyObjectProps): IAutoMovieSoftBodyObject {
    return buildSoftBodyObjectImplementation(props);
  }

  /**
   * Put an inspection-owned section on an already-built scene and return the same
   * world-space planes assigned to its materials.
   *
   * Geometry and hierarchy remain unchanged while existing material clipping
   * fields and the renderer switch are overwritten. Every encountered material
   * slot receives the same plane array; prior arbitrary clipping policy is not
   * saved for restoration.
   *
   * {@link IAutoMovieSectionPlane.normal} points toward the removed half-space.
   * Negating and normalizing it through the same coplanar point expresses Three's
   * retained positive-side convention. Ideal zero signed distance remains on the
   * boundary; actual fragments depend on shader arithmetic and the material's
   * alpha-to-coverage policy, so CPU plane agreement does not certify rendered
   * boundary pixels.
   *
   * `clipIntersection` is written false so any clipping plane can remove a
   * fragment, matching the Engine's intersection of retained half-spaces rather
   * than preserving an incoming union policy.
   *
   * An empty list assigns null material planes and disables local clipping. This
   * clears the applied policy rather than restoring an earlier arbitrary one, and
   * no before-and-after pixel equality is established here.
   *
   * This operation sets needsUpdate only when a material's plane count changes;
   * moving plane values still rebuilds the planes and traverses the subtree.
   * Three owns program selection and compilation, including intersection-count
   * changes, so one version update does not measure a compile count or a
   * cost-free render.
   */
  export function applySectionPlanes(props: IApplyAutoMovieSectionPlanesProps): THREE.Plane[] {
    return applyAutoMovieSectionPlanesImplementation(props);
  }
}
