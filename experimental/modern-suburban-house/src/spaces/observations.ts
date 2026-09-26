/**
 * `spatial-observation-derivation` and `reference-spatial-comparisons`: the
 * spatial questions and self-space poses derived from the house's
 * built-environment record.
 *
 * Design owner: `docs/spaces/04-observations.md`. The derivation reads only
 * the record `buildHouseEnvironment` returns, never a second copy of the
 * house, and fixes no view count in advance:
 * - every room, stair, storage and exterior zone gets the engine's stations
 *   (`builtSpaceObservationStations`): four centre directions, four corners
 *   moved inside, and one threshold per opening on its boundaries, at 1.6 m
 *   above the space's floor (settings `frame-condition`);
 * - every reflex corner of a room or zone outline, which the four bounding-box
 *   corners cannot see behind, adds a station standing one person half-width
 *   (0.30 m of the settings `use-profile` 0.60 m person) diagonally inside the
 *   corner and looking along each of its two walls;
 * - the building census (`builtEnvironmentBuildingCensus`) adds one question
 *   per facade, roof face, underside, envelope corner and entrance; these are
 *   exterior questions whose camera belongs to settings, so they carry no pose;
 * - the five reference comparisons name the derived observations each
 *   reference reads.
 * A station whose pose is null, falls outside its own space, or coincides with
 * an earlier pose of the same space is not an observation: it is reported in
 * `failures` with its cause and never counted.
 */
import { builtEnvironmentBuildingCensus, builtSpaceContainsPoint, builtSpaceObservationStations } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment, IAutoMovieBuiltSpace, IAutoMovieVector3 } from "@automovie/interface";

import { openingAxis } from "./environment";
import type { IHouse } from "./house";
import { roomLevels } from "./rooms/shared";
import type { IPlanPoint } from "./solids";

/**
 * A camera pose inside its own space: where the eye is and what it looks at.
 * @evidence spaces/04-observations.md The spatial observation design locates a station inside its subject space.
 * @evidence spaces/04-observations.md#spatial-observation-derivation Position and look target are recorded together for each accepted station.
 * @evidence principles/core/source-units.md#source-scope-preservation This type describes derived camera data and does not make a new room or opening.
 * @evidence principles/core/source-units.md#source-substantive-completion Both vectors needed to inspect a station are present.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The observation parent already requires inspectable self-space poses; this shape revises no space design.
 */
export interface IObservationPose {
  /** @evidence spaces/04-observations.md#spatial-observation-derivation The eye remains at a position in its subject space. */
  position: IAutoMovieVector3;
  /** @evidence spaces/04-observations.md#spatial-observation-derivation The station looks toward its observed boundary or room interior. */
  target: IAutoMovieVector3;
}

/**
 * One derived spatial question.
 * @evidence spaces/04-observations.md Every inspection question has a role, subject, and optional self-space pose.
 * @evidence spaces/04-observations.md#spatial-observation-derivation Interior stations and exterior census questions share a stable record shape.
 * @evidence principles/core/source-units.md#source-scope-preservation A question observes authored geometry instead of adding geometry.
 * @evidence principles/core/source-units.md#source-substantive-completion The record exposes station identity, role, subject and camera ownership.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The observation contract already separates interior poses from exterior census questions.
 */
export interface IHouseObservation {
  /** @evidence spaces/04-observations.md#spatial-observation-derivation Stable station or building-census address. */
  id: string;
  /** @evidence spaces/04-observations.md#spatial-observation-derivation Centre, corner, threshold and building roles identify the question. */
  role: "center" | "corner" | "threshold" | "reflex-corner" | "facade" | "roof" | "underside" | "envelope-corner" | "entrance";
  /** @evidence spaces/04-observations.md#spatial-observation-derivation The pose stands in this space; exterior census questions have none. */
  space: string | null;
  /** @evidence spaces/04-observations.md#spatial-observation-derivation Opening, boundary or corner under inspection, when applicable. */
  subject: string | null;
  /** @evidence spaces/04-observations.md#engine-render-handoff Interior questions carry a pose; settings supplies the exterior census camera. */
  pose: IObservationPose | null;
}

