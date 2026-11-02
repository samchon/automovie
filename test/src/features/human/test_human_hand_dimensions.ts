import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanHandLongitudinal as Longitudinal } from "../../../../packages/human/src/generation/AutoMovieHumanHandLongitudinal";
import { AutoMovieHumanHandSection as Palm } from "../../../../packages/human/src/generation/AutoMovieHumanHandSection";
import { AutoMovieHumanHandSectionSolve as Section } from "../../../../packages/human/src/generation/AutoMovieHumanHandSectionSolve";
import { nclose } from "../internal/nclose";

/**
 * Independent palm/hand lengths and breadth/girth stay independent and smooth.
 *
 * Scenarios:
 * 1. Three source landmarks reach their requested distances at every scale.
 * 2. Unequal palm/finger growth retains positive slope and C2 joins.
 * 3. Axis inversion recovers coordinates inside and outside the hand.
 * 4. A section's coupled breadth and girth close from several starting scales.
 * 5. A width-only correction leaves a known perimeter error visible.
 * 6. A tilted anatomical axis closes both projected surface lengths.
 * 7. Orthogonal, oblique, reflected and translated plane cuts retain their tapes.
 * 8. Unordered landmarks, impossible tapes and singular observers fail.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the longitudinal and two-axis section solvers, reads their mapped landmarks and derivatives, and independently measures rectangle corners after the returned scales. It cuts triangulated ring strips by the same section metric used by the construction and closes length observations along a tilted axis. It catches endpoint inflation, reversed spans, broken inverse maps and the old assumption that changing width leaves girth unchanged.
 * @evidence contracts/testing.md#independent-expectations Length expectations are the supplied millimetre distances; a rectangle of width 100 and thickness 30 has breadth 100 and convex-hull perimeter 260. The 45-degree cut expands thickness to 30 sqrt(2). An oblique section has Euclidean edge lengths read from its four corners; the length observer uses an explicit dot projection at 0.15 radians. Numerical derivative tolerances cover centred differences at a 1e-4 station step; 1e-5 mm is far below the whole-person hand tolerance. No generated person's coefficients enter these expectations.
 * @evidence contracts/testing.md#distinguishing-cases Exercises balanced and strongly unequal palm/finger scales, shifted and uniformly scaled source coordinates, both outer continuations, independent breadth/girth targets, axis-coupled oblique corners, projected endpoints, mirrored and translated plane cuts, and three starting guesses. Explicit failures cover invalid orders, nonfinite/negative data, perimeter below twice breadth, missing section, mismatched ring samples, invalid plane axes and dependent measurements. Whole-person skin, web and rig tests own anatomical sites and final consumer behavior.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU test reached by --include human_hand_dimensions. It creates small local mathematical fixtures and starts no person generator, process, browser or server.
 */
