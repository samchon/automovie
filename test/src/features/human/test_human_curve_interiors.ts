import { AutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanBodyCalibration } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { HumanCurveAudit } from "../internal/HumanCurveAudit";
import { HumanFixtureAudit } from "../internal/HumanFixtureAudit";
import { HumanLoftSectionWinding } from "../internal/HumanLoftSectionWinding";

/** World point in calibration millimetres. */
type Point = [number, number, number];

/**
 * Interior section failures cannot hide behind identical principal sections.
 *
 * Scenarios:
 * 1. An elliptic tube has positive area and no surface-health finding.
 * 2. Identical end and midpoint sections conceal a reversed quarter section.
 * 3. The same interior excursion exceeds its span although its midpoint does not.
 * 4. Moving and turning a part preserves its locally measured area and verdict.
 * 5. Enlarging an ellipse semiaxis by a quarter enlarges its area by a quarter.
 * 6. A nonfinite emitted coordinate is reported as a failure.
 * 7. A line-shaped middle section fails despite finite coordinates, positive
 *    perimeter, unreversed endpoints and no overshoot; a thin ellipse survives.
 * 8. A relief producing NaN only at a principal finger ring is rejected by the
 *    actual auditor; finite controls and a known height delta still evaluate.
 * 9. Exact zero-area cancellation at subnormal products is unresolved, as is
 *    an actual loft whose projected area underflows. A larger ellipse resolves.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates actual production loft rings between layers and calls the shared curve auditor. Intermediate reversal and collapse are red while correct elliptic tubes are green. Every independent transformed fixture runs through the shared exception collector, so an unexpected production failure cannot suppress the remaining fixtures or final report. No person generation or substitute evaluator is used.
 * @evidence contracts/testing.md#independent-expectations A simple oriented elliptic section has positive signed area, its area scales linearly with either semiaxis, and rigid movement preserves both properties. A folded intermediate section reverses orientation; a line has zero area despite nonzero perimeter. The 96-edge area approximation is within 0.5 square millimetres of the analytic 20 by 10 millimetre ellipse. Cubic B-spline central basis weights are 2/3, so a central height change of four gives displacement 16/9. The dyadic polygon's signed determinants cancel exactly as three ab minus 3ab; IEEE rounded products cannot establish nonzero area. Relative accumulation error plus absolute gradual-underflow error supplies sampled area resolution, independently of anatomical tolerance; this sampling cannot certify an unsampled narrower defect.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts sound, reversed, collapsed and thin positive-area tubes under original and rigidly rotated frames, preserves equal endpoint and midpoint controls for the reversal case, verifies a known semiaxis response and rejects nonfinite output. Whole-person anatomy, joins, skin triangulation and pose tests own assembled acceptance.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU test reached by --include human_curve_interiors, using the actual loft evaluator and shared audit without processes, browsers, GPUs or monkeypatches.
 */
