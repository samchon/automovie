import { AutoMovieHumanMedianWorldY as MedianWorldY } from "./AutoMovieHumanMedianWorldY";
import { AutoMovieHumanRadiusEpoch as RadiusEpoch } from "./AutoMovieHumanRadiusEpoch";
import { AutoMovieHumanHeadNeckPhaseLookup as NeckPhase } from "./AutoMovieHumanHeadNeckPhaseLookup";
import { AutoMovieHumanHorizontalChain } from "../lofting/AutoMovieHumanHorizontalChain";
import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanLoftParameter } from "../lofting/AutoMovieHumanLoftParameter";
import { AutoMovieHumanNaturalSpline } from "../lofting/AutoMovieHumanNaturalSpline";
import { AutoMovieHumanPolarSection } from "../lofting/AutoMovieHumanPolarSection";
import type { IAutoMovieHumanHermiteCurve } from "../lofting/IAutoMovieHumanHermiteCurve";
import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanHeadIdentity } from "../structures/head/IAutoMovieHumanHeadIdentity";
import { AutoMovieHumanEarConstruction } from "./AutoMovieHumanEarConstruction";
import { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";
import { AutoMovieHumanHeadClosure } from "./AutoMovieHumanHeadClosure";
import type { AutoMovieHumanHeadDefinition } from "./AutoMovieHumanHeadDefinition";
import type { AutoMovieHumanHeadLandmarks } from "./AutoMovieHumanHeadLandmarks";
import { AutoMovieHumanNasalConstruction as NasalOwner } from "./AutoMovieHumanNasalConstruction";
import { AutoMovieHumanLipCornerCap as LipCap } from "./AutoMovieHumanLipCornerCap";
import { AutoMovieHumanNasalRim as NasalRim } from "./AutoMovieHumanNasalRim";
import { AutoMovieHumanHeadCranialSupport as Cranial } from "./AutoMovieHumanHeadCranialSupport";
import { AutoMovieHumanAlarHeadSections as Alar } from "./AutoMovieHumanAlarHeadSections";
import { AutoMovieHumanMandibularQuery as Mandibular } from "./AutoMovieHumanMandibularQuery";
import { AutoMovieHumanMandibularBorder as MandibularBorder } from "./AutoMovieHumanMandibularBorder";
import { AutoMovieHumanMouth } from "./AutoMovieHumanMouth";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * The head and ears generated from the neck ring and the public head inputs.
 *
 * Centres first. The neck ring gives the skull's place; the head lengths give
 * the vertex, eye level, nose and menton as stations along a common axis; the
 * axis hands over from the neck ring's centre to the skull's by the nose.
 *
 * About that axis a section is a closed form: the smooth union of a back body
 * and a face shield, two super-ellipses in the section's plane. Below the nose
 * the planes tilt forward, so that they pass under the chin. The measures of
 * those two bodies run along the station as natural splines through the
 * prior's keys, which are in head lengths and breadths, and every measure
 * closes on the vertex through one analytic cap. The public widths enter as
 * keys of the shield's half-width. A third body, the mandible's skin, joins
 * them along each ray by a smooth minimum of absolute width, wider where the
 * skin under the jaw meets the neck: an arch in plan from the chin to the
 * gonions over the mandibular plane, whose side leans in from the cheek to the
 * angle and whose border turns under into skin falling inward to the neck. The
 * soft tissue's roundings grow with fat.
 *
 * Named features are reliefs written as radial heights over that surface, each
 * with its own place, widths and depth, driven by the public dimensions: the
 * planes and hollows of the face, the nose's dorsum, tip, alae and sill, the
 * philtrum, the lips and the oral fissure between them. The nose stands on a base
 * edge, so it ends on a shelf facing down, and the nostrils lie in that shelf and
 * face as it does. The sockets fall to seat
 * the eyes a fixed depth behind the nasion. The lid margins, globes, nostrils
 * and the lips' colour boundary are placed from the same dimensions, so they
 * stay on the features they belong to.
 *
 * The neck ring's difference from the law, and its slope's, fade in over the
 * jaw, so the bottom ring is the neck's own and leaves it as the neck does. The lower and middle head's layers both crowd about
 * the nose's base, which crosses their join. Auricles are spliced into the
 * sections of the middle chain by `AutoMovieHumanEarConstruction`, and their
 * free ends are the ear chains. Rings are parametrized by each chain's own
 * phase rule.
 */
export namespace AutoMovieHumanHeadConstruction {
  /** What the head reads, world millimetres. */
  export interface IInputs {
    /** The public head identity. */
    head: IAutoMovieHumanHeadIdentity;

    /** Stature. */
    height: number;

    /** Neck length. */
    neckLength: number;

    /** Neck tape. */
    neck: number;

    /** Masculine-feminine control. */
    sex: number;

    /** Fat control. */
    fat: number;
  }

  /** Head and lip boundary. */
  export interface IOutput {
    /** Calibration with the head, ears, eyes and openings replaced. */
    body: IAutoMovieHumanBodyCalibration;

    /** Lip colour boundary. */
    vermilion: IAutoMovieHumanHermiteCurve;
    /** Actual construction findings; never a clinical identity certificate. */
    diagnostics: IConstructionDiagnostics;
  }

  /** Actual construction evidence retained through the head's public result. */
  export interface IConstructionDiagnostics {
    /** Achieved-minus-requested residuals, including unavailable readings. */
    closure: AutoMovieHumanHeadClosure.IOutput["residuals"];
    /** Unaccepted source geometry, distinct from clinical reference status. */
    geometry: string[];
    /** Actual section domains not yet assigned to a final nostril interior. */
    alarSections: IAlarSection[];
  }

  /** A physical alar section whose topology still needs consumer admission. */
  export interface IAlarSection {
    /** Existing physical head station in calibration millimetres. */
    station: number;
    /** Actual side of the figure. */
    side: "left" | "right";
    /** Measured endpoint gaps to the source face polyline, millimetres. */
    gaps: number[];
    /** Preserved extra paths, never silently removed as an outer envelope. */
    remaining: IAlarPath[];
    /** Every actual face-to-face component, including competing fallback paths. */
    facePaths: IAlarPath[];
    /** Actual face-to-face component count before any fallback. */
    facePathCount: number;
    /** Actual coplanar triangle count retained from the physical section. */
    coplanarTriangles: number;
    /** This diagnostic records an unaccepted physical section. */
    admission: "unaccepted";
    /** Geometry and seam causes preventing section admission. */
    rejectionReasons: string[];
    /** Number of section graph nodes with more than two neighbours. */
    branching: number;
  }

  /** A complete physical component returned by the alar plane section. */
  export interface IAlarPath {
    /** Ordered world points in calibration millimetres. */
    points: Vec3[];
    /** Whether the first and last path nodes share an edge. */
    closed: boolean;
    /** Actual mesh boundary at the first endpoint; absent on closed paths. */
    startBoundary?: string;
    /** Actual mesh boundary at the last endpoint; absent on closed paths. */
    endBoundary?: string;
  }

  /** The neck ring's place and size. */
  export interface INeck {
    /** Height. */
    level: number;

    /** Centre ahead of the origin. */
    x: number;

    /** Tube's radius above the ring, from the neck tape. */
    radius: number;
  }

  /** One eye's opening, calibration millimetres. */
  export interface IEyeOpening {
    /** Distance of the fissure's centre from the midline. */
    place: number;

    /** Length of the margin. */
    length: number;

    /** Height of the margin. */
    height: number;

    /** How far the socket falls to seat the eye. */
    seat: number;
  }

  /** Stations and sizes of one person, calibration millimetres. */
  export interface ILayout {
    /** Calibration millimetres per world millimetre. */
    scale: number;

    /** Masculine-feminine control. */
    sex: number;

    /** Fat control. */
    fat: number;

    /** Neck ring's height. */
    y0: number;

    /** The neck ring. */
    neck: INeck;

    /** Menton. */
    menton: number;

    /** Stomion. */
    stomion: number;

    /** Subnasale. */
    subnasale: number;

    /** Nose tip. */
    tip: number;

    /** Nasion. */
    nasion: number;

    /** Eye level. */
    eye: number;

    /** Vertex. */
    vertex: number;

    /** Skull centre ahead of the origin. */
    centre: number;

    /** Greatest vault length. */
    length: number;

    /** Greatest vault breadth. */
    breadth: number;

    /** Face height. */
    faceHeight: number;

    /** Face half-width key. */
    faceWidth: number;

    /** Mandibular breadth before its final skin closure. */
    mandibularWidth: number;

    /** Signed physical cranial support coefficient, closed on actual skin tape. */
    vault: number;
    /** Physical boundaries of the existing full-vault course family. */
    cranialLower?: number;
    /** Upper physical boundary of the same cranial course family. */
    cranialUpper?: number;
    /** Geometry failures remain separate from clinical availability. */
    geometryFindings: string[];
    /** Reuse the unchanged implicit source operator at each current station. */
    cranialQueries: Map<number, ReturnType<typeof Cranial.prepare>>;
    /** Exact unsigned radius results retained only within the current geometry epoch. */
    radiusEpoch?: RadiusEpoch.ICache;

    /** Log ratio of the jaw width against the face width's. */
    jaw: number;

    /** Log ratio of the forehead width against the face width's. */
    brow: number;

    /** Half nose width. */
    noseWidth: number;

    /** Tip's lead past the face. */
    noseLead: number;

    /** Half mouth width. */
    mouthWidth: number;

    /** Upper vermilion height. */
    upperLip: number;

    /** Lower vermilion height. */
    lowerLip: number;

    /** Rest gap of the lips. */
    gap: number;

    /** Fullness of the jaw joint in front of the ear. */
    joint: number;

    /** Left eye. */
    left: IEyeOpening;

    /** Right eye. */
    right: IEyeOpening;

    /** Station map. */
    station: AutoMovieHumanNaturalSpline.ISpline;

    /** Columella's rise above the horizontal, radians. */
    columella: number;

    /** Least rounding of the nose's base, from the sampling there. */
    round: number;

    /** The jaw, once the chin and the ears are placed. */
    mandible?: IMandible;
  }

  /** The person's mandible, calibration millimetres. */
  export interface IMandible {
    /** Arch's front apex on the midline. */
    front: number;

    /** Gonion's place along the face's forward axis. */
    gonion: number;

    /** Gonion's height. */
    gonionY: number;

    /** Arch's half-width at the gonion. */
    width: number;

    /** Arch's half-length behind the gonion. */
    back: number;

    /** Radius of the chin's turn in plan. */
    radius: number;

    /** Point on the midline behind the gonions the arch is read from, along the forward axis. */
    origin: number;

    /** Outward unit normal of the arch's left side in plan, `[x, z]`. */
    side: [number, number];

    /** Where that side leaves the arch's back, `[x, z]`. */
    start: [number, number];

    /** Where it meets the chin's turn, `[x, z]`. */
    end: [number, number];

    /**
     * Share of the half-width the jaw's side gains per millimetre over its
     * border: the line from the gonion up to the cheek at the zygomatic arch.
     */
    spread: number;

    /** The chin's skin along the forward axis, where the plane passes the menton. */
    chin: number;

    /** Menton's height. */
    menton: number;

    /** Mandibular plane's rise toward the back per millimetre. */
    slope: number;

    /** Cosine of the mandibular plane's angle. */
    cos: number;

    /** Cosine and sine of the ramus's lean back from the vertical. */
    lean: [number, number];

    /** Body's height over its border, where it ends inside the face. */
    height: number;

    /** Zygomatic arch height, where the mandible hands over to the cheek. */
    cheekY: number;

    /** Inward run of the skin under the border per millimetre of fall. */
    draft: number;

    /** Soft tissue's rounding of the turn under the border. */
    round: number;

    /** Share of that rounding at the jaw's side; its inverse square at the underside. */
    taper: number;

    /** Width of the blend with the face and neck. */
    blend: number;

    /** Width of that blend under the border, where the jaw meets the neck. */
    throat: number;
  }

  /** One section's measures in its own plane. */
  export interface ISection {
    /** Normalized station. */
    t: number;

    /** Tilt of the plane, radians. */
    tilt: number;

    /** Back body's centre. */
    axis: number;

    /** Front apex. */
    front: number;

    /** Back apex. */
    back: number;

    /** Back body half-width. */
    width: number;

    /** Shield's widest place. */
    waist: number;

    /** Shield half-width. */
    face: number;

    /** Share of the shield in the union: none where the plain neck is. */
    shield: number;

    /** Back body exponent. */
    powerBack: number;

    /** Shield exponent. */
    powerFace: number;

    /** Station: the plane's height on the vertical through the origin. */
    station: number;

    /** The jaw's volume, joined to the two bodies along each ray. */
    jaw?: IMandible;
    /** Physical support deformation on this course, millimetres. */
    cranialCoefficient?: number;
    /** Operators shared only within this layout's current rebuilt geometry. */
    cranialQueries?: Map<number, ReturnType<typeof Cranial.prepare>>;
    /** Current geometry epoch's exact unsigned radius lookup. */
    radiusEpoch?: RadiusEpoch.ICache;
    /** Mutable report of source geometry that could not be accepted. */
    geometryFindings?: string[];
  }

  /** The prior's curves prepared. */
  export interface ICompiled {
    /** The prior they come from. */
    prior: AutoMovieHumanHeadPrior.IPrior;

    /** Back body's centre along the station. */
    axis: AutoMovieHumanNaturalSpline.ISpline;

    /** Front apex along the station. */
    front: AutoMovieHumanNaturalSpline.ISpline;

    /** Back apex along the station. */
    back: AutoMovieHumanNaturalSpline.ISpline;

    /** Back body's half-width along the station. */
    width: AutoMovieHumanNaturalSpline.ISpline;

    /** Shield's widest place along the station. */
    waist: AutoMovieHumanNaturalSpline.ISpline;

    /** Shield's half-width along the station. */
    face: AutoMovieHumanNaturalSpline.ISpline;

    /** Back body's squareness along the station. */
    squareBack: AutoMovieHumanNaturalSpline.ISpline;

    /** Shield's squareness along the station. */
    squareFace: AutoMovieHumanNaturalSpline.ISpline;

    /** Midline profile along the station. */
    profile: AutoMovieHumanNaturalSpline.ISpline;

    /** Nose's dorsum along the station. */
    dorsum: AutoMovieHumanNaturalSpline.ISpline;
  }

  /** Prepare a prior's curves. */
  export function compile(
    prior: AutoMovieHumanHeadPrior.IPrior = AutoMovieHumanHeadPrior.PRIOR,
  ): ICompiled {
    const spline = (values: readonly number[]): AutoMovieHumanNaturalSpline.ISpline =>
      AutoMovieHumanNaturalSpline.create(prior.knots, values);
    const c: AutoMovieHumanHeadPrior.ICurves = prior.curves;
    return {
      prior,
      axis: spline(c.axis),
      front: spline(c.front),
      back: spline(c.back),
      width: spline(c.width),
      waist: spline(c.waist),
      face: spline(c.face),
      squareBack: spline(c.squareBack),
      squareFace: spline(c.squareFace),
      profile: AutoMovieHumanNaturalSpline.create(
        prior.face.profileKnots,
        prior.face.profile,
      ),
      dorsum: AutoMovieHumanNaturalSpline.create(
        prior.face.profileKnots,
        prior.face.dorsum,
      ),
    };
  }

  /** The person's stations and sizes from the neck ring and the inputs. */
  export function layout(
    compiled: ICompiled,
    inputs: IInputs,
    neck: INeck,
    scale: number,
  ): ILayout {
    const r: AutoMovieHumanHeadPrior.IRatios = compiled.prior.ratios;
    const f: AutoMovieHumanHeadPrior.IFace = compiled.prior.face;
    const k: number = scale;
    const head: IAutoMovieHumanHeadIdentity = inputs.head;
    const y0: number = neck.level;
    const menton: number = y0 + inputs.neckLength * k;
    const vertex: number = menton + head.height * k;
    const nasion: number = menton + head.faceHeight * k;
    const eye: number = nasion;
    const subnasale: number = nasion - head.face.nose.height * k;
    const columella: number = ((f.nasolabial[0]! + f.nasolabial[1]! * inputs.sex - 90 + f.nasolabial[2]!) * Math.PI) / 180;
    const tip: number = subnasale + head.face.nose.protrusion * k * Math.sin(columella);
    const face: number = head.faceWidth * k / 2;
    const opening = (eye: PublicEye): IEyeOpening => ({
      place: ((head.face.intercanthalWidth + eye.palpebralFissureLength) * k) / 2,
      length: eye.palpebralFissureLength * k,
      height: eye.palpebralFissureHeight * k,
      seat: 0,
    });
    return {
      scale: k,
      sex: inputs.sex,
      fat: inputs.fat,
      y0,
      neck,
      menton,
      stomion: subnasale - f.stomion * (subnasale - menton),
      subnasale,
      tip,
      nasion,
      eye,
      vertex,
      centre: neck.x + r.forward * neck.radius,
      length: head.length * k,
      breadth: (head.length * head.cephalicIndex * k) / 100,
      faceHeight: head.faceHeight * k,
      vault: 0,
      geometryFindings: [],
      cranialQueries: new Map(),
      faceWidth: face,
      mandibularWidth: head.mandibularWidth * k,
      jaw: Math.log(
        head.mandibularWidth / head.faceWidth,
      ),
      brow: Math.log(
        head.minimumFrontalWidth / head.faceWidth,
      ),
      noseWidth: (head.face.nose.width * k) / 2,
      noseLead: head.face.nose.protrusion * k,
      mouthWidth: (f.mouth * head.face.mouth.width * k) / 2,
      upperLip: f.vermilion * head.face.mouth.upperVermilionHeight * k,
      lowerLip: f.vermilion * head.face.mouth.lowerVermilionHeight * k,
      gap: 0,
      joint: f.joint * head.mandibularLaterotrusion * k,
      left: opening(head.face.eyePair.left),
      right: opening(head.face.eyePair.right),
      station: AutoMovieHumanNaturalSpline.create(
        [y0, menton, subnasale, eye, vertex],
        [0, 1, 2, 3, 4],
      ),
      // The nasolabial angle is the columella's rise plus the right angle and the
      // upper lip's forward lean.
      columella,
      // The lower head's layers run from the neck ring to the ears' lower ends,
      // about the subnasale; `generate` sets the exact pitch.
      round: (f.round * (subnasale - y0)) / (LAYERS_LOWER - 1),
    };
  }

  /** Measures of the section at station s. */
  export function section(
    compiled: ICompiled,
    plan: ILayout,
    s: number,
  ): ISection {
    const t: number = Math.min(
      4,
      Math.max(0, AutoMovieHumanNaturalSpline.evaluate(plan.station, s)),
    );
    const read = (c: AutoMovieHumanNaturalSpline.ISpline): number =>
      AutoMovieHumanNaturalSpline.evaluate(c, t);
    const q: number = Math.min(
      1,
      Math.max(0, (s - plan.y0) / (plan.vertex - plan.y0)),
    );
    const cap: number = Math.sqrt(Math.max(1e-6, 1 - q * q));

    // The face hangs from the skull. The back body is the neck's tube, handing
    // over to the skull's sizes up through the jaw.
    const skull: number = plan.centre + (plan.length / 2) * read(compiled.axis);
    const w: number = smooth((HANDOVER - t) / (HANDOVER - HANDED));
    const half: number =
      plan.length / 2 + w * (plan.neck.radius - plan.length / 2);
    const wide: number =
      plan.breadth / 2 + w * (plan.neck.radius - plan.breadth / 2);
    const axis: number =
      skull + smooth(1 - t / LEAN) * (plan.neck.x - plan.centre);
    return {
      t,
      tilt: tiltOf(compiled.prior.tilt, t),
      axis,
      front: skull + (plan.length / 2) * cap * Math.exp(read(compiled.front)),
      back: axis - half * cap * Math.exp(read(compiled.back)),
      width:
        wide *
        cap *
        Math.exp(read(compiled.width) + plan.jaw * bell((t - 1.5) / 0.45)),
      waist:
        skull +
        (plan.length / 2) * cap * 0.35 * (1 + Math.tanh(read(compiled.waist))),
      face:
        plan.faceWidth *
        cap *
        Math.max(0.05, smooth((t - SHIELD_FROM) / SHIELD_RISE)) *
        Math.exp(
          read(compiled.face) +
            plan.jaw * smooth((1.9 - t) / 0.9) +
            plan.brow * smooth((t - 2.8) / 0.5),
        ),
      shield: smooth((t - SHIELD_FROM) / SHIELD_RISE) ** 3,
      powerBack:
        4 +
        2 *
          Math.tanh(
            read(compiled.squareBack),
          ),
      powerFace: 4 + 2 * Math.tanh(read(compiled.squareFace)),
      station: s,
      jaw: plan.mandible,
      cranialCoefficient: plan.vault === 0 ? 0 : plan.vault * Cranial.weight(s, plan.cranialLower!, plan.cranialUpper!),
      cranialQueries: plan.cranialQueries,
      radiusEpoch: plan.radiusEpoch,
      geometryFindings: plan.geometryFindings,
    };
  }

  /** One on the section's outline, as a distance scale about its centres. */
  export function field(section: ISection, x: number, z: number): number {
    const neck: number = smooth((HANDOVER - section.t) / (HANDOVER - HANDED));
    const anterior: number = neck * (section.axis - section.back) + (1 - neck) * (section.waist - section.axis);
    const g: number = lame(
      (x - section.axis) / Math.max(1, x < section.axis ? section.axis - section.back : anterior),
      z / section.width,
      section.powerBack,
    );
    const f: number = lame(
      (x - section.waist) / Math.max(1, section.front - section.waist),
      z / section.face,
      section.powerFace,
    );
    // A width floor does not remove the shield: on the midline its lateral term
    // is exactly nothing, so 0.3 mm of it stood proud of the neck as a needle.
    return (g ** -POWER + section.shield * f ** -POWER) ** (-1 / POWER);
  }

  /** Radius of the section's outline along a ray from `(ox, 0)`, the jaw joined. */
  export function radius(section: ISection, ox: number, theta: number, guess: number = 0): number {
    const cache: RadiusEpoch.ICache | undefined = section.radiusEpoch;
    return cache === undefined ? uncachedRadius(section, ox, theta, guess)
      : cache.read(section.jaw, section.station, ox, theta, guess, (): number => uncachedRadius(section, ox, theta, guess));
  }

  /** Compute the unchanged unsigned geometric radius before signed skin composition. */
  function uncachedRadius(
    section: ISection,
    ox: number,
    theta: number,
    guess: number = 0,
  ): number {
    const coefficient: number = section.cranialCoefficient ?? 0;
    if (coefficient === 0) return jawed(section, ox, theta, bodies(section, ox, theta, guess));
    const query: ReturnType<typeof Cranial.prepare> = Cranial.stationQuery(section.cranialQueries, section.station, (): ReturnType<typeof Cranial.prepare> =>
      Cranial.prepare({ ...section, handed: HANDED, handover: HANDOVER, power: POWER }, ox, (angle: number): ReturnType<typeof Cranial.sourceRadius> => Cranial.sourceRadius({ ...section, handed: HANDED, handover: HANDOVER, power: POWER }, ox, angle)));
    const result: Cranial.IRadius = query(theta, coefficient);
    if (!result.healthy && section.geometryFindings !== undefined) {
      const reason: string = result.reason ?? "Unaccepted cranial support deformation";
      if (!section.geometryFindings.includes(reason)) section.geometryFindings.push(reason);
    }
    return jawed(section, ox, theta, result.radius);
  
}

  /** Radius of the union of the back body and the shield along a ray. */
  function bodies(section: ISection, ox: number, theta: number, guess: number): number {
    const result: ReturnType<typeof Cranial.sourceRadius> = Cranial.sourceRadius({ ...section, handed: HANDED, handover: HANDOVER, power: POWER }, ox, theta, guess);
    if (!result.healthy && section.geometryFindings !== undefined) {
      const reason: string = result.reason ?? "Unaccepted original source radius root";
      if (!section.geometryFindings.includes(reason)) section.geometryFindings.push(reason);
    }
    return result.radius;
  }

  /**
   * The outline along a ray with the jaw joined: the outermost root of a smooth
   * minimum, of absolute width, of the distance past the bodies' outline and
   * the jaw's signed distance. A width in millimetres, unlike the bodies' scale
   * union, swells the skin by a quarter of it at most where the two meet flush,
   * and rounds the hollow between the jaw's underside and the neck by about it;
   * {@link blendAt} sets it.
   */
  function jawed(
    section: ISection,
    ox: number,
    theta: number,
    base: number,
  ): number {
    const m: IMandible | undefined = section.jaw;
    if (m === undefined) return base;
    const c: number = Math.cos(theta);
    const n: number = Math.sin(theta);
    const cos: number = Math.cos(section.tilt);
    const sin: number = Math.sin(section.tilt);

    // The lateral lower face belongs to the mandible. A union alone can only
    // enlarge the old face shield, so first trim that shield to the jaw arch.
    // The ownership fades at the zygomatic arch and behind the gonions, where
    // the vault and neck remain responsible for the skin.
    const bx: number = (ox + base * c) * cos;
    const by: number = section.station + (ox + base * c) * sin;
    const ownership: number = smooth((m.cheekY - by) / Math.max(m.round, m.cheekY - m.gonionY)) * smooth((bx - m.gonion + m.back) / m.back) * smooth((by - mandibularQuery(m).minimumY + m.round) / m.round);
    let loArch: number = base;
    if (ownership > 0) {
      loArch = 0;
      let hiArch: number = Math.max(base, 1);
      for (let i: number = 0; i < 32; i++) {
        const r: number = (loArch + hiArch) / 2;
        const xi: number = ox + r * c;
        const x: number = xi * cos;
        const y: number = section.station + xi * sin;
        if (mandible(m, x, y, r * n) < 0) loArch = r;
        else hiArch = r;
      }
    }
    const trimmed: number = base + ownership * (Math.min(base, loArch) - base);

    // The march steps no further than the widest blend can reach.
    const k: number = Math.max(m.blend, m.throat);
    const join = (r: number): [number, number] => {
      const xi: number = ox + r * c;
      const x: number = xi * cos;
      const y: number = section.station + xi * sin;
      const d: number = mandible(m, x, y, r * n);
      return [ownership >= 1 - 1e-12 ? d : softMin(r - trimmed, d, blendAt(m, x, y, r * n)), d];
    };
    let inside: number = -1;
    let outside: number = -1;
    for (let r: number = trimmed, i: number = 0; i < 400; i++) {
      const [v, d] = join(r);
      if (v < 0) {
        inside = r;
        outside = -1;
      } else if (outside < 0) outside = r;
      if (v >= 0 && d > JAW_REACH) break;
      r += Math.max(JAW_STEP, Math.abs(d) - k);
    }
    if (inside < 0) return trimmed;
    if (outside < 0) return inside;
    let lo: number = inside;
    let hi: number = outside;
    for (let i: number = 0; i < 32; i++) {
      const mid: number = (lo + hi) / 2;
      if (join(mid)[0] < 0) lo = mid;
      else hi = mid;
    }
    return lo;
  }

  /**
   * Width of the jaw's blend at a point: its own over and beside the jaw, the
   * throat's under the border and well inside the arch, where the skin under
   * the jaw meets the neck at the cervicomental angle. The sections cross that
   * hollow nearly along the skin under the jaw, so a blend of the jaw's own
   * 6 mm turned it within one layer and shaded it as a row of facets. Within a
   * round of the arch the throat's width would swell the chin's sides, where
   * the jaw and the face meet nearly flush, and round the border away.
   */
  function blendAt(m: IMandible, x: number, y: number, z: number): number {
    const below: number = (m.menton + (m.chin - x) * m.slope - y) * m.cos;
    const inside: number = -arch(m, x, y, z);
    return (
      m.blend +
      (m.throat - m.blend) *
        smooth(below / m.round) *
        smooth((inside - m.round) / m.round)
    );
  }

  /**
   * Signed distance from the jaw's arch in plan, first order, negative inside.
   *
   * The arch is the hull of the chin's turn and an ellipse about the gonions:
   * the body runs straight from each angle to the chin. Over the border the
   * arch widens across by {@link IMandible.spread}, so the jaw's side leans in
   * from the cheek to the angle as the masseter does, while its front, whose
   * skin faces forward, stays where the chin is.
   */
  function arch(m: IMandible, x: number, y: number, z: number): number {
    const h: number = (y - m.menton - (m.chin - x) * m.slope) * m.cos;
    // Smooth through the border, so the lean starts inside its rounding.
    const over: number = (Math.hypot(h, m.round) + h - m.round) / 2;
    const s: number = Math.max(0.5, 1 + m.spread * over);
    const pz: number = Math.abs(z) / s;

    // Read along the ray from a point on the midline behind the gonions: the
    // distance out to the outline along it, times the cosine of the outline's
    // normal there. The skin under the jaw falls inward by this distance, and
    // a distance to the nearest piece of the outline creases where two pieces
    // are equally near: down the midline and at the chin's centre, which
    // printed a groove under the jaw and a turn of 120 degrees in a ring under
    // the chin. Along rays the outline's own smoothness carries inward, up to
    // the one point the rays leave from; halfway to the chin that point's
    // cone turned a ring under the jaw by 145 degrees, so it stands behind the
    // gonions, inside the neck.
    const vx: number = x - m.origin;
    const l: number = Math.hypot(vx, pz);
    if (l < 1e-9) return -exit(m, 1, 0)[0];
    const ux: number = vx / l;
    const uz: number = pz / l;
    const [reach, nx, nz] = exit(m, ux, uz);
    const d: number = (l - reach) * Math.max(0.2, ux * nx + uz * nz);
    return d / Math.hypot(nx, nz / s);
  }

  /**
   * Where a ray from the arch's origin leaves its left half, and the
   * outline's outward normal there: `[distance, nx, nz]`, for `uz >= 0`.
   */
  function exit(m: IMandible, ux: number, uz: number): [number, number, number] {
    const [sx, sz] = m.side;
    const along: number = ux * sx + uz * sz;
    if (along > 1e-12) {
      const t: number = ((m.start[0] - m.origin) * sx + m.start[1] * sz) / along;
      const qx: number = m.origin + t * ux;
      const qz: number = t * uz;
      const ex: number = m.end[0] - m.start[0];
      const ez: number = m.end[1] - m.start[1];
      const f: number = ((qx - m.start[0]) * ex + (qz - m.start[1]) * ez) / (ex * ex + ez * ez);
      if (f >= 0 && f <= 1) return [t, sx, sz];
    }
    const centre: number = m.front - m.radius;
    const w: number = m.origin - centre;
    const b: number = w * ux;
    const root: number = b * b - (w * w - m.radius * m.radius);
    if (root >= 0) {
      const t: number = -b + Math.sqrt(root);
      const nx: number = (m.origin + t * ux - centre) / m.radius;
      if (t > 0 && nx >= sx) return [t, nx, (t * uz) / m.radius];
    }
    const g: number = m.origin - m.gonion;
    const a2: number = (ux / m.back) ** 2 + (uz / m.width) ** 2;
    const b2: number = (2 * g * ux) / m.back ** 2;
    const c2: number = (g / m.back) ** 2 - 1;
    const t: number = (-b2 + Math.sqrt(Math.max(0, b2 * b2 - 4 * a2 * c2))) / (2 * a2);
    const gx: number = (m.origin + t * ux - m.gonion) / m.back ** 2;
    const gz: number = (t * uz) / m.width ** 2;
    const n: number = Math.hypot(gx, gz) || 1;
    return [t, gx / n, gz / n];
  }

  /**
   * Signed distance from the jaw's skin, negative inside, first order.
   *
   * In plan the jaw is an arch from the gonions to the chin, leaning in from
   * the cheek above its border. Seen from the side its border is the
   * mandibular plane through the menton, turning up at the gonial angle into
   * the ramus's posterior border, the corner rounded by the soft tissue. Under
   * the border the skin falls inward at a fixed angle to meet the neck, and
   * the two faces meet over that soft tissue's radius. The body ends inside
   * the face a fixed height over its border, softly.
   */
  export function mandible(
    m: IMandible,
    x: number,
    y: number,
    z: number,
  ): number {
    const line: number = m.menton + (m.chin - x) * m.slope;
    const behind: number =
      (m.gonion - x) * m.lean[0] - (y - m.gonionY) * m.lean[1];
    const top: number = (y - line - m.height) * m.cos;
    if (top > m.round + m.blend + m.throat) return top;

    // The owned physical arch sweep supplies the turn's actual triangle
    // surface and source normals. The ramus and top remain this body's clips.
    const side: number = rounded(mandibularQuery(m).field(x, y, z), behind, m.round * m.taper);
    return rounded(side, top, JAW_TOP * m.round);
  }

  /** Cache the actual owned patch once per rebuilt anatomical mandible. */
  function mandibularQuery(m: IMandible): Mandibular.IPrepared {
    let known: Mandibular.IPrepared | undefined = MANDIBULAR_QUERIES.get(m);
    if (known === undefined) { known = Mandibular.prepare(m); MANDIBULAR_QUERIES.set(m, known); }
    return known;
  }

  /** Observe the composed median turn within the actual owned normal section. */
  function mandibularTurn(surface: ISurface): Vec3 {
    const query: Mandibular.IPrepared = mandibularQuery(surface.plan.mandible!);
    const domain: Vec3[] = MandibularBorder.emit(query.midline, 128);
    const bottom: number = Math.min(...domain.map((p: Vec3): number => p[1]));
    const top: number = Math.max(...domain.map((p: Vec3): number => p[1]));
    const count: number = Math.max(16, Math.ceil((top - bottom) / (0.1 * surface.plan.scale)));
    const points: Vec3[] = Array.from({length: count + 1}, (_: unknown, i: number): Vec3 => {
      const y: number = bottom + (top - bottom) * i / count;
      return [frontAt(surface, y, 0), y, 0];
    });
    let curvature: number = -Infinity;
    let selected: Vec3 = [NaN, NaN, NaN];
    for (let i: number = 1; i < count; i++) {
      const a: Vec3 = points[i - 1]!; const b: Vec3 = points[i]!; const c: Vec3 = points[i + 1]!;
      const cross: number = Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]));
      const value: number = 2 * cross / (dist(a,b) * dist(b,c) * dist(a,c));
      if (value > curvature) { curvature = value; selected = b; }
    }
    return selected;
  }

  /**
   * Calibration whose head and ears are generated from its own neck ring.
   *
   * @param calibration Calibration holding the `head` chain and the head and
   *   ear chains, whose rows are replaced; not modified.
   * @param vermilion Template of the lip boundary, whose name and chain are kept.
   * @param inputs Public inputs.
   */
  export function apply(
    calibration: IAutoMovieHumanBodyCalibration,
    vermilion: IAutoMovieHumanHermiteCurve,
    inputs: IInputs,
  ): IOutput {
    const head: IGenerated = generate(calibration, inputs);
    const generated: Map<string, IAutoMovieHumanLoftChain> = new Map(
      head.chains.map(
        (c: IAutoMovieHumanLoftChain): [string, IAutoMovieHumanLoftChain] => [
          c.name,
          c,
        ],
      ),
    );
    return {
      body: {
        ...calibration,
        stature: head.stature,
        chains: [
          ...calibration.chains
            .filter((c: IAutoMovieHumanLoftChain): boolean => !owns(c.name)),
          ...head.chains,
        ].map(
          (c: IAutoMovieHumanLoftChain): IAutoMovieHumanLoftChain =>
            generated.get(c.name) ?? c,
        ),
        events: [
          ...calibration.events.filter(
            (e: IAutoMovieHumanBodyCalibration.IEvent): boolean =>
              e.parent !== "head.middle" && !e.parent.startsWith("ear."),
          ),
          ...head.events,
        ],
        poles: [
          ...calibration.poles.filter(
            (p: IAutoMovieHumanBodyCalibration.IPole): boolean =>
              !owns(p.chain),
          ),
          ...head.poles,
        ],
        apertures: head.apertures,
        eyes: head.eyes,
        mouth: head.mouth,
        measurementSites: {
          ...calibration.measurementSites,
          neck: { owner: "head", basis: "model-convention", pose: "bind", definition: "Section at the source back-body neck-to-vault handover onset (existing normalized shape convention HANDED). The course is fixed by that geometric boundary before closure, not relocated by a girth target. It is neither the whole-neck minimum nor a clinically identified infrathyroid landmark.", geometry: { kind: "section", origin: head.neckOrigin, normal: head.neckNormal } },
        },
      },
      vermilion: { ...vermilion, spans: head.lips },
      diagnostics: head.diagnostics,
    };
  }

  /**
   * World height of the ring the head stands on, under the head's rise.
   *
   * @param inputs The person's head inputs.
   * @returns Millimetres above the floor.
   */
  export function seat(inputs: IInputs): number {
    return (
      inputs.height -
      inputs.neckLength -
      inputs.head.height
    );
  }

  /** Whether a chain belongs to the head above the neck. */
  export function owns(name: string): boolean {
    return /^(head\.|ear\.)/.test(name);
  }

  /** Everything the head adds. */
  interface IGenerated {
    stature: number;
    /** Final source evidence handed to the head result without reclassification. */
    diagnostics: IOutput["diagnostics"];
    chains: IAutoMovieHumanLoftChain[];
    events: IAutoMovieHumanBodyCalibration.IEvent[];
    poles: IAutoMovieHumanBodyCalibration.IPole[];
    apertures: IAutoMovieHumanLoftAperture[];
    eyes: IAutoMovieHumanBodyCalibration.IEye[];
    lips: IAutoMovieHumanHermiteCurve["spans"];
    mouth: AutoMovieHumanMouth.IMouth;
    /** Final neck tube's interior axis address. */
    neckOrigin: Vec3;
    /** Final neck tube's section normal. */
    neckNormal: Vec3;
  }

  /** The surface of one person, ready to cut. */
  export interface ISurface {
    /** The prior's curves. */
    compiled: ICompiled;

    /** The person's stations and sizes. */
    plan: ILayout;

    /** Neck ring's radial difference from the law, left side. */
    neckLeft: number[];

    /** Neck ring's radial difference from the law, right side. */
    neckRight: number[];

    /** The neck's radial slope with height at its ring over the law's, left side. */
    slopeLeft: number[];

    /** See {@link slopeLeft}, right side. */
    slopeRight: number[];

    /** Neck ring's height off its plane, left side. */
    riseLeft: number[];

    /** Neck ring's height off its plane, right side. */
    riseRight: number[];

    /** Sections already cut, by station. */
    cut: Map<number, ISides>;
    /** Actual frontal/nasal shared boundary and its C2 bridge. */
    bridge?: NasalOwner.BridgeEvaluator;
    /** Construction-only evaluation of the frontal foundation. */
    skipNose?: boolean;
    /** Physical corner profiles, prepared once for this person. */
    lipCaps: [LipCap.ICap, LipCap.ICap];
    /** Same physical curves consumed by the alar hood and final aperture. */
    nostrilRims?: [NasalRim.Curve, NasalRim.Curve];
    /** Actual cartilage and face-attachment owners on both sides. */
    alar?: [Alar.Owner, Alar.Owner];
    /** Preserved non-admitted section topology for the final diagnostic report. */
    alarSections: IAlarSection[];
    /** Replace the former alar relief with the physical hood construction. */
    withoutAla?: boolean;
  }

  /** A section's two sides, each from the front to the back of the midline. */
  interface ISides {
    left: Vec3[];
    right: Vec3[];
  }

  /** Cut the section at station s. */
  function sides(surface: ISurface, s: number): ISides {
    const known: ISides | undefined = surface.cut.get(s);
    if (known !== undefined) return known;
    const out: ISides = cut(surface, s);
    surface.cut.set(s, out);
    return out;
  }

  /** The section at station s, its reliefs on. */
  function cut(surface: ISurface, s: number): ISides {
    const { compiled, plan } = surface;
    const m: ISection = section(compiled, plan, s);
    const ox: number = (m.front + m.back) / 2;
    // The neck ring's difference from the law hands over as a cubic Hermite
    // span: the ring's own place and slope at its start, nothing at the end.
    // A weight falling at the ring under the law's own slope met the neck's
    // rising throat at a ridge turning 45 degrees round the front of the
    // neck; the slope carried on a straight line overshot the sides, where the
    // neck narrows at 2 mm per mm, into a dent.
    const along: number = Math.min(1, m.t / NECK_FADE);
    const fade: number = 1 - smooth(along);
    const run: number = (s - plan.y0) * (1 - along) ** 2;
    const cos: number = Math.cos(m.tilt);
    const sin: number = Math.sin(m.tilt);
    const left: Vec3[] = new Array<Vec3>(ANGLES + 1);
    const right: Vec3[] = new Array<Vec3>(ANGLES + 1);
    let guess: number = 0;
    for (let j: number = 0; j <= ANGLES; j++) {
      const theta: number = (Math.PI * j) / ANGLES;
      const r: number = radius(m, ox, theta, guess);
      guess = r;
      const c: number = Math.cos(theta);
      const n: number = Math.sin(theta);
      const emit = (
        delta: number,
        slope: number,
        rise: number,
        sign: 1 | -1,
      ): Vec3 => {
        const r0: number = r + fade * (delta + run * slope);
        const xi: number = ox + r0 * c;
        const z: number = sign * r0 * n;
        const x: number = xi * cos;
        const y: number = s + xi * sin;
        const h: number = relief(surface, x, y, z, sign);
        const r1: number = r0 + h;
        const xi1: number = ox + r1 * c;
        return [xi1 * cos, s + xi1 * sin + fade * rise, sign * r1 * n];
      };
      left[j] = emit(surface.neckLeft[j]!, surface.slopeLeft[j]!, surface.riseLeft[j]!, 1);
      right[j] = emit(surface.neckRight[j]!, surface.slopeRight[j]!, surface.riseRight[j]!, -1);
    }
    if (surface.alar !== undefined) for (const [side, owner] of [["left", surface.alar[0]], ["right", surface.alar[1]]] as const) {
      const base: Vec3[] = side === "left" ? left : right;
      const result = owner.section(base, s, m.tilt);
      base.splice(0, base.length, ...result.points);
      if (result.admission === "unaccepted" || result.remaining.length > 0 || result.rootGaps.some((gap: number): boolean => gap > 0.025 * plan.scale) || result.branching > 0 || result.coplanarTriangles > 0 || result.facePaths.length > 1) {
        const rejectionReasons: string[] = [...result.rejectionReasons];
        if (result.rootGaps.some((gap: number): boolean => gap > 0.025 * plan.scale)) rejectionReasons.push("The actual attachment gap exceeds the existing physical seam allowance.");
        surface.alarSections.push({ station: s, side, gaps: result.rootGaps, admission: "unaccepted", rejectionReasons,
          remaining: result.remaining.map((p) => ({ points: p.points, closed: p.closed, startBoundary: p.startBoundary, endBoundary: p.endBoundary })),
          facePaths: result.facePaths.map((p) => ({ points: p.points, closed: p.closed, startBoundary: p.startBoundary, endBoundary: p.endBoundary })),
          facePathCount: result.facePaths.length, branching: result.branching, coplanarTriangles: result.coplanarTriangles });
      }
    }
    return { left, right };
  }

  /** Radial height of the named features at a point of the base surface. */
  export function relief(
    surface: ISurface,
    x: number,
    y: number,
    z: number,
    sign: 1 | -1,
  ): number {
    const { plan, compiled } = surface;
    const f: AutoMovieHumanHeadPrior.IFace = compiled.prior.face;
    const k: number = plan.scale;
    if (x < plan.centre - 25 * k) return 0;
    const front: number = smooth((x - plan.centre + 25 * k) / (30 * k));
    const a: number = Math.abs(z);
    const eye: IEyeOpening = sign > 0 ? plan.left : plan.right;
    let out: number = 0;

    // Named planes and hollows of the face.
    const unit: number = plan.faceHeight / FACE_UNIT;
    for (const b of f.bumps) {
      const height: number = b.height + b.sex * plan.sex;
      const place: number =
        plan[b.anchor as IAnchor] + b.rise * unit;

      // Both sides' bells together are smooth across the midline.
      const c: number = b.lateral * plan.faceWidth;
      const across: number = b.wide * unit;
      out +=
        height *
        k *
        bell((y - place) / (b.tall * unit)) *
        (bell((a - c) / across) + (c > 0 ? bell((a + c) / across) : 0));
    }

    // The socket falls to the eye's seat.
    out -=
      eye.seat *
      bell2((y - plan.eye) / (11 * unit), (a - eye.place) / (15 * unit));

    // Jaw joint, ahead of the ear.
    out +=
      plan.joint *
      bell2(
        (y - plan.eye + 42 * k) / (14 * k),
        (a - plan.faceWidth * 0.98) / (12 * k),
      );

    if (!surface.skipNose) out += surface.bridge !== undefined && y > surface.bridge.join
      ? surface.bridge.height(y, z)
      : nasalRelief(surface, y, z);

    // Philtrum.
    const lipTop: number = plan.stomion + plan.upperLip;
    const between: number =
      smooth((plan.subnasale - y) / (3 * k)) *
      smooth((y - lipTop + 3 * k) / (3 * k));
    out -= f.philtrum[0]! * k * between * bell(a / (f.philtrum[1]! * k));

    // Lips over their borders; the fissure between them.
    const u: number = a / plan.mouthWidth;
    if (u < 1.6) {
      const m: number = Math.max(0, 1 - u * u);
      const mid: number = plan.stomion + 1.2 * k * u * u;
      const upper: number =
        plan.upperLip * m ** 0.55 * (1 - 0.18 * bell(u / 0.13));
      const lower: number = plan.lowerLip * m ** 0.65;
      const bulge = (c: number, h: number, cap: LipCap.ICap): number =>
        h <= 0
          ? 0
          : LipCap.at(cap, a).value * bell((y - c) / Math.max(0.8 * k, 0.62 * h));
      out += bulge(mid + upper / 2, upper, surface.lipCaps[0]);
      out += bulge(mid - lower / 2, lower, surface.lipCaps[1]);
      const groove: number = f.fissure[1]! * k + plan.gap;
      out -=
        (f.fissure[0]! * k + 0.4 * plan.gap) *
        smooth((1.08 - u) / 0.2) *
        bell((y - mid) / groove);
    }

    return out * front;
  }

  /** Prepare a supported physical corner once, retaining a geometry failure. */
  function lipCap(width: number, lead: number): LipCap.ICap {
    const result: LipCap.ICap | LipCap.IFailure = LipCap.solve(width, lead);
    if ("failure" in result) throw new Error(`Unsupported lip corner: ${result.failure}: ${result.detail}`);
    return result;
  }

  /** The complete original nasal relief below the owned final bridge span. */
  function nasalRelief(surface: ISurface, y: number, z: number): number {
    const { plan, compiled } = surface;
    const f: AutoMovieHumanHeadPrior.IFace = compiled.prior.face;
    const k: number = plan.scale;
    const a: number = Math.abs(z);
    // The nose: a column of the dorsum's ridge and the tip's lobule, which share
    // an axis, joined to the alar lobules by a quadratic union. A sharper union
    // of lobes that stand apart ruled a valley of 0.75 mm radius between the tip
    // and the wing, under the sections' 1.6 mm controls, and the cells aliased
    // it into teeth at whatever pitch they had.
    //
    // From below the nose ends on its base, a surface rising forward from the
    // lip at the columella's angle. It trims the lobule and the alae by a
    // harmonic union, so the tip, the columella and the alar rims turn into it
    // over radii in proportion to their own size. A level shelf cut across the
    // nose turned at 1 mm and read from three quarters as one slot.
    //
    // A proportional rounding vanishes with what it rounds: where a base that
    // fell away past the wing cut the lobule's thin tail it turned within
    // 0.3 mm, a third of a control, and the cells aliased it into teeth. So the
    // base meets the lip over a circle of absolute radius, a few of the
    // sampling's pitches there: the subnasale turns over it, and a tail of
    // height h is cut where the circle has risen to h, over about the square
    // root of the radius times h, however thin the tail.
    const span: number = plan.nasion - plan.tip;
    const w: number = plan.noseWidth;
    const lead: number = plan.noseLead;
    const v: number = (y - plan.tip) / span;
    const K: readonly number[] = f.profileKnots;
    const ridge: number =
      v > K[0]! && v < K[K.length - 1]!
        ? Math.max(0, AutoMovieHumanNaturalSpline.evaluate(compiled.profile, v)) *
          lead *
          bell(
            a / (w * AutoMovieHumanNaturalSpline.evaluate(compiled.dorsum, v)),
          )
        : 0;
    const ball: number =
      lead *
      bell4(
        Math.hypot(
          v / (v < 0 ? f.tipBall[0]! : f.tipBall[1]!),
          a / (f.tipBall[2]! * w),
        ),
      );
    // The alar lobules, rounded, shallower below than above. Both sides' lobes
    // together are smooth across the midline.
    const lobeY: number = plan.subnasale + f.ala[2]! * span;
    const lobeHalf: number = (y < lobeY ? f.ala[4]! : f.ala[3]!) * span;
    const lobe = (d: number): number =>
      bell2((y - lobeY) / lobeHalf, (d - f.ala[1]! * w) / (f.ala[5]! * w));
    const ala: number = surface.withoutAla ? 0 : ((f.ala[0]! * w) / 14) * (lobe(a) + lobe(-a));
    const body: number = Math.hypot((ridge ** NOSE + ball ** NOSE) ** (1 / NOSE), ala);
    const [base, fall] = noseBase(plan, f, a);
    const floor: number = filleted(
      (y - base) / Math.hypot(1, fall),
      plan.columella,
      plan.round,
    );
    const p: number = f.underside[1]!;
    let out: number = body > 0 && floor > 0 ? (body ** -p + floor ** -p) ** (-1 / p) : 0;

    // The alar crease sets each lobule back into the cheek round its outer side.
    const round: number = Math.hypot(
      (y - lobeY) / (f.ala[3]! * span),
      (a - f.ala[1]! * w) / (f.ala[5]! * w),
    );
    out -=
      (surface.withoutAla ? 0 : f.crease[0]!) *
      k *
      bell((round - f.crease[2]!) / f.crease[1]!) *
      smooth((a / w - f.ala[1]!) / f.ala[5]!);

    return out;
  }

  /** Build the actual frontal/nasal shared seam before measuring identity. */
  function nasalBridge(surface: ISurface): NasalOwner.BridgeEvaluator {
    const { plan, compiled } = surface;
    const knots: readonly number[] = compiled.prior.face.profileKnots;
    const last: number = Math.max(...knots.filter((v: number): boolean => v < 1));
    const join: number = plan.tip + last * (plan.nasion - plan.tip);
    const step: number = 0.001 * plan.scale;
    return NasalOwner.evaluateBridge({
      root: plan.nasion, join, tip: plan.tip, halfWidth: plan.noseWidth,
      jet: (z: number): NasalOwner.Jet => {
        const a: number = nasalRelief(surface, join - step, z);
        const b: number = nasalRelief(surface, join, z);
        const c: number = nasalRelief(surface, join + step, z);
        return { value: b, first: (c - a) / (2 * step), second: (a - 2 * b + c) / (step * step) };
      },
      profile: (y: number, z: number): number => nasalRelief(surface, y, z),
      width: (y: number): number => plan.noseWidth * AutoMovieHumanNaturalSpline.evaluate(compiled.dorsum, (y - plan.tip) / (plan.nasion - plan.tip)),
    });
  }

  /** Evaluate the original facial foundation without feeding a rim back into itself. */
  function foundationAt(surface: ISurface, y: number, z: number): number {
    const previous: boolean | undefined = surface.skipNose;
    surface.skipNose = true;
    try { return frontAt(surface, y, z); }
    finally { surface.skipNose = previous; }
  }

  /** Construct one physical opening, before the hood and skin are assembled. */
  function physicalNostril(surface: ISurface, sign: 1 | -1): NasalRim.Curve {
    const { plan, compiled } = surface;
    const f: AutoMovieHumanHeadPrior.IFace = compiled.prior.face;
    return NasalRim.create({
      halfWidth: plan.noseWidth, tipLead: plan.noseLead, columella: plan.columella,
      size: [f.nostrilSize[0]!, f.nostrilSize[1]!], center: [f.nostrilCentre[0]!, f.nostrilCentre[1]!],
      sweep: f.nostrilSweep * Math.PI / 180, tear: f.nostrilTear, side: sign,
      face: (y: number, z: number): number => foundationAt(surface, y, z),
      base: (z: number): number => noseBase(plan, f, z)[0],
    });
  }

  /**
   * Height where the nose's base meets the face, at a distance from the
   * midline, and its slope across: the subnasale at the columella, a little
   * higher under the alar rims, and level past them. A base that fell away past
   * the wing bent its line at 0.3 mm and kept the lobule's tail below it, whose
   * cut edge the trim then had to round.
   */
  function noseBase(
    plan: ILayout,
    f: AutoMovieHumanHeadPrior.IFace,
    a: number,
  ): [number, number] {
    const u: number = Math.min(1, a / plan.noseWidth);
    const rise: number = (plan.nasion - plan.tip) * f.underside[0]!;
    return [
      plan.subnasale + rise * u * u * (3 - 2 * u),
      (rise * 6 * u * (1 - u)) / plan.noseWidth,
    ];
  }

  /** The neck ring's polar difference from the law, per side. */
  function neckDelta(
    compiled: ICompiled,
    plan: ILayout,
    ring: readonly [number, number][],
    sign: 1 | -1,
  ): number[] {
    const m: ISection = section(compiled, plan, plan.y0);
    const ox: number = (m.front + m.back) / 2;
    const out: number[] = [];
    for (let j: number = 0; j <= ANGLES; j++) {
      const theta: number = (Math.PI * j) / ANGLES;
      const r: number = radius(m, ox, theta);

      // The midline's rays pass exactly through the ring's vertices there, and
      // rounding can drop that crossing from both edges beside it. The ray then
      // meets nothing and the point falls to the polar origin: on one person
      // that was a slit 38 mm deep up the front of the neck.
      const ray: number = Math.min(Math.PI - OFF_VERTEX, Math.max(OFF_VERTEX, theta));
      out.push(AutoMovieHumanPolarSection.radius(ring, [ox, 0], sign * ray) - r);
    }
    return out;
  }

  /**
   * The neck's radial slope with height at its ring, over the law's own there,
   * along the same rays, per side: from the ring and one just under it.
   */
  function neckSlope(
    compiled: ICompiled,
    plan: ILayout,
    ring: readonly [number, number][],
    under: readonly [number, number][],
    drop: number,
    sign: 1 | -1,
  ): number[] {
    const m: ISection = section(compiled, plan, plan.y0);
    const up: ISection = section(compiled, plan, plan.y0 + drop);
    const ox: number = (m.front + m.back) / 2;
    const out: number[] = [];
    for (let j: number = 0; j <= ANGLES; j++) {
      const theta: number = (Math.PI * j) / ANGLES;
      const ray: number = Math.min(Math.PI - OFF_VERTEX, Math.max(OFF_VERTEX, theta));
      const neck: number =
        AutoMovieHumanPolarSection.radius(ring, [ox, 0], sign * ray) -
        AutoMovieHumanPolarSection.radius(under, [ox, 0], sign * ray);
      const law: number = radius(up, ox, theta) - radius(m, ox, theta);
      out.push((neck - law) / drop);
    }
    return out;
  }

  /** The neck ring's height off its plane along the same rays, per side. */
  function neckRise(
    compiled: ICompiled,
    plan: ILayout,
    ring: readonly Vec3[],
    sign: 1 | -1,
  ): number[] {
    const m: ISection = section(compiled, plan, plan.y0);
    const ox: number = (m.front + m.back) / 2;
    const out: number[] = [];
    const phases: NeckPhase.IPrepared = NeckPhase.prepare(ring, ox);
    for (let j: number = 0; j <= ANGLES; j++) {
      const theta: number = (sign * Math.PI * j) / ANGLES;
      out.push(ring[phases.nearest(theta).index]![1] - plan.y0);
    }
    return out;
  }

  /** The point of a side at a place along x, with its tangent toward the back. */
  function at(side: readonly Vec3[], x: number): [number, P2, P2] {
    // The outline runs back along x past the nose, so start beyond it.
    const first: number = Math.floor(side.length * 0.12);
    let i: number = first;
    for (; i + 2 < side.length; i++) if (side[i + 1]![0] <= x) break;
    const a: Vec3 = side[i]!;
    const b: Vec3 = side[i + 1]!;
    const f: number =
      Math.abs(a[0] - b[0]) < 1e-9 ? 0 : (a[0] - x) / (a[0] - b[0]);
    const dx: number = b[0] - a[0];
    const dz: number = b[2] - a[2];
    const l: number = Math.hypot(dx, dz) || 1;
    return [i, [a[0] + f * dx, a[2] + f * dz], [dx / l, dz / l]];
  }

  /** A section's side in the left frame's `[x, z]`. */
  function planar(side: readonly Vec3[], sign: 1 | -1): P2[] {
    return side.map((p: Vec3): P2 => [p[0], sign * p[2]]);
  }

  /** An ear's chord and roots at a height. */
  interface IRoots {
    front: [number, P2, P2];
    back: [number, P2, P2];
    rim: P2;
    tip: P2;
  }

  /** Ear's chord and roots at a height, on a side in the left frame. */
  function roots(
    ear: AutoMovieHumanEarConstruction.IEar,
    side: readonly Vec3[],
    sign: 1 | -1,
    y: number,
  ): IRoots {
    const canonical: Vec3[] = side.map(
      (p: Vec3): Vec3 => [p[0], p[1], sign * p[2]],
    );
    const head: number = at(canonical, ear.x)[1][1];
    const half: number = AutoMovieHumanEarConstruction.chord(ear, y);
    const c: P2 = AutoMovieHumanEarConstruction.centre(ear, y, head);
    const tip: P2 = [c[0] - half * ear.along[0], c[1] - half * ear.along[1]];
    const rim: P2 = [c[0] + half * ear.along[0], c[1] + half * ear.along[1]];
    const gap: number = AutoMovieHumanHeadPrior.PRIOR.ear.root * 2 * half;
    return {
      front: at(canonical, tip[0]),
      back: at(canonical, tip[0] - gap),
      rim,
      tip,
    };
  }

  /**
   * A side's control points with an ear spliced in. Every ring gives the same
   * phases to the head in front of the ear, the ear's two faces and the head
   * behind it, so the rim keeps one phase up the ear and the stations interpolate
   * along it.
   */
  function spliced(
    ear: AutoMovieHumanEarConstruction.IEar,
    side: readonly Vec3[],
    sign: 1 | -1,
    y: number,
    weight: (p: Vec3) => number,
  ): Vec3[] {
    const flat: P2[] = planar(side, sign);
    const r: IRoots = roots(ear, side, sign, y);
    const path: P2[] = AutoMovieHumanEarConstruction.path(
      ear,
      y,
      {
        front: r.front[1],
        frontTangent: r.front[2],
        back: r.back[1],
        backTangent: [-r.back[2][0], -r.back[2][1]],
      },
      r.rim,
    );
    const rim: number = AutoMovieHumanEarConstruction.ANTERIOR;
    const pieces: P2[][] = [
      [...flat.slice(0, r.front[0] + 1), path[0]!],
      path.slice(0, rim + 1),
      path.slice(rim),
      [path[path.length - 1]!, ...flat.slice(r.back[0] + 1)],
    ];
    const out: Vec3[] = [];
    pieces.forEach((piece: P2[], i: number): void => {
      const line: Vec3[] = piece.map((p: P2): Vec3 => [p[0], y, sign * p[1]]);
      const count: number = SPLICE[i]!;
      out.push(
        ...resample(line, count + 1, i === 0 ? weight : undefined).slice(
          0,
          count,
        ),
      );
    });
    const last: P2 = flat[flat.length - 1]!;
    out.push([last[0], y, sign * last[1]]);
    return out;
  }

  /** Uniform control rings of a sagittal section from its two sides. */
  function sagittal(
    left: readonly Vec3[],
    right: readonly Vec3[],
    order: number,
    weight: (p: Vec3) => number,
  ): Vec3[] {
    const half: number = order / 2;
    const a: Vec3[] = resample(left, half + 1, weight);
    const b: Vec3[] = resample(right, half + 1, weight);
    return [...a.slice(0, half), ...b.slice(1).reverse()];
  }

  /**
   * Controls per millimetre of section at a point, against the back of the head.
   *
   * The same counts, gathered over the face: the nose, lids and lips hold the
   * small features, and 1.6 to 2.3 mm between controls could not carry them.
   * It reads only the point's place, so a control stays on its feature from one
   * section to the next instead of sliding with the arclength. It stops below
   * the mouth: a tilted ring's mean height is its layer's, and controls gathered
   * at the raised front crowded those layers to 0.4 mm. It stops slowly: over
   * 8 mm the controls slid along the ring within a few layers and creased it.
   */
  function gathered(plan: ILayout): (p: Vec3) => number {
    const reach: number = plan.left.place + plan.left.length / 2;
    const k: number = plan.scale;
    return (p: Vec3): number =>
      1 +
      GATHER *
        bell(p[2] / reach) *
        smooth((p[0] - plan.centre + 10 * k) / (30 * k)) *
        smooth((p[1] - plan.stomion + 30 * k) / (40 * k));
  }

  /**
   * Points at uniform arclength along a polyline, both ends included, or uniform
   * in the arclength a weight scales.
   */
  function resample(
    line: readonly Vec3[],
    count: number,
    weight?: (p: Vec3) => number,
  ): Vec3[] {
    const s: number[] = [0];
    for (let i: number = 1; i < line.length; i++) {
      const d: number = dist(line[i]!, line[i - 1]!);
      s.push(
        s[i - 1]! +
          (weight === undefined
            ? d
            : (d * (weight(line[i]!) + weight(line[i - 1]!))) / 2),
      );
    }
    const out: Vec3[] = [];
    let j: number = 0;
    for (let i: number = 0; i < count; i++) {
      const target: number = (s[s.length - 1]! * i) / (count - 1);
      while (j + 2 < s.length && s[j + 1]! < target) j++;
      const h: number = s[j + 1]! - s[j]! || 1;
      const f: number = Math.min(1, (target - s[j]!) / h);
      const p: Vec3 = line[j]!;
      const q: Vec3 = line[j + 1]!;
      out.push([
        p[0] + f * (q[0] - p[0]),
        p[1] + f * (q[1] - p[1]),
        p[2] + f * (q[2] - p[2]),
      ]);
    }
    return out;
  }

  /** Uniform phases of a closed loop under a chain's rule. */
  function phased(
    rule: IAutoMovieHumanLoftChain["rule"],
    loop: readonly P2[],
    order: number,
    mirrored: boolean,
  ): { ring: P2[]; phases: number[] } {
    const t: number[] = AutoMovieHumanLoftParameter.phases(
      rule,
      mirrored ? loop.map((p: P2): P2 => [p[0], -p[1]]) : loop,
    );
    const two: number = 2 * Math.PI;
    const phases: number[] = t.map(
      (v: number): number => ((v % two) + two) % two,
    );
    const sorted: number[] = phases
      .map((_: number, i: number): number => i)
      .sort((a: number, b: number): number => phases[a]! - phases[b]!);
    const ring: P2[] = [];
    let c: number = 0;
    for (let j: number = 0; j < order; j++) {
      const target: number = (two * j) / order;
      while (c < sorted.length && phases[sorted[c]!]! < target) c++;
      const hi: number = sorted[c % sorted.length]!;
      const lo: number = sorted[(c + sorted.length - 1) % sorted.length]!;
      const b: number = phases[hi]! + (c >= sorted.length ? two : 0);
      const a: number = phases[lo]! - (c === 0 ? two : 0);
      const f: number = b - a < 1e-12 ? 0 : (target - a) / (b - a);
      ring.push(mix(loop[lo]!, loop[hi]!, f));
    }
    return { ring, phases };
  }

  /** Reflect a left-frame closed loop onto a side, keeping its sense. */
  function reflected(loop: readonly P2[], sign: 1 | -1): P2[] {
    return sign > 0
      ? [...loop]
      : loop.map((p: P2): P2 => [p[0], -p[1]]).reverse();
  }

  /** A closed loop's chain from layers of loops. */
  function chainOf(
    name: string,
    order: number,
    rule: IAutoMovieHumanLoftChain["rule"],
    mirrored: boolean,
    layers: readonly ILoopLayer[],
  ): IAutoMovieHumanLoftChain {
    const chain: IAutoMovieHumanLoftChain = AutoMovieHumanHorizontalChain.build(
      { name, order, samples: order, rule },
      layers.map((l: ILoopLayer): Vec3[] =>
        (rule === "arclength"
          ? AutoMovieHumanEarConstruction.even(l.loop, order)
          : phased(rule, l.loop, order, mirrored).ring
        ).map(
          (p: P2): Vec3 => [p[0], l.y, p[1]],
        ),
      ),
    );
    return mirrored ? { ...chain, mirrored: true } : chain;
  }

  /** One layer of an ear's free chain. */
  interface ILoopLayer {
    y: number;
    loop: P2[];
  }

  /** Stations from a to b, n layers, uniform. */
  function uniform(a: number, b: number, n: number): number[] {
    return Array.from(
      { length: n },
      (_: unknown, i: number): number => a + ((b - a) * i) / (n - 1),
    );
  }

  /** Stations from a to b, n layers, crowding about a place with a half-width. */
  function crowded(
    a: number,
    b: number,
    n: number,
    place: number,
    reach: number,
  ): number[] {
    const fine: number = 512;
    const y: number[] = uniform(a, b, fine);
    const total: number[] = [0];
    for (let i: number = 1; i < fine; i++)
      total.push(
        total[i - 1]! +
          (y[i]! - y[i - 1]!) * (1 + CROWD * bell((y[i]! - place) / reach)),
      );
    const out: number[] = [];
    let j: number = 0;
    for (let i: number = 0; i < n; i++) {
      const target: number = (total[fine - 1]! * i) / (n - 1);
      while (j + 2 < fine && total[j + 1]! < target) j++;
      const f: number = (target - total[j]!) / (total[j + 1]! - total[j]!);
      out.push(y[j]! + Math.min(1, f) * (y[j + 1]! - y[j]!));
    }
    return out;
  }

  /** Length from a to b with {@link crowded}'s crowding counted in. */
  function weighted(a: number, b: number, place: number, reach: number): number {
    const fine: number = 512;
    let total: number = 0;
    for (let i: number = 0; i < fine; i++) {
      const y: number = a + ((b - a) * (i + 0.5)) / fine;
      total += ((b - a) / fine) * (1 + CROWD * bell((y - place) / reach));
    }
    return total;
  }

  /** One ear's chains, its own events and poles. */
  function earChains(
    surface: ISurface,
    ear: AutoMovieHumanEarConstruction.IEar,
    name: "left" | "right",
    sign: 1 | -1,
  ): {
    chains: IAutoMovieHumanLoftChain[];
    events: IAutoMovieHumanBodyCalibration.IEvent[];
    poles: IAutoMovieHumanBodyCalibration.IPole[];
  } {
    const side = (y: number): Vec3[] => sides(surface, y)[name];
    /** A free loop at a height: the path closed, off the head by `f`. */
    const free = (y: number, f: number, folds: number): P2[] => {
      const r: IRoots = roots(ear, side(y), sign, y);
      const half: number = AutoMovieHumanEarConstruction.chord(ear, y);
      const mid: P2 = mix(r.tip, r.rim, 0.5);
      const under: P2 = [
        mid[0] - ear.normal[0] * 0.5 * half,
        mid[1] - ear.normal[1] * 0.5 * half,
      ];
      const path: P2[] = AutoMovieHumanEarConstruction.path(
        ear,
        y,
        {
          front: mix(r.front[1], r.tip, f),
          frontTangent: [(1 - f) * r.front[2][0], (1 - f) * r.front[2][1]],
          back: mix(r.back[1], under, f),
          backTangent: [-(1 - f) * r.back[2][0], -(1 - f) * r.back[2][1]],
        },
        r.rim,
        folds,
      );
      return AutoMovieHumanEarConstruction.loop(ear, path, LOOP, 1 - f);
    };
    const span: number = ear.top - ear.upper;
    const rise = (y: number): number => smooth((y - ear.upper) / span);
    const sink = (y: number): number =>
      smooth((ear.lower - y) / (ear.lower - ear.bottom));

    // Lobe: the free path shrinks with its chord.
    const lobeLayers: ILoopLayer[] = uniform(
      ear.bottom + 0.02,
      ear.lower,
      24,
    ).map(
      (y: number): ILoopLayer => ({ y, loop: free(y, sink(y), 1 - sink(y)) }),
    );

    // Top: the path rises off the head, a pit deepens in it behind the helix
    // and closes under the rim into the pocket.
    const fold = (y: number): number =>
      1 - smooth((y - ear.split) / (ear.top - ear.split));
    const pit: number = Math.floor(LOOP * PIT);
    const pocketOval = (y: number): P2[] => {
      const l: P2[] = free(ear.split, rise(ear.split), 1);
      const c: P2 = l[pit]!;
      const size: number =
        1 - 0.92 * smooth((y - ear.split) / (ear.roof - ear.split));
      const half: number = AutoMovieHumanEarConstruction.chord(ear, ear.split);
      const a: number = 0.24 * half * size;
      const b: number = 0.1 * half * size;
      const t: P2 = AutoMovieHumanEarConstruction.tangent(l, pit);
      const n: P2 = [t[1], -t[0]];
      const inset: number = b + 0.3 * half * (1 - size);
      return AutoMovieHumanEarConstruction.oval(
        [c[0] - n[0] * inset, c[1] - n[1] * inset],
        t,
        a,
        b,
        POCKET,
        -1,
        -Math.PI / 2,
      );
    };
    const rings = (y: number): P2[] => free(y, rise(y), 1);
    const helixLayers: ILoopLayer[] = uniform(ear.upper, ear.split, 16).map(
      (y: number): ILoopLayer => {
        const l: P2[] = rings(y);
        const k: number = smooth(
          (y - ear.upper) / (ear.split - ear.upper) / PIT_FROM - 1 / PIT_FROM + 1,
        );
        const pocket: P2[] = pocketOval(ear.split);
        return { y, loop: AutoMovieHumanEarConstruction.pitted(l, pit, pocket, k) };
      },
    );
    const high: P2[] = helixLayers[helixLayers.length - 1]!.loop;
    const from: number = pit + 1;
    const to: number = from + POCKET;
    const rimLayers: ILoopLayer[] = Array.from(
      { length: 38 },
      (_: unknown, i: number): number =>
        ear.split +
        (ear.top - 0.04 - ear.split) * Math.sin(((i / 37) * Math.PI) / 2),
    ).map((y: number): ILoopLayer => ({ y, loop: free(y, rise(y), fold(y)) }));
    const pocketLayers: ILoopLayer[] = uniform(
      ear.split,
      ear.roof - 0.02,
      10,
    ).map((y: number): ILoopLayer => ({ y, loop: pocketOval(y) }));

    const onSide = (list: readonly ILoopLayer[]): ILoopLayer[] =>
      list.map(
        (l: ILoopLayer): ILoopLayer => ({
          y: l.y,
          loop: reflected(l.loop, sign),
        }),
      );

    // The split's arcs, on the helix ring's own phases.
    const closed: P2[] = reflected(high, sign);
    const cut: number[] =
      sign > 0 ? [from, to] : [closed.length - to, closed.length - from];
    const phases: number[] = closed.map(
      (_: P2, i: number): number => (2 * Math.PI * i) / closed.length,
    );
    const pocketArc: [number, number] = [
      phases[Math.min(closed.length - 1, cut[0]!)]!,
      phases[Math.min(closed.length - 1, cut[1]!)]!,
    ];
    return {
      chains: [
        chainOf(`ear.lobe.${name}`, 64, "arclength", false, onSide(lobeLayers)),
        chainOf(`ear.helix.${name}`, ORDER_HELIX, "arclength", false, onSide(helixLayers)),
        chainOf(`ear.rim.${name}`, 64, "arclength", false, onSide(rimLayers)),
        chainOf(`ear.pocket.${name}`, 32, "polar", true, onSide(pocketLayers)),
      ],
      events: [
        {
          parent: `ear.helix.${name}`,
          direction: "up",
          splits: [
            { child: `ear.rim.${name}`, arcs: [[pocketArc[1], pocketArc[0]]] },
            {
              child: `ear.pocket.${name}`,
              arcs: [[pocketArc[0], pocketArc[1]]],
            },
          ],
        },
      ],
      poles: [
        {
          chain: `ear.lobe.${name}`,
          end: "bottom",
          critical: true,
          point: lifted(centroid(lobeLayers[0]!.loop), ear.bottom - 0.03, sign),
        },
        {
          chain: `ear.rim.${name}`,
          end: "top",
          critical: true,
          point: lifted(
            centroid(rimLayers[rimLayers.length - 1]!.loop),
            ear.top + 0.03,
            sign,
          ),
        },
        {
          chain: `ear.pocket.${name}`,
          end: "top",
          critical: true,
          point: lifted(
            centroid(pocketLayers[pocketLayers.length - 1]!.loop),
            ear.roof + 0.02,
            sign,
          ),
        },
      ],
    };
  }

  /** The whole head. */
  function generate(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IInputs,
  ): IGenerated {
    const compiled: ICompiled = compile();
    const prior: AutoMovieHumanHeadPrior.IPrior = compiled.prior;
    const neckChain: IAutoMovieHumanLoftChain = calibration.chains.find(
      (c: IAutoMovieHumanLoftChain): boolean => c.name === "head",
    )!;
    const top: number = neckChain.layers[neckChain.layers.length - 1]!.y;
    const dense: number[] = Array.from(
      { length: 720 },
      (_: unknown, i: number): number => (2 * Math.PI * i) / 720,
    );
    const ring: Vec3[] = AutoMovieHumanLoftChain.ring(neckChain, top, dense);
    const xs: number[] = ring.map((p: Vec3): number => p[0]);
    const level: number = mean(ring.map((p: Vec3): number => p[1]));
    const rise: number =
      inputs.neckLength + inputs.head.height;
    const scale: number = level / (inputs.height - rise);
    const neck: INeck = {
      level,
      x: mean(xs),
      radius: (inputs.neck * scale) / (2 * Math.PI),
    };

    // The vertex is the stature: the neck ring stays in calibration and the
    // head above it is in world lengths, so the scale closes on itself.
    const plan: ILayout = layout(compiled, inputs, neck, scale);
    plan.radiusEpoch = RadiusEpoch.create(32768);
    const flat: [number, number][] = ring.map(
      (p: Vec3): [number, number] => [p[0], p[2]],
    );
    const step: number = Math.min(NECK_STEP * scale, (top - neckChain.layers[0]!.y) / 2);
    const beneath: Vec3[] = AutoMovieHumanLoftChain.ring(neckChain, top - step, dense);
    const drop: number = level - mean(beneath.map((p: Vec3): number => p[1]));
    const under: [number, number][] = beneath.map(
      (p: Vec3): [number, number] => [p[0], p[2]],
    );
    const surface: ISurface = {
      compiled,
      plan,
      neckLeft: neckDelta(compiled, plan, flat, 1),
      neckRight: neckDelta(compiled, plan, flat, -1),
      slopeLeft: neckSlope(compiled, plan, flat, under, drop, 1),
      slopeRight: neckSlope(compiled, plan, flat, under, drop, -1),
      riseLeft: neckRise(compiled, plan, ring, 1),
      riseRight: neckRise(compiled, plan, ring, -1),
      cut: new Map(),
      alarSections: [],
      withoutAla: true,
      lipCaps: [lipCap(plan.mouthWidth, prior.face.lips[0]! * scale), lipCap(plan.mouthWidth, prior.face.lips[1]! * scale)],
    };

    // Ears, from the skull's side.
    const place = (e: PublicEar): AutoMovieHumanEarConstruction.IEar =>
      AutoMovieHumanEarConstruction.place(
        {
          length: e.length * scale,
          breadth: e.breadth * scale,
          protrusion: e.protrusion * scale,
        },
        plan.eye,
        plan.centre,
        scale,
      );
    let left: AutoMovieHumanEarConstruction.IEar = place(inputs.head.earPair.left);
    let right: AutoMovieHumanEarConstruction.IEar = place(inputs.head.earPair.right);
    let seat: number = 0;
    let arch: number = 0;

    // Every dependent feature is rebuilt from the same current layout. A
    // solved face height must carry the ears, sockets and jaw with it.
    const rebuild: () => void = (): void => {
      plan.radiusEpoch!.beginEpoch();
      plan.station = AutoMovieHumanNaturalSpline.create([plan.y0, plan.menton, plan.subnasale, plan.eye, plan.vertex], [0, 1, 2, 3, 4]);
      let lower: number = plan.y0;
      let upper: number = plan.vertex;
      for (let i: number = 0; i < 40; i++) { const middle: number = (lower + upper) / 2; if (AutoMovieHumanNaturalSpline.evaluate(plan.station, middle) < HANDOVER) lower = middle; else upper = middle; }
      plan.cranialLower = (lower + upper) / 2;
      plan.cranialUpper = plan.vertex - CROWN * scale;
      plan.cranialQueries.clear();
      plan.geometryFindings.length = 0;
      surface.alar = undefined;
      surface.alarSections.length = 0;
      left = place(inputs.head.earPair.left);
      right = place(inputs.head.earPair.right);
      arch = (left.bottom + left.top + right.bottom + right.top) / 4;
      plan.round = prior.face.round * (Math.max(left.lower, right.lower) - level) / (LAYERS_LOWER - 1);
      surface.bridge = undefined;
      plan.mandible = undefined;
      plan.left.seat = 0;
      plan.right.seat = 0;
      surface.cut.clear();
      surface.neckLeft = neckDelta(compiled, plan, flat, 1);
      surface.neckRight = neckDelta(compiled, plan, flat, -1);
      surface.slopeLeft = neckSlope(compiled, plan, flat, under, drop, 1);
      surface.slopeRight = neckSlope(compiled, plan, flat, under, drop, -1);
      surface.riseLeft = neckRise(compiled, plan, ring, 1);
      surface.riseRight = neckRise(compiled, plan, ring, -1);
      seat = frontAt(surface, plan.nasion, 0) - prior.face.eyeRecess * scale;
      plan.left.seat = frontAt(surface, plan.eye, plan.left.place) - seat;
      plan.right.seat = frontAt(surface, plan.eye, -plan.right.place) - seat;
      plan.mandible = jawOf(plan, prior.mandible, frontAt(surface, plan.menton + prior.mandible.round * softness(prior.mandible, plan.fat) * prior.mandible.taper * scale, 0), (left.x + right.x) / 2, plan.mandibularWidth, [widest(compiled, plan, arch), arch]);
      plan.left.seat = 0;
      plan.right.seat = 0;
      surface.bridge = nasalBridge(surface);
      seat = frontAt(surface, plan.nasion, 0) - prior.face.eyeRecess * scale;
      plan.left.seat = frontAt(surface, plan.eye, plan.left.place) - seat;
      plan.right.seat = frontAt(surface, plan.eye, -plan.right.place) - seat;
      surface.nostrilRims = [physicalNostril(surface, 1), physicalNostril(surface, -1)];
      const alar = (side: 1 | -1, index: 0 | 1): Alar.Owner => Alar.create({
        rim: surface.nostrilRims![index], outerHalfWidth: plan.noseWidth,
        frame: { origin: [foundationAt(surface, plan.subnasale, 0), plan.subnasale, 0], forward: [Math.cos(plan.columella), Math.sin(plan.columella), 0], lateral: [0, 0, side], normal: [Math.sin(plan.columella), -Math.cos(plan.columella), 0] },
        face: (y: number, z: number): number => frontAt(surface, y, z), derivativeStep: 0.05 * scale, rows: 24, columns: 12,
      });
      surface.alar = [alar(1, 0), alar(-1, 1)];
      surface.cut.clear();
    };

    // Close dimensions on the composed analytic skin, including the mandible
    // and neck handover, before attaching openings and emitting any chains.
    const closure: AutoMovieHumanHeadClosure.IOutput = AutoMovieHumanHeadClosure.solve(plan, inputs, (s: number, theta: number, side: 1 | -1 = 1): Vec3 => pointAt(surface, s, theta, side), rebuild, (): AutoMovieHumanHeadLandmarks.IRegions => ({ eye: plan.eye, lid: plan.eye - Math.max(plan.left.height, plan.right.height) / 2, earTop: Math.max(left.top, right.top), earMiddle: arch, tragus: Math.max(earFront(left), earFront(right)), stomion: plan.stomion }), (): number => {
      let lo: number = plan.y0;
      let hi: number = plan.menton;
      for (let i: number = 0; i < 40; i++) {
        const mid: number = (lo + hi) / 2;
        if (AutoMovieHumanNaturalSpline.evaluate(plan.station, mid) < HANDED) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    }, (): AutoMovieHumanHeadDefinition.IAddresses => ({
      nasion: [frontAt(surface, plan.nasion, 0), plan.nasion, 0],
      gnathion: mandibularTurn(surface),
      alare: surface.alar === undefined ? undefined : [surface.alar[0].hood.mesh.points.reduce((a: Vec3, b: Vec3): Vec3 => b[2] > a[2] ? b : a), surface.alar[1].hood.mesh.points.reduce((a: Vec3, b: Vec3): Vec3 => b[2] < a[2] ? b : a)],
      lips: {
        border: lipSpans(surface).map((span: IAutoMovieHumanHermiteCurve["spans"][number]): Vec3 => span.start),
        contact: [frontAt(surface, plan.stomion, 0), plan.stomion, 0],
      },
    }));

    // One ring ends each chain, so the two ears share their joins, each one
    // inside both ears.
    const lower: number = Math.max(left.lower, right.lower);
    const upper: number = Math.min(left.upper, right.upper);
    const leftEar: AutoMovieHumanEarConstruction.IEar = { ...left, lower, upper };
    const rightEar: AutoMovieHumanEarConstruction.IEar = {
      ...right,
      lower,
      upper,
    };

    const shelf: number = plan.subnasale + BASE * (plan.nasion - plan.tip);
    const reach: number = SHELF * (plan.nasion - plan.tip);
    const middleStations: number[] = crowded(
      lower,
      upper,
      LAYERS_MIDDLE,
      shelf,
      reach,
    );

    // The ears' lower ends, where the middle head starts, lie from 1.5 to 9.5
    // mm over the subnasale on the references, so the nose's base runs across
    // the join. The lower head's layers crowd about it as the middle's do, and
    // gain the layers the crowding takes, so its pitch below is kept: on its
    // even 1.3 mm a sill 2.8 mm over the lip turned 54 degrees in one layer.
    const lowerPitch: number = (lower - level) / (LAYERS_LOWER - 1);
    const lowerStations: number[] = crowded(
      level,
      lower,
      1 + Math.ceil(weighted(level, lower, shelf, reach) / lowerPitch),
      shelf,
      reach,
    );
    const upperStations: number[] = Array.from(
      { length: LAYERS_UPPER },
      (_: unknown, i: number): number =>
        upper +
        (plan.vertex - CROWN * scale - upper) *
          Math.sin(((i / (LAYERS_UPPER - 1)) * Math.PI) / 2),
    );
    const weight: (p: Vec3) => number = gathered(plan);
    const plain = (
      name: string,
      samples: number,
      stations: readonly number[],
    ): IAutoMovieHumanLoftChain =>
      AutoMovieHumanHorizontalChain.build(
        { name, order: ORDER, samples, rule: "sagittal" },
        stations.map((s: number): Vec3[] => {
          const c: ISides = sides(surface, s);
          return sagittal(c.left, c.right, ORDER, weight);
        }),
      );
    const eared = (s: number): Vec3[] => {
      const c: ISides = sides(surface, s);
      const a: Vec3[] = spliced(leftEar, c.left, 1, s, weight);
      const b: Vec3[] = spliced(rightEar, c.right, -1, s, weight);
      return [...a.slice(0, ORDER_MIDDLE / 2), ...b.slice(1).reverse()];
    };
    const half: number = ORDER_MIDDLE / 2;
    const frontPhase: number = (Math.PI * SPLICE[0]!) / half;
    const backPhase: number =
      (Math.PI * (SPLICE[0]! + SPLICE[1]! + SPLICE[2]!)) / half;
    const middleRings: Vec3[][] = middleStations.map(eared);
    const middle: IAutoMovieHumanLoftChain = AutoMovieHumanHorizontalChain.build(
      {
        name: "head.middle",
        order: ORDER_MIDDLE,
        samples: 720,
        rule: "sagittal",
      },
      middleRings,
    );
    const earLeft = earChains(surface, leftEar, "left", 1);
    const earRight = earChains(surface, rightEar, "right", -1);
    const two: number = 2 * Math.PI;
    const splits = (
      head: string,
      left: string,
      right: string,
    ): IAutoMovieHumanBodyCalibration.ISplit[] => [
      {
        child: head,
        arcs: [
          [backPhase, two - backPhase],
          [two - frontPhase, frontPhase],
        ],
      },
      { child: left, arcs: [[frontPhase, backPhase]] },
      { child: right, arcs: [[two - backPhase, two - frontPhase]] },
    ];
    const eye = (
      side: "left" | "right",
      sign: 1 | -1,
    ): IAutoMovieHumanBodyCalibration.IEye => ({
      side,
      centre: [
        seat - prior.face.marginForward * scale,
        plan.eye + prior.face.globeRise * scale,
        sign * plan[side].place,
      ],
      radius: prior.face.radius * scale,
    });
    const eyes: IAutoMovieHumanBodyCalibration.IEye[] = [
      eye("left", 1),
      eye("right", -1),
    ];
    const mouth: AutoMovieHumanMouth.IOutput = mouthOf(surface);
    return {
      stature: scale * inputs.height,
      chains: [
        plain("head.lower", 424, lowerStations),
        middle,
        plain("head.upper", 504, upperStations),
        ...earLeft.chains,
        ...earRight.chains,
      ],
      events: [
        {
          parent: "head.middle",
          direction: "down",
          splits: splits("head.lower", "ear.lobe.left", "ear.lobe.right"),
        },
        {
          parent: "head.middle",
          direction: "up",
          splits: splits("head.upper", "ear.helix.left", "ear.helix.right"),
        },
        ...earLeft.events,
        ...earRight.events,
      ],
      poles: [
        {
          chain: "head.upper",
          end: "top",
          critical: true,
          point: [section(compiled, plan, plan.vertex).axis, plan.vertex, 0],
        },
        ...earLeft.poles,
        ...earRight.poles,
      ],
      apertures: [
        nostril(surface, 1),
        nostril(surface, -1),
        margin(plan, prior.face, eyes[0]!, plan.left, 1),
        margin(plan, prior.face, eyes[1]!, plan.right, -1),
        mouth.aperture,
      ],
      eyes,
      lips: lipSpans(surface),
      mouth: mouth.mouth,
      neckOrigin: closure.neckOrigin,
      neckNormal: closure.neckNormal,
      diagnostics: { closure: closure.residuals, geometry: plan.geometryFindings, alarSections: surface.alarSections },
    };
  }

  /**
   * The mouth placed from this head's lips: the fissure along the contact
   * line the lips' relief draws, and the interior behind it
   * (`AutoMovieHumanMouth`).
   */
  function mouthOf(surface: ISurface): AutoMovieHumanMouth.IOutput {
    const { plan } = surface;
    return AutoMovieHumanMouth.create({
      stomion: plan.stomion,
      width: plan.mouthWidth,
      upper: plan.upperLip,
      lower: plan.lowerLip,
      subnasale: plan.subnasale,
      menton: plan.menton,
      sex: plan.sex,
      gonion: plan.mandible!.gonion,
      // The fissure's midline in `relief`.
      contact: (u: number): number => plan.stomion + 1.2 * plan.scale * u * u,
      front: (y: number, z: number): number => frontAt(surface, y, z),
    });
  }

  /** One lid margin, a short Fourier series about its globe. */
  function margin(
    plan: ILayout,
    face: AutoMovieHumanHeadPrior.IFace,
    eye: IAutoMovieHumanBodyCalibration.IEye,
    o: IEyeOpening,
    sign: 1 | -1,
  ): IAutoMovieHumanLoftAperture {
    const row = (
      c0: number,
      h: readonly number[],
      unit: number,
    ): number[] => [c0, ...h.map((v: number): number => v * unit)];
    return {
      name: sign > 0 ? "eye.left" : "eye.right",
      order: 3,
      coefficients: [
        ...row(
          eye.centre[0] + face.marginForward * plan.scale,
          face.margin[0]!,
          plan.scale,
        ),
        ...row(plan.eye, face.margin[1]!, o.height / 2),
        ...row(
          sign * o.place,
          face.margin[2]!,
          (sign * o.length) / 2,
        ),
      ],
      forward: [1, 0, 0],
      depth: 4,
    };
  }

  /**
   * One nostril: a teardrop laid in the nose's base, its length running from
   * beside the tip back and out toward the alar base, where it is widest, with
   * the columella left between the two. It faces as the base does, down and a
   * little forward.
   */
  function nostril(surface: ISurface, sign: 1 | -1): IAutoMovieHumanLoftAperture {
    const curve: NasalRim.Curve = surface.nostrilRims![sign > 0 ? 0 : 1];
    const points: Vec3[] = Array.from({ length: 24 }, (_: unknown, i: number): Vec3 => curve.point(2 * Math.PI * i / 24));
    return { name: sign > 0 ? "nostril.left" : "nostril.right", order: curve.order,
      coefficients: curve.coefficients, forward: facing(points), depth: 2, pocket: 8.8 * surface.plan.scale };
  }

  /** The lips' colour boundary, a closed run of Hermite spans. */
  function lipSpans(surface: ISurface): IAutoMovieHumanHermiteCurve["spans"] {
    const { plan } = surface;
    const k: number = plan.scale;
    const borderUpper = (u: number): number =>
      plan.stomion +
      1.2 * k * u * u +
      plan.upperLip *
        Math.max(0, 1 - u * u) ** 0.55 *
        (1 - 0.18 * bell(u / 0.13));
    const borderLower = (u: number): number =>
      plan.stomion +
      1.2 * k * u * u -
      plan.lowerLip * Math.max(0, 1 - u * u) ** 0.65;
    const place = (y: number, z: number): Vec3 => [
      frontAt(surface, y, z),
      y,
      z,
    ];
    const points: Vec3[] = [];
    const N: number = 12;
    const up = (i: number): number => Math.sin(((i / N) * Math.PI) / 2);
    for (let i: number = 0; i < N; i++)
      points.push(place(borderUpper(up(i)), up(i) * plan.mouthWidth));
    for (let i: number = N; i > 0; i--)
      points.push(place(borderLower(up(i)), up(i) * plan.mouthWidth));
    for (let i: number = 0; i < N; i++)
      points.push(place(borderLower(up(i)), -up(i) * plan.mouthWidth));
    for (let i: number = N; i > 0; i--)
      points.push(place(borderUpper(up(i)), -up(i) * plan.mouthWidth));
    const n: number = points.length;
    const tangent = (i: number): Vec3 => {
      const a: Vec3 = points[(i + n - 1) % n]!;
      const b: Vec3 = points[(i + 1) % n]!;
      const l: number = dist(a, b) || 1;
      return [(b[0] - a[0]) / l, (b[1] - a[1]) / l, (b[2] - a[2]) / l];
    };
    return points.map(
      (p: Vec3, i: number): IAutoMovieHumanHermiteCurve["spans"][number] => ({
        address: `generated/span${i}`,
        interval: Math.max(1e-3, dist(p, points[(i + 1) % n]!)),
        start: p,
        end: points[(i + 1) % n]!,
        startDerivative: tangent(i),
        endDerivative: tangent((i + 1) % n),
      }),
    );
  }

  /**
   * The person's mandible: the plane through the chin's skin at the menton at
   * its angle, the gonion on it a fixed distance ahead of the ears' line at
   * half the jaw width, the ramus leaning back by the gonial angle, the body as
   * tall as the menton to the stomion, and its side leaning in from the cheek,
   * `[half-width, height]` at the zygomatic arch, to the angle. The soft tissue
   * over it, and so its roundings, grows with fat.
   */
  function jawOf(
    plan: ILayout,
    j: AutoMovieHumanHeadPrior.IMandible,
    chin: number,
    ear: number,
    width: number,
    cheek: [number, number],
  ): IMandible {
    const k: number = plan.scale;
    const degree: number = Math.PI / 180;
    const plane: number = (j.plane[0]! + j.plane[1]! * plan.sex) * degree;
    const angle: number = (j.angle[0]! + j.angle[1]! * plan.sex) * degree;
    const lean: number = angle - Math.PI / 2 - plane;
    const soft: number = softness(j, plan.fat);
    const round: number = j.round * soft * k;
    const gonion: number = ear + j.gonion * k;
    const slope: number = Math.tan(plane);
    const gonionY: number = plan.menton + (chin - gonion) * slope;
    const front: number = chin - j.inset * j.taper * round;
    const half: number = width / 2;
    const back: number = j.back * half;

    // The chin turns with the curvature of the parabola through the chin's
    // front and both gonions, the arch form of the mandible's base; the sides
    // run straight from it to the ellipse about the gonions, tangent to both.
    const radius: number = Math.min(0.9 * half, half ** 2 / (2 * (front - gonion)));
    const centre: number = front - radius;
    const gap = (phi: number): number =>
      centre * Math.sin(phi) +
      radius -
      gonion * Math.sin(phi) -
      Math.hypot(back * Math.sin(phi), half * Math.cos(phi));
    let lo: number = 0;
    let hi: number = Math.PI / 2;
    for (let i: number = 0; i < 60; i++) {
      const mid: number = (lo + hi) / 2;
      if (gap(mid) < 0) lo = mid;
      else hi = mid;
    }
    const nx: number = Math.sin(lo);
    const nz: number = Math.cos(lo);
    const q: number = Math.hypot(back * nx, half * nz);

    // The masseter runs from the zygomatic arch down to the angle, so the
    // jaw's side leans in from the cheek at the arch's height to the gonion.
    const rise: number = cheek[1] - gonionY;
    const spread: number = rise > 10 * k ? (cheek[0] - half) / rise / half : 0;
    return {
      front,
      gonion,
      gonionY,
      width: half,
      back,
      radius,
      origin: gonion - back / 2,
      side: [nx, nz],
      start: [gonion + (back ** 2 * nx) / q, (half ** 2 * nz) / q],
      end: [centre + radius * nx, radius * nz],
      spread,
      chin,
      menton: plan.menton,
      slope,
      cos: Math.cos(plane),
      lean: [Math.cos(lean), Math.sin(lean)],
      height: cheek[1] - plan.menton,
      cheekY: cheek[1],
      draft: 1 / Math.tan(j.under * degree),
      round,
      taper: j.taper,
      blend: j.blend * k,
      throat: j.throat * soft * k,
    };
  }

  /** Growth of the jaw's soft tissue with fat, from the prior's at none. */
  function softness(j: AutoMovieHumanHeadPrior.IMandible, fat: number): number {
    return Math.exp(j.fat * fat);
  }

  /** Forwardmost auricle point from the ear's actual analytic face field. */
  function earFront(ear: AutoMovieHumanEarConstruction.IEar): number {
    let front: number = -Infinity;
    for (let i: number = 0; i <= 64; i++) {
      const y: number = ear.bottom + (ear.top - ear.bottom) * i / 64;
      const centre: number = AutoMovieHumanEarConstruction.centre(ear, y, 0)[0];
      const chord: number = AutoMovieHumanEarConstruction.chord(ear, y);
      for (let j: number = 0; j <= 64; j++) {
        const q: number = j / 64;
        const x: number = centre + ear.along[0] * (2 * q - 1) * chord + ear.normal[0] * AutoMovieHumanEarConstruction.relief(ear, y, q);
        front = Math.max(front, x);
      }
    }
    return front;
  }

  /** Widest half-width of the section at a station, before its reliefs. */
  function widest(compiled: ICompiled, plan: ILayout, s: number): number {
    const m: ISection = section(compiled, plan, s);
    const ox: number = (m.front + m.back) / 2;
    let out: number = 0;
    for (let j: number = 0; j <= ANGLES / 4; j++) {
      const theta: number = (4 * Math.PI * j) / ANGLES;
      out = Math.max(out, radius(m, ox, theta) * Math.sin(theta));
    }
    return out;
  }

  /** Forward coordinate of the skin at a world height and lateral place. */
  export function frontAt(surface: ISurface, y: number, z: number): number {
    if (z === 0) {
      const reading: MedianWorldY.IReading = MedianWorldY.solve(y, (station: number): Vec3 => pointAt(surface, station, 0, 1));
      if (!reading.converged) {
        const reason: string = "The exact median world-Y intersection did not converge in twelve station corrections; its last actual skin point was retained.";
        if (!surface.plan.geometryFindings.includes(reason)) surface.plan.geometryFindings.push(reason);
      }
      return reading.point[0];
    }
    const sign: 1 | -1 = z < 0 ? -1 : 1;
    let station: number = y;
    let out: Vec3 = pointAt(surface, station, 0, sign);
    for (let iteration: number = 0; iteration < 12; iteration++) {
      let lo: number = 0;
      let hi: number = Math.PI / 2;
      for (let i: number = 0; i < 28; i++) {
        const mid: number = (lo + hi) / 2;
        if (Math.abs(pointAt(surface, station, mid, sign)[2]) < Math.abs(z)) lo = mid;
        else hi = mid;
      }
      out = pointAt(surface, station, (lo + hi) / 2, sign);
      const error: number = out[1] - y;
      if (Math.abs(error) < 1e-6) break;
      station -= error;
    }
    return out[0];
  }

  /** Exact analytic point, including relief and the neck's shared boundary. */
  export function pointAt(surface: ISurface, s: number, theta: number, sign: 1 | -1 = 1): Vec3 {
    const plan: ILayout = surface.plan;
    const m: ISection = section(surface.compiled, plan, s);
    const ox: number = (m.front + m.back) / 2;
    const r: number = radius(m, ox, theta);
    const along: number = Math.min(1, Math.max(0, m.t / NECK_FADE));
    const fade: number = 1 - smooth(along);
    const run: number = (s - plan.y0) * (1 - along) ** 2;
    const phase: number = Math.max(0, Math.min(ANGLES, theta * ANGLES / Math.PI));
    const i: number = Math.min(ANGLES - 1, Math.floor(phase));
    const f: number = phase - i;
    const read = (values: readonly number[]): number => values[i]! * (1 - f) + values[i + 1]! * f;
    const r0: number = r + fade * (read(sign > 0 ? surface.neckLeft : surface.neckRight) + run * read(sign > 0 ? surface.slopeLeft : surface.slopeRight));
    const c: number = Math.cos(theta);
    const n: number = Math.sin(theta);
    const cos: number = Math.cos(m.tilt);
    const sin: number = Math.sin(m.tilt);
    const xi: number = ox + r0 * c;
    const h: number = relief(surface, xi * cos, s + xi * sin, sign * r0 * n, sign);
    const xi1: number = ox + (r0 + h) * c;
    return [xi1 * cos, s + xi1 * sin + fade * read(sign > 0 ? surface.riseLeft : surface.riseRight), sign * (r0 + h) * n];
  }

}

