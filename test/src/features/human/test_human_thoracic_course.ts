import { AutoMovieHumanBodySurface as Surface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import { AutoMovieHumanThoracicCourse as Course } from "../../../../packages/human/src/generation/AutoMovieHumanThoracicCourse";
import { AutoMovieHumanThoracicCrossing as Crossing } from "../../../../packages/human/src/generation/AutoMovieHumanThoracicCrossing";
import { AutoMovieHumanTrunkBoundary as Boundary } from "../../../../packages/human/src/generation/AutoMovieHumanTrunkBoundary";
import type { IAutoMovieHumanBodyCalibration as Body } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanHorizontalChain as Horizontal } from "../../../../packages/human/src/lofting/AutoMovieHumanHorizontalChain";
import { AutoMovieHumanLoftChain as Loft } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain as Chain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanFixtureAudit } from "../internal/HumanFixtureAudit";
import { HumanThoracicSkinCourse as Skin } from "../internal/HumanThoracicSkinCourse";

/**
 * A surface-course length is physical arclength, not station displacement.
 *
 * Scenarios:
 * 1. A straight circular tube with linear axial lift has length 1.2 times its
 *    material span in both source evaluation and independently emitted skin.
 * 2. Actual doubled physical advance is red against that same length law.
 * 3. Moving the material endpoint by 10 mm changes physical length by 12 mm.
 * 4. Adjacent actual owners retain the same length through their shared seam,
 *    including all sampled interiors and a reversed traversal.
 * 5. Missing owners, unreachable endpoints, nonfinite actual output and a
 *    missing emitted face mapping fail with their intended native causes.
 * 6. A positive, smoothly narrowing tube admits a surface meridian although
 *    the original linear lateral trial leaves the actual surface halfway.
 * 7. A rotated positive circle has an off-grid tangent, two near-tangent
 *    crossings and an exterior refusal, all resolved by actual spline extrema.
 * 8. The same planar world patch has different owner phases; physical source
 *    and emitted-skin courses remain invariant, while disjoint owners refuse.
 * 9. The complete neck boundary retains original source coefficients and lift;
 *    its actual re-filtered defect is red and a ten-mm world shift responds.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls ThoracicCourse, ThoracicCrossing and the real BodySurface producer, then independently intersects actual skin triangles using published material coordinates. The normal length is green, a physically over-advanced source and its emitted skin are red, and a known endpoint displacement has the analytic response. Actual off-grid tangent and crossing witnesses distinguish the old sampled refusal. No circumference target chooses a site.
 * @evidence contracts/testing.md#independent-expectations The authored surface is (circleX,(1+a)s,circleZ), so its constant-phase course has exact length (1+a)|delta s|: 24 mm at a=0.2 and 40 mm at a=1 over 20 material mm. Straight emitted cardinal courses agree within 0.00000001 mm arithmetic allowance. The taper independently authors exact cardinal B-spline coefficients using eigenvalue (4+2cos(2pi/N))/6; its side meridian is (0,s,6+4(1-s/20)^2), with integral length 25 times (0.4 sqrt(1.16)+asinh(0.4)). Curvature at most 0.02/mm and half-mm parameter pitch bound the forty chord deficits below 0.00011 mm, inside the 0.001 mm allowance. Its middle side is 7, excluding the old trial coordinate 8. For an eighteen-control rotated circle, symmetry fixes the off-grid maximum at span 3.5 and independent cubic weights [1,23,23,1]/48 give its height. Changes of 0.00001 mm toward the interior and exterior distinguish two crossings from none. The independent triangle observer imports neither source-course code nor loft evaluation. This is numerical semantics, not clinical identity or a general integration certificate.
 * @evidence contracts/testing.md#distinguishing-cases Includes both directions, interval interiors, a shared owner seam with both equal and unequal chart phases, positive circular and curved/tapering domains, physical lift, the old vertical-only and actual linear-lateral defects, off-grid tangent/interior/exterior endpoints, a known endpoint change, and exact intended failures. The chart control has an exact planar front patch X=10: physical Z=2 has phase pi/8 on its first owner and pi/16 on its second. Changing Z to 3 retains physical length twenty and moves every observed point by one millimetre; the old wrong-chart point is physically Z=1. Translating the second actual owner forty millimetres destroys all seam intersections and must refuse. This local patch does not certify the entire anatomical boundary. The nine-person body evidence owns real parameter-domain acceptance and all composed skin differences.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous portable CPU unit with two analytic chain owners and the actual mesh producer; no person, host, process, browser or GPU is required.
 */
