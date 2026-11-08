import { AutoMovieConstructionViews, AutoMovieViewOutline, AutoMovieViewParallelAxis, type AutoMovieViewAxis, type IAutoMovieViewPart } from "@automovie/engine";
import type { AutoMovieConstructionOutlineParameter, IAutoMovieConstructionParallelAxis } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionSourceParameterSubset } from "../../internal/construction/ConstructionSourceParameterSubset";
import { nclose } from "../../internal/nclose";

/**
 * Nonzero world-coordinate source endpoints retain their root/angle parameter through actual source-axis construction and declaration serialization, independently of radial closure.
 *
 * Scenarios:
 * 1. A root source through (0,10),(4,12) is 10+sqrt(s); its top-root counterpart is 10+sqrt(4-s). Values and analytic interior station jets follow these formulas, while nonzero parameter endpoints are finite with absent singular station jets.
 * 2. The angle source through station 0/2/4 and values 10/11/10 has the independent natural cubic 10+3theta/pi-4theta^3/pi^3 on the first half. Both nonzero endpoint values survive, including a station 1e-300 near the bottom.
 * 3. A declared parallel origin combines root X, angle Y and station Z at two scales a thousand apart. Actual frames and their original metre declaration are replayed through the tree adapter without resampling. Mutating the returned declaration cannot alter its actual source axis; a raw black-box axis has no inferred declaration.
 * 4. Radial closure still refuses a nonzero closing knot and an incompatible explicit parameter. Invalid parameter endpoints and outside-domain queries stay explicit failures.
 * 5. Asymmetric angle-coordinate cubics retain full controls and scalar/world2 when one pole or both poles are outside the emitted interval. The retained cuts lie outside removed cap supports; actual ViewCurves, direct Source and ViewLoft preserve the original field, distinguish real poles from singular coordinate endpoints and refuse wrong zero/end/direction/domain premises.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the scalar value/jet owner, real parallel source factory, source-declaration transfer and ConstructionViews frame converter. The subset helper additionally consumes actual ViewCurves, direct Source and ViewLoft and asserts retained original controls, cap2, world2 and final owned-domain refusals.
 * @evidence contracts/testing.md#independent-expectations Closed forms are square roots and the elementary three-knot natural cubic in theta=2asin(sqrt(s/4)); derivatives use the analytic chain rule. A fixed u=Y/v=X basis with those world-coordinate curves is an authored source declaration. Tolerance 3e-11 times scale covers conversion; replay shares the original declaration while absolute positions use independent formulas. The subset helper documents its distinct asymmetric cubic, cap and guide-curvature equations and fixed 3e-9 component budget.
 * @evidence contracts/testing.md#distinguishing-cases Nonzero endpoint versus required radial zero, bottom/top/angle parameters, tiny endpoint distance, unit scales, actual source metadata versus black box, mutation and invalid/outside-domain cases distinguish the owners. Both one-pole subsets and a regular middle interval retain an original angle map without inventing caps; wrong endpoint/side, missing zero/pole and an outside-map control still refuse.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU unit through --include construction_source_parameters; synthetic original declarations start no Human generation, process, viewer or GPU.
 */
