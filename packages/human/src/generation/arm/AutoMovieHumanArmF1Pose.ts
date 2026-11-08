import { type AutoMovieViewAxis, AutoMovieViewParameter } from "@automovie/engine";
import type { AutoMovieConstructionOutlineParameter } from "@automovie/interface";

import type { AutoMovieHumanTrunkPorts } from "../trunk/AutoMovieHumanTrunkPorts";
import { AutoMovieHumanArmCurveSpec } from "./AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanArmF1Lines } from "./AutoMovieHumanArmF1Lines";
import { AutoMovieHumanArmJet } from "./AutoMovieHumanArmJet";
import { AutoMovieHumanArmLandmarks } from "./AutoMovieHumanArmLandmarks";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;
type J = AutoMovieHumanArmJet.J;
type V = AutoMovieHumanArmJet.V;

/**
 * f1's arm in her own pose (the owner's step 1: every line matched in the
 * reference's pose in absolute world coordinates), with its root on the
 * trunk's armscye port.
 *
 * 1. Her frame curve. The F1 lines (`AutoMovieHumanArmF1Lines`) were re-based
 *    on one frame curve through her bones (`node:arm-world`, receipt
 *    `.shots/f1_arm/world-2026-11-08T07-05-18-763Z/report.json`): GH, her
 *    elbow centre EC (the epicondyle midpoint by caliper), the wrist zero 1.5
 *    mm past stylion along her forearm, her hand axis, the upper arm's lateral
 *    the epicondyle line, the forearm's roll turning linearly to the styloid
 *    line (her pronation, 92.5 degrees), the joints blended by smoothstep over
 *    +-36 mm (elbow) and +-24 mm (wrist). `place` below is that curve,
 *    verbatim, on the receipt's world landmarks (calibration mm, her left
 *    arm; the right arm is its mirror in the sagittal plane z = 0, the
 *    trunk's ports being mirror images, centres at phase +-pi/2). Each F1
 *    station's four values laid along `place(s)` return her extracted world
 *    point (the receipt's equivalence 2.7e-13 mm), so lofting on this curve
 *    puts every knot on her mesh; no contact solve or neutral hang is
 *    involved (the hang swung her 31-degree-abducted humerus into S00 by 69
 *    mm, past the solver's +-28.6-degree bracket).
 * 2. The root on the port. The trunk owns the armscye loop
 *    (`AutoMovieHumanTrunkPorts`: an ellipse on S00's chart, its world loop
 *    near vertical on the trunk's side, its Newell normal pointing out of the
 *    trunk), read live from S00 at build time. The arm's rail station (the
 *    axilla level, where the port band reaches the arm) takes the port's own
 *    plane: origin the loop's centroid, section normal the port normal, and
 *    its section is the port loop itself, read in that plane as four outline
 *    values and four conic quarter shoulders exactly as her sections were read
 *    (`node:arm-world`'s `read`), the guides on the loop's principal axes. The
 *    construction skill's port rule: the child's lines start from the
 *    parent's loop values in its own frame. Proximal of the rail the axis
 *    runs straight back along the normal into the trunk (the dome the port
 *    cuts away); distal of it the axis leaves along the port normal.
 * 3. The turn from the port plane into her humerus. The axis is a quintic
 *    Hermite curve from the port centroid, tangent to the port normal, to her
 *    humerus line at the join station, tangent to her humerus axis, with zero
 *    second derivatives at both ends (curvature zero there, so the frames stop
 *    turning where the straight runs begin and the skin carries no crease).
 *    Its end tangents have the turn's course length, so the axis moves one mm
 *    per mm of station at both ends. The sections are its normal planes; the
 *    lateral is her lateral at the join carried by the minimal rotation from
 *    her humerus axis onto the curve's tangent (analytic, no twist about the
 *    tangent at either end), and the rail's principal-axis roll returns to it
 *    by smoothstep. Normal planes do not cross while curvature times the
 *    section's reach stays at or below 0.8 (the regularity bound `k r <= 0.8`
 *    the arm's jointed loft uses, `AutoMovieHumanArmViewLoft`); the join is
 *    her first humerus station that admits it, and her stations between the
 *    rail and the join are left to the loft's minimum-energy outlines (her
 *    humerus line is replaced by the turn there).
 * 4. The palm pole: past the wrist the course moves volar in each section's
 *    own plane by the neutral palm's pole tilt (`volar`), so the palm pole
 *    stands under the palm pad and digit III's root does not sit on it; the
 *    station values are compensated by the same offset, so the skin stays on
 *    her lines.
 * 5. The axis jet. The whole law is written once on second-order jets
 *    (`AutoMovieHumanArmJet`), so the loft axis carries the analytic first and
 *    second station derivatives of its own origin and chart everywhere
 *    (dome, turn, joint blends, graded roll, hand), the caps' and bands'
 *    physical2 owner, carried into a selected root or angle coordinate by
 *    `AutoMovieViewParameter.inverseJet`.
 *
 * Follow-up: the turn region (rail to join) is drawn, not extracted; her
 * sections there cut through the axillary fold and are read again once the
 * turn is accepted in the same-camera pairs.
 */
