import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSurface } from "../internal/HumanSurface";

/** Common auricular graph with one coefficient authority per shared subpath. */
export namespace HumanEarGraph {
  /** A common endpoint and physical derivative belong to the graph once. */
  export interface Node {
    /** Semantic graph node identity, independent of a source vertex number. */
    id: string;
    /** World position shared exactly by every incident path, mm. */
    positionMm: HumanCurve.Vector;
    /** One directed common tangent in world mm per generated physical phase mm. */
    derivativeMmPerMm: HumanCurve.Vector;
  }

  /** Named source curves compose the same actual path Boundary objects. */
  export interface Feature {
    /** Source semantic name with an explicit signed side suffix. */
    name: string;
    /** Canonical subpath objects and their actual named traversal direction. */
    segments: HumanSurface.Edge[];
  }

  /** Complete observed named graph remains separate from unobserved skin. */
  export interface Result {
    /** Fourteen endpoint authorities per signed auricle. */
    nodes: Node[];
    /** Nine maximal shared path authorities, all open. */
    paths: HumanSurface.Boundary[];
    /** Whole source names and aliases reuse exact subpath objects. */
    features: Feature[];
    /** Graph fitting does not establish auricular skin or scalp contact. */
    limitations: string[];
  }

  /** Build the jointly identified graph under independent ear metric axes.
   * Four sources and both sides contribute 4,607 complete Hermite observations.
   * One 72-unknown least-squares solve per normalized coordinate identifies node
   * positions, common physical node derivatives and endpoint/jet-vanishing
   * residuals together. Degree-two ownership changes share their tangent unknown;
   * the opposite incident direction is transported explicitly. Original source
   * spans and phase widths remain in the observation artifacts, never reduced.
   * Generated physical widths use the identified path/ear-length ratios; they
   * are an affine common chart and do not assert exact generated arc length.
   * The caller owns all returned objects; work and storage are O(N+E) for this
   * finite graph, with no source reads, fitting, cache, acquisition or mesh.
   */
  export function build(side: "left" | "right", heelMm: HumanCurve.Vector, scalesMm: HumanCurve.Vector, phaseLengthMm: number): Result {
    if (!(heelMm.every(Number.isFinite) && scalesMm.every(Number.isFinite) && phaseLengthMm > 0 && Number.isFinite(phaseLengthMm)))
      throw new Error("Ear graph requires finite metric axes and positive physical phase scale");
    const prefix: string = "head.ear." + side + ".graph.";
    const nodes: Node[] = nodeRules.map((rule: NodeRule, index: number): Node => ({
      id: prefix + "node." + index,
      positionMm: rule.position.map((value: number, axis: number): number => heelMm[axis]! + value * scalesMm[axis]!) as HumanCurve.Vector,
      derivativeMmPerMm: rule.tangent.map((value: number, axis: number): number => value * scalesMm[axis]! / phaseLengthMm) as HumanCurve.Vector,
    }));
    const paths: HumanSurface.Boundary[] = pathRules.map((rule: PathRule, index: number): HumanSurface.Boundary => {
      const width: number = rule.lengthRatio * phaseLengthMm;
      return {
        id: prefix + names[index]!, unit: "mm", start: 0, end: width,
        evaluate: (t: number): HumanCurve.Vector => {
          const u: number = admit(t, width);
          if (u === 0 || u === 1) return [...nodes[rule.ends[u === 0 ? 0 : 1]]!.positionMm];
          const value: HumanCurve.Vector = profile(rule, u)[0];
          return value.map((v: number, axis: number): number => heelMm[axis]! + scalesMm[axis]! * v) as HumanCurve.Vector;
        },
        derivative: (t: number): HumanCurve.Vector => {
          const u: number = admit(t, width);
          if (u === 0 || u === 1) {
            const endpoint: number = u === 0 ? 0 : 1;
            return nodes[rule.ends[endpoint]!]!.derivativeMmPerMm.map((v: number): number => rule.signs[endpoint]! * v) as HumanCurve.Vector;
          }
          return profile(rule, u)[1].map((v: number, axis: number): number => v * scalesMm[axis]! / width) as HumanCurve.Vector;
        },
      };
    });
    const suffix: string = side === "left" ? "_l" : "_r";
    const features: Feature[] = featureRules.map((rule: FeatureRule): Feature => ({
      name: rule.name + suffix,
      segments: rule.segments.map(([index, orientation]: readonly [number, 1 | -1]): HumanSurface.Edge => ({ curve: paths[index]!, orientation })),
    }));
    return { nodes, paths, features, limitations: [
      "One jointly identified coefficient graph supplies every named shared subpath and whole-feature alias; open paths do not become closed ear surfaces",
      "Conditional common-coordinate RMS by path is 0.26–1.97 mm with sampled maxima 0.85–7.43 mm; source geometry, achieved ear proxies and every original Hermite width contributed",
      "Shared degree-two node positions and physical derivatives are exact in the common graph; this constrained approximation does not certify the source fit's independent one-sided tangent equality",
      "Nine bilateral path classes and fourteen node classes are anatomical topology rules shared by all four sources, not specimen-indexed controls or stored source coordinates",
      "Source named-curve union has five disconnected components per side; missing cross-skin courses, source scalp attachment and auricular sheet topology remain ungenerated",
      "Physical phase widths follow common path-length/ear-length ratios and are distinct from exact continuous arc length and clinical parameter response",
    ] };
  }

