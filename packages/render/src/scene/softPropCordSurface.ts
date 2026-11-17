import type {
  IAutoMovieSoftBodySurface,
  IAutoMovieSoftBounds,
} from "@automovie/interface";
import * as THREE from "three";

/**
 * Use a ring of the Three.js tube at each distinct adjoining particle.
 * The input is an unindexed one-wide surface in world metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the source, coordinate frame and tube sampling rule.
 * @evidence contracts/development/implementation.md#principled-implementation TubeGeometry transports its frame along a path parameterized by particle index, preserving nonuniform particle spacing in the ring centres up to Float32 conversion.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The path defines the parameterization and tangents. Three.js owns ring construction, winding, normals and UVs.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The radius is the caller's in metres, and the radial tessellation is Three.js's default. Missing or unrepresentable coordinates and nonfinite tube output are refused. Consecutive identical points share a ring; a point-only configuration has no tube.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in particles and the SDK's fixed radial segments. Adjacent coincident points are removed once and all path samples use direct index addressing.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The geometry represents one frame's particle positions, with no assumption that another frame has the same points.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Disposes the temporary buffer geometry after copying its attributes; the result retains only plain arrays and its extent.
 */
export function softPropCordSurface(
  surface: IAutoMovieSoftBodySurface,
  radius: number,
): IAutoMovieSoftBodySurface {
  const positions: readonly number[] = surface.mesh.positions;
  const projectedRadius: number = Math.fround(radius);
  if (
    !Number.isFinite(projectedRadius) ||
    projectedRadius <= 0 ||
    surface.bounds !== null ||
    (surface.mesh.indices?.length ?? 0) !== 0 ||
    positions.length < 6 ||
    positions.length % 3 !== 0
  )
    throw new Error(
      `Soft prop domain "${surface.domain}" needs an unindexed cord with finite particles and a positive finite radius.`,
    );

  const points: THREE.Vector3[] = [];
  for (let offset: number = 0; offset < positions.length; offset += 3) {
    const point: THREE.Vector3 = new THREE.Vector3().fromArray(positions, offset);
    if (
      !Number.isFinite(Math.fround(point.x)) ||
      !Number.isFinite(Math.fround(point.y)) ||
      !Number.isFinite(Math.fround(point.z))
    )
      throw new Error(
        `Soft prop domain "${surface.domain}" has an unrepresentable cord particle.`,
      );
    const previous: THREE.Vector3 | undefined = points[points.length - 1];
    if (previous === undefined || !point.equals(previous)) points.push(point);
  }
  if (points.length < 2) return surface;

  const geometry: THREE.TubeGeometry = new THREE.TubeGeometry(
    new ParticlePath(points),
    points.length - 1,
    radius,
  );
  try {
    const vertices: number[] = Array.from(
      geometry.getAttribute("position").array,
    );
    const normals: number[] = Array.from(geometry.getAttribute("normal").array);
    if (!vertices.every(Number.isFinite) || !normals.every(Number.isFinite))
      throw new Error(
        `Soft prop domain "${surface.domain}" generated nonfinite tube geometry.`,
      );
    geometry.computeBoundingBox();
    const box: THREE.Box3 = geometry.boundingBox!;
    const bounds: IAutoMovieSoftBounds = {
      min: { x: box.min.x, y: box.min.y, z: box.min.z },
      max: { x: box.max.x, y: box.max.y, z: box.max.z },
    };
    return {
      domain: surface.domain,
      step: surface.step,
      bounds,
      mesh: {
        positions: vertices,
        normals,
        uvs: Array.from(geometry.getAttribute("uv").array),
        indices: Array.from(geometry.getIndex()!.array),
        skin: null,
      },
    };
  } finally {
    geometry.dispose();
  }
}

/** A piecewise straight path with one uniformly indexed parameter per particle. */
class ParticlePath extends THREE.Curve<THREE.Vector3> {
  /** At least two points, with each consecutive pair distinct. */
  public constructor(private readonly points: readonly THREE.Vector3[]) {
    super();
  }

  /** Interpolate between the adjacent particle indices around this parameter. */
  public override getPoint(
    t: number,
    target: THREE.Vector3 = new THREE.Vector3(),
  ): THREE.Vector3 {
    const scaled: number = t * (this.points.length - 1);
    const from: number = Math.min(this.points.length - 2, Math.floor(scaled));
    return target.lerpVectors(
      this.points[from]!,
      this.points[from + 1]!,
      scaled - from,
    );
  }

  /** Tube rings use the authored particle spacing in place of arc-length spacing. */
  public override getPointAt(
    u: number,
    target?: THREE.Vector3,
  ): THREE.Vector3 {
    return this.getPoint(u, target);
  }

  /** Use the outgoing segment at each SDK ring, with an incoming one at the end. */
  public override getTangentAt(
    u: number,
    target: THREE.Vector3 = new THREE.Vector3(),
  ): THREE.Vector3 {
    const from: number = Math.min(
      this.points.length - 2,
      Math.round(u * (this.points.length - 1)),
    );
    return target
      .subVectors(this.points[from + 1]!, this.points[from]!)
      .normalize();
  }
}
