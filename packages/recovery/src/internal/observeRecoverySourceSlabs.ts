import type { IAutoMovieRecoverySlabPair } from "../structures/mesh/IAutoMovieRecoverySlabPair";
import type { IAutoMovieRecoverySlabObservation } from "../structures/observation/IAutoMovieRecoverySlabObservation";
import type { IAutoMovieRecoverySourceLineage } from "../structures/observation/IAutoMovieRecoverySourceLineage";
import { RecoveryEventRegion } from "./RecoveryEventRegion";
import type { RecoveryScalarIndex } from "./RecoveryScalarIndex";
import { critical } from "./mesh-observations/critical";
import { prepareRecoveryCriticalBrackets } from "./prepareRecoveryCriticalBrackets";
import type { prepareRecoveryMeshIncidence } from "./prepareRecoveryMeshIncidence";

/**
 * Bind actual cut-emitting faces and published contour identities to clipped source slabs. The same physical scalar chart drives source cells and PL critical classification. All components and issues survive; only actual segment/contact provenance supplies ports, never endpoint-star witnesses. Copy the observed raw-node, alias and halfedge registries with their input ordinal spaces so boundary words remain joinable without parsing IDs. Measured critical brackets do not imply curves fitted at those bracket planes, exact material phase transport or transverse jets.
 *
 * @evidence contracts/common.md#principled-implementation The maintained exact-incidence source-cell observer owns topology and port claims; the maintained PL link and critical-bracket owners supply actual source event positions and conservative qualification on the same scalar chart.
 * @evidence contracts/common.md#clear-and-simple-design One acquisition helper composes prepared source incidence, existing fitted-contour identities and finite slab pairs while keeping source address metadata outside coefficient results.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No endpoint-star promotion, coordinate matching, selected-component omission, source mesh/normal fallback, inferred cap or invented jet is used; unsupported contours use explicit unpublished boundary identities.
 * @evidence contracts/common.md#meaningful-documentation States exact provenance, copied input-address registries, shared scalar authority, all-component coverage, physical brackets and the remaining phase/jet qualification limits.
 * @evidence contracts/performance.md#efficient-algorithms For V source vertices, T faces, E critical events and P contour publications, one source-cell admission, scalar-height sorting and PL classification cost O(V log V+T+E log E). Each requested slab scans P publications, queries and clips A closed-overlap candidate faces, and associates its local p ports, c cycles and i issues with direct scans; these can add O(p squared+c*p+i*component-count*issues-per-component). Copying N observed nodes and H halfedge occurrences adds O(N+H) time and retained metadata, since each node has at most two input vertex memberships and aliases are bounded by N. Selected critical bracketing can add O(e squared+e log V) for e events. Output size follows retained registries, components, ports, events and issues.
 * @evidence contracts/performance.md#reuse-equivalent-work One source-cell closure, sorted physical heights, PL classification and original source face index serve every pair; existing section fitting is never repeated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Source arrays and private cell records live only for the synchronous call. Returned records copy face addresses and measured critical positions; no source geometry array is transferred or globally cached.
 */
