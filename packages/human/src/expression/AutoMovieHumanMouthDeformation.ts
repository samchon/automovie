import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanMouth } from "../generation/AutoMovieHumanMouth";
import { AutoMovieHumanMouthPrior as Prior } from "../generation/AutoMovieHumanMouthPrior";
import { AutoMovieHumanOralCavity } from "../generation/AutoMovieHumanOralCavity";
import type { AutoMovieHumanMouthExpression } from "./AutoMovieHumanMouthExpression";

/**
 * Displacement of the lips, cheeks and tongue for a resolved mouth, added to
 * the skin at its bind before skinning, so the jaw's pose carries it.
 *
 * The field is written in the mouth's own chart, from the bind position of a
 * point: `u`, the lateral place over the half width; `v`, the height over the
 * lips' contact line. Each lip unit pulls handles, the two cheilia and the
 * upper and lower lips' middle and mid-lateral points, along its muscle's
 * line of action (FACS, Ekman, Friesen and Hager 2002), and the handles are
 * spread across the lip by a uniform Catmull-Rom spline in `u`. Upper and
 * lower lip carry their own handles and meet only at the cheilia, which is
 * why the skin is open along the contact line: the field may part there and
 * nowhere else. Past the cheilia a handle fades as a Gaussian of the distance
 * over the modiolus, and above and below the vermilion it fades over the
 * lip's skin to the subnasale and toward the labiomental fold. Behind the
 * vestibule's wall the lining stands still, so only the lips' inner faces
 * move with them; the teeth never move.
 *
 * Magnitudes: the lip corner puller moves its handles by a posed maximal
 * smile's mean 3D displacements (Korean adults, J Korean Soc Plast Reconstr
 * Surg 2003, "Three Dimensional Analysis of Normal Smiles in Korean"): the
 * cheilion 13.7 mm at 52.2 degrees up from lateral in the coronal plane and
 * 48.9 degrees back, the mid-lateral upper lip 10.1 mm at 57.2 and 30.9, the
 * upper lip's centre 7.3 mm, the lower lip's centre 5.9 mm at -87.5 and 66.9
 * and its mid-lateral point 6.7 mm at -12.7 and 61.5. No measured magnitude
 * was read for the other units: each moves by a share of the person's own
 * half width or vermilion height, a convention in the direction FACS gives.
 *
 * The tongue's tip and dorsum travel toward the contacts their motion makes,
 * the alveolar ridge and the palate, in the jaw's bind frame: the tongue rides
 * the jaw, so the target is the head's contact turned back by the jaw's
 * opening about its hinge, and a contact stays one whatever the opening.
 */
export namespace AutoMovieHumanMouthDeformation {
  /** Point `[x, y, z]` in calibration mm. */
  export type Vec3 = [number, number, number];

  /** What the field needs of a body. */
  export interface IContext {
    /** The mouth. */
    mouth: AutoMovieHumanMouth.IMouth;

    /** The jaw's hinge, mm. */
    hinge: Vec3;

    /** Distance from the hinge to the chin, mm, which turns an opening into an angle. */
    span: number;
  }

  /** The field's context for a body, or null without a mouth or a jaw. */
  export function context(calibration: IAutoMovieHumanBodyCalibration): IContext | null {
    const jaw = calibration.skeleton?.find((b): boolean => b.bone === "jaw");
    if (calibration.mouth === undefined || jaw === undefined) return null;
    const chin: Vec3 = jaw.tip ?? jaw.toward;
    return {
      mouth: calibration.mouth,
      hinge: jaw.position,
      span: Math.hypot(chin[0] - jaw.position[0], chin[1] - jaw.position[1], chin[2] - jaw.position[2]),
    };
  }

  /** Displacement of one bind point. */
  export type Field = (p: Readonly<Vec3>, tongue: boolean) => Vec3;

  /**
   * The displacement field of a resolved mouth.
   *
   * @param context The body.
   * @param resolved The mouth's channels.
   * @param opening The jaw's interincisal opening in the pose, mm.
   */
  export function field(
    context: IContext,
    resolved: AutoMovieHumanMouthExpression.IResolved,
    opening: number,
  ): Field {
    const m: AutoMovieHumanMouth.IMouth = context.mouth;
    const handles: IHandles = combine(m, resolved);
    const turn: number = opening / context.span;
    return (p: Readonly<Vec3>, tongue: boolean): Vec3 =>
      tongue ? tongueAt(context, resolved, turn, p) : lipsAt(m, handles, resolved.whole.cheekPuff, p);
  }

