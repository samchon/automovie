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
 *   moved inside, and one threshold per opening on its boundaries. Each
 *   accepted eye is then placed 1.6 m above that station's standing floor;
 *   a moved engine pose records the reason (settings `frame-condition`);
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
import {
  builtEnvironmentBuildingCensus,
  builtSpaceContainsPoint,
  builtSpaceObservationStations,
} from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  openingAxis,
  type IHouseObservation,
  type IObservationDerivation,
  type IObservationPose,
  type IReferenceComparison,
} from "./observation-records";
import type { IHouse } from "./house";
import { roomLevels } from "./rooms/shared";
import type { IPlanPoint } from "./solid-records";

/** Eye height above a space's floor (settings frame-condition). */
const EYE = 1.6;
/** Half the 0.60 m person width of the settings use-profile. */
const HALF_PERSON = 0.3;
/** Two poses closer than this in the same space count as one place. */
const SAME_PLACE = 0.05;

const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number => Math.hypot(
  a.x - b.x,
  a.y - b.y,
  a.z - b.z,
);

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
    const position = {
      x: clampInside(wanted.x, cell.x),
      y,
      z: clampInside(wanted.z, cell.z),
    };
    if (!builtSpaceContainsPoint(space, position)) return [];
    return [position];
  });
  // A stair's upper void is inside its semantic volume but has no standing
  // surface. Its actual connector route supplies the camera's foot position.
  const routeCandidates = stairRoute
    .map((foot) => ({ x: foot.x, y: foot.y + EYE, z: foot.z }))
    .filter((position) => builtSpaceContainsPoint(space, position));
  const candidates = space.kind === "stair" && routeCandidates.length > 0
    ? routeCandidates
    : cellCandidates;
  candidates.sort((a, b) =>
    Math.hypot(a.x - wanted.x, a.z - wanted.z) - Math.hypot(b.x - wanted.x, b.z - wanted.z) || a.y - b.y,
  );
  const position = candidates[0];
  if (position === undefined) return null;
  const center = centers
    .filter((observation) => observation.space === space.id && observation.role === "center" && observation.pose !== null)
    .map((observation) => observation.pose!.position)
    .sort((a, b) => distance(a, position) - distance(b, position))[0];
  return {
    position,
    reason: `Boundary corner station moved ${Math.hypot(position.x - wanted.x, position.z - wanted.z).toFixed(3)} m inside ${space.id}.`,
    target: center === undefined
      ? {
          x: (Math.min(...xs) + Math.max(...xs)) / 2,
          y: position.y,
          z: (Math.min(...zs) + Math.max(...zs)) / 2,
        }
      : { x: center.x, y: position.y, z: center.z },
  };
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
 * @evidenceReview spaces/04-observations.md #696e544 `deriveHouseObservations` reads compiled spaces, connectors, openings, and boundaries together with house room, storage, zone, and roof-part records, then returns derived questions and poses without making a second house.
 * @evidence spaces/04-observations.md#spatial-observation-derivation Engine stations, concave corners and building census generate questions and poses from the built records.
 * @evidenceReview spaces/04-observations.md#spatial-observation-derivation #86f0eea The function accepts engine centre, corner, and threshold stations, adds reflex-corner poses from house outlines, and appends building census and roof-part questions from the same compiled house.
 * @evidence spaces/04-observations.md#reference-spatial-comparisons Five reference selections connect derived observation ids to their relevant house, room, storage, and storey records.
 * @evidenceReview spaces/04-observations.md#reference-spatial-comparisons #367a7d1 `references` selects exterior census and porch/walk questions for 01, storey and stair records for 02, common-room questions for 03, entry/living questions for 04, and upper-hall, stair, and linen questions for 05.
 * @evidence spaces/04-observations.md#engine-render-handoff The returned poses are inspection data for later rendering, not camera geometry in the house.
 * @evidenceReview spaces/04-observations.md#engine-render-handoff #330fc4a The function returns poses within `observations` and rejected station ids within `failures`; it creates no camera element or rendering command in the built environment.
 * @evidence principles/core/source-units.md#source-scope-preservation The function derives from the one compiled environment and house record without duplicating their geometry.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The function takes the compiled environment and house as arguments, reads their cell, opening, connector, outline, and level records, and returns observation data rather than another geometry record.
 * @evidence principles/core/source-units.md#source-substantive-completion It returns the station list, explicit failures and all five reference selections.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `accept` records null, outside, and duplicate station poses as failures; the function returns the accepted observations, explicit failures, and exactly five reference selections.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work `spatial-observation-derivation` requires stations and exterior questions from built records, while `reference-spatial-comparisons` assigns five additional comparisons; this function returns the question list and its separate per-reference selections.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Engine stations, reflex corners, census records, and roof parts feed the observation list; the five `references` then point to selected ids and records without replacing that list or requiring a new design boundary.
 */
