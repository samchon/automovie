import { AutoMovieLoftChain, AutoMovieMeshExtract, type AutoMovieViewLoft } from "@automovie/engine";

import { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicPose } from "../conic/AutoMovieHumanConicPose";
import { AutoMovieHumanSegmentFrame as F } from "../frame/AutoMovieHumanSegmentFrame";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";
import { AutoMovieHumanF1Placement } from "./AutoMovieHumanF1Placement";
import { AutoMovieHumanF1Trunk } from "./AutoMovieHumanF1Trunk";

/**
 * The shoulder girdle's ring and the arm's course from it, by rule (#3151, R3b): computed from the trunk's own wall and the skeleton, not
 * stored.
 *
 * The armscye is the trunk's opening bounded by the clavicle and the acromion above and the axillary folds in front and behind, all of which
 * run from the shoulder girdle to the arm, so its loop is fixed in the thorax's frame. Its plane is fixed in the thorax's frame by a tilt and an
 * offset from the shoulder joint centre GH (`plane`), and its ring is that plane's cut of the trunk family's own wall. The arm's course starts at the ring's centre, leaves square to the plane along its normal, and turns at the corner
 * into today's line down to the elbow; the corner stands at the set-back of its own turn, so the turn begins at the ring.
 *
 * Everything here is read at the reference pose and fixed in the thorax: at another pose the course's first two centres are carried with
 * the thorax (`AutoMovieHumanF1Placing.COMPUTED`) and the turns keep their set-backs (`AutoMovieHumanConicPose.halves`).
 */
export namespace AutoMovieHumanF1Girdle {
  /**
   * The turn's half at the corner as a multiple of the arm's own radius: 1.5, the least of the multiples tried at which the band leaves the
   * girdle's ring square (0.3 degrees, where 1 left 0.8 with 20 sections folding behind the armpit and 0.5 left 5 with 13; re-measured on
   * this centre at 0.3 degrees with 2 of 135 sections on the reference and 1 on f1 not star-shaped), and the fitted arm on an equal turn
   * (today's, 57.5 degrees, half 65 mm) does not fold: none of its rays steps back between sections 1 mm apart (`FamilyConicArmscyeRule`
   * runs `course`, `basis` and `rails`).
   */
  export const TURN_K: number = 1.5;

  /** f1's relaxed mid upper arm girth, mm: ISO 8559-1, read on the stored wall (`FamilyConicLimbLaw`); the arm's radius is it over 2 pi. */
  export const UPPER_ARM_GIRTH_MM: number = 266.374;

  /** The turn's half at the corner, mm: `TURN_K` times the arm's radius. */
  export const HALF_MM: number = (TURN_K * UPPER_ARM_GIRTH_MM) / (2 * Math.PI);

  /**
   * The trunk's stations the ring is read over, mm: its loft from 380 to 760 mm, which holds the plane's cut round the shoulder (stations
   * about 470 to 650).
   */
  const STATIONS: [number, number] = [380, 760];

  /**
   * The sampling the ring is read at: rings `STEP_MM` apart at `PHASES` phases each, the girdle's measurements' own. The ring is cut from
   * the loft sampled so, a mesh private to this reading that no render setting touches; at twice as fine (`resolve(0.5, 1440)`) the centre
   * and the corner move by under 0.1 mm (`FamilyConicArmscyeRule resolution`), so the sampling does not set them.
   */
  const STEP_MM: number = 1;
  const PHASES: number = 720;

  /**
   * How far past the set-back of its own turn the corner stands, mm. The engine refuses a set-back that reaches its segment's end exactly,
   * and a fit checks a family on its centres rounded to the stored precision, 0.01 mm: 1e-6 mm past, every candidate the arm's refit tried
   * was refused there. Five times that precision keeps the corner past the set-back after rounding.
   */
  const CORNER_PAST_MM: number = 0.05;

