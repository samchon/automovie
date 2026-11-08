import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanFairOutline } from "../arm/AutoMovieHumanFairOutline";
import type { AutoMovieHumanTrunkSegmentFrames } from "./AutoMovieHumanTrunkSegmentFrames";
import type { AutoMovieHumanTrunkViewCurves } from "./AutoMovieHumanTrunkViewCurves";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;
type Spec = AutoMovieHumanArmCurveSpec.ICurveSpec;
type Knot = AutoMovieHumanTrunkViewCurves.IKnot;

/**
 * S00's view curves in the shared spec type (`AutoMovieHumanArmCurveSpec`),
 * all written in the pelvis frame: the anterior and posterior midlines
 * (direction +X, signed offsets from the section plane's origin), the right
 * and left lateral outlines (directions +Z and -Z, the same symmetric
 * half-width), and the conic shoulder (fullness, null direction). An
 * outline's station and its knots' `q` are S00's station above the crotch.
 * The segment axis is the vertical course from the crotch: exact below the
 * neck turn; inside the turn the capture's straight axis is a display
 * approximation, while the aids and datums here stand in the actual planes.
 *
 * Aids: the axis, a tick at every datum, a 40 mm tangent ray at every fixed
 * slope, and a 50 mm extremum line where the slope is fixed at zero.
 */
export namespace AutoMovieHumanTrunkViewSpecs {
  /** The four outline specs and the fullness spec. */
  export function create(frames: AutoMovieHumanTrunkSegmentFrames.IOutput, curves: AutoMovieHumanTrunkViewCurves.IOutput): Spec[] {
    const hip: number = frames.heights.hip;
    const slope: number = 0;

    // A value at a station sits in that station's section plane (pelvis frame = world less the hip height).
    const local: (s: number, x: number, z: number) => Vec3 = (s: number, x: number, z: number): Vec3 => {
      const f: { origin: number[]; u: number[]; v: number[] } = curves.axis.turn.frame(s);
      return [f.origin[0]! + x * f.u[0]! + z * f.v[0]!, f.origin[1]! + x * f.u[1]! + z * f.v[1]! - hip, f.origin[2]! + x * f.u[2]! + z * f.v[2]!];
    };
    const axisAid: AutoMovieHumanArmCurveSpec.IAid = { kind: "axis", name: "S00 level axis", frame: "pelvis", points: [local(curves.bottom, 0, 0), local(curves.top, 0, 0)] };
    const outline: (name: string, knots: Knot[], direction: Vec3, sign: 1 | -1) => Spec = (name: string, knots: Knot[], direction: Vec3, sign: 1 | -1): Spec => {
      const at: (k: Knot, value: number) => Vec3 = (k: Knot, value: number): Vec3 =>
        direction[0] !== 0 ? local(k.y, value, 0) : local(k.y, 0, direction[2] * value);
      const aids: AutoMovieHumanArmCurveSpec.IAid[] = [axisAid];
      for (const k of knots) {
        const p: Vec3 = at(k, k.jet.value);
        aids.push({ kind: "tick", name: `${k.site}`, frame: "pelvis", points: [local(k.y, direction[0] !== 0 ? k.jet.value - 4 : 0, direction[2] * k.jet.value), local(k.y, direction[0] !== 0 ? k.jet.value + 4 : 0, direction[2] * k.jet.value)] });
        if (k.slope !== null) {
          // The fixed slope is dv/dy in world X or Z per mm of height.
          const d: number = (direction[0] !== 0 ? k.slope + slope : k.slope) * sign;
          const n: number = Math.hypot(1, d);
          const t: Vec3 = direction[0] !== 0 ? [d / n, 1 / n, 0] : [0, 1 / n, (direction[2] * d) / n];
          aids.push({ kind: "tangent", name: `tangent at ${k.site}`, frame: "pelvis", points: [sub(p, scale(t, 40)), add(p, scale(t, 40))] });
          if (k.slope === 0) aids.push({ kind: "extremum", name: `extremum at ${k.site}`, frame: "pelvis", points: [at(k, k.jet.value - 25), at(k, k.jet.value + 25)] });
        }
      }
      return {
        name,
        frame: "pelvis",
        datums: knots.filter((k: Knot): boolean => k.value !== null).map((k: Knot): AutoMovieHumanArmCurveSpec.IDatum => ({ name: k.site, frame: "pelvis", point: at(k, k.jet.value), source: { kind: "derived", rule: k.rule } })),
        constraints: [],
        representation: {
          kind: "outline",
          parameter: "station above the crotch, mm (S00 station less the crotch)",
          direction,
          walk: 0,
          domain: [0, curves.top - curves.bottom],
          knots: knots.map((k: Knot): AutoMovieHumanArmCurveSpec.IOutlineKnot => ({ site: k.site, station: k.y - curves.bottom, q: k.y - curves.bottom, value: sign * k.jet.value, first: sign * k.jet.first, second: sign * k.jet.second })),
          handleRule: "minimum bending energy C2 quintic Hermite through the datums (AutoMovieHumanFairOutline)",
        },
        aids,
        consumers: ["trunk (S00) view loft"],
      };
    };
    const fullness: Spec = {
      name: "trunk.fullness",
      frame: "pelvis",
      datums: [],
      constraints: [],
      representation: {
        kind: "outline",
        parameter: "station above the crotch, mm",
        direction: null,
        walk: 0,
        domain: [0, curves.top - curves.bottom],
        knots: curves.fullness.map((k: Knot): AutoMovieHumanArmCurveSpec.IOutlineKnot => ({ site: k.site, station: k.y - curves.bottom, q: k.y - curves.bottom, value: k.jet.value, first: k.jet.first, second: k.jet.second })),
        handleRule: "shoulder solved at each girth site for the composed taut-tape girth; ellipse at both open ends",
      },
      aids: [axisAid],
      consumers: ["trunk (S00) view loft"],
    };
    return [
      outline("trunk.anterior", curves.outlines.anterior, [1, 0, 0], 1),
      outline("trunk.posterior", curves.outlines.posterior, [1, 0, 0], 1),
      outline("trunk.lateral.right", curves.outlines.lateral, [0, 0, 1], 1),
      outline("trunk.lateral.left", curves.outlines.lateral, [0, 0, -1], 1),
      fullness,
    ];
  }

  /** The exact value of one of these specs at a station above the crotch (its own parameter). */
  export function value(spec: Spec, station: number): number | null {
    const rep: Spec["representation"] = spec.representation;
    if (rep.kind !== "outline") return null;
    const q: number = station;
    return AutoMovieHumanFairOutline.evaluate(
      rep.knots.map((k: AutoMovieHumanArmCurveSpec.IOutlineKnot): number => k.q),
      rep.knots.map((k: AutoMovieHumanArmCurveSpec.IOutlineKnot): AutoMovieHumanFairOutline.IJet => ({ value: k.value, first: k.first, second: k.second })),
      q,
    )[0];
  }

  /** The pelvis-frame axis of the S00 specs: the course at the crotch and its vertical distal direction. */
  export function axis(frames: AutoMovieHumanTrunkSegmentFrames.IOutput, curves: AutoMovieHumanTrunkViewCurves.IOutput): { origin: Vec3; distal: Vec3 } {
    return { origin: [curves.axis.xs, curves.bottom - frames.heights.hip, 0], distal: [0, 1, 0] };
  }
}

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}
