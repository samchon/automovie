import type { IAutoMovieRecoverySavedSection } from "../structures/mesh/IAutoMovieRecoverySavedSection";
import type { IAutoMovieRecoverySlabs } from "../structures/mesh/IAutoMovieRecoverySlabs";
import type { IAutoMovieRecoverySourceLineage } from "../structures/observation/IAutoMovieRecoverySourceLineage";
import { collectRecoveryContourFaceSupport } from "./collectRecoveryContourFaceSupport";
import type { cutExact } from "./mesh-observations/cutExact";
import type { prepareRecoveryMeshIncidence } from "./prepareRecoveryMeshIncidence";

/** Compare a complete saved raw-contour population with one fresh exact cut.
 * Address sets and admitted closure verify contour identity only; curve names
 * and output indices remain caller-attested references. Newly emitted exact
 * faces are used even when the saved artifact retained broad incidence only.
 *
 * @evidence contracts/common.md#principled-implementation Original contour ordinals, full incidence-set equality, optional exact-set equality and closed/open/degenerate classification bind unchanged symbolic publications to deterministic raw cuts. No geometric proximity or phase matching is used.
 * @evidence contracts/common.md#clear-and-simple-design One helper owns saved-versus-raw admission and copied lineage; the public observer owns source/frame identity and the existing slab owner owns topology.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Endpoint-star support never substitutes for exact emitted faces; omitted, duplicated, stale and closure-incompatible records refuse instead of inventing a publication or fitting a curve.
 * @evidence contracts/common.md#meaningful-documentation States complete contour coverage, comparison semantics, caller-attested curve identity, unsupported-port preservation and original-address ownership.
 * @evidence contracts/performance.md#efficient-algorithms For C contours, P cut samples and I incident face visits, indexing and address comparisons cost expected O(C+P+I) time and O(C+F) storage for retained face IDs. Prepared edge/vertex incidence avoids a source triangle scan per contour.
 * @evidence contracts/performance.md#reuse-equivalent-work The same admitted raw cut and incidence maps supply identity checks and exact port lineage without cutting or fitting a second time.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Input source and saved records remain borrowed. Returned lineage copies address arrays and publication metadata; no points, source geometry, saved coefficients or persistent cache transfer.
 */
