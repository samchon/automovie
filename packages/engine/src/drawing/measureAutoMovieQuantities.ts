import {
  AutoMovieQuantityBasis,
  AutoMovieQuantitySubject,
  AutoMovieQuantityUnit,
  IAutoMovieBuiltEnvironment,
  IAutoMovieDrawingGap,
  IAutoMovieQuantityContributor,
  IAutoMovieQuantityFinding,
  IAutoMovieQuantityReport,
} from "@automovie/interface";

import { builtSpaceShellVolume } from "../architecture/builtSpaceShellVolume";
import { validateBuiltEnvironment } from "../architecture/validateBuiltEnvironment";
import { Vector3 } from "../math/Vector3";
import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { compareAutoMovieRenderIds } from "../render/compareAutoMovieRenderIds";
import { footprintArea } from "../space/footprintArea";
import { surfaceFootprint } from "../space/surfaceFootprint";
import { canonicalizeAutoMovieJson } from "../text/canonicalizeAutoMovieJson";
import { autoMovieDrawingCellVolume } from "./autoMovieDrawingCellVolume";
import { autoMovieOpeningArea } from "./autoMovieOpeningArea";
import { AUTOMOVIE_QUANTITY_CELL_UNION_APPROXIMATION } from "./constants/AUTOMOVIE_QUANTITY_CELL_UNION_APPROXIMATION";
import { AUTOMOVIE_QUANTITY_MAX_CONTRIBUTORS } from "./constants/AUTOMOVIE_QUANTITY_MAX_CONTRIBUTORS";
import { AUTOMOVIE_QUANTITY_SUBJECTS } from "./constants/AUTOMOVIE_QUANTITY_SUBJECTS";
import { roundAutoMovieDrawingScalar } from "./roundAutoMovieDrawingScalar";

/** The unit each subject is measured in; the mapped type covers every subject. */
const UNITS: { [subject in AutoMovieQuantitySubject]: AutoMovieQuantityUnit } =
  {
    "space-floor-area": "m2",
    "space-volume": "m3",
    "opening-area": "m2",
    "connector-length": "m",
    "element-count": "count",
    "opening-count": "count",
    "model-occurrence-count": "count",
  };

/** Statements every report carries about take-offs it never performs. */
const FIXED_GAPS: readonly IAutoMovieDrawingGap[] = [
  {
    subject: "material-quantity",
    status: "unsupported",
    reason:
      "a material assembly is a separate record from the built environment and this measurement is handed only the environment, so no layer thickness or application area is in reach and no volume or mass of any material can be taken off",
    remedy:
      "extend the measurement to accept the work's material assemblies; a surface material alone cannot produce a take-off",
  },
  {
    subject: "pattern-cut-waste",
    status: "unsupported",
    reason:
      "cut waste is a property of a module layout over a bounded area, and a surface pattern is a separate record this measurement is not handed",
    remedy:
      "extend the measurement to accept the work's surface patterns, then count the offcuts each bounded area produces",
  },
  {
    subject: "opening-deduction",
    status: "unsupported",
    reason:
      "an opening's own area is measured, but nothing deducts it from the boundary or finish it is cut through, because no boundary or finish area is measured yet",
    remedy:
      "measure boundary and finish areas, then subtract the openings each one hosts",
  },
  {
    subject: "developed-surface-area",
    status: "unsupported",
    reason:
      "floor areas are plan footprint areas; the developed area of a sloped, ramped or relief patch is larger and was not computed",
    remedy:
      "integrate the surface's own height rule over its footprint once a developed-area measure exists",
  },
  {
    subject: "surface-identity",
    status: "unsupported",
    reason:
      "a support patch is attributed to its logical space, not to itself: the design binds a surface to a space without a work-unique id for the binding, so two patches of one space cannot be told apart in a take-off",
    remedy:
      "give the space-to-surface binding its own stable id, then attribute floor area per patch",
  },
];