export namespace AutoMovieHumanArmF1Pose {
  /** Her world landmarks of one arm, calibration mm. */
  export interface ILandmarks {
    /** GH: the trunk's shoulder port origin when her lines were extracted. */ gh: Vec3;
    /** Lateral epicondyle, by caliper on her skin. */ EL: Vec3;
    /** Medial epicondyle, by caliper on her skin. */ EM: Vec3;
    /** Radial styloid. */ RS: Vec3;
    /** Ulnar styloid. */ US: Vec3;
    /** Elbow centre, the epicondyle midpoint. */ EC: Vec3;
    /** Wrist zero, 1.5 mm past stylion along her forearm (de Leva 1996). */ wristZero: Vec3;
    /** Her hand axis, unit: wrist zero to her palm section's centroid at mid palm. */ handAxis: Vec3;
  }

  /** Her left-arm world landmarks, calibration mm (the receipt's `landmarks`). */
  export const LEFT: ILandmarks = {
    gh: [-36.25554997747743, 1362.610447189863, -164],
    EL: [25.006520748138428, 1151.7786407470703, -333.731689453125],
    EM: [-27.023437023162842, 1122.9566955566406, -268.96963119506836],
    RS: [111.94169998168945, 996.0205841064453, -436.2466049194336],
    US: [164.94329452514648, 998.0744934082031, -407.0964813232422],
    EC: [-1.008458137512207, 1137.3676681518555, -301.3506603240967],
    wristZero: [134.6697945733444, 1000.8437560492815, -418.41638494959625],
    handAxis: [0.6975379040996559, -0.6332272387288116, -0.33535673017869183],
  };

  /** Elbow blend half-width, mm (`node:arm-world`: her elbow section's mean radius). */
  export const ELBOW_BEND: number = 36;

  /** Wrist blend half-width, mm (`node:arm-world`: her wrist section's mean radius). */
  export const WRIST_BEND: number = 24;

  /** Regularity bound of curvature times a section's reach (`AutoMovieHumanArmViewLoft`'s `k r <= 0.8`). */
  export const REGULAR: number = 0.8;

  /** A frame of the curve. */
  export interface IPlace {
    /** Axis point. */ centre: Vec3;
    /** Unit distal axis, the section normal. */ distal: Vec3;
    /** Unit lateral direction. */ lateral: Vec3;
    /** Unit anterior direction. */ anterior: Vec3;
  }

  /** The rail's section read off the port loop. */
  export interface IRail {
    /** Outline values lateral, medial, anterior, posterior from the loop's centroid, mm. */
    extents: [number, number, number, number];

    /** Quarter shoulders, held inside [0.02, 0.98] as the F1 lines hold theirs. */
    shoulders: AutoMovieHumanArmF1Lines.IShoulders;
  }

  /** Her posed arm on the port. */
  export interface IOutput {
    /** Side. */
    side: "left" | "right";

    /** The frame at `s` mm from GH along her curve (negative s is proximal of GH; the root's turn and the port included). */
    place(s: number): IPlace;

    /** The course distance from GH of a point `s` mm from GH on her curve: `s` to the rail, stretched over the turn to its course length, shifted past it. */
    along(s: number): number;

    /** The loft axis: station `t` is course distance `t - offset` from GH, read at the `s` whose `along` it is; chart u lateral, v = u x distal (`AutoMovieHumanArmViewLoft`'s chart), with its analytic jet. */
    axis(offset: number): AutoMovieViewAxis.IAxis;

    /** The rail's distance from GH along the curve, mm (the axilla level's). */
    rail: number;

    /** Her humerus station where the turn ends, mm from GH. */
    join: number;

