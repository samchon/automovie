import {
  BODY_POSE_DEFECT_ZONES,
  type BodyPoseDefectZone,
} from "./bodyPoseDefectZone";

/** Triangles whose posed area falls below this share of the rest area count as crushed. */
export const BODY_POSE_SHRINK_RATIO = 0.35;

/** Triangles whose posed area exceeds this multiple of the rest area count as stretched. */
export const BODY_POSE_STRETCH_RATIO = 2.8;

/** A dihedral angle that rose by more than this many degrees counts as a new fold. */
export const BODY_POSE_FOLD_DEGREES = 60;

/** What one zone of a posed skin shows against the same body at rest. */
export interface IBodyPoseZoneDefects {
  /** Triangles whose first vertex lies in the zone and whose rest area is not degenerate. */
  triangles: number;

  /** Smallest and largest posed-over-rest triangle area, `1` when the zone has no triangle. */
  minAreaRatio: number;
  maxAreaRatio: number;

  /** Triangles below `BODY_POSE_SHRINK_RATIO` and above `BODY_POSE_STRETCH_RATIO`. */
  crushed: number;
  stretched: number;

  /** The largest rise of a dihedral angle from rest to pose, degrees, and where it is (posed metres). */
  worstFold: number;
  worstFoldAt: [number, number, number] | null;

  /** Edges whose dihedral angle rose by more than `BODY_POSE_FOLD_DEGREES`. */
  folds: number;
}

/** The census of one posed skin against its own rest. */
export interface IBodyPoseDefects {
  zones: Record<BodyPoseDefectZone, IBodyPoseZoneDefects>;

  /** Posed over rest surface area of the whole skin. */
  areaRatio: number;

  /** Posed over rest volume, each open rim closed by a fan to its centroid. */
  volumeRatio: number;
}

/**
 * Read what a pose did to a connected skin, by comparing it triangle by
 * triangle and edge by edge with the same body at rest.
 *
 * `indices` are the oriented triangles of the basis surface and `rest` and
 * `posed` are that surface's flat shared positions (the builder's
 * `posedSurfaces`, never the material-split model, because the split reorders
 * vertices). `zoneOfVertex` names each shared vertex's zone. A triangle and an
 * edge belong to the zone of their first vertex.
 *
 * Three measures answer three failures of skinning. The area ratio of a
 * triangle is a stretch or a crush: a rigid or well-blended limb keeps it near
 * one, and a skin torn between two bones leaves a triangle several times its
 * rest size or a sliver. The rise of a dihedral angle is a fold: a crease the
 * rest skin did not have, read on the face normals of the two triangles that
 * share an edge, so a natural crease at rest (the gluteal cleft) is not
 * counted twice. The volume ratio is the enclosed volume, by the divergence
 * theorem over the closed surface, which reads a limb that lost its thickness
 * at a bend; a skin can keep every triangle and still lose volume, which only
 * a tissue model, and not skinning, restores. The instruments answer
 * different questions, and none of them says that a shape is right: a frame
 * is read by eye.
 *
 * The thresholds are census cut-offs and not anatomical limits: a triangle
 * twice its rest size at the inside of a bent knee is skin that stretched,
 * and 2.8 is where a triangle is visibly a stretched sliver in a render.
 */
export function measureBodyPoseDefects(input: {
  indices: readonly number[];
  rest: readonly number[];
  posed: readonly number[];
  zoneOfVertex: (vertex: number) => BodyPoseDefectZone;
}): IBodyPoseDefects {
  const { indices, rest, posed, zoneOfVertex } = input;
  const triangles = indices.length / 3;
  const zones = Object.fromEntries(
    BODY_POSE_DEFECT_ZONES.map((zone) => [
      zone,
      {
        triangles: 0,
        minAreaRatio: Infinity,
        maxAreaRatio: 0,
        crushed: 0,
        stretched: 0,
        worstFold: 0,
        worstFoldAt: null,
        folds: 0,
      } satisfies IBodyPoseZoneDefects,
    ]),
  ) as Record<BodyPoseDefectZone, IBodyPoseZoneDefects>;
  const restNormals = faceNormals(indices, rest);
  const posedNormals = faceNormals(indices, posed);
  let restArea = 0;
  let posedArea = 0;
  for (let t = 0; t < triangles; ++t) {
    const before = restNormals.area[t];
    restArea += before;
    posedArea += posedNormals.area[t];
    if (before < 1e-12) continue;
    const zone = zones[zoneOfVertex(indices[3 * t])];
    const ratio = posedNormals.area[t] / before;
    zone.triangles++;
    zone.minAreaRatio = Math.min(zone.minAreaRatio, ratio);
    zone.maxAreaRatio = Math.max(zone.maxAreaRatio, ratio);
    if (ratio < BODY_POSE_SHRINK_RATIO) zone.crushed++;
    if (ratio > BODY_POSE_STRETCH_RATIO) zone.stretched++;
  }
  for (const [first, second, at] of sharedEdges(indices)) {
    const rise =
      angle(posedNormals.normal, first, second) -
      angle(restNormals.normal, first, second);
    const zone = zones[zoneOfVertex(indices[3 * first])];
    if (rise > BODY_POSE_FOLD_DEGREES) zone.folds++;
    if (rise > zone.worstFold) {
      zone.worstFold = rise;
      zone.worstFoldAt = [posed[3 * at], posed[3 * at + 1], posed[3 * at + 2]];
    }
  }
  for (const zone of Object.values(zones))
    if (zone.triangles === 0) {
      zone.minAreaRatio = 1;
      zone.maxAreaRatio = 1;
    }
  return {
    zones,
    areaRatio: posedArea / restArea,
    volumeRatio: enclosedVolume(indices, posed) / enclosedVolume(indices, rest),
  };
}