/** Stations a bump is placed from. */
type IAnchor = "eye" | "nasion" | "tip" | "subnasale" | "stomion" | "menton";

/** Face height the bumps' lengths are written for, millimetres. */
const FACE_UNIT: number = 108;

/** The public eye. */
type PublicEye = IAutoMovieHumanHeadIdentity["face"]["eyePair"]["left"];

/** The public ear. */
type PublicEar = IAutoMovieHumanHeadIdentity["earPair"]["left"];

/** A point. */
type Vec3 = [number, number, number];

/** A point of a section. */
type P2 = [number, number];


/** Station by which the neck's measures have left the sections. */
const HANDOVER: number = 2.5;

/** Station where the face shield starts, above the plain neck. */
const SHIELD_FROM: number = 0.45;

/** Angle a ray keeps off the midline, radians: far under a ring's spacing. */
const OFF_VERTEX: number = 1e-6;

/** Stations over which the shield rises to its width. */
const SHIELD_RISE: number = 0.5;

/** Station by which the neck's lean has brought its axis under the skull. */
const LEAN: number = 1.7;

/** Station up to which the sections are the neck's. */
const HANDED: number = 0.7;

/** Station by which the neck ring's own difference has left the sections. */
const NECK_FADE: number = 0.95;

/** Height under the neck's top ring its slope is read over, millimetres. */
const NECK_STEP: number = 2;

