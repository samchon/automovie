import * as THREE from "three";

/**
 * Named Human capture cameras and the framing rule shared with the reference photographs.
 *
 * Each name maps to an azimuth and elevation about a target region of the
 * registered Human frame (forward +X, up +Y, lateral +Z, floor y = 0, metres).
 * `whole-*` cameras frame the whole surface bounds; `region-row{0..3}-*` frame
 * one horizontal quarter of those bounds, row 0 lowest, so their targets sit at
 * 12.5, 37.5, 62.5 and 87.5 percent of the height. A region row is a
 * bounds-relative tile, not an anatomical cut.
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
  ];

  /**
   * Resolve a camera name to its direction and target region.
   *
   * Azimuth is measured in the X-Z plane from +X toward +Z, so pi/2 looks from
   * +Z (`whole-left`, `-side`) and -pi/2 from -Z (`whole-right`).
   *
   * @param name One of {@link HumanCaptureCamera.names}.
   * @param bounds Whole-model surface bounds in metres.
   * @returns The descriptor; an unknown name throws instead of falling back to a default view.
   *
   * @evidence contracts/common.md#principled-implementation Whole cameras map to fixed azimuths; region rows split the whole bounds' height into quarters and keep the full X/Z extent, matching the reference tiles' bounds rule.
   * @evidence contracts/common.md#clear-and-simple-design The name table lives in one place shared by page, worker and docs.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown names throw rather than falling back to a default view.
   * @evidence contracts/common.md#meaningful-documentation States the azimuth convention and the row order.
   * @evidence contracts/performance.md#efficient-algorithms Constant work and one Box3 clone.
   * @evidence contracts/performance.md#reuse-equivalent-work Pure function of name and bounds.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a new descriptor; retains nothing.
   */
  public static describe(
    name: string,
    bounds: THREE.Box3,
  ): HumanCaptureCamera.IDescriptor {
    const whole: Record<string, number> = {
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
   * Place a camera and key light for one descriptor with the reference framing rule.
   *
   * The distance search runs in camera space: for each corner of the region box
   * at camera-relative depth `p.z` (negative in front), the camera must sit far
   * enough that the corner's horizontal and vertical extents fit inside the
   * frustum with a 1.15 margin, plus one metre of standoff. Near and far follow
   * the distance and the whole-model diagonal so depth precision scales with the
   * subject. The camera's `aspect` must already be set by the caller.
   *
   * @param camera Perspective camera whose fov and aspect are already set.
   * @param key Directional key light whose target is moved to the region centre.
   * @param descriptor Direction and region from {@link HumanCaptureCamera.describe}.
   * @param whole Whole-model surface bounds; its diagonal scales far and the key light offset.
   * @returns Placement facts for capture metadata.
   *
   * @evidence contracts/common.md#principled-implementation Implements the reference capture's rule verbatim: orient at unit distance, take for every region corner the camera-space distance that fits it with a 1.15 margin plus one metre, then set near/far from that distance and the whole-model diagonal and offset the key light by (1, 1.4, 0.7) in camera space times the diagonal.
   * @evidence contracts/common.md#clear-and-simple-design One function serves the interactive preset and the PNG capture, so both frame identically.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No per-person or per-camera adjustment; the 1.15 margin, one-metre standoff and light offset are the reference capture's constants.
   * @evidence contracts/common.md#meaningful-documentation States the frame, the corner test, the margin source and that aspect must be set first.
   * @evidence contracts/performance.md#efficient-algorithms Eight corner transforms and constant matrix work.
   * @evidence contracts/performance.md#reuse-equivalent-work Mutates the caller's camera and light in place instead of allocating new ones.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns plain arrays; retains nothing.
   */
  public static place(
    camera: THREE.PerspectiveCamera,
    key: THREE.DirectionalLight,
    descriptor: HumanCaptureCamera.IDescriptor,
    whole: THREE.Box3,
  ): HumanCaptureCamera.IPlacement {
    const b: THREE.Box3 = descriptor.region;
    const size: THREE.Vector3 = whole.getSize(new THREE.Vector3());
    const target: THREE.Vector3 = b.getCenter(new THREE.Vector3());
    const offset: THREE.Vector3 = new THREE.Vector3(
      Math.cos(descriptor.azimuth) * Math.cos(descriptor.elevation),
      Math.sin(descriptor.elevation),
      Math.sin(descriptor.azimuth) * Math.cos(descriptor.elevation),
    );

    // Orient first at unit distance; the corner test needs the view matrix.
    camera.up.set(0, 1, 0);
    camera.position.copy(target).add(offset);
    camera.lookAt(target);
    camera.updateMatrixWorld();

    const tangent: number = Math.tan(
      THREE.MathUtils.degToRad(camera.fov / 2),
    );
    let distance: number = 0;
    for (const x of [b.min.x, b.max.x])
      for (const y of [b.min.y, b.max.y])
        for (const z of [b.min.z, b.max.z]) {
          const p: THREE.Vector3 = new THREE.Vector3(x, y, z).applyMatrix4(
            camera.matrixWorldInverse,
          );
          distance = Math.max(
            distance,
            1 + p.z + (1.15 * Math.abs(p.x)) / (tangent * camera.aspect),
            1 + p.z + (1.15 * Math.abs(p.y)) / tangent,
          );
        }

    camera.position.copy(target).addScaledVector(offset, distance);
    camera.near = Math.max(0.0001, distance / 1000);
    camera.far = distance + size.length() * 4;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();

    // Key light: right, above and behind the camera in its own frame, so the
    // shading direction is the same for every named view.
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
      position: camera.position.toArray(),
      target: target.toArray(),
      fov: camera.fov,
      aspect: camera.aspect,
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

    /** Camera position. */
    position: number[];

    /** Look-at target, the region centre. */
    target: number[];

    /** Vertical field of view in degrees. */
    fov: number;

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
