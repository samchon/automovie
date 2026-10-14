import {
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  IAutoMovieDrawing,
  IAutoMovieDrawingAnnotation,
  IAutoMovieDrawingAnnotationSpec,
  IAutoMovieDrawingDimension,
  IAutoMovieDrawingDimensionSpec,
  IAutoMovieDrawingFrame,
  IAutoMovieDrawingGap,
  IAutoMovieDrawingLine,
  IAutoMovieDrawingOpeningMark,
  IAutoMovieDrawingPoint,
  IAutoMovieDrawingRegion,
  IAutoMovieDrawingView,
} from "@automovie/interface";

import { validateBuiltEnvironment } from "../architecture/validateBuiltEnvironment";
import { Vector3 } from "../math/Vector3";
import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { compareAutoMovieRenderIds } from "../render/compareAutoMovieRenderIds";
import { canonicalizeAutoMovieJson } from "../text/canonicalizeAutoMovieJson";
import { IAutoMovieDrawingDesignIndex } from "./IAutoMovieDrawingDesignIndex";
import { IAutoMovieDrawingFeatureResolution } from "./IAutoMovieDrawingFeatureResolution";
import { autoMovieDrawingExtent } from "./autoMovieDrawingExtent";
import { autoMovieDrawingFrame } from "./autoMovieDrawingFrame";
import { autoMovieDrawingHasCut } from "./autoMovieDrawingHasCut";
import { autoMovieDrawingIncludedSpaces } from "./autoMovieDrawingIncludedSpaces";
import { autoMovieDrawingOpeningMark } from "./autoMovieDrawingOpeningMark";
import { autoMovieOpeningHasArc } from "./autoMovieOpeningHasArc";
import { draftAutoMovieDrawingLines } from "./draftAutoMovieDrawingLines";
import { indexAutoMovieDrawingDesign } from "./indexAutoMovieDrawingDesign";
import { projectAutoMovieDrawingPoint } from "./projectAutoMovieDrawingPoint";
import { resolveAutoMovieDrawingFeature } from "./resolveAutoMovieDrawingFeature";
import { roundAutoMovieDrawingPoint } from "./roundAutoMovieDrawingPoint";
import { roundAutoMovieDrawingScalar } from "./roundAutoMovieDrawingScalar";
import { roundAutoMovieDrawingVector } from "./roundAutoMovieDrawingVector";
import { sectionAutoMovieDrawingSpaces } from "./sectionAutoMovieDrawingSpaces";

/**
 * Derive one drawing from one design and one view.
 *
 * Throws an `Error` when the design fails `validateBuiltEnvironment`, naming the first violation, because a drawing of a graph that does not resolve would be a picture of nothing handed on as evidence. Throws when the view is degenerate, as `autoMovieDrawingFrame` describes, and when it declares two dimensions or two annotations with one id, since a consumer addresses them by id.
 *
 * Everything is computed from the design: lines from element and face-only boundary geometry in each element's current operating state, regions from the cells a cutting view passes through, opening marks from each opening's void or fill, and dimensions and notes from the features their targets pin. Nothing produced here may be read back into the design. What cannot be computed is reported in {@link IAutoMovieDrawing.gaps} rather than omitted, because a sheet that silently leaves something out reads as a building without it. Openings are marked whatever the kind filter says, because the schedule counts them all, and only the space filter selects them.
 *
 * The digest is SHA-256 over the canonical JSON of every other field. Identical canonical payloads give identical digests; a shared digest does not prove field equality because SHA-256 collisions are possible.
 *
 * @param props.environment Design the drawing is taken from.
 * @param props.view View that decides the cut, the direction, the filters and the targets.
 * @returns The drawing, with sorted lines, regions, openings and gaps and the view's own dimension and note order.
 *
 * @evidence contracts/common.md#principled-implementation An orthographic drafting pipeline over the validated design: one resolved frame, element staging shared with the scene through `builtEnvironmentWorldMatrices`, convex-cell sections, shared opening sizing, and feature resolution against current geometry; the digest is SHA-256 of `canonicalizeAutoMovieJson`, with deterministic member ordering and escaping over the authored JSON payload, and the stated limitations are the gaps the record carries.
 * @evidence contracts/common.md#clear-and-simple-design The derivation validates, indexes the design once, delegates drafting, sectioning, opening marks, extent and feature resolution to one helper each, and keeps only the gap wording and record assembly, so each stage owns one responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No design, view or element is special-cased; the gaps are fixed statements of what this derivation does not compute, and duplicate dimension and note ids are refused rather than silently disambiguated.
 * @evidence contracts/common.md#meaningful-documentation The comment states every refusal and its cause, where each kind of content comes from, the one-way rule, the gap policy, why openings ignore the kind filter, the digest's coverage and the ordering of each array.
 * @evidence contracts/performance.md#efficient-algorithms Includes full environment validation, model tessellation/placement and linear triangle drafting, quadratic clipping in each cell's plane count, and feature-local corner/edge sorting for each dimension end or annotation. Output arrays and canonical object keys are sorted before text encoding/hashing; unknown filter ids use a shared set rather than repeated space scans.
 * @evidence contracts/performance.md#reuse-equivalent-work One design index serves every stage, so element lookups, world matrices and part tessellations are computed once and shared by drafting, opening marks and every dimension end and note; the index is built per call because the environment is the caller's mutable record.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The design index and stage temporaries are owned by this call and released when it returns, bounded by the design's size; only the returned drawing, owned by the caller, survives.
 * @author Samchon
 */
