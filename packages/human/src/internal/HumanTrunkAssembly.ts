import type { IAutoMovieHumanBodyParameters } from "../structures/body/IAutoMovieHumanBodyParameters";
import type { HumanCurve } from "./HumanCurve";
import { HumanCurveFamily } from "./HumanCurveFamily";
import { HumanSkeleton } from "./HumanSkeleton";
import type { HumanSurface } from "./HumanSurface";
import { HumanTrunkLaw } from "../trunk/HumanTrunkLaw";
import { HumanTrunkWholeFamily } from "../trunk/HumanTrunkWholeFamily";
import type { HumanTrunkFeatureLaw } from "../trunk/HumanTrunkFeatureLaw";
import { HumanBernsteinSectionMath } from "./HumanBernsteinSectionMath";
import { HumanPiecewiseStationPort } from "./HumanPiecewiseStationPort";
import { HumanPolynomialRoots } from "./HumanPolynomialRoots";
import type { HumanStationPort } from "./HumanStationPort";

/** Main-owned affine transport of the complete nonradial trunk authority.
 * Shape retains physical millimetres. Source station Y and world station s
 * have one affine map; every station derivative consumes its inverse Jacobian.
 * Each actual boundary object is transported once and borrowed by its incident
 * patches. No radial section is interpolated and no side jet is averaged.
 */
export namespace HumanTrunkAssembly {
  type V = HumanCurve.Vector;

  /** The same source function, world function and eight-piece surface graph. */
  export interface Result {
    /** Complete source gauge retained for explicit phase and coefficient queries. */
    source: HumanTrunkWholeFamily.Family;
    /** World metadata plus the exact fixed-feature canonical-radian evaluator. */
    family: HumanCurveFamily.Family;
    /** Separate restrictions preserve every circumferential C0 edge. */
    patches: readonly HumanSurface.Patch[];
    /** Exact source-station to world-station affine map. */
    worldStation: (sourceMm: number) => number;
    /** Exact world jet from one original source-side jet and physical station. */
    worldJet: (sourceMm: number, jet: HumanCurveFamily.Jet) => HumanCurveFamily.Jet;
    /** Shared transported original boundary objects. */
    boundaries: readonly HumanSurface.Boundary[];
    /** The same actual eight-piece Hip function consumed by pelvic guides. */
    hip: HumanStationPort.Result;
    /** Every complete/partial root query remains owned by this assembly. */
    hipQueries: readonly HumanPiecewiseStationPort.Query[];
    /** Source shape versus generated-world and clinical qualification. */
    limitations: readonly string[];
  }