  /** Points moved within this distance of the mouth, mm; anything farther stands still. */
  export function reach(mouth: AutoMovieHumanMouth.IMouth): number {
    return 3 * mouth.width;
  }

  /**
   * Move a mesh's bind positions and normals by a field.
   *
   * Normals follow the field's derivative: a surface moved by `p + d(p)` turns
   * its normal by the cofactor of `I + grad d`, read here by central
   * differences of 0.05 mm.
   *
   * @param positions Bind positions in metres, grouped in threes.
   * @param normals Unit normals, aligned, or null.
   * @param scale Metres per calibration millimetre.
   * @param field The field.
   * @param tongue Whether the mesh is the tongue.
   * @param mouth The mouth, which bounds where the field acts.
   * @returns New buffers, or null when no vertex moves.
   */
  export function displace(
    positions: ArrayLike<number>,
    normals: ArrayLike<number> | null,
    scale: number,
    field: Field,
    tongue: boolean,
    mouth: AutoMovieHumanMouth.IMouth,
  ): { positions: number[]; normals: number[] | null } | null {
    const count: number = positions.length / 3;
    const far: number = reach(mouth);
    const centre: Vec3 = [mouth.front, mouth.stomion, 0];
    let moved: boolean = false;
    const outP: number[] = Array.from(positions);
    const outN: number[] | null = normals === null ? null : Array.from(normals);
    const h: number = DIFFERENCE;
    for (let v: number = 0; v < count; v++) {
      const p: Vec3 = [positions[3 * v]! / scale, positions[3 * v + 1]! / scale, positions[3 * v + 2]! / scale];
      if (Math.hypot(p[0] - centre[0], p[1] - centre[1], p[2] - centre[2]) > far) continue;
      const d: Vec3 = field(p, tongue);
      if (d[0] === 0 && d[1] === 0 && d[2] === 0) continue;
      moved = true;
      for (let k: number = 0; k < 3; k++) outP[3 * v + k] = (p[k]! + d[k]!) * scale;
      if (outN === null) continue;
      // Jacobian columns of p -> p + d(p).
      const col: Vec3[] = [0, 1, 2].map((k: number): Vec3 => {
        const a: Vec3 = [...p] as Vec3;
        const b: Vec3 = [...p] as Vec3;
        a[k] -= h;
        b[k] += h;
        const da: Vec3 = field(a, tongue);
        const db: Vec3 = field(b, tongue);
        return [0, 1, 2].map((i: number): number => (i === k ? 1 : 0) + (db[i]! - da[i]!) / (2 * h)) as Vec3;
      });
      const n: Vec3 = [normals![3 * v]!, normals![3 * v + 1]!, normals![3 * v + 2]!];
      // Cofactor times n: (J^-T n) det J, the columns' pairwise crosses.
      const c01: Vec3 = cross(col[0]!, col[1]!);
      const c12: Vec3 = cross(col[1]!, col[2]!);
      const c20: Vec3 = cross(col[2]!, col[0]!);
      const t: Vec3 = [0, 1, 2].map((i: number): number => c12[i]! * n[0] + c20[i]! * n[1] + c01[i]! * n[2]) as Vec3;
      const l: number = Math.hypot(...t);
      if (!(l > 1e-12)) continue;
      for (let k: number = 0; k < 3; k++) outN[3 * v + k] = t[k]! / l;
    }
    return moved ? { positions: outP, normals: outN } : null;
  }

  /** Handle vectors of every lip channel at full intensity, per side, summed by intensity. */
  interface IHandles {
    /** Cheilion of the person's left and right. */
    corner: { left: Vec3; right: Vec3 };

    /** Upper lip at u = -0.5, 0, 0.5. */
    upper: [Vec3, Vec3, Vec3];

    /** Lower lip at u = -0.5, 0, 0.5. */
    lower: [Vec3, Vec3, Vec3];

    /** The same, applied in proportion to the height within the vermilion. */
    upperLinear: [Vec3, Vec3, Vec3];

