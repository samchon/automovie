import { AutoMovieConstructionWidths, type AutoMovieLoftContract, AutoMovieSolidIntersection, AutoMovieSolidJoin, AutoMovieSolidSharedCurve, type IAutoMovieSolidSurface } from "@automovie/engine";
import type { AutoMovieConstructionWidth } from "@automovie/interface";

import { ConstructionMound } from "../../../internal/construction/ConstructionMound";

/**
 * A part whose closed end lies on its own join loop: the made case behind a thin plate that rises out of its host all round its rim, as
 * a nail's plate does out of a digit's skin.
 *
 * Made inputs, millimetres: the host is the plane `z = 0`, charted `(x, y)`. The part is the ellipsoid with half axes 10, 5 and 3 along
 * `x`, `y` and `z`, its centre `h` under the plane, charted as a lofted part is, a station along its long axis and a phase round it:
 * `P(s, phi) = (10 cos s, 5 sin s cos phi, 3 sin s sin phi - h)`, whose two closed ends are the chart's poles `s = 0` and `s = pi` at
 * `(+-10, 0, -h)`. The plane cuts it in the ellipse with half axes `10 k` and `5 k`, `k = sqrt(1 - (h / 3)^2)`, which is declared as the
 * loop; the part is kept above the plane. On the part the loop is `sin s sin phi = h / 3`, so it comes within `asin(h / 3)` of each pole.
 *
 * At every point of the loop the two surfaces meet at a turn whose cosine is the `z` share of the ellipsoid's unit normal there; for
 * `h = 0` that is a right angle all round. The geometry is regular in all three scenarios: the loop is one ellipse and the ellipsoid is
 * smooth at its poles. Only the part's chart differs, by how near its poles the loop runs.
 *
 * A shared contact finds the part's foot of each loop point by a solve in the part's own chart, from the foot before it
 * (`AutoMovieSolidSharedCurve`), so its premise is a chart that is regular along the loop. At a pole the chart has no phase, and beside
 * one a step between two stored points crosses phases faster than the solve can follow. The contact names that premise's failure
 * `shared loop`, as it names any loop the part cannot be followed along. `SERVED_ROUND_A_POLE` states whether the kernel reads a
 * closed end round its pole, as a lofted cap's root parameter does; while it does not, the two near scenarios pin the named refusal,
 * and when it does they pin admission.
 *
 * Scenarios:
 * 1. `h = 2.4`: the loop stays `asin(0.8)`, 53 degrees of station, from both poles. Admitted, no diagnostic, a rail at every stored point.
 * 2. `h = 0.3`: the loop passes `asin(0.1)`, 5.7 degrees of station, from each pole, and the part's phase sweeps 169 degrees while it
 *    does. Refused as `shared loop`, with no join; served round a pole, admitted with a rail at every stored point.
 * 3. `h = 0`: the loop is the ellipsoid's own widest ellipse and runs through both poles. Refused as `shared loop`, with no join;
 *    served round a pole, admitted with a rail at every stored point.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds each contact with `AutoMovieSolidSharedCurve.create`, the width laws with `AutoMovieConstructionWidths.create` and the join with `AutoMovieSolidJoin.create`, then reads the diagnostics' contracts and asks an admitted join for a rail at every stored point. It catches a contact near a pole that is admitted with a lost rail or refused under another name or silently, and a contact clear of the poles that is refused; it does not read the rails' places or a drawn mesh.
 * @evidence contracts/development/testing.md#independent-expectations Admission clear of the poles follows from the made geometry, an ellipsoid cut by a plane in one ellipse at a turn that never vanishes. The refusal near a pole follows from the contact's stated premise, a foot solved in the part's chart, which the chart's pole breaks; its name is the contract's. The refusal's wording is not asserted. No value comes from a run.
 * @evidence contracts/development/testing.md#distinguishing-cases The three scenarios differ only in the depth `h`, which moves the loop from far from the poles to beside them to through them; the first is the adjacent positive case and the other two the negative ones. A cap of another shape, a curved host and a diff are not covered.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_operator_capped_part`; it builds closed-form surfaces in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation States the made surfaces, the loop's closed form, where the poles stand against it and what each scenario pins.
 */
export function test_construction_operator_capped_part(): void {
  const failures: string[] = [];
  const rim: AutoMovieConstructionWidth = { type: "fold", radius: 0.2 / 1000, cap: 0.002 };
  for (const [name, depth, clear] of [
    ["clear of the poles", 2.4, true],
    ["beside the poles", 0.3, false],
    ["through the poles", 0, false],
  ] as const) {
    const made: ICase = compose(depth, rim);
    if (!clear && !SERVED_ROUND_A_POLE) {
      if (made.join !== null && made.join.join !== null) failures.push(`${name} (h = ${depth}): joined, expected the shared loop refusal`);
      else if (!made.diagnostics.some((x: AutoMovieLoftContract.IDiagnostic): boolean => x.contract === "shared loop")) failures.push(`${name} (h = ${depth}): expected the shared loop refusal, got ${describe(made)}`);
      continue;
    }
    if (made.shared === null || made.join === null || made.join.join === null || made.diagnostics.length !== 0) {
      failures.push(`${name} (h = ${depth}): not admitted: ${describe(made)}`);
      continue;
    }
    const join: AutoMovieSolidJoin.IJoin = made.join.join;
    const lost: number = made.shared.curve.points.filter((p: AutoMovieSolidIntersection.IPoint): boolean => join.rail(p.t) === null).length;
    if (lost !== 0) failures.push(`${name} (h = ${depth}): no rail at ${lost} of ${made.shared.curve.points.length} stored points`);
  }
  if (failures.length !== 0) throw new Error(`${failures.length} capped part failures:\n${failures.join("\n")}`);
}

