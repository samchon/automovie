import { HumanRawGeometry as G } from "./HumanRawGeometry";

/** Independent complete mesh sections retain source folds instead of treating all curvature as damage. */
export namespace HumanRawProfileAudit {
  /** A fixed source-located section normal to the feature's own tangent. */
  export interface Plane {
    /** Source-only identifier; it does not certify a clinical landmark or anatomical side. */
    part: string;
    /** Fixed source location in the registered millimetre chart. */
    origin: G.Point;
    /** Feature tangent; the section plane is its orthogonal complement. */
    tangent: G.Point;
    /** Original-source provenance and geometric locator authority. */
    basis: string;
  }
  /** Every turning observation retains the original emitted face and cut coordinate. */
  export interface Turn {
    /** Index of this component in the complete section, without candidate-based cropping. */
    component: number;
    /** Original outgoing face: a representative candidate address, not source-difference attribution. */
    triangle: number;
    /** Actual cut coordinate, mm. */
    coordinate: G.Point;
    /** Signed turn relative to the traversal's winding, radians. */
    observed: number;
    /** Engineering floating-point screen, not an anatomical tolerance or certified interval. */
    arithmeticScreen: number;
  }
  /** One closed connected section component and its signed curvature observations. */
  export interface Component {
    /** All original cut points, in traversal order. */
    points: G.Point[];
    /** Per-cut coordinate roundoff screen propagated through actual edge/plane interpolation, mm. */
    pointErrorsMm: number[];
    /** All original face addresses, aligned with the outgoing point segments. */
    triangles: number[];
    /** Every positive/negative turn, including the closing seam. */
    turns: Turn[];
    /** Sum of absolute turns less absolute net turn; convex profiles have zero excess. */
    excess: number;
    /** Accumulated roundoff screen derived from coordinates and actual segment lengths. */
    arithmeticScreen: number;
    /** Polygonal perimeter in millimetres. */
    perimeterMm: number;
  }
  /** A missing, ambiguous or numerically unresolved observation is addressed explicitly. */
  export interface Refusal {
    /** Source plane identifier. */
    part: string;
    /** Original mesh face where available. */
    triangle: number | null;
    /** Actual coordinate where available. */
    coordinate: G.Point | null;
    /** Null means no valid metric was admitted. */
    observed: null;
    /** A closed, resolved section is required. */
    expected: "closed resolved complete section";
    /** No invented missing measurement. */
    deviation: null;
    /** No invented acceptance allowance. */
    tolerance: null;
    /** The refused angular observation's unit. */
    units: "rad";
    /** Exact geometry, topology or arithmetic support failure. */
    reason: string;
  }
  /** Complete sections never hide open, additional or disconnected components. */
  export interface Section {
    /** Source-fixed section contract. */
    plane: Plane;
    /** All complete connected components; no component selected by the candidate. */
    components: Component[];
    /** Every unsupported graph/geometry observation. */
    refusals: Refusal[];
  }
  /** A reference-relative curvature diagnostic, not a universal clinical failure strain. */
  export interface Report {
    /** Any unsupported section remains UNAVAILABLE; a resolved discrepancy is FAIL. */
    status: "PASS" | "FAIL" | "UNAVAILABLE";
    /** Whole-person input identifier. */
    person: string;
    /** The complete immutable source plane definition. */
    plane: Plane;
    /** Original source profile including normal anatomical concavities. */
    source: Section;
    /** Actual output section, retaining every emitted cut segment/component. */
    candidate: Section;
    /** Source-located inside-point registration; every other component remains in the complete sections. */
    registration: { sourceComponent: number | null; candidateComponent: number | null; status: "RESOLVED" | "UNAVAILABLE"; reason: string };
    /** The uniquely source-anchored component's discrepancy, independent of disconnected limb sections. */
    registeredFinding: Report["finding"];
    /** Reference-relative full-section finding; its face is a representative candidate concavity, not a matched source-error location. */
    finding: { person: string; part: string; stage: "final skin section"; direction: "source-relative complete profile"; triangle: number | null; coordinate: G.Point | null; observed: number; expected: number; deviation: number; tolerance: number; units: "rad"; reason: string } | null;
  }

