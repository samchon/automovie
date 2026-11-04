import type { IAutoMovieHumanHandClear } from "./IAutoMovieHumanHandClear";
import type { IAutoMovieHumanHandDigit } from "./IAutoMovieHumanHandDigit";
import type { IAutoMovieHumanHandForm } from "./IAutoMovieHumanHandForm";
import type { IAutoMovieHumanHandStarField } from "./IAutoMovieHumanHandStarField";
import { AutoMovieHumanArmPrior } from "../AutoMovieHumanArmPrior";
import { AutoMovieHumanHandDigitLaw } from "./AutoMovieHumanHandDigitLaw";
import { AutoMovieHumanHandStar } from "./AutoMovieHumanHandStar";
import { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";
import { AutoMovieHumanHandWeb } from "./AutoMovieHumanHandWeb";

type Vec3 = AutoMovieHumanHandVector.Vec3;
const { sub, dot, norm, unit, smooth, softMax, TWO_PI }: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;
const { star, starPoint, wholeSkin, palmSkin, knuckle, palmPoint }: typeof AutoMovieHumanHandStar = AutoMovieHumanHandStar;
const { digit, lineTangent }: typeof AutoMovieHumanHandDigitLaw = AutoMovieHumanHandDigitLaw;
const { rootOf, crestOf, arcPoints, firstOf }: typeof AutoMovieHumanHandWeb = AutoMovieHumanHandWeb;

/**
 * The hand as one form in its own axes, shared by every person and mapped to
 * each by `AutoMovieHumanHandMap`: the heel and palm skin, the thenar joined
 * to the palm's last ring, the digits' laws and the webs that part them.
 */
export namespace AutoMovieHumanHandForm {
  /** Phase over which the heel's target hands from the palm's run to the thumb's. */
  const OWN_FADE: number = 0.6;

  /** Angles at which the arm's last ring holds its radius. */
  const RADII: number = 720;

  /** Phases averaged for the centre of the section at the wrist crease. */
  const CREASE_PHASES: number = 256;

  /** Station step of a parent's outward direction at its ring, mm of the form. */
  const OUTWARD_STEP: number = 0.05;

  /** Spacing of the palm's sections, mm of the form. */
  const PALM_STEP: number = 4;

  let built: IAutoMovieHumanHandForm | null = null;

  /** The hand's form, made once: no person enters it. */
  export function form(): IAutoMovieHumanHandForm {
    built ??= make();
    return built;
  }

  /**
   * Phase on the hand's star of the arm's phase zero. The tube's phase runs from
   * across the hand toward its back, the star's the other way.
   */
  export function omega(): number {
    const prior: AutoMovieHumanArmPrior.IPrior = AutoMovieHumanArmPrior.PRIOR;
    const t: Vec3 = unit([
      prior.arm.lower[0]!,
      prior.arm.lower[1]!,
      prior.arm.lower[2]!,
    ]);
    const seed: Vec3 = [1, 0, 0];
    const k: number = dot(seed, t);
    const f: Vec3 = unit([seed[0] - k * t[0], seed[1] - k * t[1], seed[2] - k * t[2]]);
    return (
      Math.atan2(
        dot(f, [...prior.hand.through]),
        dot(f, [...prior.hand.across]),
      ) - prior.arm.phase
    );
  }

  /** The hand. */
  function make(): IAutoMovieHumanHandForm {
    const prior: AutoMovieHumanArmPrior.IHandPrior =
      AutoMovieHumanArmPrior.PRIOR.hand;
    const whole: IAutoMovieHumanHandStarField = star(prior.whole);
    const palm: IAutoMovieHumanHandStarField = star(prior.palm);
    const bowl: number = omega();
    const wrap = (t: number): number => ((t % TWO_PI) + TWO_PI) % TWO_PI;

    // The arm's last ring: the palm's star and the thenar's ellipse, which cross
    // at the branch's two ends. Each keeps its own skin outside the other.
    const thenar: AutoMovieHumanArmPrior.IThenar = prior.thenar;
    const inside = (b: number, c: number): number =>
      ((b - thenar.b) / thenar.width) ** 2 + ((c - thenar.c) / thenar.depth) ** 2 - 1;
    const ends: number[] = [];
    for (let i: number = 0; i < 2880; i++) {
      const from: number = (TWO_PI * i) / 2880;
      const to: number = (TWO_PI * (i + 1)) / 2880;
      const p: [number, number] = starPoint(palm, prior.branch, from);
      const q: [number, number] = starPoint(palm, prior.branch, to);
      const u: number = inside(p[0], p[1]);
      const v: number = inside(q[0], q[1]);
      if (u * v <= 0) ends.push(from + (to - from) * (u / (u - v)));
    }
    if (ends.length !== 2)
      throw new Error("The thenar must cross the palm's ring twice");

    // Phase runs against the star's angle; the ring's arc inside the thenar is
    // the one between the crossings whose middle lies in the ellipse.
    const between: number = (ends[0]! + ends[1]!) / 2;
    const mid: [number, number] = starPoint(palm, prior.branch, between);
    const [enter, leave]: [number, number] =
      inside(mid[0], mid[1]) < 0
        ? [ends[1]!, ends[0]!]
        : [ends[0]! + TWO_PI, ends[1]!];
    // The chord between the crossings lies inside both curves, so near the
    // crossings each is one radius at an angle from its middle, and their soft
    // maximum gives the union one tangent. Each point takes that maximum along its
    // own ray: seen from here the long flat palm is not one radius, and far from
    // the thumb the ellipse is nowhere near it, so its skin stays as it is.
    const first_: [number, number] = starPoint(palm, prior.branch, enter);
    const last_: [number, number] = starPoint(palm, prior.branch, leave);
    const seat: [number, number] = [
      (first_[0] + last_[0]) / 2,
      (first_[1] + last_[1]) / 2,
    ];
    const outline_: [number, number][] = Array.from(
      { length: 720 },
      (_: unknown, i: number): [number, number] =>
        starPoint(palm, prior.branch, (TWO_PI * i) / 720),
    );
    const palmRadius = (phi: number): number => {
      const dx: number = Math.cos(phi);
      const dy: number = Math.sin(phi);
      let most: number = 0;
      outline_.forEach((p: [number, number], i: number): void => {
        const q: [number, number] = outline_[(i + 1) % outline_.length]!;
        const ex: number = q[0] - p[0];
        const ey: number = q[1] - p[1];
        const denominator: number = dx * ey - dy * ex;
        if (Math.abs(denominator) < 1e-12) return;
        const r: number =
          ((p[0] - seat[0]) * ey - (p[1] - seat[1]) * ex) / denominator;
        const u: number =
          ((p[0] - seat[0]) * dy - (p[1] - seat[1]) * dx) / denominator;
        if (r > 0 && u >= 0 && u <= 1) most = Math.max(most, r);
      });
      return most;
    };
    const thenarRadius = (phi: number): number => {
      const x: number = (seat[0] - thenar.b) / thenar.width;
      const y: number = (seat[1] - thenar.c) / thenar.depth;
      const dx: number = Math.cos(phi) / thenar.width;
      const dy: number = Math.sin(phi) / thenar.depth;
      const a: number = dx * dx + dy * dy;
      const b: number = x * dx + y * dy;
      const c: number = x * x + y * y - 1;
      return (-b + Math.sqrt(Math.max(0, b * b - a * c))) / a;
    };
    const ringRadii: number[] = Array.from(
      { length: RADII },
      (_: unknown, i: number): number => {
        const phi: number = (TWO_PI * i) / RADII;
        return softMax(palmRadius(phi), thenarRadius(phi), thenar.soft);
      },
    );
    const ringAt = (phi: number): Vec3 => {
      const x: number = (wrap(phi) / TWO_PI) * RADII;
      const i: number = Math.floor(x) % RADII;
      const f: number = x - Math.floor(x);
      const r: number =
        ringRadii[i]! + f * (ringRadii[(i + 1) % RADII]! - ringRadii[i]!);
      return [
        prior.branch,
        seat[0] + r * Math.cos(phi),
        seat[1] + r * Math.sin(phi),
      ];
    };

    // Phase runs against the angle, so the thumb's arc sweeps from where the ring
    // enters the thenar to where it leaves, the long way out past the thumb.
    const angleOf = (p: [number, number]): number =>
      Math.atan2(p[1] - seat[1], p[0] - seat[0]);
    const fromAngle: number = angleOf(first_);
    const toAngle: number = angleOf(last_);
    const direct: number = wrap(toAngle - fromAngle);
    const middleOf = (turned: number): number =>
      thenarRadius(fromAngle + turned / 2) - palmRadius(fromAngle + turned / 2);
    const turn: number =
      middleOf(direct) > middleOf(direct - TWO_PI) ? direct : direct - TWO_PI;
    const palmArc: number = enter - leave;
    const lengthOf = (read: (f: number) => Vec3): number => {
      let sum: number = 0;
      let last: Vec3 = read(0);
      for (let i: number = 1; i <= 256; i++) {
        const p: Vec3 = read(i / 256);
        sum += norm(sub(p, last));
        last = p;
      }
      return sum;
    };
    const palmAt = (f: number): Vec3 => {
      const q: Vec3 = palmSkin(
        palm,
        prior.branch,
        leave - f * (TWO_PI - palmArc),
      );
      const phi: number = Math.atan2(q[2] - seat[1], q[1] - seat[0]);
      const r: number = softMax(
        Math.hypot(q[1] - seat[0], q[2] - seat[1]),
        thenarRadius(phi),
        thenar.soft,
      );
      return [
        prior.branch,
        seat[0] + r * Math.cos(phi),
        seat[1] + r * Math.sin(phi),
      ];
    };
    const thenarLength: number = lengthOf(
      (f: number): Vec3 => ringAt(fromAngle + f * turn),
    );
    const palmLength: number = lengthOf(palmAt);
    const inner: number =
      (TWO_PI * thenarLength) / (thenarLength + palmLength);
    const middlePhase: number = bowl - (enter + leave) / 2;
    const palmar: number = wrap(middlePhase - inner / 2);
    const dorsal: number = wrap(middlePhase + inner / 2);
    const bridge: [number, number] = [
      last_[0] - first_[0],
      last_[1] - first_[1],
    ];
    const bridgeLength: number = Math.hypot(bridge[0], bridge[1]);
    const lineAlong: [number, number] = [
      bridge[0] / bridgeLength,
      bridge[1] / bridgeLength,
    ];
    const armRing = (t: number): Vec3 => {
      const along: number = wrap(t - palmar);
      const p: Vec3 =
        along >= inner
          ? palmAt((along - inner) / (TWO_PI - inner))
          : ringAt(fromAngle + (turn * along) / inner);
      const db: number = p[1] - seat[0];
      const dc: number = p[2] - seat[1];
      const y: number = db * lineAlong[0] + dc * lineAlong[1];
      const x: number = db * lineAlong[1] - dc * lineAlong[0];
      const g: number =
        thenar.valley *
        Math.exp(
          -0.5 * (x / thenar.valleyWidth) ** 2 -
            0.5 * (y / thenar.valleySpan) ** 2,
        );
      return [
        p[0],
        seat[0] + x * lineAlong[1] + y * (1 - g) * lineAlong[0],
        seat[1] - x * lineAlong[0] + y * (1 - g) * lineAlong[1],
      ];
    };

    // Web phases on the palm's last ring: its back runs with phase from the
    // thumb's side, its front back again.
    const toward: number = knuckle(0) - prior.branch;
    const fingerRing = (t: number): Vec3 => palmPoint(palm, 1, -t);
    const column = (b: number, from: number, to: number): number => {
      let lo: number = from;
      let hi: number = to;
      const rising: boolean = fingerRing(to)[1] > fingerRing(from)[1];
      for (let i: number = 0; i < 40; i++) {
        const mid: number = (lo + hi) / 2;
        if (fingerRing(mid)[1] < b === rising) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    };
    const back: number[] = prior.webs.map(
      (w: AutoMovieHumanArmPrior.IWeb): number => column(w.b, 0, Math.PI),
    );
    const front: number[] = prior.webs.map(
      (w: AutoMovieHumanArmPrior.IWeb): number =>
        column(w.b, Math.PI, TWO_PI),
    );
    const arcs: [number, number][][] = [
      [[palmar, dorsal]],
      [[front[0]!, back[0]!]],
      [
        [back[0]!, back[1]!],
        [front[1]!, front[0]!],
      ],
      [
        [back[1]!, back[2]!],
        [front[2]!, front[1]!],
      ],
      [[back[2]!, front[2]!]],
    ];
    const digits: IAutoMovieHumanHandDigit[] = prior.digits.map(
      (d: AutoMovieHumanArmPrior.IDigit, i: number): IAutoMovieHumanHandDigit =>
        i === 0
          ? digit(d, rootOf(d.order, arcs[0]!, armRing), {
              centre: [prior.branch, thenar.b, thenar.c],
              width: thenar.width,
              depth: thenar.depth,
            })
          : digit(d, rootOf(d.order, arcs[i]!, fingerRing)),
    );
    const opening = (a: number, t: number): Vec3 => {
      const along: number = wrap(t - palmar);
      const own: number =
        along < inner
          ? smooth(along / OWN_FADE) * smooth((inner - along) / OWN_FADE)
          : 0;
      const line: Vec3 = lineTangent(digits[0]!, 0.1);
      const here: Vec3 = palmSkin(palm, a, bowl - t);
      const there: Vec3 = palmSkin(palm, prior.branch, bowl - t);
      const run: number = a - prior.branch;
      const ring: Vec3 = armRing(t);
      return [
        a,
        ring[1] +
          (1 - own) * (here[1] - there[1]) +
          (own * run * line[1]) / line[0],
        ring[2] +
          (1 - own) * (here[2] - there[2]) +
          (own * run * line[2]) / line[0],
      ];
    };

    // Every child's first own section stands past its arcs of its parent's ring
    // and its webs' crests, each read with the parent's own surface there, so
    // every column of the webs descends from the ring to the child.
    const armOutward = (t: number): Vec3 =>
      unit(sub(opening(prior.branch, t), opening(prior.branch - OUTWARD_STEP, t)));
    const palmOutward = (t: number): Vec3 =>
      unit(sub(fingerRing(t), palmPoint(palm, 1 - OUTWARD_STEP / toward, -t)));
    const thumbCrest: IAutoMovieHumanHandClear = crestOf(armRing, armOutward, palmar, dorsal);
    const crests: IAutoMovieHumanHandClear[] = prior.webs.map(
      (_: AutoMovieHumanArmPrior.IWeb, i: number): IAutoMovieHumanHandClear =>
        crestOf(fingerRing, palmOutward, back[i]!, front[i]!),
    );
    const webs: IAutoMovieHumanHandClear[][] = [[thumbCrest], [crests[0]!], [crests[0]!, crests[1]!], [crests[1]!, crests[2]!], [crests[2]!]];
    digits.forEach((d: IAutoMovieHumanHandDigit, i: number): void => {
      d.clear = [...arcPoints(i === 0 ? armRing : fingerRing, arcs[i]!), ...webs[i]!];
      d.first = firstOf(d, d.clear);
    });

    // The palm from past the thumb's web to the finger roots, each section the
    // palm's own skin: every point to clear has the section's nearest point past
    // it along the hand.
    const section: AutoMovieHumanArmPrior.ISection = prior.palmSection;
    const order: number = section.order;
    const ringOf = (d: number): Vec3[] =>
      Array.from({ length: order }, (_: unknown, m: number): Vec3 =>
        palmPoint(palm, d / toward, (-TWO_PI * m) / order),
      );
    const palmClear: IAutoMovieHumanHandClear[] = [...arcPoints(armRing, [[dorsal, palmar]]), thumbCrest];
    let start: number = 0;
    for (; start < toward - PALM_STEP; start += 0.25) {
      const ring: Vec3[] = ringOf(start);
      const clear: boolean = palmClear.every((x: IAutoMovieHumanHandClear): boolean => {
        let near: Vec3 = ring[0]!;
        let best: number = Infinity;
        for (const p of ring) {
          const e: number = Math.hypot(p[1] - x.point[1], p[2] - x.point[2]);
          if (e < best) {
            best = e;
            near = p;
          }
        }
        return near[0] - x.point[0] >= x.margin;
      });
      if (clear) break;
    }
    const distances: number[] = [start];
    for (let d: number = start + PALM_STEP; d < toward - 2; d += PALM_STEP) distances.push(d);
    distances.push(toward - 1.2, toward);
    const palmRings: Vec3[][] = [...distances].reverse().map(ringOf);
    const creaseRing: Vec3[] = Array.from({ length: CREASE_PHASES }, (_: unknown, i: number): Vec3 =>
      wholeSkin(whole, prior.crease, (TWO_PI * i) / CREASE_PHASES),
    );
    return {
      whole,
      palm,
      opening,
      palmRings,
      digits,
      crests: crests.map((c: IAutoMovieHumanHandClear): Vec3 => c.point),
      creaseCentre: [0, 1, 2].map(
        (k: number): number => creaseRing.reduce((s: number, p: Vec3): number => s + p[k]!, 0) / creaseRing.length,
      ) as Vec3,
      events: [
        {
          parent: "hand.{side}.1",
          splits: prior.digits.slice(1).map(
            (d: AutoMovieHumanArmPrior.IDigit, i: number): IAutoMovieHumanHandForm.ISplit => ({
              child: d.name,
              arcs: arcs[i + 1]!,
            }),
          ),
        },
        {
          parent: "arm.{side}",
          splits: [
            { child: prior.digits[0]!.name, arcs: [[palmar, dorsal]] },
            { child: "hand.{side}.1", arcs: [[dorsal, palmar]] },
          ],
        },
      ],
    };
  }
}