/** Sharpness of the union of the back body and the shield. */
const POWER: number = 5;

/** Sharpness of the soft maximum along the nose's own axis. */
const NOSE: number = 5;

/** Extra controls per millimetre over the face. */
const GATHER: number = 2;

/** Extra layers per millimetre over the nose's shelf. */
const CROWD: number = 2;

/** Half-height of that crowding, in spans of nasion to tip. */
const SHELF: number = 0.25;

/** Where it crowds, above the subnasale in spans of nasion to tip: the base. */
const BASE: number = 0.15;

/** Angles of half a section: finer than the face's gathered controls. */
const ANGLES: number = 960;

/** Control points of the head's sections. */
const ORDER: number = 256;

/** Control points of the sections that hold the ears. */
const ORDER_MIDDLE: number = 512;

/**
 * Control points of half a middle section: the head in front of the ear, the
 * ear's anterior and posterior faces and the head behind it.
 */
const SPLICE: number[] = [112, 72, 28, 44];

/** Control points of the helix chains' sections. */
const ORDER_HELIX: number = 128;

/** Points of an ear's free loop. */
const LOOP: number = 200;

/** Where along an ear's free loop the pit opens. */
const PIT: number = 0.28;

/** Share of the helix chain over which the pit deepens, from its top. */
const PIT_FROM: number = 0.6;