  /** Consume only the native scalar gauge and the identified whole-vector law.
   * Native/event addresses are retained explicitly so endpoint queries do not
   * leave a strict source domain through a rounded inverse affine calculation.
   */
  export function build(body: IAutoMovieHumanBodyParameters, skeleton: HumanSkeleton.Result): Result {
    const gauge: HumanTrunkLaw.Gauge = HumanTrunkLaw.build(body);
    const ids: readonly string[] = ["hip", "highHip", "waist", "underbust", "chest"];
    const native: HumanCurve.Section[] = ids.map((id: string): HumanCurve.Section => {
      const section: HumanCurve.Section | undefined = gauge.sections.find((item: HumanCurve.Section): boolean => item.id === "trunk." + id);
      if (section === undefined) throw new Error("Missing original native scalar station " + id);
      return section;
    });
    const hip: number | null = body.controls.hip.value, shape: number | null = body.controls.masculineFeminine.value;
    if (hip === null || shape === null) throw new Error("Whole trunk requires actual native Hip and shape");
    const source: HumanTrunkWholeFamily.Family = HumanTrunkWholeFamily.build({
      nativeStationsMm: native.map((item: HumanCurve.Section): number => item.stationMm) as [number, number, number, number, number],
      pelvisReferenceMm: skeleton.trunkFrame.referencePelvisMm, nativeHipGirthMm: hip, shape,
      nativeGirthJet: gauge.nativeGirthJet,
    });
    const lo: number = source.domainMm[0], hi: number = source.domainMm[1];
    const anchor: V = [skeleton.trunkFrame.referencePelvisMm[0], lo, skeleton.trunkFrame.referencePelvisMm[2]];
    const upper: V = [anchor[0], hi, anchor[2]];
    const displacement: V = difference(HumanSkeleton.mapTrunkOrigin(skeleton, anchor), anchor);
    const slope: V = difference(difference(HumanSkeleton.mapTrunkOrigin(skeleton, upper), upper), displacement)
      .map((x: number): number => x / (hi - lo)) as V;
    const a: number = 1 + slope[1], start: number = lo + displacement[1];
    if (!(a > 0 && Number.isFinite(a)) || !slope.every(Number.isFinite)) throw new Error("Whole trunk has a collapsed common affine station gauge");
    const worldStation: (y: number) => number = (y: number): number => start + a * (y - lo);
    const addresses: Map<number, number> = new Map(source.principals.map((p: HumanTrunkWholeFamily.Principal): [number, number] => [worldStation(p.stationMm), p.stationMm]));
    if (addresses.size !== source.principals.length) throw new Error("Distinct trunk principals collapse in the world station gauge");
    const sourceStation: (s: number) => number = (s: number): number => addresses.get(s) ?? lo + (s - start) / a;
    const point: (y: number, p: V) => V = (y: number, p: V): V => p.map((x: number, k: number): number =>
      k === 1 ? worldStation(y) : x + displacement[k]! + (y - lo) * slope[k]!) as V;
    const worldJet: Result["worldJet"] = (y: number, j: HumanCurveFamily.Jet): HumanCurveFamily.Jet => ({
      positionMm: point(y, j.positionMm),
      longitudinalDerivative: j.longitudinalDerivative.map((x: number, k: number): number => (x + slope[k]!) / a) as V,
      phaseDerivativeMmPerRadian: j.phaseDerivativeMmPerRadian,
      longitudinalPhaseDerivativePerRadian: scale(j.longitudinalPhaseDerivativePerRadian, 1 / a),
      ...(j.longitudinalSecondDerivative === undefined ? {} : { longitudinalSecondDerivative: scale(j.longitudinalSecondDerivative, 1 / (a * a)) }),
      ...(j.phaseSecondDerivativeMmPerRadianSquared === undefined ? {} : { phaseSecondDerivativeMmPerRadianSquared: j.phaseSecondDerivativeMmPerRadianSquared }),
      ...(j.longitudinalPhaseSecondDerivativePerRadianSquared === undefined ? {} : { longitudinalPhaseSecondDerivativePerRadianSquared: scale(j.longitudinalPhaseSecondDerivativePerRadianSquared, 1 / a) }),
    });
    const transported: Map<HumanSurface.Boundary, HumanSurface.Boundary> = new Map();
    const boundary: (original: HumanSurface.Boundary, y?: number) => HumanSurface.Boundary = (original: HumanSurface.Boundary, y?: number): HumanSurface.Boundary => {
      const prior: HumanSurface.Boundary | undefined = transported.get(original);
      if (prior !== undefined) return prior;
      const horizontal: boolean = y !== undefined;
      const result: HumanSurface.Boundary = { id: original.id, unit: horizontal ? original.unit : "mm",
        start: horizontal ? original.start : worldStation(original.start), end: horizontal ? original.end : worldStation(original.end),
        evaluate: (t: number): V => { const sy: number = horizontal ? y! : sourceStation(t); return point(sy, original.evaluate(horizontal ? t : sy)); },
        derivative: (t: number): V => {
          const d: V = original.derivative(horizontal ? t : sourceStation(t));
          return horizontal ? d : d.map((x: number, k: number): number => (x + slope[k]!) / a) as V;
        },
      };
      transported.set(original, result); return result;
    };
    for (const p of source.principals) for (const curve of p.arcBoundaries) boundary(curve, p.stationMm);
    const patches: HumanSurface.Patch[] = source.patches.map((patch: HumanSurface.Patch): HumanSurface.Patch => {
      const startSource: number = patch.u.start, endSource: number = patch.u.end;
      const startWorld: number = worldStation(startSource), endWorld: number = worldStation(endSource);
      const inverse: (s: number) => number = (s: number): number => s === startWorld ? startSource : s === endWorld ? endSource : sourceStation(s);
      return { ...patch, u: { ...patch.u, start: startWorld, end: endWorld },
        jet: (s: number, t: number): ReturnType<HumanSurface.Patch["jet"]> => {
          const y: number = inverse(s), j: ReturnType<HumanSurface.Patch["jet"]> = patch.jet(y, t);
          return { positionMm: point(y, j.positionMm), derivativeU: j.derivativeU.map((x: number, k: number): number => (x + slope[k]!) / a) as V, derivativeV: j.derivativeV };
        },
        boundaries: { u0: { ...patch.boundaries.u0, curve: boundary(patch.boundaries.u0.curve, startSource) },
          u1: { ...patch.boundaries.u1, curve: boundary(patch.boundaries.u1.curve, endSource) },
          v0: { ...patch.boundaries.v0, curve: boundary(patch.boundaries.v0.curve) },
          v1: { ...patch.boundaries.v1, curve: boundary(patch.boundaries.v1.curve) } },
        ...(patch.sampling === undefined ? {} : { sampling: { ...patch.sampling, ...(patch.sampling.u === undefined ? {} : { u: patch.sampling.u.map(worldStation) }) } }),
      };
    });
    const mathPolicy: HumanBernsteinSectionMath.Policy = { maxDegree: 32, maxPieces: 64,
      maxOperations: 200000, maxRelativeAreaRoundoff: Math.sqrt(Number.EPSILON) };
    const coefficients: (s: HumanTrunkFeatureLaw.Section) => HumanBernsteinSectionMath.Piece[] =
      (s: HumanTrunkFeatureLaw.Section): HumanBernsteinSectionMath.Piece[] => s.primitive.pieces.map((p, i: number): HumanBernsteinSectionMath.Piece => {
        if (p.primitive !== "polynomialBezier") throw new Error("Whole trunk coefficient consumer does not support rational conversion");
        return { id: "trunk.arc." + i, primitive: p.primitive, degree: p.degree,
          controlsMm: p.controls.map((v): V => [v[0], v[1], v[2]]),
          firstPerMm: s.firstCoefficientFields[i]!, secondPerMmSquared: s.secondCoefficientFields[i]! };
      });
    const centroid: (y: number) => HumanBernsteinSectionMath.Section = (y: number): HumanBernsteinSectionMath.Section => {
      const result: HumanBernsteinSectionMath.Section = HumanBernsteinSectionMath.closedSection(coefficients(source.section(y)), y, mathPolicy);
      if (result.status !== "complete" || result.centroid === undefined) throw new Error("Whole trunk Green centroid is numerically unresolved: " + JSON.stringify(result.diagnostics));
      return result;
    };
    const sections: HumanCurve.Section[] = source.principals.map((p: HumanTrunkWholeFamily.Principal): HumanCurve.Section => ({
      id: p.id, stationMm: worldStation(p.stationMm), originMm: point(p.stationMm, centroid(p.stationMm).centroid!.positionMm),
      axisU: [1, 0, 0], axisV: [0, 0, 1], coefficientsMm: [],
    }));
    const limitations: string[] = [...source.limitations,
      "Main transports the same source vector function and its exact station Jacobian; transverse and mixed side jets retain their declared fixed-feature radians",
      "Nonradial principal metadata has no radial coefficients. Source Green area and full polynomial moments determine its rational centroid axis; no old radial volume-extremum principal is adopted",
      "Green coefficient enclosures bound binary64 algebraic conversion and integration, not source measurement uncertainty, clinical identity or global embedding",
      "Additional whole-vector area extrema are not yet isolated over the degree-13 station products. The five native and one source crease-death principal do not claim that missing scope",
    ];
    const family: HumanCurveFamily.Family = HumanCurveFamily.fromFunction(sections,
      (s: number, psi: number): HumanCurveFamily.Jet => { const y: number = sourceStation(s); return worldJet(y, source.jet(y, psi)); }, limitations);
    const axis: HumanSurface.Boundary = { id: "trunk.green-centroid-axis", unit: "mm", start, end: worldStation(hi),
      evaluate: (s: number): V => { const y: number = sourceStation(s); return point(y, centroid(y).centroid!.positionMm); },
      derivative: (s: number): V => { const y: number = sourceStation(s); return centroid(y).centroid!.firstPerMm.map((x: number, k: number): number => (x + slope[k]!) / a) as V; },
    };
    const hipBoundary: HumanSurface.Boundary = { id: "pelvis.port.hip", unit: "fixed-feature-radians", start: 0, end: 2 * Math.PI,
      evaluate: (psi: number): V => family.evaluate(start, psi), derivative: (psi: number): V => family.phaseDerivative(start, psi) };
    const hipSection: HumanTrunkFeatureLaw.Section = source.nativePrincipals[0]!.section;
    const hipPieces: HumanPiecewiseStationPort.Piece[] = coefficients(hipSection).map((piece: HumanBernsteinSectionMath.Piece, i: number): HumanPiecewiseStationPort.Piece => {
      const conversion: HumanBernsteinSectionMath.Conversion = HumanBernsteinSectionMath.convert(piece, mathPolicy);
      if (conversion.status !== "complete" || conversion.powersMm === undefined) throw new Error("Full Hip polynomial coefficient conversion is unsupported");
      return { id: piece.id, phaseStartRadians: i * 2 * Math.PI / 8, phaseWidthRadians: 2 * Math.PI / 8,
        worldPowersMm: conversion.powersMm.map((p: V, k: number): V => k === 0 ? point(lo, p) : p),
        jetAtLocal: (t: number): HumanCurveFamily.Jet => worldJet(lo, canonical(hipSection.localJet(i, t))) };
    });
    const bounds: number[] = [0, 1, 2].map((order: number): number => Math.max(...hipPieces.map((p: HumanPiecewiseStationPort.Piece): number =>
      p.worldPowersMm.reduce((sum: number, v: V, k: number): number => sum + (k < order ? 0 : (order === 0 ? 1 : order === 1 ? k : k * (k - 1)) * Math.hypot(...v) / (2 * Math.PI / 8) ** order), 0))));
    const numerical: number = 2048 * Number.EPSILON, rootWidth: number = 2 ** -44;
    const policy: HumanPiecewiseStationPort.Policy = { maxPieces: 8,
      rootBudget: { maxCoefficientCount: 33, maxDegree: 32, maxIntegerBits: 262144, maxOperations: 2000000,
        maxBisections: 4096, maxDepth: 256, maxRoots: 32, maxAbsoluteWidth: rootWidth },
      normalUnitTolerance: 64 * Number.EPSILON, ownerPositionToleranceMm: numerical * bounds[0]!,
      ownerFirstToleranceMmPerRadian: numerical * bounds[1]!, ownerSecondToleranceMmPerRadianSquared: numerical * bounds[2]!,
      planeResidualToleranceMm: numerical * bounds[0]! + rootWidth * (2 * Math.PI / 8) * bounds[1]!,
      minimumPhaseNormalSpeedMmPerRadian: Math.sqrt(Number.EPSILON) * bounds[1]!,
      minimumIntersectionTangentMmPerRadian: Math.sqrt(Number.EPSILON) * bounds[1]!,
    };
    const queries: HumanPiecewiseStationPort.Query[] = [];
    const hipPort: HumanStationPort.Result = HumanPiecewiseStationPort.toStationPort({ id: hipBoundary.id, pieces: hipPieces },
      { boundary: hipBoundary, jet: (psi: number): HumanCurveFamily.Jet => family.jet(start, psi),
        secondDerivative: (psi: number): V => family.jet(start, psi).phaseSecondDerivativeMmPerRadianSquared! },
      policy, HumanPolynomialRoots.isolate, (query: HumanPiecewiseStationPort.Query): HumanPiecewiseStationPort.Selection => {
        queries.push(query);
        if (query.status !== "complete") throw new Error("Actual whole Hip guide graph is incomplete; all roots retained: " + JSON.stringify(query));
        const groups: Map<string, HumanPiecewiseStationPort.Contact[]> = new Map();
        for (const c of query.contacts) {
          const node: number = (c.pieceIndex + (c.side === "end" ? 1 : 0)) % 8;
          const key: string = c.side === "interior" ? "interior:" + c.id : "node:" + node;
          const group: HumanPiecewiseStationPort.Contact[] = groups.get(key) ?? [];
          group.push(c); groups.set(key, group);
        }
        const selected: string[] = [];
        for (const [key, contacts] of groups) {
          if (key.startsWith("interior:")) { selected.push(contacts[0]!.id); continue; }
          const node: number = Number(key.slice(5));
          const following: HumanPiecewiseStationPort.Contact | undefined = contacts.find((c: HumanPiecewiseStationPort.Contact): boolean => c.side === "start" && c.pieceIndex === node);
          if (following === undefined || contacts.length !== 2 || !contacts.every((c: HumanPiecewiseStationPort.Contact): boolean => c.root.exactRational) ||
              (node === 4 && hipSection.posteriorEvent.featureClass === "C0"))
            throw new Error("Whole Hip endpoint contact has no qualified ordinary G1 following-side authority: " + JSON.stringify(query));
          selected.push(following.id);
        }
        if (selected.length !== 2) throw new Error("Whole Hip has more or fewer than two source-corresponding anatomical contacts; no root subset is inferred: " + JSON.stringify(query));
        return { contactIds: selected,
          reason: "All isolated interior roots are retained. Only the two exact endpoint addresses of one declared ordinary G1 node use its existing following-side canonical chart. Both original root/jet records remain in the query; C0, unpaired and extra contacts are unsupported. Main assigns roles within the same anatomical Hip port",
          evidenceId: "main.whole-hip.two-transverse-contacts.v1" };
      });
    limitations.push("Hip roots isolate every full quartic binary64 plane polynomial. Owner agreement and simple-contact floors are scale-relative numerical admissions, not coefficient-error or clinical correspondence certification");
    return { source, family, patches, hip: hipPort, hipQueries: queries, worldStation, worldJet,
      boundaries: [...transported.values(), axis, hipBoundary], limitations };
  }

  /** Preserve the actual one-sided local quartic jet in canonical feature radians. */
  export function canonical(j: HumanTrunkFeatureLaw.LocalJet): HumanCurveFamily.Jet {
    const k: number = 8 / (2 * Math.PI);
    return { positionMm: j.positionMm, longitudinalDerivative: j.derivativeY,
      phaseDerivativeMmPerRadian: scale(j.derivativeT, k), longitudinalPhaseDerivativePerRadian: scale(j.derivativeYT, k),
      longitudinalSecondDerivative: j.derivativeYY, phaseSecondDerivativeMmPerRadianSquared: scale(j.derivativeTT, k * k),
      longitudinalPhaseSecondDerivativePerRadianSquared: scale(j.derivativeYTT, k * k) };
  }

  function difference(a: V, b: V): V { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function scale(a: V, n: number): V { return [a[0] * n, a[1] * n, a[2] * n]; }
}
