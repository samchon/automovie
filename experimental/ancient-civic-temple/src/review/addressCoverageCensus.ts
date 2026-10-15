import { Quaternion, builtSpaceContainsPoint } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import type { WallSpec } from "../geometry/WallSpec";
import { AddressCoverage } from "./AddressCoverage";
import { AddressCoverageRow } from "./AddressCoverageRow";
import { Point } from "./Point";
import { exposedAddressExceptions } from "./exposedAddressExceptions";
import { exposedAddressExceptionFor } from "./exposedAddressExceptionFor";
import { type AddressException } from "./AddressException";
import { emittedTriangles } from "./emittedTriangles";
import { solidsContaining } from "./solidsContaining";
import { type ScanSolid } from "./ScanSolid";
import { pointInOutline } from "./pointInOutline";
import { rayTriangle } from "./rayTriangle";
import { reachesExterior } from "./reachesExterior";
import { Triangle } from "./Triangle";

/** Every emitted wall plan edge is sampled, even if the authored boundary collection omits it. */

export const addressCoverageCensus = (environment: IAutoMovieBuiltEnvironment, walls: readonly WallSpec[], solids: readonly ScanSolid[], step = 0.1): AddressCoverage => {
  if (!(step > 0 && step <= 0.1)) throw new Error("address coverage: step must be in (0, 0.1] m");
  const tris = emittedTriangles(environment);
  const occluders = tris.filter((triangle) => !/site-ground|site-distant/.test(triangle.element));
  const bucketSize = 0.5;
  const buckets = new Map<string, Triangle[]>();
  const byElement = new Map<string, Triangle[]>();
  for (const triangle of tris) {
    (byElement.get(triangle.element) ?? byElement.set(triangle.element, []).get(triangle.element)!).push(triangle);
    for (let x = Math.floor(triangle.minX / bucketSize); x <= Math.floor(triangle.maxX / bucketSize); x++) {
      for (let z = Math.floor(triangle.minZ / bucketSize); z <= Math.floor(triangle.maxZ / bucketSize); z++) {
        const key = `${x},${z}`;
        (buckets.get(key) ?? buckets.set(key, []).get(key)!).push(triangle);
      }
    }
  }
  const skyBlocked = (point: Point): boolean => (buckets.get(`${Math.floor(point.x / bucketSize)},${Math.floor(point.z / bucketSize)}`) ?? [])
    .some((triangle) => triangle.maxY >= point.y && rayTriangle(point, { x: 0, y: 1, z: 0 }, triangle) !== null);
  const rows: AddressCoverageRow[] = [];
  const exceptionCounts = new Map<AddressException, number>(exposedAddressExceptions.map((entry) => [entry, 0]));
  let emitted = 0, covered = 0, skyOpen = 0, exposed = 0, excepted = 0, unexpected = 0, addressedInException = 0;
  const locatedSpaces = environment.spaces.filter((space) => space.cells.length > 0);
  for (const wall of walls) {
    const element = `element.${wall.id}`;
    const own = byElement.get(element) ?? [];
    if (own.length === 0) continue;
    const wallBoundaries = environment.boundaries.filter((boundary) => boundary.elements.includes(element) && boundary.face !== undefined);
    const boundaries = wallBoundaries.map((boundary) => {
      const face = boundary.face!;
      const faceNormal = Quaternion.rotateVector(face.rotation, { x: 0, y: 0, z: 1 });
      // The pediment has two separately addressed faces on one physical wall; each keeps its side even if the other address is removed.
      const directional = wall.id === "wall.facade-south.pediment";
      return { face, directional, normal: faceNormal, axis: Quaternion.rotateVector(face.rotation, { x: 1, y: 0, z: 0 }) };
    });
    const cx = wall.plan.reduce((sum, point) => sum + point.x, 0) / wall.plan.length;
    const cz = wall.plan.reduce((sum, point) => sum + point.z, 0) / wall.plan.length;
    const minY = Math.min(...own.map((t) => t.minY));
    const maxY = Math.max(...own.map((t) => t.maxY));
    for (let faceIndex = 0; faceIndex < wall.plan.length; faceIndex++) {
      const a = wall.plan[faceIndex]!, b = wall.plan[(faceIndex + 1) % wall.plan.length]!;
      const length = Math.hypot(b.x - a.x, b.z - a.z);
      if (length < 1e-6) continue;
      const direction = { x: (b.x - a.x) / length, z: (b.z - a.z) / length };
      let normal = { x: direction.z, z: -direction.x };
      const midpoint = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 };
      if ((midpoint.x - cx) * normal.x + (midpoint.z - cz) * normal.z < 0) normal = { x: -normal.x, z: -normal.z };
      const candidates = own.filter((t) => Math.abs(((t.a.x + t.b.x + t.c.x) / 3 - a.x) * normal.x + ((t.a.z + t.b.z + t.c.z) / 3 - a.z) * normal.z) < 0.02);
      let faceEmitted = 0, faceCovered = 0, faceSky = 0, faceExposed = 0, faceExcepted = 0, faceUnexpected = 0;
      const surfaces = new Set<string>();
      for (let distance = step / 2; distance < length; distance += step) {
        for (let height = Math.ceil(minY / step) * step + step / 2; height < maxY; height += step) {
          const point = { x: a.x + direction.x * (distance + 0.000137), y: height + 0.000211, z: a.z + direction.z * (distance + 0.000137) };
          const outside = { x: point.x + normal.x * 0.004, y: point.y, z: point.z + normal.z * 0.004 };
          const emittedPart = candidates.find((triangle) => {
            const hit = rayTriangle(outside, { x: -normal.x, y: 0, z: -normal.z }, triangle);
            return hit !== null && hit < 0.008;
          });
          if (emittedPart === undefined) continue;
          emitted++; faceEmitted++;
          const addressed = boundaries.some(({ face, directional, normal: faceNormal, axis }) => {
            const dx = point.x - face.origin.x, dy = point.y - face.origin.y, dz = point.z - face.origin.z;
            const signedOffset = dx * faceNormal.x + dy * faceNormal.y + dz * faceNormal.z;
            const offset = directional ? signedOffset : Math.abs(signedOffset);
            return Math.abs(offset - face.thickness / 2) <= 0.01 && pointInOutline(face.outline, dx * axis.x + dy * axis.y + dz * axis.z, point.y);
          });
          if (addressed) {
            if (exposedAddressExceptionFor(wall.id, faceIndex, point) !== undefined) addressedInException++;
            covered++; faceCovered++; continue;
          }
          surfaces.add(emittedPart.part);
          const front = { x: point.x + normal.x * 0.02, y: point.y, z: point.z + normal.z * 0.02 };
          const far = { x: point.x + normal.x * 0.05, y: point.y, z: point.z + normal.z * 0.05 };
          const sky = !skyBlocked({ x: point.x + normal.x * 0.1, y: point.y, z: point.z + normal.z * 0.1 });
          if (sky) { skyOpen++; faceSky++; }
          if (solidsContaining(solids, front).length > 0) continue;
          const spaces = locatedSpaces.filter((space) => builtSpaceContainsPoint(space, far));
          // The pediment's named inner surface faces the open porch cell. It needs its own address
          // even though that cell is inside the authored entrance volume rather than above a roof.
          const openPorchFace = emittedPart.part === "surface.entrance.pediment-back" &&
            spaces.some((space) => space.id === "entrance");
          const exposedCell = openPorchFace || spaces.some((space) => space.id === "temple-site") ||
            (spaces.length === 0 && reachesExterior({ x: far.x + 0.000291, y: far.y + 0.000173, z: far.z + 0.000113 },
              { x: normal.x, y: 0, z: normal.z }, occluders));
          if (!exposedCell) continue;
          exposed++; faceExposed++;
          const exception = exposedAddressExceptionFor(wall.id, faceIndex, point);
          if (exception !== undefined) {
            excepted++; faceExcepted++;
            exceptionCounts.set(exception, exceptionCounts.get(exception)! + 1);
          } else {
            unexpected++; faceUnexpected++;
          }
        }
      }
      rows.push({
        wall: wall.id, face: faceIndex, emitted: faceEmitted, covered: faceCovered,
        uncovered: faceEmitted - faceCovered, skyOpen: faceSky, exposed: faceExposed, excepted: faceExcepted,
        unexpected: faceUnexpected, surfaces: [...surfaces].sort((a, b) => a.localeCompare(b))
      });
    }
  }
  return {
    step, emitted, covered, uncovered: emitted - covered, skyOpen, exposed, excepted, unexpected, addressedInException, rows,
    exceptions: exposedAddressExceptions.map((entry) => ({ ...entry, samples: exceptionCounts.get(entry)! }))
  };
};