/**
 * Measure everything the design can answer for, and name everything it cannot.
 *
 * Throws an `Error` when `maxContributors` is not a positive safe integer or
 * the design fails `validateBuiltEnvironment`. Every number is arithmetic over
 * authored geometry: a support surface's plan footprint area with holes
 * subtracted, attributed to its space; a space's volume as its shell's exact
 * volume or the sum of its cells' volumes; an opening void's exact area with
 * arcs; a connector route's polyline length; and counts of elements by kind,
 * openings by kind and model occurrences by model. Nothing is looked up,
 * defaulted or carried over from a previous revision.
 *
 * Every subject in {@link AUTOMOVIE_QUANTITY_SUBJECTS} gets one finding, so an
 * absent quantity is a stated zero rather than a missing row. A finding names
 * its largest owners up to the bound, counts and sums the rest, and says
 * whether its total is exact; the space-volume total is approximate because
 * overlapping cells are summed. What cannot be measured is a gap. The digest
 * is SHA-256 over the canonical JSON of every other field.
 *
 * @param props.environment Design the quantities are measured from.
 * @param props.maxContributors Owners named per finding; defaults to
 *   {@link AUTOMOVIE_QUANTITY_MAX_CONTRIBUTORS}.
 * @returns The quantity report.
 *
 * @evidence contracts/common.md#principled-implementation Shoelace footprint areas, the divergence-theorem shell volume, the cone decomposition of convex cells, closed-form arc segments and polyline lengths, each exact for its stated geometry; the stated approximation is that cell volumes are summed rather than unioned, carried on the finding, and the digest is SHA-256 of `canonicalizeAutoMovieJson`, an injective encoding of the record.
 * @evidence contracts/common.md#clear-and-simple-design One pass per record list fills one owner tally per subject, and one bounded-finding step turns every tally into a finding, so adding a subject means one unit and one tally source.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No design or owner is special-cased; an unbounded cell or a void-less opening is counted into a declared gap rather than measured as zero silently, and the fixed gaps state take-offs this derivation is never handed the records for.
 * @evidence contracts/common.md#meaningful-documentation The comment states both refusals, every measured quantity and its owner, the subject coverage, the contributor bound and reconciliation, the approximate basis and why, the gap policy and the digest's coverage.
 * @evidence contracts/performance.md#efficient-algorithms Linear in surfaces, openings, connector route points, elements and shell triangles, plus the per-cell volume cost that is polynomial in each cell's handful of planes, and `O(o log o)` per subject to order its owners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each record is measured once in its own pass and no measured value is needed twice, so there is no repeated work to share; nothing is cached across calls because the environment is the caller's mutable record.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The owner tallies live for the call, bounded by the distinct owners per subject, and are released on return; only the report, owned by the caller and bounded by the contributor limit per finding, survives.
 * @author Samchon
 */