  /**
   * The armscye's plane, fixed in the thorax's frame by two numbers of the person: its tilt about the thorax's anterior-posterior axis, its
   * normal the thorax's lateral axis turned toward the thorax's up by `TILT_DEG` (negative: its top leans out over the shoulder), and its
   * offset from GH along that normal, `OFFSET_MM`. They are the least-error plane over the armscye's definition's checks (ASTM D5219's
   * armscye: the shoulder point, the front and back break points and the armpit; ISO 8559-1 3.1.1 and 3.1.13): its cut of the trunk's
   * own wall passes the acromion, the anterior and the posterior axillary fold points of f1 at 7.88, 4.03 and 6.54 mm (root-mean-square
   * 6.35 mm, within the reading uncertainty of soft-tissue landmarks), as one closed loop star-shaped in the trunk's chart and at least
   * 39.2 degrees from the wall everywhere (`FamilyConicArmscyeRule tiltfit`, run 2026-11-15T03-44-18; a plane held through GH missed the
   * acromion by 51 to 76 mm). A law of the person to be learnt across people; the landmarks only check it.
   */
  export const TILT_DEG: number = -13.594;

  /** The armscye plane's offset from GH along its normal, mm, out toward the arm: the second number of `TILT_DEG`'s fit. */
  export const OFFSET_MM: number = 30;

  /** The armscye's plane at the reference pose: its point (GH moved `OFFSET_MM` along its normal) and its normal, charted by `u` (up) and `v`. */
  export function plane(): { point: F.V3; normal: F.V3; u: F.V3; v: F.V3 } {
    const thorax: F.IFrame = AutoMovieHumanF1Placement.frame("thorax");
    const tilt: number = (TILT_DEG * Math.PI) / 180;
    const normal: F.V3 = unit(add(scale(thorax.axes[2], Math.cos(tilt)), scale(thorax.axes[1], Math.sin(tilt))));
    const up: F.V3 = thorax.axes[1];
    const u: F.V3 = unit(sub(up, scale(normal, dot(up, normal))));
    return { point: add(AutoMovieHumanF1Placement.frame("humerus").origin, scale(normal, OFFSET_MM)), normal, u, v: cross(normal, u) };
  }

  let memo: { ring: F.V3[]; centre: F.V3; corner: F.V3; course: F.V3[] } | null = null;

  /**
   * The ring, its centre, the corner and the arm's course, once. The ring is the largest closed loop of the plane's cut of the trunk's own
   * wall (the island the cut leaves in the axillary pocket is not the ring). Its centre is the loop's area centroid, a closed curve's own
   * centre, independent of where rays start and how densely they are spaced. The corner is the fixed point of `s = h share(angle(s))` along
   * the plane's normal, `h` the turn's half (`HALF_MM`) and the angle the engine's between the normal and the line from the corner to the
   * elbow centre; the corner stands `CORNER_PAST_MM` past it.
   */
  function solve(): { ring: F.V3[]; centre: F.V3; corner: F.V3; course: F.V3[] } {
    memo ??= resolve(STEP_MM, PHASES);
    return memo;
  }