/** Points of the pocket's loop. */
const POCKET: number = 60;

/** Layers of the chains: more than the rows carried. */
const LAYERS_LOWER: number = 90;

/** See {@link LAYERS_LOWER}. */
const LAYERS_MIDDLE: number = 48;

/** See {@link LAYERS_LOWER}. */
const LAYERS_UPPER: number = 40;

/** Last section below the vertex, world millimetres. */
const CROWN: number = 0.25;

/** Least step along a ray near the jaw, millimetres. */
const JAW_STEP: number = 0.4;

/** Distance from the jaw past which a ray has left it, millimetres. */
const JAW_REACH: number = 80;

/** Rounding of the jaw's end inside the face, in its soft tissue's radii. */
const JAW_TOP: number = 3;

/**
 * Tilt of a section plane: a hump over the jaw, gone by the subnasale, so that
 * the planes pass under the chin and the sections above are level.
 */
function tiltOf(hump: readonly number[], t: number): number {
  const d: number = t - hump[1]!;
  return (
    hump[0]! *
    bell(d / (d < 0 ? hump[2]! : hump[3]!)) *
    (1 - smooth((t - 1.55) / 0.45))
  );
}

/** Ramanujan's perimeter of an ellipse. */

/** Lame field of a unit super-ellipse. */
function lame(a: number, b: number, n: number): number {
  return (Math.abs(a) ** n + Math.abs(b) ** n) ** (1 / n);
}

