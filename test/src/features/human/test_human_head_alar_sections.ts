import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanAlarHeadSections as Alar } from "../../../../packages/human/src/generation/AutoMovieHumanAlarHeadSections";
import { AutoMovieHumanHeadConstruction as H } from "../../../../packages/human/src/generation/AutoMovieHumanHeadConstruction";
import { AutoMovieHumanNasalConstruction as N } from "../../../../packages/human/src/generation/AutoMovieHumanNasalConstruction";
import { AutoMovieHumanSurfaceSections as S } from "../../../../packages/human/src/generation/AutoMovieHumanSurfaceSections";

/**
 * Alar preparation reuses physical face samples and the real head consumer
 * retains unresolved section topology instead of silently dropping it.
 *
 * Scenarios:
 * 1. A polynomial face requires nine queries per row and satisfies its analytic jets.
 * 2. Equivalent pure callbacks emit exactly the same physical mesh.
 * 3. Two actual competing paths and one actual coplanar triangle remain unaccepted.
 * 4. A sound path and an outside plane cause no false rejection; seam limits remain scaled.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the production alar owner and H.observeAlarSection, which the real head cut also consumes. Thirteen face queries per row fail the prescribed nine-coordinate budget. Missing competing paths, counts, boundary labels or rejection reasons fail actual triangle-plane observations.
 * @evidence contracts/testing.md#independent-expectations The fixture face is 15+y/8+z^2/64, whose gradient and Hessian follow elementary differentiation. Two disjoint triangles have two known plane-intersection segments, while a triangle lying in the plane contributes one coplanar triangle. Mesh equality checks callback instrumentation transparency, not independent anatomical correctness; the existing curve and whole-person anatomy audits own that broader claim.
 * @evidence contracts/testing.md#distinguishing-cases Separates competing face paths, coplanarity, an extra owned domain, graph branching, one sound path, an empty outside plane, the exact scaled seam limit and a gap beyond it. It verifies this head admission boundary rather than repeating global human skin, head identity or clinical anatomy checks.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU test reached by --include human_head_alar_sections. Local analytic curves and emitted triangle fixtures call maintained functions directly without a person, source inspection, manifest lookup, host, process or GPU.
 */
