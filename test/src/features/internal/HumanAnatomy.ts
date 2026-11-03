import { HumanAnatomySection } from "./HumanAnatomySection";
import { HumanAnatomySkins } from "./HumanAnatomySkins";
import { HumanAnatomySurface } from "./HumanAnatomySurface";
import { HumanAnatomyVector } from "./HumanAnatomyVector";

/**
 * Measurement of a generated person's skin: the closed triangle mesh the
 * surface emits, at the bind or under a pose through the public rig and pose
 * evaluator. Everything here reads positions and triangles only; nothing reads
 * the construction's constants, priors or fields, and sites are found on the
 * skin by the definitions the anatomy tests cite.
 *
 * This namespace is the one entry the observers import; the work lives in
 * its pieces: {@link HumanAnatomySkins} (bind and posed skins, once per
 * process), {@link HumanAnatomySection} (plane sections),
 * {@link HumanAnatomySurface} (triangle queries, volume, rays, distances)
 * and {@link HumanAnatomyVector} (vector arithmetic).
 *
 * Frame: forward +X, up +Y, the body's left +Z, millimetres, floor at y = 0.
 */
export namespace HumanAnatomy {
  /** A point or a direction. */
  export type V3 = HumanAnatomyVector.V3;

  /** A skin: positions, triangles and where its joints stand. */
  export interface ISkin {
    /** Person's name. */
    name: string;

    /** Flat vertex positions, mm. */
    P: Float64Array;

    /** Flat triangle vertex indices, counter-clockwise from outside. */
    I: Uint32Array;

    /** Chain each triangle belongs to, an index into `chains`. */
    tri: Int32Array;

    /** Chain names the surface gave its triangle groups. */
    chains: string[];

    /** Joint centres of the rig in this skin's pose, mm. */
    joints: Map<string, V3>;
  }

  /** One component of a plane's section through the skin. */
  export interface ICut {
    /** Taut-tape girth: perimeter of the section's convex hull, mm. */
    girth: number;

    /** Enclosed area, mm^2. */
    area: number;

    /** Section points in 3D, mm. */
    points: V3[];

    /** Whether the component encloses the point it was picked by. */
    contained: boolean;

    /** Distance from the pick to the component when it does not enclose it, else zero, mm. */
    outside: number;
  }

  /**
   * A point on the median plane, a hair to the left: the skin's seam vertices
   * lie on the plane itself, where a section would cut through vertices.
   */
  export const MEDIAN: V3 = [0, 0, 1e-3];

  /** The skin at the bind, generated once per person; see {@link HumanAnatomySkins.bind}. */
  export const bind: typeof HumanAnatomySkins.bind = HumanAnatomySkins.bind;

  /** The skin under a pose by the rig's own binding; see {@link HumanAnatomySkins.posed}. */
  export const posed: typeof HumanAnatomySkins.posed = HumanAnatomySkins.posed;

  /** The rig's four influences on every bind vertex; see {@link HumanAnatomySkins.binding}. */
  export const binding: typeof HumanAnatomySkins.binding = HumanAnatomySkins.binding;

  /** A plane section's component holding a point; see {@link HumanAnatomySection.cut}. */
  export const cut: typeof HumanAnatomySection.cut = HumanAnatomySection.cut;

  /** Every component of a plane section as a polyline; see {@link HumanAnatomySection.polylines}. */
  export const polylines: typeof HumanAnatomySection.polylines = HumanAnatomySection.polylines;

  /** A joint's centre, mm. */
  export const joint: typeof HumanAnatomySurface.joint = HumanAnatomySurface.joint;

  /** Triangles whose chain name passes a test. */
  export const triangles: typeof HumanAnatomySurface.triangles = HumanAnatomySurface.triangles;

  /** Vertices of the triangles whose chain name passes a test. */
  export const vertices: typeof HumanAnatomySurface.vertices = HumanAnatomySurface.vertices;

  /** Triangles with a vertex within a radius of a segment. */
  export const near: typeof HumanAnatomySurface.near = HumanAnatomySurface.near;

  /** Boundary loops of the skin. */
  export const openings: typeof HumanAnatomySurface.openings = HumanAnatomySurface.openings;

  /** Vertex position. */
  export const point: typeof HumanAnatomySurface.point = HumanAnatomySurface.point;

  /** Signed enclosed volume, mm^3. */
  export const volume: typeof HumanAnatomySurface.volume = HumanAnatomySurface.volume;

  /** Skin passing into skin within a region. */
  export const penetration: typeof HumanAnatomySurface.penetration = HumanAnatomySurface.penetration;

  /** Skin crossings of an axis ray. */
  export const ray: typeof HumanAnatomySurface.ray = HumanAnatomySurface.ray;

  /** Area-weighted unit vertex normals. */
  export const vertexNormals: typeof HumanAnatomySurface.vertexNormals = HumanAnatomySurface.vertexNormals;

  /** Distance from each point to the nearest triangle. */
  export const distances: typeof HumanAnatomySurface.distances = HumanAnatomySurface.distances;

  /** Perimeter of the convex hull of planar points. */
  export const hull: typeof HumanAnatomyVector.hull = HumanAnatomyVector.hull;

  /** Exact distance from a point to a triangle. */
  export const triangleDistance: typeof HumanAnatomyVector.triangleDistance = HumanAnatomyVector.triangleDistance;

  /** Difference. */
  export const sub: typeof HumanAnatomyVector.sub = HumanAnatomyVector.sub;

  /** Sum. */
  export const add: typeof HumanAnatomyVector.add = HumanAnatomyVector.add;

  /** Scaled vector. */
  export const scale: typeof HumanAnatomyVector.scale = HumanAnatomyVector.scale;

  /** Dot product. */
  export const dot: typeof HumanAnatomyVector.dot = HumanAnatomyVector.dot;

  /** Cross product. */
  export const cross: typeof HumanAnatomyVector.cross = HumanAnatomyVector.cross;

  /** Distance. */
  export const dist: typeof HumanAnatomyVector.dist = HumanAnatomyVector.dist;

  /** Unit vector. */
  export const unit: typeof HumanAnatomyVector.unit = HumanAnatomyVector.unit;

  /** Point along a line. */
  export const lerp: typeof HumanAnatomyVector.lerp = HumanAnatomyVector.lerp;

  /** Two unit vectors completing a normal to an orthonormal frame. */
  export const basis: typeof HumanAnatomyVector.basis = HumanAnatomyVector.basis;

  /** The vector's part perpendicular to a unit axis. */
  export const reject: typeof HumanAnatomyVector.reject = HumanAnatomyVector.reject;
}