/** Whether the kernel serves a loop that runs beside or through a pole of the part's chart; it does not, and the near scenarios pin the refusal. */
const SERVED_ROUND_A_POLE: boolean = false;

/** The ellipsoid's half axes along `x`, `y` and `z`, mm. */
const AXES: [number, number, number] = [10, 5, 3];

/** Points stored round the loop. */
const COUNT: number = 64;

/** One composed case. */
interface ICase {
  shared: AutoMovieSolidSharedCurve.IShared | null;
  join: AutoMovieSolidJoin.IResult | null;
  diagnostics: AutoMovieLoftContract.IDiagnostic[];
}

/** The case's diagnostics, for a message. */
function describe(c: ICase): string {
  return c.diagnostics.map((x: AutoMovieLoftContract.IDiagnostic): string => `${x.contract}: ${x.detail.slice(0, 200)}`).join("; ") || "no diagnostic";
}

/** The ellipsoid with its centre `depth` under the plane, charted `(s, phi)` about its long axis; `P_s x P_phi` points outward. */
function ellipsoid(depth: number): IAutoMovieSolidSurface {
  const [a, b, c]: [number, number, number] = AXES;
  return {
    name: "lens",
    orientation: 1,
    period: 2 * Math.PI,
    domain: [0, Math.PI],
    jet: (s: number, phi: number): IAutoMovieSolidSurface.IJet => {
      const [cs, ss, cp, sp]: [number, number, number, number] = [Math.cos(s), Math.sin(s), Math.cos(phi), Math.sin(phi)];
      return {
        p: [a * cs, b * ss * cp, c * ss * sp - depth],
        u: [-a * ss, b * cs * cp, c * cs * sp],
        v: [0, -b * ss * sp, c * ss * cp],
        uu: [-a * cs, -b * ss * cp, -c * ss * sp],
        uv: [0, -b * cs * sp, c * cs * cp],
        vv: [0, -b * ss * cp, -c * ss * sp],
      };
    },
  };
}

/** The plane section's contact, its fold widths and the join of the ellipsoid onto the plane, the part kept above it. */
function compose(depth: number, width: AutoMovieConstructionWidth): ICase {
  const [a, b, c]: [number, number, number] = AXES;
  const k: number = Math.sqrt(1 - (depth / c) ** 2);
  const host: IAutoMovieSolidSurface = ConstructionMound.build({ frame: ConstructionMound.LEVEL, a: 15, slope: (): [number, number, number] => [0, 0, 0], q: 0, c: 0, lift: 0 }).host;
  const part: IAutoMovieSolidSurface = ellipsoid(depth);
  const made: AutoMovieSolidSharedCurve.IResult = AutoMovieSolidSharedCurve.create({
    part,
    host,
    loop: (t: number): { point: [number, number]; first: [number, number]; second: [number, number] } => ({
      point: [a * k * Math.cos(t), b * k * Math.sin(t)],
      first: [-a * k * Math.sin(t), b * k * Math.cos(t)],
      second: [-a * k * Math.cos(t), -b * k * Math.sin(t)],
    }),
    count: COUNT,
    tolerance: 1e-6,
    grazing: 0.05,
    keep: "outside",
    // The loop's first point `(10 k, 0, 0)` on the part: `cos s = k` on the meridian `phi = pi / 2`.
    start: [Math.acos(k), Math.PI / 2],
  });
  const out: ICase = { shared: made.shared, join: null, diagnostics: [...made.diagnostics] };
  if (made.shared === null) return out;
  const law: AutoMovieSolidJoin.IInput["width"] | string = AutoMovieConstructionWidths.create(width, width, false, { curve: made.shared.curve, part, host: AutoMovieSolidIntersection.atlas(host), diff: false });
  if (typeof law === "string") {
    out.diagnostics.push({ producer: "test", level: 6, contract: "width", detail: law });
    return out;
  }
  const first: AutoMovieSolidIntersection.IPoint = made.shared.curve.points[0]!;
  out.join = AutoMovieSolidJoin.create(
    { part, host, seed: { phi: first.phi, s: first.s, y: first.y, theta: first.theta }, parameter: { kind: "arc" }, count: COUNT, tolerance: 1e-6, grazing: 0.05, curve: made.shared.curve, toward: made.shared.toward, width: law },
    "outside",
  );
  out.diagnostics.push(...out.join.diagnostics);
  return out;
}
