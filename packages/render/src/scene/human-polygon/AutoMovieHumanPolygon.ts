import type {
  IAutoMovieHumanSkeleton,
  IAutoMoviePolygonBodyCue,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import type * as THREE from "three";

/**
 * Actual Three drawing handles for the original polygon mannequin.
 * Inputs use the canonical Human skeleton bone and placement contracts directly.
 *
 * The mannequin stays deliberately simple: a fix corrects a wrong value within
 * the same primitives and segment count, never adds geometry, detail or
 * realism, because its job is a cheap, deterministic silhouette for motion
 * checks and diffusion hints.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents frames, units, source exterior requirements, actual mesh registries and rigid-joint limitations.
 * @evidence contracts/development/design.md#principled-representation Represents Structural inputs and actual drawing handles for the original polygon mannequin: one renderer-owned drawing handle; Human owns registered skeletal data and the renderer owns concrete native objects.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieHumanPolygon` in packages/render/src/scene/human-polygon/AutoMovieHumanPolygon.ts; its retained IDrawing serves native display consumers; skeletal inputs are shared through IAutoMovieHumanSkeleton.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; the native drawing handle borrows canonical Human placements rather than restating their shape.
 */
export namespace AutoMovieHumanPolygon {
  /**
   * Source-clock readers and authored cues for one actor's visible drawing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the subject filter, source clock and body-to-world frame convention.
   * @evidence contracts/development/design.md#principled-representation Shares canonical authored cues, placements and rigid transforms at the drawing boundary.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Render receives the existing source pose and optional staging reader without owning either timeline.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Actor staging remains caller-owned and the pose contains the original evaluated bones.
   */
  export interface IPresentation {
    /** Exact staged actor identity. Only matching cues apply to this drawing. */
    subject: string;

    /** Cues in shot-local source seconds. Selected bone subtrees must be disjoint. */
    cues: readonly IAutoMoviePolygonBodyCue[];

    /** Complete, deterministic source pose in Human body coordinates at the given seconds. */
    poseAt: (seconds: number) => Pick<IAutoMovieHumanSkeleton.IOutput, "posed">;

    /** Actor-local to shot-world rigid frame, identity when omitted. The host applies it through the drawing's parent. */
    actorFrameAt?: (seconds: number) => IAutoMovieRigidTransform;
  }

  /**
   * Actual rigid polygon drawing and its owned resource lifetime.
   *
   * @evidence contracts/development/design.md#principled-representation Registries expose actual mesh and flat bone groups; local vertices and probe points equal registered rest points minus that bone's rest joint, then the group's evaluated placement and actor parent transform apply once.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Retains the original surface/sections/head/palette/disposal ports and adds explicit registry and pose ports without a second rig or motion controller.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Meshes are rigid modules that can overlap/separate at joints; the registries do not claim continuous skin or collision certification.
   * @evidence contracts/development/common.md#meaningful-documentation Gives local-point frame, actor-root ownership, pose admission and resource lifetime including separately owned attached faces.
   */
  export interface IDrawing {
    /** Actor-local root; the host applies actor placement through its parent. */
    object: THREE.Group;

    /** Flat rigid surface modules, individually bound by evaluator bone id. */
    surface: THREE.Group;

    /** Matching construction diagnostics; initially hidden. */
    sections: THREE.Group;

    /** Actual surface mesh by emitted bone identity, stable until disposal. */
    parts: ReadonlyMap<string, THREE.Mesh>;

    /** Actual surface group by emitted bone identity; owns that bone-local frame. */
    bones: ReadonlyMap<string, THREE.Group>;

    /** Surface and diagnostic groups sharing each emitted bone placement. */
    bindings: ReadonlyMap<string, readonly THREE.Object3D[]>;

    /** Actual head group and its emitted, unposed local polygon extent. */
    head: {
      /** Attach a separately owned face or equipment in head-local metres. */
      object: THREE.Group;

      /** Minimum actual local polygon coordinate, metres. */
      min: [number, number, number];

      /** Maximum actual local polygon coordinate, metres. */
      max: [number, number, number];

      /** Frontmost local triangle X at Y/Z, undefined outside the silhouette. */
      frontAt: (y: number, z: number) => number | undefined;
    };

    /**
     * Apply an admitted complete pose to existing polygon groups and refresh world matrices.
     *
     * @evidence contracts/development/implementation.md#principled-implementation The builder checks retirement, then applyHumanPolygonPose validates finite tuples, unique and required bone identities and unit-quaternion tolerance before writing flat body-frame placements and refreshing ancestor/subtree matrices.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure This port delegates numerical admission and group writes to the shared pose adapter; actor placement, body evaluation and rendering remain host-owned.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Existing actual groups and source geometry are used without quaternion normalization, hidden scaling, collider replacement or invented bone transforms.
     * @evidence contracts/development/common.md#meaningful-documentation The input carries metre joint positions and bind-relative x-y-z-w rotations; invalid poses or retired drawings throw, and the original support reference is retained.
     * @evidence contracts/development/implementation.md#efficient-algorithms The adapter costs O(B+G+A+O) for supplied/required bones, bound groups, ancestors and subtree nodes, with one O(B) placement map and no geometry rebuild.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses stable groups, geometry and matrices; mutable input placements are admitted on every call rather than cached by identity.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Temporary placement references expire after the call; drawing resources retain their existing owner and no clock or task is acquired.
     */
    setPose: (output: Pick<IAutoMovieHumanSkeleton.IOutput, "posed">) => void;

    /**
     * Draw the source pose with authored polygon cues at the given shot-local seconds.
     * Present when the drawing was built with a presentation.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Specifies availability, units and source clock.
     * @evidence contracts/development/implementation.md#principled-implementation Samples visual poses from the requested time and applies them through setPose.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure The prepared sampler owns cue arithmetic and setPose owns graphics updates.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The source pose and graphics inventory are reused for each seek.
     * @evidence contracts/development/implementation.md#efficient-algorithms Sampling and applying a complete pose are both linear in the skeletal drawing size.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Release frames are captured once and reused by any ordering of seeks.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The drawing releases its sampler at disposal and refuses drawing after retirement.
     */
    drawAt?: (seconds: number) => void;

    /**
     * Replace emitted-part RGB overrides; undefined restores the borrowed clay material.
     *
     * @evidence contracts/development/implementation.md#principled-implementation The builder refuses retired drawings; the palette validates integer RGB values, builds complete new assignments, publishes them, then attempts retirement of the previous material pool.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Palette replacement owns material selection independently of fixed anatomy, geometry and pose; drawing disposal remains the outer lifetime boundary.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All supplied values, including unmatched keys, require integers in [0,0xffffff]; no clamping or anatomy inference substitutes for admission, and replacement failures remain sticky.
     * @evidence contracts/development/common.md#meaningful-documentation Optional bone-name RGB overrides affect emitted parts only; omitted entries use clay, and thrown retirement or replacement errors propagate to the host.
     * @evidence contracts/development/implementation.md#efficient-algorithms One replacement scans P parts and C previous colours in O(P+C) work and allocates at most one new material per distinct matched RGB value.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Equal current RGB values share a cloned material; unoverridden parts reuse clay and existing geometry remains unchanged.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The drawing owns current and bounded uncertain palette pools until its guarded retirement; caller-owned faces and equipment are outside that pool.
     */
    setPartColors: (colors?: Readonly<Record<string, number>>) => void;

    /**
     * Attempt retirement of owned drawing resources once; attached faces remain caller-owned.
     *
     * @evidence contracts/development/implementation.md#principled-implementation The builder marks retirement before its existing fan-out attempts geometry, base and line materials, palette, scene detachment and registry cleanup; any failure is retained and rethrown on later calls.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One drawing disposer owns the complete resource fan-out and delegates ordered error reporting to the existing retirement collector.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retired drawings refuse pose/palette updates; successful repeated disposal is a no-op, and failed resource operations are not retried or replaced by a success claim.
     * @evidence contracts/development/common.md#meaningful-documentation Disposal retires this builder's geometry/materials and graph ownership, while independently created attached faces and equipment require their own owner cleanup.
     * @evidence contracts/development/implementation.md#efficient-algorithms Retirement is linear in owned geometries, materials and registry entries; later successful calls are constant-time no-ops and failed calls rethrow the retained cause.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the existing ownership inventories and current palette pool; it does not reconstruct geometry or rerun attempted cleanup.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Successful retirement clears geometry and palette references; failure retains bounded uncertain owners and its original reported cause without opening a background cleanup task.
     */
    dispose: () => void;
  }
}