/** A flat-topped bell of unit height. */
function bell4(x: number): number {
  return Math.exp(-(x ** 4));
}

/** A bell of unit height. */
function bell(x: number): number {
  return Math.exp(-x * x);
}

/** A two-dimensional bell of unit height. */
function bell2(x: number, y: number): number {
  return Math.exp(-x * x - y * y);
}

/** Smoothstep clamped to [0, 1]. */
function smooth(x: number): number {
  const t: number = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

/**
 * Signed distance of the intersection of two regions given by signed
 * distances, its edge rounded at a radius: exact for two planes.
 */
function rounded(a: number, b: number, r: number): number {
  return (
    Math.min(-r, Math.max(a, b)) +
    Math.hypot(Math.max(a + r, 0), Math.max(b + r, 0))
  );
}

/**
 * Height of the nose's base over the lip at a distance above the base's line:
 * the lip and the base plane, rising forward at an angle, joined by a circle
 * of a radius tangent to both.
 */
function filleted(above: number, angle: number, radius: number): number {
  const reach: number = radius / Math.tan(Math.PI / 4 + angle / 2);
  if (above <= -reach) return 0;
  if (above >= reach * Math.sin(angle)) return above / Math.tan(angle);
  return radius - Math.sqrt(Math.max(0, radius ** 2 - (above + reach) ** 2));
}

/** Quadratic smooth minimum over an absolute width. */
function softMin(a: number, b: number, width: number): number {
  const h: number = Math.max(width - Math.abs(a - b), 0) / width;
  return Math.min(a, b) - (h * h * width) / 4;
}

/** Mean of a list. */
function mean(v: readonly number[]): number {
  return v.reduce((s: number, x: number): number => s + x, 0) / v.length;
}

/** Distance. */
function dist(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** Between two points. */
function mix(a: P2, b: P2, f: number): P2 {
  return [a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1])];
}

