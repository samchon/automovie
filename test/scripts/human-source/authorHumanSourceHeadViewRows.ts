import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import { HUMAN_SOURCE_EYE_SIDES } from "./HUMAN_SOURCE_EYE_SIDES.ts";
import { HUMAN_SOURCE_ORBIT_FOLLOW_ENDPOINTS } from "./HUMAN_SOURCE_ORBIT_FOLLOW_ENDPOINTS.ts";
import { HUMAN_SOURCE_PART_ROW_EXCLUSIONS } from "./HUMAN_SOURCE_PART_ROW_EXCLUSIONS.ts";
import { roundHalfEven } from "./roundHalfEven.ts";
import type { IHumanSourceEditedEndpoint } from "./structures/IHumanSourceEditedEndpoint.ts";

/** Decimal places of a published endpoint row, in metres. */
const DECIMALS = 6;
/** Cage rows that lie on the orbit rather than on the mobile lid. */
const ORBIT_ROLES = ["preseptal", "outerAttachment"];

/**
 * Author the two endpoint row corrections of the published head view, in
 * place, and return what was edited.
 *
 * First, each registered exclusion removes an attached part's rows of one
 * endpoint (`HUMAN_SOURCE_PART_ROW_EXCLUSIONS`). Second, each orbit-carrying
 * endpoint (`HUMAN_SOURCE_ORBIT_FOLLOW_ENDPOINTS`) makes the globe follow its
 * eye. The globe is a rigid part and follows one translation, the way the
 * endpoints that already carry it do. Where the endpoint already moves the
 * eye's centre landmark, that landmark is the pivot's authority and the globe
 * takes its translation; the landmarks are left as they are. Where it does
 * not, the translation is the one the orbit itself makes: the mean of the
 * endpoint's skin rows over the cage's preseptal and outer attachment
 * vertices of that eye, a vertex without a row counting as zero. The centre
 * landmark receives it too, and the gaze target landmark unless the endpoint
 * already moves that one. An eye whose orbit the endpoint does not move at
 * published precision receives no row. An endpoint that already carries the
 * globe is refused, because this stage adds a missing carriage and corrects
 * no existing one.
 *
 * It must run before the optical support is witnessed, which reads the globe
 * rows this stage leaves.
 *
 * One definition is consumed. A person is built from the head and body views
 * (the viewer, the playground and the anatomical assembly all read
 * `head.json.gz` and `body.json.gz`), and every place that splits views calls
 * this stage right after the split: the generation compiler and the P1
 * admission. `p1-face-basis.json.gz` is the pair before view authoring, kept
 * to reproduce and compare the carried rows against the published basis; no
 * consumer builds a person from it directly, and `edit-receipt.json` lists
 * every row in which the views differ from it.
 */
