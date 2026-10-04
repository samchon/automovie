import { Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import type { resolveHumanFaceOpticalFrame } from "./resolveHumanFaceOpticalFrame";
import type { resolveHumanFaceOpticalProfile } from "./resolveHumanFaceOpticalProfile";

/**
 * Build one source-registered optical core and its identical closed outer hull.
 *
 * One 64-column lattice samples the anterior profile on 16 radial rings and
 * the posterior sphere in three eight-step latitude intervals: limbus to
 * equator, equator to the aperture's posterior latitude, and that latitude to
 * the posterior pole. Each pole is one point. The exterior has 2,498 points
 * and 4,992 triangles, independent of dimensions. These fixed sampling counts
 * are a rendering resolution, not an anatomical measurement or error bound.
 * The iris is a flat open annulus with eight radial intervals, 576 points and
 * 1,024 triangles; an opening is not patched into iris tissue.
 *
 * Corneal front points and the scleral limbal ring are the very same generated
 * points. The corneal back is the supplied axial offset; an outward rim wall
 * closes that shell. Wall shading duplicates corner attributes with the same
 * physical point IDs. The black interior backing is a reversed finish of the
 * opaque scleral sheet, not a retina, lens or pupil tissue model. This thin
 * opaque backing prevents a clear cap from exposing an empty scene.
 *
 * Physical IDs name points of this constructed core only. The face assembly
 * must bind them to its actual document/source/side instance before publication;
 * this cached geometry carries no generation-only instance domain. Drawing's
 * outer profile and contact's hull are sampled once, not independently fitted.
 *
 * @evidence contracts/common.md#principled-implementation Shares generated outer points and interface normals between drawing and contact; inner shell, open iris and reversed backing are explicit rendering approximations.
 * @evidence contracts/common.md#clear-and-simple-design One lattice and one point owner produce named meshes plus a closed collider hull.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No raw source IDs, coordinate-welding fallback, patient constants or separate fitted collider are introduced.
 * @evidence contracts/common.md#meaningful-documentation States populations, pole handling, physical ownership and each surface approximation.
 * @evidence contracts/modeling.md#emitted-geometry Fixed regular cap/sphere/annulus sampling gives the stated counts; requested dimensions move their points without adding primitives.
 * @evidence contracts/modeling.md#shared-boundaries Cornea and sclera read the same limbal points and profile tangent; the closed hull reads the same complete exterior incidence.
 * @evidence contracts/modeling.md#spatial-conventions Profile metres map through the qualified orthonormal head frame, and normals use directions without translation.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The optical assembly owns emitted part and material IDs.
 * @evidenceExclude contracts/modeling.md#parameter-channels The seven-dimension record and source carrier own inputs.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembled connected optical core owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source No measured tissue geometry is inferred from this authored construction.
 * @evidenceExclude contracts/anatomy.md#permitted-range The shared profile admits geometric containment; this builder certifies no clinical interval.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no new shaping input.
 */
export function buildHumanFaceOpticalGeometry(
  profile: ReturnType<typeof resolveHumanFaceOpticalProfile>,
  frame: ReturnType<typeof resolveHumanFaceOpticalFrame>,
) {
  const columns = 64, capRings = 16;
  const positions: number[][] = [], normals: number[][] = [], local: number[][] = [];
  const direction = (x: number, y: number, z: number) => Vector3.add(
    Vector3.scale(frame.lateral, x),
    Vector3.add(Vector3.scale(frame.up, y), Vector3.scale(frame.axis, z)),
  );
  const add = (x: number, y: number, z: number, nx: number, ny: number, nz: number) => {
    const p = Vector3.add(frame.center, direction(x, y, z));
    const n = Vector3.normalize(direction(nx, ny, nz));
    if (![p.x, p.y, p.z, n.x, n.y, n.z].every(Number.isFinite) || Vector3.length(n) === 0)
      throw new Error("Independent optical geometry is not representable in the source frame.");
    const id = positions.length;
    positions.push([p.x, p.y, p.z]); normals.push([n.x, n.y, n.z]); local.push([x, y, z]);
    return id;
  };
  const ring = (radius: number, z: number, slope: number) =>
    Array.from({ length: columns }, (_, column) => {
      const angle = 2 * Math.PI * column / columns;
      const x = Math.cos(angle), y = Math.sin(angle);
      return add(radius * x, radius * y, z, -slope * x, -slope * y, 1);
    });
  const connect = (a: readonly number[], b: readonly number[]) => {
    const triangles: number[] = [];
    for (let column = 0; column < columns; column++) {
      const next = (column + 1) % columns;
      triangles.push(a[column], b[column], b[next], a[column], b[next], a[next]);
    }
    return triangles;
  };
  const frontPole = add(0, 0, profile.apex, 0, 0, 1);
  const frontRings = Array.from({ length: capRings }, (_, row) => {
    const r = profile.limbus * (row + 1) / capRings;
    return ring(r, profile.height(r), profile.slope(r));
  });
  const front: number[] = [];
  for (let column = 0; column < columns; column++)
    front.push(frontPole, frontRings[0][column], frontRings[0][(column + 1) % columns]);
  for (let row = 1; row < capRings; row++) front.push(...connect(frontRings[row - 1], frontRings[row]));
  const sphere: number[] = [];
  let previous = frontRings.at(-1)!;
  let start = Math.asin(profile.limbus / profile.radius);
  const endpoints = [Math.PI / 2, Math.PI - Math.asin(profile.aperture / profile.radius), Math.PI];
  for (let interval = 0; interval < endpoints.length; interval++) {
    const end = endpoints[interval];
    for (let step = 1; step <= 8; step++) {
      if (interval === 2 && step === 8) {
        const pole = add(0, 0, -profile.radius, 0, 0, -1);
        for (let column = 0; column < columns; column++)
          sphere.push(previous[column], pole, previous[(column + 1) % columns]);
      } else {
        const angle = step === 8 ? end : start + (end - start) * step / 8;
        const r = step === 8 ? (interval === 0 ? profile.radius : profile.aperture) : profile.radius * Math.sin(angle);
        const z = step === 8 ? (interval === 0 ? 0 : -Math.sqrt(profile.radius ** 2 - profile.aperture ** 2)) : profile.radius * Math.cos(angle);
        const current = Array.from({ length: columns }, (_, column) => {
          const phi = 2 * Math.PI * column / columns;
          const x = r * Math.cos(phi), y = r * Math.sin(phi);
          return add(x, y, z, x / profile.radius, y / profile.radius, z / profile.radius);
        });
        sphere.push(...connect(previous, current)); previous = current;
      }
    }
    start = end;
  }
  const make = (triangles: readonly number[], inward = false, irisUvs = false) => {
    const ids: number[] = [], map = new Map<number, number>();
    const indices = triangles.map((id) => {
      if (!map.has(id)) { map.set(id, ids.length); ids.push(id); }
      return map.get(id)!;
    });
    const mesh: IAutoMovieMesh = {
      positions: ids.flatMap((id) => positions[id]),
      normals: ids.flatMap((id) => inward ? normals[id].map((n) => -n) : normals[id]),
      indices,
      uvs: irisUvs ? ids.flatMap((id) => [local[id][0] / (2 * profile.iris) + 0.5, local[id][1] / (2 * profile.iris) + 0.5]) : null,
      skin: null,
    };
    return { mesh, physicalPoints: ids };
  };
  const reverse = (rows: readonly number[]) => {
    const result: number[] = [];
    for (let at = 0; at < rows.length; at += 3) result.push(rows[at], rows[at + 2], rows[at + 1]);
    return result;
  };
  const hull = make([...front, ...sphere]);
  const sclera = make(sphere);
  const apertureBacking = make(reverse(sphere), true);
  const back = new Map<number, number>();
  const frontIds = [...new Set(front)];
  for (const id of frontIds) {
    const [x, y, z] = local[id];
    const n = normals[id];
    const p = Vector3.add(frame.center, direction(x, y, z - profile.thickness));
    const next = positions.length;
    positions.push([p.x, p.y, p.z]); normals.push(n.map((v) => -v)); local.push([x, y, z - profile.thickness]);
    back.set(id, next);
  }
  const cornea = make([...front, ...reverse(front).map((id) => back.get(id)!)]);
  const rim = frontRings.at(-1)!;
  // The wall owns different shading incidence at the same constructed points.
  for (let column = 0; column < columns; column++) {
    const next = (column + 1) % columns;
    const corners = [rim[column], back.get(rim[column])!, back.get(rim[next])!, rim[next]];
    const offset = cornea.mesh.positions.length / 3;
    for (let i = 0; i < corners.length; i++) {
      const id = corners[i], angle = 2 * Math.PI * (i < 2 ? column : next) / columns;
      const normal = direction(Math.cos(angle), Math.sin(angle), 0);
      cornea.mesh.positions.push(...positions[id]); cornea.mesh.normals!.push(normal.x, normal.y, normal.z);
      cornea.physicalPoints.push(id);
    }
    cornea.mesh.indices!.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
  }
  const irisRings = Array.from({ length: 9 }, (_, row) => ring(
    profile.aperture + (profile.iris - profile.aperture) * row / 8,
    profile.irisZ,
    0,
  ));
  const irisTriangles: number[] = [];
  for (let row = 1; row < irisRings.length; row++)
    irisTriangles.push(...connect(irisRings[row - 1], irisRings[row]));
  const iris = make(irisTriangles, false, true);
  return { hull, parts: { sclera, cornea, iris, apertureBacking } };
}
