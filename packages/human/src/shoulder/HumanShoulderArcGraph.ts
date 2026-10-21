import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSurface } from "../internal/HumanSurface";
import { HumanShoulderArcRules } from "./HumanShoulderArcRules";
import { HumanShoulderGuides } from "./HumanShoulderGuides";

/** Pending whole-vector shoulder authority identified with monotone source
 * registration. Four guide contacts own A/C cycles and two own B. Polar folds
 * are interior events and can cross those contacts. Two observed internal C0
 * joins retain independent incoming/outgoing jets; their polar feature role
 * depends on one-sided event signs, not a fixed six-feature topology. Pieces are
 * degree six; original physical Hermite degree, widths and one-sided jets stay
 * in the independent observation artifacts. This operator performs no source
 * I/O and does not assert native surface jets, independent parameter causality
 * or an integrated shoulder skin. Main owns adoption and actual port transport.
 */
export namespace HumanShoulderArcGraph {
  /** World-space vector; positions use mm and each derivative retains its parameter unit. */
  export type Vector = HumanCurve.Vector;

  /** Principal contact or optional source-identified generating corner role. */
  export type Node = HumanShoulderArcRules.Node;

  /** Complete body/arm-root, after-body and after-arm cycle roles. */
  export type Port = "A" | "B" | "C";

  /** Three across and two forward whole guide roles. */
  export type Guide = "AB" | "AC" | "BC" | "AF" | "AR";

  /** Current physical public controls and existing unitless shape, without person identity. */
  export interface Parameters {
    /** Public bicep circumference course in mm, finite and positive. */
    bicepMm:number;

    /** Public Chest circumference course in mm, finite and positive. */
    chestMm:number;

    /** Public across-shoulder surface course in mm; not a bony support width. */
    acrossShoulderMm:number;

    /** Existing masculine/feminine coordinate, unitless; correlated-source geometric law only. */
    shape:number;
  }
  /** Main-owned support-relative physical planes; acquisition grid is not anatomy. */
  export interface Stations {
    /** Before-body/arm-root port plane coordinate dot(axial,P-origin), mm. */
    beforeAxialMm:number;

    /** Common after-body and after-arm plane coordinate in the same physical gauge, mm. */
    afterAxialMm:number;
  }
  /** Exact generating world 2jet in the generated oriented physical phase. */
  export interface Jet {
    /** World position in mm. */
    positionMm:Vector;

    /** First derivative, mm per generated physical phase mm. */
    derivativeMm:Vector;

    /** Second derivative, mm per generated physical phase mm squared. */
    secondDerivativeMm:Vector;
  }
  /** Exact endpoint owner in normalized local polynomial t, not physical phase. */
  export interface EndpointJet {
    /** Shared node position in world mm. */
    positionMm:Vector;

    /** dP/dt in world mm; the corresponding physical jet has one explicit endpoint owner. */
    derivativeMm:Vector;

    /** Exact selected physical first jet; shared principal contacts never multiply then divide their owner. */
    physicalDerivativeMm:Vector;

    /** Original degree-six physical D2, retained exactly while the global quintic C1 correction has zero endpoint D2. */
    secondDerivativeMm:Vector;
  }
  /** One whole generated degree-six restriction, separate from unchanged source Hermite. */
  export interface Polynomial {
    /** Stable common role identity without specimen address. */
    id:string;

    /** Separately identified positive generated phase width in mm, not original source h or arclength. */
    widthMm:number;

    /** Ascending powers of normalized local t; all polynomial degree is retained. */
    coefficientsMm:readonly Vector[];

    /** Shared exact first endpoint position and dP/dt. */
    start:EndpointJet;

    /** Shared exact last endpoint position and dP/dt. */
    end:EndpointJet;
  }
  /** Whole common-q curve authority with original generated physical piece addresses. */
  export interface Curve {
    /** Exact shared P/T evaluator, physical phase interval and unit. */
    boundary:HumanSurface.Boundary;