    lowerLinear: [Vec3, Vec3, Vec3];
  }

  /** One channel's handles on the person's left, at full intensity. */
  interface IChannel {
    corner: Vec3;
    upperMiddle: Vec3;
    upperCentre: Vec3;
    lowerMiddle: Vec3;
    lowerCentre: Vec3;

    /** Whether the lip handles act in proportion to the height within the vermilion. */
    linear: boolean;
  }

  /**
   * One channel's handles. A share is of the half width `w`, the upper
   * vermilion `hu` or the lower `hl`; vectors are forward, up, left.
   */
  function channel(name: string, w: number, hu: number, hl: number): IChannel {
    const zero: Vec3 = [0, 0, 0];
    const deg: number = Math.PI / 180;
    // A measured displacement: magnitude, angle up from lateral in the
    // coronal plane, angle back out of it.
    const measured = (mm: number, coronal: number, back: number): Vec3 => {
      const c: number = mm * Math.cos(back * deg);
      return [-mm * Math.sin(back * deg), c * Math.sin(coronal * deg), c * Math.cos(coronal * deg)];
    };
    switch (name) {
      case "lipCornerPuller":
        return {
          corner: measured(13.7, 52.2, 48.9),
          upperMiddle: measured(10.1, 57.2, 30.9),
          // The centre's direction was not reported; it is taken straight up.
          upperCentre: [0, 7.3, 0],
          lowerMiddle: measured(6.7, -12.7, 61.5),
          lowerCentre: measured(5.9, -87.5, 66.9),
          linear: false,
        };
      case "lipStretcher":
        return { corner: [-0.1 * w, 0, 0.25 * w], upperMiddle: [-0.05 * w, 0, 0.12 * w], upperCentre: zero, lowerMiddle: [-0.05 * w, 0, 0.12 * w], lowerCentre: zero, linear: false };
      case "lipCornerDepressor":
        return { corner: [-0.05 * w, -0.2 * w, 0.05 * w], upperMiddle: [0, -0.06 * w, 0.02 * w], upperCentre: zero, lowerMiddle: [0, -0.08 * w, 0.02 * w], lowerCentre: [0, -0.02 * w, 0], linear: false };
      case "upperLipRaiser":
        return { corner: [0, 0.1 * hu, 0], upperMiddle: [0.1 * hu, 0.45 * hu, 0], upperCentre: [0.1 * hu, 0.6 * hu, 0], lowerMiddle: zero, lowerCentre: zero, linear: false };
      case "lowerLipDepressor":
        return { corner: [0, -0.05 * hl, 0], upperMiddle: zero, upperCentre: zero, lowerMiddle: [0.1 * hl, -0.55 * hl, 0.05 * w], lowerCentre: [0.12 * hl, -0.5 * hl, 0], linear: false };
      case "chinRaiser":
        return { corner: [0, 0.05 * hl, 0], upperMiddle: zero, upperCentre: zero, lowerMiddle: [0.1 * hl, 0.3 * hl, 0], lowerCentre: [0.15 * hl, 0.35 * hl, 0], linear: false };
      case "lipPucker":
        return { corner: [0.18 * w, 0, -0.3 * w], upperMiddle: [0.22 * w, 0, -0.12 * w], upperCentre: [0.25 * w, 0, 0], lowerMiddle: [0.22 * w, 0, -0.12 * w], lowerCentre: [0.25 * w, 0, 0], linear: false };
      case "lipFunneler":
        return { corner: [0.1 * w, 0, -0.15 * w], upperMiddle: [0.18 * w, 0.2 * hu, -0.06 * w], upperCentre: [0.2 * w, 0.25 * hu, 0], lowerMiddle: [0.18 * w, -0.25 * hl, -0.06 * w], lowerCentre: [0.2 * w, -0.3 * hl, 0], linear: false };
      case "lipTightener":
        return { corner: [0, 0, -0.04 * w], upperMiddle: [0, -0.25 * hu, 0], upperCentre: [0, -0.25 * hu, 0], lowerMiddle: [0, 0.25 * hl, 0], lowerCentre: [0, 0.25 * hl, 0], linear: true };
      case "lipPressor":
        return { corner: [-0.02 * w, 0, 0], upperMiddle: [-0.05 * hu, -0.35 * hu, 0], upperCentre: [-0.05 * hu, -0.35 * hu, 0], lowerMiddle: [-0.05 * hl, 0.35 * hl, 0], lowerCentre: [-0.05 * hl, 0.35 * hl, 0], linear: true };
      case "lipsPart":
        return { corner: zero, upperMiddle: [0, 0.2 * hu, 0], upperCentre: [0, 0.25 * hu, 0], lowerMiddle: [0, -0.28 * hl, 0], lowerCentre: [0, -0.35 * hl, 0], linear: false };
      case "lipSuck":
        return { corner: zero, upperMiddle: [-0.9 * hu, -0.3 * hu, 0], upperCentre: [-0.9 * hu, -0.3 * hu, 0], lowerMiddle: [-0.9 * hl, 0.3 * hl, 0], lowerCentre: [-0.9 * hl, 0.3 * hl, 0], linear: true };
      default:
        return { corner: zero, upperMiddle: zero, upperCentre: zero, lowerMiddle: zero, lowerCentre: zero, linear: false };
    }
  }