  /**
   * Compare total concave turning of complete fixed sections, retaining source grooves.
   * For a simple closed convex polygon, total absolute turning equals 2*pi and
   * excess is zero regardless of radius, tessellation density or large convex
   * curvature. An inward V with side angle beta adds exactly 4*beta excess.
   * The exact raw source supplies the expected excess: this is a geometric
   * reconstruction diagnostic, not a clinical wrinkle threshold. All components
   * participate, so a missing limb or an extra intersected component cannot be
   * silently cropped. Aggregate equality does not establish local correspondence,
   * detect compensated folds or certify longitudinal/interior loft continuity.
   */
  export function compare(person: string, sourceMesh: G.Mesh, candidateMesh: G.Mesh, plane: Plane): Report {
    const source: Section = section(sourceMesh, plane);
    const candidate: Section = section(candidateMesh, plane);
    const report: Report = { person, plane, source, candidate, finding: null, registeredFinding: null, registration: { sourceComponent: null, candidateComponent: null, status: "UNAVAILABLE", reason: "Complete source/candidate sections must be supported before source-anchor registration" }, status: "UNAVAILABLE" };
    if (source.refusals.length !== 0 || candidate.refusals.length !== 0) return report;
    const expected: number = source.components.reduce((sum: number, component: Component): number => sum + component.excess, 0);
    const observed: number = candidate.components.reduce((sum: number, component: Component): number => sum + component.excess, 0);
    const tolerance: number = [...source.components, ...candidate.components].reduce((sum: number, component: Component): number => sum + component.arithmeticScreen, 0);
    const deviation: number = Math.abs(observed - expected);
    if (![observed, expected, deviation, tolerance].every(Number.isFinite)) {
      candidate.refusals.push(refusal(plane, null, null, "Complete turning aggregation is numerically unresolved"));
      return report;
    }
    const turns: Turn[] = candidate.components.flatMap((component: Component): Turn[] => component.turns);
    const witness: Turn | undefined = turns.reduce<Turn | undefined>((worst: Turn | undefined, row: Turn): Turn | undefined => worst === undefined || row.observed < worst.observed ? row : worst, undefined);
    report.status = source.components.length !== candidate.components.length || deviation > tolerance ? "FAIL" : "PASS";
    report.finding = { person, part: plane.part, stage: "final skin section", direction: "source-relative complete profile", triangle: witness?.triangle ?? null, coordinate: witness?.coordinate ?? null, observed, expected, deviation, tolerance, units: "rad", reason: source.components.length !== candidate.components.length ? `Complete section component mismatch: source=${source.components.length}, candidate=${candidate.components.length}; this is a coverage discrepancy, not proof of a wrinkle` : `Reference-relative excess-turn discrepancy; raw source includes its normal anatomical grooves. The allowance is an engineering arithmetic screen only. Locator basis: ${plane.basis}. No clinical limit, component correspondence, compensated-fold exclusion or longitudinal loft admission is implied. Face/coordinate is a representative candidate concavity, not a source-corresponded defect location` };
    const sourceAnchor: number | string = anchored(source);
    const candidateAnchor: number | string = anchored(candidate);
    if (typeof sourceAnchor === "number" && typeof candidateAnchor === "number") {
      report.registration = { sourceComponent: sourceAnchor, candidateComponent: candidateAnchor, status: "RESOLVED", reason: "The same fixed original-source origin is strictly inside exactly one source and candidate component. All remaining components remain observed; no candidate-fitted axis, plane, label or crop is used. This establishes geometric component registration only, not a clinical landmark." };
      const a: Component = source.components[sourceAnchor]!; const b: Component = candidate.components[candidateAnchor]!;
      const turn: Turn = b.turns.reduce((worst: Turn, row: Turn): Turn => row.observed < worst.observed ? row : worst);
      report.registeredFinding = { ...report.finding, triangle: turn.triangle, coordinate: turn.coordinate, observed: b.excess, expected: a.excess, deviation: Math.abs(b.excess - a.excess), tolerance: a.arithmeticScreen + b.arithmeticScreen, reason: `Source-anchor registered profile has ${b.excess > a.excess ? "additional" : "reduced or equal"} concave turning relative to the exact raw source. This is a source-relative geometric discrepancy, not a universal clinical wrinkle threshold. Face/coordinate is a representative candidate concavity, not an independently matched source-difference location. ${report.registration.reason}` };
      if (report.registeredFinding.deviation > report.registeredFinding.tolerance) report.status = "FAIL";
    } else {
      report.registration = { sourceComponent: typeof sourceAnchor === "number" ? sourceAnchor : null, candidateComponent: typeof candidateAnchor === "number" ? candidateAnchor : null, status: "UNAVAILABLE", reason: `Fixed source-anchor support: source=${String(sourceAnchor)}, candidate=${String(candidateAnchor)}; no candidate-dependent replacement point is allowed` };
      if (report.status !== "FAIL") report.status = "UNAVAILABLE";
    }
    return report;
  }

