import * as THREE from "three";

/**
 * Named Human capture cameras and the framing rule shared with the reference photographs.
 *
 * Each name maps to an azimuth and elevation about a target region of the
 * registered Human frame (forward +X, up +Y, lateral +Z, floor y = 0, metres).
 * `whole-*` cameras frame the whole surface bounds; `region-row{0..3}-*` frame
 * one horizontal quarter of those bounds, row 0 lowest, so their targets sit at
 * 12.5, 37.5, 62.5 and 87.5 percent of the height. A region row is a
 * bounds-relative tile, not an anatomical cut. `head-*` and `eye-*` close-ups
 * frame the head and eye parts the generator emits; see {@link HumanCaptureCamera.describe}.
 *
 * {@link HumanCaptureCamera.place} copies the framing of the capture that
 * produced `test/.shots/{f1,f2,m1,m2}/`: the camera looks at the region centre
 * from the named direction and backs off until every region corner fits with a
 * 15 percent margin, and the key light sits at a fixed camera-relative offset
 * scaled by the whole-model diagonal. With the same canvas, fov, background,
 * lights and material a generated frame therefore compares 1:1 with the
 * reference frame of the same name.
 *
 * @evidence contracts/common.md#principled-implementation Reproduces the reference capture's framing and lighting rule so generated and reference frames share camera, light and canvas conditions.
 * @evidence contracts/common.md#clear-and-simple-design Static constants plus describe and place; scene, renderer and readback belong to the page.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No camera is tuned per person; region rows are bounds tiles, not anatomical cuts.
 * @evidence contracts/common.md#meaningful-documentation States the frame, the camera names, the framing margin and the 1:1 comparison premise.
 * @evidence contracts/performance.md#efficient-algorithms Constant work per placement.
 * @evidence contracts/performance.md#reuse-equivalent-work The same descriptors serve interaction and capture.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Holds only static constants.
 */
export class HumanCaptureCamera {
  /** Capture canvas edge in pixels; the reference photographs are 1200 x 1200 at pixel ratio 1. */
  public static readonly size: number = 1200;

  /** Vertical field of view in degrees used by the reference capture. */
  public static readonly fov: number = 30;

  /** Scene background of the reference capture. */
  public static readonly background: number = 0xf1f3f6;

  /** Every supported camera name, in a stable display order. */
  public static readonly names: readonly string[] = [
    "free",
    "whole-front",
    "whole-back",
    "whole-left",
    "whole-right",
    "whole-oblique-front",
    "whole-oblique-back",
    ...[0, 1, 2, 3].flatMap((row: number): string[] => [
      `region-row${row}-front`,
      `region-row${row}-side`,
    ]),
    "head-front",
    "head-side",
    "head-back",
    "head-oblique-front",
    "eye-left-front",
    "eye-right-front",
  ];

