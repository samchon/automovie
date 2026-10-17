import {
  type IAutoMovieCurve64 as C,
  AutoMovieCurveMath64 as M,
} from "@automovie/engine";

import { PelvisLongitudinalFamily } from "./PelvisLongitudinalFamily";
import type { PelvisMeasurements as P } from "./PelvisMeasurements";
import { PelvisSectionRules as S } from "./PelvisSectionRules";

/** Generate native-root-chart merged and paired longitudinal fields from named stations and the actual upstream waist/full jet. Branch support derivatives reconcile the two fields. Legacy V17 uses vertical near/floor jets; the explicit crown-direction policy retains the generated support/handle directions. Sections and fixed-node guides evaluate these same fields. Parent placement is supplied by sidePoint and does not imply a posture conversion; callers own admissible topology and station correspondence.
 *
 * @author Samchon
 */
export function generatePelvisOwnedFamily(props: {
  /** Named physical measurement input resolved before generation; no generated curve or reference control table is an input.
   */
  measurements: P.Input;

  /** Explicit support/roof topology selection: fourteen-lane external R6b or sixteen-lane interior V17.
   */
  epoch: P.Epoch;

  /** Legacy V17 retains vertical internal endpoint jets. Public crown-owned pants retain the actual station-derived narrowing and envelope directions instead. External waist and midpoint full jets are unaffected. */
  interiorEndpointPolicy?: "vertical" | "crown-direction";

  /** Actual upstream twelve-span canonical waist already expressed in the native root chart, including its complete physical-Y jet.
   */
  waist: C.Boundary;

  /** Optional point placement for each thigh in the native root chart; omission clones the native coordinates.
   */
  sidePoint?: (point: M.V, side: P.Side) => M.V;
}): {
  /** Explicit support/roof topology selection: fourteen-lane external R6b or sixteen-lane interior V17.
   */
  epoch: P.Epoch;

  /** One continuous merged-body support/handle family from body floor to canonical waist.
   */
  merged: PelvisLongitudinalFamily;

  /** Left and right continuous lower-thigh support/handle families; their lower endpoints own leg ports.
   */
  paired: Record<P.Side, PelvisLongitudinalFamily>;

  /** Sections and guides evaluated from these same generating fields, with engineering closures separately identified.
   */
  curves: {
    /** Semantic course identifier used in emitted curve names and inspection; it does not select a calibration identity.
     */
    name: string;

    /** Whether the last span returns to the first; an open guide is not implicitly capped.
     */
    closed: boolean;

    /** Ordered cubic Bernstein coefficients; positions use millimetres and derivative fields use their enclosing declared units.
     */
    spans: M.Span[];

    /** Positive span widths in the declared phase unit; closed published courses normalize these widths to one turn.
     */
    phaseIntervals: number[];

    /** Inspection role separating ordinary sections/guides from auxiliary engineering closures.
     */
    role: string;
  }[];

  /** Recovered twelve-span waist positions in native millimetres after coalescing exact subdivisions.
   */
  waistControls: M.Span[];

  /** Recovered complete waist control jet dP/dY in mm/mm, without discarding tangential components.
   */
  waistFullJ: M.Span[];

  /** Original upstream twelve angular widths in turns, preserved separately from internal expanded widths.
   */
  waistPhaseTurns: number[];

  /** Description of the native millimetre/physical-Y chart and its unproven conversion to the current neutral rest form.
   */
  nativeChart: string;
} {
  const p: P.Input = props.measurements,
    epoch: P.Epoch = props.epoch;
  const sidePoint: (point: M.V, side: P.Side) => M.V =
    props.sidePoint ?? ((point: M.V): M.V => M.clone(point));
  const waist: M.Span[] = props.waist.section.spans.map(
    (span: C.Span): M.Span => span.map(M.clone) as M.Span,
  );
  const jet: M.Span[] = props.waist.fullJ.map(
    (span: C.Span): M.Span => span.map(M.clone) as M.Span,
  );
  const phaseTurns: number[] = [...props.waist.section.phaseIntervals];
  const originalWidths: number[] = phaseTurns.map(
    (w: number): number => w * 12,
  );

  /** Derive anterior-lane cubic X fields from placed thigh supports, distal finite-difference dX/dY and the actual waist full jet. A nonpositive thigh-to-waist height interval rejects.
   */
  const fan: S.Fan = S.fan(p, waist, jet, sidePoint);
  const expanded: ReturnType<typeof S.expand> = S.expand(
    waist,
    originalWidths,
    jet,
    epoch,
  );
  const widths: number[] = expanded.widths;
  const rows: P.MergedStation[] = p.mergedStations;
  const stations: M.Span[][] = rows.map((row: P.MergedStation): M.Span[] =>
    S.station(p, row, widths, fan, epoch),
  );
  if (epoch === "interior-v17") stations.push(expanded.spans);
  else stations[stations.length - 1] = expanded.spans;
  const points: M.V[][] = stations.map((section: M.Span[]): M.V[] =>
    section.map((s: M.Span): M.V => M.clone(s[0])),
  );
  const handles: M.V[][] = stations.map((section: M.Span[]): M.V[] =>
    section.map(
      (s: M.Span, i: number): M.V => M.scale(M.sub(s[1], s[0]), 1 / widths[i]!),
    ),
  );
  const ys: number[] = points.map((row: M.V[]): number => row[0]![1]);
  const names: readonly string[] =
    epoch === "interior-v17" ? S.lanes16 : S.lanes14;
  const index: (name: string) => number = (name: string): number => {
    const n: number = names.indexOf(name);
    if (n < 0) throw new Error("Unknown semantic pelvis support");
    return n;
  };

  /** Construct four cardinal thigh supports in native millimetres from full breadth/depth, center and dimensionless phase offsets; nonpositive breadth or depth rejects.
   */
  const paired: Partial<Record<P.Side, PelvisLongitudinalFamily>> = {};
  for (const side of ["left", "right"] as const) {
    const ps: P.PairedStation[] = p.pairedStations[side];
    const native: M.V[][] = ps.map((s: P.PairedStation): M.V[] =>
      S.paired(s, p.frame),
    );
    const qy: number[] = native.map((row: M.V[]): number => row[0]![1]);
    const q: M.V[][] = native.map((row: M.V[]): M.V[] =>
      row.map((v: M.V): M.V => sidePoint(v, side)),
    );
    const pw: number[] = p.pairedPhaseIntervals?.[side] ?? [1, 1, 1, 1];
    const outgoing: M.V[][] = q.map((row: M.V[], i: number): M.V[] =>
      M.angular(row, pw).map(
        (v: M.V, n: number): M.V =>
          M.scale(v, S.gains(ps[i]!, p.pairedRounding[side])[n]!),
      ),
    );
    const incoming: M.V[][] = q.map((row: M.V[], i: number): M.V[] =>
      M.angular(row, pw).map(
        (v: M.V, n: number): M.V =>
          M.scale(v, S.gains(ps[i]!, p.pairedRounding[side], true)[n]!),
      ),
    );
    const belowNative: M.V[] = S.paired(
      p.thighDerivativeContext[side],
      p.frame,
    );
    const by: number = belowNative[0]![1];
    const below: M.V[] = belowNative.map((v: M.V): M.V => sidePoint(v, side));
    const belowHandles: M.V[] = M.angular(below, pw).map(
      (v: M.V, n: number): M.V => M.scale(v, p.pairedRounding[side][n]!),
    );
    const dp: M.V[] = q[0]!.map(
      (v: M.V, n: number): M.V =>
        M.scale(M.sub(v, below[n]!), 1 / (qy[0]! - by)),
    );
    const dh: M.V[] = outgoing[0]!.map(
      (v: M.V, n: number): M.V =>
        M.scale(M.sub(v, belowHandles[n]!), 1 / (qy[0]! - by)),
    );
    paired[side] = new PelvisLongitudinalFamily({
      ys: qy,
      points: q,
      handles: outgoing,
      incoming,
      widths: pw,
      startJet: M.spans(dp, dh, pw),
    });
  }
  const families: Record<P.Side, PelvisLongitudinalFamily> = paired as Record<
    P.Side,
    PelvisLongitudinalFamily
  >;
  const branches: {
    /** Anatomical side used to select the explicit paired family and placement.
     */
    side: P.Side;

    /** Cardinal support index in the paired family: outer 0, anterior 1 or posterior 3 for these branch guides.
     */
    pairedNode: number;

    /** Corresponding semantic node index in the selected merged-body topology.
     */
    bodyNode: number;

    /** Semantic branch name shared by its paired and merged guide segments.
     */
    label: string;

    /** Ordered cubic Bernstein coefficients; positions use millimetres and derivative fields use their enclosing declared units.
     */
    spans: M.Span[];

    /** Support dP/dY in mm/mm at the upper paired course, used to reconcile the branch guide.
     */
    nearDerivative: M.V;
  }[] = [];
  const initialJets: Map<number, M.V> = new Map();
  for (const side of ["left", "right"] as const) {
    const f: PelvisLongitudinalFamily = families[side];
    for (const [node, semantic, label] of [
      [0, side === "left" ? "leftLateral" : "rightLateral", "lateral"],
      [
        1,
        side === "left" ? "leftAnteriorLane" : "rightAnteriorLane",
        "anteriorLane",
      ],
      [
        3,
        side === "left" ? "leftPosteriorLane" : "rightPosteriorLane",
        "posteriorLane",
      ],
    ] as const) {
      const bodyNode: number = index(semantic),
        allY: number[] = [...f.ys, ...ys];
      const allPoints: M.V[] = [
        ...f.points.map((row: M.V[]): M.V => row[node]!),
        ...points.map((row: M.V[]): M.V => row[bodyNode]!),
      ];
      const d: M.V[] = M.fieldSlopes(
        allY,
        allPoints.map((v: M.V): M.V[] => [v]),
      ).map((row: M.V[]): M.V => row[0]!);
      const nearDerivative: M.V = M.clone(d[f.ys.length - 1]!);
      initialJets.set(bodyNode, M.clone(d[f.ys.length]!));
      d[0] = M.clone(f.dp[0]![node]!);
      d[d.length - 1] = M.clone(expanded.jet[bodyNode]![0]);

      /** Build a periodic cubic course from supports and one-third angular derivatives. Each outgoing and next incoming handle uses that span's width; array layouts must correspond.
       */
      const spans: M.Span[] = allPoints
        .slice(0, -1)
        .map(
          (v: M.V, i: number): M.Span =>
            M.hermite(
              v,
              allPoints[i + 1]!,
              d[i]!,
              d[i + 1]!,
              allY[i + 1]! - allY[i]!,
            ),
        );
      branches.push({
        side,
        pairedNode: node,
        bodyNode,
        label,
        spans,
        nearDerivative,
      });
    }
  }
  const merged: PelvisLongitudinalFamily = new PelvisLongitudinalFamily({
    ys,
    points,
    handles,
    widths,
    endJet: expanded.jet,
    initialSupportJets: initialJets,
    fan: {
      leftNode: index("leftAnteriorLane"),
      rightNode: index("rightAnteriorLane"),
      value: (y: number, side: P.Side, der: boolean): number =>
        S.fanValue(fan, y, side, der),
    },
  });
  if (
    epoch === "interior-v17" &&
    props.interiorEndpointPolicy !== "crown-direction"
  ) {
    merged.dp[0] = merged.dp[0]!.map((): M.V => [0, 1, 0]);
    merged.dh[0] = merged.dh[0]!.map((): M.V => [0, 0, 0]);
    merged.rebuild();
  }
  for (const side of ["left", "right"] as const) {
    const f: PelvisLongitudinalFamily = families[side],
      end: number = f.ys.length - 1;
    for (const branch of branches.filter(
      (b: (typeof branches)[number]): boolean => b.side === side,
    ))
      f.dp[end]![branch.pairedNode] = M.clone(branch.nearDerivative);
    if (
      epoch === "interior-v17" &&
      props.interiorEndpointPolicy !== "crown-direction"
    ) {
      f.dp[end] = f.dp[end]!.map((): M.V => [0, 1, 0]);
      f.dh[end] = f.dh[end]!.map((): M.V => [0, 0, 0]);
      f.di![end] = f.di![end]!.map((): M.V => [0, 0, 0]);
    }
    f.rebuild();
  }
  const curves: {
    /** Semantic course identifier used in emitted curve names and inspection; it does not select a calibration identity.
     */
    name: string;

    /** Whether the last span returns to the first; an open guide is not implicitly capped.
     */
    closed: boolean;

    /** Ordered cubic Bernstein coefficients; positions use millimetres and derivative fields use their enclosing declared units.
     */
    spans: M.Span[];

    /** Positive span widths in the declared phase unit; closed published courses normalize these widths to one turn.
     */
    phaseIntervals: number[];

    /** Inspection role separating ordinary sections/guides from auxiliary engineering closures.
     */
    role: string;
  }[] = [];

  /** Add two vectors in the same chart and units; no placement or derivative conversion is performed.
   */
  const add: (
    name: string,
    spans: M.Span[],
    widths: number[],
    closed?: boolean,
    role?: string,
  ) => void = (
    name: string,
    spans: M.Span[],
    ws: number[],
    closed: boolean = false,
    role: string = "guide",
  ): void => {
    curves.push({ name, spans, closed, phaseIntervals: [...ws], role });
  };
  const physicalWidths: (f: PelvisLongitudinalFamily) => number[] = (
    f: PelvisLongitudinalFamily,
  ): number[] =>
    f.ys.slice(1).map((y: number, i: number): number => y - f.ys[i]!);
  if (epoch === "interior-v17")
    names.forEach((name: string, n: number): void => {
      add("pelvis.guide." + name, merged.guide(n), physicalWidths(merged));
    });
  else
    for (const name of ["anteriorMedian", "posteriorMedian"])
      add(
        "pelvis.guide." + name,
        merged.guide(index(name)),
        physicalWidths(merged),
      );
  ys.forEach((y: number, i: number): void => {
    add(
      "pelvis.section." + (rows[i]?.name ?? "canonicalWaist"),
      merged.controls(y),
      widths,
      true,
      "section",
    );
  });
  for (const side of ["left", "right"] as const) {
    const f: PelvisLongitudinalFamily = families[side];
    f.ys.forEach((y: number, i: number): void => {
      add(
        "upperThigh.section." + p.pairedStations[side][i]!.name + "." + side,
        f.controls(y),
        f.widths,
        true,
        "section",
      );
    });
    if (epoch === "interior-v17")
      ["outer", "anterior", "inner", "posterior"].forEach(
        (name: string, n: number): void => {
          add(
            "paired.guide." + side + "." + name,
            f.guide(n),
            physicalWidths(f),
          );
        },
      );
    else add("upperThigh.medial." + side, f.guide(2), physicalWidths(f));
  }
  for (const branch of branches) {
    if (epoch === "interior-v17" || branch.label === "anteriorLane") {
      const f: PelvisLongitudinalFamily = families[branch.side],
        n: number = branch.pairedNode,
        m: number = branch.bodyNode,
        dy: number = merged.ys[0]! - f.ys.at(-1)!;
      const bridge: M.Span = M.hermite(
        f.points.at(-1)![n]!,
        merged.points[0]![m]!,
        f.dp.at(-1)![n]!,
        merged.dp[0]![m]!,
        dy,
      );
      add(
        "branch." + branch.side + "." + branch.label,
        [...f.guide(n), bridge, ...merged.guide(m)],
        [...physicalWidths(f), dy, ...physicalWidths(merged)],
      );
    } else
      add("branch." + branch.side + "." + branch.label, branch.spans, [
        ...physicalWidths(families[branch.side]),
        merged.ys[0]! - families[branch.side].ys.at(-1)!,
        ...physicalWidths(merged),
      ]);
  }
  return {
    epoch,
    merged,
    paired: families,
    curves,
    waistControls: S.coalesce(merged.controls(ys.at(-1)!), widths, epoch),
    waistFullJ: S.coalesce(merged.controls(ys.at(-1)!, true), widths, epoch),
    waistPhaseTurns: phaseTurns,
    nativeChart:
      "Native source-root coordinates, mm and physical local Y. Parent resolution is separate; no silent native-A to neutral-T conversion.",
  };
}