export function test_human_hand_dimensions(): void {
  for (const offset of [-37, 0, 120])
    for (const scale of [0.25, 1, 3])
      for (const palm of [20, 100, 170]) {
        const source: Longitudinal.ILandmarks = { wrist: offset, base: offset + 80 * scale, tip: offset + 200 * scale };
        const map: Longitudinal.IMap = Longitudinal.create(source, palm, 190);
        TestValidator.predicate("wrist endpoint", nclose(map.point(source.wrist), 0, 1e-9));
        TestValidator.predicate("palm endpoint", nclose(map.point(source.base), palm, 1e-9));
        TestValidator.predicate("tip endpoint", nclose(map.point(source.tip), 190, 1e-9));
        for (let i: number = -20; i <= 220; i++) {
          const station: number = offset + i * scale;
          TestValidator.predicate("positive local length", map.slope(station) > 0);
          TestValidator.predicate("inverse", nclose(map.inverse(map.point(station)), station, 1e-9));
          const step: number = 1e-4 * scale;
          const slope: number = (map.point(station + step) - map.point(station - step)) / (2 * step);
          TestValidator.predicate("first derivative", nclose(map.slope(station), slope, 1e-5));
          const curvature: number = (map.slope(station + step) - map.slope(station - step)) / (2 * step);
          TestValidator.predicate("second derivative", nclose(map.curvature(station), curvature, 1e-5));
        }
        for (const station of [source.wrist, source.base, source.tip]) {
          const step: number = 1e-5 * scale;
          TestValidator.predicate("C1 join", nclose(map.slope(station - step), map.slope(station + step), 1e-8));
          TestValidator.predicate("C2 join", nclose(map.curvature(station - step), map.curvature(station + step), 1e-5));
        }
      }

  for (const initial of [{ across: 1, through: 1 }, { across: 0.5, through: 3 }, { across: 2, through: 0.25 }]) {
    const scale: Section.IScale = Section.solve({ breadth: 100, girth: 260 }, initial, rectangle);
    TestValidator.predicate("rectangle width scale", nclose(scale.across, 1.25, 1e-7));
    TestValidator.predicate("rectangle thickness scale", nclose(scale.through, 1.5, 1e-7));
    const measures: Section.IMeasures = rectangle(scale);
    TestValidator.predicate("both section targets", nclose(measures.breadth, 100, 1e-5) && nclose(measures.girth, 260, 1e-5));

    const target: Section.IMeasures = oblique({ across: 1.25, through: 1.5 });
    const coupled: Section.IScale = Section.solve(target, initial, oblique);
    TestValidator.predicate("oblique width scale", nclose(coupled.across, 1.25, 1e-6));
    TestValidator.predicate("oblique thickness scale", nclose(coupled.through, 1.5, 1e-6));
  }

  const widthOnly: Section.IMeasures = rectangle({ across: 1.25, through: 1 });
  TestValidator.predicate("known missing depth correction is red", !nclose(widthOnly.girth, 260, 1));

  const source: Longitudinal.ILandmarks = { wrist: -40, base: 60, tip: 130 };
  const wanted: Longitudinal.IMeasures = { palm: 100, length: 180 };
  const tilt: number = 0.15;
  const observer: (map: Longitudinal.IMap) => Longitudinal.IMeasures = (map: Longitudinal.IMap): Longitudinal.IMeasures => ({
    palm: map.point(source.base) * Math.cos(tilt) + 12 * Math.sin(tilt),
    length: map.point(source.tip) * Math.cos(tilt) + 4 * Math.sin(tilt),
  });
  const unclosed: Longitudinal.IMeasures = observer(Longitudinal.create(source, wanted.palm, wanted.length));
  TestValidator.predicate("known projection error remains red", !nclose(unclosed.length, wanted.length, 1e-4));
  const projected: Longitudinal.IMeasures = observer(Longitudinal.fit(source, wanted, observer));
  TestValidator.predicate("projected palm closes", nclose(projected.palm, wanted.palm, 1e-5));
  TestValidator.predicate("projected length closes", nclose(projected.length, wanted.length, 1e-5));

  const rings: Palm.Point[][] = [-40, 40].map((y: number): Palm.Point[] => [[-50, y, -15], [50, y, -15], [50, y, 15], [-50, y, 15]]);
  for (const direction of [1, -1]) {
    const measured: Section.IMeasures = Palm.measure(rings, [0, 0, 0], [0, direction, 0], [direction, 0, 0]);
    TestValidator.predicate("cut breadth", nclose(measured.breadth, 100, 1e-9));
    TestValidator.predicate("cut convex hull tape", nclose(measured.girth, 260, 1e-9));
  }
  const tilted: Section.IMeasures = Palm.measure(rings, [0, 0, 0], [0, 1, 1], [1, 0, 0]);
  TestValidator.predicate("oblique cut perimeter", nclose(tilted.girth, 200 + 60 * Math.SQRT2, 1e-9));
  const translated: Palm.Point[][] = rings.map((ring: Palm.Point[]): Palm.Point[] => ring.map(([x, y, z]: Palm.Point): Palm.Point => [x + 77, y - 24, z + 31]));
  const translatedCut: Section.IMeasures = Palm.measure(translated, [77, -24, 31], [0, 1, 0], [1, 0, 0]);
  TestValidator.predicate("section translation", nclose(translatedCut.breadth, 100, 1e-9) && nclose(translatedCut.girth, 260, 1e-9));
  rejects((): unknown => Palm.measure(rings, [0, 100, 0], [0, 1, 0], [1, 0, 0]));
  rejects((): unknown => Palm.measure(rings, [0, 0, 0], [0, 1, 0], [0, 1, 0]));
  rejects((): unknown => Palm.measure([rings[0]!, rings[1]!.slice(1)], [0, 0, 0], [0, 1, 0], [1, 0, 0]));
  rejects((): unknown => Longitudinal.create({ wrist: 0, base: 100, tip: 200 }, 190, 190));
  rejects((): unknown => Longitudinal.create({ wrist: 0, base: 0, tip: 200 }, 100, 190));
  rejects((): unknown => Longitudinal.create({ wrist: NaN, base: 100, tip: 200 }, 100, 190));
  rejects((): unknown => Section.solve({ breadth: 100, girth: 199 }, { across: 1, through: 1 }, rectangle));
  rejects((): unknown => Section.solve({ breadth: -1, girth: 260 }, { across: 1, through: 1 }, rectangle));
  rejects((): unknown => Section.solve({ breadth: 100, girth: 260 }, { across: 1, through: 1 }, (): Section.IMeasures => ({ breadth: NaN, girth: NaN })));
  rejects((): unknown => Section.solve({ breadth: 100, girth: 260 }, { across: 1, through: 1 }, (scale: Section.IScale): Section.IMeasures => ({ breadth: scale.across, girth: 3 * scale.across })));
}

/** Breadth and perimeter of a rectangle with independent 80 mm and 20 mm sides. */
function rectangle(scale: Section.IScale): Section.IMeasures {
  const corners: [number, number][] = [[-40 * scale.across, -10 * scale.through], [40 * scale.across, -10 * scale.through], [40 * scale.across, 10 * scale.through], [-40 * scale.across, 10 * scale.through]];
  return measure(corners);
}

/** An oblique rectangle makes the observer's breadth depend on both axes. */
function oblique(scale: Section.IScale): Section.IMeasures {
  const corners: [number, number][] = [[-45, -5], [35, -15], [45, 5], [-35, 15]].map(([x, y]: number[]): [number, number] => [x! * scale.across, y! * scale.through]);
  return measure(corners);
}

/** Measure a known convex polygon from its corners, independently of either solver. */
function measure(corners: readonly [number, number][]): Section.IMeasures {
  const direction: [number, number] = [Math.cos(0.1), Math.sin(0.1)];
  const oblique: boolean = corners[0]![0] !== -corners[1]![0];
  const reaches: number[] = corners.map(([x, y]: [number, number]): number => oblique ? x * direction[0] + y * direction[1] : x);
  const girth: number = corners.reduce((sum: number, point: [number, number], i: number): number => {
    const next: [number, number] = corners[(i + 1) % corners.length]!;
    return sum + Math.hypot(next[0] - point[0], next[1] - point[1]);
  }, 0);
  return { breadth: Math.max(...reaches) - Math.min(...reaches), girth };
}

/** A malformed or underconstrained construction cannot silently become a scale. */
function rejects(operation: () => unknown): void {
  let thrown: boolean = false;
  try { operation(); } catch { thrown = true; }
  TestValidator.predicate("invalid hand dimensions rejected", thrown);
}
