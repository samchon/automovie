import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryObservationAnchor,
  IAutoMovieRecoveryObservationChart,
  IAutoMovieRecoveryObservationChartSeed,
  IAutoMovieRecoveryObservationEntry,
  IAutoMovieRecoveryObservationProvenance,
  IAutoMovieRecoveryObservationTangents,
  IAutoMovieRecoveryObservationTransport,
  IAutoMovieRecoveryObservationTransportRefused,
} from "@automovie/interface";

/*
 * Transport a closed observation chart through uniquely ordered persistent
 * anchors. Incoming anchor phases stay fixed; intervening observations use
 * physical PL arc fractions. A crossing of the incoming seam inserts one
 * observed-edge point. This is an inferred geometric parameter map, not
 * measured material motion or a longitudinal source guide. Refusal leaves the
 * original course with its caller. Points use millimetres, phases use a
 * normalized periodic chart and tangents are unit directions. Source arrays
 * remain immutable during and after the call.
 */
export function transportAutoMovieRecoveryObservationChart(
  previous: IAutoMovieRecoveryObservationChartSeed,
  current: IAutoMovieRecoveryObservationChart,
  relation: string,
): IAutoMovieRecoveryObservationTransport {
  const refuse: (
    reason: string,
  ) => IAutoMovieRecoveryObservationTransportRefused = (
    reason: string,
  ): IAutoMovieRecoveryObservationTransportRefused => ({
    admitted: false,
    diagnostics: [reason],
    originalCourseRetainedByCaller: true,
  });
  const sub: (
    a: Readonly<AutoMovieVector3Tuple>,
    b: Readonly<AutoMovieVector3Tuple>,
  ) => Readonly<AutoMovieVector3Tuple> = (
    a: Readonly<AutoMovieVector3Tuple>,
    b: Readonly<AutoMovieVector3Tuple>,
  ): Readonly<AutoMovieVector3Tuple> => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const norm: (a: Readonly<AutoMovieVector3Tuple>) => number = (
    a: Readonly<AutoMovieVector3Tuple>,
  ): number => Math.hypot(...a);
  const unit: (
    a: Readonly<AutoMovieVector3Tuple>,
  ) => Readonly<AutoMovieVector3Tuple> = (
    a: Readonly<AutoMovieVector3Tuple>,
  ): Readonly<AutoMovieVector3Tuple> => {
    const size: number = norm(a);
    if (!(size > 0)) throw new Error("Unresolved observed tangent");
    return [a[0] / size, a[1] / size, a[2] / size];
  };
  const negate: (
    a: Readonly<AutoMovieVector3Tuple>,
  ) => Readonly<AutoMovieVector3Tuple> = (
    a: Readonly<AutoMovieVector3Tuple>,
  ): Readonly<AutoMovieVector3Tuple> => [-a[0], -a[1], -a[2]];
  const mix: (
    a: Readonly<AutoMovieVector3Tuple>,
    b: Readonly<AutoMovieVector3Tuple>,
    t: number,
  ) => Readonly<AutoMovieVector3Tuple> = (
    a: Readonly<AutoMovieVector3Tuple>,
    b: Readonly<AutoMovieVector3Tuple>,
    t: number,
  ): Readonly<AutoMovieVector3Tuple> => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
  if (relation !== "ordinary-ordered")
    return refuse(
      "This transport requires an observed ordinary ordered relation; it does not infer event attachments",
    );
  const np: number = previous.pointsMm.length,
    n: number = current.pointsMm.length;
  if (
    np < 3 ||
    n < 3 ||
    previous.anchorIds.length !== np ||
    current.anchorIds.length !== n
  )
    throw new Error("Malformed closed observation chart");
  const finite: (
    points: readonly Readonly<AutoMovieVector3Tuple>[],
  ) => boolean = (
    points: readonly Readonly<AutoMovieVector3Tuple>[],
  ): boolean =>
    points.every(
      (point: Readonly<AutoMovieVector3Tuple>): boolean => point.length === 3,
    );
  if (!finite(previous.pointsMm) || !finite(current.pointsMm))
    throw new Error("Nonfinite physical observation");
  for (const index of [...current.corners, ...current.schedule])
    if (index < 0 || index >= n)
      throw new Error(
        "Feature and schedule addresses must name current observations",
      );
  let previousPhase: readonly number[] | undefined = previous.phase;
  if (!previousPhase) {
    const cumulative: number[] = [0];
    for (let i: number = 0; i < np; i++)
      cumulative.push(
        cumulative.at(-1)! +
          norm(sub(previous.pointsMm[(i + 1) % np]!, previous.pointsMm[i]!)),
      );
    const length: number = cumulative.at(-1)!;
    if (!(length > 0))
      return refuse("The seed observed cycle has no physical length");
    const normalized: number[] = cumulative.map(
      (value: number): number => value / length,
    );
    normalized[np] = 1;
    previousPhase = normalized;
  }
  if (
    previousPhase.length !== np + 1 ||
    previousPhase[0] !== 0 ||
    previousPhase.at(-1) !== 1 ||
    previousPhase.some(
      (u: number, i: number): boolean => i > 0 && u <= previousPhase![i - 1]!,
    )
  )
    return refuse(
      "The incoming canonical chart is not finite, periodic and strictly increasing",
    );
  const unique: (ids: readonly (string | null)[]) => Map<string, number> = (
    ids: readonly (string | null)[],
  ): Map<string, number> => {
    const map: Map<string, number> = new Map();
    ids.forEach((id: string | null, i: number): void => {
      if (id !== null) map.set(id, map.has(id) ? -1 : i);
    });
    return map;
  };
  const pm: Map<string, number> = unique(previous.anchorIds),
    cm: Map<string, number> = unique(current.anchorIds);
  const anchors: IAutoMovieRecoveryObservationAnchor[] = [...pm]
    .filter(
      ([id, i]: [string, number]): boolean => i >= 0 && (cm.get(id) ?? -1) >= 0,
    )
    .map(
      ([id, i]: [string, number]): IAutoMovieRecoveryObservationAnchor => ({
        id,
        previousIndex: i,
        phase: previousPhase![i]!,
        currentIndex: cm.get(id)!,
      }),
    )
    .sort(
      (
        a: IAutoMovieRecoveryObservationAnchor,
        b: IAutoMovieRecoveryObservationAnchor,
      ): number => a.phase - b.phase,
    );
  if (anchors.length < 3)
    return refuse(
      "At least three uniquely ordered persistent anchors are required for this ordinary transport",
    );
  const ids: string[] = anchors.map(
      (anchor: IAutoMovieRecoveryObservationAnchor): string => anchor.id,
    ),
    selected: Set<string> = new Set(ids),
    start: number = anchors[0]!.currentIndex;
  const ordered: (direction: 1 | -1) => string[] = (
    direction: 1 | -1,
  ): string[] =>
    Array.from(
      { length: n },
      (_: unknown, j: number): string | null =>
        current.anchorIds[(start + direction * j + n) % n]!,
    ).filter(
      (id: string | null): id is string => id !== null && selected.has(id),
    );
  let direction: 1 | -1 = 1;
  if (!ordered(1).every((id: string, i: number): boolean => id === ids[i])) {
    direction = -1;
    if (!ordered(-1).every((id: string, i: number): boolean => id === ids[i]))
      return refuse(
        "Persistent anchor order conflicts; no coordinate matching resolves it",
      );
  }
  const indices: number[] = Array.from(
    { length: n },
    (_: unknown, j: number): number => (start + direction * j + n) % n,
  );
  const slots: Map<number, number> = new Map(
    indices.map((index: number, i: number): [number, number] => [index, i]),
  );
  const points: Readonly<AutoMovieVector3Tuple>[] = indices.map(
      (i: number): Readonly<AutoMovieVector3Tuple> => current.pointsMm[i]!,
    ),
    cumulative: number[] = [0];
  for (let i: number = 0; i < n; i++) {
    const distance: number = norm(sub(points[(i + 1) % n]!, points[i]!)),
      sum: number = cumulative.at(-1)! + distance;
    if (!(distance > 0 && sum > cumulative.at(-1)!))
      return refuse(
        "Current observed edges are not finite and representably increasing",
      );
    cumulative.push(sum);
  }
  const anchorIndices: number[] = anchors.map(
    (anchor: IAutoMovieRecoveryObservationAnchor): number =>
      slots.get(anchor.currentIndex)!,
  );
  const unwrapped: number[] = Array.from(
    { length: n + 1 },
    (): number => Number.NaN,
  );
  unwrapped[n] = anchors[0]!.phase + 1;
  for (let j: number = 0; j < anchors.length; j++) {
    const a: number = anchorIndices[j]!,
      b: number = j + 1 < anchors.length ? anchorIndices[j + 1]! : n;
    const u: number = anchors[j]!.phase,
      v: number =
        j + 1 < anchors.length ? anchors[j + 1]!.phase : anchors[0]!.phase + 1;
    const denominator: number = cumulative[b]! - cumulative[a]!;
    for (let i: number = a; i < b; i++)
      unwrapped[i] =
        i === a
          ? u
          : u + ((v - u) * (cumulative[i]! - cumulative[a]!)) / denominator;
  }
  if (
    unwrapped.some(
      (u: number, i: number): boolean => i > 0 && u <= unwrapped[i - 1]!,
    )
  )
    return refuse(
      "Transport collapses a phase interval in binary64; original geometry is retained",
    );
  const cornerSet: Set<number> = new Set(current.corners),
    scheduleSet: Set<number> = new Set(current.schedule);
  const entries: IAutoMovieRecoveryObservationEntry[] = indices.map(
    (sourceIndex: number, i: number): IAutoMovieRecoveryObservationEntry => {
      const p: Readonly<AutoMovieVector3Tuple> = points[i]!,
        left: Readonly<AutoMovieVector3Tuple> = sub(
          p,
          points[(i + n - 1) % n]!,
        ),
        right: Readonly<AutoMovieVector3Tuple> = sub(points[(i + 1) % n]!, p);
      const corner: boolean = cornerSet.has(sourceIndex),
        tangent: Readonly<AutoMovieVector3Tuple> | null = corner
          ? null
          : unit(sub(points[(i + 1) % n]!, points[(i + n - 1) % n]!));
      return {
        phase: unwrapped[i]! >= 1 ? unwrapped[i]! - 1 : unwrapped[i]!,
        point: p,
        anchorId: current.anchorIds[sourceIndex]!,
        corner,
        schedule: scheduleSet.has(sourceIndex),
        tangents: {
          out: corner ? unit(right) : tangent!,
          incoming: negate(corner ? unit(left) : tangent!),
        },
        provenance: { kind: "observed-point", sourceIndex },
      };
    },
  );
  let virtualSeam: boolean = false;
  if (
    !entries.some(
      (entry: IAutoMovieRecoveryObservationEntry): boolean => entry.phase === 0,
    )
  ) {
    let i: number = 0;
    while (i < n && unwrapped[i + 1]! < 1) i++;
    if (i >= n || !(unwrapped[i]! < 1 && unwrapped[i + 1]! > 1))
      return refuse("Canonical seam has no representable source-edge inverse");
    const t: number = (1 - unwrapped[i]!) / (unwrapped[i + 1]! - unwrapped[i]!);
    if (!(t > 0 && t < 1))
      return refuse(
        "The inferred seam inverse collapses onto an endpoint in finite arithmetic",
      );
    const tangent: Readonly<AutoMovieVector3Tuple> = unit(
      sub(points[(i + 1) % n]!, points[i]!),
    );
    entries.push({
      phase: 0,
      point: mix(points[i]!, points[(i + 1) % n]!, t),
      anchorId: null,
      corner: false,
      schedule: true,
      tangents: { out: tangent, incoming: negate(tangent) },
      provenance: {
        kind: "observed-PL-interior",
        sourceEdge: [indices[i]!, indices[(i + 1) % n]!],
        fraction: t,
      },
    });
    virtualSeam = true;
  }
  entries.sort(
    (
      a: IAutoMovieRecoveryObservationEntry,
      b: IAutoMovieRecoveryObservationEntry,
    ): number => a.phase - b.phase,
  );
  if (
    entries.some(
      (entry: IAutoMovieRecoveryObservationEntry, i: number): boolean =>
        entry.phase < 0 ||
        entry.phase >= 1 ||
        (i > 0 && entry.phase <= entries[i - 1]!.phase),
    )
  )
    return refuse(
      "Transported cyclic requests are not distinct; no epsilon merge is performed",
    );
  const phase: number[] = entries.map(
    (entry: IAutoMovieRecoveryObservationEntry): number => entry.phase,
  );
  phase.push(1);
  return {
    admitted: true,
    row: {
      name: current.name,
      pointsMm: entries.map(
        (
          entry: IAutoMovieRecoveryObservationEntry,
        ): Readonly<AutoMovieVector3Tuple> => [...entry.point],
      ),
      anchorIds: entries.map(
        (entry: IAutoMovieRecoveryObservationEntry): string | null =>
          entry.anchorId,
      ),
      corners: entries.flatMap(
        (entry: IAutoMovieRecoveryObservationEntry, i: number): number[] =>
          entry.corner ? [i] : [],
      ),
      schedule: [
        ...new Set([
          0,
          ...entries.flatMap(
            (entry: IAutoMovieRecoveryObservationEntry, i: number): number[] =>
              entry.schedule ? [i] : [],
          ),
        ]),
      ],
      tangents: entries.map(
        (
          entry: IAutoMovieRecoveryObservationEntry,
        ): IAutoMovieRecoveryObservationTangents => entry.tangents,
      ),
      phase,
    },
    persistentAnchors: anchors,
    direction,
    virtualSeam,
    provenance: entries.map(
      (
        entry: IAutoMovieRecoveryObservationEntry,
      ): IAutoMovieRecoveryObservationProvenance => entry.provenance,
    ),
    originalObservationCount: n,
    originalPointsRetained:
      entries.filter(
        (entry: IAutoMovieRecoveryObservationEntry): boolean =>
          entry.provenance.kind === "observed-point",
      ).length === n,
    materialCorrespondenceQualified: false,
    sourceGuideQualified: false,
  };
}
