import { AutoMovieConstructionViews, AutoMovieViewCurves, AutoMovieViewOutline, type IAutoMovieViewPart } from "@automovie/engine";
import { AutoMovieHumanWalkPart } from "../../../../../../packages/human/src/generation/limb/AutoMovieHumanWalkPart";
import { AutoMovieHumanDigitInterim } from "../../../../../../packages/human/src/generation/limb/AutoMovieHumanDigitInterim";
import { AutoMovieHumanDigitWalk } from "../../../../../../packages/human/src/generation/limb/AutoMovieHumanDigitWalk";
import { AutoMovieHumanToePart } from "../../../../../../packages/human/src/generation/foot/AutoMovieHumanToePart";
import type { AutoMovieHumanSiteViewPart } from "../../../../../../packages/human/src/generation/limb/AutoMovieHumanSiteViewPart";

/**
 * A walk's chart reflection carries the whole signed scalar source, not
 * only its values. The chosen straight course makes the expected world
 * edges linear and independently readable without a body or final skin.
 *
 * Scenarios:
 * 1. The caller's +v edge lies on negative world Z, with its own signed jet.
 * 2. The caller's -v edge lies on positive Z, with its bounds exchanged.
 * 3. Front edges keep their source identity and units across the adapter.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the actual WalkPart/source evaluator, unequal-depth DigitInterim/DigitWalk contact case and ToePart's explicit affine-source admission through the real frame converter.
 * @evidence contracts/testing.md#independent-expectations A vertical straight course has four closed-form signed linear edges. Depths12/6 on a level axis at height2 share plantar-2, including their absolute-edge mean. A declared X-directed toe origin from0 to4 at height1 stays on (s,1,0); a named point at/below the declared construction-roundoff threshold is admitted without changing caller data, and a point above it is refused. No anatomical tolerance is inferred.
 * @evidence contracts/testing.md#distinguishing-cases Unequal signs/slopes and finite bounds expose quarter/unit errors; different depths expose ratio averaging. Affine-source cases below/at/above its numeric policy boundary retain the same coordinate scale and query the actual reconstructed plane, distinguishing admission from point projection or a fitted origin.
 * @evidence contracts/testing.md#execution-ownership Synchronous source geometry only, with no human generation, private data, renderer, rig, process or final realization.
 */
