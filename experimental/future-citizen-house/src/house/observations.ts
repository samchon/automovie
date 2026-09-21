import { builtSpaceVolumeBounds, builtSpaceContainsPoint, builtConvexCellVertices, builtEnvironmentEnvelopeFaces, builtEnvironmentEnvelopeCorners, builtSpaceObservationStations, Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment, IAutoMovieVector3 } from "@automovie/interface";
import { v } from "./assembly";
export type Observation = { id: string; space: string; role: string; cameraSpace?: string; pose: { position: IAutoMovieVector3; target: IAutoMovieVector3 } | null; reason: string; section?: { height: number; remove: "above" | "below" }; fov: number };
/** Every question is derived from the produced cells, connectors and faces.
 * Failed positions are retained. No station uses a second room coordinate list. */
export function observations(e: IAutoMovieBuiltEnvironment): Observation[] {
  const out: Observation[] = [];
  const add = (space: string, id: string, role: string, position: IAutoMovieVector3 | null, target: IAutoMovieVector3 | null, reason = "", section?: { height: number; remove: "above" | "below" }) => out.push({ id, space, role, pose: position && target ? { position, target } : null, reason, ...(section === undefined ? {} : { section }), fov: 50 });
  const boundsOf = (id: string) => { const s = e.spaces.find((s) => s.id === id); return s ? builtSpaceVolumeBounds(s) : null; };
  const floorOf = (id: string, fallback: number) => {
    const inside = new Set([id]);
    for (let i = 0; i < e.spaces.length; i++) for (const s of e.spaces) if (s.parent && inside.has(s.parent)) inside.add(s.id);
    const heights = e.surfaces.filter((s) => inside.has(s.space)).flatMap((s) => { const h = s.surface.height; return h?.kind === "constant" ? [h.value] : []; });
    return heights.length ? Math.min(...heights) : fallback;
  };
  for (const space of e.spaces) {
    const bounds = builtSpaceVolumeBounds(space);
    if (!bounds) { for (const id of ["threshold", "corner-0", "corner-1", "corner-2", "corner-3", "center-x-", "center-x+", "center-z-", "center-z+"]) add(space.id, id, "interior", null, null, "No closed volume"); continue; }
    const y = floorOf(space.id, bounds.min.y) + 1.6;
    let center = v((bounds.min.x + bounds.max.x) / 2, y, (bounds.min.z + bounds.max.z) / 2);
    let rationale = "volume-bounds center at floor+1.60m";
    if (!builtSpaceContainsPoint(space, center)) {
      const engine = builtSpaceObservationStations(e, space.id).find((s) => s.role === "center" && s.pose)?.pose?.position;
      if (engine) { center = { ...engine, y }; rationale = "bounds center outside own cells; engine interior center with production eye"; }
    }
    const inside = (p: IAutoMovieVector3) => builtSpaceContainsPoint(space, p) ? p : null;
    for (const [id, direction] of [["center-x-minus", v(-1, 0, 0)], ["center-x-plus", v(1, 0, 0)], ["center-z-minus", v(0, 0, -1)], ["center-z-plus", v(0, 0, 1)]] as const) add(space.id, id, "center", inside(center), Vector3.add(center, direction), rationale);
    for (const [i, sx, sz] of [[0, -1, -1], [1, -1, 1], [2, 1, -1], [3, 1, 1]]) {
      const p = v(sx < 0 ? bounds.min.x + 0.25 : bounds.max.x - 0.25, y, sz < 0 ? bounds.min.z + 0.25 : bounds.max.z - 0.25);
      add(space.id, "corner-" + i, "corner", inside(p), center, inside(p) ? "0.25m from both inside walls" : "Required box corner is outside own cells; not substituted");
    }
    const connected = e.connectors.filter((c) => c.from === space.id || c.to === space.id).sort((a, b) => a.id.localeCompare(b.id));
    const threshold = connected.find((c) => c.to === space.id) ?? connected[0];
    if (threshold) {
      const inward = threshold.to === space.id, endpoint = inward ? threshold.route.at(-1)! : threshold.route[0];
      const previous = inward ? threshold.route.at(-2)! : threshold.route[1];
      const dir = Vector3.normalize(v(endpoint.x - previous.x, 0, endpoint.z - previous.z));
      const cell = space.cells.find((c) => c.planes.every((plane) => Vector3.dot(plane.normal, endpoint) <= plane.offset + 1e-7));
      const distances = cell?.planes.flatMap((plane) => { const toward = -Vector3.dot(plane.normal, dir); return toward > 1e-7 ? [(plane.offset - Vector3.dot(plane.normal, endpoint)) / toward] : []; }) ?? [];
      const fromFace = space.kind === "room" && distances.length ? Math.min(...distances) : 0.20;
      const p = v(endpoint.x + dir.x * (0.25 - fromFace), y, endpoint.z + dir.z * (0.25 - fromFace));
      add(space.id, "threshold", "threshold", inside(p), center, "connector " + threshold.id + "; inner face +0.25m");
    } else {
      const descendants = e.spaces.filter((s) => s.parent === space.id);
      const child = descendants.map((s) => e.connectors.find((c) => c.to === s.id)).find((c) => c);
      const p = child ? { ...child.route.at(-1)!, y } : v(bounds.min.x + 0.25, y, bounds.min.z + 0.25);
      add(space.id, "threshold", "threshold", inside(p), center, child ? "container threshold inherited from " + child.id : "container boundary inset; no passage claimed");
    }
    if (space.cells.length > 1) for (const [ci, cell] of space.cells.entries()) {
      const vertices = builtConvexCellVertices(cell), xs = vertices.map((p) => p.x), zs = vertices.map((p) => p.z);
      for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
        const p = v(sx < 0 ? Math.min(...xs) + 0.25 : Math.max(...xs) - 0.25, y, sz < 0 ? Math.min(...zs) + 0.25 : Math.max(...zs) - 0.25);
        add(space.id, "cell-" + ci + "-corner-" + sx + "-" + sz, "additional-cell-corner", inside(p), center, "Additional L-cell observation; required corners retained");
      }
    }
  }
  const faces = builtEnvironmentEnvelopeFaces(e);
  for (const face of faces) {
    const radius = Math.max(...face.vertices.map((p) => Vector3.length(Vector3.subtract(p, face.centroid))));
    const distance = radius / Math.sin(25 * Math.PI / 180) * 1.08;
    const direction = Math.abs(face.normal.y) > 0.9 ? Vector3.normalize(Vector3.add(face.normal, v(0, 0, -0.35))) : face.normal;
    add("exterior", face.boundary, face.aspect, Vector3.add(face.centroid, Vector3.scale(direction, distance)), face.centroid, "compiled envelope normal and full extent", face.normal.y < -0.9 ? { height: face.centroid.y - 0.05, remove: "below" } : undefined);
  }
  for (const corner of builtEnvironmentEnvelopeCorners(e)) {
    const vertices = faces.filter((f) => corner.facades.includes(f.boundary)).flatMap((f) => f.vertices);
    const radius = Math.max(...vertices.map((p) => Vector3.length(Vector3.subtract(p, corner.position))));
    add("exterior", corner.id, "corner", Vector3.add(corner.position, Vector3.scale(Vector3.normalize(Vector3.add(corner.normal, v(0, 0.15, 0))), radius / Math.sin(25 * Math.PI / 180))), corner.position, "both compiled faces framed");
  }
  for (const opening of e.openings) {
    const face = e.boundaries.find((b) => b.id === opening.boundary)?.face;
    const exterior = faces.find((f) => f.boundary === opening.boundary);
    if (!face || !exterior) continue;
    const outline = opening.profile?.outline;
    if (!outline) { add("exterior", opening.id, "opening", null, null, "No planar opening outline"); continue; }
    const mid = { x: outline.reduce((s, p) => s + p.x, 0) / outline.length, y: outline.reduce((s, p) => s + p.y, 0) / outline.length, z: 0 };
    const target = Vector3.add(face.origin, Quaternion.rotateVector(face.rotation, mid));
    const radius = Math.max(...outline.map((p) => Math.hypot(p.x - mid.x, p.y - mid.y)));
    add("exterior", opening.id, "opening", Vector3.add(target, Vector3.scale(exterior.normal, radius / Math.sin(25 * Math.PI / 180) * 1.15)), target, "actual opening profile and outward normal");
  }
  const site = boundsOf("citizen-site"), house = boundsOf("house");
  if (site) { const center = Vector3.scale(Vector3.add(site.min, site.max), 0.5); add("exterior", "setting", "setting", Vector3.add(center, v(-16, 10, -21)), center, "compiled site extent"); }
  if (house) {
    const center = Vector3.scale(Vector3.add(house.min, house.max), 0.5);
    add("references", "01-exterior", "reference", Vector3.add(center, v(-14, 5, -19)), center, "Reference 1: front/right exterior; no clipping");
    const upper = boundsOf("upper-storey");
    if (upper) add("references", "02-section-axonometric", "inspection-reference", Vector3.add(center, v(12, 17, -19)), center, "Reference 2 is inspection only", { height: upper.min.y + 1.2, remove: "above" });
  }
  for (const [id, room] of [["03-common-room", "common-room"], ["04-flex-room", "flex-workroom"], ["05-upper-private-floor", "upper-corridor"]]) {
    // The reference comparison starts on the actual arrival, not a bounding-box
    // corner that may be inside a tall cabinet. Required room stations remain.
    const arrival = out.find((s) => s.space === room && s.id === "threshold");
    out.push({ id, space: "references", role: "reference", cameraSpace: room,
      pose: arrival?.pose ?? null, fov: 50,
      reason: "Reference room arrival; no wall removal; " + (arrival?.reason ?? "Required room threshold unavailable") });
  }
  return out;
}