export const deriveAutoMovieDrawing: (props: {
  environment: IAutoMovieBuiltEnvironment;
  view: IAutoMovieDrawingView;
}) => IAutoMovieDrawing = (props: {
  /** Design the drawing is taken from. */
  environment: IAutoMovieBuiltEnvironment;

  /** View that decides the cut, the direction, the filters and the pen. */
  view: IAutoMovieDrawingView;
}): IAutoMovieDrawing => {
  const {
    environment,
    view,
  }: { environment: IAutoMovieBuiltEnvironment; view: IAutoMovieDrawingView } =
    props;
  const validated: ReturnType<typeof validateBuiltEnvironment> =
    validateBuiltEnvironment({ environment });
  if (validated.success === false) {
    const first: (typeof validated.violations)[number] =
      validated.violations[0]!;
    throw new Error(
      `built environment "${environment.id}" is invalid at ${first.path}: ${first.expected}`,
    );
  }
  requireUniqueIds(view, "dimension", view.dimensions);
  requireUniqueIds(view, "annotation", view.annotations);
  const frame: IAutoMovieDrawingFrame = autoMovieDrawingFrame(view);
  const design: IAutoMovieDrawingDesignIndex =
    indexAutoMovieDrawingDesign(environment);
  const cut: boolean = autoMovieDrawingHasCut(view.projection);
  const spaces: Set<string> | null = autoMovieDrawingIncludedSpaces(
    environment,
    view,
  );
  const gaps: IAutoMovieDrawingGap[] = [];

  // A space filter naming a space the design does not declare is a dangling
  // reference, reported once per distinct name. An element kind is an open
  // vocabulary with no registry, so a kind matching nothing is an honest empty
  // sheet rather than a mistake.
  const declared: Set<string> = new Set(
    environment.spaces.map((space: IAutoMovieBuiltSpace): string => space.id),
  );
  const unknownSpaces: string[] = [...new Set(view.spaces)]
    .filter((id: string): boolean => !declared.has(id))
    .sort(compareAutoMovieRenderIds);
  if (unknownSpaces.length !== 0)
    gaps.push({
      subject: "view-space-filter",
      status: "not-run",
      reason: `the view restricts itself to ${unknownSpaces.length} space(s) this design does not declare (${unknownSpaces.join(", ")}), so nothing could be selected for them`,
      remedy:
        "name a space the design declares, or clear the filter to draw every space",
    });

  const drafted: { lines: IAutoMovieDrawingLine[]; unresolvedModels: number } =
    draftAutoMovieDrawingLines({
      environment,
      view,
      frame,
      design,
      cut,
      drawn: (kind: string, space: string | null): boolean =>
        (view.elementKinds.length === 0 || view.elementKinds.includes(kind)) &&
        (spaces === null || (space !== null && spaces.has(space))),
    });
  if (drafted.unresolvedModels !== 0)
    gaps.push({
      subject: "external-model-geometry",
      status: "not-run",
      reason: `${drafted.unresolvedModels} drawn element(s) cite a builder-owned runtime model whose geometry this design does not carry`,
      remedy:
        "author the element's geometry as an environment-owned model, or derive the drawing after the builder has resolved the external asset",
    });

  const regions: IAutoMovieDrawingRegion[] = cut
    ? sectionRegions(environment, frame, design, spaces, gaps)
    : [];
  const openings: IAutoMovieDrawingOpeningMark[] = markOpenings(
    environment,
    frame,
    design,
    spaces,
    gaps,
  );
  gaps.push(...FIXED_GAPS);

  const dimensions: IAutoMovieDrawingDimension[] = view.dimensions.map(
    (spec: IAutoMovieDrawingDimensionSpec): IAutoMovieDrawingDimension =>
      dimensionOf(environment, design, frame, spec),
  );
  const annotations: IAutoMovieDrawingAnnotation[] = view.annotations.map(
    (spec: IAutoMovieDrawingAnnotationSpec): IAutoMovieDrawingAnnotation => {
      const resolution: IAutoMovieDrawingFeatureResolution =
        resolveAutoMovieDrawingFeature(environment, spec.target, design);
      return resolution.status === "stale"
        ? {
            id: spec.id,
            text: spec.text,
            status: "stale",
            at: null,
            reason: resolution.reason,
          }
        : {
            id: spec.id,
            text: spec.text,
            status: "resolved",
            at: roundAutoMovieDrawingPoint(
              projectAutoMovieDrawingPoint(frame, resolution.point!),
            ),
            reason: null,
          };
    },
  );
  if (
    annotations.some(
      (annotation: IAutoMovieDrawingAnnotation): boolean =>
        annotation.status === "resolved",
    )
  )
    gaps.push({
      subject: "note-text-extent",
      status: "unsupported",
      reason:
        "a note resolves to the page point its text is set from, and the width and height of the glyphs that text becomes are not measured, because the derivation carries no font metrics",
      remedy:
        "read the note's position as an anchor and measure the set text in whatever renders it; the drawing's extent holds every note's anchor and not necessarily its last letter",
    });
  gaps.sort((left: IAutoMovieDrawingGap, right: IAutoMovieDrawingGap): number =>
    compareAutoMovieRenderIds(left.subject, right.subject),
  );

  const drawing: Omit<IAutoMovieDrawing, "digest"> = {
    version: 1,
    protocol: "automovie.drawing.v1",
    view: view.id,
    projection: view.projection,
    discipline: view.discipline,
    scale: view.scale,
    environment: environment.id,
    frame: {
      origin: roundAutoMovieDrawingVector(frame.origin),
      right: roundAutoMovieDrawingVector(frame.right),
      up: roundAutoMovieDrawingVector(frame.up),
      normal: roundAutoMovieDrawingVector(frame.normal),
    },
    extent: autoMovieDrawingExtent({
      lines: drafted.lines,
      regions,
      openings,
      dimensions,
      annotations,
    }),
    lines: drafted.lines,
    regions,
    openings,
    dimensions,
    annotations,
    gaps,
  };
  return {
    ...drawing,
    digest: autoMovieRenderDigest(canonicalizeAutoMovieJson(drawing)),
  };
};