export function bindRecoverySavedSectionCuts(input: {
  saved: IAutoMovieRecoverySavedSection;
  contours: ReturnType<ReturnType<typeof cutExact.prepare>>;
  prepared: ReturnType<typeof prepareRecoveryMeshIncidence>;
  checkpoint: () => void;
}):
  | { status: "bound"; value: IAutoMovieRecoverySlabs["sections"][number] }
  | { status: "refused"; diagnostic: string } {
  const refuse: (reason: string) => {
    status: "refused";
    diagnostic: string;
  } = (reason: string): { status: "refused"; diagnostic: string } => ({
    status: "refused",
    diagnostic: `Saved section ${input.saved.coordinateMm}: ${reason}`,
  });
  if (input.saved.sourceLineage.length !== input.contours.length)
    return refuse("saved and raw contour counts differ");
  const records: Map<number, IAutoMovieRecoverySourceLineage> = new Map();
  const closed: Set<number> = new Set();
  const open: Set<number> = new Set();
  for (const record of input.saved.sourceLineage) {
    if (
      !record ||
      record.coordinateMm !== input.saved.coordinateMm ||
      !Number.isSafeInteger(record.contourIndex) ||
      record.contourIndex < 0 ||
      record.contourIndex >= input.contours.length ||
      records.has(record.contourIndex)
    )
      return refuse("invalid, repeated or foreign raw contour ordinal");
    if (
      !validFaces(
        record.sourceTriangleIds,
        input.prepared.mesh.triangles.length,
      ) ||
      (record.exactSourceTriangleIds !== undefined &&
        !validFaces(
          record.exactSourceTriangleIds,
          input.prepared.mesh.triangles.length,
        ))
    )
      return refuse("invalid original face-address population");
    const publication: IAutoMovieRecoverySourceLineage["publication"] =
      record.publication;
    if (
      !publication ||
      !["closed", "open", "failed", "degenerate"].includes(publication.kind)
    )
      return refuse("unsupported saved publication kind");
    if (publication.kind === "closed" || publication.kind === "open") {
      const ordinal: number =
        publication.kind === "closed"
          ? publication.loopIndex
          : publication.reportIndex;
      const population: Set<number> =
        publication.kind === "closed" ? closed : open;
      if (
        !Number.isSafeInteger(ordinal) ||
        ordinal < 0 ||
        population.has(ordinal) ||
        typeof publication.curveName !== "string" ||
        !publication.curveName.trim()
      )
        return refuse("invalid or repeated caller curve reference");
      population.add(ordinal);
    } else if (
      publication.kind === "failed" &&
      (typeof publication.diagnostic !== "string" ||
        !publication.diagnostic.trim())
    )
      return refuse("failed publication has no saved diagnostic");
    records.set(record.contourIndex, record);
  }
  if (
    [closed, open].some((population: Set<number>): boolean =>
      [...population].some(
        (ordinal: number): boolean => ordinal >= population.size,
      ),
    )
  )
    return refuse(
      "saved curve ordinals are not a complete publication population",
    );
  const value: IAutoMovieRecoverySlabs["sections"][number] = {
    coordinateMm: input.saved.coordinateMm,
    observationIdentity: input.saved.observationIdentity,
    sourceLineage: [],
    rawContours: [],
  };
  for (const [contourIndex, contour] of input.contours.entries()) {
    input.checkpoint();
    const saved: IAutoMovieRecoverySourceLineage = records.get(contourIndex)!;
    const support: Set<number> = collectRecoveryContourFaceSupport(
      contour.pts,
      input.prepared.vertexFaces,
      input.prepared.faceEdges,
      input.prepared.edgeKey,
    );
    if (!sameSet(saved.sourceTriangleIds, support))
      return refuse(
        `broad source incidence differs at contour ${contourIndex}`,
      );
    if (!contour.exactSourceTriangleIds)
      throw new Error("Slab-only cutting omitted exact source provenance");
    const exact: Set<number> = new Set(contour.exactSourceTriangleIds);
    if (
      saved.exactSourceTriangleIds !== undefined &&
      !sameSet(saved.exactSourceTriangleIds, exact)
    )
      return refuse(
        `exact source incidence differs at contour ${contourIndex}`,
      );
    const publication: IAutoMovieRecoverySourceLineage["publication"] =
      saved.publication;
    const degenerate: boolean = contour.pts.length < (contour.closed ? 3 : 2);
    if (
      (publication.kind === "closed" && (!contour.closed || degenerate)) ||
      (publication.kind === "open" && (contour.closed || degenerate)) ||
      (publication.kind === "degenerate" && !degenerate)
    )
      return refuse(
        `saved closure/contact classification differs at contour ${contourIndex}`,
      );
    value.sourceLineage.push({
      coordinateMm: input.saved.coordinateMm,
      contourIndex,
      sourceTriangleIds: [...support],
      exactSourceTriangleIds: [...contour.exactSourceTriangleIds],
      publication: { ...publication },
    });
    value.rawContours.push({
      contourIndex,
      closed: contour.closed,
      observationCount: contour.pts.length,
      savedClosureCompared: publication.kind !== "failed",
    });
  }
  return { status: "bound", value };
}

function validFaces(value: readonly number[], count: number): boolean {
  return (
    Array.isArray(value) &&
    Array.from(value).every(
      (face: number): boolean =>
        Number.isSafeInteger(face) && face >= 0 && face < count,
    ) &&
    new Set(value).size === value.length
  );
}

function sameSet(
  values: readonly number[],
  target: ReadonlySet<number>,
): boolean {
  return (
    values.length === target.size &&
    values.every((value: number): boolean => target.has(value))
  );
}