export function test_human_curve_interiors(): void {
  const audit: HumanFixtureAudit = new HumanFixtureAudit("analytic-elliptic-loft", "section-interiors");
  const phases: number[] = Array.from({ length: 96 }, (_: unknown, i: number): number => 2 * Math.PI * i / 96);
  const stations: number[] = [0, 5, 10, 15, 20];
  for (const turned of [false, true]) {
    audit.run({ scenario: "ellipse, reversal and input response", turned, stations, phases }, (): void => {
    const normal: IAutoMovieHumanLoftChain = fixture(false, turned, 20);
    const folded: IAutoMovieHumanLoftChain = fixture(true, turned, 20);
    const normalRings: Point[][] = stations.map((station: number): Point[] => AutoMovieHumanLoftChain.ring(normal, station, phases));
    const foldedRings: Point[][] = stations.map((station: number): Point[] => AutoMovieHumanLoftChain.ring(folded, station, phases));
    const measured: ReturnType<typeof HumanLoftSectionWinding> = HumanLoftSectionWinding(normal, stations, normalRings);
    const defective: ReturnType<typeof HumanLoftSectionWinding> = HumanLoftSectionWinding(folded, stations, foldedRings);
    for (let ordinal: number = 0; ordinal < measured.length; ordinal++) {
      audit.scope({ chain: normal.name, interval: [0, 20], station: stations[ordinal], phase: "whole section", direction: "local u cross v", coordinates: normalRings[ordinal]![0], turned });
      audit.check("finite emitted section", measured[ordinal]!.finite);
      audit.measure("analytic ellipse area", measured[ordinal]!.area, Math.PI * 20 * 10, 0.5, "mm^2");
      if ([0, 2, 4].includes(ordinal))
        for (let vertex: number = 0; vertex < phases.length; vertex++) {
          audit.scope({ chain: normal.name, interval: [0, 20], station: stations[ordinal], phase: phases[vertex], direction: "world xyz", coordinates: foldedRings[ordinal]![vertex], turned });
          audit.vector("identical endpoint or midpoint", foldedRings[ordinal]![vertex]!, normalRings[ordinal]![vertex]!, 1e-6, "mm");
        }
      audit.scope({ chain: folded.name, interval: [0, 20], station: stations[ordinal], phase: "whole section", direction: "local u cross v", coordinates: foldedRings[ordinal]![0], area: defective[ordinal]!.area, turned });
      audit.category("manufactured section orientation", defective[ordinal]!.area < 0 ? "negative" : "positive", ordinal === 1 ? "negative" : "positive");
    }
    const healthy: HumanCurveAudit.IHumanCurveFinding[] = HumanCurveAudit.auditHumanCurves("fixture", body(normal), /^diagnostic\./);
    const failures: HumanCurveAudit.IHumanCurveFinding[] = HumanCurveAudit.auditHumanCurves("fixture", body(folded), /^diagnostic\./);
    audit.scope({ chain: normal.name, interval: [0, 20], turned, findings: healthy });
    audit.measure("normal surface findings", healthy.length, 0, 0, "count");
    audit.scope({ chain: folded.name, interval: [0, 20], turned, findings: failures });
    audit.check("manufactured interior reversal is rejected", failures.some((finding: HumanCurveAudit.IHumanCurveFinding): boolean => finding.rule === "winding" && finding.where.includes("interior")));
    audit.check("quarter-span excursion is rejected", failures.some((finding: HumanCurveAudit.IHumanCurveFinding): boolean => finding.rule === "overshoot"));
    const enlarged: IAutoMovieHumanLoftChain = fixture(false, turned, 25);
    const largerRings: Point[][] = stations.map((station: number): Point[] => AutoMovieHumanLoftChain.ring(enlarged, station, phases));
    const larger: ReturnType<typeof HumanLoftSectionWinding> = HumanLoftSectionWinding(enlarged, stations, largerRings);
    for (let ordinal: number = 0; ordinal < larger.length; ordinal++) {
      audit.scope({ chain: enlarged.name, interval: [0, 20], station: stations[ordinal], phase: "whole section", direction: "local u cross v", coordinates: largerRings[ordinal]![0], acrossBefore: 20, acrossAfter: 25, turned });
      audit.measure("semiaxis input response", larger[ordinal]!.area / measured[ordinal]!.area, 1.25, 1e-6, "ratio");
    }
    const broken: Point[][] = normalRings.map((ring: Point[]): Point[] => ring.map((point: Point): Point => [...point]));
    broken[1]![0]![0] = NaN;
    audit.scope({ chain: normal.name, interval: [0, 20], station: stations[1], phase: phases[0], direction: "world x", coordinates: broken[1]![0], turned });
    audit.check("nonfinite output is rejected", !HumanLoftSectionWinding(normal, stations, broken)[1]!.finite);
    });
    audit.run({ scenario: "finite line collapse", turned, direction: "own section plane", units: "mm" }, (): void => {
      const chain: IAutoMovieHumanLoftChain = collapseFixture(turned);
      const sampled: number[] = [0, 250, 500, 750, 1000];
      const rings: Point[][] = sampled.map((station: number): Point[] => AutoMovieHumanLoftChain.ring(chain, station, phases));
      const readings: ReturnType<typeof HumanLoftSectionWinding> = HumanLoftSectionWinding(chain, sampled, rings);
      const findings: HumanCurveAudit.IHumanCurveFinding[] = HumanCurveAudit.auditHumanCurves("collapsed-interior", body(chain), /^diagnostic\./);
      audit.scope({ scenario: "finite line collapse", chain: chain.name, interval: [0, 1000], station: 500, phase: "whole section", direction: "local u cross v", coordinates: rings[2], area: readings[2]!.area, areaError: readings[2]!.areaError, findings, turned });
      audit.check("collapsed emitted coordinates remain finite", readings[2]!.finite);
      audit.check("line area is unresolved", !readings[2]!.resolved);
      audit.measure("line has zero projected area", readings[2]!.area, 0, readings[2]!.areaError, "mm^2");
      audit.check("all endpoint orientations stay positive", readings[0]!.area > 0 && readings[4]!.area > 0);
      audit.check("no sampled orientation reverses", readings.every((reading: ReturnType<typeof HumanLoftSectionWinding>[number]): boolean => reading.area >= -reading.areaError));
      audit.check("actual shared auditor rejects the collapse", findings.some((finding: HumanCurveAudit.IHumanCurveFinding): boolean => finding.rule === "collapse" && finding.where.includes("500")));
      audit.measure("collapse does not rely on overshoot or reversed winding", findings.filter((finding: HumanCurveAudit.IHumanCurveFinding): boolean => finding.rule === "winding" || finding.rule === "overshoot").length, 0, 0, "count");
    });
    audit.run({ scenario: "thin positive area", turned, semiaxis: 0.001 }, (): void => {
      const chain: IAutoMovieHumanLoftChain = fixture(false, turned, 0.001);
      const rings: Point[][] = stations.map((station: number): Point[] => AutoMovieHumanLoftChain.ring(chain, station, phases));
      const readings: ReturnType<typeof HumanLoftSectionWinding> = HumanLoftSectionWinding(chain, stations, rings);
      for (const reading of readings) {
        audit.scope({ scenario: "thin positive area", chain: chain.name, station: reading.station, direction: "own section plane", area: reading.area, areaError: reading.areaError, turned });
        audit.check("thin finite ellipse remains resolved", reading.finite && reading.resolved);
      }
    });
  }
  audit.run({ scenario: "8 actual principal relief output", chain: "finger.left.diagnostic", station: 20, phase: Math.PI, units: "mm" }, (): void => {
    const normal: IAutoMovieHumanLoftChain = reliefFixture(0);
    const defective: IAutoMovieHumanLoftChain = reliefFixture(NaN);
    const changed: IAutoMovieHumanLoftChain = reliefFixture(4);
    const base: Point = AutoMovieHumanLoftChain.ring(normal, 20, [Math.PI])[0]!;
    const after: Point = AutoMovieHumanLoftChain.ring(changed, 20, [Math.PI])[0]!;
    const broken: Point = AutoMovieHumanLoftChain.ring(defective, 20, [Math.PI])[0]!;
    const healthy: HumanCurveAudit.IHumanCurveFinding[] = HumanCurveAudit.auditHumanCurves("finite-relief", body(normal), /^finger\.left\.diagnostic$/);
    const findings: HumanCurveAudit.IHumanCurveFinding[] = HumanCurveAudit.auditHumanCurves("invalid-principal-relief", body(defective), /^finger\.left\.diagnostic$/);
    audit.scope({ scenario: "8 actual principal relief output", chain: normal.name, interval: [0,40], station: 20, phase: Math.PI, coordinates: { base, after, broken }, findings });
    audit.measure("normal evaluated relief has no findings", healthy.length, 0, 0, "count");
    audit.check("actual principal coordinates are nonfinite", !broken.every(Number.isFinite));
    audit.check("principal output defect reaches the real consumer", findings.some((finding: HumanCurveAudit.IHumanCurveFinding): boolean => finding.rule === "finite" && finding.where.includes("principal at 20")));
    audit.vector("known relief control displacement", after.map((value: number, index: number): number => value - base[index]!), [16/9,0,0], 1e-10, "mm");
    for (const station of [0,5,10,15,25,30,35,40]) audit.check("adjacent sampled ring remains finite at " + station.toString(), AutoMovieHumanLoftChain.ring(defective, station, phases).every((point: Point): boolean => point.every(Number.isFinite)));
  });
  audit.run({ scenario: "9 gradual underflow", units: "mm^2" }, (): void => {
    const a: number = 2 ** -537;
    const b: number = 2 ** -538;
    const chain: IAutoMovieHumanLoftChain = { name: "diagnostic.dyadic", order: 1, rule: "polar", samples: 96, layers: [0,20].map((y: number): IAutoMovieHumanLoftChain.ILayer => ({ y, coefficients: [0,a,0,0,0,b], slopes: [0,0,0,0,0,0] })) };
    const O: Point = [0,0,0]; const A: Point = [a,0,0]; const B: Point = [0,0,b]; const C: Point = [0,0,3*b];
    const polygon: Point[] = [O,A,B,O,A,B,O,A,B,O,C,A];
    const zero: ReturnType<typeof HumanLoftSectionWinding>[number] = HumanLoftSectionWinding(chain,[0],[polygon])[0]!;
    const actual: Point[] = AutoMovieHumanLoftChain.ring(chain,0,phases);
    const tiny: ReturnType<typeof HumanLoftSectionWinding>[number] = HumanLoftSectionWinding(chain,[0],[actual])[0]!;
    audit.scope({ scenario: "9 exact zero dyadic polygon", chain: chain.name, station: 0, coordinates: polygon, reading: zero });
    audit.check("finite dyadic cancellation remains unresolved", zero.finite && !zero.resolved);
    audit.bound("absolute underflow allowance is positive", zero.areaError, 0, ">", "mm^2");
    audit.scope({ scenario: "9 actual underflowing loft", chain: chain.name, station: 0, coordinates: actual, reading: tiny });
    audit.check("actual underflowing section is unresolved", tiny.finite && !tiny.resolved);
    const larger: IAutoMovieHumanLoftChain = { ...chain, layers: chain.layers.map((layer: IAutoMovieHumanLoftChain.ILayer): IAutoMovieHumanLoftChain.ILayer => ({ ...layer, coefficients: [0,2 ** -500,0,0,0,2 ** -501] })) };
    const resolved: ReturnType<typeof HumanLoftSectionWinding>[number] = HumanLoftSectionWinding(larger,[0],[AutoMovieHumanLoftChain.ring(larger,0,phases)])[0]!;
    audit.scope({ scenario: "9 representable positive area control", chain: larger.name, station: 0, reading: resolved });
    audit.check("representable positive area remains resolved", resolved.finite && resolved.resolved);
  });
  audit.finish();
}

