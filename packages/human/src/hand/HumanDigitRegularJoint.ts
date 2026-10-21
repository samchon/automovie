import type { HumanCurve } from "../internal/HumanCurve";
import { HumanCurveFamily } from "../internal/HumanCurveFamily";
import type { HumanHandShafts } from "../extremities/HumanHandShafts";
import { HumanHandFeatureKernel } from "./HumanHandFeatureKernel";

/** One generated authority jointly identifies a shaft and its open distal prefix.
 * The original raw angular variable and both endpoint positions are retained.
 * One source-identified derivative at support03 is consumed by both intervals. */
export namespace HumanDigitRegularJoint {
  /** Only the four observed nonthumb branches enter this joint identification. */
  export type Digit = "index" | "middle" | "ring" | "pinky";

  /** Main supplies existing dependencies and owns the semantic reach budget. */
  export interface Input {
    /** Identity for the combined generating family. */
    id: string;
    /** The common observed branch rule. */
    digit: Digit;
    /** Exact current shaft endpoint object, including its existing frame. */
    port: HumanHandShafts.DistalPort;
    /** Existing independent physical circumference in millimetres. */
    handCircumferenceMm: number;
    /** Positive main-owned reach in millimetres; this is not a clinical tip. */
    reachMm: number;
  }

  /** A source-identified generated interface, with distinct one-sided curvature. */
  export interface JointPort {
    /** Same physical support03 station as the input authority, millimetres. */
    stationMm: number;
    /** Exact original P/Pphi and the jointly derived common Ds/Dsphi. */
    jet: (canonicalPhaseRadians: number) => HumanCurveFamily.Jet;
    /** Shaft-side second physical derivative; no source G2 claim is made. */
    shaftSecondDerivative: (canonicalPhaseRadians: number) => HumanCurve.Vector;
    /** Prefix-side second physical derivative of its exact quadratic expression. */
    prefixSecondDerivative: (canonicalPhaseRadians: number) => HumanCurve.Vector;
  }

  /** Exact common closure data retained for mathematical export, without a fit. */
  export interface RetainedRule {
    /** Canonical-left max-U anchor, in unchanged raw radians. */
    readonly anchorRadians: number;
    /** Four ascending cubic rows mapping feature arc phase to raw radians. */
    readonly phasePowers: readonly (readonly number[])[];
    /** Three complete 28-channel quintic fields: D02, shared D03 and prefix K. */
    readonly fields: readonly (readonly number[])[];
    /** Existing dimensionless open-prefix observation limit. */
    readonly maximumFraction: number;
  }

  /** Skin and construction use these exact restrictions of one combined family. */
  export interface Result {
    /** Complete support02-through-open-prefix authority. */
    family: HumanCurveFamily.Family;
    /** Exact restriction replacing the old independently fitted shaft interior. */
    shaft: HumanCurveFamily.Family;
    /** Exact open restriction; its endpoint is neither a cap nor contour death. */
    prefix: HumanCurveFamily.Family;
    /** Same original input port object, retained for provenance only. */
    originalPort: HumanHandShafts.DistalPort;
    /** One new generated transverse authority shared by both incident domains. */
    jointPort: JointPort;
    /** Orientation in unchanged canonical raw shaft radians. */
    outwardSign: -1;
    /** Physical station bounds, all in millimetres. */
    domainMm: [number, number];
    /** Last common observed precritical fraction of the supplied reach budget. */
    maximumPrefixFraction: number;
    /** The common geometric map and its exact inverse-function Jacobians. */
    featurePhase: (canonicalPhaseRadians: number) => Phase;
    /** Same closure rule object; this getter neither copies nor refits channels. */
    readonly retainedRule: RetainedRule;
    /** Native, parameter, approximation and unrepresented-domain qualifications. */
    limitations: string[];
  }

  /** Dimensionless geometric feature phase is separate from raw radians. */
  export interface Phase {
    /** Zero through four; successive integers label opposed geometric features. */
    value: number;
    /** dfeature/draw-radian; its sign retains the declared side direction. */
    derivativePerRadian: number;
    /** Exact inverse-cubic d²feature/draw-radian² expression. */
    secondDerivativePerRadianSquared: number;
  }

