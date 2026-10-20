import {
  AutoMovieDrawingScheduleSubject,
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  IAutoMovieConnectorLanding,
  IAutoMovieConnectorSection,
  IAutoMovieDrawingConnectorPlace,
  IAutoMovieDrawingGap,
  IAutoMovieDrawingOpeningPlace,
  IAutoMovieDrawingSchedule,
  IAutoMovieDrawingScheduleBox,
  IAutoMovieDrawingSchedulePlace,
  IAutoMovieDrawingScheduleRow,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

import { builtEnvironmentAdjacentSpaces } from "../architecture/builtEnvironmentAdjacentSpaces";
import { builtEnvironmentBuildingOfSpace } from "../architecture/builtEnvironmentBuildingOfSpace";
import { builtEnvironmentSpaceConnectors } from "../architecture/builtEnvironmentSpaceConnectors";
import { builtEnvironmentSpaceContentBounds } from "../architecture/builtEnvironmentSpaceContentBounds";
import { builtEnvironmentSpaceFidelity } from "../architecture/builtEnvironmentSpaceFidelity";
import { builtEnvironmentSpaceNodes } from "../architecture/builtEnvironmentSpaceNodes";
import { validateBuiltEnvironment } from "../architecture/validateBuiltEnvironment";
import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { compareAutoMovieRenderIds } from "../render/compareAutoMovieRenderIds";
import { canonicalizeAutoMovieJson } from "../text/canonicalizeAutoMovieJson";
import { IAutoMovieDrawingDesignIndex } from "./IAutoMovieDrawingDesignIndex";
import { autoMovieDrawingRange } from "./autoMovieDrawingRange";
import { autoMovieDrawingSpaceBox } from "./autoMovieDrawingSpaceBox";
import { autoMovieOpeningFillExtent } from "./autoMovieOpeningFillExtent";
import { autoMovieOpeningNominalExtent } from "./autoMovieOpeningNominalExtent";
import { AUTOMOVIE_DRAWING_SCHEDULE_MAX_MEMBERS } from "./constants/AUTOMOVIE_DRAWING_SCHEDULE_MAX_MEMBERS";
import { indexAutoMovieDrawingDesign } from "./indexAutoMovieDrawingDesign";
import { roundAutoMovieDrawingScalar } from "./roundAutoMovieDrawingScalar";
import { roundAutoMovieDrawingVector } from "./roundAutoMovieDrawingVector";

/** One scheduled thing, reduced to what decides its row. */
interface IOccurrence {
  id: string;
  kind: string;
  model: string | null;
  width: number | null;
  height: number | null;
  basis: IAutoMovieDrawingScheduleRow["basis"];
  place: IAutoMovieDrawingSchedulePlace;
}

/**
 * Schedule every declared space, opening or connector of one design.
 *
 * Throws an `Error` naming the first violation when the design fails `validateBuiltEnvironment`. The schedule and the drawing are two readings of one graph: rows come from the design's own records, so `total` is the number of spaces, openings or connectors it declares, and the row counts sum to it by construction.
 *
 * Openings and connectors are grouped into type rows by kind, model, nominal size and basis; a room is its own row, because two alike rooms are still two rooms to visit. Rows are ordered by kind, model, size, basis and first member, and marked `<kind>-NN` in that order. A row names at most {@link AUTOMOVIE_DRAWING_SCHEDULE_MAX_MEMBERS} members and counts the rest.
 *
 * An opening's size comes from its authored void or its fill's world extent, labelled fill because the leaf is not the hole; with neither source its sizes remain null and unmeasured. A connector uses its narrowest and lowest declared section. Room rows carry declared-volume and measured-content boxes plus graph relations. A grouped opening/connector row keeps the first sorted occurrence's place, so that location does not describe every member; missing schedule content is stated in gaps.
 *
 * The digest is SHA-256 over the canonical JSON of every other field.
 *
 * This function takes no drawing view and applies no view space or element-kind filter. A space row also includes semantic or unlocated containers, so the whole-design total need not equal the visible members of a filtered drawing. The member-name limit bounds each returned row's named prefix, while occurrences and grouping still process the full selected subject population.
 *
 * @param props.environment Design the schedule is derived from.
 * @param props.subject What to schedule.
 * @returns The schedule record.
 *
 * @evidence contracts/common.md#principled-implementation Groups occurrences by a JSON-encoded type key and orders rows by a total comparator ending in identity, so the result does not depend on declaration order; sizes come from the shared opening rule, the declared-box rule and the connector sections, and the digest is SHA-256 of `canonicalizeAutoMovieJson`, a deterministic encoding of the record's JSON payload, without a hash-injectivity guarantee.
 * @evidence contracts/common.md#clear-and-simple-design One derivation per subject feeding one grouping and marking pass; room membership, contents, adjacency, connection and fidelity are the architecture queries rather than re-implementations, and box and size rules live in shared helpers the drawing also reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No design, kind or id shape is special-cased; membership comes from declarations, never from id prefixes, an unmeasurable occurrence is `unmeasured` rather than zero, and each subject's undelivered content is a declared gap.
 * @evidence contracts/common.md#meaningful-documentation The comment states the refusal, the total's meaning, grouping and row identity, order and marks, the member bound, each subject's sizing and basis, the room row's location and two boxes, the gap policy and the digest's coverage.
 * @evidence contracts/performance.md#efficient-algorithms Full environment validation precedes derivation. Opening/connector scans include profile edges, placed fill triangles or section samples; each room invokes graph/bounds queries whose repeated scans scale with spaces times design size. Every bucket and its member ids are sorted before prefix truncation, as are rows, so ordering costs O(N log N) overall in occurrences, plus encoded text and canonical key sorts.
 * @evidence contracts/performance.md#reuse-equivalent-work The opening subject builds one design index that shares id lookups, world matrices and part tessellations across opening rows. Room queries keep their own request-local work and connector rows need no index; no cross-call cache can conceal a mutable environment edit.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The index, occurrences and grouping map are owned by the call and released on return, bounded by the design's size; only the returned schedule, owned by the caller, survives.
 */
export const deriveAutoMovieDrawingSchedule: (props: {
  environment: IAutoMovieBuiltEnvironment;
  subject: AutoMovieDrawingScheduleSubject;
}) => IAutoMovieDrawingSchedule = (props: {
  /** Design the schedule is derived from. */
  environment: IAutoMovieBuiltEnvironment;

  /** What to count. */
  subject: AutoMovieDrawingScheduleSubject;
}): IAutoMovieDrawingSchedule => {
  const {
    environment,
    subject,
  }: {
    environment: IAutoMovieBuiltEnvironment;
    subject: AutoMovieDrawingScheduleSubject;
  } = props;
  const validated: ReturnType<typeof validateBuiltEnvironment> =
    validateBuiltEnvironment({ environment });
  if (validated.success === false) {
    const first: (typeof validated.violations)[number] =
      validated.violations[0]!;
    throw new Error(
      `built environment "${environment.id}" is invalid at ${first.path}: ${first.expected}`,
    );
  }
  const occurrences: IOccurrence[] =
    subject === "space"
      ? spaceOccurrences(environment)
      : subject === "opening"
        ? openingOccurrences(environment)
        : connectorOccurrences(environment);

  const grouped: Map<string, IOccurrence[]> = new Map();
  for (const occurrence of occurrences) {
    const key: string =
      subject === "space"
        ? occurrence.id
        : JSON.stringify([
            occurrence.kind,
            occurrence.model,
            occurrence.width,
            occurrence.height,
            occurrence.basis,
          ]);
    const bucket: IOccurrence[] | undefined = grouped.get(key);
    if (bucket === undefined) grouped.set(key, [occurrence]);
    else bucket.push(occurrence);
  }
  const marks: Map<string, number> = new Map();
  const rows: IAutoMovieDrawingScheduleRow[] = [...grouped.values()]
    .map((bucket: IOccurrence[]): IOccurrence[] =>
      bucket.sort(compareOccurrences),
    )
    .sort((left: IOccurrence[], right: IOccurrence[]): number =>
      compareOccurrences(left[0]!, right[0]!),
    )
    .map((bucket: IOccurrence[]): IAutoMovieDrawingScheduleRow => {
      const head: IOccurrence = bucket[0]!;
      const ordinal: number = (marks.get(head.kind) ?? 0) + 1;
      marks.set(head.kind, ordinal);
      const members: string[] = bucket
        .map((occurrence: IOccurrence): string => occurrence.id)
        .sort(compareAutoMovieRenderIds);
      return {
        mark: `${head.kind}-${String(ordinal).padStart(2, "0")}`,
        kind: head.kind,
        model: head.model,
        width: head.width,
        height: head.height,
        count: bucket.length,
        members: members.slice(0, AUTOMOVIE_DRAWING_SCHEDULE_MAX_MEMBERS),
        omittedMembers: Math.max(
          0,
          members.length - AUTOMOVIE_DRAWING_SCHEDULE_MAX_MEMBERS,
        ),
        basis: head.basis,
        place: head.place,
      };
    });

  const gaps: IAutoMovieDrawingGap[] = scheduleGaps(subject, rows);
  const schedule: Omit<IAutoMovieDrawingSchedule, "digest"> = {
    version: 1,
    protocol: "automovie.drawing-schedule.v1",
    environment: environment.id,
    subject,
    rows,
    total: occurrences.length,
    gaps,
  };
  return {
    ...schedule,
    digest: autoMovieRenderDigest(canonicalizeAutoMovieJson(schedule)),
  };
};

/**
 * Count every occurrence represented by unmeasured rows and append that geometry gap beside the subject's fixed undelivered-content gaps, ordered by subject. Row counts preserve grouped populations rather than counting only named prefixes.
 *
 * O(R) row work includes a temporary filtered subset, followed by a fixed-size gap sort. The caller owns the returned gap records and no result is cached.
 */
const scheduleGaps: (
  subject: AutoMovieDrawingScheduleSubject,
  rows: readonly IAutoMovieDrawingScheduleRow[],
) => IAutoMovieDrawingGap[] = (
  subject: AutoMovieDrawingScheduleSubject,
  rows: readonly IAutoMovieDrawingScheduleRow[],
): IAutoMovieDrawingGap[] => {
  const gaps: IAutoMovieDrawingGap[] = [];
  const unmeasured: number = rows
    .filter(
      (row: IAutoMovieDrawingScheduleRow): boolean =>
        row.basis === "unmeasured",
    )
    .reduce(
      (sum: number, row: IAutoMovieDrawingScheduleRow): number =>
        sum + row.count,
      0,
    );
  // Only an opening or a space can be unmeasured: a connector must state its
  // section before the design validates at all.
  if (unmeasured !== 0)
    gaps.push({
      subject: `${subject}-geometry`,
      status: "not-run",
      reason:
        subject === "space"
          ? `${unmeasured} space(s) state no volume this schedule can bound as a box, so their nominal size is absent rather than zero`
          : `${unmeasured} ${subject}(s) have no geometry to measure, so their nominal size is absent rather than zero`,
      remedy:
        subject === "space"
          ? "state the space's volume as axis-aligned cells or as a closed shell; a purely semantic container legitimately has none, and its contents are measured either way"
          : "author the opening's profile on a boundary that carries a face, or give it a filling element with geometry",
    });
  if (subject === "space")
    gaps.push(
      {
        subject: "space-fit-out",
        status: "unsupported",
        reason:
          "finish, furniture, fixture, equipment, light and service terminal are not scheduled subjects yet, so a room row states its identity, extent, contents and relations only",
        remedy:
          "schedule those subjects once the design carries them; do not read an absent finish row as an unfinished room",
      },
      {
        // What encloses a room, as opposed to what stands in it. A boundary's
        // kind is an open label, so the remedy names the query that answers
        // the question instead of scanning kinds for a fixed word.
        subject: "space-enclosure",
        status: "unsupported",
        reason:
          "a room row states what stands in the space and what it connects to, and nothing about the boundaries that enclose it, so a room bounded by nothing reads exactly like a room whose bounding surfaces are owned by its storey",
        remedy:
          "ask `builtEnvironmentSpaceBoundaries` for the boundaries a space is named on and read their kind and realizing elements; do not read an absent enclosure row as an unenclosed room, and do not scan the kind for a fixed word, because it is an open label",
      },
    );
  else if (subject === "opening")
    gaps.push({
      subject: "opening-performance",
      status: "unsupported",
      reason:
        "the design carries no fill operation, hardware, fire rating or acoustic rating, so the schedule reports type, size and count only",
      remedy:
        "author the opening's operable state and rated properties, then re-derive the schedule",
    });
  else
    gaps.push({
      subject: "traversal-performance",
      status: "unsupported",
      reason:
        "a connector's geometry is scheduled, but passability, reachability, route finding and egress performance are a later stage and were not computed",
      remedy:
        "run a traversal analysis once one exists; do not read a scheduled stair as a stair somebody can climb",
    });
  return gaps.sort(
    (left: IAutoMovieDrawingGap, right: IAutoMovieDrawingGap): number =>
      compareAutoMovieRenderIds(left.subject, right.subject),
  );
};

/**
 * Build one occurrence per declared space using its shell/axis-cell box, world Y height and wider X/Z width; unboxable volumes remain null while content bounds and graph relations still resolve. Semantic containers remain schedule members.
 *
 * Architecture queries scan the current environment per space, including measured model geometry; only named contents are capped. Borrowed design data is unchanged and returned occurrences own their temporary relation lists.
 */
const spaceOccurrences: (
  environment: IAutoMovieBuiltEnvironment,
) => IOccurrence[] = (environment: IAutoMovieBuiltEnvironment): IOccurrence[] =>
  environment.spaces.map((space: IAutoMovieBuiltSpace): IOccurrence => {
    const declared: IAutoMovieDrawingScheduleBox | null =
      autoMovieDrawingSpaceBox(space);
    const nodes: string[] = builtEnvironmentSpaceNodes(
      environment,
      space.id,
    ).sort(compareAutoMovieRenderIds);
    const content: IAutoMovieSubjectBox | null =
      builtEnvironmentSpaceContentBounds(environment, space.id);
    const extent: { width: number | null; height: number | null } =
      declared === null
        ? { width: null, height: null }
        : autoMovieOpeningFillExtent([declared.min, declared.max]);
    return {
      id: space.id,
      kind: space.kind,
      model: null,
      width: extent.width,
      height: extent.height,
      basis: declared === null ? "unmeasured" : "profile",
      place: {
        kind: "space",
        building: builtEnvironmentBuildingOfSpace(environment, space.id),
        parent: space.parent,
        declared,
        content:
          content === null
            ? null
            : {
                min: roundAutoMovieDrawingVector(content.min),
                max: roundAutoMovieDrawingVector(content.max),
              },
        fidelity: builtEnvironmentSpaceFidelity(environment, space.id),
        contents: nodes.slice(0, AUTOMOVIE_DRAWING_SCHEDULE_MAX_MEMBERS),
        omittedContents: Math.max(
          0,
          nodes.length - AUTOMOVIE_DRAWING_SCHEDULE_MAX_MEMBERS,
        ),
        adjacent: builtEnvironmentAdjacentSpaces(environment, space.id).sort(
          compareAutoMovieRenderIds,
        ),
        connectors: builtEnvironmentSpaceConnectors(environment, space.id)
          .map((connector: IAutoMovieBuiltConnector): string => connector.id)
          .sort(compareAutoMovieRenderIds),
      },
    };
  });

/**
 * Prefer the opening's void hull extent, otherwise its placed fill extent, keeping the profile/fill/unmeasured basis and host boundary location. Validated boundary/fill references are premises; this measures nominal world extents rather than leaf-local manufacturing dimensions.
 *
 * One design index shares lookup, staging and part tessellation across the O(O) opening walk; per-occurrence placed geometry remains work, and the index releases with this call while occurrences pass to grouping.
 */
const openingOccurrences: (
  environment: IAutoMovieBuiltEnvironment,
) => IOccurrence[] = (
  environment: IAutoMovieBuiltEnvironment,
): IOccurrence[] => {
  const design: IAutoMovieDrawingDesignIndex =
    indexAutoMovieDrawingDesign(environment);
  return environment.openings.map(
    (opening: IAutoMovieBuiltEnvironment["openings"][number]): IOccurrence => {
      const element: IAutoMovieBuiltElement | undefined =
        opening.fill === null ? undefined : design.elements.get(opening.fill);
      const extent: {
        basis: "profile" | "fill";
        width: number;
        height: number;
      } | null = autoMovieOpeningNominalExtent(design, opening);
      return {
        id: opening.id,
        kind: opening.kind,
        model: element?.model ?? null,
        width: extent?.width ?? null,
        height: extent?.height ?? null,
        basis: extent?.basis ?? "unmeasured",
        place: openingPlace(
          environment,
          design.boundaries.get(opening.boundary)!,
        ),
      };
    },
  );
};

/**
 * Use the admitted constant width/clearHeight pair when present, otherwise minimum sampled section values, rounded onto the drawing grid. This declared-section reading is a nominal size, not a traversal or clearance solve.
 *
 * Scan each connector and its stated sections once, borrowing the design and returning fresh occurrence/place records without a persistent index.
 */
const connectorOccurrences: (
  environment: IAutoMovieBuiltEnvironment,
) => IOccurrence[] = (environment: IAutoMovieBuiltEnvironment): IOccurrence[] =>
  environment.connectors.map(
    (connector: IAutoMovieBuiltConnector): IOccurrence => {
      // Validation refuses a connector stating neither the constant pair nor
      // the sampled sections, so one of the two is always present.
      const constant: boolean =
        connector.width !== undefined && connector.clearHeight !== undefined;
      return {
        id: connector.id,
        kind: connector.kind,
        model: null,
        width: roundAutoMovieDrawingScalar(
          constant
            ? connector.width!
            : autoMovieDrawingRange(
                connector.sections!.map(
                  (section: IAutoMovieConnectorSection): number =>
                    section.width,
                ),
              ).min,
        ),
        height: roundAutoMovieDrawingScalar(
          constant
            ? connector.clearHeight!
            : autoMovieDrawingRange(
                connector.sections!.map(
                  (section: IAutoMovieConnectorSection): number =>
                    section.clearHeight,
                ),
              ).min,
        ),
        basis: "profile",
        place: connectorPlace(environment, connector),
      };
    },
  );

/** Sort the validated host boundary's space ids and report its building only when every side belongs to one unit. Sorting costs O(S log S) plus each building query; the returned space list is a copy and no boundary or location is cached. */
const openingPlace: (
  environment: IAutoMovieBuiltEnvironment,
  boundary: IAutoMovieBuiltBoundary,
) => IAutoMovieDrawingOpeningPlace = (
  environment: IAutoMovieBuiltEnvironment,
  boundary: IAutoMovieBuiltBoundary,
): IAutoMovieDrawingOpeningPlace => {
  const separates: string[] = [...boundary.spaces].sort(
    compareAutoMovieRenderIds,
  );
  return {
    kind: "opening",
    building: buildingOfAny(environment, separates),
    boundary: boundary.id,
    separates,
  };
};

/**
 * Where a connector is: every region its declared stops stand in, ends and landings alike, the rule `builtEnvironmentSpaceConnectors` follows from the other direction.
 *
 * Deduplicate from/landing/to space ids and sort them before the shared-building query. Work is stop sorting plus the building lookups; the caller owns the new stop list and place record, with no retained connector state.
 */
const connectorPlace: (
  environment: IAutoMovieBuiltEnvironment,
  connector: IAutoMovieBuiltConnector,
) => IAutoMovieDrawingConnectorPlace = (
  environment: IAutoMovieBuiltEnvironment,
  connector: IAutoMovieBuiltConnector,
): IAutoMovieDrawingConnectorPlace => {
  const stops: string[] = [
    ...new Set([
      connector.from,
      ...(connector.landings ?? []).map(
        (landing: IAutoMovieConnectorLanding): string => landing.space,
      ),
      connector.to,
    ]),
  ].sort(compareAutoMovieRenderIds);
  return {
    kind: "connector",
    building: buildingOfAny(environment, stops),
    stops,
  };
};

/**
 * The one building unit a set of validated regions belongs to, or `null` when the set is empty or two regions belong to different units: a passage between two buildings belongs to neither alone.
 *
 * Query every space through the architecture owner and collect distinct returned units, so graph membership rather than id spelling decides. Work is the sum of those graph queries with O(S) temporary strings; no result is cached across mutable designs.
 */
const buildingOfAny: (
  environment: IAutoMovieBuiltEnvironment,
  spaces: readonly string[],
) => string | null = (
  environment: IAutoMovieBuiltEnvironment,
  spaces: readonly string[],
): string | null => {
  const units: Set<string> = new Set(
    spaces.map((space: string): string =>
      builtEnvironmentBuildingOfSpace(environment, space),
    ),
  );
  return units.size === 1 ? [...units][0]! : null;
};

/**
 * Order two occurrences by what a reader sorts a schedule on, identity last.
 *
 * The identity tiebreak decides the member order within a type row and the order of two alike rooms, so neither depends on declaration order.
 *
 * Compare kind, stringified model, optional width/height, basis and id using shared ordinal text order. Finite admitted measurements are a premise; this constant-field comparator allocates no retained state and never mutates occurrences.
 */
const compareOccurrences: (left: IOccurrence, right: IOccurrence) => number = (
  left: IOccurrence,
  right: IOccurrence,
): number =>
  compareAutoMovieRenderIds(left.kind, right.kind) ||
  compareAutoMovieRenderIds(String(left.model), String(right.model)) ||
  compareNullable(left.width, right.width) ||
  compareNullable(left.height, right.height) ||
  compareAutoMovieRenderIds(left.basis, right.basis) ||
  compareAutoMovieRenderIds(left.id, right.id);

/** Order null before finite measurements, otherwise subtract the numeric values; equal values compare as zero. The admitted finite-size premise keeps sorting meaningful, and this constant-work predicate retains no state. */
const compareNullable: (left: number | null, right: number | null) => number = (
  left: number | null,
  right: number | null,
): number =>
  left === right ? 0 : left === null ? -1 : right === null ? 1 : left - right;