  /**
   * Resolve a camera name to its direction and target region.
   *
   * Azimuth is measured in the X-Z plane from +X toward +Z, so pi/2 looks from
   * +Z (`whole-left`, `-side`) and -pi/2 from -Z (`whole-right`).
   *
   * Close-up regions come from the model's own parts, never from coordinates:
   * `head-*` frames the skin intervals of the head chain family, `head` and
   * every sub-chain `head.*` (`human.skin.head/`, `human.skin.head.`), and of
   * the ear chains (`human.skin.ear.`), together with every `human.hair.` and
   * `human.eye.` part, so hair, ears and eyes are never cropped; chain names
   * are the anatomical boundary, which avoids
   * guessing a neck-base height. `eye-<side>-front` frames the
   * `human.eye.<side>.` parts grown on every side by 0.75 of their largest
   * extent, so lids and brow stay in view and the eye spans about a third of
   * the frame. A model without those parts fails instead of framing something else.
   *
   * @param name One of {@link HumanCaptureCamera.names}.
   * @param bounds Whole-model surface bounds in metres.
   * @param parts Union of the surface bounds of parts whose id starts with any given prefix; empty when none match.
   * @returns The descriptor; an unknown name or a missing close-up part throws instead of falling back to a default view.
   *
   * @evidence contracts/common.md#principled-implementation Whole cameras map to fixed azimuths; region rows split the whole bounds' height into quarters and keep the full X/Z extent, matching the reference tiles' bounds rule; close-ups take the bounds of the generator's head, hair and eye parts by id prefix.
   * @evidence contracts/common.md#clear-and-simple-design The name table and every region rule live in one place shared by page, worker and docs; the model only answers bounds-by-prefix queries.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown names and missing head or eye parts throw rather than falling back to a default view; no person-specific coordinate is used.
   * @evidence contracts/common.md#meaningful-documentation States the azimuth convention, the row order, the close-up part sets, the eye margin and why the head chain beats a neck-base cut.
   * @evidence contracts/performance.md#efficient-algorithms Constant work for whole and row cameras; close-ups cost one bounds query per prefix set, linear in the matching parts' vertices.
   * @evidence contracts/performance.md#reuse-equivalent-work Pure function of name, bounds and the parts query.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a new descriptor; retains nothing.
   */
  public static describe(
    name: string,
    bounds: THREE.Box3,
    parts: (prefixes: readonly string[]) => THREE.Box3,
  ): HumanCaptureCamera.IDescriptor {
    const whole: Record<string, number> = {
      free: 0,
      "whole-front": 0,
      "whole-back": Math.PI,
      "whole-left": Math.PI / 2,
      "whole-right": -Math.PI / 2,
      "whole-oblique-front": Math.PI / 4,
      "whole-oblique-back": (-3 * Math.PI) / 4,
    };
    if (Object.hasOwn(whole, name))
      return {
        name,
        azimuth: whole[name]!,
        elevation: 0,
        region: bounds.clone(),
      };

    // The head chain plus everything attached to the head.
    const head: Record<string, number> = {
      "head-front": 0,
      "head-side": Math.PI / 2,
      "head-back": Math.PI,
      "head-oblique-front": Math.PI / 4,
    };
    if (Object.hasOwn(head, name)) {
      // The head chain family: `head` and every sub-chain `head.*`, plus the
      // ear chains, read from the part ids by chain name.
      const skin: THREE.Box3 = parts([
        "human.skin.head/",
        "human.skin.head.",
        "human.skin.ear.",
      ]);
      if (skin.isEmpty())
        throw new Error("Human model has no head or ear skin part for " + name);
      return {
        name,
        azimuth: head[name]!,
        elevation: 0,
        region: skin.union(parts(["human.hair.", "human.eye."])),
      };
    }

    // One eye's parts with a margin of 0.75 of their largest extent per side.
    const eye: RegExpExecArray | null = /^eye-(left|right)-front$/.exec(name);
    if (eye !== null) {
      const region: THREE.Box3 = parts(["human.eye." + eye[1] + "."]);
      if (region.isEmpty())
        throw new Error(
          "Human model has no human.eye." + eye[1] + ". part for " + name,
        );
      const size: THREE.Vector3 = region.getSize(new THREE.Vector3());
      region.expandByScalar(0.75 * Math.max(size.x, size.y, size.z));
      return { name, azimuth: 0, elevation: 0, region };
    }

    // A region row keeps the whole X/Z extent and one quarter of the height.
    const row: RegExpExecArray | null = /^region-row([0-3])-(front|side)$/.exec(
      name,
    );
    if (row === null) throw new Error("Unknown Human capture camera: " + name);
    const index: number = Number(row[1]);
    const height: number = bounds.max.y - bounds.min.y;
    const region: THREE.Box3 = bounds.clone();
    region.min.y = bounds.min.y + (height * index) / 4;
    region.max.y = bounds.min.y + (height * (index + 1)) / 4;
    return {
      name,
      azimuth: row[2] === "front" ? 0 : Math.PI / 2,
      elevation: 0,
      region,
    };
  }

  /**
   * Apply free-view variables to a named camera's descriptor.
   *
   * Angles replace the direction, `fit=selection` replaces the region with
   * `selection`, and `target`/`dist` (mm in the URL) become metre overrides of
   * the look-at point and distance; `ortho` selects the orthographic projection.
   *
   * @param descriptor Named camera's descriptor from {@link HumanCaptureCamera.describe}.
   * @param view Parsed free-view variables.
   * @param selection Bounds of the curve selection in metres, required when `fit=selection`.
   * @returns A new descriptor; the input is not modified.
   *
   * @evidence contracts/common.md#principled-implementation Converts degrees to radians and millimetres to the model's metres and replaces only the fields the URL names.
   * @evidence contracts/common.md#clear-and-simple-design Overrides stay separate from name resolution, so named cameras are unchanged without free variables.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts `fit=selection` without a non-empty selection throws instead of framing the whole body.
   * @evidence contracts/common.md#meaningful-documentation States each override and its units.
   * @evidence contracts/performance.md#efficient-algorithms Constant work.
   * @evidence contracts/performance.md#reuse-equivalent-work Pure function of its inputs.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a new descriptor; retains nothing.
   */
  public static override(
    descriptor: HumanCaptureCamera.IDescriptor,
    view: {
      az?: number;
      el?: number;
      target?: [number, number, number];
      dist?: number;
      ortho: boolean;
      fit: "selection" | null;
    },
    selection: THREE.Box3 | null,
  ): HumanCaptureCamera.IDescriptor {
    if (view.fit === "selection" && (selection === null || selection.isEmpty()))
      throw new Error("Human fit=selection needs a non-empty curves selection");
    return {
      name: descriptor.name,
      azimuth:
        view.az === undefined
          ? descriptor.azimuth
          : THREE.MathUtils.degToRad(view.az),
      elevation:
        view.el === undefined
          ? descriptor.elevation
          : THREE.MathUtils.degToRad(view.el),
      region:
        view.fit === "selection"
          ? selection!.clone()
          : descriptor.region.clone(),
      target:
        view.target === undefined
          ? descriptor.target
          : new THREE.Vector3(...view.target).divideScalar(1000),
      distance:
        view.dist === undefined ? descriptor.distance : view.dist / 1000,
      orthographic: view.ortho || descriptor.orthographic === true,
    };
  }