  /** Geometric winding registers only the component containing the fixed source plane origin. */
  function anchored(section: Section): number | string {
    const normalLength: number = Math.hypot(...section.plane.tangent);
    const normal: G.Point = section.plane.tangent.map((value: number): number => value / normalLength) as unknown as G.Point;
    const inside: number[] = [];
    for (let component: number = 0; component < section.components.length; component++) {
      const points: G.Point[] = section.components[component]!.points;
      let sum: number = 0; let screen: number = 0;
      for (let index: number = 0; index < points.length; index++) {
        const a: G.Point = G.sub(points[index]!, section.plane.origin); const b: G.Point = G.sub(points[(index + 1) % points.length]!, section.plane.origin);
        const al: number = Math.hypot(...a); const bl: number = Math.hypot(...b);
        if (al === 0 || bl === 0 || ![al, bl].every(Number.isFinite)) return "Source anchor lies on an unresolved boundary vertex";
        const left: G.Point = a.map((value: number): number => value / al) as unknown as G.Point; const right: G.Point = b.map((value: number): number => value / bl) as unknown as G.Point;
        const sin: number = G.dot(normal, G.cross(left, right)); const cos: number = G.dot(left, right);
        const pointScreen: number = section.components[component]!.pointErrorsMm[index]! / al + section.components[component]!.pointErrorsMm[(index + 1) % points.length]! / bl;
        const error: number = pointScreen + 1024 * Number.EPSILON * Math.max(...points[index]!.map(Math.abs), ...points[(index + 1) % points.length]!.map(Math.abs), ...section.plane.origin.map(Math.abs), al, bl) / Math.min(al, bl);
        if (![sin, cos, error].every(Number.isFinite) || error >= 0.01 || (cos <= 0 && Math.abs(sin) <= error)) return "Source anchor lies on or too near an unresolved profile edge";
        sum += Math.atan2(sin, cos); screen += error;
      }
      if (Math.abs(sum) <= screen) continue;
      if (Math.abs(Math.abs(sum) - 2 * Math.PI) > screen) return "Profile winding around the source anchor is not a resolved single interior";
      inside.push(component);
    }
    return inside.length === 1 ? inside[0]! : `Fixed source origin is inside ${inside.length} components instead of exactly one`;
  }

