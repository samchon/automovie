import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import type { AutoMovieHumanLegLandmarks } from "./AutoMovieHumanLegLandmarks";
import type { AutoMovieHumanLegViewCurves } from "./AutoMovieHumanLegViewCurves";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;
type Spec = AutoMovieHumanArmCurveSpec.ICurveSpec;
type Aid = AutoMovieHumanArmCurveSpec.IAid;
type Knot = AutoMovieHumanLegViewCurves.IKnot;
type Segment = AutoMovieHumanLegViewCurves.ISegment;
type Label = AutoMovieHumanLegViewCurves.Label;

/**
 * Writes the leg's whole-walk view curves as per-segment specs in each
 * segment's own frame (human/curves.md "Few View Curves Per Segment"): for
 * the femur, tibia and foot their four outlines, axis and fullness, each with
 * its datums, constraints, quintic Hermite outline representation and the
 * construction aids of curves.md step 2 (segment axis, dimensioned
 * rectangle, chords between datums, landmark ticks, quarter divisions,
 * tangent rays, extremum station lines, the knee and ankle bisection-plane
 * stations and each span's six-point Bézier control polygon). A knot outside
 * a segment's interval is kept as interpolation support; the joint knot is
 * owned by the proximal segment and read by the distal one through the frame
 * map, as in the arm specs.
 */