  /**
   * Fit evidence jointly consumes 114 full shaft and 95 precritical contours.
   * Eighty-four common coefficients per digit identify the two physical shaft
   * slopes and prefix curvature in one linear system, with rank 84. Source
   * RMS is 1.632 to 2.499 mm and maximum 9.259 mm; conditional person-held-out
   * maximum is 11.026 mm. Existing endpoint P and independent q are retained.
   * These are derived generator jets, never measured native transverse jets.
   *
   * The shaft is cubic Hermite and the prefix quadratic in physical station.
   * Common four-feature quintic fields consume an invertible periodic C2
   * angular chart, identified from the existing G-linear root shape. Original
   * raw phi remains independent: only the common fields use its inverse map.
   * Source physical Hermite h has its separate geometric map and Jacobian.
   * Exact restriction in the common family derives every intermediate curve;
   * neither recursion nor angular sampling changes source topology or degree.
   */
  export function build(input: Input): Result {
    const { port }: Input = input;
    const rule: Rule = rules[input.digit];
    if (!rule) throw new Error("Only an identified nonthumb branch has a joint regular law");
    const G: number = input.handCircumferenceMm, R: number = input.reachMm;
    const start: number = port.family.intervals[0]!.startMm, middle: number = port.stationMm;
    const L: number = middle - start, end: number = middle + R * rule.maximumFraction;
    const side: number = port.handFrame.side === "l" ? 1 : -1;
    if (!input.id || !rule || !(G > 0 && Number.isFinite(G)) || !(R > 0 && Number.isFinite(R)) ||
      !(L > 0 && Number.isFinite(L)) || !(end > middle && Number.isFinite(end)) ||
      ![G / L, G / (R * R)].every(Number.isFinite))
      throw new Error("A joint regular digit requires actual ordered ports and positive representable dimensions");
    const U: HumanCurve.Vector = port.chart.axisU;
    const V: HumanCurve.Vector = port.chart.axisV.map((x: number): number => x * side) as HumanCurve.Vector;
    const featurePhase: Result["featurePhase"] = (phi: number): Phase => inversePhase(rule, side, phi);
    const field: (row: number, phi: number) => [HumanCurve.Vector, HumanCurve.Vector] =
      (row: number, phi: number): [HumanCurve.Vector, HumanCurve.Vector] => {
        const phase: Phase = featurePhase(phi), arc: number = Math.min(3, Math.floor(phase.value));
        const pair: HumanHandFeatureKernel.Pair = HumanHandFeatureKernel.planar(rule.fields[row]!, arc, phase.value - arc, 0);
        const slope: HumanHandFeatureKernel.Pair = HumanHandFeatureKernel.planar(rule.fields[row]!, arc, phase.value - arc, 1);
        return [U.map((x: number, i: number): number => x * pair[0] + V[i]! * pair[1]) as HumanCurve.Vector,
          U.map((x: number, i: number): number => (x * slope[0] + V[i]! * slope[1]) * phase.derivativePerRadian) as HumanCurve.Vector];
      };
    const endpoint: (at: "start" | "joint", phi: number) => HumanCurveFamily.Jet =
      (at: "start" | "joint", phi: number): HumanCurveFamily.Jet => {
        // The original callback sees the original phi; no inverse-map roundtrip.
        const original: HumanCurveFamily.Jet = at === "start" ? port.family.jet(start, phi) : port.jet(phi);
        const [value, phaseValue]: [HumanCurve.Vector, HumanCurve.Vector] = field(at === "start" ? 0 : 1, phi);
        return { positionMm: original.positionMm, phaseDerivativeMmPerRadian: original.phaseDerivativeMmPerRadian,
          longitudinalDerivative: port.originDerivative.map((x: number, i: number): number => x + G / L * value[i]!) as HumanCurve.Vector,
          longitudinalPhaseDerivativePerRadian: phaseValue.map((x: number): number => G / L * x) as HumanCurve.Vector };
      };
    const shaftInterval: HumanCurveFamily.Interval = HumanCurveFamily.interval(start, middle,
      (phi: number): HumanCurveFamily.Jet => endpoint("start", phi), (phi: number): HumanCurveFamily.Jet => endpoint("joint", phi));
    const prefixJet: HumanCurveFamily.Family["jet"] = (station: number, phi: number): HumanCurveFamily.Jet => {
      const boundary: HumanCurveFamily.Jet = endpoint("joint", phi);
      const [value, phaseValue]: [HumanCurve.Vector, HumanCurve.Vector] = field(2, phi);
      const s: number = station - middle, t: number = s / R;
      return { positionMm: s === 0 ? boundary.positionMm : boundary.positionMm.map((x: number, i: number): number => x + s * boundary.longitudinalDerivative[i]! + G * t * t * value[i]!) as HumanCurve.Vector,
        phaseDerivativeMmPerRadian: s === 0 ? boundary.phaseDerivativeMmPerRadian : boundary.phaseDerivativeMmPerRadian.map((x: number, i: number): number => x + s * boundary.longitudinalPhaseDerivativePerRadian[i]! + G * t * t * phaseValue[i]!) as HumanCurve.Vector,
        longitudinalDerivative: s === 0 ? boundary.longitudinalDerivative : boundary.longitudinalDerivative.map((x: number, i: number): number => x + 2 * G * t / R * value[i]!) as HumanCurve.Vector,
        longitudinalPhaseDerivativePerRadian: s === 0 ? boundary.longitudinalPhaseDerivativePerRadian : boundary.longitudinalPhaseDerivativePerRadian.map((x: number, i: number): number => x + 2 * G * t / R * phaseValue[i]!) as HumanCurve.Vector,
        longitudinalSecondDerivative: value.map((x: number): number => 2 * G / (R * R) * x) as HumanCurve.Vector };
    };
    const jet: HumanCurveFamily.Family["jet"] = (station: number, phi: number): HumanCurveFamily.Jet => {
      if (station < start || station > end || !Number.isFinite(station)) throw new Error("Joint digit evaluation is outside its retained physical domain");
      if (station > middle) return prefixJet(station, phi);
      const value: HumanCurveFamily.Jet = shaftInterval.jet(station, phi);
      if (station !== start && station !== middle) return value;
      return { ...value, ...endpoint(station === start ? "start" : "joint", phi) };
    };
    const limitations: string[] = [
      "The former shaft D is replaced by a jointly source-identified generated jet; old and new shaft interiors must receive the same affected-region inspection",
      "Both existing endpoint positions and original raw angular callback inputs are preserved; this does not repair their existing source shape or world-placement residual",
      "Only C1 is imposed across support03; the two exact one-sided physical second derivatives are published separately",
      "The actual clamped owner omits angular second jets. This candidate retains that omission instead of claiming source or owner Fphi-phi",
      "The common phase law uses all eight current generated roots per digit; native source h uses a distinct original-width map and is never replaced by radians",
      "Four source feature-order or C2-map failures remain unresolved. No original cubic h, direction or failed fit is discarded or reduced",
      "The precritical endpoint is an observation limit, not a tip feature. Saddle, multiple maxima, nail/skin interface and contour death remain unrepresented",
      "Current source-world RMS remains about 9.44 to 17.31 mm despite improved local shape; clinical/native intervention and unseen morphology are unvalidated",
      "Numerical all-domain screens and pending source fits are not actual-render acceptance or continuous embedding certification",
    ];
    const last: HumanCurve.Section = port.family.sections.at(-1)!;
    const principal: HumanCurve.Section[] = [port.family.sections[0]!, last,
      { id: input.id + ".open-prefix-end", stationMm: end,
        originMm: port.chart.originMm.map((x: number, i: number): number => x + (end - middle) * port.originDerivative[i]!) as HumanCurve.Vector,
        axisU: last.axisU, axisV: last.axisV, coefficientsMm: [] }];
    const family: HumanCurveFamily.Family = HumanCurveFamily.fromFunction(principal, jet, limitations);
    const jointPort: JointPort = { stationMm: middle, jet: (phi: number): HumanCurveFamily.Jet => endpoint("joint", phi),
      shaftSecondDerivative: (phi: number): HumanCurve.Vector => shaftInterval.jet(middle, phi).longitudinalSecondDerivative!,
      prefixSecondDerivative: (phi: number): HumanCurve.Vector => prefixJet(middle, phi).longitudinalSecondDerivative! };
    return { family, shaft: HumanCurveFamily.restrict(family, start, middle), prefix: HumanCurveFamily.restrict(family, middle, end),
      originalPort: port, jointPort, outwardSign: -1, domainMm: [start, end], maximumPrefixFraction: rule.maximumFraction, featurePhase, limitations,
      get retainedRule(): RetainedRule { return rule; } };
  }

