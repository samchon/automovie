import type { IAutoMovieHumanBodyCalibration as Body } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanLoftChain as Chain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanCurveAudit as Curves } from "../internal/HumanCurveAudit";
import { HumanFixtureAudit } from "../internal/HumanFixtureAudit";

/**
 * A normal-turn finding carries degrees and a locator, never an invented physical gap.
 *
 * Scenarios:
 * 1. Two actual straight circular owners have zero differential normal turn.
 * 2. A quadratic radial flare produces the independently known angular defect.
 * 3. Doubling the authored radial acceleration gives the known nonlinear angular response.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the maintained complete curve consumer on actual harmonic circle extrusions, then selects its existing step finding without replacing normal evaluation. A straight control has no step, the actual flared surface is red, and changing its geometric acceleration changes the measured angle.
 * @evidence contracts/testing.md#independent-expectations For S(s,t)=(r(s)*cos(t),s,r(s)*sin(t)) with r=10+k*(s-20)^2, every normal turns by atan(2*k*16)-atan(2*k*0.1) radians between the declared samples. Quadratic symmetric station differences and circular phase differences preserve those normal directions exactly in real arithmetic. A 0.000001 degree allowance covers finite double evaluation and acos conditioning here; it is not an anatomical threshold. The existing diagnostic point is independently [0,20,0], a joint anchor rather than a measured skin point.
 * @evidence contracts/testing.md#distinguishing-cases Includes zero acceleration, an actual positive-radius flare and a doubled acceleration with an independently calculated nonlinear angular delta. It checks scalar degrees, coordinate millimetres, diagnostic-anchor meaning and formula interpretation on the actual emitted finding. It does not interpret that angle as a positional seam gap.
 * @evidence contracts/testing.md#execution-ownership Synchronous portable CPU unit using local analytic curves and the maintained curve audit. No person generation, file, process, browser, GPU or global state is used.
 */
export function test_human_curve_metric_units(): void {
  const audit: HumanFixtureAudit = new HumanFixtureAudit("curve-metric-units", "actual-angular-step");
  let original: number | undefined;
  for (const acceleration of [0, 0.01, 0.02])
    audit.run({ scenario: acceleration === 0 ? "1 straight normal" : acceleration === 0.01 ? "2 actual angular defect" : "3 known acceleration delta", part: ["trunk", "upper"], station: 20, phase: "back median", acceleration }, (): void => {
      const body: Body = { stature: 40, chains: [owner("trunk", [0, 10, 20], 0), owner("upper", [20, 30, 40], acceleration)], events: [], poles: [], apertures: [], eyes: [] };
      const findings: Curves.IHumanCurveFinding[] = Curves.auditHumanCurves("analytic-field", body, /^trunk$/);
      const step: Curves.IHumanCurveFinding | undefined = findings.find((finding: Curves.IHumanCurveFinding): boolean => finding.rule === "step");
      if (acceleration === 0) audit.check("straight geometry has no angular defect", step === undefined);
      else {
        if (step === undefined) throw new Error("The actual radial flare omitted its normal-turn finding");
        const expected: number = angle(acceleration);
        audit.scope({ scenario: acceleration === 0.01 ? "2 actual angular defect" : "3 known acceleration delta", part: step.region, station: 20, phase: "back median", coordinates: step.point, observed: step.value, expected, metric: step.metric });
        audit.measure("independent actual normal-turn angle", step.value, expected, 1e-6, "deg");
        audit.reject("actual flare is red against straight normal", step.value, 0, step.limit, "deg");
        audit.category("scalar degree unit", step.metric.units, "deg");
        audit.category("coordinate millimetre unit", step.metric.coordinateUnits, "mm");
        audit.category("actual point meaning", step.metric.pointRole, "diagnostic-anchor");
        audit.vector("joint anchor is retained without claiming a skin point", step.point, [0, 20, 0], 0, "mm");
        if (acceleration === 0.01) original = step.value;
        else audit.measure("known acceleration response", step.value - original!, angle(0.02) - angle(0.01), 2e-6, "deg");
      }
    });
  audit.finish();
}

/** Exact analytic circle with a quadratic radial field and its independent polynomial jets. */
function owner(name: string, stations: number[], acceleration: number): Chain {
  return { name, order: 1, rule: "polar", samples: 96, layers: stations.map((y: number): Chain.ILayer => {
    const radius: number = 10 + acceleration * (y - 20) ** 2;
    const derivative: number = 2 * acceleration * (y - 20);
    return { y, coefficients: [0, radius, 0, 0, 0, radius], slopes: [0, derivative, 0, 0, 0, derivative], curvatures: [0, 2 * acceleration, 0, 0, 0, 2 * acceleration] };
  }) };
}

/** Analytic difference of surface normal directions, converted once to degrees. */
function angle(acceleration: number): number { return (Math.atan(32 * acceleration) - Math.atan(0.2 * acceleration)) * 180 / Math.PI; }