export function test_construction_source_parameters(): void {
  const failures: string[] = [];
  const near = (label: string, actual: number, expected: number, scale: number = 1): void => { if (!(Number.isFinite(expected) && nclose(actual, expected, 3e-11 * scale))) failures.push(`${label}: ${actual}, expected ${expected}`); };
  const reading = (curve: IAutoMovieViewPart.IOutline, station: number): AutoMovieViewOutline.IReading => {
    const source: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(curve);
    if ("detail" in source) throw new Error(source.detail);
    const value: AutoMovieViewOutline.IReading | string = AutoMovieViewOutline.at(source, station);
    if (typeof value === "string") throw new Error(value);
    return value;
  };
  for (const end of ["bottom", "top"] as const) {
    const curve: IAutoMovieViewPart.IOutline = outline([0, 4], end === "bottom" ? [10, 12] : [12, 10], { type: "root", pole: end === "bottom" ? 0 : 4, end });
    for (const station of [0, 0.25, 1, 2.5, 4]) {
      const d: number = end === "bottom" ? station : 4 - station;
      const actual: AutoMovieViewOutline.IReading = reading(curve, station);
      near(`${end} value ${station}`, actual.value, 10 + Math.sqrt(d));
      if (d === 0) {
        if (actual.location !== "parameter-endpoint" || actual.stationJetStatus !== "singular-parameter" || actual.stationJet !== null || !actual.parameterJet.every(Number.isFinite)) failures.push(`${end} nonzero endpoint lost its parameter qualification`);
      } else {
        near(`${end} first ${station}`, actual.stationJet?.[0] ?? NaN, (end === "bottom" ? 1 : -1) / (2 * Math.sqrt(d)));
        near(`${end} second ${station}`, actual.stationJet?.[1] ?? NaN, -1 / (4 * d ** 1.5));
      }
    }
  }
  const angle: IAutoMovieViewPart.IOutline = outline([0, 2, 4], [10, 11, 10], { type: "angle", bottom: 0, top: 4 });
  const ordinate = (s: number): number => {
    const d: number = Math.min(s, 4 - s);
    const theta: number = 2 * Math.asin(Math.sqrt(d / 4));
    return 10 + 3 * theta / Math.PI - 4 * theta ** 3 / Math.PI ** 3;
  };
  for (const s of [0, 1e-300, 0.5, 1, 2, 3.5, 4]) {
    const actual: AutoMovieViewOutline.IReading = reading(angle, s);
    near(`angle coordinate ${s}`, actual.value, ordinate(s));
    if (s === 0 || s === 4) {
      if (actual.stationJet !== null || actual.stationJetStatus !== "singular-parameter" || actual.location !== "parameter-endpoint") failures.push(`angle endpoint ${s} lost its nonclosing singular parameter status`);
    } else if (s >= 0.5) {
      const theta: number = 2 * Math.asin(Math.sqrt(s / 4));
      const t: number = Math.min(theta, Math.PI - theta);
      const first: number = (s <= 2 ? 1 : -1) * (3 / Math.PI - 12 * t * t / Math.PI ** 3);
      const second: number = -24 * t / Math.PI ** 3;
      const p: number = s * (4 - s);
      near(`angle first ${s}`, actual.stationJet?.[0] ?? NaN, first / Math.sqrt(p));
      near(`angle second ${s}`, actual.stationJet?.[1] ?? NaN, second / p + first * (s - 2) / p ** 1.5);
    }
  }
  const preparedAngle: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(angle);
  if ("detail" in preparedAngle) throw new Error(preparedAngle.detail);
  for (const s of [-1, 5, NaN, Infinity]) if (typeof AutoMovieViewOutline.at(preparedAngle, s) !== "string" || typeof AutoMovieViewOutline.value(preparedAngle, s) !== "string") failures.push(`angle outside query ${s} was not refused by both readers`);
  for (const end of ["bottom", "top"] as const) {
    const source: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(outline([1, 3], end === "bottom" ? [11, 10 + Math.sqrt(3)] : [10 + Math.sqrt(3), 11], { type: "root", pole: end === "bottom" ? 0 : 4, end }));
    if ("detail" in source) throw new Error(source.detail);
    const outside: number = end === "bottom" ? -1 : 5;
    if (typeof AutoMovieViewOutline.value(source, outside) !== "string" || typeof AutoMovieViewOutline.at(source, outside) !== "string") failures.push(`${end} outside parameter domain was admitted`);
    const endpoint: AutoMovieViewOutline.IReading | string = AutoMovieViewOutline.at(source, end === "bottom" ? 0 : 4);
    if (typeof endpoint === "string") failures.push(endpoint);
    else { near(`${end} open parameter-tangent endpoint`, endpoint.value, 10); if (endpoint.stationJet !== null || endpoint.location !== "parameter-endpoint") failures.push(`${end} open extension lost endpoint qualification`); }
  }
  for (const scale of [1, 1000]) {
    const record: IAutoMovieConstructionParallelAxis = { type: "parallel", u: { x: 0, y: 1, z: 0 }, v: { x: 1, y: 0, z: 0 }, origin: { x: AutoMovieViewOutline.scale(outline([0, 4], [10, 12], { type: "root", pole: 0, end: "bottom" }), scale / 1000, scale / 1000), y: AutoMovieViewOutline.scale(angle, scale / 1000, scale / 1000), z: AutoMovieViewOutline.scale(outline([0, 4], [0, 4]), scale / 1000, scale / 1000) } };
    const axis: AutoMovieViewAxis.IAxis | string = AutoMovieConstructionViews.frame(record);
    if (typeof axis === "string") { failures.push(axis); continue; }
    const original: IAutoMovieConstructionParallelAxis | null = AutoMovieViewParallelAxis.source(axis);
    if (original === null || original.origin.x.parameter?.type !== "root" || original.origin.y.parameter?.type !== "angle") { failures.push("actual source parameter declaration was not retained"); continue; }
    const replay: AutoMovieViewAxis.IAxis | string = AutoMovieConstructionViews.frame(original);
    if (typeof replay === "string") { failures.push(replay); continue; }
    original.origin.x.knots[0]!.value = -999;
    original.u.y = -1;
    for (const s of [0, 0.5, 1, 2.5, 4]) {
      const actual: ReturnType<AutoMovieViewAxis.IAxis["at"]> = axis.at(s * scale);
      const second: ReturnType<AutoMovieViewAxis.IAxis["at"]> = replay.at(s * scale);
      const expected: number[] = [(10 + Math.sqrt(s)) * scale, ordinate(s) * scale, s * scale];
      if (actual.origin.length !== 3 || actual.u.length !== 3 || actual.v.length !== 3) failures.push("source frame component count changed");
      actual.origin.forEach((value: number, c: number): void => { near(`origin ${scale}/${s}/${c}`, value, expected[c]!, scale); if (!Object.is(value, second.origin[c])) failures.push(`declaration replay changed ${scale}/${s}/${c}`); });
      [0, 1, 0, 1, 0, 0].forEach((value: number, c: number): void => near(`fixed basis ${c}`, [...actual.u, ...actual.v][c]!, value));
    }
  }
  const closing: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(angle, { bottom: 0, top: 4 });
  if (!("detail" in closing) || closing.contract !== "pole knot") failures.push("radial zero closure was weakened for world parameters");
  const mismatched: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(outline([0, 4], [0, 2], { type: "root", pole: 4, end: "top" }), { bottom: 0 });
  if (!("detail" in mismatched) || mismatched.contract !== "pole parameter") failures.push("an incompatible radial pole parameter was accepted");
  if (AutoMovieViewParallelAxis.source({ at: (): ReturnType<AutoMovieViewAxis.IAxis["at"]> => ({ origin: [0, 0, 0], u: [1, 0, 0], v: [0, 0, 1] }) }) !== null) failures.push("an arbitrary black-box axis acquired an inferred declaration");
  for (const p of [{ type: "root", pole: NaN, end: "bottom" }, { type: "angle", bottom: 1, top: 1 }, { type: "angle", bottom: 0, top: Infinity }] as AutoMovieConstructionOutlineParameter[]) {
    const invalid: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create({ ...angle, parameter: p });
    if (!("detail" in invalid)) failures.push("invalid parameter admitted");
  }
  ConstructionSourceParameterSubset(failures);
  TestValidator.predicate(`${failures.length} original parameter findings:\n${failures.join("\n")}`, (): boolean => failures.length === 0);
}

/** Named independent source coordinates; the optional parameter belongs to the curve rather than radial closure. */
function outline(stations: readonly number[], values: readonly number[], parameter?: AutoMovieConstructionOutlineParameter): IAutoMovieViewPart.IOutline {
  return { knots: stations.map((station: number, i: number): IAutoMovieViewPart.IKnot => ({ site: `source.${i}`, station, value: values[i]! })), ...(parameter === undefined ? {} : { parameter }) };
}