  /**
   * Intersect every indexed raw triangle with a fixed source plane.
   * Exact coincident positions weld only identical coordinates, preserving an
   * original face on every segment. Coplanar faces and degree-not-two graphs are
   * refused rather than skipped. No smoothing, radius weld, sampling stride,
   * generated body labels or production geometry operations are used.
   */
  export function section(mesh: G.Mesh, plane: Plane): Section {
    const result: Section = { plane, components: [], refusals: [] };
    for (const issue of G.inspect(mesh)) result.refusals.push(refusal(plane, issue.triangle, issue.coordinate, issue.reason));
    const norm: number = Math.hypot(...plane.tangent);
    if (![...plane.origin, ...plane.tangent, norm].every(Number.isFinite) || norm === 0 || plane.part.length === 0 || plane.basis.length === 0) result.refusals.push(refusal(plane, null, null, "A finite nonzero source tangent, source location, identifier and locator basis are required"));
    if (result.refusals.length !== 0) return result;
    const normal: G.Point = plane.tangent.map((value: number): number => value / norm) as unknown as G.Point;
    const welded: Map<string, number> = new Map();
    const ids: number[] = []; const distances: number[] = []; const sideErrors: number[] = [];
    for (let vertex: number = 0; vertex < mesh.positions.length / 3; vertex++) {
      const point: G.Point = G.vertex(mesh, vertex);
      const key: string = point.join(",");
      if (!welded.has(key)) welded.set(key, welded.size);
      ids.push(welded.get(key)!);
      distances.push(G.dot(G.sub(point, plane.origin), normal));
      sideErrors.push(32 * Number.EPSILON * Math.max(...point.map(Math.abs), ...plane.origin.map(Math.abs), Math.hypot(...G.sub(point, plane.origin))));
    }
    interface Node { point: G.Point; errorMm: number; edges: number[]; }
    interface Edge { a: string; b: string; triangle: number; }
    const nodes: Map<string, Node> = new Map(); const edges: Edge[] = [];
    const addNode = (key: string, point: G.Point, errorMm: number): string => { if (!nodes.has(key)) nodes.set(key, { point, errorMm, edges: [] }); else nodes.get(key)!.errorMm = Math.max(nodes.get(key)!.errorMm, errorMm); return key; };
    for (let face: number = 0; face < mesh.indices.length / 3; face++) {
      const indices: number[] = [mesh.indices[face * 3]!, mesh.indices[face * 3 + 1]!, mesh.indices[face * 3 + 2]!];
      const signed: number[] = indices.map((vertex: number): number => distances[vertex]!);
      if (indices.some((vertex: number): boolean => !Number.isFinite(distances[vertex]) || !Number.isFinite(sideErrors[vertex]) || (distances[vertex] !== 0 && Math.abs(distances[vertex]!) <= sideErrors[vertex]!))) { result.refusals.push(refusal(plane, face, G.vertex(mesh, indices[0]!), "Triangle/plane side classification is non-finite or unresolved at the coordinate roundoff scale")); continue; }
      if (signed.every((value: number): boolean => value > 0) || signed.every((value: number): boolean => value < 0)) continue;
      const hits: Set<string> = new Set();
      if (signed.every((value: number): boolean => value === 0)) { result.refusals.push(refusal(plane, face, G.vertex(mesh, indices[0]!), "Coplanar triangle has a two-dimensional intersection, not a unique profile segment")); continue; }
      for (let corner: number = 0; corner < 3; corner++) {
        let a: number = indices[corner]!; let b: number = indices[(corner + 1) % 3]!;
        if (distances[a] === 0) hits.add(addNode(`v:${ids[a]}`, G.vertex(mesh, a), sideErrors[a]!));
        if ((distances[a]! < 0 && distances[b]! > 0) || (distances[a]! > 0 && distances[b]! < 0)) {
          if (ids[a]! > ids[b]!) [a, b] = [b, a];
          const t: number = distances[a]! / (distances[a]! - distances[b]!);
          const left: G.Point = G.vertex(mesh, a); const right: G.Point = G.vertex(mesh, b);
          const point: G.Point = left.map((value: number, axis: number): number => value + t * (right[axis]! - value)) as unknown as G.Point;
          const span: number = Math.abs(distances[a]! - distances[b]!);
          const parameterError: number = (sideErrors[a]! + Math.abs(t) * (sideErrors[a]! + sideErrors[b]!)) / span + 8 * Number.EPSILON;
          const errorMm: number = Math.max(sideErrors[a]!, sideErrors[b]!) + Math.hypot(...G.sub(right, left)) * parameterError;
          if (!Number.isFinite(t) || !point.every(Number.isFinite) || !Number.isFinite(errorMm) || !(t > 0 && t < 1)) result.refusals.push(refusal(plane, face, left, "Section edge interpolation or propagated coordinate support is unresolved"));
          else hits.add(addNode(`e:${ids[a]}:${ids[b]}`, point, errorMm));
        }
      }
      if (hits.size === 1) { result.refusals.push(refusal(plane, face, nodes.get(Array.from(hits)[0]!)!.point, "Tangent vertex contact is not an unambiguous transverse section segment")); continue; }
      if (hits.size !== 2) { result.refusals.push(refusal(plane, face, null, `Transverse triangle has ${hits.size} resolved intersections instead of two`)); continue; }
      const [a, b]: string[] = Array.from(hits);
      const edge: number = edges.length;
      edges.push({ a: a!, b: b!, triangle: face }); nodes.get(a!)!.edges.push(edge); nodes.get(b!)!.edges.push(edge);
    }
    if (edges.length === 0) result.refusals.push(refusal(plane, null, plane.origin, "No indexed transverse surface support at this source plane"));
    for (const node of nodes.values()) if (node.edges.length !== 2) result.refusals.push(refusal(plane, node.edges.length === 0 ? null : edges[node.edges[0]!]!.triangle, node.point, `Section graph degree ${node.edges.length}; open, branching, duplicated or tangential support cannot pass`));
    if (result.refusals.length !== 0) return result;
    const visited: Set<number> = new Set();
    for (let first: number = 0; first < edges.length; first++) {
      if (visited.has(first)) continue;
      const start: string = edges[first]!.a; let at: string = start; let next: number = first;
      const points: G.Point[] = []; const pointErrorsMm: number[] = []; const triangles: number[] = [];
      while (!visited.has(next)) {
        visited.add(next); const edge: Edge = edges[next]!;
        points.push(nodes.get(at)!.point); pointErrorsMm.push(nodes.get(at)!.errorMm); triangles.push(edge.triangle);
        at = edge.a === at ? edge.b : edge.a;
        const incident: number[] = nodes.get(at)!.edges; next = incident[0] === next ? incident[1]! : incident[0]!;
      }
      if (at !== start) { result.refusals.push(refusal(plane, triangles[0]!, points[0]!, "Section traversal did not close at its original node")); continue; }
      const component: Component | string = turning(points, pointErrorsMm, triangles, normal, result.components.length);
      if (typeof component === "string") result.refusals.push(refusal(plane, triangles[0]!, points[0]!, component));
      else result.components.push(component);
    }
    return result;
  }