export function authorHumanSourceHeadViewRows(
  face: IAutoMovieHumanFaceBasis,
): IHumanSourceEditedEndpoint[] {
  const edits: IHumanSourceEditedEndpoint[] = [];
  const surfaceOf = (
    id: string,
  ): IAutoMovieHumanFaceBasis["surfaces"][number] => {
    const surface = face.surfaces.find((entry) => entry.id === id);
    if (surface === undefined)
      throw new Error(`Head view rows: the face has no ${id} surface.`);
    return surface;
  };
  const rowVertices = (rows: readonly number[]): number[] =>
    rows.filter((_, at) => at % 4 === 0);
  for (const exclusion of HUMAN_SOURCE_PART_ROW_EXCLUSIONS) {
    const surface = surfaceOf(exclusion.surface);
    const rows = surface.targets[exclusion.endpoint];
    if (rows === undefined)
      throw new Error(
        `Head view rows: ${exclusion.surface} has no rows of ${exclusion.endpoint} to exclude.`,
      );
    delete surface.targets[exclusion.endpoint];
    edits.push({
      view: "head",
      surface: exclusion.surface,
      endpoint: exclusion.endpoint,
      vertices: rowVertices(rows),
    });
  }
  if (face.landmarks === undefined || face.periocular === undefined)
    throw new Error(
      "Head view rows: the face has no landmarks or periocular registration.",
    );
  // The landmark table is shared with the unedited P1 pair; this view owns a copy.
  const landmarks = {
    ...face.landmarks,
    targets: { ...face.landmarks.targets },
  };
  face.landmarks = landmarks;
  const skin = face.surfaces[0],
    globe = surfaceOf("Human.low-poly");
  for (const endpoint of HUMAN_SOURCE_ORBIT_FOLLOW_ENDPOINTS) {
    const rows = skin.targets[endpoint];
    if (rows === undefined)
      throw new Error(
        `Head view rows: the skin has no rows of orbit endpoint ${endpoint}.`,
      );
    if (globe.targets[endpoint] !== undefined)
      throw new Error(`Head view rows: ${endpoint} already carries the globe.`);
    const delta = new Map<number, number>();
    for (let at = 0; at < rows.length; at += 4) delta.set(rows[at], at);
    const before = landmarks.targets[endpoint] ?? [];
    const pivotRow = new Map<number, number>();
    for (let at = 0; at < before.length; at += 4) pivotRow.set(before[at], at);
    const globeRows: number[][] = [],
      landmarkRows: number[][] = [];
    for (const side of HUMAN_SOURCE_EYE_SIDES) {
      const centre = landmarks.ids.indexOf(side.center),
        target = landmarks.ids.indexOf(side.target);
      if (centre < 0 || target < 0)
        throw new Error(
          `Head view rows: the face lacks the ${side.side} eye pivot landmarks.`,
        );
      const carried = pivotRow.get(centre);
      let translation: number[];
      if (carried !== undefined)
        translation = before.slice(carried + 1, carried + 4);
      else {
        const cage = face.periocular[side.side].cage;
        if (cage === undefined)
          throw new Error(`Head view rows: the ${side.side} eye has no cage.`);
        const orbit = cage.stations
          .filter((station) => ORBIT_ROLES.includes(station.role))
          .flatMap((station) => station.vertices);
        if (orbit.length === 0)
          throw new Error(
            `Head view rows: the ${side.side} cage has no orbit rows.`,
          );
        translation = [0, 1, 2].map((axis) => {
          let sum = 0;
          for (const vertex of orbit) {
            const at = delta.get(vertex);
            if (at !== undefined) sum += rows[at + 1 + axis];
          }
          return roundHalfEven(sum / orbit.length, DECIMALS);
        });
        if (translation.every((value) => value === 0)) continue;
        landmarkRows.push([centre, ...translation]);
        if (!pivotRow.has(target)) landmarkRows.push([target, ...translation]);
      }
      const attachment = (globe.attachments ?? []).find(
        (entry) => entry.owner === side.owner,
      );
      if (attachment === undefined)
        throw new Error(
          `Head view rows: the globe has no ${side.owner} attachment.`,
        );
      for (let at = 0; at < attachment.rows.length; at += 2)
        globeRows.push([attachment.rows[at], ...translation]);
    }
    if (globeRows.length === 0) continue;
    const ascending = (list: number[][]): number[] =>
      list.sort((a, b) => a[0] - b[0]).flat();
    globe.targets[endpoint] = ascending(globeRows);
    edits.push({
      view: "head",
      surface: globe.id,
      endpoint,
      vertices: rowVertices(globe.targets[endpoint]),
    });
    if (landmarkRows.length === 0) continue;
    const kept: number[][] = [];
    for (let at = 0; at < before.length; at += 4)
      kept.push(before.slice(at, at + 4));
    landmarks.targets[endpoint] = ascending([...kept, ...landmarkRows]);
    edits.push({
      view: "head",
      surface: "landmarks",
      endpoint,
      vertices: landmarkRows.map((row) => row[0]).sort((a, b) => a - b),
    });
  }
  return edits;
}