export const measureAutoMovieQuantities = (props: {
  /** Design the quantities are measured from. */
  environment: IAutoMovieBuiltEnvironment;
  /** Named-owner bound; defaults to the exported maximum. */
  maxContributors?: number;
}): IAutoMovieQuantityReport => {
  const { environment } = props;
  const bound: number =
    props.maxContributors ?? AUTOMOVIE_QUANTITY_MAX_CONTRIBUTORS;
  if (!Number.isSafeInteger(bound) || bound < 1)
    throw new Error(
      `quantity report contributor bound must be a positive safe integer, but was ${bound}`,
    );
  const validated: ReturnType<typeof validateBuiltEnvironment> =
    validateBuiltEnvironment({ environment });
  if (validated.success === false) {
    const first: (typeof validated.violations)[number] =
      validated.violations[0]!;
    throw new Error(
      `built environment "${environment.id}" is invalid at ${first.path}: ${first.expected}`,
    );
  }
  const gaps: IAutoMovieDrawingGap[] = [];
  const measured: Map<AutoMovieQuantitySubject, Map<string, number>> = new Map(
    AUTOMOVIE_QUANTITY_SUBJECTS.map(
      (
        subject: AutoMovieQuantitySubject,
      ): [AutoMovieQuantitySubject, Map<string, number>] => [
        subject,
        new Map(),
      ],
    ),
  );
  const add = (
    subject: AutoMovieQuantitySubject,
    owner: string,
    value: number,
  ): void => {
    const owners: Map<string, number> = measured.get(subject)!;
    owners.set(owner, (owners.get(owner) ?? 0) + value);
  };

  for (const entry of environment.surfaces)
    add(
      "space-floor-area",
      entry.space,
      footprintArea(surfaceFootprint(entry.surface)),
    );

  let unmeasuredCells: number = 0;
  const faceted: string[] = [];
  for (const space of environment.spaces) {
    if (space.fidelity === "faceted") faceted.push(space.id);
    if (space.shell !== undefined) {
      add("space-volume", space.id, builtSpaceShellVolume(space.shell));
      continue;
    }
    for (const cell of space.cells) {
      const volume: number | null = autoMovieDrawingCellVolume(cell.planes);
      if (volume === null) {
        ++unmeasuredCells;
        continue;
      }
      add("space-volume", space.id, volume);
    }
  }
  if (faceted.length !== 0)
    gaps.push({
      subject: "curved-space-boundary",
      status: "unsupported",
      reason: `${faceted.length} logical space(s) (${faceted.sort(compareAutoMovieRenderIds).join(", ")}) declare their stated volume faceted, so their measured volume and floor area are the flats they were written as and not the curved region those flats stand for`,
      remedy:
        "read the faceted total as a lower bound on a vaulted or domed region; an exact figure needs a curved boundary primitive this record does not carry",
    });
  if (unmeasuredCells !== 0)
    gaps.push({
      subject: "unbounded-space-cell",
      status: "not-run",
      reason: `${unmeasuredCells} logical cell(s) are unbounded or degenerate, so no volume could be computed for them and they contribute nothing to their space's total`,
      remedy:
        "close each cell with enough half-spaces to bound a solid, or split the region into bounded cells",
    });

  let unprovenOpenings: number = 0;
  for (const opening of environment.openings) {
    add("opening-count", opening.kind, 1);
    if (opening.profile === undefined) {
      ++unprovenOpenings;
      continue;
    }
    add("opening-area", opening.id, autoMovieOpeningArea(opening.profile));
  }
  if (unprovenOpenings !== 0)
    gaps.push({
      subject: "opening-area",
      status: "not-run",
      reason: `${unprovenOpenings} opening(s) declare no void on a boundary face, so the area they remove from their host cannot be measured`,
      remedy:
        "author the opening's profile on a boundary that carries a face, then re-measure",
    });

  for (const connector of environment.connectors) {
    let length: number = 0;
    for (let index: number = 1; index < connector.route.length; ++index)
      length += Vector3.length(
        Vector3.subtract(connector.route[index]!, connector.route[index - 1]!),
      );
    add("connector-length", connector.id, length);
  }

  for (const element of environment.elements) {
    add("element-count", element.kind, 1);
    if (element.model !== null) add("model-occurrence-count", element.model, 1);
  }

  gaps.push(...FIXED_GAPS);
  gaps.sort(
    (left: IAutoMovieDrawingGap, right: IAutoMovieDrawingGap): number =>
      compareAutoMovieRenderIds(left.subject, right.subject),
  );

  const report: Omit<IAutoMovieQuantityReport, "digest"> = {
    version: 1,
    protocol: "automovie.quantity.v1",
    environment: environment.id,
    findings: AUTOMOVIE_QUANTITY_SUBJECTS.map(
      (subject: AutoMovieQuantitySubject): IAutoMovieQuantityFinding =>
        finding(subject, measured.get(subject)!, bound),
    ),
    gaps,
  };
  return {
    ...report,
    digest: autoMovieRenderDigest(canonicalizeAutoMovieJson(report)),
  };
};

/**
 * Turn one subject's owner tally into its bounded finding.
 *
 * Owners are ordered by rounded value descending, then by id. The total is
 * summed over every owner before the bound is applied, so naming fewer owners
 * never changes the number somebody orders against, and the omitted count and
 * value let a reader reconcile the two.
 */
const finding = (
  subject: AutoMovieQuantitySubject,
  owners: ReadonlyMap<string, number>,
  bound: number,
): IAutoMovieQuantityFinding => {
  const ordered: IAutoMovieQuantityContributor[] = [...owners.entries()]
    .map(
      ([owner, value]: [string, number]): IAutoMovieQuantityContributor => ({
        owner,
        value: roundAutoMovieDrawingScalar(value),
      }),
    )
    .sort(
      (
        left: IAutoMovieQuantityContributor,
        right: IAutoMovieQuantityContributor,
      ): number =>
        right.value - left.value ||
        compareAutoMovieRenderIds(left.owner, right.owner),
    );
  const omitted: IAutoMovieQuantityContributor[] = ordered.slice(bound);
  const basis: AutoMovieQuantityBasis =
    subject === "space-volume" ? "approximate" : "exact";
  return {
    subject,
    unit: UNITS[subject],
    total: roundAutoMovieDrawingScalar(sum(ordered)),
    owners: ordered.length,
    basis,
    approximation:
      basis === "approximate"
        ? AUTOMOVIE_QUANTITY_CELL_UNION_APPROXIMATION
        : null,
    contributors: ordered.slice(0, bound),
    omittedOwners: omitted.length,
    omittedValue: roundAutoMovieDrawingScalar(sum(omitted)),
  };
};

/** The sum of the contributors' rounded values. */
const sum = (entries: readonly IAutoMovieQuantityContributor[]): number =>
  entries.reduce(
    (total: number, entry: IAutoMovieQuantityContributor): number =>
      total + entry.value,
    0,
  );