  /** Physical angle(theta) is one monotone periodic cubic; its inverse is kept. */
  interface Rule {
    /** Canonical-left max-U angle in radians. */
    anchorRadians: number;
    /** Four ascending cubic rows of unwrapped angle versus feature arc phase. */
    phasePowers: readonly (readonly number[])[];
    /** Derived start-slope, shared03-slope and prefix-curvature 28-channel rows. */
    fields: readonly (readonly number[])[];
    /** Last common regular fraction, before any retained fixed-height event. */
    maximumFraction: number;
  }

  /** Solve only an admitted scalar inverse, preserving its Jacobian and side. */
  function inversePhase(rule: Rule, sign: number, phi: number): Phase {
    if (!Number.isFinite(phi)) throw new Error("The unchanged shaft angle must be finite radians");
    const period: number = 2 * Math.PI;
    const target: number = ((sign * phi - rule.anchorRadians) % period + period) % period;
    let arc: number = 3;
    for (let i: number = 0; i < 3; i++) if (target < rule.phasePowers[i + 1]![0]!) { arc = i; break; }
    const c: readonly number[] = rule.phasePowers[arc]!;
    let lo: number = 0, hi: number = 1;
    let u: number = (target - c[0]!) / (HumanHandFeatureKernel.polynomial(c, 1, 0) - c[0]!);
    for (let iteration: number = 0; iteration < 64; iteration++) {
      const residual: number = HumanHandFeatureKernel.polynomial(c, u, 0) - target;
      if (residual === 0) break;
      if (residual < 0) lo = u; else hi = u;
      const slope: number = HumanHandFeatureKernel.polynomial(c, u, 1);
      if (!(slope > 0 && Number.isFinite(slope))) throw new Error("The common geometric phase map lost positive speed");
      const candidate: number = u - residual / slope;
      const next: number = candidate > lo && candidate < hi ? candidate : lo + (hi - lo) / 2;
      if (next === u || next === lo || next === hi) break;
      u = next;
      if (iteration === 63) throw new Error("The geometric phase inverse exhausted its finite solve budget");
    }
    const speed: number = HumanHandFeatureKernel.polynomial(c, u, 1);
    const acceleration: number = HumanHandFeatureKernel.polynomial(c, u, 2);
    if (!(speed > 0 && Number.isFinite(speed))) throw new Error("The geometric phase Jacobian is unresolved");
    return { value: arc + u, derivativePerRadian: sign / speed, secondDerivativePerRadianSquared: -acceleration / (speed * speed * speed) };
  }

