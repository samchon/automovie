import type { IAutoMovieHumanHandFinger } from "./IAutoMovieHumanHandFinger";
import type { IAutoMovieHumanHandForm } from "./IAutoMovieHumanHandForm";
import type { IAutoMovieHumanHandJoints } from "./IAutoMovieHumanHandJoints";
import type { IAutoMovieHumanHandMeasures } from "./IAutoMovieHumanHandMeasures";
import type { IAutoMovieHumanHandScales } from "./IAutoMovieHumanHandScales";
import type { IAutoMovieHumanHandWrist } from "./IAutoMovieHumanHandWrist";
import { AutoMovieHumanHandFingers } from "./AutoMovieHumanHandFingers";
import { AutoMovieHumanHandJoints } from "./AutoMovieHumanHandJoints";
import { AutoMovieHumanHandMap } from "./AutoMovieHumanHandMap";
import { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";

type Vec3 = AutoMovieHumanHandVector.Vec3;
const { sub, plus, scale, dot, unit, cross, hull }: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;
const { handPoint }: typeof AutoMovieHumanHandMap = AutoMovieHumanHandMap;
const { jointsOf, STYLION }: typeof AutoMovieHumanHandJoints = AutoMovieHumanHandJoints;
const { digitsOf }: typeof AutoMovieHumanHandFingers = AutoMovieHumanHandFingers;

/**
 * The hand's three scales and the wrist's circle, each solved at its measure's
 * site (ANSUR II and ISO 7250-1 definitions): along the hand so the middle
 * finger's webs stand the palm length from stylion, across it so the knuckles'
 * section spans the breadth, through it so that section's hull measures the
 * hand tape, and the wrist's circle so the forearm's section at stylion
 * measures the wrist tape.
 */
export namespace AutoMovieHumanHandSolve {
  /**
   * Rounds of the hand's and wrist's solve: each scale moves by its measure's
   * ratio to its input, and the measures barely couple, so each round shrinks
   * every miss severalfold.
   */
  const SOLVE_ROUNDS: number = 5;

  /** What the solve gives: the hand's scales, the arm built with them, and the joints. */
  export interface ISolved<A extends IAutoMovieHumanHandWrist> {
    /** The hand's scales as solved, each at its measure's site. */
    measures: IAutoMovieHumanHandScales;

    /** The arm built with those scales, whatever more than the wrist it carries. */
    law: A;

    /** The knuckles and the thumb's base for those scales. */
    joints: IAutoMovieHumanHandJoints;
  }

  /**
   * Solve the hand's scales and the wrist's circle at their measurement sites
   * (ANSUR II and ISO 7250-1 definitions), in rounds: each scale moves by its
   * measure's ratio to its input, and the measures barely couple.
   *
   * @param targets What the knuckle section read on the chains must measure
   *   for the meshed skin to measure the breadth and the hand tape (see
   *   {@link skinTargets}); absent, the inputs themselves.
   */
  export function solve<A extends IAutoMovieHumanHandWrist>(
    hand: IAutoMovieHumanHandForm,
    given: IAutoMovieHumanHandMeasures,
    circumference: number,
    wristTape: number,
    makeArm: (measures: IAutoMovieHumanHandScales) => A,
    targets?: { breadth: number; girth: number },
  ): ISolved<A> {
    const widest: number = Math.max(
      ...hand.palmRings.map((r: readonly Vec3[]): number =>
        Math.max(...r.map((q: Vec3): number => q[1])) - Math.min(...r.map((q: Vec3): number => q[1])),
      ),
    );
    const girth0: number = Math.max(
      ...hand.palmRings.map((r: readonly Vec3[]): number =>
        hull(r.map((q: Vec3): [number, number] => [q[1], q[2]])),
      ),
    );
    const webs: Vec3[] = hand.crests.slice(0, 2);
    const span: number = Math.max(...webs.map((c: Vec3): number => c[0])) - hand.creaseCentre[0];
    const measures: IAutoMovieHumanHandScales = {
      ...given,
      along: (given.palm - STYLION) / span,
      across: given.breadth / widest,
      through: circumference / girth0,
      wrist: 1,
    };
    let law: A = makeArm(measures);
    let joints: IAutoMovieHumanHandJoints = jointsOf(hand, measures, law);
    for (let round: number = 0; round < SOLVE_ROUNDS; round++) {
      const map = (q: readonly [number, number, number]): Vec3 => handPoint(q, measures, law.wrist);
      const axis: Vec3 = unit(sub(joints.mcps[2]!, law.crease));
      const stylion: Vec3 = sub(law.crease, scale(axis, STYLION));
      const palm: number = Math.max(...webs.map((c: Vec3): number => dot(sub(map(c), stylion), axis)));
      const section: { breadth: number; girth: number } = knuckleSection(
        hand,
        map,
        law.crease,
        joints.mcps,
        digitsOf(hand, measures, law, joints).slice(1),
      );
      // The tube's sections face the shoulder, as its walk rises.
      const fore: Vec3 = unit(sub(law.crease, law.elbow));
      const wrist: number = law.girth(sub(law.crease, scale(fore, STYLION)), scale(fore, -1));
      measures.along *= (given.palm - STYLION) / (palm - STYLION);
      measures.across *= (targets?.breadth ?? given.breadth) / section.breadth;
      measures.through *= (targets?.girth ?? circumference) / section.girth;
      measures.wrist *= wristTape / wrist;
      law = makeArm(measures);
      joints = jointsOf(hand, measures, law);
    }
    return { measures, law, joints };
  }

  /**
   * The palm's section through knuckles II and V as ANSUR II measures the
   * hand's breadth and circumference: the plane through the knuckles'
   * midpoint that holds the line from II to V and stands square to the hand's
   * axis from the wrist to knuckle III. The breadth is the section's extent
   * along that line, the circumference its hull's perimeter, the thumb's
   * chains left out.
   *
   * The skin in that plane is the palm's and, at the borders where the palm's
   * last ring stops short of the knuckles, the webs' columns that run from it
   * to the fingers' first sections; those columns descend along the hand, so
   * the fingers' first sections, carried into the plane along its normal,
   * stand for them. Read on the palm alone, the index finger's root stood
   * 5 mm radial of the section the breadth was solved on.
   *
   * @param crease Centre of the hand's section at the wrist crease.
   * @param fingers The four fingers on their bones.
   */
  function knuckleSection(
    shape: IAutoMovieHumanHandForm,
    map: (q: readonly [number, number, number]) => Vec3,
    crease: Vec3,
    mcps: readonly Vec3[],
    fingers: readonly IAutoMovieHumanHandFinger[],
  ): { breadth: number; girth: number } {
    const middle: Vec3 = scale(plus(mcps[1]!, mcps[4]!), 0.5);
    const axis: Vec3 = unit(sub(mcps[2]!, crease));
    const line: Vec3 = unit(sub(mcps[4]!, mcps[1]!));
    const normal: Vec3 = unit(sub(axis, scale(line, dot(axis, line))));
    const other: Vec3 = cross(normal, line);
    const rings: Vec3[][] = shape.palmRings.map((ring: readonly Vec3[]): Vec3[] =>
      ring.map((q: Vec3): Vec3 => map(q)),
    );
    const count: number = Math.min(...rings.map((ring: Vec3[]): number => ring.length));
    const points: [number, number][] = [];
    for (let j: number = 0; j < count; j++)
      for (let k: number = 1; k < rings.length; k++) {
        const p: Vec3 = rings[k - 1]![j]!;
        const q: Vec3 = rings[k]![j]!;
        const fp: number = dot(sub(p, middle), normal);
        const fq: number = dot(sub(q, middle), normal);
        if (fp === fq || fp * fq > 0) continue;
        const x: Vec3 = sub(plus(p, scale(sub(q, p), fp / (fp - fq))), middle);
        points.push([dot(x, line), dot(x, other)]);
      }
    if (points.length < 3) throw new Error("The knuckles' plane misses the palm");
    // The border fingers' roots, the index's and the little finger's: each
    // one's outermost point across the hand, where the web's columns carry
    // the border out to it.
    for (const [f, outward] of [[fingers[0]!, -1], [fingers[3]!, 1]] as const) {
      const flat: [number, number][] = f.ring(f.first).map((p: Vec3): [number, number] => {
        const x: Vec3 = sub(p, middle);
        return [dot(x, line), dot(x, other)];
      });
      points.push(flat.reduce((a: [number, number], b: [number, number]): [number, number] => (b[0] * outward > a[0] * outward ? b : a)));
    }
    const along: number[] = points.map((p: [number, number]): number => p[0]);
    return { breadth: Math.max(...along) - Math.min(...along), girth: hull(points) };
  }
}