/** A narrow real relief isolates a principal-ring failure from all interval samples. */
function reliefFixture(height: number): IAutoMovieHumanLoftChain {
  return { name: "finger.left.diagnostic", order: 1, rule: "polar", samples: 96,
    layers: [0,20,40].map((y: number): IAutoMovieHumanLoftChain.ILayer => ({ y, coefficients: [0,20,0,0,0,10], slopes: [0,0,0,0,0,0] })),
    reliefs: [{ name: "principal-output", stations: [19.9,20.1], phases: [0,2*Math.PI], axis: [1,0,0], rows: 7, columns: 7, heights: Array.from({length:49}, (_: unknown, index: number): number => index === 24 ? height : 0) }],
  };
}

/** An analytic ellipse at both keys; opposed interior motion is an imposed defect. */
function fixture(folded: boolean, turned: boolean, across: number): IAutoMovieHumanLoftChain {
  const angle: number = turned ? Math.PI / 3 : 0;
  const cosine: number = Math.cos(angle);
  const sine: number = Math.sin(angle);
  return {
    name: "diagnostic.loft", order: 1, rule: "polar", samples: 96,
    layers: [0, 20].map((station: number): IAutoMovieHumanLoftChain.ILayer => ({
      y: station,
      frame: { origin: [100 - sine * station, 40 + cosine * station, -70], u: [cosine, sine, 0], v: [0, 0, 1] },
      coefficients: [0, across, 0, 0, 0, 10],
      slopes: [0, folded ? -20 : 0, 0, 0, 0, 0],
    })),
  };
}

/** A single real loft without unrelated anatomy or consumers. */
function body(chain: IAutoMovieHumanLoftChain): IAutoMovieHumanBodyCalibration {
  return { stature: 20, chains: [chain], events: [], poles: [], apertures: [], eyes: [] };
}

/** Hermite end slopes make the actual middle X semiaxis zero without reversing it. */
function collapseFixture(turned: boolean): IAutoMovieHumanLoftChain {
  const chain: IAutoMovieHumanLoftChain = fixture(false, turned, 20);
  const angle: number = turned ? Math.PI / 3 : 0;
  chain.layers.forEach((layer: IAutoMovieHumanLoftChain.ILayer, index: number): void => {
    layer.y = index * 1000;
    layer.frame!.origin = [100 - Math.sin(angle) * layer.y, 40 + Math.cos(angle) * layer.y, -70];
    layer.slopes[1] = index === 0 ? -0.08 : 0.08;
  });
  return chain;
}