export const deriveHouseObservations = (environment: IAutoMovieBuiltEnvironment, house: IHouse): IObservationDerivation => {
  const observations: IHouseObservation[] = [];
  const failures: { id: string; cause: string }[] = [];
  const spaces = new Map(environment.spaces.map((s) => [s.id, s]));
  const roomFloors = new Map(house.spaces.map((s) => [s.id, roomLevels(s)[0]]));
  const storageFloors = new Map(
    house.storages.map((s) => [s.storage.id, s.storage.y[0]]),
  );
  const stairRoute = environment.connectors.find((c) => c.id === "main-stair-connection")?.route ?? [];
  const patchFloor = (patch: { anchor: IAutoMovieVector3; rampTo: IAutoMovieVector3 | null }, x: number, z: number): number => {
    if (patch.rampTo === null) return patch.anchor.y;
    const dx = patch.rampTo.x - patch.anchor.x;
    const dz = patch.rampTo.z - patch.anchor.z;
    const t = ((x - patch.anchor.x) * dx + (z - patch.anchor.z) * dz) / (dx * dx + dz * dz);
    return patch.anchor.y + Math.max(0, Math.min(1, t)) * (patch.rampTo.y - patch.anchor.y);
  };
  const standingFloor = (id: string, x: number, z: number): number => {
    const room = roomFloors.get(id);
    if (room !== undefined) return room;
    const storage = storageFloors.get(id);
    if (storage !== undefined) return storage;
    const zone = house.zones.find((s) => s.id === id);
    if (zone !== undefined) {
      if (zone.groundAt !== undefined) return zone.groundAt(x, z);
      const patches = zone.patches ?? [zone];
      const patch = patches.find((p) => {
        const xs = p.outline.map((q) => q.x);
        const zs = p.outline.map((q) => q.z);
        return Math.min(...xs) - 1e-6 <= x && x <= Math.max(...xs) + 1e-6 && Math.min(...zs) - 1e-6 <= z && z <= Math.max(...zs) + 1e-6;
      }) ?? patches[0]!;
      return patchFloor(patch, x, z);
    }
    if (id === "main-stair" && stairRoute.length > 0) {
      let nearest = { distance: Infinity, y: stairRoute[0]!.y };
      for (let i = 1; i < stairRoute.length; ++i) {
        const a = stairRoute[i - 1]!;
        const b = stairRoute[i]!;
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const t = dx * dx + dz * dz === 0
          ? 0
          : Math.max(
              0,
              Math.min(
                1,
                ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz),
              ),
            );
        const distance = Math.hypot(x - a.x - t * dx, z - a.z - t * dz);
        if (distance < nearest.distance) nearest = { distance, y: a.y + t * (b.y - a.y) };
      }
      return nearest.y;
    }
    throw new Error(`observation ${id}: no standing floor`);
  };
  const accept = (o: IHouseObservation): void => {
    const space = o.space === null ? undefined : spaces.get(o.space);
    if (o.pose !== null && o.space !== null) {
      const floor = standingFloor(
        o.space,
        o.pose.position.x,
        o.pose.position.z,
      );
      const expected = floor + EYE;
      const delta = expected - o.pose.position.y;
      if (Math.abs(delta) > 1e-6) o.pose = { position: { ...o.pose.position, y: expected }, target: { ...o.pose.target, y: o.pose.target.y + delta }, reason: [o.pose.reason, `Standing floor ${floor.toFixed(3)} m plus authored 1.60 m eye; engine station moved ${delta.toFixed(3)} m.`].filter(Boolean).join(" ") };
    }
    if (o.pose === null) failures.push({
      id: o.id,
      cause: "no pose inside its space",
    });
    else if (space === undefined || !builtSpaceContainsPoint(space, o.pose.position)) failures.push(
      { id: o.id, cause: `pose leaves space "${o.space}"` },
    );
    else {
      const twin = observations.find(
        (p) => p.space === o.space && p.pose !== null && distance(p.pose.position, o.pose!.position) < SAME_PLACE && distance(p.pose.target, o.pose!.target) < SAME_PLACE,
      );
      if (twin !== undefined) failures.push({
        id: o.id,
        cause: `coincides with "${twin.id}"`,
      });
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
      if (builtSpaceContainsPoint(space, {
        x,
        y: floor(x, z) + 0.01,
        z,
      })) return {
        position,
        target: centre,
        reason: `Boundary threshold station moved ${(reach + HALF_PERSON).toFixed(3)} m from opening ${openingId} into ${spaceId}.`,
      };
    }
    return null;
  };
  // Engine stations of every inhabited or walkable space. Where the engine finds no
  // threshold pose (an opening at an L-shaped room's notch), the same threshold rule
  // is applied on the space's side before the station counts as failed.
  const floorOf = roomFloors;
  for (const space of environment.spaces) {
    if (!["room", "stair", "storage", "exterior"].includes(
      space.kind,
    )) continue;
    for (const station of builtSpaceObservationStations(
      environment,
      space.id,
    )) {
      const floor = floorOf.get(space.id);
      if (station.role === "corner" && station.pose === null) {
        const stairRoute = environment.connectors.find((connector) => connector.landings?.some((landing) => landing.space === space.id))?.route ?? [];
        accept({
          id: `${space.id}/${station.id}`,
          role: "corner",
          space: space.id,
          subject: station.opening,
          pose: insetCorner(space, station.id, floor, observations, stairRoute),
        });
        continue;
      }
      if (station.role === "threshold" && station.pose === null && station.opening !== null && floor !== undefined) {
        accept({
          id: `${space.id}/threshold-${station.opening}`,
          role: "threshold",
          space: space.id,
          subject: station.opening,
          pose: threshold(space.id, station.opening, () => floor),
        });
        continue;
      }
      accept({
        id: `${space.id}/${station.id}`,
        role: station.role,
        space: space.id,
        subject: station.opening,
        pose: station.pose === null
          ? null
          : { position: station.pose.position, target: station.pose.target },
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
    if (space === undefined) throw new Error(
      `observation outline "${id}" has no space in the record`,
    );
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
      const d = {
        x: zone.rampTo.x - zone.anchor.x,
        z: zone.rampTo.z - zone.anchor.z,
      };
      const s = ((x - zone.anchor.x) * d.x + (z - zone.anchor.z) * d.z) / (d.x * d.x + d.z * d.z);
      return zone.anchor.y + Math.min(1, Math.max(0, s)) * (zone.rampTo.y - zone.anchor.y);
    };
    for (const opening of environment.openings) {
      const host = environment.boundaries.find(
        (b) => b.id === opening.boundary,
      );
      if (host === undefined || host.spaces.length !== 1) continue;
      const pose = threshold(zone.id, opening.id, ground);
      if (pose !== null) accept({
        id: `${zone.id}/threshold-${opening.id}`,
        role: "threshold",
        space: zone.id,
        subject: opening.id,
        pose,
      });
    }
  }
  // Building census questions: exterior camera conditions belong to settings.
  for (const census of builtEnvironmentBuildingCensus(environment)) {
    const question = (role: IHouseObservation["role"], subject: string): IHouseObservation => ({
      id: `building/${role}/${subject}`,
      role,
      space: null,
      subject,
      pose: null,
    });
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
      {
        id: `building/roof/${part.id}`,
        role: "roof",
        space: null,
        subject: part.id,
        pose: null,
      },
      {
        id: `building/underside/${part.id}`,
        role: "underside",
        space: null,
        subject: part.id,
        pose: null,
      },
    );
  // Reference comparisons (04 reference-spatial-comparisons): which derived questions each reads.
  const ids = new Set(observations.map((o) => o.id));
  const pick = (...wanted: string[]): string[] => wanted.map((id) => {
    if (!ids.has(id)) throw new Error(`reference observation "${id}" is absent`);
    return id;
  });
  const ofSpace = (space: string, role?: IHouseObservation["role"]): string[] => {
    const selected = observations.filter((o) => o.space === space && (role === undefined || o.role === role)).map((o) => o.id);
    if (selected.length === 0) throw new Error(`reference observations for "${space}"${role === undefined ? "" : ` role "${role}"`} are absent`);
    return selected;
  };
  const references: IReferenceComparison[] = [
    {
      reference: "01",
      observations: [
        ...observations.filter((o) => o.role === "facade" || o.role === "envelope-corner" || o.role === "entrance").map((o) => o.id),
        ...ofSpace("front-porch"),
        ...ofSpace("front-walk"),
      ],
      records: ["house", "house-site"],
    },
    {
      reference: "02",
      observations: [],
      records: ["ground-storey", "upper-storey", "main-stair-connection"],
    },
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
      observations: [
        ...ofSpace("front-entry"),
        ...ofSpace("living-room", "center"),
      ],
      records: ["front-entry", "living-room", "main-stair"],
    },
    {
      reference: "05",
      observations: [
        ...ofSpace("upper-hall"),
        ...ofSpace("main-stair", "threshold"),
        ...pick("upper-linen-storage/threshold-upper-linen-opening"),
      ],
      records: ["upper-hall", "upper-linen-storage"],
    },
  ];
  for (const r of references) if (r.observations.length === 0 && r.reference !== "02") throw new Error(
    `reference ${r.reference} reads no derived observation`,
  );
  return { observations, failures, references };
};