  /** Finite normalized outer-helix envelope consumed by the ear metric owner. */
  export function outerEnvelope(): { low: HumanCurve.Vector; high: HumanCurve.Vector; absoluteZ: number } {
    const low: HumanCurve.Vector = [Infinity, Infinity, Infinity], high: HumanCurve.Vector = [-Infinity, -Infinity, -Infinity];
    let absoluteZ: number = 0;
    for (let i: number = 0; i <= 256; i++) {
      const point: HumanCurve.Vector = profile(pathRules[1]!, i / 256)[0];
      for (let axis: number = 0; axis < 3; axis++) {
        low[axis] = Math.min(low[axis]!, point[axis]!); high[axis] = Math.max(high[axis]!, point[axis]!);
      }
      absoluteZ = Math.max(absoluteZ, Math.abs(point[2]));
    }
    return { low, high, absoluteZ };
  }

  /** Endpoint and common physical tangent unknowns are solved jointly. */
  interface NodeRule { position: readonly number[]; tangent: readonly number[] }
  /** Complete polynomial residual vanishes with its first jet at both ends. */
  interface PathRule { ends: readonly [number, number]; signs: readonly [number, number]; lengthRatio: number; residual: readonly (readonly number[])[] }
  /** Named source traversal retains shared ownership rather than another fit. */
  interface FeatureRule { name: string; segments: readonly (readonly [number, 1 | -1])[] }