  /** Read signed turns in the intrinsic plane without imposing world-axis curvature. */
  function turning(points: G.Point[], pointErrorsMm: number[], triangles: number[], normal: G.Point, component: number): Component | string {
    if (points.length < 3) return "Fewer than three section points cannot define a closed bend profile";
    const directions: G.Point[] = []; const errors: number[] = [];
    let perimeterMm: number = 0;
    for (let index: number = 0; index < points.length; index++) {
      const a: G.Point = points[index]!; const b: G.Point = points[(index + 1) % points.length]!;
      const delta: G.Point = G.sub(b, a); const length: number = Math.hypot(...delta);
      const scale: number = Math.max(...a.map(Math.abs), ...b.map(Math.abs), length);
      const error: number = (pointErrorsMm[index]! + pointErrorsMm[(index + 1) % points.length]! + 128 * Number.EPSILON * scale) / length;
      if (!Number.isFinite(length) || length === 0 || !Number.isFinite(error) || error >= 0.01) return "Section edge direction is zero, non-finite or numerically unresolved at its coordinate scale";
      directions.push(delta.map((value: number): number => value / length) as unknown as G.Point); errors.push(error); perimeterMm += length;
    }
    const turns: Turn[] = []; let absolute: number = 0; let signed: number = 0; let arithmeticScreen: number = 0;
    for (let index: number = 0; index < points.length; index++) {
      const previous: number = (index + points.length - 1) % points.length;
      const a: G.Point = directions[previous]!; const b: G.Point = directions[index]!;
      const angle: number = Math.atan2(G.dot(normal, G.cross(a, b)), G.dot(a, b));
      const error: number = 8 * (errors[previous]! + errors[index]! + 128 * Number.EPSILON);
      if (![angle, error].every(Number.isFinite)) return "Section turning observation is numerically unresolved";
      signed += angle; absolute += Math.abs(angle); arithmeticScreen += 2 * error;
      turns.push({ component, triangle: triangles[index]!, coordinate: points[index]!, observed: angle, arithmeticScreen: error });
    }
    if (Math.abs(signed) <= arithmeticScreen) return "Section winding is zero or numerically unresolved; no convex/concave direction can be assigned";
    const orientation: number = Math.sign(signed);
    for (const turn of turns) turn.observed *= orientation;
    return { points, pointErrorsMm, triangles, turns, excess: Math.max(0, absolute - Math.abs(signed)), arithmeticScreen, perimeterMm };
  }

  /** Missing observation records carry the original section/face instead of fabricated zero curvature. */
  function refusal(plane: Plane, triangle: number | null, coordinate: G.Point | null, reason: string): Refusal { return { part: plane.part, triangle, coordinate, observed: null, expected: "closed resolved complete section", deviation: null, tolerance: null, units: "rad", reason }; }
}