    /** Exact generating second derivative, mm per squared phase mm. */
    secondDerivative:(parameter:number)=>Vector;

    /** Both generating one-sided jets at every C0/C1 knot; no average is taken. */
    oneSidedJets:(parameter:number)=>OneSidedJets;

    /** Complete generating powers and widths, absent only for an externally owned opaque curve. */
    pieces?:readonly Polynomial[];
  }
  /** Separate limits of the same generating whole curve. */
  export interface OneSidedJets {
    /** Increasing-phase incoming limit. */
    left:Jet;

    /** Increasing-phase outgoing limit. */
    right:Jet;
  }
  /** Original two fitted derivative laws and their explicit generated C1 selection. */
  export interface EndpointAuthority {
    /** Original incoming common-law physical derivative, before C1 selection. */
    incomingLaw:Vector;
    /** Original outgoing common-law physical derivative, before C1 selection. */
    outgoingLaw:Vector;
    /** Selected physical owner for the incoming lane; C0 retains its own original law. */
    incoming:Vector;
    /** Selected physical owner for the outgoing lane. */
    outgoing:Vector;
    /** Difference of original incoming law from the selected shared C1 owner. */
    incomingSelectionResidual:Vector;
    /** Only source-qualified ordinary contacts select the outgoing C1 law; no averaging. */
    selection:"source-qualified-C1-outgoing-law"|"two-C0-lanes";
  }
  /** Complete existing v6 common-q graph before actual regional skin transport. */
  export interface Graph {
    /** Independently generated whole ABC cycles; A is never reconstructed from patch corners. */
    ports:Record<Port,Curve>;

    /** Original fitted left/right first-jet laws, selection and residual ledger. */
    endpointAuthorities:Record<Node,EndpointAuthority>;

    /** Complete AB/AC/BC/AF/AR generating guide functions. */
    guides:Record<Guide,Curve>;

    /** Single position authority per contact or optional corner role, world mm. */
    nodes:Record<Node,Vector>;

    /** Exact role addresses in each generating port's oriented physical phase mm. */
    contacts:Record<Node,number>;

    /** Main's actual generated shoulder support and mirrored orthonormal directions. */
    frame:HumanShoulderGuides.Frame;

    /** Common q-driven geometric critical landmark in world mm; not an anatomical joint proof. */
    criticalPointMm:Vector;

    /** Actual physical plane coordinates consumed by this graph. */
    stations:Stations;

