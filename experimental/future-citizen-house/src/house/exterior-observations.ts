import {
  Quaternion,
  Vector3,
  builtEnvironmentEnvelopeCorners,
  builtEnvironmentEnvelopeFaces,
  builtSpaceVolumeBounds,
} from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieVector3,
} from "@automovie/interface";

import { v } from "./assembly";
import type { auditCanopy } from "./canopy-audit";
import type { Observation } from "./observations";

/** Append the entire native exterior, reference, and canopy detail population. */
export function appendExteriorObservations(
  e: IAutoMovieBuiltEnvironment,
  out: Observation[],
  canopy?: ReturnType<typeof auditCanopy>,
): void {
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
  const boundsOf = (id: string) => {
    const s = e.spaces.find((s) => s.id === id);
    return s ? builtSpaceVolumeBounds(s) : null;
  };
  const faces = builtEnvironmentEnvelopeFaces(e);
  for (const face of faces) {
    const radius = Math.max(
      ...face.vertices.map((p) =>
        Vector3.length(Vector3.subtract(p, face.centroid)),
      ),
    );
    const distance = (radius / Math.sin((25 * Math.PI) / 180)) * 1.08;
    const direction =
      Math.abs(face.normal.y) > 0.9
        ? Vector3.normalize(Vector3.add(face.normal, v(0, 0, -0.35)))
        : face.normal;
    add(
      "exterior",
      face.boundary,
      face.aspect,
      Vector3.add(face.centroid, Vector3.scale(direction, distance)),
      face.centroid,
      "compiled envelope normal and full extent",
      face.normal.y < -0.9
        ? {
            height: Math.min(...face.vertices.map((p) => p.y)) - 0.05,
            remove: "below",
          }
        : undefined,
    );
  }
  for (const corner of builtEnvironmentEnvelopeCorners(e)) {
    const vertices = faces
      .filter((f) => corner.facades.includes(f.boundary))
      .flatMap((f) => f.vertices);
    const radius = Math.max(
      ...vertices.map((p) =>
        Vector3.length(Vector3.subtract(p, corner.position)),
      ),
    );
    add(
      "exterior",
      corner.id,
      "corner",
      Vector3.add(
        corner.position,
        Vector3.scale(
          Vector3.normalize(Vector3.add(corner.normal, v(0, 0.15, 0))),
          radius / Math.sin((25 * Math.PI) / 180),
        ),
      ),
      corner.position,
      "both compiled faces framed",
    );
  }
  for (const opening of e.openings) {
    const face = e.boundaries.find((b) => b.id === opening.boundary)?.face;
    const exterior = faces.find((f) => f.boundary === opening.boundary);
    if (!face || !exterior) continue;
    const outline = opening.profile?.outline;
    if (!outline) {
      add(
        "exterior",
        opening.id,
        "opening",
        null,
        null,
        "No planar opening outline",
      );
      continue;
    }
    const mid = {
      x: outline.reduce((s, p) => s + p.x, 0) / outline.length,
      y: outline.reduce((s, p) => s + p.y, 0) / outline.length,
      z: 0,
    };
    const target = Vector3.add(
      face.origin,
      Quaternion.rotateVector(face.rotation, mid),
    );
    const radius = Math.max(
      ...outline.map((p) => Math.hypot(p.x - mid.x, p.y - mid.y)),
    );
    add(
      "exterior",
      opening.id,
      "opening",
      Vector3.add(
        target,
        Vector3.scale(
          exterior.normal,
          (radius / Math.sin((25 * Math.PI) / 180)) * 1.15,
        ),
      ),
      target,
      "actual opening profile and outward normal",
    );
  }
  const site = boundsOf("citizen-site"),
    house = boundsOf("house");
  if (site) {
    const center = Vector3.scale(Vector3.add(site.min, site.max), 0.5);
    add(
      "exterior",
      "setting",
      "setting",
      Vector3.add(center, v(-16, 10, -21)),
      center,
      "compiled site extent",
    );
  }
  if (house) {
    const center = Vector3.scale(Vector3.add(house.min, house.max), 0.5);
    add(
      "references",
      "01-exterior",
      "reference",
      Vector3.add(center, v(-14, 5, -19)),
      center,
      "Reference 1: front/right exterior; no clipping",
    );
    const upper = boundsOf("upper-storey");
    if (upper)
      add(
        "references",
        "02-section-axonometric",
        "inspection-reference",
        Vector3.add(center, v(12, 17, -19)),
        center,
        "Reference 2 is inspection only",
        { height: upper.min.y + 1.2, remove: "above" },
      );
  }
  for (const [id, room] of [
    ["03-common-room", "common-room"],
    ["04-flex-room", "flex-workroom"],
    ["05-upper-private-floor", "upper-corridor"],
  ]) {
    // The reference comparison starts on the actual arrival, not a bounding-box
    // corner that may be inside a tall cabinet. Required room stations remain.
    const arrival = out.find((s) => s.space === room && s.id === "threshold");
    out.push({
      id,
      space: "references",
      role: "reference",
      cameraSpace: room,
      pose: arrival?.pose ?? null,
      fov: 50,
      reason:
        "Reference room arrival; no wall removal; " +
        (arrival?.reason ?? "Required room threshold unavailable"),
    });
  }
  if (canopy) {
    const details = canopy.members.filter((m) =>
      /^(gutter-|overflow-|catch-|right-inspection|right-downpipe|canopy-support|canopy-endplate|canopy-rail)/.test(
        m.id,
      ),
    );
    const cassettes = canopy.cassetteParts.flatMap((c) =>
      c.parts
        .filter((p) => /^(head-|clip-|pv$)/.test(p.id))
        .map((p) => ({ id: c.id + "/" + p.id, box: p.box })),
    );
    for (const item of [...details, ...cassettes]) {
      const center = Vector3.scale(
        Vector3.add(item.box.min, item.box.max),
        0.5,
      );
      const size = Vector3.length(Vector3.subtract(item.box.max, item.box.min));
      const offset = Vector3.scale(
        Vector3.normalize(v(-1, 1.2, -0.5)),
        Math.max(0.12, size * 1.6),
      );
      add(
        "exterior",
        "detail/" + item.id,
        "assembly-detail",
        Vector3.add(center, offset),
        center,
        "Current native placed part bounds; detail supplements all required observations",
      );
    }
  }
}