const faceNormals = (
  indices: readonly number[],
  positions: readonly number[],
): { normal: number[]; area: number[] } => {
  const triangles = indices.length / 3;
  const normal: number[] = new Array(3 * triangles);
  const area: number[] = new Array(triangles);
  for (let t = 0; t < triangles; ++t) {
    const [a, b, c] = [0, 1, 2].map((k) => 3 * indices[3 * t + k]);
    const u = [0, 1, 2].map((k) => positions[b + k] - positions[a + k]);
    const v = [0, 1, 2].map((k) => positions[c + k] - positions[a + k]);
    const x = u[1] * v[2] - u[2] * v[1];
    const y = u[2] * v[0] - u[0] * v[2];
    const z = u[0] * v[1] - u[1] * v[0];
    const length = Math.hypot(x, y, z);
    area[t] = length / 2;
    const scale = length < 1e-30 ? 0 : 1 / length;
    normal[3 * t] = x * scale;
    normal[3 * t + 1] = y * scale;
    normal[3 * t + 2] = z * scale;
  }
  return { normal, area };
};

/** The angle in degrees between two triangles' unit normals. */
const angle = (normal: number[], first: number, second: number): number =>
  (Math.acos(
    Math.min(
      1,
      Math.max(
        -1,
        normal[3 * first] * normal[3 * second] +
          normal[3 * first + 1] * normal[3 * second + 1] +
          normal[3 * first + 2] * normal[3 * second + 2],
      ),
    ),
  ) *
    180) /
  Math.PI;

/** Every edge shared by exactly two triangles: the pair and one end vertex of the edge. */
const sharedEdges = (
  indices: readonly number[],
): [number, number, number][] => {
  const vertices = indices.reduce((most, v) => Math.max(most, v), 0) + 1;
  const owners = new Map<number, [number, number]>();
  const edges: [number, number, number][] = [];
  for (let t = 0; t < indices.length / 3; ++t)
    for (let k = 0; k < 3; ++k) {
      const a = indices[3 * t + k];
      const b = indices[3 * t + ((k + 1) % 3)];
      const key = Math.min(a, b) * vertices + Math.max(a, b);
      const other = owners.get(key);
      if (other === undefined) owners.set(key, [t, a]);
      else edges.push([other[0], t, a]);
    }
  return edges;
};

/**
 * The volume the oriented triangles enclose, signed by the divergence
 * theorem, with each open rim closed by a fan to that rim's mean position.
 * A rim edge runs the opposite way round the cap that closes it, so the fan
 * triangle of a boundary edge `a -> b` is `(b, a, centre)`.
 */
const enclosedVolume = (
  indices: readonly number[],
  positions: readonly number[],
): number => {
  let volume = 0;
  const at = (v: number): number[] => [
    positions[3 * v],
    positions[3 * v + 1],
    positions[3 * v + 2],
  ];
  const tetra = (p: number[], q: number[], r: number[]): number =>
    (p[0] * (q[1] * r[2] - q[2] * r[1]) -
      p[1] * (q[0] * r[2] - q[2] * r[0]) +
      p[2] * (q[0] * r[1] - q[1] * r[0])) /
    6;
  const directed = new Map<string, [number, number]>();
  for (let t = 0; t < indices.length / 3; ++t) {
    const [a, b, c] = [0, 1, 2].map((k) => indices[3 * t + k]);
    volume += tetra(at(a), at(b), at(c));
    for (const [from, to] of [
      [a, b],
      [b, c],
      [c, a],
    ] as const)
      if (directed.delete(to + ":" + from) === false)
        directed.set(from + ":" + to, [from, to]);
  }
  // group the open edges into rims by shared vertices
  const parent = new Map<number, number>();
  const root = (v: number): number => {
    let r = v;
    while ((parent.get(r) ?? r) !== r) r = parent.get(r)!;
    parent.set(v, r);
    return r;
  };
  for (const [from, to] of directed.values()) {
    parent.set(root(from), root(to));
  }
  const rims = new Map<number, { edges: [number, number][]; sum: number[] }>();
  for (const [from, to] of directed.values()) {
    const rim = rims.get(root(from)) ?? { edges: [], sum: [0, 0, 0] };
    rim.edges.push([from, to]);
    const p = at(from);
    for (let k = 0; k < 3; ++k) rim.sum[k] += p[k];
    rims.set(root(from), rim);
  }
  for (const rim of rims.values()) {
    const centre = rim.sum.map((s) => s / rim.edges.length);
    for (const [from, to] of rim.edges)
      volume += tetra(at(to), at(from), centre);
  }
  return volume;
};