    /** Source-conditioned identification, phase and unobserved-response limitations. */
    limitations:readonly string[];
  }
  /** Construct the pooled native-gauge graph in the actual common support frame.
   * Shared points close ports; incoming/outgoing physical tangent laws retain
   * observed internal C0 joins and ordinary C1 contacts. Every whole interior
   * has zero endpoint value/first jet. Source-only phase alignment and absent
   * design columns do not supply runtime coefficients. Actual across/forward
   * plane incidence is imposed as a geometric constraint.
   * Work and retained storage are bounded by 17 degree-six vector pieces.
   */
  export function build(parameters: Parameters, frame: HumanShoulderGuides.Frame, stations: Stations): Graph {
    for (const value of [parameters.bicepMm, parameters.chestMm, parameters.acrossShoulderMm])
      if (!(Number.isFinite(value) && value > 0)) throw new Error("Shoulder graph metrics must be finite positive mm");
    if (!(Number.isFinite(stations.beforeAxialMm) && Number.isFinite(stations.afterAxialMm) && stations.afterAxialMm > stations.beforeAxialMm))
      throw new Error("Shoulder graph principal planes must have an increasing physical axial interval");
    const features: HumanShoulderGuides.Features = HumanShoulderGuides.features(parameters, frame);
    const critical: Vector = features.criticalPointMm;
    const criticalOffset: Vector = difference(critical, frame.originMm);
    const criticalForward: number = dot(criticalOffset, frame.forward);
    const criticalAcross: number = dot(criticalOffset, frame.across);
    const criticalAxial: number = dot(difference(critical, frame.originMm), frame.axial);
    const nodes: Record<Node, Vector> = {} as Record<Node, Vector>;
    const localNodes: Record<Node, Vector> = {} as Record<Node, Vector>;
    for (const node of Object.keys(HumanShoulderArcRules.pointChannels) as Node[]) {
      const local: Vector = [0, 0, 0];
      for (let axis: number = 0; axis < 3; axis++) local[axis] = axis === 1
        ? (node[0] === "A" ? stations.beforeAxialMm : stations.afterAxialMm) - criticalAxial
        : fixedContact(node, axis) ? -(axis === 0 ? criticalForward : criticalAcross)
          : channel(parameters, HumanShoulderArcRules.pointChannels[node], node, axis);
      localNodes[node] = local;
      nodes[node] = world(local, frame, critical);
    }
    const endpointAuthorities:Record<Node,EndpointAuthority> = {} as Record<Node,EndpointAuthority>;
    const localDerivatives:Record<Node,readonly [Vector,Vector]> = {} as Record<Node,readonly [Vector,Vector]>;
    const originalLocalDerivatives:Record<Node,readonly [Vector,Vector]> = {} as Record<Node,readonly [Vector,Vector]>;
    for (const node of Object.keys(localNodes) as Node[]) {
      const original:readonly [Vector,Vector] = [0,1].map((lane:number):Vector => [0,1,2].map((axis:number):number => {
        const pair:readonly [number,number] = HumanShoulderArcRules.tangents[node][lane]![axis]!;
        return axis === 1 ? 0 : pair[0]+parameters.shape*pair[1];
      }) as Vector) as [Vector,Vector];
      const corner:boolean = HumanShoulderArcRules.optionalCornerJoins.includes(node);
      const selected:readonly [Vector,Vector] = corner ? original : [original[1],original[1]];
      localDerivatives[node] = selected;originalLocalDerivatives[node]=original;
      const incomingLaw:Vector=world(original[0],frame,[0,0,0]),outgoingLaw:Vector=world(original[1],frame,[0,0,0]);
      const incoming:Vector=corner ? incomingLaw : outgoingLaw;
      endpointAuthorities[node]={incomingLaw,outgoingLaw,incoming,outgoing:outgoingLaw,incomingSelectionResidual:difference(incomingLaw,incoming),selection:corner ? "two-C0-lanes" : "source-qualified-C1-outgoing-law"};
    }
    const pieces: Record<string, Polynomial> = {};
    for (const edge of HumanShoulderArcRules.edges) {
      const [left, right] = edge.nodes;
      const p0: Vector = localNodes[left];
      const p1: Vector = localNodes[right];
      const widthLaw: readonly [number, number] = HumanShoulderArcRules.widths[edge.id]!;
      const width: number = parameters.bicepMm * (widthLaw[0] + parameters.shape * widthLaw[1]);
      if (!(Number.isFinite(width) && width > 0)) throw new Error("A generated shoulder restriction has no positive physical phase width");
      const d0: Vector = [0, 0, 0];
      const d1: Vector = [0, 0, 0];
      for (let axis: number = 0; axis < 3; axis++) {
        if (axis === 1 && edge.kind === "port") continue;
        if (edge.kind === "guide" && fixedGuide(edge.id, axis)) continue;
        if (edge.kind === "port") {
          d0[axis] = width * originalLocalDerivatives[left][1][axis]!;
          d1[axis] = width * originalLocalDerivatives[right][0][axis]!;
        } else {
          d0[axis] = channel(parameters, edge.tangentChannels[0], left, axis) * width / parameters.bicepMm;
          d1[axis] = channel(parameters, edge.tangentChannels[1], right, axis) * width / parameters.bicepMm;
        }
        if (axis === 1) { d0[axis] = d0[axis]! + p1[axis]! - p0[axis]!; d1[axis] = d1[axis]! + p1[axis]! - p0[axis]!; }
      }
      const coefficients: Vector[] = hermite(p0, p1, d0, d1);
      for (let k: number = 0; k < 3; k++) {
        const shape: readonly number[] = k === 0 ? [1] : k === 1 ? [-1, 2] : [1, -6, 6];
        const basis: number[] = multiply([0, 0, 1, -2, 1], shape);
        for (let axis: number = 0; axis < 3; axis++) {
          if (axis === 1 && edge.kind === "port") continue;
          if (edge.kind === "guide" && fixedGuide(edge.id, axis)) continue;
          const pair: readonly number[] = HumanShoulderArcRules.channels[edge.bubbleChannel + k]![axis]!;
          const value: number = Math.sqrt(metric(parameters, left, axis) * metric(parameters, right, axis)) * (pair[0]! + parameters.shape * pair[1]!);
          for (let i: number = 0; i < basis.length; i++) coefficients[i]![axis] = coefficients[i]![axis]! + basis[i]! * value;
        }
      }
      const originalPowers:Vector[]=coefficients.map((value:Vector,i:number):Vector=>world(value,frame,i === 0 ? critical : [0,0,0]));
      if (edge.kind === "port") for (let axis:number=0;axis<3;axis++) {
        const first:number=width*localDerivatives[left][1][axis]!,last:number=width*localDerivatives[right][0][axis]!;
        const a:number=first-d0[axis]!,b:number=last-d1[axis]!;
        const correction:number[]=[0,a,0,-6*a-4*b,8*a+7*b,-3*a-3*b];
        for (let power:number=0;power<correction.length;power++) coefficients[power]![axis]=coefficients[power]![axis]!+correction[power]!;
        d0[axis]=first;d1[axis]=last;
      }
      const powers: Vector[] = coefficients.map((value: Vector, i: number): Vector => world(value, frame, i === 0 ? critical : [0, 0, 0]));
      if (!powers.flat().every(Number.isFinite)) throw new Error("The common shoulder graph left its finite generating domain");
      pieces[edge.id] = { id: edge.id, widthMm: width, coefficientsMm: powers,
        start: { positionMm: nodes[left], derivativeMm: world(d0, frame, [0, 0, 0]),physicalDerivativeMm:edge.kind === "port" ? endpointAuthorities[left].outgoing : world(d0,frame,[0,0,0]).map((v:number):number=>v/width) as Vector,secondDerivativeMm:physicalSecond(originalPowers,0,width) },
        end: { positionMm: nodes[right], derivativeMm: world(d1, frame, [0, 0, 0]),physicalDerivativeMm:edge.kind === "port" ? endpointAuthorities[right].incoming : world(d1,frame,[0,0,0]).map((v:number):number=>v/width) as Vector,secondDerivativeMm:physicalSecond(originalPowers,1,width) } };
    }
    const ports: Record<Port, Curve> = {} as Record<Port, Curve>;
    const contacts: Record<Node, number> = {} as Record<Node, number>;
    for (const role of ["A", "B", "C"] as const) {
      let station: number = 0;
      const cycle: readonly Node[] = HumanShoulderArcRules.cycles[role];
      for (let i: number = 0; i < cycle.length; i++) { contacts[cycle[i]!] = station; station += pieces[role + i]!.widthMm; }
      ports[role] = curve("shoulder." + role, cycle.map((_node: Node, i: number): Polynomial => pieces[role + i]!), true);
    }
    const guides: Record<Guide, Curve> = {} as Record<Guide, Curve>;
    for (const id of ["AB", "AC", "BC", "AF", "AR"] as const) guides[id] = curve("shoulder." + id, [pieces[id]!], false);
    return { ports,endpointAuthorities, guides, nodes, contacts, frame, criticalPointMm: critical, stations: { ...stations }, limitations: [...LIMITATIONS, ...features.limitations] };
  }

