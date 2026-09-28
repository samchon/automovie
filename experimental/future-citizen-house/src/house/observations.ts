import {
  Vector3,
  builtConvexCellVertices,
  builtEnvironmentElementBounds,
  builtSpaceContainsPoint,
  builtSpaceObservationStations,
  builtSpaceVolumeBounds,
} from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieVector3,
} from "@automovie/interface";

import { v } from "./assembly";
import type { auditCanopy } from "./canopy-audit";
import { appendExteriorObservations } from "./exterior-observations";
import { supplementalObservationEye } from "./observation-clear-eye";
import { boundaryCornerEyes } from "./observation-corners";

export type Observation = {
  id: string;
  space: string;
  role: string;
  cameraSpace?: string;
  pose: { position: IAutoMovieVector3; target: IAutoMovieVector3 } | null;
  reason: string;
  section?: { height: number; remove: "above" | "below" };
  fov: number;
};
/** Every question is derived from the produced cells, connectors and faces.
 * Failed positions are retained. No station uses a second room coordinate list. */
export function observations(
  e: IAutoMovieBuiltEnvironment,
  canopy?: ReturnType<typeof auditCanopy>,
): Observation[] {
  const out: Observation[] = [];
  const cameraObstacles = e.elements
    .filter((element) => element.model !== null)
    .flatMap((element) => {
      const box = builtEnvironmentElementBounds(e, element.id);
      return box ? [box] : [];
    });
  const add = (
    space: string,
    id: string,
    role: string,
    position: IAutoMovieVector3 | null,
    target: IAutoMovieVector3 | null,
    reason = "",
    section?: { height: number; remove: "above" | "below" },
  ) =>
    out.push({
      id,
      space,
      role,
      pose: position && target ? { position, target } : null,
      reason,
      ...(section === undefined ? {} : { section }),
      fov: 50,
    });
  const floorOf = (id: string, fallback: number) => {
    const inside = new Set([id]);
    for (let i = 0; i < e.spaces.length; i++)
      for (const s of e.spaces)
        if (s.parent && inside.has(s.parent)) inside.add(s.id);
    const heights = e.surfaces
      .filter((s) => inside.has(s.space))
      .flatMap((s) => {
        const h = s.surface.height;
        return h?.kind === "constant" ? [h.value] : [];
      });
    return heights.length ? Math.min(...heights) : fallback;
  };
  for (const space of e.spaces) {
    let bounds = builtSpaceVolumeBounds(space);
    if (!bounds) {
      for (const id of [
        "threshold",
        "corner-0",
        "corner-1",
        "corner-2",
        "corner-3",
        "center-x-",
        "center-x+",
        "center-z-",
        "center-z+",
      ])
        add(space.id, id, "interior", null, null, "No closed volume");
      continue;
    }
    const y = floorOf(space.id, bounds.min.y) + 1.6;
    if (space.kind === "building") {
      const occupied = space.cells.filter((c) => {
        const ys = builtConvexCellVertices(c).map((p) => p.y);
        return y >= Math.min(...ys) && y <= Math.max(...ys);
      });
      bounds = builtSpaceVolumeBounds({ ...space, cells: occupied }) ?? bounds;
    }
    const floor = y - 1.6;
    let center = v(
      (bounds.min.x + bounds.max.x) / 2,
      y,
      (bounds.min.z + bounds.max.z) / 2,
    );
    let rationale = "volume-bounds center at floor+1.60m";
    let centerUsable = true;
    if (!builtSpaceContainsPoint(space, center)) {
      const engine = builtSpaceObservationStations(e, space.id).find(
        (s) => s.role === "center" && s.pose,
      )?.pose?.position;
      if (engine) {
        center = { ...engine, y };
        rationale =
          "bounds center outside own cells; engine interior center with production eye";
      }
    }
    if (space.kind === "room") {
      // Containment alone admits a camera in the switchback stair or in a
      // cabinet. Derive standable centers from current placed parts, keeping
      // the original center when its floor-to-eye clearance is already open.
      const obstacles = e.elements
        .filter((element) => element.space === space.id)
        .flatMap((element) => {
          const box = builtEnvironmentElementBounds(e, element.id);
          return box ? [{ id: element.id, box }] : [];
        });
      const clear = (point: IAutoMovieVector3, radius: number) =>
        [
          point,
          v(point.x - radius, y, point.z),
          v(point.x + radius, y, point.z),
          v(point.x, y, point.z - radius),
          v(point.x, y, point.z + radius),
        ].every((sample) => builtSpaceContainsPoint(space, sample)) &&
        obstacles.every(({ id, box }) => {
          const circulation =
            id.startsWith("stair-") || id.startsWith("landing-");
          return (
            (!circulation &&
              (box.max.y <= floor + 0.08 || box.min.y >= y + 0.05)) ||
            box.max.x <= point.x - radius ||
            box.min.x >= point.x + radius ||
            box.max.z <= point.z - radius ||
            box.min.z >= point.z + radius
          );
        });
      if (!clear(center, 0.18)) {
        const candidates: IAutoMovieVector3[] = [];
        for (
          let x = bounds.min.x + 0.25;
          x <= bounds.max.x - 0.25 + 1e-7;
          x += 0.25
        )
          for (
            let z = bounds.min.z + 0.25;
            z <= bounds.max.z - 0.25 + 1e-7;
            z += 0.25
          )
            candidates.push(v(x, y, z));
        candidates.sort(
          (a, b) =>
            (a.x - center.x) ** 2 +
              (a.z - center.z) ** 2 -
              ((b.x - center.x) ** 2 + (b.z - center.z) ** 2) ||
            b.x - a.x ||
            a.z - b.z,
        );
        // Prefer a broad viewing pocket when one exists. A compact room can
        // still use the smaller camera cylinder without claiming that radius.
        let candidate: IAutoMovieVector3 | undefined;
        let selectedRadius = 0;
        for (const radius of [0.7, 0.5, 0.18]) {
          candidate = candidates.find((point) => clear(point, radius));
          if (candidate) {
            selectedRadius = radius;
            break;
          }
        }
        if (candidate) {
          center = candidate;
          rationale = `nearest center with ${selectedRadius.toFixed(2)}m compiled bound clearance at floor+1.60m`;
        } else {
          centerUsable = false;
          rationale =
            "No compiled room-clear standing center; center question retained as failed";
        }
      }
    }
    const inside = (p: IAutoMovieVector3) =>
      builtSpaceContainsPoint(space, p) ? p : null;
    for (const [id, direction] of [
      ["center-x-minus", v(-1, 0, 0)],
      ["center-x-plus", v(1, 0, 0)],
      ["center-z-minus", v(0, 0, -1)],
      ["center-z-plus", v(0, 0, 1)],
    ] as const)
      add(
        space.id,
        id,
        "center",
        centerUsable ? inside(center) : null,
        Vector3.add(center, direction),
        rationale,
      );
    for (const [i, sx, sz] of [
      [0, -1, -1],
      [1, -1, 1],
      [2, 1, -1],
      [3, 1, 1],
    ]) {
      const p = v(
        sx < 0 ? bounds.min.x + 0.25 : bounds.max.x - 0.25,
        y,
        sz < 0 ? bounds.min.z + 0.25 : bounds.max.z - 0.25,
      );
      add(
        space.id,
        "corner-" + i,
        "corner",
        inside(p),
        center,
        inside(p)
          ? "0.25m from both inside walls"
          : "Required box corner is outside own cells; not substituted",
      );
    }
    const connected = e.connectors
      .filter((c) => c.from === space.id || c.to === space.id)
      .sort((a, b) => a.id.localeCompare(b.id));
    const threshold = connected.find((c) => c.to === space.id) ?? connected[0];
    if (threshold) {
      const inward = threshold.to === space.id,
        endpoint = inward ? threshold.route.at(-1)! : threshold.route[0];
      const previous = inward ? threshold.route.at(-2)! : threshold.route[1];
      const dir = Vector3.normalize(
        v(endpoint.x - previous.x, 0, endpoint.z - previous.z),
      );
      const cell = space.cells.find((c) =>
        c.planes.every(
          (plane) => Vector3.dot(plane.normal, endpoint) <= plane.offset + 1e-7,
        ),
      );
      const distances =
        cell?.planes.flatMap((plane) => {
          const toward = -Vector3.dot(plane.normal, dir);
          return toward > 1e-7
            ? [(plane.offset - Vector3.dot(plane.normal, endpoint)) / toward]
            : [];
        }) ?? [];
      const fromFace =
        space.kind === "room" && distances.length
          ? Math.min(...distances)
          : 0.2;
      const p = v(
        endpoint.x + dir.x * (0.25 - fromFace),
        y,
        endpoint.z + dir.z * (0.25 - fromFace),
      );
      add(
        space.id,
        "threshold",
        "threshold",
        inside(p),
        center,
        "connector " + threshold.id + "; inner face +0.25m",
      );
    } else {
      const family = new Set([space.id]);
      for (let i = 0; i < e.spaces.length; i++)
        for (const s of e.spaces)
          if (s.parent && family.has(s.parent)) family.add(s.id);
      const descendants = e.spaces.filter(
        (s) => s.id !== space.id && family.has(s.id),
      );
      const child = descendants
        .map((s) => e.connectors.find((c) => c.to === s.id))
        .find((c) => c);
      const p = child
        ? { ...child.route.at(-1)!, y }
        : v(bounds.min.x + 0.25, y, bounds.min.z + 0.25);
      add(
        space.id,
        "threshold",
        "threshold",
        inside(p),
        center,
        child
          ? "container threshold inherited from " + child.id
          : "container boundary inset; no passage claimed",
      );
    }
    if (space.kind === "room" && space.cells.length > 1)
      for (const [ci, cell] of space.cells.entries()) {
        const vertices = builtConvexCellVertices(cell),
          xs = vertices.map((p) => p.x),
          zs = vertices.map((p) => p.z);
        for (const [sx, sz] of [
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1],
        ]) {
          const p = v(
            sx < 0 ? Math.min(...xs) + 0.25 : Math.max(...xs) - 0.25,
            y,
            sz < 0 ? Math.min(...zs) + 0.25 : Math.max(...zs) - 0.25,
          );
          add(
            space.id,
            "cell-" + ci + "-corner-" + sx + "-" + sz,
            "additional-cell-corner",
            inside(p),
            center,
            "Additional L-cell observation; required corners retained",
          );
        }
      }
    if (space.kind === "room" && space.cells.length > 1)
      for (const [index, point] of boundaryCornerEyes(space, y).entries())
        add(
          space.id,
          `boundary-corner-${index}`,
          "actual-boundary-corner",
          point,
          center,
          "Actual cell-union boundary; 0.25m inward from both walls. Bounding-box failures remain separately recorded.",
        );
    for (const station of out.filter(
      (station) =>
        station.space === space.id &&
        station.pose &&
        [
          "corner",
          "additional-cell-corner",
          "actual-boundary-corner",
          "threshold",
        ].includes(station.role),
    )) {
      const original = station.pose!;
      const eye = supplementalObservationEye(
        space,
        original.position,
        center,
        cameraObstacles,
      );
      if (eye)
        add(
          space.id,
          station.id + "/clear-eye",
          "additional-clear-eye",
          eye,
          center,
          "Original eye or first 0.35m look segment intersects a compiled element bound; original observation retained. Additional 0.08m camera pocket and near-view on segment toward interior center; not a body-clearance or farther-visibility claim.",
        );
    }
  }
  appendExteriorObservations(e, out, canopy);
  return out;
}