/** Statements every drawing carries about derivations it never performs. */
const FIXED_GAPS: readonly IAutoMovieDrawingGap[] = [
  {
    subject: "hidden-line-removal",
    status: "unsupported",
    reason:
      "linework is classified by its relation to the cut plane and the view depth, not by what occludes it, so an element behind another is drafted as though it were visible",
    remedy:
      "read the depth classification as drafting semantics rather than visibility, or render the view and read occlusion from the semantic mask",
  },
  {
    subject: "material-build-up",
    status: "unsupported",
    reason:
      "a region's finish is the surface material bound to the elements realizing its boundaries; a material assembly is a separate record from the built environment, this derivation is handed only the environment, and nothing here hatches a layer order, a thickness or a coursing pattern even when one is authored",
    remedy:
      "extend the derivation to accept the work's material assemblies, then hatch each cut boundary by its own layers",
  },
  {
    subject: "service-network",
    status: "unsupported",
    reason:
      "a service network is a separate record from the built environment, this derivation is handed only the environment, and nothing here draws a segment, a port or a penetration even when one is authored, so a services view is a kind-filtered projection of ordinary elements rather than a network-aware one",
    remedy:
      "extend the derivation to accept the work's service networks, then draw their segments, ports and penetrations as their own linework",
  },
];

/** Check one view list's exact ids with a set, throwing at its first repeat without renaming entries. O(N) expected work/O(N) temporary ids preserve authored order; the set releases on return or throw and neither ids nor a verdict are cached. */
const requireUniqueIds: (
  view: IAutoMovieDrawingView,
  label: string,
  entries: readonly { id: string }[],
) => void = (
  view: IAutoMovieDrawingView,
  label: string,
  entries: readonly { id: string }[],
): void => {
  const seen: Set<string> = new Set();
  for (const entry of entries) {
    if (seen.has(entry.id))
      throw new Error(
        `drawing view "${view.id}" declares ${label} "${entry.id}" more than once, so it cannot be addressed by its id`,
      );
    seen.add(entry.id);
  }
};

