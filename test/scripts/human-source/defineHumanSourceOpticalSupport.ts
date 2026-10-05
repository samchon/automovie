import { Vector3 } from "@automovie/engine";
import { humanBasisRegionCorners } from "@automovie/human/common/basis/humanBasisRegionCorners";
import type { IAutoMovieHumanFaceOpticalSupport } from "@automovie/human/face/structures/IAutoMovieHumanFaceOpticalSupport";
import type { IAutoMovieHumanFaceOpticalSupportTarget } from "@automovie/human/face/structures/IAutoMovieHumanFaceOpticalSupportTarget";

import { HUMAN_SOURCE_EYE_CONVENTION } from "./HUMAN_SOURCE_EYE_CONVENTION.ts";
import { HUMAN_SOURCE_EYE_SIDES } from "./HUMAN_SOURCE_EYE_SIDES.ts";
import { intersectHumanSourceRay } from "./intersectHumanSourceRay.ts";
import type { IHumanSourceOpticalInput } from "./structures/IHumanSourceOpticalInput.ts";
import type { IHumanSourceOpticalRegistration } from "./structures/IHumanSourceOpticalRegistration.ts";

/** Eye surface ID of the CC0 proxy set. */
const SURFACE = "Human.low-poly";
/** Roll reference direction: head-frame up. */
const REFERENCE: [number, number, number] = [0, 1, 0];
/**
 * The reference must lie nearer the plane perpendicular to the axis than the
 * axis itself (angle between 45 and 135 degrees), or the roll it fixes turns
 * fast with small axis changes.
 */
const REFERENCE_MINIMUM_DEGREES = 45;

/**
 * The optical support of both eyes on the head view's face.
 *
 * - Component: the vertices of the eye's attachment, in attachment row order;
 *   the triangles are the surface's triangles whose three corners all belong
 *   to it, in stored order and orientation (one that crosses the component
 *   refuses); the neutral positions are read from the surface, and the UV
 *   pairs per corner from the material region triangle with the same oriented
 *   shared-vertex triple (`humanBasisRegionCorners`).
 * - Rigid: the articulation eye's centre landmark and gaze list, copied.
 * - Axis: from the eye centre landmark toward its gaze target landmark,
 *   normalized; the axis origin is the eye centre landmark. The anterior chart
 *   is the one component triangle facing the axis that the axis line meets
 *   (no hit, or more than one, refuses). The hit is checked on the line by the
 *   consumer's own arithmetic and bound.
 * - Reference: head-frame up, refused within 45 degrees of the axis; the
 *   measured angle is recorded.
 * - Targets: every endpoint that moves a component vertex or the centre
 *   landmark, with its exact sparse rows.
 */