  /** The ring, its centre, the corner and the course read at a given sampling of the trunk's loft (`STEP_MM`, `PHASES`). */
  export function resolve(step: number, phases: number): { ring: F.V3[]; centre: F.V3; corner: F.V3; course: F.V3[] } {
    const { point, normal, u, v } = plane();
    const stations: number[] = [];
    for (let s: number = STATIONS[0]; s <= STATIONS[1] + 1e-9; s += step) stations.push(s);
    const loft: AutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(AutoMovieHumanF1Trunk, stations);
    if (loft.chain === null) throw new Error("the trunk does not loft round the shoulder");
    const chain: NonNullable<AutoMovieViewLoft.IResult["chain"]> = loft.chain;
    const positions: number[] = [];
    const indices: number[] = [];
    for (const s of stations) {
      const read = AutoMovieLoftChain.sampler(chain, s);
      for (let j: number = 0; j < phases; ++j) positions.push(...read((2 * Math.PI * j) / phases));
    }
    for (let i: number = 0; i + 1 < stations.length; ++i)
      for (let j: number = 0; j < phases; ++j) {
        const a: number = i * phases + j;
        const b: number = i * phases + ((j + 1) % phases);
        indices.push(a, a + phases, b, b, a + phases, b + phases);
      }
    const section: AutoMovieMeshExtract.ISection = AutoMovieMeshExtract.outline({ positions, indices }, { origin: point, axes: [cross(v, u), u, v] }, [0], 0, 0.5, 0)[0]!;
    const area = (points: readonly (readonly number[])[]): number => points.reduce((t: number, p: readonly number[], i: number): number => t + p[0]! * points[(i + 1) % points.length]![1]! - points[(i + 1) % points.length]![0]! * p[1]!, 0) / 2;
    const loop: AutoMovieMeshExtract.ILoop | undefined = section.loops.filter((l: AutoMovieMeshExtract.ILoop): boolean => l.closed).sort((a: AutoMovieMeshExtract.ILoop, b: AutoMovieMeshExtract.ILoop): number => Math.abs(area(b.points)) - Math.abs(area(a.points)))[0];
    if (loop === undefined) throw new Error("the girdle's plane cuts no closed loop of the trunk's wall");
    let [twice, x, y]: number[] = [0, 0, 0];
    loop.points.forEach((p: readonly number[], i: number): void => {
      const q: readonly number[] = loop.points[(i + 1) % loop.points.length]!;
      const c: number = p[0]! * q[1]! - q[0]! * p[1]!;
      twice = twice! + c;
      x = x! + (p[0]! + q[0]!) * c;
      y = y! + (p[1]! + q[1]!) * c;
    });
    const world = (a: number, b: number): F.V3 => add(point, add(scale(u, a), scale(v, b)));
    const centre: F.V3 = world(x! / (3 * twice!), y! / (3 * twice!));
    const elbow: F.V3 = AutoMovieHumanF1Joints.lowerarm;
    let s: number = HALF_MM;
    for (let i: number = 0; i < 100; ++i) {
      const next: number = HALF_MM * AutoMovieHumanConicPose.share(AutoMovieHumanConicPose.angles([centre, add(centre, scale(normal, s)), elbow])[0]!);
      const settled: boolean = Math.abs(next - s) < 1e-9;
      s = next;
      if (settled) break;
    }
    const corner: F.V3 = add(centre, scale(normal, s + CORNER_PAST_MM));
    return {
      ring: loop.points.map((p: readonly number[]): F.V3 => world(p[0]!, p[1]!)),
      centre,
      corner,
      course: [centre, corner, AutoMovieHumanF1Joints.lowerarm, AutoMovieHumanF1Joints.hand, AutoMovieHumanF1Joints.middle1, AutoMovieHumanF1Joints.handEnd],
    };
  }

  /** The ring: the girdle's plane's cut of the trunk's own wall, its largest closed loop, mm. */
  export function ring(): F.V3[] {
    return solve().ring;
  }

  /** The ring's centre, mm: the loop's area centroid. */
  export function centre(): F.V3 {
    return solve().centre;
  }

  /** The corner the arm's course turns at, mm: on the plane's normal at the set-back of its own turn. */
  export function corner(): F.V3 {
    return solve().corner;
  }

  /** The arm's and the hand's course: the ring's centre, the corner, the elbow, the wrist, the middle finger's first joint and the hand's end. */
  export function course(): F.V3[] {
    return solve().course;
  }

  const sub = (a: F.V3, b: F.V3): F.V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const add = (a: F.V3, b: F.V3): F.V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const scale = (a: F.V3, k: number): F.V3 => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a: F.V3, b: F.V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a: F.V3, b: F.V3): F.V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = (a: F.V3): F.V3 => scale(a, 1 / Math.hypot(a[0], a[1], a[2]));
}