export function test_human_walk_source_metadata(): void {
  const first: [number, number, number, number] = [3, 2, -4, -3];
  const last: [number, number, number, number] = [5, 4, -7, -6];
  const jets: NonNullable<AutoMovieHumanWalkPart.ISite["jets"]> = first.map((value: number, index: number): NonNullable<IAutoMovieViewPart.IKnot["jet"]> => ({ first: last[index]! - value, second: 0 })) as NonNullable<AutoMovieHumanWalkPart.ISite["jets"]>;
  const result: AutoMovieHumanSiteViewPart.IResult = AutoMovieHumanWalkPart.create({
    name: "metadata-course",
    centres: [[0, 0, 0], [0, 10, 0]],
    joints: [],
    u: [1, 0, 0],
    sites: [
      { site: "start", bone: 0, share: 0, edges: first, fullness: { shoulder: Math.SQRT2 - 1 }, jets },
      { site: "end", bone: 0, share: 1, edges: last, fullness: { shoulder: Math.SQRT2 - 1 }, jets },
    ],
    ranges: [{ minimum: 3, maximum: 5 }, { minimum: 2, maximum: 4 }, { minimum: -7, maximum: -4 }, { minimum: -6, maximum: -3 }],
    order: 16,
    samples: 16,
    gap: 2,
  });
  if (result.part === null) throw new Error(`Metadata course has no source: ${JSON.stringify(result.diagnostics)}`);
  const source: AutoMovieViewCurves.IResult = AutoMovieViewCurves.create(result.part);
  const defects: string[] = source.diagnostics.map((diagnostic: (typeof source.diagnostics)[number]): string => diagnostic.detail);
  const expectations: { name: AutoMovieViewCurves.ICurve["name"]; coordinate: 0 | 2; start: number; change: number }[] = [
    { name: "front.positive", coordinate: 0, start: 3, change: 2 },
    { name: "front.negative", coordinate: 0, start: -4, change: -3 },
    { name: "side.negative", coordinate: 2, start: -2, change: -2 },
    { name: "side.positive", coordinate: 2, start: 3, change: 3 },
  ];
  for (const expected of expectations) {
    const curve: AutoMovieViewCurves.ICurve = source.curves.find((item: AutoMovieViewCurves.ICurve): boolean => item.name === expected.name)!;
    for (const station of [0, 5, 10]) {
      const reading: AutoMovieViewCurves.IReading | string = AutoMovieViewCurves.at(curve, result.part.axis, station);
      if (typeof reading === "string") defects.push(reading);
      else {
        const value: number = expected.start + expected.change * station / 10;
        if (Math.abs(reading.point[expected.coordinate] - value) > 1e-10) defects.push(`${expected.name}@${station}: world edge ${reading.point[expected.coordinate]} instead of ${value}`);
        if (Math.abs(reading.scalar.parameterJet[0] - expected.change / 10) > 1e-10 || Math.abs(reading.scalar.parameterJet[1]) > 1e-10) defects.push(`${expected.name}@${station}: the linear source derivatives changed`);
      }
    }
  }
  const contactJets: NonNullable<AutoMovieHumanDigitWalk.ISiteLaw["jets"]> = [undefined, undefined, { first: 0, second: 0 }, undefined];
  const contactLaw = (depth: number): AutoMovieHumanDigitWalk.ISiteLaw => ({ breadth: 4, depth, dorsal: 1 - 2 / depth, shoulder: Math.SQRT2 - 1, jets: contactJets });
  const contact: AutoMovieHumanDigitWalk.IInput = { ...AutoMovieHumanDigitInterim.walk("unequal-contact-depths", [[0, 2, 0], [10, 2, 0], [20, 2, 0]], [0, 1, 0], contactLaw(12), contactLaw(6)), ranges: [undefined, undefined, { minimum: -2, maximum: 0 }, undefined] };
  const mean: AutoMovieHumanDigitWalk.ISiteLaw = contact.law("shaft 1");
  if (Math.abs(-mean.depth * (1 - mean.dorsal) + 2) > 1e-12 || mean.jets !== contactJets) defects.push("The unequal-depth mean moved the common plantar edge or lost its shared jets");
  const contactPart: AutoMovieHumanSiteViewPart.IResult = AutoMovieHumanDigitWalk.create(contact);
  if (contactPart.part === null) defects.push(`Contact course has no source: ${JSON.stringify(contactPart.diagnostics)}`);
  else for (const curve of AutoMovieViewCurves.create(contactPart.part).curves) {
    if (curve.outline === null) {
      defects.push(`${curve.name}: contact source failed admission`);
      continue;
    }
    for (const station of [...curve.outline.knots.map((knot: IAutoMovieViewPart.IKnot): number => knot.station), ...AutoMovieViewOutline.criticalStations(curve.outline)]) {
      const reading: AutoMovieViewCurves.IReading | string = AutoMovieViewCurves.at(curve, contactPart.part.axis, station);
      if (typeof reading === "string") defects.push(reading);
      else if (reading.point[1] < -1e-10) defects.push(`${curve.name}: unequal-depth contact source crosses the floor at ${station} mm`);
    }
  }
  // The declared numerical policy is tested at a fixed four-mm scale;
  // it is not copied into an anatomical acceptance tolerance.
  const allowance: number = 256 * Number.EPSILON;
  for (const multiple of [0.5, 1, 2]) {
    const displacement: number = multiple * allowance;
    const input: AutoMovieHumanToePart.IInput = {
      name: "affine-origin-policy", centres: [[0, 1, 0], [1, 1, displacement], [2, 1, 0], [3, 1, 0]], apex: [4, 1, 0], along: [1, 0, 0], height: 1,
      law: (): AutoMovieHumanDigitWalk.ISiteLaw => ({ breadth: 2, depth: 2, dorsal: 0.5, shoulder: Math.SQRT2 - 1 }), ranges: undefined, order: 16, gap: 1,
    };
    const declared: ReturnType<typeof AutoMovieHumanToePart.source> = AutoMovieHumanToePart.source(input);
    const failed: boolean = "diagnostics" in declared;
    if (failed !== (multiple > 1)) defects.push(`Affine-origin policy ${multiple}: unexpected admission state ${!failed}`);
    if (input.centres[1]![2] !== displacement) defects.push(`Affine-origin policy ${multiple}: the caller's point was changed`);
    if (!("diagnostics" in declared)) {
      const frame: ReturnType<typeof AutoMovieConstructionViews.frame> = AutoMovieConstructionViews.frame(declared.axis);
      if (typeof frame === "string") defects.push(frame);
      else {
        const point: [number, number, number] = frame.at(1).origin;
        if (Math.hypot(point[0] - 1, point[1] - 1, point[2]) > 1e-12) defects.push(`Affine-origin policy ${multiple}: the declared affine point was fitted to the admitted residual`);
      }
    }
  }
  if (defects.length !== 0) throw new Error(defects.join("\n"));
}
