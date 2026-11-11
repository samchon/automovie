import type * as THREE from "three";

/**
 * Structural inputs and actual drawing handles for the original polygon
 * mannequin. Human's public skeleton output is structurally assignable; no
 * generator or example motion is imported by this optional Viewer entry.
 *
 * The mannequin stays deliberately simple: a fix corrects a wrong value within
 * the same primitives and segment count, never adds geometry, detail or
 * realism, because its job is a cheap, deterministic silhouette for motion
 * checks and diffusion hints.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents frames, units, source exterior requirements, actual mesh registries and rigid-joint limitations.
 * @evidence contracts/development/design.md#principled-representation Represents Structural inputs and actual drawing handles for the original polygon mannequin: companion namespace of 4 members (`IInput`, `IBone`, `IPlacement`, `IDrawing`); units and frames named in its text: frame, metres, metre, quaternion, local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieHumanPolygon` in packages/viewer/src/human-polygon/AutoMovieHumanPolygon.ts; its surface is the 4 members listed and the text shows 21 other files naming it, mostly movies (10), packages/viewer (8), test (3), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieHumanPolygon {
  /**
   * A fixed body's rest joints and its evaluated placement in the body frame.
   *
   * @evidence contracts/development/design.md#principled-representation Supplies rest joints, posed transforms and source neck/head exterior independently rather than deriving one from a display approximation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Contains only fields read by the renderer; generator outputs may carry additional provenance and clinical diagnostics.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The descriptor contains no person selector, authored motion or fitted replacement surface.
   * @evidence contracts/development/common.md#meaningful-documentation States fixed-rest, pose and optional exterior meanings; the builder requires the exterior for its original neck/head geometry.
   */
  export interface IInput {
    /** Rest joints in registered body metres, parent before child. */
    bones: IBone[];

    /** Evaluated placements in the body frame, including custom joints. */
    posed: IPlacement[];
  }

  /**
   * One original rest joint and the segment leaving it.
   *
   * @evidence contracts/development/design.md#principled-representation Uses registered joint/tip positions and supplied girth radius, preserving the original polygon construction inputs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One bone record serves rest topology and shape selection.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Custom bone identifiers remain ordinary strings and no absent endpoint is synthesized by this contract.
   * @evidence contracts/development/common.md#meaningful-documentation Gives metre dimensions, parent identity and null endpoint meaning.
   */
  export interface IBone {
    /** Stable evaluator bone identity. */
    bone: string;

    /** Parent identity, or null at a root. */
    parent: string | null;

    /** Registered rest joint centre in metres. */
    position: [number, number, number];

    /** Leaf segment endpoint in metres; null delegates its end to a child. */
    tip: [number, number, number] | null;

    /** Positive girth radius of the segment, metres. */
    radius: number;
  }

  /**
   * A bone's rigid placement relative to its fixed rest joint.
   *
   * @evidence contracts/development/design.md#principled-representation Position is the evaluated joint in body metres and rotation is a unit bind-relative quaternion; flat display groups consume both once.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One transform drives the matching surface and diagnostic groups.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No parent rotation is composed again and no quaternion normalization conceals invalid evaluator data.
   * @evidence contracts/development/common.md#meaningful-documentation Gives stable identity, body frame, bind-relative meaning and quaternion component order.
   */
  export interface IPlacement {
    /** Stable bone identity, including joints outside the humanoid vocabulary. */
    bone: string;

    /** Evaluated joint centre in body-frame metres. */
    position: [number, number, number];

    /** Unit bind-relative quaternion `[x,y,z,w]` in the body frame. */
    rotation: [number, number, number, number];
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
    setPose: (output: Pick<IInput, "posed">) => void;

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