/**
 * What one reference comparison reads.
 * @evidence spaces/04-observations.md The five references select derived observations and records.
 * @evidence spaces/04-observations.md#reference-spatial-comparisons Each comparison names the questions it uses.
 * @evidence principles/core/source-units.md#source-scope-preservation The comparison selects existing observations without authoring a second house.
 * @evidence principles/core/source-units.md#source-substantive-completion Reference identity, station ids and record ids are explicit.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The design already enumerates five reference comparisons; this type adds no new reference.
 */
export interface IReferenceComparison {
  /** @evidence spaces/04-observations.md#reference-spatial-comparisons The key identifies one of the five given reference views. */
  reference: "01" | "02" | "03" | "04" | "05";
  /** @evidence spaces/04-observations.md#reference-spatial-comparisons The comparison reads these accepted observation ids. */
  observations: string[];
  /** @evidence spaces/04-observations.md#reference-spatial-comparisons The cutaway can read storey records without inventing a camera pose. */
  records: string[];
}

/**
 * The derivation result.
 * @evidence spaces/04-observations.md It returns accepted questions, failed stations and reference selections.
 * @evidence spaces/04-observations.md#spatial-observation-derivation Failed poses remain visible and are not counted as observations.
 * @evidence principles/core/source-units.md#source-scope-preservation The result is computed from the built house record.
 * @evidence principles/core/source-units.md#source-substantive-completion Both the accepted census and rejected stations reach the caller.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work This result realizes the existing observation duty without revising its parent.
 */
export interface IObservationDerivation {
  /** @evidence spaces/04-observations.md#spatial-observation-derivation Accepted stations and building questions. */
  observations: IHouseObservation[];
  /** @evidence spaces/04-observations.md#spatial-observation-derivation Invalid or coincident stations retain an id and cause. */
  failures: { id: string; cause: string }[];
  /** @evidence spaces/04-observations.md#reference-spatial-comparisons Five selections reference observations and records. */
  references: IReferenceComparison[];
}

/** Eye height above a space's floor (settings frame-condition). */
const EYE = 1.6;
/** Half the 0.60 m person width of the settings use-profile. */
const HALF_PERSON = 0.3;
/** Two poses closer than this in the same space count as one place. */
const SAME_PLACE = 0.05;

const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/** Bounds of one axis-aligned cell in the current compiled space record. */
const cellRange = (cell: IAutoMovieBuiltSpace["cells"][number], axis: "x" | "y" | "z"): readonly [number, number] => {
  const positive = cell.planes.find((plane) => plane.normal[axis] === 1);
  const negative = cell.planes.find((plane) => plane.normal[axis] === -1);
  if (positive === undefined || negative === undefined)
    throw new Error(`observation cell ${cell.id} has no ${axis} bounds`);
  return [-negative.offset, positive.offset];
};