  const names: readonly string[] = ["inner-helix", "outer-helix", "antitragus-heel", "antitragus", "central-upper", "central-upper-concha", "tragus", "heel", "central-lower"];
  const featureRules: readonly FeatureRule[] = [
    { name: "crv_ear_inner_helix", segments: [[0, -1]] }, { name: "ear_inner_helix", segments: [[0, 1]] },
    { name: "crv_ear_outer_helix", segments: [[1, -1]] }, { name: "ear_outer_helix", segments: [[1, -1]] },
    { name: "crv_ear_central_upper", segments: [[4, -1], [5, 1]] }, { name: "ear_concha", segments: [[5, 1]] },
    { name: "crv_ear_central_lower", segments: [[8, -1]] }, { name: "ear_antitragus", segments: [[2, -1], [3, 1]] },
    { name: "ear_heel", segments: [[2, 1], [7, -1]] }, { name: "ear_tragus", segments: [[6, -1]] },
  ];
  const nodeRules: readonly NodeRule[] = [
    {"position":[-0.6092649379754159,0.06591555654506591,0.8628762548225909],"tangent":[-1.1393709518913229,0.2708609572489845,1.4772716328351565]},
    {"position":[-0.29938442657229003,0.32010539368921026,0.014824520180289562],"tangent":[-0.43328554925051144,-0.5285715546824545,-0.0025433198629411374]},
    {"position":[-0.154361417232066,0.6404562570512593,0.4351599210251077],"tangent":[-0.834860465708244,0.934335966222969,1.0383375293610824]},
    {"position":[0.07938698305944145,-0.24849810696391839,-0.19069856683893222],"tangent":[0.39121754412312365,0.32141551536205054,-2.5851627464256826]},
    {"position":[-0.19249816856051946,0.027981499878277364,0.22807165994848122],"tangent":[1.5032157753722946,-0.5446822841121949,-0.9202212906165932]},
    {"position":[-0.12885712322900875,0.007681215446342009,0.15921062688057913],"tangent":[1.1506044250074594,-0.48794169518991776,-1.8124462223842353]},
    {"position":[-0.5114337279710676,0.10402254903133931,0.5312386418209096],"tangent":[-0.7664248565001242,0.64060406420109,2.066272964837086]},
    {"position":[-0.4777348023466196,0.06371598487516386,0.32421724482986064],"tangent":[1.7100935530730594,-0.23749415155357323,-1.468641094463824]},
    {"position":[-0.07506981452625676,-0.00325161756520912,0.025751593619428994],"tangent":[1.7829825957094876,-0.20641850074801815,-1.8727399220320586]},
    {"position":[-0.23612331929150182,0.4309487958178488,0.08096649825420404],"tangent":[0.8532815351709044,0.34772006395206984,-3.4527665250169948]},
    {"position":[0.011166259007406492,0.03573807807356728,-0.04903336878658576],"tangent":[-0.7323148556918749,0.8681760824653215,0.7228928450082038]},
    {"position":[-0.13666499848075858,0.2610502773455571,-0.025313992711121978],"tangent":[-1.1727541278648461,0.3753162241298084,-2.6046977889862184]},
    {"position":[0.010872539950471487,0.07856545791156713,0.09945351036681455],"tangent":[1.289016703808332,-0.8037302119659064,-2.059750586802434]},
    {"position":[-0.11919619982063119,0.26881787381437994,0.031033672530753266],"tangent":[-0.8020362397013311,0.9106786610239206,-2.2048936215029866]},
  ];
  const pathRules: readonly PathRule[] = [
    {"ends":[0,1],"signs":[1,1],"lengthRatio":1.1826393165469231,"residual":[[-1.0944838407001252,6.91899211723251,14.401423081032322,-6.875293525495841,-35.62066403001891,-3.045374980271841,38.926673799709235,12.711482990377057],[4.412938847209192,3.344819188686211,3.3926734911371654,-16.97581472287944,-13.622632610534518,36.99153311998043,22.37231746557416,-33.34071421881725],[4.033537823812526,8.175908685669432,-12.271314233660428,-18.579328837356986,30.079100903060837,44.20440345133011,-12.248946862954597,0.6678449019983833]]},
    {"ends":[2,3],"signs":[1,1],"lengthRatio":1.7387563694661592,"residual":[[-8.80832811474188,3.2110393732226723,-12.681096128680958,-0.0978943718812221,20.332048171041365,-6.03341502539381,-26.809934378947702,8.581401218044387],[-2.1562963412193947,1.7895403595311672,-1.2574552846614209,-2.54746470245256,12.71226933937648,2.7354850926100225,-23.113983478403757,-2.9631611488231906],[0.4728572284637904,-0.5598385812404115,5.387180879719537,-10.45739896881356,2.9346195141408575,21.737019922652586,11.469667166122047,20.40852794174895]]},
    {"ends":[4,5],"signs":[1,1],"lengthRatio":0.04541717809736809,"residual":[[-0.017947361456270277,-0.007695461089488969,-0.026003167604960825,-0.03780981104550177],[-0.007224981180527324,-0.012647116654789948,-0.0008339177172186157,-0.016367085036364602],[-0.004025016323293048,0.020572872988970387,-0.07668816709530023,-0.006784345909116993]]},
    {"ends":[4,6],"signs":[-1,1],"lengthRatio":0.2271093210962488,"residual":[[-0.04107626939854779,-0.36822022054880565,-0.2521934172161407,0.2160934724441069],[0.02253395428361905,-0.21018733338033335,-0.3394994860765831,-0.13739014453085735],[-0.18302884247338208,-0.27967073857083746,-0.10333758359152775,-0.15158823452209808]]},
    {"ends":[7,8],"signs":[1,1],"lengthRatio":0.252001388098094,"residual":[[0.09067462940137061,0.16201667899923838,-0.016029988425152693,0.19629307984734137],[0.11414598336044418,-0.1376279506234016,0.1115798343515746,0.0001928604382282387],[-0.12928301938037584,0.16413201021451085,-0.06807135681243294,0.19549519254456402]]},
    {"ends":[7,9],"signs":[-1,1],"lengthRatio":0.5259260129610079,"residual":[[-0.3057489738135961,0.2306342379764501,0.4444207521689821,-3.641684840273813],[0.7231364473636414,-0.16962568529356772,-0.17829106574662346,-0.5767581190911641],[-0.4856200405296401,-1.1390805279295833,-1.5402706376809376,-7.4663630052534]]},
    {"ends":[10,11],"signs":[1,1],"lengthRatio":0.26794683171624856,"residual":[[-0.379958757130537,0.5962809251535908,1.2767654925495355,-0.9795934655129946],[-0.27026081473187774,0.165394728030708,-0.08380169375289732,-0.6878681986291318],[0.5468695632404676,-0.6090029374339178,-0.11448026356776404,-1.7222350014983774]]},
    {"ends":[12,5],"signs":[1,-1],"lengthRatio":0.18062960773269174,"residual":[[0.14714292092542544,-0.2175720534055504,-0.452107452327852,1.1596122070207542],[-0.18960305157977092,-0.08090785064112567,0.0989230811937254,0.3103339865803549],[-0.6996505052719237,-0.05084072281488492,0.4368236133372816,-0.5633321321325416]]},
    {"ends":[8,13],"signs":[1,1],"lengthRatio":0.34911072287327627,"residual":[[-0.8904634418059669,-0.7444798973188883,2.6853116617424635,1.1453376996573235],[0.4911354723737383,-0.476410327709475,0.6326557383971394,0.9312118639733078],[1.50712275801249,0.4327325316591225,-2.728675312351424,-0.26531117639245927]]},
  ];

