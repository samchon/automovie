import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import type { AutoMovieHumanHeadFrankfort } from "./AutoMovieHumanHeadFrankfort";
import type { AutoMovieHumanHeadMass } from "./AutoMovieHumanHeadMass";
import type { AutoMovieHumanHeadMassCurves } from "./AutoMovieHumanHeadMassCurves";
import type { AutoMovieHumanHeadNeckCourse } from "./AutoMovieHumanHeadNeckCourse";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;
type Spec = AutoMovieHumanArmCurveSpec.ICurveSpec;

/**
 * head.mass's view curves written as the shared curve specs
 * (`AutoMovieHumanArmCurveSpec`) in two segment frames, each with a vertical
 * axis whose station is the height above FH:
 * - `neck` (parent `head`): origin at the trunk end's axis point, axes parallel
 *   to the head frame's; it carries each outline from the port to FH;
 * - `head`: the Frankfort frame, its axis the head axis; it carries the rest
 *   to the vertex.
 * From FH up the course is the head axis, so the drawn outline is exact
 * there; below FH the course's origin drifts from the port's centre to the
 * head axis and the neck segment's vertical line is a display approximation
 * (the loft reads the real course). The outlines' knots carry their jets in
 * the root parameter `q = -sqrt(L - s)`, the fullness knots in station.
 */
export namespace AutoMovieHumanHeadMassSpecs {
  /** The specs and the segment frames they are written in. */
  export interface IOutput {
    /** The `neck` frame relative to `head`. */
    neck: AutoMovieHumanArmCurveSpec.ISegmentFrame;

    /** Station where the head segment takes over: FH, mm. */
    split: number;

    /** Each segment's axis: its own zero and distal direction, in its frame. */
    axes: Record<"neck" | "head", { origin: Vec3; distal: Vec3 }>;

    /** The specs. */
    specs: Spec[];
  }

  /** The specs of head.mass. */
  export function create(head: AutoMovieHumanHeadFrankfort.IOutput, course: AutoMovieHumanHeadNeckCourse.IOutput, curves: AutoMovieHumanHeadMass.IOutput): IOutput {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const base: { origin: Vec3; u: Vec3; v: Vec3 } = course.frame(course.start);
    const neck: AutoMovieHumanArmCurveSpec.ISegmentFrame = {
      name: "neck",
      parent: "head",
      basis: { kind: "derived", rule: "origin the trunk's S00 end-section axis point (AutoMovieHumanTrunkNeckBase), Y up, X forward, Z right (level sections)" },
      relative: { origin: course.base.centre, axes: [base.u, course.base.normal, S.cross(base.u, course.base.normal)] },
    };

    // The neck segment carries the course below FH, the head segment from FH;
    // stations are heights, so each axis's zero sits at its frame's FH level.
    const split: number = 0;
    const axes: Record<"neck" | "head", { origin: Vec3; distal: Vec3 }> = {
      neck: { origin: [0, -course.start, 0], distal: [0, 1, 0] },
      head: { origin: [0, 0, 0], distal: [0, 1, 0] },
    };
    const datums: AutoMovieHumanArmCurveSpec.IDatum[] = head.list.map((l: AutoMovieHumanHeadFrankfort.ILandmark): AutoMovieHumanArmCurveSpec.IDatum => ({ name: l.name, frame: "head", point: l.point, source: l.source }));
    const root: string = "root -sqrt(L - s), L the vertex station, s the course station, mm^(1/2)";
    const fair: string = "minimum bending energy C2 quintic chain (AutoMovieHumanFairOutline) through the sourced values, zero slopes at declared extrema, zero at the vertex pole";
    const outline: (knots: AutoMovieHumanHeadMassCurves.IKnot[], direction: Vec3 | null, domain: [number, number], parameter: string, rule: string) => AutoMovieHumanArmCurveSpec.IOutline = (
      knots: AutoMovieHumanHeadMassCurves.IKnot[],
      direction: Vec3 | null,
      domain: [number, number],
      parameter: string,
      rule: string,
    ): AutoMovieHumanArmCurveSpec.IOutline => ({
      kind: "outline",
      parameter,
      direction,
      walk: 0,
      domain,
      knots: knots.map((k: AutoMovieHumanHeadMassCurves.IKnot): AutoMovieHumanArmCurveSpec.IOutlineKnot => ({ site: k.site, station: k.station, q: k.q, value: k.value, first: k.first, second: k.second })),
      handleRule: rule,
    });
    const tapes: AutoMovieHumanArmCurveSpec.IConstraint[] = curves.tapes.map(
      (t: AutoMovieHumanHeadMassCurves.ITape): AutoMovieHumanArmCurveSpec.IConstraint => ({ kind: "perimeter", length: t.target, source: { kind: "published", citation: t.source, detail: `${t.name}; solves ${t.solves}` } }),
    );
    const specs: Spec[] = [];
    for (const [segment, domain] of [["neck", [course.start, split]], ["head", [split, curves.length]]] as ["neck" | "head", [number, number]][]) {
      const frame: string = segment;
      specs.push(
        { name: `${segment}.anterior`, frame, datums: segment === "head" ? datums : [], constraints: [], representation: outline(curves.outlines.anterior, [1, 0, 0], domain, root, fair), aids: segment === "head" ? curves.aids : [], consumers: ["head.mass loft (+u)"] },
        { name: `${segment}.posterior`, frame, datums: [], constraints: [], representation: outline(curves.outlines.posterior, [-1, 0, 0], domain, root, fair), aids: [], consumers: ["head.mass loft (-u)"] },
        { name: `${segment}.lateral.right`, frame, datums: [], constraints: segment === "head" ? tapes.slice(0, 1) : [], representation: outline(curves.outlines.lateral, [0, 0, 1], domain, root, fair), aids: [], consumers: ["head.mass loft (+v)", "ear-root ports (pending)"] },
        { name: `${segment}.lateral.left`, frame, datums: [], constraints: [], representation: outline(curves.outlines.lateral, [0, 0, -1], domain, root, `declared bilateral mirror of ${segment}.lateral.right; ${fair}`), aids: [], consumers: ["head.mass loft (-v)"] },
        { name: `${segment}.fullness.anterior`, frame, datums: [], constraints: segment === "head" ? tapes.slice(1, 4) : [], representation: outline(curves.fullness.anterior, null, domain, "course station, mm", "fair chain in station from the trunk's end shoulder with its height jet (C2 with S00), through the exact quarter ellipse at menton and subnasale (null law; their ANSUR arcs are checks), the glabella's shoulder solved for the ANSUR 1988 minimum-frontal arc, and the exact quarter ellipse at the vertex"), aids: [], consumers: ["head.mass quarters 0 and 3"] },
        { name: `${segment}.fullness.posterior`, frame, datums: [], constraints: segment === "head" ? tapes.slice(4) : [], representation: outline(curves.fullness.posterior, null, domain, "course station, mm", "fair chain in station from the trunk's end shoulder with its height jet (C2 with S00), through the shoulder solved for the head circumference at the glabella station, to the exact quarter ellipse at the vertex"), aids: [], consumers: ["head.mass quarters 1 and 2"] },
      );
    }
    return { neck, split, axes, specs };
  }
}