/** Mean of a loop's points. */
function centroid(loop: readonly P2[]): P2 {
  return [
    mean(loop.map((p: P2): number => p[0])),
    mean(loop.map((p: P2): number => p[1])),
  ];
}

/** Unit normal of a small closed loop on the skin, facing forward or down. */
function facing(loop: readonly Vec3[]): Vec3 {
  const n: number = loop.length;
  const across: Vec3 = sub(loop[0]!, loop[n >> 1]!);
  const along: Vec3 = sub(loop[n >> 2]!, loop[(3 * n) >> 2]!);
  const c: Vec3 = [
    across[1] * along[2] - across[2] * along[1],
    across[2] * along[0] - across[0] * along[2],
    across[0] * along[1] - across[1] * along[0],
  ];
  const l: number = Math.hypot(c[0], c[1], c[2]) || 1;
  const s: number = c[0] - c[1] >= 0 ? 1 / l : -1 / l;
  return [s * c[0], s * c[1], s * c[2]];
}

/** Difference. */
function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** A section point on a side at a height. */
function lifted(p: P2, y: number, sign: 1 | -1): [number, number, number] {
  return [p[0], y, sign * p[1]];
}

/** Per-layout physical patch cache; keys retire with their generated person. */
const MANDIBULAR_QUERIES = new WeakMap<AutoMovieHumanHeadConstruction.IMandible, Mandibular.IPrepared>();