/**
 * Delegate cell sectioning and translate its faceted ids, omitted shells and unbounded-cell counts into caller-owned gaps, returning the actual regions unchanged. The validated design/frame and optional inclusion set are shared with drafting; no shell section or curved correction is invented here.
 *
 * Cost follows the full section owner, including per-cell plane clipping and region sorting; gap additions are constant except formatting faceted ids, and no section data survives except the returned regions/gaps.
 */
const sectionRegions: (
  environment: IAutoMovieBuiltEnvironment,
  frame: IAutoMovieDrawingFrame,
  design: IAutoMovieDrawingDesignIndex,
  spaces: ReadonlySet<string> | null,
  gaps: IAutoMovieDrawingGap[],
) => IAutoMovieDrawingRegion[] = (
  environment: IAutoMovieBuiltEnvironment,
  frame: IAutoMovieDrawingFrame,
  design: IAutoMovieDrawingDesignIndex,
  spaces: ReadonlySet<string> | null,
  gaps: IAutoMovieDrawingGap[],
): IAutoMovieDrawingRegion[] => {
  const section: ReturnType<typeof sectionAutoMovieDrawingSpaces> =
    sectionAutoMovieDrawingSpaces({ environment, frame, design, spaces });
  if (section.faceted.length !== 0)
    gaps.push({
      // The same subject and word the quantity report uses, so a sheet and a
      // take-off agree about whether a dome was drawn or approximated.
      subject: "curved-space-boundary",
      status: "unsupported",
      reason: `${section.faceted.length} sectioned space(s) (${section.faceted.join(", ")}) declare their stated volume faceted, so the outline drawn for them is the flats they were written as and not the curved region those flats stand for`,
      remedy:
        "read the faceted outline as chords of the region it stands for; a true section needs a curved boundary primitive this record does not carry",
    });
  if (section.shelled !== 0)
    gaps.push({
      // `unsupported`: the shell is exactly the region, and what is missing is
      // plane-versus-shell sectioning, which this drafter does not perform.
      subject: "shelled-space-section",
      status: "unsupported",
      reason: `${section.shelled} logical space(s) state their volume as a closed boundary shell, which this drafter cannot section: only half-space cells are cut, so those spaces contribute no region to the sheet`,
      remedy:
        "state the space as convex cells to have it sectioned, or read its extent from the shell itself until plane-versus-shell sectioning exists",
    });
  if (section.unbounded !== 0)
    gaps.push({
      // `not-run`, as in the quantity report: sectioning exists, and what is
      // missing is a cell closed enough to run it on.
      subject: "unbounded-space-cell",
      status: "not-run",
      reason: `${section.unbounded} logical cell(s) are not bounded by their own half-spaces, so their cross-section has no finite outline`,
      remedy:
        "close each cell with enough half-spaces to bound it, or split the region into bounded cells",
    });
  return section.regions;
};

/**
 * Select openings through any host-boundary space, derive profile/fill/absent marks, and state missing geometry, substituted fill size, chorded arcs and unperformed host subtraction as gaps. The element-kind filter deliberately does not choose openings.
 *
 * One opening walk reuses the design index's staging/tessellation; a few linear basis counts and O(O log O) id sort follow. The returned marks and caller-owned gap sink survive, with no cross-view cache.
 */