  /** Every channel's handles summed by intensity. */
  function combine(m: AutoMovieHumanMouth.IMouth, r: AutoMovieHumanMouthExpression.IResolved): IHandles {
    const zero = (): Vec3 => [0, 0, 0];
    const out: IHandles = {
      corner: { left: zero(), right: zero() },
      upper: [zero(), zero(), zero()],
      lower: [zero(), zero(), zero()],
      upperLinear: [zero(), zero(), zero()],
      lowerLinear: [zero(), zero(), zero()],
    };
    const mirror = (v: Vec3): Vec3 => [v[0], v[1], -v[2]];
    const plus = (a: Vec3, b: Vec3, s: number): void => {
      for (let k: number = 0; k < 3; k++) a[k] += s * b[k]!;
    };
    // A side acting alone moves its own handles and half the centre; both
    // sides together move the centre once.
    const apply = (name: string, left: number, right: number): void => {
      if (left === 0 && right === 0) return;
      const c: IChannel = channel(name, m.width, m.upper, m.lower);
      const upper = c.linear ? out.upperLinear : out.upper;
      const lower = c.linear ? out.lowerLinear : out.lower;
      plus(out.corner.left, c.corner, left);
      plus(out.corner.right, mirror(c.corner), right);
      plus(upper[2], c.upperMiddle, left);
      plus(upper[0], mirror(c.upperMiddle), right);
      plus(lower[2], c.lowerMiddle, left);
      plus(lower[0], mirror(c.lowerMiddle), right);
      plus(upper[1], c.upperCentre, (left + right) / 2);
      plus(lower[1], c.lowerCentre, (left + right) / 2);
    };
    for (const [name, left] of Object.entries(r.left)) apply(name, left, r.right[name as AutoMovieHumanMouthExpression.Paired]);
    for (const [name, value] of Object.entries(r.whole)) if (name !== "cheekPuff") apply(name, value, value);
    return out;
  }