    /** The rail section read off the port loop. */
    section: IRail;

    /** Her hand's placement for the neutral frames (`AutoMovieHumanHandDigits`' root): the neutral humerus frame mapped so its hand lands on hers. */
    hand: AutoMovieHumanArmCurveSpec.ITransform;

    /** The port loop's world points, calibration mm (128). */
    loop: Vec3[];

    /** How the root was placed. */
    basis: string;
  }

  /**
   * Build her posed arm on the trunk's port.
   *
   * @param input.side Which arm.
   * @param input.port The trunk's shoulder port of that side (S00 world, the measures' mm).
   * @param input.scale Calibration mm per trunk mm (the port's world is multiplied by it).
   * @param input.rail The axilla level's distance from GH on the neutral walk, mm (the rail station).
   */
  export function create(input: { side: "left" | "right"; port: AutoMovieHumanTrunkPorts.IPort; scale: number; rail: number }): IOutput {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const X: typeof AutoMovieHumanArmJet = AutoMovieHumanArmJet;
    const m: 1 | -1 = input.side === "left" ? 1 : -1;
    const mirror = (p: Vec3): Vec3 => (m > 0 ? [p[0], p[1], p[2]] : [p[0], p[1], -p[2]]);
    const gh: Vec3 = mirror(LEFT.gh);
    const EL: Vec3 = mirror(LEFT.EL);
    const EM: Vec3 = mirror(LEFT.EM);
    const RS: Vec3 = mirror(LEFT.RS);
    const US: Vec3 = mirror(LEFT.US);
    const EC: Vec3 = mirror(LEFT.EC);
    const wristZero: Vec3 = mirror(LEFT.wristZero);
    const handAxis: Vec3 = S.unit(mirror(LEFT.handAxis));

    // Her frame curve's constants (`node:arm-world`'s `place`, verbatim).
    const across = (v: Vec3, axis: Vec3): Vec3 => S.unit(sub(v, scale(axis, S.dot(v, axis))));
    const upperAxis: Vec3 = S.unit(sub(EC, gh));
    const foreAxis: Vec3 = S.unit(sub(wristZero, EC));
    const H: number = Math.hypot(...sub(EC, gh));
    const W: number = Math.hypot(...sub(wristZero, EC));
    const upperLateral: Vec3 = across(sub(EL, EM), upperAxis);
    const elbowLine: Vec3 = across(sub(EL, EM), foreAxis);
    const styloidLine: Vec3 = across(sub(RS, US), foreAxis);
    const twist: number = Math.atan2(S.dot(S.cross(styloidLine, elbowLine), foreAxis), S.dot(styloidLine, elbowLine));
    const handLateral: Vec3 = across(styloidLine, handAxis);
    const tilt: number = Math.sin(AutoMovieHumanArmLandmarks.PALM_POLE_TILT);

    // Jet helpers: `v` minus its part along unit `a`, normalised; the anterior is distal x lateral on the left (the mirror flips the handedness).
    const acrossJ = (v: V, a: V): V => X.unit(X.vsub(v, X.vmul(a, X.dot(v, a))));
    const anteriorJ = (distal: V, lateral: V): V => X.vscale(X.unit(X.cross(distal, lateral)), m);
    const rodriguesJ = (v: Vec3, k: Vec3, angle: J): V => {
      const cos: J = X.cos(angle);
      return X.vadd(X.vadd(X.cmul(v, cos), X.cmul(S.cross(k, v), X.sin(angle))), X.cmul(k, X.scale(X.sub(X.c(1), cos), S.dot(k, v))));
    };
    const volarJ = (x: J): J => {
      const b: number = WRIST_BEND;
      const t: number = x[0];
      const ramp: J = t <= -b ? X.c(0) : t >= b ? x : X.apply(x, ((t + b) * (t + b)) / (4 * b), (t + b) / (2 * b), 1 / (2 * b));
      return X.scale(ramp, tilt);
    };
    interface IPlaceJ {
      centre: V;
      distal: V;
      lateral: V;
    }
    // Her frame curve on jets.
    const her = (s: J): IPlaceJ => {
      const w1: J = X.smooth(X.scale(X.sub(s, X.c(H - ELBOW_BEND)), 1 / (2 * ELBOW_BEND)));
      const w2: J = X.smooth(X.scale(X.sub(s, X.c(H + W - WRIST_BEND)), 1 / (2 * WRIST_BEND)));
      const mix = (a: V, b: V, c: V): V => X.vadd(X.vmul(a, X.sub(X.c(1), w1)), X.vmul(X.vadd(X.vmul(b, X.sub(X.c(1), w2)), X.vmul(c, w2)), w1));
      const axisPoint: V = mix(
        X.vadd(X.vc(gh), X.cmul(upperAxis, s)),
        X.vadd(X.vc(EC), X.cmul(foreAxis, X.sub(s, X.c(H)))),
        X.vadd(X.vc(wristZero), X.cmul(handAxis, X.sub(s, X.c(H + W)))),
      );
      const distal: V = X.unit(mix(X.vc(upperAxis), X.vc(foreAxis), X.vc(handAxis)));
      const roll: V = rodriguesJ(styloidLine, foreAxis, X.scale(X.sub(X.c(1), X.clamp(X.scale(X.sub(s, X.c(H)), 1 / W))), twist));
      const lateral: V = acrossJ(mix(X.vc(upperLateral), roll, X.vc(handLateral)), distal);
      // The course moves volar in its own plane past the wrist (`volar`): the palm pole stands under the palm pad, off digit III's root.
      return { centre: X.vadd(axisPoint, X.vmul(anteriorJ(distal, lateral), volarJ(X.sub(s, X.c(H + W))))), distal, lateral };
    };

    // The port: loop in calibration mm, centroid, outward normal.
    const loop: Vec3[] = Array.from({ length: 128 }, (_: unknown, k: number): Vec3 => scale(input.port.curve((2 * Math.PI * k) / 128), input.scale));
    const O: Vec3 = scale(input.port.frame.origin, input.scale);
    const n: Vec3 = S.unit(input.port.frame.axes[0]);
    const reach: number = Math.max(...loop.map((p: Vec3): number => Math.hypot(...sub(sub(p, O), scale(n, S.dot(sub(p, O), n))))));

    // The turn's quintic Hermite axis to her humerus at `join`, end tangents of length `span` (its course length), and its
    // centre, tangent and second derivative in the turn parameter tau.
    interface ITurn {
      join: number;
      span: number;
      worst: number;
      d1: Vec3;
      lateral1: Vec3;
      curve: (tau: J) => { p: V; d: V };
    }
    const quintic = (end: Vec3, d1: Vec3, span: number): ((tau: J) => { p: V; d: V }) => {
      const T0: Vec3 = scale(n, span);
      const T1: Vec3 = scale(d1, span);
      // Basis with zero end second derivatives: H0 = 1 - 10t^3 + 15t^4 - 6t^5, H1 = t - 6t^3 + 8t^4 - 3t^5 (start tangent),
      // H4 = -4t^3 + 7t^4 - 3t^5 (end tangent), H5 = 10t^3 - 15t^4 + 6t^5; their derivatives for the tangent.
      return (tau: J): { p: V; d: V } => {
        const t2: J = X.mul(tau, tau);
        const t3: J = X.mul(t2, tau);
        const t4: J = X.mul(t3, tau);
        const t5: J = X.mul(t4, tau);
        const poly = (k: [number, number, number, number, number, number]): J =>
          X.add(X.add(X.add(X.c(k[0]), X.scale(tau, k[1])), X.add(X.scale(t2, k[2]), X.scale(t3, k[3]))), X.add(X.scale(t4, k[4]), X.scale(t5, k[5])));
        const combine = (h0: J, h1: J, h4: J, h5: J): V => X.vadd(X.vadd(X.cmul(O, h0), X.cmul(T0, h1)), X.vadd(X.cmul(T1, h4), X.cmul(end, h5)));
        return {
          p: combine(poly([1, 0, 0, -10, 15, -6]), poly([0, 1, 0, -6, 8, -3]), poly([0, 0, 0, -4, 7, -3]), poly([0, 0, 0, 10, -15, 6])),
          d: combine(poly([0, 0, -30, 60, -30, 0]), poly([1, 0, -18, 32, -15, 0]), poly([0, 0, -12, 28, -15, 0]), poly([0, 0, 30, -60, 30, 0])),
        };
      };
    };
    const SAMPLES: number = 256;
    const turnTo = (join: number, extents: readonly number[]): ITurn => {
      const q: IPlaceJ = her(X.c(join));
      const end: Vec3 = X.value(q.centre);
      const d1: Vec3 = X.value(q.distal);
      // The course length: the curve's own arclength with end tangents of that length (fixed point from the chord).
      let span: number = Math.hypot(...sub(end, O));
      for (let iteration: number = 0; iteration < 8; ++iteration) {
        const curve: (tau: J) => { p: V; d: V } = quintic(end, d1, span);
        let length: number = 0;
        for (let i: number = 0; i < SAMPLES; ++i) length += Math.hypot(...X.value(curve(X.c((i + 0.5) / SAMPLES)).d)) / SAMPLES;
        span = length;
      }
      const curve: (tau: J) => { p: V; d: V } = quintic(end, d1, span);
      const reachOf: number = Math.max(reach, ...extents);
      let worst: number = 0;
      for (let i: number = 0; i <= SAMPLES; ++i) {
        const d: V = curve(X.seed(i / SAMPLES)).d;
        const v1: Vec3 = X.value(d);
        const v2: Vec3 = X.first(d);
        worst = Math.max(worst, (Math.hypot(...S.cross(v1, v2)) / Math.hypot(...v1) ** 3) * reachOf);
      }
      return { join, span, worst, d1, lateral1: X.value(q.lateral), curve };
    };
    const candidates: ITurn[] = AutoMovieHumanArmF1Lines.HUMERUS.flatMap((station: AutoMovieHumanArmF1Lines.IStation): ITurn[] =>
      typeof station.along === "number" && station.along > input.rail && station.along <= H - ELBOW_BEND ? [turnTo(station.along, station.extents)] : [],
    );
    if (candidates.length === 0) throw new Error(`arm ${input.side}: no humerus station of f1 stands between the rail and the elbow blend`);
    // The join is her first humerus station the turn admits (k r <= 0.8, else the least: 218.8 at 0.95); her rows before it stand in the turn as her cuts (`AutoMovieHumanArmViewCurves`), not replaced (main, 2026-11-08 19:43: joining at 78.8, k r 2.05, folded the turn and the body dropped the arms).
    const chosen: ITurn = candidates.find((t: ITurn): boolean => t.worst <= REGULAR) ?? candidates.reduce((a: ITurn, b: ITurn): ITurn => (b.worst < a.worst ? b : a));
    const gap: number = chosen.join - input.rail;
    const course: number = chosen.span;
    // Course distance from GH (`along`): her own to the rail, the turn's course length over the turn, shifted past it.
    const stretch: number = course / gap;
    const extra: number = course - gap;
    const along = (s: number): number => (s <= input.rail ? s : s < chosen.join ? input.rail + (s - input.rail) * stretch : s + extra);
    const back = (c: number): number => (c <= input.rail ? c : c < input.rail + course ? input.rail + (c - input.rail) / stretch : c - extra);
    const slope = (c: number): number => (c <= input.rail || c >= input.rail + course ? 1 : 1 / stretch);

    // The minimal rotation taking her humerus axis d1 onto a unit tangent b, applied to her lateral at the join:
    // R v = v (a.b) + (a x b) x v + (a x b) ((a x b).v) / (1 + a.b), a = d1.
    const carry = (b: V): V => {
      const a: V = X.vc(chosen.d1);
      const v: V = X.vc(chosen.lateral1);
      const c: J = X.dot(a, b);
      const k: V = X.cross(a, b);
      return X.vadd(X.vadd(X.vmul(v, c), X.cross(k, v)), X.vmul(k, X.div(X.dot(k, v), X.add(X.c(1), c))));
    };

    // The rail chart's roll: the conic's four guides on the port loop's own principal axes (the loop is a near ellipse; a
    // section whose guides stand askew of it reads quarter shoulders at the clamps, 0.02 and 0.8, run 17:19, and cannot
    // take its shape). The roll nearest the carried lateral `u0` (a quarter turn at most), returned to it by the join.
    const u0: Vec3 = across(X.value(carry(X.vc(n))), n);
    const a0: Vec3 = scale(S.unit(S.cross(n, u0)), m);
    let cxx: number = 0;
    let cxy: number = 0;
    let cyy: number = 0;
    for (const p of loop) {
      const x: number = S.dot(sub(p, O), u0);
      const y: number = S.dot(sub(p, O), a0);
      cxx += x * x;
      cxy += x * y;
      cyy += y * y;
    }
    const principal: number = 0.5 * Math.atan2(2 * cxy, cxx - cyy);
    const roll: number = principal - (Math.PI / 2) * Math.round(principal / (Math.PI / 2));
    const railLateral: Vec3 = S.unit(add(scale(u0, Math.cos(roll)), scale(a0, Math.sin(roll))));

    // The whole course on jets in s (her distance from GH).
    const placeJ = (s: J): IPlaceJ => {
      if (s[0] >= chosen.join) return her(s);
      if (s[0] <= input.rail) return { centre: X.vadd(X.vc(O), X.cmul(n, X.sub(s, X.c(input.rail)))), distal: X.vc(n), lateral: X.vc(railLateral) };
      const tau: J = X.scale(X.sub(s, X.c(input.rail)), 1 / gap);
      const { p, d }: { p: V; d: V } = chosen.curve(tau);
      const distal: V = X.unit(d);
      const carried: V = acrossJ(carry(distal), distal);
      // The rail roll returns to the carried lateral by the join, smoothstep in the turn parameter (zero rate at both ends).
      const psi: J = X.scale(X.sub(X.c(1), X.smooth(tau)), roll);
      const lateral: V = X.unit(X.vadd(X.vmul(carried, X.cos(psi)), X.vmul(anteriorJ(distal, carried), X.sin(psi))));
      return { centre: p, distal, lateral };
    };
    const place = (s: number): IPlace => {
      const q: IPlaceJ = placeJ(X.c(s));
      const distal: Vec3 = X.value(q.distal);
      const lateral: Vec3 = X.value(q.lateral);
      return { centre: X.value(q.centre), distal, lateral, anterior: scale(S.unit(S.cross(distal, lateral)), m) };
    };

    // The rail's section: the port loop read in the rail plane (its rolled lateral, anterior), as `node:arm-world` reads her sections.
    const anterior0: Vec3 = scale(S.unit(S.cross(n, railLateral)), m);
    const flat: [number, number][] = loop.map((p: Vec3): [number, number] => [S.dot(sub(p, O), railLateral), S.dot(sub(p, O), anterior0)]);
    const xs: number[] = flat.map((p: [number, number]): number => p[0]);
    const ys: number[] = flat.map((p: [number, number]): number => p[1]);
    const extents: [number, number, number, number] = [Math.max(...xs), -Math.min(...xs), Math.max(...ys), -Math.min(...ys)];
    const quarter = (g1: [number, number], e1: number, g2: [number, number], e2: number): number => {
      const corner: [number, number] = [g1[0] * e1 + g2[0] * e2, g1[1] * e1 + g2[1] * e2];
      const mid: [number, number] = [corner[0] / 2, corner[1] / 2];
      const length: number = Math.hypot(corner[0] - mid[0], corner[1] - mid[1]);
      const reachOf: number | null = farthest(
        flat.map((p: [number, number]): [number, number] => [p[0] - mid[0], p[1] - mid[1]]),
        [(corner[0] - mid[0]) / length, (corner[1] - mid[1]) / length],
      );
      return reachOf === null ? 0.02 : Math.min(0.98, Math.max(0.02, reachOf / length));
    };
    const [l, md, a, p]: [number, number, number, number] = extents;
    const shoulders: AutoMovieHumanArmF1Lines.IShoulders = {
      lateralPosterior: quarter([1, 0], l, [0, -1], p),
      posteriorMedial: quarter([0, -1], p, [-1, 0], md),
      medialAnterior: quarter([-1, 0], md, [0, 1], a),
      anteriorLateral: quarter([0, 1], a, [1, 0], l),
    };

    // Her hand for the neutral frames: neutral X (anterior), Y (proximal), Z (medial on the left) onto hers, the neutral wrist (H + W below GH) onto her wrist zero.
    const handAnterior: Vec3 = scale(S.unit(S.cross(handAxis, handLateral)), m);
    const axes: [Vec3, Vec3, Vec3] = [handAnterior, scale(handAxis, -1), scale(handLateral, -m)];
    const hand: AutoMovieHumanArmCurveSpec.ITransform = { origin: sub(wristZero, scale(handAxis, H + W)), axes };

    // The loft frame and its station jet: s = back(t - offset) seeded with its station slope (piecewise linear, so no second term).
    const frameJ = (station: number, offset: number): { origin: V; u: V; v: V } => {
      const c: number = station - offset;
      const q: IPlaceJ = placeJ(X.seed(back(c), slope(c)));
      return { origin: q.centre, u: q.lateral, v: X.unit(X.cross(q.lateral, q.distal)) };
    };
    return {
      side: input.side,
      place,
      along,
      axis: (offset: number): AutoMovieViewAxis.IAxis => ({
        at: (station: number) => {
          const f: { origin: V; u: V; v: V } = frameJ(station, offset);
          return { origin: X.value(f.origin), u: X.value(f.u), v: X.value(f.v) };
        },
        jet: (station: number, parameter?: AutoMovieConstructionOutlineParameter) => {
          const inverse: [number, number] | null = AutoMovieViewParameter.inverseJet(parameter, station);
          if (inverse === null) return null;
          const f: { origin: V; u: V; v: V } = frameJ(station, offset);
          // Fq = Fs sq, Fqq = Fss sq^2 + Fs sqq (AutoMovieViewAxisJet.parameter's rule).
          const firstOf = (x: V): Vec3 => scale(X.first(x), inverse[0]);
          const secondOf = (x: V): Vec3 => add(scale(X.second(x), inverse[0] * inverse[0]), scale(X.first(x), inverse[1]));
          const out = {
            value: { origin: X.value(f.origin), u: X.value(f.u), v: X.value(f.v) },
            first: { origin: firstOf(f.origin), u: firstOf(f.u), v: firstOf(f.v) },
            second: { origin: secondOf(f.origin), u: secondOf(f.u), v: secondOf(f.v) },
          };
          return [out.value, out.first, out.second].every((g: { origin: Vec3; u: Vec3; v: Vec3 }): boolean => [...g.origin, ...g.u, ...g.v].every(Number.isFinite)) ? out : null;
        },
      }),
      rail: input.rail,
      join: chosen.join,
      section: { extents, shoulders },
      hand,
      loop,
      basis: `f1's frame curve (receipt world-2026-11-08T07-05-18-763Z${m < 0 ? ", mirrored z" : ""}); rail on port ${input.port.name} (centroid ${O.map((x: number): string => x.toFixed(1)).join(", ")}, normal ${n.map((x: number): string => x.toFixed(3)).join(", ")}, loop read as extents ${extents.map((x: number): string => x.toFixed(1)).join(", ")}); turn ${((Math.acos(Math.max(-1, Math.min(1, S.dot(n, chosen.d1)))) * 180) / Math.PI).toFixed(1)} deg on a quintic axis of ${course.toFixed(1)} mm into her humerus at ${chosen.join} mm from GH (curvature times reach ${chosen.worst.toFixed(2)}, bound ${REGULAR}; candidates ${candidates.map((t: ITurn): string => `${t.join}:${t.worst.toFixed(2)}`).join(" ")})`,
    };
  }