export namespace AutoMovieHumanLegViewSpecs {
  /** Build every segment's specs. */
  export function create(curves: AutoMovieHumanLegViewCurves.IOutput, landmarks: AutoMovieHumanLegLandmarks.IOutput): Spec[] {
    const specs: Spec[] = [];
    const end: number = curves.end;
    const parameter: string = `one-pole root q = -sqrt(E - s), s the neutral leg walk from the hip centre's level, E = ${end.toFixed(3)} mm the toe-web pole`;
    for (const seg of curves.segments) {
      const point: (sigma: number, y: number, dir: Vec3) => Vec3 = (sigma: number, y: number, dir: Vec3): Vec3 => add(add(seg.origin, scale(seg.distal, sigma)), scale(dir, y));
      const domain: [number, number] = [seg.interval[0] - seg.walk, seg.interval[1] - seg.walk];
      for (const label of ["lateral", "medial", "anterior", "posterior"] as const) {
        const dir: Vec3 = direction(seg, label);
        const all: Knot[] = curves.outlines[label];
        const inside: number[] = all.map((_: Knot, i: number): number => i).filter((i: number): boolean => all[i]!.walk >= seg.interval[0] - 1e-9 && all[i]!.walk <= seg.interval[1] + 1e-9);
        const lo: number = Math.max(0, Math.min(...inside) - 1);
        const hi: number = Math.min(all.length - 1, Math.max(...inside) + 1);
        const used: Knot[] = all.slice(lo, hi + 1);
        const name: string = `leg.${label}.${seg.name}`;
        const datums: AutoMovieHumanArmCurveSpec.IDatum[] = used.map((k: Knot): AutoMovieHumanArmCurveSpec.IDatum => ({
          name: `${name}.${k.site}`,
          frame: seg.frame,
          point: point(k.walk - seg.walk, k.value, dir),
          source: k.rule.startsWith("value") || k.rule.startsWith("actual")
            ? { kind: "derived", rule: `${k.site}: ${curves.sites.find((s: AutoMovieHumanLegViewCurves.ISite): boolean => s.name === k.site)?.basis ?? k.rule}` }
            : k.rule === "pole"
              ? { kind: "derived", rule: "closure of the foot walk at the toe-web pole" }
              : k.rule.startsWith("port")
                ? { kind: "debt", reason: "pending f1_trunk hip-port band at the crotch level: interim circle of the thigh tape, leaving parallel to the axis" }
                : { kind: "derived", rule: "height supplied by the minimum bending energy (no invented amplitude)" },
        }));
        const constraints: AutoMovieHumanArmCurveSpec.IConstraint[] = [];
        used.forEach((k: Knot, j: number): void => {
          if (k.rule !== "free") constraints.push({ kind: "pass", datum: datums[j]!.name });
          // A stationary knot that is neither belly nor waist (the port leaving parallel): its tangent runs along the segment axis.
          if (k.rule.endsWith("parallel")) constraints.push({ kind: "tangent", datum: datums[j]!.name, direction: seg.distal });
          if (k.sense !== null) {
            const prev: Knot = all[Math.max(0, all.indexOf(k) - 1)]!;
            const next: Knot = all[Math.min(all.length - 1, all.indexOf(k) + 1)]!;
            constraints.push({ kind: "extremum", datum: datums[j]!.name, axis: dir, sense: k.sense, value: AutoMovieHumanArmCurveSpec.dot(datums[j]!.point, dir), interval: [prev.q, next.q] });
          }
        });
        specs.push({
          name,
          frame: seg.frame,
          datums,
          constraints,
          representation: {
            kind: "outline",
            parameter,
            direction: dir,
            walk: seg.walk,
            domain,
            knots: used.map((k: Knot): AutoMovieHumanArmCurveSpec.IOutlineKnot => ({ site: k.site, station: k.walk - seg.walk, q: k.q, value: k.value, first: k.first, second: k.second })),
            handleRule: "C2 quintic Hermite in q: values at the girth sites from their boxes, the dorsum and the floor, zero slopes at the declared bellies, waists and malleoli, every other jet by the minimum of the integral of (d2y/dq2)^2 (AutoMovieHumanFairOutline); tangent rays and six-point controls are drawn as aids.",
          },
          aids: aids(seg, used, dir, landmarks, end, point),
          consumers: [`leg view loft ${label} edge over ${seg.name} [${seg.interval[0].toFixed(1)}, ${seg.interval[1].toFixed(1)}] mm walk`],
        });
      }

      // Axis: the segment's straight course line (an exact straight cubic, controls at the chord thirds).
      const a: Vec3 = point(domain[0], 0, seg.lateral);
      const b: Vec3 = point(domain[1], 0, seg.lateral);
      specs.push({
        name: `leg.axis.${seg.name}`,
        frame: seg.frame,
        datums: [
          { name: `leg.axis.${seg.name}.start`, frame: seg.frame, point: a, source: { kind: "derived", rule: "proximal course centre (port, knee centre or IM)" } },
          { name: `leg.axis.${seg.name}.end`, frame: seg.frame, point: b, source: { kind: "derived", rule: "distal course centre (knee centre, IM or toe-web pole)" } },
        ],
        constraints: [
          { kind: "pass", datum: `leg.axis.${seg.name}.start` },
          { kind: "pass", datum: `leg.axis.${seg.name}.end` },
        ],
        representation: { kind: "bezier", points: [a, lerp(a, b, 1 / 3), lerp(a, b, 2 / 3), b], closed: false, handleRule: "straight course line: controls at the chord thirds" },
        aids: [{ kind: "axis", name: `${seg.name} axis`, frame: seg.frame, points: [a, b] }],
        consumers: ["leg view loft jointed course"],
      });

      // Fullness: the conic shoulder along the segment, values only.
      const inside: Knot[] = curves.fullness.filter((k: Knot): boolean => k.walk >= seg.interval[0] - 1e-9 && k.walk <= seg.interval[1] + 1e-9);
      specs.push({
        name: `leg.fullness.${seg.name}`,
        frame: seg.frame,
        datums: inside.map((k: Knot): AutoMovieHumanArmCurveSpec.IDatum => ({ name: `leg.fullness.${seg.name}.${k.site}`, frame: seg.frame, point: point(k.walk - seg.walk, 0, seg.lateral), source: { kind: "derived", rule: k.rule } })),
        constraints: [],
        representation: {
          kind: "outline",
          parameter: "walk station s, mm",
          direction: null,
          walk: seg.walk,
          domain,
          knots: inside.map((k: Knot): AutoMovieHumanArmCurveSpec.IOutlineKnot => ({ site: k.site, station: k.walk - seg.walk, q: k.q, value: k.value, first: k.first, second: k.second })),
          handleRule: "natural cubic in station through the solved shoulders (the engine's default outline), stored as its exact jets",
        },
        aids: [],
        consumers: ["leg view loft shoulder fullness"],
      });
    }
    return specs;
  }

  /** The unit direction an outline measures along, in its segment frame. */
  export function direction(seg: Segment, label: Label): Vec3 {
    return label === "lateral" ? seg.lateral : label === "medial" ? scale(seg.lateral, -1) : label === "anterior" ? seg.anterior : scale(seg.anterior, -1);
  }