  /**
   * Place a camera and key light for one descriptor with the reference framing rule.
   *
   * The camera first sits at unit distance from the target in the named
   * direction. For every corner of the region, `p` is that corner in camera
   * space, so `1 + p.z` is how far the corner lies toward the camera from the
   * plane through the target. A perspective camera then backs off to the
   * largest `1 + p.z + 1.15 |p| / tan(fov/2)` over both screen axes, the
   * distance at which every corner fits with a 15 percent margin; an
   * orthographic camera instead takes the half height
   * `1.15 max(|p.y|, |p.x| / aspect)` and sits one whole-model diagonal beyond
   * the nearest corner. `distance` and `target` overrides replace those
   * choices. Near and far follow the distance and the whole-model diagonal.
   * Looking straight up or down (|elevation| over 89.9 degrees) the screen up
   * is -Z, so a top view shows +X to the right and +Z downward.
   *
   * @param camera Perspective camera with its fov set, or orthographic camera.
   * @param key Directional key light whose target is moved to the look-at point.
   * @param descriptor Direction, region and overrides.
   * @param whole Whole-model surface bounds; its diagonal scales far and the key light offset.
   * @param aspect Drawing-buffer width over height.
   * @returns Placement facts for capture metadata.
   *
   * @evidence contracts/common.md#principled-implementation Implements the reference capture's rule verbatim for perspective (unit-distance orientation, per-corner fit with a 1.15 margin, near/far from distance and diagonal, key light at (1, 1.4, 0.7) camera-space times the diagonal) and the same corner test for orthographic half extents.
   * @evidence contracts/common.md#clear-and-simple-design One function serves the interactive view and the PNG capture for both projections, so both frame identically.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No per-person adjustment; the 1.15 margin and light offset are the reference capture's constants, and the vertical-view up vector is a stated convention.
   * @evidence contracts/common.md#meaningful-documentation States the frame, the corner test, both projections, the overrides and the top-view orientation.
   * @evidence contracts/performance.md#efficient-algorithms Eight corner transforms and constant matrix work.
   * @evidence contracts/performance.md#reuse-equivalent-work Mutates the caller's camera and light in place instead of allocating new ones.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns plain arrays; retains nothing.
   */
  public static place(
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    key: THREE.DirectionalLight,
    descriptor: HumanCaptureCamera.IDescriptor,
    whole: THREE.Box3,
    aspect: number,
  ): HumanCaptureCamera.IPlacement {
    const b: THREE.Box3 = descriptor.region;
    const size: THREE.Vector3 = whole.getSize(new THREE.Vector3());
    const target: THREE.Vector3 =
      descriptor.target?.clone() ?? b.getCenter(new THREE.Vector3());
    const offset: THREE.Vector3 = new THREE.Vector3(
      Math.cos(descriptor.azimuth) * Math.cos(descriptor.elevation),
      Math.sin(descriptor.elevation),
      Math.sin(descriptor.azimuth) * Math.cos(descriptor.elevation),
    );

    // Orient first at unit distance; the corner test needs the view matrix.
    if (Math.abs(descriptor.elevation) > THREE.MathUtils.degToRad(89.9))
      camera.up.set(0, 0, -1);
    else camera.up.set(0, 1, 0);
    camera.position.copy(target).add(offset);
    camera.lookAt(target);
    camera.updateMatrixWorld();

    const corners: THREE.Vector3[] = [];
    for (const x of [b.min.x, b.max.x])
      for (const y of [b.min.y, b.max.y])
        for (const z of [b.min.z, b.max.z])
          corners.push(
            new THREE.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse),
          );

