import { realizeAutoMovieBicubicAtlas64 as realize } from "@automovie/engine";
import type {
  IAutoMovieContourLoft64,
  IAutoMovieModel,
  IAutoMovieRecoveryAtlasGeneration,
  IAutoMovieRecoveryTensorFamiliesInput,
  IAutoMovieRecoveryTensorRealization,
} from "@automovie/interface";

/**
 * Admit ordinary-family ownership and generate saved analytic tensors through
 * the engine. Each published endpoint curve references the tensor's coefficient
 * IDs and uses the same forward millimetre-to-metre conversion. Equality is
 * declared coefficient ownership, never a nearest-coordinate merge. Shared end
 * curves establish an analytic C0 boundary only; different operators can still
 * use different polygonal subdivisions, and transverse derivatives, embedding
 * and source fit remain unqualified. Construction is the stored Bernstein
 * control net, not a sampled limit-surface cage.
 */
export function realizeAutoMovieRecoveryTensorFamilies(
  bundle: IAutoMovieRecoveryTensorFamiliesInput,
): IAutoMovieRecoveryTensorRealization {
  if (!bundle.tensorFamilies?.length)
    return {
      parts: [],
      construction: [],
      replacements: new Map(),
      reports: [],
    };
  const curves: Map<
    string,
    IAutoMovieContourLoft64.ISection["loops"][number]["curve"]
  > = new Map();
  for (const section of bundle.loft.sections)
    for (const loop of section.loops) {
      const name: string = loop.curve.name;
      if (curves.has(name))
        throw new Error("One saved curve name has multiple coefficient owners");
      curves.set(name, loop.curve);
    }
  const replacements: Map<string, string> = new Map(),
    names: Set<string> = new Set();
  for (const family of bundle.tensorFamilies ?? []) {
    if (
      names.has(family.id) ||
      family.geometry.topologyDomain !== family.id ||
      family.boundaries.length !== 2 ||
      !family.replacedGroups.length
    )
      throw new Error(
        "Unique tensor family identities, an ordinary chain and both end-curve bindings required",
      );
    names.add(family.id);
    const ordered: (typeof family.replacedGroups)[number][] = [
      ...family.replacedGroups,
    ].sort(
      (
        a: (typeof family.replacedGroups)[number],
        b: (typeof family.replacedGroups)[number],
      ): number => a.interval - b.interval,
    );
    let previous: { interval: number; after: number } | undefined;
    for (const address of family.replacedGroups) {
      const group:
        | IAutoMovieContourLoft64.IInterval["groups"][number]
        | undefined =
        bundle.loft.intervals?.[address.interval]?.groups[address.group];
      const key: string = `${address.interval}:${address.group}`;
      if (
        !group?.supported ||
        group.before.length !== 1 ||
        group.after.length !== 1 ||
        replacements.has(key)
      )
        throw new Error(
          "Tensor families must partition supported ordinary groups without duplicate ownership",
        );
      replacements.set(key, family.id);
    }
    for (const address of ordered) {
      const interval: IAutoMovieContourLoft64.IInterval =
        bundle.loft.intervals![address.interval]!;
      const group: IAutoMovieContourLoft64.IInterval["groups"][number] =
        interval.groups[address.group]!;
      if (
        bundle.loft.sections[address.interval]!.loops[group.before[0]!]!
          .winding !==
        bundle.loft.sections[address.interval + 1]!.loops[group.after[0]!]!
          .winding
      )
        throw new Error(
          "An ordinary tensor family requires compatible material winding on both banks",
        );
      if (
        previous &&
        (address.interval !== previous.interval + 1 ||
          group.before[0] !== previous.after)
      )
        throw new Error(
          "A tensor family must own one consecutive ordinary contour chain",
        );
      if (
        bundle.loft.events.some(
          (event: IAutoMovieContourLoft64.IEvent): boolean =>
            event.beforeMm === interval.beforeMm &&
            event.afterMm === interval.afterMm &&
            (event.before.includes(group.before[0]!) ||
              event.after.includes(group.after[0]!)),
        )
      )
        throw new Error(
          "A critical event cannot be delegated to an ordinary tensor family",
        );
      previous = { interval: address.interval, after: group.after[0]! };
    }
    const first: (typeof ordered)[number] = ordered[0]!,
      last: (typeof ordered)[number] = ordered.at(-1)!;
    const ends: string[] = [
      bundle.loft.sections[first.interval]!.loops[
        bundle.loft.intervals![first.interval]!.groups[first.group]!.before[0]!
      ]!.curve.name,
      bundle.loft.sections[last.interval + 1]!.loops[
        bundle.loft.intervals![last.interval]!.groups[last.group]!.after[0]!
      ]!.curve.name,
    ];
    if (
      new Set(
        family.boundaries.map(
          (boundary: (typeof family.boundaries)[number]): string =>
            boundary.curveName,
        ),
      ).size !== 2 ||
      family.boundaries.some(
        (boundary: (typeof family.boundaries)[number]): boolean =>
          !ends.includes(boundary.curveName),
      )
    )
      throw new Error(
        "Tensor boundary bindings must name the actual first and last delegated curves",
      );
    for (const boundary of family.boundaries) {
      const curve:
        | IAutoMovieContourLoft64.ISection["loops"][number]["curve"]
        | undefined = curves.get(boundary.curveName);
      if (
        !curve ||
        !curve.closed ||
        curve.unit !== "mm" ||
        curve.phaseUnit !== "normalized" ||
        curve.spans.length !== boundary.controlIds.length ||
        curve.phaseIntervals.length !== boundary.phaseIntervals.length ||
        curve.phaseIntervals.some(
          (width: number, i: number): boolean =>
            width !== boundary.phaseIntervals[i],
        )
      )
        throw new Error(
          "Tensor end curve and saved contour authority disagree",
        );
      for (let span: number = 0; span < boundary.controlIds.length; span++) {
        if (boundary.controlIds[span]!.length !== 4)
          throw new Error("A tensor end span requires four coefficient IDs");
        for (let k: number = 0; k < 4; k++) {
          const id: number = boundary.controlIds[span]![k]!;
          const point: (typeof family.geometry.controls)[number] | undefined =
            family.geometry.controls[id];
          const saved: readonly number[] = curve.spans[span]![k]!;
          if (
            id < 0 ||
            !point ||
            saved[0] * 0.001 !== point.x ||
            saved[1] * 0.001 !== point.y ||
            saved[2] * 0.001 !== point.z
          )
            throw new Error(
              "Tensor endpoint coefficients do not share the published curve's forward unit authority",
            );
        }
      }
    }
  }
  const parts: IAutoMovieModel["parts"] = [],
    construction: IAutoMovieRecoveryTensorRealization["construction"] = [];
  const reports: IAutoMovieRecoveryTensorRealization["reports"] = [];
  for (const family of bundle.tensorFamilies ?? []) {
    const generated: IAutoMovieRecoveryAtlasGeneration = realize(
      family.geometry,
    );
    if (generated.mesh.indices!.length)
      parts.push({
        id: family.id,
        name: null,
        geometry: { type: "mesh", mesh: generated.mesh },
        material: null,
        attachedBone: null,
        transform: null,
      });
    reports.push({
      id: family.id,
      delegatedGroups: family.replacedGroups.map(
        (
          address: (typeof family.replacedGroups)[number],
        ): { interval: number; group: number } => ({
          interval: address.interval,
          group: address.group,
        }),
      ),
      endCurves: family.boundaries.map(
        (boundary: (typeof family.boundaries)[number]): string =>
          boundary.curveName,
      ),
      complete: generated.complete,
      approximationQualified: generated.approximationQualified,
      counts: generated.counts,
      primitiveRanges: generated.primitiveRanges,
      diagnostics: generated.diagnostics,
    });
    const lines: Set<string> = new Set();
    for (const patch of family.geometry.patches)
      for (let direction: number = 0; direction < 2; direction++)
        for (let row: number = 0; row < 4; row++) {
          const ids: number[] = [0, 1, 2, 3].map(
            (k: number): number =>
              patch.controlIds[direction === 0 ? row * 4 + k : k * 4 + row]!,
          );
          const key: string = ids.join(":");
          if (lines.has(key)) continue;
          lines.add(key);
          construction.push({
            id: `${family.id}.control-net.${patch.id}.${direction}.${row}`,
            closed: false,
            points: ids.map((id: number): [number, number, number] => {
              const p: (typeof family.geometry.controls)[number] =
                family.geometry.controls[id]!;
              return [p.x, p.y, p.z];
            }),
          });
        }
  }
  return { parts, construction, replacements, reports };
}