  /** Construction aids of one outline spec. */
  function aids(seg: Segment, used: Knot[], dir: Vec3, landmarks: AutoMovieHumanLegLandmarks.IOutput, end: number, point: (sigma: number, y: number, dir: Vec3) => Vec3): Aid[] {
    const F: string = seg.frame;
    const out: Aid[] = [];
    const s0: number = seg.interval[0] - seg.walk;
    const s1: number = seg.interval[1] - seg.walk;
    const top: number = Math.max(...used.map((k: Knot): number => k.value));
    out.push({ kind: "axis", name: `${seg.name} axis`, frame: F, points: [point(s0, 0, dir), point(s1, 0, dir)] });
    out.push({ kind: "rectangle", name: `${seg.name} rectangle ${top.toFixed(1)} mm`, frame: F, points: [point(s0, 0, dir), point(s1, 0, dir), point(s1, top, dir), point(s0, top, dir), point(s0, 0, dir)] });
    for (let i: number = 0; i + 1 < used.length; ++i)
      out.push({ kind: "chord", name: `chord ${used[i]!.site}-${used[i + 1]!.site}`, frame: F, points: [point(used[i]!.walk - seg.walk, used[i]!.value, dir), point(used[i + 1]!.walk - seg.walk, used[i + 1]!.value, dir)] });
    for (const l of landmarks.list)
      if (l.kind === "level" && l.walk >= seg.interval[0] && l.walk <= seg.interval[1])
        out.push({ kind: "tick", name: `tick ${l.name}`, frame: F, points: [point(l.walk - seg.walk, -6, dir), point(l.walk - seg.walk, 6, dir)] });
    for (const share of [0.25, 0.5, 0.75])
      out.push({ kind: "division", name: `${seg.name} ${share}`, frame: F, points: [point(s0 + share * (s1 - s0), -4, dir), point(s0 + share * (s1 - s0), 4, dir)] });
    for (const k of used) {
      const sigma: number = k.walk - seg.walk;
      // Tangent from the jet: dy/ds = (dy/dq) / (ds/dq), s = E - q^2 so ds/dq = -2 q. At the pole (q = 0) a nonzero dy/dq meets the axis square, so the tangent is normal to it; a zero dy/dq leaves the finite limit -y''(q) / 2 (L'Hopital).
      const atPole: boolean = Math.abs(k.q) < 1e-12;
      if (atPole && Math.abs(k.first) > 1e-12) out.push({ kind: "tangent", name: `tangent ${k.site}`, frame: F, points: [point(sigma, k.value - 15, dir), point(sigma, k.value + 15, dir)] });
      else {
        const ys: number = atPole ? -k.second / 2 : k.first / (-2 * k.q);
        const t: number = 15 / Math.hypot(1, ys);
        out.push({ kind: "tangent", name: `tangent ${k.site}`, frame: F, points: [point(sigma - t, k.value - t * ys, dir), point(sigma + t, k.value + t * ys, dir)] });
      }
      if (k.sense !== null) out.push({ kind: "extremum", name: `${k.sense} ${k.site}`, frame: F, points: [point(sigma, 0, dir), point(sigma, k.value, dir)] });
    }
    for (const [joint, label] of [[landmarks.course.knee, "knee"], [landmarks.course.im, "ankle"]] as const)
      if (joint >= seg.interval[0] && joint <= seg.interval[1])
        out.push({ kind: "plane", name: `bisection station ${label}`, frame: F, points: [point(joint - seg.walk, -12, dir), point(joint - seg.walk, top + 12, dir)] });
    for (let i: number = 0; i + 1 < used.length; ++i) {
      const a: Knot = used[i]!;
      const b: Knot = used[i + 1]!;
      const h: number = b.q - a.q;
      const ys: number[] = [a.value, a.value + (h * a.first) / 5, a.value + (2 * h * a.first) / 5 + (h * h * a.second) / 20, b.value - (2 * h * b.first) / 5 + (h * h * b.second) / 20, b.value - (h * b.first) / 5, b.value];
      out.push({ kind: "polygon", name: `controls ${a.site}-${b.site}`, frame: F, points: ys.map((y: number, j: number): Vec3 => point(end - (a.q + (j * h) / 5) ** 2 - seg.walk, y, dir)) });
    }
    return out;
  }
}

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

function lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