/** Find an inside pose for a bounding-box corner absent from a concave space. */
const insetCorner = (
  space: IAutoMovieBuiltSpace,
  stationId: string,
  floor: number | undefined,
  centers: readonly IHouseObservation[],
  stairRoute: readonly IAutoMovieVector3[],
): IObservationPose | null => {
  const sign = /corner-x-(plus|minus)-z-(plus|minus)/.exec(stationId);
  if (sign === null || space.cells.length === 0) return null;
  const cells = space.cells.map((cell) => ({
    x: cellRange(cell, "x"),
    y: cellRange(cell, "y"),
    z: cellRange(cell, "z"),
  }));
  const xs = cells.flatMap((cell) => cell.x);
  const zs = cells.flatMap((cell) => cell.z);
  const wanted = {
    x: sign[1] === "plus" ? Math.max(...xs) : Math.min(...xs),
    z: sign[2] === "plus" ? Math.max(...zs) : Math.min(...zs),
  };
  const clampInside = (value: number, range: readonly [number, number]): number => {
    const inset = Math.min(HALF_PERSON, (range[1] - range[0]) / 3);
    return Math.max(range[0] + inset, Math.min(value, range[1] - inset));
  };
  const cellCandidates = cells.flatMap((cell) => {
    const y = floor === undefined ? cell.y[0] + EYE : floor + EYE;
    if (y > cell.y[1] - 0.01) return [];
    const position = { x: clampInside(wanted.x, cell.x), y, z: clampInside(wanted.z, cell.z) };
    if (!builtSpaceContainsPoint(space, position)) return [];
    return [position];
  });
  // A stair's upper void is inside its semantic volume but has no standing
  // surface. Its actual connector route supplies the camera's foot position.
  const routeCandidates = stairRoute
    .map((foot) => ({ x: foot.x, y: foot.y + EYE, z: foot.z }))
    .filter((position) => builtSpaceContainsPoint(space, position));
  const candidates = space.kind === "stair" && routeCandidates.length > 0 ? routeCandidates : cellCandidates;
  candidates.sort((a, b) =>
    Math.hypot(a.x - wanted.x, a.z - wanted.z) - Math.hypot(b.x - wanted.x, b.z - wanted.z) || a.y - b.y,
  );
  const position = candidates[0];
  if (position === undefined) return null;
  const center = centers
    .filter((observation) => observation.space === space.id && observation.role === "center" && observation.pose !== null)
    .map((observation) => observation.pose!.position)
    .sort((a, b) => distance(a, position) - distance(b, position))[0];
  return { position, target: center === undefined ? { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: position.y, z: (Math.min(...zs) + Math.max(...zs)) / 2 } : { x: center.x, y: position.y, z: center.z } };
};

/** Reflex (interior 270°) corners of a counter-clockwise or clockwise rectilinear outline. */
const reflexCorners = (outline: readonly IPlanPoint[]): { at: IPlanPoint; toPrev: IPlanPoint; toNext: IPlanPoint }[] => {
  let area = 0;
  for (let i = 0; i < outline.length; ++i) {
    const a = outline[i]!;
    const b = outline[(i + 1) % outline.length]!;
    area += a.x * b.z - b.x * a.z;
  }
  const result: { at: IPlanPoint; toPrev: IPlanPoint; toNext: IPlanPoint }[] = [];
  for (let i = 0; i < outline.length; ++i) {
    const prev = outline[(i + outline.length - 1) % outline.length]!;
    const at = outline[i]!;
    const next = outline[(i + 1) % outline.length]!;
    const turn = (at.x - prev.x) * (next.z - at.z) - (at.z - prev.z) * (next.x - at.x);
    if (turn * area < 0) result.push({ at, toPrev: prev, toNext: next });
  }
  return result;
};

const unit = (from: IPlanPoint, to: IPlanPoint): IPlanPoint => {
  const length = Math.hypot(to.x - from.x, to.z - from.z);
  return { x: (to.x - from.x) / length, z: (to.z - from.z) / length };
};

/**
 * Derive every spatial question and self-space pose of the house.
 * @evidence spaces/04-observations.md The derivation consumes the built environment and house-owned outlines.
 * @evidence spaces/04-observations.md#spatial-observation-derivation Engine stations, concave corners and building census generate questions; bad poses enter failures.
 * @evidence spaces/04-observations.md#reference-spatial-comparisons The five reference selectors read the accepted station ids and storey records.
 * @evidence spaces/04-observations.md#engine-render-handoff The returned poses are inspection data for later rendering, not camera geometry in the house.
 * @evidence principles/core/source-units.md#source-scope-preservation The function derives from the one compiled environment and house record without duplicating their geometry.
 * @evidence principles/core/source-units.md#source-substantive-completion It returns the station list, explicit failures and all five reference selections.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The existing observation parent specifies this census and comparison handoff; no new space rule was needed.
 */