  /** Evaluate the complete degree-eleven helix or degree-seven shorter path. */
  function profile(rule: PathRule, u: number): [HumanCurve.Vector, HumanCurve.Vector] {
    const a: NodeRule = nodeRules[rule.ends[0]]!, b: NodeRule = nodeRules[rule.ends[1]]!;
    const point: HumanCurve.Vector = [0, 0, 0], derivative: HumanCurve.Vector = [0, 0, 0];
    const x: number = 2 * u - 1, h: number = u * u * (1 - u) * (1 - u);
    const dh: number = 2 * u * (1 - u) * (1 - 2 * u);
    for (let axis: number = 0; axis < 3; axis++) {
      const theta: readonly number[] = rule.residual[axis]!;
      let r: number = 0, dr: number = 0;
      for (let k: number = theta.length - 1; k >= 0; k--) { dr = dr * x + r; r = r * x + theta[k]!; }
      const da: number = rule.lengthRatio * rule.signs[0] * a.tangent[axis]!, db: number = rule.lengthRatio * rule.signs[1] * b.tangent[axis]!;
      point[axis] = (2 * u ** 3 - 3 * u * u + 1) * a.position[axis]! + (u ** 3 - 2 * u * u + u) * da +
        (-2 * u ** 3 + 3 * u * u) * b.position[axis]! + (u ** 3 - u * u) * db + h * r;
      derivative[axis] = (6 * u * u - 6 * u) * a.position[axis]! + (3 * u * u - 4 * u + 1) * da +
        (-6 * u * u + 6 * u) * b.position[axis]! + (3 * u * u - 2 * u) * db + dh * r + 2 * h * dr;
    }
    if (u === 0 || u === 1) for (let axis: number = 0; axis < 3; axis++) point[axis] = (u === 0 ? a : b).position[axis]!;
    return [point, derivative];
  }

  /** Preserve each directed physical subpath domain without extrapolation. */
  function admit(t: number, width: number): number {
    if (!(Number.isFinite(t) && t >= 0 && t <= width)) throw new Error("Ear graph parameter lies outside its physical subpath");
    return t === width ? 1 : t / width;
  }
}