  // The unused legacy parallel-plane attach API is intentionally excluded from
  // this build-only dependency slice. Main owns actual nonparallel transport.

  /** Keep complete restrictions and return both sides at every C0/C1 knot. */
  function curve(id: string, pieces: readonly Polynomial[], closed: boolean): Curve {
    const knots: number[] = [0];
    for (const piece of pieces) knots.push(knots.at(-1)! + piece.widthMm);
    const end: number = knots.at(-1)!;
    const locate: (parameter: number) => { index: number; t: number } = (parameter: number): { index: number; t: number } => {
      if (!Number.isFinite(parameter) || parameter < 0 || parameter > end) throw new Error("A shoulder curve was evaluated outside its generated physical phase domain");
      let index: number = pieces.length - 1;
      for (let i: number = 0; i < pieces.length; i++) if (parameter < knots[i + 1]!) { index = i; break; }
      return { index, t: (parameter - knots[index]!) / pieces[index]!.widthMm };
    };
    const oneSidedJets: Curve["oneSidedJets"] = (parameter: number): { left: Jet; right: Jet } => {
      const address: { index: number; t: number } = locate(parameter);
      const knot: number = knots.indexOf(parameter);
      if (knot >= 0) {
        const right: number = parameter === end ? (closed ? 0 : pieces.length - 1) : knot;
        const left: number = parameter === 0 ? (closed ? pieces.length - 1 : 0) : knot - 1;
        return { left: sample(pieces[left]!, parameter === 0 && !closed ? 0 : 1),
          right: sample(pieces[right]!, parameter === end && !closed ? 1 : 0) };
      }
      const value: Jet = sample(pieces[address.index]!, address.t);
      return { left: value, right: value };
    };
    return { boundary: { id, unit: "generated oriented physical phase mm", start: 0, end,
      evaluate: (parameter: number): Vector => oneSidedJets(parameter).right.positionMm,
      derivative: (parameter: number): Vector => oneSidedJets(parameter).right.derivativeMm },
      secondDerivative: (parameter: number): Vector => oneSidedJets(parameter).right.secondDerivativeMm, oneSidedJets, pieces };
  }

