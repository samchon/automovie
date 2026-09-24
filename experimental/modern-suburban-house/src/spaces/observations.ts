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
import type { IAutoMovieBuiltEnvironment, IAutoMovieVector3 } from "@automovie/interface";

import { openingAxis } from "./environment";
import type { IHouse } from "./house";
import { roomLevels } from "./rooms/shared";
import type { IPlanPoint } from "./solids";

/** A camera pose inside its own space: where the eye is and what it looks at. */
export interface IObservationPose {
  position: IAutoMovieVector3;
  target: IAutoMovieVector3;
}

/** One derived spatial question. */
export interface IHouseObservation {
  /** Stable id: `<space>/<station>` for stations, `building/<role>/<subject>` for census questions. */
  id: string;
  role: "center" | "corner" | "threshold" | "reflex-corner" | "facade" | "roof" | "underside" | "envelope-corner" | "entrance";
  /** The space the pose stands in; null for exterior census questions. */
  space: string | null;
  /** The opening, boundary or corner the question is about, when there is one. */
  subject: string | null;
  /** Self-space pose; null only for census questions, whose camera settings owns. */
  pose: IObservationPose | null;
}

/** What one reference comparison reads (04 reference-spatial-comparisons). */
export interface IReferenceComparison {
  reference: "01" | "02" | "03" | "04" | "05";
  /** Observation ids the comparison reads; every id is in `observations`. */
  observations: string[];
  /** Records the comparison reads without a pose of its own (storeys for the cutaway). */
  records: string[];
}

/** The derivation result. */
export interface IObservationDerivation {
  observations: IHouseObservation[];
  failures: { id: string; cause: string }[];
  references: IReferenceComparison[];
}

/** Eye height above a space's floor (settings frame-condition). */
const EYE = 1.6;
/** Half the 0.60 m person width of the settings use-profile. */
const HALF_PERSON = 0.3;
/** Two poses closer than this in the same space count as one place. */
const SAME_PLACE = 0.05;

const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

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

/** Derive every spatial question and self-space pose of the house. */
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