export function test_human_head_alar_sections(): void {
  /** Keep every observed failure until the complete local inspection ends. */
  const findings: string[] = [];
  /** Record a case without skipping subsequent component observations. */
  const check: (name: string, accepted: boolean) => void = (name: string, accepted: boolean): void => { if (!accepted) findings.push(name); };
  /** Compare numerical jets much more tightly than the physical seam allowance. */
  const close: (a: number, b: number) => boolean = (a: number, b: number): boolean => Math.abs(a - b) < 1e-10;
  /** Prescribe the actual tilted rim independently of its attachment. */
  const point: (t: number) => N.Point = (t: number): N.Point => [35 + 5 * Math.cos(t), 50 + 5 * Math.cos(t), 10 + 5 * Math.sin(t)];
  /** Prescribe the derivative of that physical rim. */
  const first: (t: number) => N.Point = (t: number): N.Point => [-5 * Math.sin(t), -5 * Math.sin(t), 5 * Math.cos(t)];
  /** Polynomial foundation with independently known first and second derivatives. */
  const face: (y: number, z: number) => number = (y: number, z: number): number => 15 + y / 8 + z * z / 64;
  const input: Alar.Input = {
    rim: { order: 1, coefficients: [35, 5, 0, 50, 5, 0, 10, 0, 5], point, first, second: (t: number): N.Point => [-5 * Math.cos(t), -5 * Math.cos(t), -5 * Math.sin(t)] },
    frame: { origin: [35, 50, 0], forward: [Math.SQRT1_2, Math.SQRT1_2, 0], lateral: [0, 0, 1], normal: [Math.SQRT1_2, -Math.SQRT1_2, 0] },
    outerHalfWidth: 18,
    face,
    derivativeStep: 0.5,
    rows: 24,
    columns: 12,
  };
  let queries: number = 0;
  const counted: Alar.Owner = Alar.create({ ...input, face: (y: number, z: number): number => { queries++; return face(y, z); } });
  const uncounted: Alar.Owner = Alar.create(input);
  check("nine distinct physical samples per row", queries === 9 * input.rows);
  check("query instrumentation preserves exact emitted mesh", JSON.stringify(counted.hood.mesh) === JSON.stringify(uncounted.hood.mesh));
  check("query instrumentation preserves exact face jets", JSON.stringify(counted.hood.faceJet) === JSON.stringify(uncounted.hood.faceJet));
  for (let i: number = 0; i < input.rows; i++) {
    const p: N.Point = counted.hood.inner[i]!;
    const jet: Alar.Owner["hood"]["faceJet"][number] = counted.hood.faceJet[i]!;
    const t: N.Point = jet.tangent;
    const k: N.Point = jet.curvature;
    const fy: number = 1 / 8;
    const fz: number = p[2] / 32;
    check("actual attachment lies on the analytic face", jet.point[0] === face(p[1], p[2]) && jet.point[1] === p[1] && jet.point[2] === p[2]);
    check("analytic face tangent", close(t[0], fy * t[1] + fz * t[2]) && close(Math.hypot(...t), 1));
    check("analytic face curvature", close(k[0] - fy * k[1] - fz * k[2], t[2] * t[2] / 32) && close(N.dot(t, k), 0));
  }

  type Section = ReturnType<Alar.Owner["section"]>;
  /** Intersect real triangles with the prescribed horizontal physical plane. */
  const cut: (mesh: N.Mesh) => S.Result = (mesh: N.Mesh): S.Result => S.cut(mesh, S.headPlane(0, 0), (): string => "face");
  const competing: S.Result = cut({ points: [[0, -1, 0], [2, 1, 0], [0, 1, 2], [10, -1, 0], [12, 1, 0], [10, 1, 2]], triangles: [[0, 1, 2], [3, 4, 5]] });
  check("actual competing components", competing.paths.length === 2 && competing.coplanarTriangles === 0 && competing.branching === 0);
  const multipleReason: string = "Two physical face-to-face paths require a topology decision.";
  const multiple: Section = { points: [], rootGaps: [], facePaths: competing.paths, remaining: [], branching: competing.branching, coplanarTriangles: competing.coplanarTriangles, admission: "unaccepted", rejectionReasons: [multipleReason] };
  const observed: H.IAlarSection | undefined = H.observeAlarSection(123, "left", multiple, 1);
  check("head retains competing path count", observed?.facePathCount === 2 && observed.admission === "unaccepted");
  check("head retains actual endpoints", JSON.stringify((observed?.facePaths ?? []).flatMap((p: H.IAlarPath): string[] => p.points.map((v: H.IAlarPath["points"][number]): string => v.join(","))).sort((a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0)) === JSON.stringify(["0,0,1", "1,0,0", "10,0,1", "11,0,0"].sort((a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0)));
  check("head retains actual boundary labels", (observed?.facePaths ?? []).every((p: H.IAlarPath): boolean => p.startBoundary === "face" && p.endBoundary === "face"));
  check("head retains rejection reason", observed?.rejectionReasons.includes(multipleReason) === true);

  const planar: S.Result = cut({ points: [[0, 0, 0], [1, 0, 0], [0, 0, 1]], triangles: [[0, 1, 2]] });
  check("actual coplanar triangle", planar.paths.length === 0 && planar.coplanarTriangles === 1);
  const coplanarReason: string = "An actual coplanar triangle has unresolved section topology.";
  const coplanar: Section = { ...multiple, facePaths: planar.paths, coplanarTriangles: planar.coplanarTriangles, rejectionReasons: [coplanarReason] };
  const planarFinding: H.IAlarSection | undefined = H.observeAlarSection(124, "right", coplanar, 1);
  check("head retains isolated coplanarity", planarFinding?.coplanarTriangles === 1 && planarFinding.facePathCount === 0 && planarFinding.rejectionReasons.includes(coplanarReason));

  const sound: Section = { ...multiple, facePaths: competing.paths.slice(0, 1), admission: "spliced", rejectionReasons: [] };
  check("sound section remains green", H.observeAlarSection(125, "left", sound, 1) === undefined);
  const outside: S.Result = cut({ points: [[0, -2, 0], [1, -2, 0], [0, -2, 1]], triangles: [[0, 1, 2]] });
  check("actual outside plane", outside.paths.length === 0 && outside.coplanarTriangles === 0);
  check("outside remains green", H.observeAlarSection(126, "left", { ...sound, facePaths: outside.paths, admission: "outside" }, 1) === undefined);
  check("exact scaled seam boundary remains green", H.observeAlarSection(127, "left", { ...sound, rootGaps: [0.05] }, 2) === undefined);
  const gap: H.IAlarSection | undefined = H.observeAlarSection(128, "left", { ...sound, rootGaps: [0.050001] }, 2);
  check("excessive scaled seam remains red", gap?.gaps[0] === 0.050001 && gap.rejectionReasons.some((reason: string): boolean => reason.includes("gap")));
  const extra: S.Path = { ...competing.paths[0]!, startBoundary: "inner", endBoundary: "face" };
  const domain: H.IAlarSection | undefined = H.observeAlarSection(129, "left", { ...sound, remaining: [extra], branching: 1, admission: "unaccepted", rejectionReasons: ["An actual inner boundary and branch remain unresolved."] }, 1);
  check("head retains extra domain and branch", domain?.remaining.length === 1 && domain.remaining[0]!.startBoundary === "inner" && domain.remaining[0]!.endBoundary === "face" && domain.branching === 1);
  TestValidator.predicate(findings.join("\n"), findings.length === 0);
}