export function defineHumanSourceOpticalSupport(input: IHumanSourceOpticalInput): IHumanSourceOpticalRegistration {
  const { face } = input;
  const surface = face.surfaces.find((s) => s.id === SURFACE);
  const landmarks = face.landmarks;
  if (surface === undefined || landmarks === undefined) throw new Error(`Optical support: the face has no ${SURFACE} surface or no landmarks.`);
  const landmark = (id: string): [number, number, number] => {
    const i = landmarks.ids.indexOf(id);
    if (i < 0) throw new Error(`Optical support: the face has no landmark ${id}.`);
    return [landmarks.positions[3 * i], landmarks.positions[3 * i + 1], landmarks.positions[3 * i + 2]];
  };
  const out: IHumanSourceOpticalRegistration = { supports: [], records: [] };
  for (const side of HUMAN_SOURCE_EYE_SIDES) {
    const refuse = (cause: string): never => {
      throw new Error(`Optical support ${side.owner}: ${cause}`);
    };
    const eye = face.articulation?.eyes.find((e) => e.id === side.owner);
    if (eye === undefined || eye.center !== side.center) refuse(`no articulation eye with centre ${side.center}`);
    const attachments = (surface.attachments ?? []).filter((a) => a.owner === side.owner);
    if (attachments.length !== 1) refuse(`${attachments.length} attachments, not 1`);
    const vertices: number[] = [];
    for (let at = 0; at < attachments[0].rows.length; at += 2) {
      if (attachments[0].rows[at + 1] !== 1) refuse(`vertex ${attachments[0].rows[at]} has weight ${attachments[0].rows[at + 1]}, not 1`);
      vertices.push(attachments[0].rows[at]);
    }
    const members = new Set(vertices);
    const triangles: number[] = [];
    for (let at = 0; at < surface.indices.length; at += 3) {
      const row = surface.indices.slice(at, at + 3);
      if (row.every((v) => members.has(v))) triangles.push(...row);
      else if (row.some((v) => members.has(v))) refuse(`triangle ${at / 3} crosses the component`);
    }
    const cornerUvs = new Map<string, number[]>();
    for (const region of surface.regions) {
      const corners = humanBasisRegionCorners(region);
      if (corners.uvs === null) continue;
      for (let at = 0; at < corners.indices.length; at += 3) {
        const render = corners.indices.slice(at, at + 3);
        const shared = render.map((r) => corners.sources[r]);
        if (!shared.every((v) => members.has(v))) continue;
        const key = shared.join(",");
        if (cornerUvs.has(key)) refuse(`triangle ${key} appears twice in the UV regions`);
        cornerUvs.set(key, render.flatMap((r) => corners.uvs!.slice(r * 2, r * 2 + 2)));
      }
    }
    const neutralUvs: number[] = [];
    for (let at = 0; at < triangles.length; at += 3) {
      const pairs = cornerUvs.get(triangles.slice(at, at + 3).join(","));
      if (pairs === undefined) refuse(`triangle ${triangles.slice(at, at + 3).join(",")} has no UV region triangle`);
      neutralUvs.push(...pairs!);
    }
    const origin = landmark(side.center);
    const toward = landmark(side.target);
    const length = Math.hypot(toward[0] - origin[0], toward[1] - origin[1], toward[2] - origin[2]);
    if (!(length > 0)) refuse(`${side.target} coincides with ${side.center}`);
    const axis: [number, number, number] = [(toward[0] - origin[0]) / length, (toward[1] - origin[1]) / length, (toward[2] - origin[2]) / length];
    const hits = intersectHumanSourceRay(surface.positions, triangles, origin, axis);
    const facing = hits.filter((h) => h.facing);
    if (facing.length !== 1) refuse(`the axis meets ${facing.length} component triangles facing it, not 1`);
    const hit = facing[0];
    // The consumer's own line check, with its arithmetic and bound.
    const point = (id: number) => Vector3.create(surface.positions[id * 3], surface.positions[id * 3 + 1], surface.positions[id * 3 + 2]);
    const [a, b, c] = hit.triangle.map(point);
    const neutral = Vector3.add(a, Vector3.add(Vector3.scale(Vector3.subtract(b, a), hit.u), Vector3.scale(Vector3.subtract(c, a), hit.v)));
    const normalized = Vector3.normalize(Vector3.create(...axis));
    const lineError = Vector3.length(Vector3.cross(Vector3.subtract(neutral, Vector3.create(...origin)), normalized));
    const scale = Math.max(...origin.map(Math.abs), Math.abs(neutral.x), Math.abs(neutral.y), Math.abs(neutral.z));
    if (!(lineError <= 32 * Number.EPSILON * scale)) refuse(`the hit is ${lineError} m off the axis line`);
    const referenceDegrees = (Math.acos(REFERENCE[0] * axis[0] + REFERENCE[1] * axis[1] + REFERENCE[2] * axis[2]) * 180) / Math.PI;
    if (referenceDegrees < REFERENCE_MINIMUM_DEGREES || referenceDegrees > 180 - REFERENCE_MINIMUM_DEGREES)
      refuse(`the reference is ${referenceDegrees} degrees from the axis`);
    const pivot = landmarks.ids.indexOf(side.center);
    const rowsFor = (rows: readonly number[] | undefined, selected: ReadonlySet<number>): number[] => {
      const picked: number[] = [];
      for (let at = 0; at < (rows?.length ?? 0); at += 4) if (selected.has(rows![at])) picked.push(...rows!.slice(at, at + 4));
      return picked;
    };
    const moves = (rows: readonly number[]): boolean => rows.some((value, at) => at % 4 !== 0 && value !== 0);
    const targets: IAutoMovieHumanFaceOpticalSupportTarget[] = [];
    for (const id of [...new Set([...Object.keys(surface.targets), ...Object.keys(landmarks.targets)])].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0))) {
      const surfaceRows = rowsFor(surface.targets[id], members);
      const pivotRows = rowsFor(landmarks.targets[id], new Set([pivot]));
      if (moves(surfaceRows) || moves(pivotRows)) targets.push({ id, surfaceRows, pivotRows });
    }
    const support: IAutoMovieHumanFaceOpticalSupport = {
      owner: side.owner,
      surface: SURFACE,
      generation: input.generation,
      sourceSha256: input.sourceSha256,
      rigid: { center: eye!.center, gaze: eye!.gaze.map((g) => ({ channel: g.channel, axis: [...g.axis], degrees: g.degrees, translation: [...g.translation] })) },
      vertices,
      neutralPositions: vertices.flatMap((v) => surface.positions.slice(3 * v, 3 * v + 3)),
      neutralUvs,
      triangles,
      anterior: { triangle: hit.triangle, u: hit.u, v: hit.v },
      axis,
      axisOrigin: origin,
      reference: REFERENCE,
      targets,
    };
    out.supports.push(support);
    out.records.push({
      owner: side.owner,
      convention: HUMAN_SOURCE_EYE_CONVENTION,
      rule: `axis from ${side.center} toward ${side.target}; origin ${side.center}; anterior = the one facing component triangle the axis line meets`,
      vertices: vertices.length,
      triangles: triangles.length / 3,
      hits: hits.map((h) => ({ triangle: h.triangle, t: h.t, facing: h.facing })),
      anterior: { triangle: hit.triangle, u: hit.u, v: hit.v, t: hit.t },
      lineError,
      referenceDegrees,
      targets: targets.map((t) => t.id),
    });
  }
  return out;
}