  /** Displacement of a skin or lining point. */
  function lipsAt(m: AutoMovieHumanMouth.IMouth, h: IHandles, puff: number, p: Readonly<Vec3>): Vec3 {
    const u: number = p[2] / m.width;
    const au: number = Math.abs(u);
    const v: number = p[1] - AutoMovieHumanMouth.contactAt(m, p[2]);
    const upper: boolean = v >= 0;

    // Interior behind the vestibule's wall, and behind the molar section past
    // the canines, stands still.
    const gate: number = smooth((p[0] - (wall(m, p[2]) - FADE)) / FADE);
    if (gate === 0) return [0, 0, 0];

    // Height profiles: whole within the vermilion, fading over the lip's skin.
    const top: number = m.subnasale - m.stomion;
    const bottom: number = LABIOMENTAL * (m.stomion - m.menton);
    const band: number = upper
      ? 1 - smooth((v - m.upper) / (top - m.upper))
      : 1 - smooth((-v - m.lower) / (bottom - m.lower));
    const within: number = upper ? Math.min(1, v / m.upper) : Math.min(1, -v / m.lower);
    const lateral: number = au <= 1 ? 1 : Math.exp(-((((au - 1) * m.width) / (MODIOLUS * m.width)) ** 2));
    const s: number = Math.max(-1, Math.min(1, u));
    const along = (nodes: [Vec3, Vec3, Vec3]): Vec3 =>
      spline([h.corner.right, nodes[0], nodes[1], nodes[2], h.corner.left], s, au > 1);
    const plain: Vec3 = along(upper ? h.upper : h.lower);
    const linear: Vec3 = spline(
      [[0, 0, 0], ...(upper ? h.upperLinear : h.lowerLinear), [0, 0, 0]] as Vec3[],
      s,
      false,
    );
    const w: number = band * lateral * gate;
    const out: Vec3 = [0, 1, 2].map((k: number): number => w * (plain[k]! + within * linear[k]!)) as Vec3;

    // Cheek puff: the cheek over the buccinator swells outward, centred a
    // little more than half a mouth's width past each cheilion.
    if (puff > 0)
      for (const side of [1, -1]) {
        const dz: number = (p[2] - side * PUFF_PLACE * m.width) / (PUFF_RADIUS * m.width);
        const dy: number = (p[1] - m.stomion) / (PUFF_RADIUS * m.width);
        const g: number = Math.exp(-(dz * dz + dy * dy)) * gate;
        out[0] += puff * PUFF * m.width * 0.3 * g;
        out[2] += puff * PUFF * m.width * side * 0.95 * g;
      }
    return out;
  }

  /** Forward place behind which the interior stands still, at a lateral place. */
  function wall(m: AutoMovieHumanMouth.IMouth, z: number): number {
    const a: number = Math.abs(z);
    const front: number = m.vestibule.width;
    if (a <= front) return AutoMovieHumanMouth.sweepAt(m.vestibule, a / front) - Prior.MUCOSA;
    if (a >= m.molars.width) return -Infinity;
    const f: number = (a - front) / (m.molars.width - front);
    return (
      (AutoMovieHumanMouth.sweepAt(m.vestibule, 1) - Prior.MUCOSA) * (1 - f) +
      (m.molars.x - Prior.MUCOSA) * f
    );
  }

  /** Displacement of a tongue point. */
  function tongueAt(
    c: IContext,
    r: AutoMovieHumanMouthExpression.IResolved,
    turn: number,
    p: Readonly<Vec3>,
  ): Vec3 {
    const t: AutoMovieHumanMouth.ITongue = c.mouth.tongue;
    const T: AutoMovieHumanMouthExpression.IResolved["tongue"] = r.tongue;
    const l: number = Math.max(0, Math.min(1, (t.tip - p[0]) / (t.tip - t.back)));
    const s: AutoMovieHumanOralCavity.ITongueSection = AutoMovieHumanOralCavity.section(t, l);
    const q: number = Math.max(0, Math.min(1, (p[1] - s.bottom) / Math.max(1e-6, s.top - s.bottom)));
    const reach: number = (t.tip - t.molars) / (t.tip - t.back);
    const tipShare: number = 1 - smooth(l / TIP_REACH);
    const body: number = 1 - smooth(l / BODY_REACH);
    const dorsum: number = Math.exp(-(((l - reach) / DORSUM_REACH) ** 2)) * Math.sqrt(q);
    const back: (target: [number, number]) => [number, number] = (target) => unturn(c, turn, target);
    const out: Vec3 = [0, 0, 0];

    // Tip: up to the ridge, or down to the floor; forward past the incisors,
    // or back into the mouth; and aside.
    const e: number = T.tipElevation;
    if (e > 0) {
      const ridge: [number, number] = back(c.mouth.ridge);
      out[0] += e * (ridge[0] - t.tip) * tipShare;
      out[1] += e * (ridge[1] - t.tipTop) * tipShare;
    } else if (e < 0) out[1] += e * ((t.tipTop - t.floor) / 2) * tipShare;
    const pr: number = T.tipProtrusion;
    if (pr > 0) {
      const lips: [number, number] = back([c.mouth.front + Prior.MUCOSA, c.mouth.edge[1] + Prior.OVERBITE / 2]);
      out[0] += pr * (lips[0] - t.tip) * body;
      out[1] += pr * (lips[1] - (t.tipTop - TIP_HALF)) * tipShare;
    } else if (pr < 0) out[0] += pr * RETRACT * (t.tip - t.molars) * body;
    out[2] += T.tipLateral * LATERAL * t.width * tipShare;

    // Dorsum: up to the palate or down, and back toward the pharynx.
    const height: number = T.dorsumHeight;
    if (height > 0) {
      const palate: [number, number] = back(c.mouth.palate);
      out[1] += height * (palate[1] - Prior.MUCOSA - t.dorsum) * dorsum;
    } else if (height < 0) out[1] += height * ((t.dorsum - t.floor) / 3) * dorsum;
    out[0] -= T.dorsumBacking * BACKING * (t.molars - t.back) * dorsum;
    return out;
  }

