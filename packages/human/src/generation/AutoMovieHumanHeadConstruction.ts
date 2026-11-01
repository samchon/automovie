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
 * keys of the shield's half-width.
 *
 * Named features are reliefs written as radial heights over that surface, each
 * with its own place, widths and depth, driven by the public dimensions: the
 * planes and hollows of the face, the nose's dorsum, tip, alae and sill, the
 * philtrum, the lips and the oral fissure between them. The sockets fall to seat
 * the eyes a fixed depth behind the nasion. The lid margins, globes, nostrils
 * and the lips' colour boundary are placed from the same dimensions, so they
 * stay on the features they belong to.
 *
 * The neck ring's difference from the law fades in over the jaw, so the bottom
 * ring is the neck's own. Auricles are spliced into the sections of the middle
 * chain by `AutoMovieHumanEarConstruction`, and their free ends are the ear
 * chains. Rings are parametrized by each chain's own phase rule.
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
  }

  /** Head and lip boundary. */
  export interface IOutput {
    /** Calibration with the head, ears, eyes and openings replaced. */
    body: IAutoMovieHumanBodyCalibration;

    /** Lip colour boundary. */
    vermilion: IAutoMovieHumanHermiteCurve;
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

    /** Vault's squareness over the population's, from the head tape. */
    vault: number;

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

    /** Back body exponent. */
    powerBack: number;

    /** Shield exponent. */
    powerFace: number;
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
    const menton: number = y0 + r.neck * inputs.neckLength * k;
    const vertex: number = menton + r.height * head.height * k;
    const eye: number = menton + r.face * head.faceHeight * k;
    const nasion: number = eye + r.nasion * head.faceHeight * k;
    const tip: number = nasion - r.bridge * head.face.nose.height * k;
    const subnasale: number = tip - r.tip * head.face.nose.height * k;
    const face: number = (r.zygomatic * head.faceWidth * k) / 2;
    const opening = (eye: PublicEye): IEyeOpening => ({
      place: ((head.face.intercanthalWidth + eye.palpebralFissureLength) * k) / 2,
      length: eye.palpebralFissureLength * k,
      height: eye.palpebralFissureHeight * k,
      seat: 0,
    });
    return {
      scale: k,
      sex: inputs.sex,
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
      length: r.length * head.length * k,
      breadth: (r.breadth * head.length * head.cephalicIndex * k) / 100,
      faceHeight: head.faceHeight * k,
      vault:
        VAULT_GAIN *
        ((r.circumference * head.circumference * k) /
          perimeter(
            (r.length * head.length * k) / 2,
            (r.breadth * head.length * head.cephalicIndex * k) / 200,
          ) -
          1),
      faceWidth: face,
      jaw: Math.log(
        (r.gonial * head.mandibularWidth) / (r.zygomatic * head.faceWidth),
      ),
      brow: Math.log(
        (r.frontal * head.minimumFrontalWidth) / (r.zygomatic * head.faceWidth),
      ),
      noseWidth: (head.face.nose.width * k) / 2,
      noseLead:
        (f.projection[0]! + f.projection[1]! * head.face.nose.protrusion) * k,
      mouthWidth: (f.mouth * head.face.mouth.width * k) / 2,
      upperLip: f.vermilion * head.face.mouth.upperVermilionHeight * k,
      lowerLip: f.vermilion * head.face.mouth.lowerVermilionHeight * k,
      gap: f.gape * head.mouthOpening * k,
      joint: f.joint * head.mandibularLaterotrusion * k,
      left: opening(head.face.eyePair.left),
      right: opening(head.face.eyePair.right),
      station: AutoMovieHumanNaturalSpline.create(
        [y0, menton, subnasale, eye, vertex],
        [0, 1, 2, 3, 4],
      ),
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
      powerBack:
        4 +
        2 *
          Math.tanh(
            read(compiled.squareBack) + plan.vault * smooth((t - 2.2) / 0.6),
          ),
      powerFace: 4 + 2 * Math.tanh(read(compiled.squareFace)),
    };
  }

  /** One on the section's outline, as a distance scale about its centres. */
  export function field(section: ISection, x: number, z: number): number {
    const g: number = lame(
      (x - section.axis) / Math.max(1, section.axis - section.back),
      z / section.width,
      section.powerBack,
    );
    const f: number = lame(
      (x - section.waist) / Math.max(1, section.front - section.waist),
      z / section.face,
      section.powerFace,
    );
    return (g ** -POWER + f ** -POWER) ** (-1 / POWER);
  }

  /** Radius of the section's outline along a ray from `(ox, 0)`. */
  export function radius(
    section: ISection,
    ox: number,
    theta: number,
    guess: number = 0,
  ): number {
    const c: number = Math.cos(theta);
    const n: number = Math.sin(theta);
    let r: number =
      guess > 0 ? guess : (section.front - section.back) / 2 || 1;
    for (let i: number = 0; i < 12; i++) {
      const g: number = field(section, ox + r * c, r * n);
      const next: number = r / g;
      if (Math.abs(next - r) < 1e-6) return next;
      r = next;
    }

    // Where the two bodies pull apart the iteration need not settle.
    let lo: number = 0;
    let hi: number = 3 * Math.max(10, section.front - section.back);
    for (let i: number = 0; i < 40; i++) {
      const mid: number = (lo + hi) / 2;
      if (field(section, ox + mid * c, mid * n) < 1) lo = mid;
      else hi = mid;
    }
    return lo;
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
      },
      vermilion: { ...vermilion, spans: head.lips },
    };
  }

  /** Whether a chain belongs to the head above the neck. */
  export function owns(name: string): boolean {
    return /^(head\.|ear\.)/.test(name);
  }

  /** Everything the head adds. */
  interface IGenerated {
    stature: number;
    chains: IAutoMovieHumanLoftChain[];
    events: IAutoMovieHumanBodyCalibration.IEvent[];
    poles: IAutoMovieHumanBodyCalibration.IPole[];
    apertures: IAutoMovieHumanLoftAperture[];
    eyes: IAutoMovieHumanBodyCalibration.IEye[];
    lips: IAutoMovieHumanHermiteCurve["spans"];
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

    /** Neck ring's height off its plane, left side. */
    riseLeft: number[];

    /** Neck ring's height off its plane, right side. */
    riseRight: number[];

    /** Sections already cut, by station. */
    cut: Map<number, ISides>;
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
    const fade: number = Math.max(0, 1 - m.t / NECK_FADE) ** 2;
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
      const emit = (delta: number, rise: number, sign: 1 | -1): Vec3 => {
        const r0: number = r + fade * delta;
        const xi: number = ox + r0 * c;
        const z: number = sign * r0 * n;
        const x: number = xi * cos;
        const y: number = s + xi * sin;
        const h: number = relief(surface, x, y, z, sign);
        const r1: number = r0 + h;
        const xi1: number = ox + r1 * c;
        return [xi1 * cos, s + xi1 * sin + fade * rise, sign * r1 * n];
      };
      left[j] = emit(surface.neckLeft[j]!, surface.riseLeft[j]!, 1);
      right[j] = emit(surface.neckRight[j]!, surface.riseRight[j]!, -1);
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

    // The nose: the dorsum's ridge, the tip's ball, the alae and the sill they
    // stand on, joined by a soft maximum.
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
    const ala: number =
      ((f.ala[0]! * w) / 14) *
      bell(
        Math.hypot(
          (y - plan.subnasale - f.ala[1]! * span) / (f.ala[3]! * span),
          (a - f.ala[2]! * w) / (f.ala[4]! * w),
        ),
      );
    const sill: number =
      f.sill[0]! *
      lead *
      bell(
        Math.hypot(
          (y - plan.subnasale - f.sill[1]! * span) / (f.sill[2]! * span),
          a / (f.sill[3]! * w),
        ),
      );
    out +=
      (ridge ** NOSE + ball ** NOSE + ala ** NOSE + sill ** NOSE) **
      (1 / NOSE);

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
      const bulge = (c: number, h: number, lead: number): number =>
        h <= 0
          ? 0
          : lead * k * m ** 0.8 * bell((y - c) / Math.max(0.8 * k, 0.62 * h));
      out += bulge(mid + upper / 2, upper, f.lips[0]!);
      out += bulge(mid - lower / 2, lower, f.lips[1]!);
      const groove: number = f.fissure[1]! * k + plan.gap;
      out -=
        (f.fissure[0]! * k + 0.4 * plan.gap) *
        smooth((1.08 - u) / 0.2) *
        bell((y - mid) / groove);
    }

    return out * front;
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
      out.push(
        AutoMovieHumanPolarSection.radius(ring, [ox, 0], sign * theta) - r,
      );
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
    for (let j: number = 0; j <= ANGLES; j++) {
      const theta: number = (sign * Math.PI * j) / ANGLES;
      let best: Vec3 = ring[0]!;
      let gap: number = Infinity;
      for (const p of ring) {
        const a: number = Math.atan2(p[2], p[0] - ox) - theta;
        const d: number = Math.abs(Math.atan2(Math.sin(a), Math.cos(a)));
        if (d < gap) {
          gap = d;
          best = p;
        }
      }
      out.push(best[1] - plan.y0);
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
    const gap: number =
      AutoMovieHumanHeadPrior.PRIOR.ear.root * ear.measures.breadth;
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
      out.push(...resample(line, count + 1).slice(0, count));
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
  ): Vec3[] {
    const half: number = order / 2;
    const a: Vec3[] = resample(left, half + 1);
    const b: Vec3[] = resample(right, half + 1);
    return [...a.slice(0, half), ...b.slice(1).reverse()];
  }

  /** Points at uniform arclength along a polyline, both ends included. */
  function resample(line: readonly Vec3[], count: number): Vec3[] {
    const s: number[] = [0];
    for (let i: number = 1; i < line.length; i++)
      s.push(s[i - 1]! + dist(line[i]!, line[i - 1]!));
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

  /** Equal shares of a path along arclength. */
  function share(loop: readonly P2[], count: number): P2[] {
    return resample(
      loop.map((p: P2): Vec3 => [p[0], 0, p[1]]),
      count,
    ).map((p: Vec3): P2 => [p[0], p[2]]);
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
        phased(rule, l.loop, order, mirrored).ring.map(
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
      return share(path, LOOP);
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
      const n: P2 = ear.normal;
      const inset: number = b + 0.3 * half * (1 - size);
      return AutoMovieHumanEarConstruction.oval(
        [c[0] - n[0] * inset, c[1] - n[1] * inset],
        ear.along,
        a,
        b,
        POCKET,
        -1,
        Math.PI / 2,
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
        return {
          y,
          loop: [
            ...l.slice(0, pit + 1),
            ...pocket.map((p: P2): P2 => mix(l[pit]!, p, k)),
            ...l.slice(pit),
          ],
        };
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
    const phases: number[] = phased(
      "arclength",
      closed,
      ORDER_HELIX,
      false,
    ).phases;
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
    const r: AutoMovieHumanHeadPrior.IRatios = prior.ratios;
    const rise: number =
      r.neck * inputs.neckLength + r.height * inputs.head.height;
    const scale: number = level / (inputs.height - rise);
    const neck: INeck = {
      level,
      x: mean(xs),
      radius: (inputs.neck * scale) / (2 * Math.PI),
    };

    // The vertex is the stature: the neck ring stays in calibration and the
    // head above it is in world lengths, so the scale closes on itself.
    const plan: ILayout = layout(compiled, inputs, neck, scale);
    const flat: [number, number][] = ring.map(
      (p: Vec3): [number, number] => [p[0], p[2]],
    );
    const surface: ISurface = {
      compiled,
      plan,
      neckLeft: neckDelta(compiled, plan, flat, 1),
      neckRight: neckDelta(compiled, plan, flat, -1),
      riseLeft: neckRise(compiled, plan, ring, 1),
      riseRight: neckRise(compiled, plan, ring, -1),
      cut: new Map(),
    };

    // The eyes stand a fixed depth behind the nasion's skin, and the sockets
    // fall to them.
    const seat: number =
      frontAt(surface, plan.nasion, 0) - prior.face.eyeRecess * scale;
    plan.left.seat = frontAt(surface, plan.eye, plan.left.place) - seat;
    plan.right.seat = frontAt(surface, plan.eye, -plan.right.place) - seat;
    surface.cut.clear();

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
    const left: AutoMovieHumanEarConstruction.IEar = place(
      inputs.head.earPair.left,
    );
    const right: AutoMovieHumanEarConstruction.IEar = place(
      inputs.head.earPair.right,
    );

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

    const lowerStations: number[] = uniform(level, lower, LAYERS_LOWER);
    const middleStations: number[] = uniform(lower, upper, LAYERS_MIDDLE);
    const upperStations: number[] = Array.from(
      { length: LAYERS_UPPER },
      (_: unknown, i: number): number =>
        upper +
        (plan.vertex - CROWN * scale - upper) *
          Math.sin(((i / (LAYERS_UPPER - 1)) * Math.PI) / 2),
    );
    const plain = (
      name: string,
      samples: number,
      stations: readonly number[],
    ): IAutoMovieHumanLoftChain =>
      AutoMovieHumanHorizontalChain.build(
        { name, order: ORDER, samples, rule: "sagittal" },
        stations.map((s: number): Vec3[] => {
          const c: ISides = sides(surface, s);
          return sagittal(c.left, c.right, ORDER);
        }),
      );
    const eared = (s: number): Vec3[] => {
      const c: ISides = sides(surface, s);
      const a: Vec3[] = spliced(leftEar, c.left, 1, s);
      const b: Vec3[] = spliced(rightEar, c.right, -1, s);
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
      ],
      eyes,
      lips: lipSpans(surface),
    };
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
          (sign * o.length * face.fissureLength) / 2,
        ),
      ],
      forward: [1, 0, 0],
      depth: 4,
    };
  }

  /** One nostril: an oval drawn on the skin under the nose. */
  function nostril(surface: ISurface, sign: 1 | -1): IAutoMovieHumanLoftAperture {
    const { plan, compiled } = surface;
    const f: AutoMovieHumanHeadPrior.IFace = compiled.prior.face;
    const w: number = plan.noseWidth;
    const order: number = 3;
    const count: number = 24;
    const cy: number = plan.tip - f.nostrilCentre[0]! * (plan.nasion - plan.tip);
    const cz: number = f.nostrilCentre[1]! * w;
    const points: Vec3[] = Array.from(
      { length: count },
      (_: unknown, i: number): Vec3 => {
        const t: number = (2 * Math.PI * i) / count;
        const y: number = cy + f.nostrilSize[1]! * w * Math.sin(t);
        const z: number = cz + f.nostrilSize[0]! * w * Math.cos(t);
        return [frontAt(surface, y, sign * z), y, sign * z];
      },
    );
    const coefficients: number[] = [0, 1, 2].flatMap((c: number): number[] => {
      const out: number[] = [
        points.reduce((v: number, p: Vec3): number => v + p[c]!, 0) / count,
      ];
      for (let k: number = 1; k <= order; k++) {
        let a: number = 0;
        let b: number = 0;
        points.forEach((p: Vec3, i: number): void => {
          const t: number = (2 * Math.PI * k * i) / count;
          a += (2 * p[c]! * Math.cos(t)) / count;
          b += (2 * p[c]! * Math.sin(t)) / count;
        });
        out.push(a, b);
      }
      return out;
    });
    return {
      name: sign > 0 ? "nostril.left" : "nostril.right",
      order,
      coefficients,
      forward: facing(points),
      depth: 2,
      pocket: 8.8 * plan.scale,
    };
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

  /** Forward coordinate of the skin at a world height and lateral place. */
  function frontAt(surface: ISurface, y: number, z: number): number {
    const m: ISection = section(surface.compiled, surface.plan, y);
    const c: ISides = sides(surface, y - 100 * Math.sin(m.tilt));
    const list: Vec3[] = z >= 0 ? c.left : c.right;
    let best: Vec3 = list[0]!;
    for (const p of list.slice(0, ANGLES / 2))
      if (Math.abs(p[2] - z) < Math.abs(best[2] - z)) best = p;
    return best[0];
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

/** Change of the squareness key per share of tape over the ellipse's. */
const VAULT_GAIN: number = 5.5;

/** Station by which the neck's measures have left the sections. */
const HANDOVER: number = 2.5;

/** Station where the face shield starts, above the plain neck. */
const SHIELD_FROM: number = 0.45;

/** Stations over which the shield rises to its width. */
const SHIELD_RISE: number = 0.5;

/** Station by which the neck's lean has brought its axis under the skull. */
const LEAN: number = 1.7;

/** Station up to which the sections are the neck's. */
const HANDED: number = 0.7;

/** Station by which the neck ring's own difference has left the sections. */
const NECK_FADE: number = 0.95;

/** Sharpness of the union of the back body and the shield. */
const POWER: number = 5;

/** Sharpness of the nose's soft maximum. */
const NOSE: number = 5;

/** Angles of half a section. */
const ANGLES: number = 480;

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
function perimeter(a: number, b: number): number {
  return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
}

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