  /**
   * The posed course's volar offset at `x` mm past the wrist zero, mm: the
   * neutral palm's pole tilt (`AutoMovieHumanArmLandmarks.PALM_POLE_TILT`,
   * the palm pole under the palm pad so digit III's root does not stand on
   * the pole) as `x sin(tilt)`, rounded C1 over the wrist blend (+-
   * WRIST_BEND, a quadratic between the zero and the line). The offset lies
   * in the section's own plane, so a station's volar value loses exactly
   * this much and its dorsal value gains it (`AutoMovieHumanArmViewCurves`).
   */
  export function volar(x: number): number {
    const b: number = WRIST_BEND;
    const ramp: number = x <= -b ? 0 : x >= b ? x : ((x + b) * (x + b)) / (4 * b);
    return ramp * Math.sin(AutoMovieHumanArmLandmarks.PALM_POLE_TILT);
  }

  /** The farthest crossing of the ray from the origin along unit `u` with the closed polygon, or null (`node:arm-world`'s reading). */
  function farthest(loop: readonly [number, number][], u: [number, number]): number | null {
    let far: number | null = null;
    for (let k: number = 0; k < loop.length; ++k) {
      const a: [number, number] = loop[k]!;
      const c: [number, number] = loop[(k + 1) % loop.length]!;
      const e: [number, number] = [c[0] - a[0], c[1] - a[1]];
      const den: number = u[0] * e[1] - u[1] * e[0];
      if (den === 0) continue;
      const t: number = (a[0] * e[1] - a[1] * e[0]) / den;
      const s: number = (a[0] * u[1] - a[1] * u[0]) / den;
      if (t > 0 && s >= 0 && s <= 1) far = Math.max(far ?? 0, t);
    }
    return far;
  }
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}