export function test_human_thoracic_course(): void {
  /** All numeric and refusal cases finish before their combined report. */
  const audit: HumanFixtureAudit = new HumanFixtureAudit("physical-thoracic-course", "source-and-emitted-skin-course");
  for (const reversed of [false, true])
    for (const split of [false, true])
      audit.run({ scenario: "1-4 physical source and emitted course", part: split ? ["lower", "upper"] : ["column"], interval: [0, 10, 20, 30], station: reversed ? [20, 0] : [0, 20], phase: 0, reversed, split }, (): void => {
        /** Both owners use the same exact physical continuation at their seam. */
        const normal: Chain[] = split ? [tube("lower", [0, 5, 10], 0.2), tube("upper", [10, 20, 30], 0.2)] : [tube("column", [0, 10, 20, 30], 0.2)];
        /** This is an actual differently lifted surface, not a constant defective reading. */
        const defect: Chain[] = split ? [tube("lower", [0, 5, 10], 1), tube("upper", [10, 20, 30], 1)] : [tube("column", [0, 10, 20, 30], 1)];
        /** Endpoints are geometry-only and do not read the expected length. */
        const from: Course.IAddress = { station: reversed ? 20 : 0, lateral: 0 };
        /** A fixed model endpoint has no dependence on target girth. */
        const to: Course.IAddress = { station: reversed ? 0 : 20, lateral: 0 };
        /** Production source reading includes its actual world lift. */
        const actual: Course.IReading = Course.read(normal, from, to);
        /** Independent triangle intersections read the actual mesh consumer. */
        const physical: Skin.IReading = Skin.read(mesh(normal), new Set(normal.map((chain: Chain): string => chain.name)), from, to, actual.addresses);
        /** The same source oracle evaluates the real defective geometry. */
        const wrong: Course.IReading = Course.read(defect, from, to);
        /** The same independent skin observer evaluates the real defective mesh. */
        const wrongSkin: Skin.IReading = Skin.read(mesh(defect), new Set(defect.map((chain: Chain): string => chain.name)), from, to, wrong.addresses);
        audit.scope({ scenario: "1-4 physical source and emitted course", part: normal.map((chain: Chain): string => chain.name), interval: [0, 10, 20, 30], station: [from, to], phase: 0, coordinates: physical.points, triangles: physical.triangles, reversed, split });
        audit.measure("source physical course", actual.length, 24, 1e-8, "mm");
        audit.measure("independent emitted physical course", physical.length, 24, 1e-8, "mm");
        audit.reject("vertical displacement is an invalid physical length", Math.abs(to.station - from.station), 24, 1e-8, "mm");
        audit.measure("actual defective physical advance", wrong.length, 40, 1e-8, "mm");
        audit.reject("actual defective source rejected", wrong.length, 24, 1e-8, "mm");
        audit.reject("actual defective mesh rejected", wrongSkin.length, 24, 1e-8, "mm");
        /** Extend only the end of the same geometrically authored course. */
        const extended: Course.IAddress = { station: reversed ? -0 : 30, lateral: 0 };
        /** Reverse traversal extends its starting endpoint instead. */
        const longerFrom: Course.IAddress = reversed ? { station: 30, lateral: 0 } : from;
        audit.measure("known endpoint response on source", Course.read(normal, longerFrom, extended).length - actual.length, 12, 1e-8, "mm");
        audit.measure("known endpoint response on emitted skin", Skin.read(mesh(normal), new Set(normal.map((chain: Chain): string => chain.name)), longerFrom, extended).length - physical.length, 12, 1e-8, "mm");
        for (let index: number = 0; index < actual.points.length; index++) {
          /** Uniform material samples have a known physical height and constant cardinal section. */
          const station: number = actual.addresses[index]!.station;
          audit.scope({ scenario: "4 actual interval and seam point", part: normal.map((chain: Chain): string => chain.name), interval: station <= 10 ? [0, 10] : [10, 30], station, phase: 0, coordinates: actual.points[index] });
          audit.measure("physical lifted station", actual.points[index]![1], 1.2 * station, 1e-9, "mm");
        }
      });

  audit.run({ scenario: "6 actual narrowing surface and old unreachable trial", part: "tapered", interval: [0, 10, 20], station: [0, 20], phase: Math.PI / 2 }, (): void => {
    /** Strictly positive circular sections form a regular finite tube. */
    const original: Chain = tube("tapered", [0, 10, 20], 0);
    /** The three-point cardinal B-spline filter has eigenvalue (4+2cos(h))/6. */
    const eigenvalue: number = (4 + 2 * Math.cos(2 * Math.PI / original.order)) / 6;
    /** Coefficients and both derivatives author the exact quadratic radius. */
    const tapered: Chain = { ...original, layers: original.layers.map((layer: Chain.ILayer): Chain.ILayer => {
      const radius: number = 6 + 4 * (1 - layer.y / 20) ** 2;
      const basis: number[] = Array.from({ length: 2 * original.order }, (_: unknown, index: number): number => (index < original.order ? Math.cos(2 * Math.PI * index / original.order) : Math.sin(2 * Math.PI * (index - original.order) / original.order)) / eigenvalue);
      return { ...layer, coefficients: basis.map((value: number): number => value * radius), slopes: basis.map((value: number): number => value * (-0.4 + 0.02 * layer.y)), curvatures: basis.map((value: number): number => value * 0.02) };
    }) };
    /** Both endpoints stay at their declared physical side, without a clamp. */
    const from: Course.IAddress = { station: 0, lateral: 10 };
    /** The final surface has radius six, so this endpoint is also admitted. */
    const to: Course.IAddress = { station: 20, lateral: 6 };
    /** Actual source evaluation chooses a surface-supported guide. */
    const normal: Course.IReading = Course.read([tapered], from, to);
    /** The metric's constant-phase minimizer has this independent integral. */
    const expected: number = 25 * (0.4 * Math.sqrt(1.16) + Math.asinh(0.4));
    /** The discarded trial's middle lateral coordinate derives only from its endpoints. */
    const oldMiddle: number = (from.lateral + to.lateral) / 2;
    /** Independently evaluate the actual ring, not an implementation residual. */
    const middle: [number, number, number][] = Loft.ring(tapered, 10, Array.from({ length: 256 }, (_: unknown, index: number): number => 2 * Math.PI * index / 256));
    audit.scope({ scenario: "6 normal taper and original unsupported trial", part: tapered.name, interval: [0, 20], station: 10, phase: Math.PI / 2, coordinates: middle[64], sourceCourse: normal.points });
    audit.measure("normal finite surface meridian", normal.length, expected, 0.001, "mm");
    audit.measure("known actual middle radius", Math.max(...middle.map((point: [number, number, number]): number => point[2])), 7, 1e-10, "mm");
    audit.bound("original linear-lateral trial leaves actual skin", oldMiddle, Math.max(...middle.map((point: [number, number, number]): number => point[2])), ">", "mm");
    for (let index: number = 0; index < normal.points.length; index++) {
      /** A shortest meridian stays at the side; it never fabricates a point off the tube. */
      const station: number = normal.addresses[index]!.station;
      audit.scope({ scenario: "6 actual supported curved path", part: tapered.name, interval: station <= 10 ? 0 : 1, station, phase: Math.PI / 2, coordinates: normal.points[index] });
      audit.vector("independently authored physical meridian", normal.points[index]!, [0, station, 6 + 4 * (1 - station / 20) ** 2], 1e-6, "mm");
    }
  });

  audit.run({ scenario: "5 intended unavailable source and skin", part: "column", interval: [0, 20], station: [0, 20], phase: 0 }, (): void => {
    /** The same normal source supplies malformed clones without replacing production behavior. */
    const normal: Chain = tube("column", [0, 10, 20], 0.2);
    /** A nonfinite actual spline coefficient poisons evaluated source points. */
    const nonfinite: Chain = structuredClone(normal);
    nonfinite.layers[1]!.coefficients[0] = NaN;
    refuse(audit, (): unknown => Course.read([], { station: 0, lateral: 0 }, { station: 20, lateral: 0 }), "A thoracic course station has no surface owner");
    refuse(audit, (): unknown => Course.read([normal], { station: 0, lateral: 50 }, { station: 20, lateral: 50 }), "A thoracic lateral endpoint does not meet its surface");
    refuse(audit, (): unknown => Course.read([nonfinite], { station: 0, lateral: 0 }, { station: 20, lateral: 0 }), "A thoracic course evaluated a nonfinite source point");
    refuse(audit, (): unknown => Course.read([normal], { station: 0, lateral: 0 }, { station: 0, lateral: 0 }), "A thoracic course needs distinct finite stations and finite lateral endpoints");
    /** Delete a real emitted vertex's material identity, leaving physical geometry untouched. */
    const unavailable: Surface.IOutput = mesh([normal]);
    unavailable.coordinates[1] = NaN;
    refuse(audit, (): unknown => Skin.read(unavailable, new Set([normal.name]), { station: 0, lateral: 0 }, { station: 20, lateral: 0 }), "A selected skin course face has unavailable material coordinates at triangle 0");
  });
  audit.run({ scenario: "7 actual off-grid endpoint extrema", part: "rotated-endpoint", interval: [0, 20], station: 0, phase: 7 * Math.PI / 18 }, (): void => {
    /** Eighteen controls put the analytic symmetry maximum halfway through span three. */
    const n: number = 18;
    /** The three-point cardinal filter gives exact authored circle knot values. */
    const eigenvalue: number = (4 + 2 * Math.cos(2 * Math.PI / n)) / 6;
    /** Rotation by one knot moves the tangent off the old 64-bracket grid. */
    const coefficients: number[] = Array.from({ length: 2 * n }, (_: unknown, index: number): number => 10 / eigenvalue * (index < n ? Math.cos(2 * Math.PI * index / n + Math.PI / 9) : Math.sin(2 * Math.PI * (index - n) / n + Math.PI / 9)));
    /** Exact cubic midpoint weights are [1,23,23,1]/48. */
    const peak: number = (coefficients[n + 2]! + 23 * coefficients[n + 3]! + 23 * coefficients[n + 4]! + coefficients[n + 5]!) / 48;
    /** A regular translated extrusion has exact physical length twenty. */
    const owner: Chain = { name: "rotated-endpoint", basis: "spline", order: n, rule: "polar", samples: 72, layers: [0, 10, 20].map((y: number): Chain.ILayer => ({ y, coefficients, slopes: new Array<number>(2 * n).fill(0), curvatures: new Array<number>(2 * n).fill(0) })) };
    /** An independently specified interior value lies 0.00001 mm below the tangent. */
    const near: number = peak - 0.00001;
    /** Actual old-grid points demonstrate why sign brackets missed this real crossing. */
    const old: [number, number, number][] = Loft.ring(owner, 0, Array.from({ length: 65 }, (_: unknown, index: number): number => Math.PI * index / 64));
    /** The production endpoint resolver observes every monotone cubic span. */
    const tangent: Crossing.IReading = Crossing.read(owner, 0, peak);
    /** Interior near-tangency has two distinct source crossings. */
    const crossing: Crossing.IReading = Crossing.read(owner, 0, near);
    /** An actual exterior target has no crossing, even though it is nearby. */
    const exterior: Crossing.IReading = Crossing.read(owner, 0, peak + 0.00001);
    audit.scope({ scenario: "7 tangent and crossing admission", part: owner.name, interval: [0, 20], station: 0, phase: 7 * Math.PI / 18, coordinates: tangent.crossings.map((point: Crossing.IPoint): [number, number, number] => point.point), expectedPeak: peak, actualExtremalRange: tangent.range, oldGridMaximum: Math.max(...old.map((point: [number, number, number]): number => point[2])) });
    audit.measure("independent actual spline peak", tangent.range[1], peak, 1e-12, "mm");
    audit.bound("actual off-grid tangent admitted", tangent.crossings.length, 1, ">=", "count");
    audit.measure("two actual near-tangent crossings", crossing.crossings.length, 2, 0, "count");
    audit.measure("actual exterior target refused", exterior.crossings.length, 0, 0, "count");
    audit.bound("original sign grid misses actual interior endpoint", near, Math.max(...old.map((point: [number, number, number]): number => point[2])), ">", "mm");
    audit.measure("actual endpoint continuation through interval interiors", Course.read([owner], { station: 0, lateral: near }, { station: 20, lateral: near }).length, 20, 1e-8, "mm");
    audit.measure("independent actual skin near-tangent continuation", Skin.read(mesh([owner]), new Set([owner.name]), { station: 0, lateral: near }, { station: 20, lateral: near }).length, 20, 1e-8, "mm");
    refuse(audit, (): unknown => Course.read([owner], { station: 0, lateral: peak + 0.00001 }, { station: 20, lateral: near }), "A thoracic lateral endpoint does not meet its surface");
  });
  audit.run({ scenario: "8 common world patch with different chart phases", part: ["lower", "upper"], interval: [0, 10, 20], station: 10, phase: [Math.PI / 8, Math.PI / 16] }, (): void => {
    /** These authored cardinal controls have an exact vertical front patch X=10. */
    const controls: [number, number][] = [[10, 0], [10, 2], [10, 4], [10, 6], [8, 8], [4, 10], [0, 10], [-4, 10], [-8, 8], [-10, 4], [-10, 0], [-10, -4], [-8, -8], [-4, -10], [0, -10], [10, -2]];
    /** Doubling only lateral controls reparameterizes the common front patch. */
    const owner: (name: string, stations: number[], lateral: number, advance: number) => Chain = (name: string, stations: number[], lateral: number, advance: number): Chain => ({ name, basis: "spline", order: 16, samples: 64, rule: "polar", layers: stations.map((y: number): Chain.ILayer => ({ y, coefficients: [...controls.map((point: [number, number]): number => point[0] + advance), ...controls.map((point: [number, number]): number => lateral * point[1])], slopes: new Array<number>(32).fill(0), curvatures: new Array<number>(32).fill(0) })) });
    /** The world seam's admitted front points coincide without a tolerance transfer. */
    const normal: Chain[] = [owner("lower", [0, 5, 10], 1, 0), owner("upper", [10, 15, 20], 2, 0)];
    for (const lateral of [2, 3]) {
      const from: Course.IAddress = { station: 20, lateral };
      const to: Course.IAddress = { station: 0, lateral };
      const actual: Course.IReading = Course.read(normal, from, to);
      const emitted: Skin.IReading = Skin.read(mesh(normal), new Set(["lower", "upper"]), from, to, actual.addresses);
      audit.scope({ scenario: "8 actual chart-independent world course", part: ["lower", "upper"], interval: [0, 10, 20], station: actual.addresses, coordinates: actual.points, triangles: emitted.triangles, lateral });
      audit.measure("common world patch physical source length", actual.length, 20, 1e-8, "mm");
      audit.measure("common world patch emitted skin length", emitted.length, 20, 1e-8, "mm");
      for (const point of actual.points) audit.vector("all source interval interiors retain the declared world meridian", point, [10, point[1], lateral], 1e-8, "mm");
    }
    /** The original defect uses the parent's phase in the child's unrelated chart. */
    const old: Course.Point = Loft.ring(normal[0]!, 9.5, [Math.PI / 16])[0]!;
    audit.scope({ scenario: "8 original wrong-chart actual source point", part: "lower", interval: [5, 10], station: 9.5, phase: Math.PI / 16, coordinates: old });
    audit.measure("old wrong-chart point has actual lateral one", old[2], 1, 1e-10, "mm");
    audit.reject("old wrong-chart geometry fails world correspondence", old[2], 2, 1e-8, "mm");
    /** Translate the actual second owner until no world seam can exist. */
    const disjoint: Chain[] = [normal[0]!, owner("upper", [10, 15, 20], 2, 40)];
    refuse(audit, (): unknown => Course.read(disjoint, { station: 20, lateral: 2 }, { station: 0, lateral: 2 }), "A thoracic course has no admitted physical chart continuation");
  });
  audit.run({ scenario: "9 original complete periodic boundary", part: ["head", "upper"], interval: [0, 10, 20, 30], station: 20, phase: "all 257 source samples" }, (): void => {
    /** The original lower neck boundary has nonzero physical axial lift. */
    const neck: Chain = tube("head", [20, 25, 30], 0.2);
    /** This is the actual repeated sample/filter path that formerly displaced it. */
    const sampled: Chain = Horizontal.build({ name: "upper", order: neck.order, samples: 64, rule: "polar" }, [0, 10, 20].map((station: number): [number, number, number][] => Loft.ring(neck, 20, Array.from({ length: neck.order }, (_: unknown, index: number): number => 2 * Math.PI * index / neck.order)).map((point: [number, number, number]): [number, number, number] => [point[0], station + point[1] - 20, point[2]])));
    const normal: Chain = Boundary.attach(neck, sampled);
    const shifted: Chain = { ...neck, layers: neck.layers.map((layer: Chain.ILayer): Chain.ILayer => ({ ...layer, lift: layer.lift!.map((value: number): number => value + 10) })) };
    const delta: Chain = Boundary.attach(shifted, sampled);
    let oldWorst: number = 0;
    for (let index: number = 0; index <= 256; index++) {
      const phase: number = 2 * Math.PI * index / 256;
      const original: Course.Point = Loft.ring(neck, 20, [phase])[0]!;
      const actual: Course.Point = Loft.ring(normal, normal.layers.at(-1)!.y, [phase])[0]!;
      const wrong: Course.Point = Loft.ring(sampled, sampled.layers.at(-1)!.y, [phase])[0]!;
      const moved: Course.Point = Loft.ring(delta, delta.layers.at(-1)!.y, [phase])[0]!;
      audit.scope({ scenario: "9 full boundary reference versus actual evaluated source", part: "upper", interval: [normal.layers.at(-2)!.y, normal.layers.at(-1)!.y], station: normal.layers.at(-1)!.y, phase, coordinates: actual, referenceCoordinates: original, defectCoordinates: wrong });
      audit.vector("original full boundary retained through source evaluation", actual, original, 1e-10, "mm");
      audit.vector("known original world lift delta", moved, [original[0], original[1] + 10, original[2]], 1e-10, "mm");
      oldWorst = Math.max(oldWorst, Math.hypot(wrong[0] - original[0], wrong[1] - original[1], wrong[2] - original[2]));
    }
    audit.reject("actual original repeated-filter boundary defect", oldWorst, 0, 1e-10, "mm");
    audit.check("original source coefficients retained exactly", normal.layers.at(-1)!.coefficients.every((value: number, index: number): boolean => Object.is(value, neck.layers[0]!.coefficients[index])));
  });
  audit.finish();
}