  /** Horner evaluation retains the entire generated degree and exact endpoint owners. */
  function sample(piece: Polynomial, t: number): Jet {
    const jets: Vector[] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let order: number = 0; order < 3; order++) for (let i: number = piece.coefficientsMm.length - 1; i >= order; i--) {
      const factor: number = order === 0 ? 1 : order === 1 ? i : i * (i - 1);
      for (let axis: number = 0; axis < 3; axis++) jets[order]![axis] = jets[order]![axis]! * t + factor * piece.coefficientsMm[i]![axis]!;
    }
    const endpoint: Polynomial["start"] | undefined = t === 0 ? piece.start : t === 1 ? piece.end : undefined;
    return { positionMm: endpoint !== undefined ? endpoint.positionMm : jets[0]!,
      derivativeMm: endpoint !== undefined ? endpoint.physicalDerivativeMm : jets[1]!.map((value: number): number => value / piece.widthMm) as Vector,
      secondDerivativeMm: endpoint !== undefined ? endpoint.secondDerivativeMm : jets[2]!.map((value: number): number => value / (piece.widthMm * piece.widthMm)) as Vector };
  }

  /** Evaluate the original whole degree-six D2 before the zero-D2 C1 correction. */
  function physicalSecond(powers:readonly Vector[],t:number,width:number):Vector {
    const result:Vector=[0,0,0];
    for (let i:number=powers.length-1;i>=2;i--) for (let axis:number=0;axis<3;axis++) result[axis]=result[axis]!*t+i*(i-1)*powers[i]![axis]!;
    return result.map((value:number):number=>value/(width*width)) as Vector;
  }

  /** The two observed body-side contacts use body metrics; other contacts use the arm axis. */
  function metric(parameters: Parameters, node: Node, axis: number): number {
    return axis !== 1 && (node === "A.B" || node === "B.A")
      ? (axis === 0 ? parameters.chestMm : parameters.acrossShoulderMm) : parameters.bicepMm;
  }

  /** Evaluate a common metric law with no specimen or source-phase input. */
  function channel(parameters: Parameters, index: number, node: Node, axis: number): number {
    const pair: readonly number[] = HumanShoulderArcRules.channels[index]![axis]!;
    return metric(parameters, node, axis) * (pair[0]! + parameters.shape * pair[1]!);
  }

  /** Contact roles fix actual support-plane coordinates, not fitted offsets. */
  function fixedContact(node: Node, axis: number): boolean {
    const suffix: string = node.slice(2);
    return axis === 0 && (suffix === "A" || suffix === "B" || suffix === "C")
      || axis === 2 && (suffix === "F" || suffix === "R");
  }

  /** Whole across/forward guides retain their observed physical planes. */
  function fixedGuide(id: string, axis: number): boolean {
    return axis === 0 && (id === "AB" || id === "AC" || id === "BC")
      || axis === 2 && (id === "AF" || id === "AR");
  }

  /** One exact cubic endpoint component inside a retained degree-six interior. */
  function hermite(p0: Vector, p1: Vector, d0: Vector, d1: Vector): Vector[] {
    const result: Vector[] = Array.from({ length: 7 }, (): Vector => [0, 0, 0]);
    for (let axis: number = 0; axis < 3; axis++) {
      const delta: number = p1[axis]! - p0[axis]!;
      result[0]![axis] = p0[axis]!; result[1]![axis] = d0[axis]!;
      result[2]![axis] = 3 * delta - 2 * d0[axis]! - d1[axis]!;
      result[3]![axis] = -2 * delta + d0[axis]! + d1[axis]!;
    }
    return result;
  }

  /** Transform each power once through the shared physical support frame. */
  function world(value: Vector, frame: HumanShoulderGuides.Frame, origin: Vector): Vector {
    return origin.map((component: number, axis: number): number => component + value[0] * frame.forward[axis]! + value[1] * frame.axial[axis]! + value[2] * frame.across[axis]!) as Vector;
  }

  /** Polynomial products keep every power of the generated zero-first-jet interior. */
  function multiply(a: readonly number[], b: readonly number[]): number[] {
    const result: number[] = new Array(a.length + b.length - 1).fill(0);
    for (let i: number = 0; i < a.length; i++) for (let j: number = 0; j < b.length; j++) result[i + j] = result[i + j]! + a[i]! * b[j]!;
    return result;
  }

  function difference(a: Vector, b: Vector): Vector { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function dot(a: Vector, b: Vector): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

  const LIMITATIONS: readonly string[] = [
    "Pending common curve operator: root consumption, silhouette, volume, feature and neighbor improvement require main-owned actual render comparison",
    "Pooled four-person coefficients and geometric phase registration establish conditional shape approximation, not independent control causality or material transport",
    "Source principal planes condition profile identification. Changing supplied axial planes transports coordinates but does not establish the unobserved profile response or an anatomical station law; acquisition's 10 mm slab is not such a law",
    "A is a whole vector cycle with movable interior folds; B/C and all five guides share graph endpoints and derived generating jets",
    "Ordinary contacts are C1; identified optional C0 joins retain both physical first/second jets. Their feature role is conditional, and mixed surface twist, global embedding and unobserved births remain unqualified",
    "Source cubic Hermite h, degree and one-sided jets are retained independently; generated physical width laws and degree-six graph jets are separately identified approximations",
    "A polar join changes role when its one-sided event changes sign or its jet jump vanishes. A physical-width collapse at a guide is explicitly unsupported; no feature is snapped across a contact",
  ];
}