export function observeRecoverySourceSlabs(input: {
  prepared: ReturnType<typeof prepareRecoveryMeshIncidence>;
  heights: readonly number[];
  axis: [number, number, number];
  exactCoordinateAliases: boolean;
  index: ReturnType<typeof RecoveryScalarIndex.create>;
  pairs: readonly IAutoMovieRecoverySlabPair[];
  sectionCoordinatesMm: readonly number[];
  publications: readonly IAutoMovieRecoverySourceLineage[];
  checkpoint?: () => void;
  observe?: (record: IAutoMovieRecoverySlabObservation) => void;
}): IAutoMovieRecoverySlabObservation[] {
  if (!input.pairs.length) return [];
  const region: ReturnType<typeof RecoveryEventRegion> = RecoveryEventRegion({
    verticesMm: input.prepared.mesh.vertices,
    triangles: input.prepared.mesh.triangles,
    canon: input.prepared.canon,
    heights: input.heights,
    incidence: input.exactCoordinateAliases ? "canonical" : "raw",
  });
  const events: ReturnType<typeof critical> = critical(
    input.prepared.mesh,
    input.axis,
    input.heights,
    "boundary-regular-path-v1",
  );
  const heights: number[] = [...new Set(input.heights)].sort(
    (a: number, b: number): number => a - b,
  );
  const records: IAutoMovieRecoverySlabObservation[] = [];
  for (const pair of input.pairs) {
    input.checkpoint?.();
    const ports: Array<{
      id: string;
      side: "before" | "after";
      record: IAutoMovieRecoverySourceLineage;
      reference: Parameters<typeof region>[0]["ports"][number]["reference"];
    }> = [];
    for (const side of ["before", "after"] as const) {
      const coordinateMm: number =
        side === "before" ? pair.beforeMm : pair.afterMm;
      const section: number = input.sectionCoordinatesMm.indexOf(coordinateMm);
      if (section < 0)
        throw new Error("Source slab bound has no observed section");
      for (const record of input.publications) {
        if (record.coordinateMm !== coordinateMm) continue;
        if (record.exactSourceTriangleIds === undefined)
          throw new Error(
            "Source slab ports require actual cut-emitting faces",
          );
        const publication: IAutoMovieRecoverySourceLineage["publication"] =
          record.publication;
        const id: string = `${side}.section.${section}.contour.${record.contourIndex}`;
        const reference: (typeof ports)[number]["reference"] =
          publication.kind === "closed"
            ? { kind: "closed", section, curve: publication.loopIndex }
            : publication.kind === "open"
              ? { kind: "open", section, curve: publication.reportIndex }
              : { kind: "boundary", name: id };
        ports.push({ id, side, record, reference });
      }
    }
    const candidates: number[] = [
      ...new Set([
        ...input.index.slab(pair.beforeMm, pair.afterMm),
        ...input.index.cut(pair.beforeMm),
        ...input.index.cut(pair.afterMm),
      ]),
    ].sort((a: number, b: number): number => a - b);
    const observed: ReturnType<typeof region> = region({
      beforeMm: pair.beforeMm,
      afterMm: pair.afterMm,
      candidates,
      ports: ports.map(
        (
          port: (typeof ports)[number],
        ): Parameters<typeof region>[0]["ports"][number] => ({
          id: port.id,
          side: port.side,
          reference: port.reference,
          faces: port.record.exactSourceTriangleIds!,
        }),
      ),
    });
    const record: IAutoMovieRecoverySlabObservation = {
      unit: "mm",
      axis: [...input.axis],
      criticalPolicy: "boundary-regular-path-v1",
      boundsMm: [pair.beforeMm, pair.afterMm],
      sourceIncidence: {
        incidence: observed.incidence,
        triangleOrdinalSpace: "input-triangles",
        vertexOrdinalSpace: "input-vertices",
        nodes: observed.nodes.map(
          (
            node: (typeof observed.nodes)[number],
          ): IAutoMovieRecoverySlabObservation["sourceIncidence"]["nodes"][number] => ({
            id: node.id,
            incidenceId: node.incidenceId,
            vertices: [...node.vertices],
            scalar: node.scalar,
          }),
        ),
        aliases: observed.aliases.map(
          (
            alias: (typeof observed.aliases)[number],
          ): IAutoMovieRecoverySlabObservation["sourceIncidence"]["aliases"][number] => ({
            ...alias,
          }),
        ),
        occurrences: observed.occurrences.map(
          (
            occurrence: (typeof observed.occurrences)[number],
          ): IAutoMovieRecoverySlabObservation["sourceIncidence"]["occurrences"][number] => ({
            ...occurrence,
          }),
        ),
      },
      components: [],
      ports: [],
      events: [],
      issues: [],
    };
    const occurrenceById: Map<string, (typeof observed.occurrences)[number]> =
      new Map(
        observed.occurrences.map(
          (
            row: (typeof observed.occurrences)[number],
          ): [string, (typeof observed.occurrences)[number]] => [row.id, row],
        ),
      );
    for (const port of observed.ports) {
      const owner: (typeof ports)[number] = ports.find(
        (candidate: (typeof ports)[number]): boolean =>
          candidate.id === port.id,
      )!;
      record.ports.push({
        id: port.id,
        side: owner.side,
        coordinateMm: owner.record.coordinateMm,
        contourIndex: owner.record.contourIndex,
        publication: { ...owner.record.publication },
        exactSourceTriangleIds: [...owner.record.exactSourceTriangleIds!],
        components: [...port.components],
        occurrences: [...port.occurrences],
        status: port.status,
        parameterCorrespondence: "contour-identity-only",
      });
    }
    for (const component of observed.components)
      record.components.push({
        id: component.id,
        sourceTriangleIds: [...component.faces],
        topology: { ...component.topology },
        cycles: component.cycles.map(
          (
            cycle: (typeof component.cycles)[number],
          ): IAutoMovieRecoverySlabObservation["components"][number]["cycles"][number] => {
            const words: Set<string> = new Set(
              cycle.occurrences.map(
                (occurrence: (typeof cycle.occurrences)[number]): string =>
                  occurrence.id,
              ),
            );
            const sides: Set<"before" | "after" | "physical"> = new Set(
              cycle.occurrences.map(
                (
                  occurrence: (typeof cycle.occurrences)[number],
                ): "before" | "after" | "physical" =>
                  occurrenceById.get(occurrence.id)!.side,
              ),
            );
            return {
              side: sides.size === 1 ? [...sides][0]! : "mixed",
              orientation: cycle.orientation,
              portIds: observed.ports
                .filter((port: (typeof observed.ports)[number]): boolean =>
                  port.occurrences.some((id: string): boolean => words.has(id)),
                )
                .map(
                  (port: (typeof observed.ports)[number]): string => port.id,
                ),
              occurrenceCount: cycle.occurrences.length,
              nodes: [...cycle.nodes],
              occurrences: cycle.occurrences.map(
                (
                  occurrence: (typeof cycle.occurrences)[number],
                ): { id: string; direction: 1 | -1 } => ({ ...occurrence }),
              ),
            };
          },
        ),
        issueCodes: component.issueIds.map(
          (id: number): string => observed.issues[id]!.code,
        ),
      });
    for (const issue of observed.issues)
      record.issues.push({
        code: issue.code,
        sourceTriangleIds: [...issue.faces],
        components: observed.components
          .filter((component: (typeof observed.components)[number]): boolean =>
            component.issueIds.some(
              (id: number): boolean => observed.issues[id] === issue,
            ),
          )
          .map(
            (component: (typeof observed.components)[number]): number =>
              component.id,
          ),
        portIds: [...issue.ports],
      });
    const selected: ReturnType<typeof critical> = events.filter(
      (event: (typeof events)[number]): boolean =>
        event.level >= pair.beforeMm && event.level <= pair.afterMm,
    );
    const diagnostics: string[] = [];
    const brackets: ReturnType<typeof prepareRecoveryCriticalBrackets> =
      prepareRecoveryCriticalBrackets(
        selected,
        heights,
        pair.afterMm - pair.beforeMm,
        new Set(),
        diagnostics,
        [],
      );
    for (const event of selected) {
      const faces: ReadonlySet<number> =
        input.prepared.vertexFaces.get(event.vertex) ?? new Set();
      const components: number[] = observed.components
        .filter((component: (typeof observed.components)[number]): boolean =>
          component.faces.some((face: number): boolean => faces.has(face)),
        )
        .map(
          (component: (typeof observed.components)[number]): number =>
            component.id,
        );
      const bracket: (typeof brackets.bracketed)[number] | undefined =
        brackets.bracketed.find(
          (candidate: (typeof brackets.bracketed)[number]): boolean =>
            candidate.event === event,
        );
      const qualified: boolean =
        !brackets.unsupportedVertices.has(event.vertex) &&
        components.length === 1 &&
        observed.components[components[0]!]!.topology.manifold &&
        observed.components[components[0]!]!.topology.orientable === true &&
        observed.components[components[0]!]!.issueIds.length === 0;
      const eventDiagnostics: string[] = [];
      if (brackets.unsupportedVertices.has(event.vertex))
        eventDiagnostics.push(
          "PL event link, plateau or physical bracket remains unsupported",
        );
      if (components.length !== 1)
        eventDiagnostics.push(
          "Critical source star has no unique clipped two-dimensional component",
        );
      else if (!qualified && !brackets.unsupportedVertices.has(event.vertex))
        eventDiagnostics.push(
          "Incident source component has unresolved topology or incidence issues",
        );
      record.events.push({
        id: `source-critical.${event.vertex}`,
        coordinateMm: event.level,
        pointMm: [...event.p],
        lowerComponents: event.lower,
        upperComponents: event.upper,
        manifold: event.manifold,
        flat: event.flat,
        qualified,
        beforeMm: bracket?.before ?? null,
        afterMm: bracket?.after ?? null,
        components,
        diagnostics: eventDiagnostics,
      });
    }
    records.push(record);
    input.observe?.(record);
  }
  return records;
}