  /** Pooled common fields and G-independent phase laws; no person controls. */
  const rules: Record<Digit, Rule> = {"index":{"anchorRadians":6.187691680883374,"phasePowers":[[0.0,1.6228435065585984,-0.2123397245897949,0.17643425652697275],[1.5869380384957763,1.727466826959927,0.31696304499112404,-0.28088125663699337],[3.350486653809834,1.518749147031195,-0.525680724919855,0.3155793764794603],[4.659134452400634,1.414125826629866,0.4210574045185258,-0.2111323763694397]],"fields":[[0.025456286030369472,-0.019508840055199227,-0.028886113536391665,-0.014212894493634935,-0.01804284500607518,-0.055233908705401916,0.012215313601769723,-0.0392573469727089,0.0283486796493915,0.06680348366980163,-0.08396066613402257,0.03730796924815607,0.07873657940102026,0.1052674864703852,0.09042103479071388,0.2509763406029537,-0.46169512951800673,-0.09048663331056453,-0.12495197037178597,-0.023598235321571702,0.16631880070533386,0.04615681686846472,-0.2035417144341152,0.02361927542341739,0.02526713951062935,0.20805216440538066,-0.008907033676500899,0.13468570184815082],[0.044204980461863545,-0.01126815615929501,0.017980970820469677,-0.010168743593634823,0.0034135670611219367,-0.010175893991996449,0.03619411285017514,-0.021027004069993693,0.009337494439677171,0.022248097205323863,0.00021560069589300623,0.04009606111768801,0.07643794775702437,0.0763328490334891,-0.0026188407989798657,0.02827117401100829,-0.035929515229484725,0.002443794041495722,-0.0012507781250802597,-0.013984255367113011,0.006715772842273,-0.03164395348405324,-0.013062898282432511,-0.0005884834430296129,0.013173263081392501,0.052765784320383965,-0.014470019145546076,0.03479660104283514],[-0.07020463639082847,0.013369630509115438,-0.01302437145707143,-0.017547897008798274,0.03190917698127173,0.010389916852919887,-0.03138583346869363,0.04778971895278092,-0.06326914028689046,-0.06087071616701485,-0.050095978629471904,-0.08543518978478631,-0.13374402171086874,-0.11522876656970304,-0.04204775512324911,-0.06613475070801261,0.061520400527308186,-0.0306385536384739,0.04099030938691817,-0.011935283465245194,-0.009182822804927826,0.055356226196156,-0.02369310712213521,-0.007597498231187279,0.0006497481035487859,-0.03409456446919847,-0.023018939512402237,-0.0277940510734884]],"maximumFraction":0.9389502258196709},"middle":{"anchorRadians":0.04504583705225881,"phasePowers":[[0.0,1.4028798171878512,-0.09552915227279346,0.07864511598058233],[1.3859957808956405,1.447756860584012,0.1404061956689544,0.0033811948266739833],[2.9775400319752805,1.738712836401942,0.15054978014897547,-0.11532553456470396],[4.751477113961494,1.693835793005781,-0.1954268235451364,0.03329922375744765]],"fields":[[0.0299537197346287,0.01825647671099484,-0.030997929808373313,0.002331864083190381,0.015431814134958175,-0.012536224406869967,0.0009132367728640484,-0.03658711299131802,0.06206748379315402,-0.00909495220073727,-0.13272130065525162,0.13492396397079068,-0.03832517325184027,-0.020204180673588888,0.2602389210471854,0.03704008541601505,-0.33356676642720534,-0.05801677247697398,0.024013624368598094,0.05380412779211696,-0.08662635542263446,0.19671816347496154,-0.11029483078124126,0.3162101967774168,0.25041117603697965,-0.07497020226901613,0.15832677357111175,0.25543471682291913],[0.04282820240710698,-6.17495788918232e-07,0.0016748919155094022,-0.01001470913245557,-0.00759513962152919,-0.013326365517897482,0.008324949125889713,-0.03443357756703291,0.037943401939338366,-0.019525837246726463,-0.004974740981050076,0.06861882473159872,0.016574200798979442,-0.0360001804883704,0.11205389742366054,-0.03960978225711568,-0.1437007086468047,0.009461982199828871,0.00951338502083525,-0.03346065980435606,-0.039533664291426344,0.0695627571138391,-0.0015216819918473304,-0.003314720290557794,0.04944072909094985,-0.014703266207713306,0.04874663017950531,-0.03217175315960638],[-0.05819415362104516,0.0032981916160364777,0.0012644032747840678,-0.015323188303966229,0.0394697830301599,0.010761296083783338,-0.0031263588169909984,0.05710347021889453,-0.0747596816248711,-0.013138444713359095,-0.05064985712003802,-0.09476199336073407,-0.07788574340865936,0.003709152383430411,-0.09951971887332056,0.0185983470059143,0.14507656472918776,-0.031739941306675165,0.00843475609701156,0.024434217823117138,0.03017797461229088,-0.0351857137292068,-0.010087489685989125,0.0016103195216838292,-0.05777934492062159,0.04897647133695726,-0.08404990298528471,0.02918767056247339]],"maximumFraction":0.9173506727688855},"ring":{"anchorRadians":0.02509866090629294,"phasePowers":[[0.0,1.2339212185696722,-0.03276287389503696,0.1246475091380932],[1.3258058538127284,1.5423379981938778,0.3411796535192413,-0.10567529007074672],[3.103648215455101,1.907671435020121,0.024153783307001575,-0.11890811541273649],[4.9165653183694875,1.5992546553959155,-0.332570562931207,0.09993589634539024]],"fields":[[-0.008375670136304294,-0.01529071811942205,-0.04688586605403939,0.03218409899783606,-0.040187323408859235,0.008417210332089534,0.00011885477714782683,-0.03892726235790277,0.03487474116655831,0.06031651256563967,0.04850217613729563,0.03528508515716231,0.002886156569756982,-0.0075069364954540585,0.09578025524326916,0.14971390459566852,0.2502702515847792,-0.2053275731486305,0.04049588769682856,0.14158136815925754,-0.223877903434067,-0.06641849694774343,-0.03229296542053621,-0.24485378156188556,-0.04693099556593965,0.3051305365628567,-0.25677229776755506,-0.09497389351090857],[0.029831181214756128,-0.022937123245965987,-0.002256107811357287,-0.0018654907416291002,-0.03858728126867872,-0.01666138353223312,-0.004370835051886776,-0.03569803728705027,0.06246346540184671,0.057225981476214424,0.05888815337546378,0.03757342184069643,-0.08592397201643877,-0.0790708755702147,-0.05126181325529583,0.041036482656662314,0.09163793779711671,-0.09154845465700767,-0.000308344834181129,0.010610520432317383,-0.020178298522349022,0.0022140317081886006,0.053274306903623586,-0.03496075584947285,-0.007502560487792381,0.07727398410597429,-0.021174284588181713,0.049652642752177664],[-0.05578310944372325,0.02474596559240288,-0.002399632479155492,-0.015693259992710595,0.049966335068821706,0.020585993237830738,-0.0022200499265913887,0.056644090197399674,-0.08923028102660335,-0.07430178535166274,-0.08750789053783596,-0.06685732200660352,-0.006370689958256389,0.017373262815209598,0.009589117177784143,-0.0368150873826165,-0.021390785122712915,0.03901044166161884,-0.03750865406068295,0.031010479333340737,0.03731965298391539,0.026279513350946946,-0.0835438909187488,0.049288828854858066,-0.014803589119843655,-0.023317227232674303,-0.04185653662237214,-0.03865460318394483]],"maximumFraction":0.9164878657792604},"pinky":{"anchorRadians":6.207397975466954,"phasePowers":[[0.0,1.374739759332035,0.5280070362592428,-0.2684309495531947],[1.634315846038083,1.6254609831909366,-0.27728581240034145,0.23198784528916794],[3.2144788621178466,1.7668528942577584,0.41867772346716237,-0.3626922235977419],[5.037317256245025,1.5161316703988565,-0.6693989473260644,0.3991353278617691]],"fields":[[0.059179288630462686,-0.05716203140188797,0.04614531018488861,0.01977167020187017,0.042161247593341535,-0.012553537945698447,0.030969279195869767,0.038349394538599604,0.0011875937823574122,0.12429237196478657,0.013210472407253263,-0.16936177914084732,0.28368178234555813,-0.021707465041483093,-0.33593966215646387,-0.004115994270777124,-0.05872397640600022,0.02216419269042349,-0.23975102867491663,-0.012341093070922675,0.022671230290736498,-0.17325536793797602,-0.08116840584872714,0.0062926045236255754,-0.23721600812177074,-0.16476119543711432,-0.3311892676322756,0.06578617814903426],[0.02186088343597505,-0.018979091540795245,0.006925420185738315,-0.0063793658611436856,-0.006771774116166834,-0.01969941190579238,0.0032987062926801425,-0.027046761091967714,0.018078738490991425,0.0270618606268808,0.020819370887886074,0.0018866399866681385,-0.004303749342030956,-0.03539220428830871,0.025906696520682643,0.053306953439525254,0.0031998128787126545,-0.013951426008877083,-0.01291727506694177,-0.004702039114480133,-0.04810990974124535,0.0018297176541412531,0.013894894043210197,-0.048038736826178256,0.03881644240627809,-0.035566879036273966,0.03250626831617784,-0.005747203009752627],[-0.056386966442974806,0.029284346320197788,-0.006536561706402905,-0.016440392422033268,0.031159019512521202,0.026124190579560683,-0.01170367332061581,0.06097637227205918,-0.06754679128169833,-0.08040947097551954,-0.06870633315901413,-0.03701008463194679,-0.008925204332768166,-0.0010989244264196342,0.01418425576766999,-0.0658301911849963,0.030985174781832173,0.006923686186768363,0.00815370421397468,0.03505733105645234,0.09236686572858316,0.02169458343227649,-0.05589430872217378,0.06791156521559949,-0.06277303431034706,0.050914884066219565,-0.05415847820129914,0.007641063873126831]],"maximumFraction":0.8146107147148444}};
}