const markOpenings: (
  environment: IAutoMovieBuiltEnvironment,
  frame: IAutoMovieDrawingFrame,
  design: IAutoMovieDrawingDesignIndex,
  spaces: ReadonlySet<string> | null,
  gaps: IAutoMovieDrawingGap[],
) => IAutoMovieDrawingOpeningMark[] = (
  environment: IAutoMovieBuiltEnvironment,
  frame: IAutoMovieDrawingFrame,
  design: IAutoMovieDrawingDesignIndex,
  spaces: ReadonlySet<string> | null,
  gaps: IAutoMovieDrawingGap[],
): IAutoMovieDrawingOpeningMark[] => {
  const openings: IAutoMovieDrawingOpeningMark[] = [];
  let arced: number = 0;
  for (const opening of environment.openings) {
    const boundary: IAutoMovieBuiltBoundary = design.boundaries.get(
      opening.boundary,
    )!;
    if (
      spaces !== null &&
      !boundary.spaces.some((candidate: string): boolean =>
        spaces.has(candidate),
      )
    )
      continue;
    const mark: IAutoMovieDrawingOpeningMark = autoMovieDrawingOpeningMark(
      design,
      frame,
      opening,
    );
    openings.push(mark);
    if (mark.basis === "profile" && autoMovieOpeningHasArc(opening.profile!))
      ++arced;
  }
  const count: (basis: IAutoMovieDrawingOpeningMark["basis"]) => number = (
    basis: IAutoMovieDrawingOpeningMark["basis"],
  ): number =>
    openings.filter(
      (mark: IAutoMovieDrawingOpeningMark): boolean => mark.basis === basis,
    ).length;
  const unproven: number = count("none");
  const substituted: number = count("fill");
  if (unproven !== 0)
    gaps.push({
      subject: "opening-geometry",
      status: "not-run",
      reason: `${unproven} drawn opening(s) carry neither a void of their own on a boundary face nor a filling element with geometry, so nothing in the design says where or how large they are`,
      remedy:
        "give the opening a profile on a boundary that carries a face, or a filling element with geometry",
    });
  if (substituted !== 0)
    gaps.push({
      subject: "opening-profile",
      status: "not-run",
      reason: `${substituted} drawn opening(s) have no void of their own, so their size is the filling element's extent, which is the leaf and not the hole`,
      remedy:
        "author the opening's profile on its host boundary's face, then re-derive",
    });
  if (arced !== 0)
    gaps.push({
      subject: "curved-linework",
      status: "unsupported",
      reason: `${arced} drawn opening(s) have arc edges, which are drafted as chords at a fixed density rather than as true curve segments`,
      remedy:
        "read the chorded outline as linework; the scheduled width and height are the bounding hull the wall kernel cuts, which is tight for an arc on a chord parallel to a face axis",
    });
  if (count("profile") !== 0)
    gaps.push({
      subject: "opening-void-subtraction",
      status: "unsupported",
      reason:
        "an opening's void is drafted as its own outline over its host's linework rather than subtracted from it, so the host reads as unbroken behind the opening",
      remedy:
        "read the opening outline as the void; subtract it from the host once boolean linework exists",
    });
  return openings.sort(
    (
      left: IAutoMovieDrawingOpeningMark,
      right: IAutoMovieDrawingOpeningMark,
    ): number => compareAutoMovieRenderIds(left.opening, right.opening),
  );
};

/**
 * Resolve both pinned features against the shared current design, propagating the first stale reason with null endpoints/value. Otherwise round page endpoints and measure either raw world distance or distance between those rounded page points, then round the scalar result.
 *
 * Cost is both feature resolutions, which can place/weld/sort model geometry despite shared part tessellation; only one new dimension record escapes and no previous measurement is retained.
 */
const dimensionOf: (
  environment: IAutoMovieBuiltEnvironment,
  design: IAutoMovieDrawingDesignIndex,
  frame: IAutoMovieDrawingFrame,
  spec: IAutoMovieDrawingDimensionSpec,
) => IAutoMovieDrawingDimension = (
  environment: IAutoMovieBuiltEnvironment,
  design: IAutoMovieDrawingDesignIndex,
  frame: IAutoMovieDrawingFrame,
  spec: IAutoMovieDrawingDimensionSpec,
): IAutoMovieDrawingDimension => {
  const from: IAutoMovieDrawingFeatureResolution =
    resolveAutoMovieDrawingFeature(environment, spec.from, design);
  const to: IAutoMovieDrawingFeatureResolution = resolveAutoMovieDrawingFeature(
    environment,
    spec.to,
    design,
  );
  if (from.status === "stale" || to.status === "stale")
    return {
      id: spec.id,
      measure: spec.measure,
      status: "stale",
      from: null,
      to: null,
      value: null,
      reason: from.status === "stale" ? from.reason : to.reason,
    };
  const pageFrom: IAutoMovieDrawingPoint = roundAutoMovieDrawingPoint(
    projectAutoMovieDrawingPoint(frame, from.point!),
  );
  const pageTo: IAutoMovieDrawingPoint = roundAutoMovieDrawingPoint(
    projectAutoMovieDrawingPoint(frame, to.point!),
  );
  return {
    id: spec.id,
    measure: spec.measure,
    status: "resolved",
    from: pageFrom,
    to: pageTo,
    value: roundAutoMovieDrawingScalar(
      spec.measure === "world"
        ? Vector3.length(Vector3.subtract(to.point!, from.point!))
        : Math.hypot(pageTo.x - pageFrom.x, pageTo.y - pageFrom.y),
    ),
    reason: null,
  };
};