/** Straight lifted tube authored without either course reader. */
function tube(name: string, stations: readonly number[], liftRate: number): Chain {
  /** A finite positive-radius section owns a simple admitted tube. */
  const built: Chain = Horizontal.build({ name, order: 16, samples: 64, rule: "polar" }, stations.map((station: number): [number, number, number][] => Array.from({ length: 16 }, (_: unknown, index: number): [number, number, number] => [10 * Math.cos(2 * Math.PI * index / 16), station, 10 * Math.sin(2 * Math.PI * index / 16)])));
  return { ...built, layers: built.layers.map((layer: Chain.ILayer): Chain.ILayer => ({ ...layer, curvatures: new Array<number>(32).fill(0), lift: new Array<number>(16).fill(liftRate * layer.y), liftSlopes: new Array<number>(16).fill(liftRate), liftCurvatures: new Array<number>(16).fill(0) })) };
}

/** Mesh the actual owners, sharing the common ring when there are two. */
function mesh(chains: Chain[]): Surface.IOutput {
  /** No aperture, fitted target, pole or replacement evaluator participates. */
  const body: Body = { stature: 30, chains, events: chains.length === 2 ? [{ parent: chains[1]!.name, direction: "down", shared: true, splits: [{ child: chains[0]!.name, arcs: [[0, 2 * Math.PI]] }] }] : [], poles: [], apertures: [], eyes: [] };
  return Surface.generate(body);
}

/** Exact native refusal prevents unrelated exceptions from making a test green. */
function refuse(audit: HumanFixtureAudit, action: () => unknown, reason: string): void {
  /** Missing exceptions have an explicit missing category. */
  let caught: unknown;
  try { action(); } catch (error) { caught = error; }
  audit.check("intended native Error constructor", caught instanceof Error && caught.constructor === Error);
  audit.category("intended Error name", caught instanceof Error ? caught.name : undefined, "Error");
  audit.category("intended refusal cause", caught instanceof Error ? caught.message : undefined, reason);
}