  /** A head-fixed point in the jaw's bind frame for a jaw turned open by an angle. */
  function unturn(c: IContext, turn: number, target: [number, number]): [number, number] {
    // The jaw opens by turning its front down about the hinge's lateral axis;
    // the inverse turn brings the head's point to where the bound tongue sees it.
    const dx: number = target[0] - c.hinge[0];
    const dy: number = target[1] - c.hinge[1];
    const cos: number = Math.cos(turn);
    const sin: number = Math.sin(turn);
    return [c.hinge[0] + dx * cos - dy * sin, c.hinge[1] + dx * sin + dy * cos];
  }

  /** Uniform Catmull-Rom through five nodes at u = -1, -0.5, 0, 0.5, 1; a corner held past the ends. */
  function spline(nodes: readonly Vec3[], u: number, beyond: boolean): Vec3 {
    if (beyond || u >= 1) return [...(u >= 0 ? nodes[4]! : nodes[0]!)] as Vec3;
    if (u <= -1) return [...nodes[0]!] as Vec3;
    const x: number = (u + 1) * 2;
    const i: number = Math.min(3, Math.floor(x));
    const f: number = x - i;
    const p0: Vec3 = nodes[Math.max(0, i - 1)]!;
    const p1: Vec3 = nodes[i]!;
    const p2: Vec3 = nodes[i + 1]!;
    const p3: Vec3 = nodes[Math.min(4, i + 2)]!;
    return [0, 1, 2].map(
      (k: number): number =>
        0.5 *
        (2 * p1[k]! +
          (-p0[k]! + p2[k]!) * f +
          (2 * p0[k]! - 5 * p1[k]! + 4 * p2[k]! - p3[k]!) * f * f +
          (-p0[k]! + 3 * p1[k]! - 3 * p2[k]! + p3[k]!) * f * f * f),
    ) as Vec3;
  }

  function cross(a: Vec3, b: Vec3): Vec3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  function smooth(x: number): number {
    const t: number = Math.max(0, Math.min(1, x));
    return t * t * (3 - 2 * t);
  }

  /** Central difference step of the normals' derivative, mm. */
  const DIFFERENCE: number = 0.05;

  /** Depth over which the interior comes to rest behind the vestibule's wall, mm. */
  const FADE: number = 4;

  /** Reach of a cheilion's pull past it, in half widths: the modiolus's span, a convention. */
  const MODIOLUS: number = 0.6;

  /** The lower lip's influence reaches this share of the stomion's height over the menton: the labiomental fold, a convention. */
  const LABIOMENTAL: number = 0.6;

  /** Cheek puff: place and radius in half widths past the midline, and swelling in half widths (conventions). */
  const PUFF_PLACE: number = 1.6;
  const PUFF_RADIUS: number = 0.9;
  const PUFF: number = 0.25;

  /** Shares of the tongue's length its tip and body moves reach, and the dorsum's half width there (conventions). */
  const TIP_REACH: number = 0.45;
  const BODY_REACH: number = 0.75;
  const DORSUM_REACH: number = 0.3;

  /** Half the tip's thickness, mm, held between the teeth for th. */
  const TIP_HALF: number = 4;

  /** Retraction at -1, as a share of the tip's distance to the molars. */
  const RETRACT: number = 0.3;

  /** Lateral reach of the tip at 1, in the tongue's half widths. */
  const LATERAL: number = 0.6;

  /** Backing at 1, as a share of the molars' distance to the pharynx. */
  const BACKING: number = 0.4;
}