    let distance: number = 0;
    let half: number | null = null;
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = aspect;
      const tangent: number = Math.tan(
        THREE.MathUtils.degToRad(camera.fov / 2),
      );
      for (const p of corners)
        distance = Math.max(
          distance,
          1 + p.z + (1.15 * Math.abs(p.x)) / (tangent * aspect),
          1 + p.z + (1.15 * Math.abs(p.y)) / tangent,
        );
    } else {
      // Orthographic: the same corners set the half extents; the camera
      // only has to sit in front of the nearest corner.
      half = 0;
      for (const p of corners) {
        half = Math.max(
          half,
          1.15 * Math.abs(p.y),
          (1.15 * Math.abs(p.x)) / aspect,
        );
        distance = Math.max(distance, 1 + p.z);
      }
      distance += size.length();
      camera.top = half;
      camera.bottom = -half;
      camera.left = -half * aspect;
      camera.right = half * aspect;
      camera.zoom = 1;
    }
    distance = descriptor.distance ?? distance;

    camera.position.copy(target).addScaledVector(offset, distance);
    camera.near = Math.max(0.0001, distance / 1000);
    camera.far = distance + size.length() * 4;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();

    // Key light: right, above and behind the camera in its own frame, so the
    // shading direction is the same for every view.
    key.position
      .copy(target)
      .add(
        new THREE.Vector3(1, 1.4, 0.7)
          .applyQuaternion(camera.quaternion)
          .multiplyScalar(size.length()),
      );
    key.target.position.copy(target);
    key.target.updateMatrixWorld();

    return {
      name: descriptor.name,
      azimuth: descriptor.azimuth,
      elevation: descriptor.elevation,
      projection: half === null ? "perspective" : "orthographic",
      position: camera.position.toArray(),
      target: target.toArray(),
      up: camera.up.toArray(),
      fov: camera instanceof THREE.PerspectiveCamera ? camera.fov : null,
      halfHeight: half,
      aspect,
      near: camera.near,
      far: camera.far,
      region: {
        min: descriptor.region.min.toArray(),
        max: descriptor.region.max.toArray(),
      },
      light: {
        position: key.position.toArray(),
        target: target.toArray(),
        intensity: key.intensity,
      },
    };
  }
}

export namespace HumanCaptureCamera {
  /**
   * Direction and target region of one named camera.
   *
   * @evidence contracts/common.md#principled-implementation Angles in radians in the registered frame and a region box in metres fully determine a placement.
   * @evidence contracts/common.md#clear-and-simple-design Separates name resolution from placement.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Only describe creates it, from a known name.
   * @evidence contracts/common.md#meaningful-documentation Each field states its unit and frame.
   * @evidence contracts/performance.md#efficient-algorithms One cloned box per descriptor.
   * @evidence contracts/performance.md#reuse-equivalent-work A descriptor can place any camera of the same bounds.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Holds one Box3, garbage collected with the record.
   */
  export interface IDescriptor {
    /** Camera name, one of {@link HumanCaptureCamera.names}. */
    name: string;

    /** Radians in the X-Z plane from +X toward +Z. */
    azimuth: number;

    /** Radians above the X-Z plane. */
    elevation: number;

    /** Box the camera centres on and fits, in metres. */
    region: THREE.Box3;

    /** Look-at point in metres replacing the region centre; absent uses the centre. */
    target?: THREE.Vector3;

    /** Camera distance in metres replacing the fitted distance; absent fits the region. */
    distance?: number;

    /** Orthographic projection instead of the reference perspective. */
    orthographic?: boolean;
  }

  /**
   * Placement facts recorded with each capture, in metres and degrees.
   *
   * @evidence contracts/common.md#principled-implementation Copies the placed camera, region and light values exactly as rendered.
   * @evidence contracts/common.md#clear-and-simple-design A plain record for receipts; no behaviour.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Values are read back from the placed objects, not recomputed.
   * @evidence contracts/common.md#meaningful-documentation Each field states its unit.
   * @evidence contracts/performance.md#efficient-algorithms A few small arrays per capture.
   * @evidence contracts/performance.md#reuse-equivalent-work Serialized once into the frame metadata.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Holds no resources.
   */
  export interface IPlacement {
    /** Camera name. */
    name: string;

    /** Azimuth in radians. */
    azimuth: number;

    /** Elevation in radians. */
    elevation: number;

    /** Projection used for the frame. */
    projection: "perspective" | "orthographic";

    /** Camera position. */
    position: number[];

    /** Look-at target, the region centre. */
    target: number[];

    /** Camera up vector. */
    up: number[];

    /** Vertical field of view in degrees; null for orthographic. */
    fov: number | null;

    /** Orthographic half height in metres; null for perspective. */
    halfHeight: number | null;

    /** Width over height of the drawing buffer. */
    aspect: number;

    /** Near clip distance. */
    near: number;

    /** Far clip distance. */
    far: number;

    /** Framed region. */
    region: { min: number[]; max: number[] };

    /** Key light placement and intensity. */
    light: { position: number[]; target: number[]; intensity: number };
  }
}