export const deriveHouseObservations = (environment: IAutoMovieBuiltEnvironment, house: IHouse): IObservationDerivation => {
  const observations: IHouseObservation[] = [];
  const failures: { id: string; cause: string }[] = [];
  const spaces = new Map(environment.spaces.map((s) => [s.id, s]));
  const accept = (o: IHouseObservation): void => {
    const space = o.space === null ? undefined : spaces.get(o.space);
    if (o.pose === null) failures.push({ id: o.id, cause: "no pose inside its space" });
    else if (space === undefined || !builtSpaceContainsPoint(space, o.pose.position)) failures.push({ id: o.id, cause: `pose leaves space "${o.space}"` });
    else {
      const twin = observations.find((p) => p.space === o.space && p.pose !== null && distance(p.pose.position, o.pose!.position) < SAME_PLACE && distance(p.pose.target, o.pose!.target) < SAME_PLACE);
      if (twin !== undefined) failures.push({ id: o.id, cause: `coincides with "${twin.id}"` });
      else observations.push(o);
    }
  };
  // A threshold one person half-width beyond the wall on the space's side of an
  // opening, at eye height over `floor`, looking at the void centre; null when
  // neither side of the opening lies in the space.
  const threshold = (spaceId: string, openingId: string, floor: (x: number, z: number) => number): IObservationPose | null => {
    const space = spaces.get(spaceId)!;
    const { centre, normal, reach } = openingAxis(environment, openingId);
    for (const s of [1, -1]) {
      const x = centre.x + normal.x * (reach + HALF_PERSON) * s;
      const z = centre.z + normal.z * (reach + HALF_PERSON) * s;
      const position = { x, y: floor(x, z) + EYE, z };
      if (builtSpaceContainsPoint(space, { x, y: floor(x, z) + 0.01, z })) return { position, target: centre };
    }
    return null;
  };
  // Engine stations of every inhabited or walkable space. Where the engine finds no
  // threshold pose (an opening at an L-shaped room's notch), the same threshold rule
  // is applied on the space's side before the station counts as failed.
  const floorOf = new Map(house.spaces.map((s) => [s.id, roomLevels(s)[0]]));
  for (const space of environment.spaces) {
    if (!["room", "stair", "storage", "exterior"].includes(space.kind)) continue;
    for (const station of builtSpaceObservationStations(environment, space.id)) {
      const floor = floorOf.get(space.id);
      if (station.role === "corner" && station.pose === null) {
        const stairRoute = environment.connectors.find((connector) => connector.landings?.some((landing) => landing.space === space.id))?.route ?? [];
        accept({ id: `${space.id}/${station.id}`, role: "corner", space: space.id, subject: station.opening, pose: insetCorner(space, station.id, floor, observations, stairRoute) });
        continue;
      }
      if (station.role === "threshold" && station.pose === null && station.opening !== null && floor !== undefined) {
        accept({ id: `${space.id}/threshold-${station.opening}`, role: "threshold", space: space.id, subject: station.opening, pose: threshold(space.id, station.opening, () => floor) });
        continue;
      }
      accept({
        id: `${space.id}/${station.id}`,
        role: station.role,
        space: space.id,
        subject: station.opening,
        pose: station.pose === null ? null : { position: station.pose.position, target: station.pose.target },
      });
    }
  }
  // Reflex corners of rooms and zones: the parts the bounding-box corners cannot see.
  const outlines: { id: string; outline: readonly IPlanPoint[]; floor: number }[] = [
    ...house.spaces.map((s) => ({ id: s.id, outline: s.outline, floor: roomLevels(s)[0] })),
    ...house.zones.map((z) => ({ id: z.id, outline: z.outline, floor: z.rampTo === null ? z.anchor.y : Math.min(z.anchor.y, z.rampTo.y) })),
  ];
  for (const { id, outline, floor } of outlines) {
    const space = spaces.get(id);
    if (space === undefined) throw new Error(`observation outline "${id}" has no space in the record`);
    reflexCorners(outline).forEach(({ at, toPrev, toNext }, k) => {
      const a = unit(at, toPrev);
      const b = unit(at, toNext);
      // The inside quadrant around a reflex corner lies opposite the outside one, i.e. against a + b.
      const position = { x: at.x - HALF_PERSON * (a.x + b.x), y: floor + EYE, z: at.z - HALF_PERSON * (a.z + b.z) };
      for (const [side, dir] of [
        ["prev", a],
        ["next", b],
      ] as const)
        accept({
          id: `${id}/reflex-${k}-${side}`,
          role: "reflex-corner",
          space: id,
          subject: null,
          pose: { position, target: { x: position.x + dir.x, y: position.y, z: position.z + dir.z } },
        });
    });
  }
  // Exterior zone thresholds: an envelope opening encloses only its inside space, so the
  // zone it opens on to gets its threshold here, one person half-width beyond the wall.
  for (const zone of house.zones) {
    const ground = (x: number, z: number): number => {
      if (zone.rampTo === null) return zone.anchor.y;
      const d = { x: zone.rampTo.x - zone.anchor.x, z: zone.rampTo.z - zone.anchor.z };
      const s = ((x - zone.anchor.x) * d.x + (z - zone.anchor.z) * d.z) / (d.x * d.x + d.z * d.z);
      return zone.anchor.y + Math.min(1, Math.max(0, s)) * (zone.rampTo.y - zone.anchor.y);
    };
    for (const opening of environment.openings) {
      const host = environment.boundaries.find((b) => b.id === opening.boundary);
      if (host === undefined || host.spaces.length !== 1) continue;
      const pose = threshold(zone.id, opening.id, ground);
      if (pose !== null) accept({ id: `${zone.id}/threshold-${opening.id}`, role: "threshold", space: zone.id, subject: opening.id, pose });
    }
  }
  // Building census questions: exterior camera conditions belong to settings.
  for (const census of builtEnvironmentBuildingCensus(environment)) {
    const question = (role: IHouseObservation["role"], subject: string): IHouseObservation => ({ id: `building/${role}/${subject}`, role, space: null, subject, pose: null });
    observations.push(
      ...census.facades.map((f) => question("facade", f.boundary)),
      ...census.roofs.map((f) => question("roof", f.boundary)),
      ...census.undersides.map((f) => question("underside", f.boundary)),
      ...census.corners.map((c) => question("envelope-corner", c.id)),
      ...census.entrances.map((e) => question("entrance", e)),
    );
  }
  // Roof faces and their undersides are emitted solids, not boundaries: one question each.
  for (const part of house.parts.filter((p) => p.role === "roof"))
    observations.push(
      { id: `building/roof/${part.id}`, role: "roof", space: null, subject: part.id, pose: null },
      { id: `building/underside/${part.id}`, role: "underside", space: null, subject: part.id, pose: null },
    );
  // Reference comparisons (04 reference-spatial-comparisons): which derived questions each reads.
  const ids = new Set(observations.map((o) => o.id));
  const pick = (...wanted: string[]): string[] => wanted.filter((w) => ids.has(w));
  const ofSpace = (space: string, role?: IHouseObservation["role"]): string[] => observations.filter((o) => o.space === space && (role === undefined || o.role === role)).map((o) => o.id);
  const references: IReferenceComparison[] = [
    {
      reference: "01",
      observations: [...observations.filter((o) => o.role === "facade" || o.role === "envelope-corner" || o.role === "entrance").map((o) => o.id), ...ofSpace("front-porch"), ...ofSpace("front-walk")],
      records: ["house", "house-site"],
    },
    { reference: "02", observations: [], records: ["ground-storey", "upper-storey", "main-stair-connection"] },
    {
      reference: "03",
      observations: pick(
        "kitchen-dining-family/center-z-minus",
        "kitchen-dining-family/threshold-garden-door",
        "kitchen-dining-family/threshold-living-common-opening",
        "kitchen-dining-family/threshold-service-common-opening",
        "garden-terrace/threshold-garden-door",
      ),
      records: ["kitchen-dining-family"],
    },
    {
      reference: "04",
      observations: [...ofSpace("front-entry"), ...ofSpace("living-room", "center")],
      records: ["front-entry", "living-room", "main-stair"],
    },
    {
      reference: "05",
      observations: [...ofSpace("upper-hall"), ...ofSpace("main-stair", "threshold"), ...pick("upper-linen-storage/threshold-upper-linen-opening")],
      records: ["upper-hall", "upper-linen-storage"],
    },
  ];
  for (const r of references) if (r.observations.length === 0 && r.reference !== "02") throw new Error(`reference ${r.reference} reads no derived observation`);
  return { observations, failures, references };
};
