import {
  type IAutoMovieMeshSeparationAttachment,
  type IAutoMovieMeshQueryBudget as ImportedIAutoMovieMeshQueryBudget,
  Vector3,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceHairRibbonFitContext } from "./IHumanFaceHairRibbonFitContext";

interface Row {
  point: IAutoMovieVector3;
  across: IAutoMovieVector3;
  radius: number;
  nominal: number;
  v: number;
  region: "root" | "stem" | "free";
}

/**
 * Fit complete transverse rows and the actual swept free coverage profile. Root/stem/free regions and the original sampler attachment are required derived producer metadata, never saved hairstyle controls. Radius is a density-coverage proxy bounded by the original taper's nominal radius, not an authored shaft diameter. All source centres, frames and UV stations survive. A failed span fits both row radii together by a common geometric fraction, changing the actual surface vertices while preserving centreline metric and nominal taper. The fraction is the supported lower end of a representable bisection bracket, not a fixed style factor or a global maximum-coverage optimization claim.
 *
 * Both source and Float32-candidate/current-Float32-host separation must prove each complete free row and emitted triangle's requested gap. Binary64 witnesses or outside corners never substitute for that proof. Width fitting bisects the contiguous centred segment until the midpoint is no longer representable; no subject-specific multiplier, fixed iteration tolerance or silent gap cut exists. A centre without supported gap, nonpositive represented width, missing transverse direction or exhausted shared budget refuses by name.
 *
 * A cell's convex hull includes both complete rows and their centres, hence every emitted triangle. If its centre chord itself cannot be certified, the owner refuses rather than changing that metric path. Shrinking a row changes its neighbouring cell, which is rechecked in both actual coordinate frames; real-arithmetic hull nesting never bypasses Float32 revalidation. Registered root contact is bounded separately, stem cells stay strictly separated, and free cells keep requested clearance.
 *
 * Both readers are deterministic over immutable snapshots, so one exact query (bit-identical vertex run, clearance and registration) always has one verdict. Each frame's verdicts are therefore recorded by exact coordinates and reused, never re-spending budget on a query already answered. Signed zeros stay distinct in the key. The bisection still visits the same brackets: late width steps below Float32 resolution repeat the represented run while the binary64 source run keeps moving, and the cell recheck after a successful bisection repeats its last certified query exactly. Reuse changes neither a verdict nor the bracket sequence; only repeated work is removed. Only certification is consumed here, so each new query uses the readers' decision-only `separated` operation, which ends at the first refuting host triangle and returns the same verdict as a complete measurement. The mutable returned array, records and vectors are owned copies. The shared work budget alone is intentionally caller-owned mutable state. Nothing here establishes hair-to-hair intersection freedom.
 *
 * @evidence contracts/common.md#principled-implementation Whole rows and swept convex cells must certify requested gap on binary64 source and Float32 buffer preimages.
 * @evidence contracts/common.md#clear-and-simple-design Geometric fitting changes actual coverage radii while preserving centres, frames, UVs and nominal taper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uncertified centre chords, nonpositive represented width and exhausted budgets refuse; outside corners do not substitute for cell proof.
 * @evidence contracts/common.md#meaningful-documentation Bisection returns a supported representable bracket endpoint, not a global coverage optimum or hair-to-hair certificate.
 * @evidence contracts/performance.md#efficient-algorithms Work follows row/cell queries and representable bisection brackets; shrinkage can revisit adjacent cells.
 * @evidence contracts/performance.md#reuse-equivalent-work Exact coordinate, signed-zero, gap and registration keys cache per-frame verdicts without changing the bracket sequence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned output vectors and local verdict maps scale with visited candidates; caller remaining budget is the only intentionally mutable shared state.
 *
 * @author Samchon
 */
export function fitHumanFaceHairRibbonRows(
  rows: readonly Row[],
  props: IHumanFaceHairRibbonFitContext,
): Row[] {
  if (
    props === undefined ||
    props === null ||
    typeof props.source !== "function" ||
    typeof props.represented !== "function"
  )
    throw new Error(
      "Hair coverage requires source and represented resident separation readers.",
    );
  const corner: (row: Row, side: number) => IAutoMovieVector3 = (
    row: Row,
    side: number,
  ): IAutoMovieVector3 =>
    Vector3.add(row.point, Vector3.scale(row.across, side * row.radius));
  const represented: (p: IAutoMovieVector3) => IAutoMovieVector3 = (
    p: IAutoMovieVector3,
  ): IAutoMovieVector3 => ({
    x: Math.fround(p.x),
    y: Math.fround(p.y),
    z: Math.fround(p.z),
  });
  // Exact query identity: every coordinate's shortest round-trip text, with
  // negative zero kept apart. Within one call the registration is either the
  // curve's attachment or absent, so its presence completes the identity.
  const identity: (
    run: readonly IAutoMovieVector3[],
    clearance: number,
    attachment: IAutoMovieMeshSeparationAttachment | undefined,
  ) => string = (
    run: readonly IAutoMovieVector3[],
    clearance: number,
    attachment: IAutoMovieMeshSeparationAttachment | undefined,
  ): string =>
    [
      clearance,
      attachment === undefined ? 0 : 1,
      ...run.flatMap((p: IAutoMovieVector3): number[] => [p.x, p.y, p.z]),
    ]
      .map((value: number): string =>
        Object.is(value, -0) ? "-0" : String(value),
      )
      .join(",");
  const sourceVerdicts: Map<string, boolean> = new Map<string, boolean>();
  const representedVerdicts: Map<string, boolean> = new Map<string, boolean>();
  const certified: (
    vertices: readonly IAutoMovieVector3[],
    clearance: number,
    attachment?: IAutoMovieMeshSeparationAttachment,
  ) => boolean = (
    vertices: readonly IAutoMovieVector3[],
    clearance: number,
    attachment?: IAutoMovieMeshSeparationAttachment,
  ): boolean => {
    const options: {
      clearance: number;
      budget: ImportedIAutoMovieMeshQueryBudget;
      attachment: IAutoMovieMeshSeparationAttachment | undefined;
    } = { clearance, budget: props.budget, attachment };
    const exact: string = identity(vertices, clearance, attachment);
    let proved: boolean | undefined = sourceVerdicts.get(exact);
    if (proved === undefined) {
      proved = props.source.separated(vertices, options).certified;
      sourceVerdicts.set(exact, proved);
    }
    if (!proved) return false;
    const run: IAutoMovieVector3[] = vertices.map(represented);
    const rounded: string = identity(run, clearance, attachment);
    let kept: boolean | undefined = representedVerdicts.get(rounded);
    if (kept === undefined) {
      kept = props.represented.separated(run, options).certified;
      representedVerdicts.set(rounded, kept);
    }
    return kept;
  };
  const fit: (row: Row) => Row = (row: Row): Row => {
    if (row.region === "root") return row;
    const gap: number = row.region === "free" ? props.clearance : 0;
    if (
      !(row.radius > 0) ||
      !(row.nominal > 0) ||
      !Number.isFinite(row.radius) ||
      !Number.isFinite(row.nominal) ||
      row.radius > row.nominal
    )
      throw new Error("Hair free row needs positive coverage radii.");
    const segment: (radius: number) => IAutoMovieVector3[] = (
      radius: number,
    ): IAutoMovieVector3[] =>
      [-1, 1].map(
        (side: number): IAutoMovieVector3 => corner({ ...row, radius }, side),
      );
    const positive: (radius: number) => boolean = (radius: number): boolean => {
      const pair: IAutoMovieVector3[] = segment(radius).map(represented);
      return Vector3.length(Vector3.subtract(pair[0], pair[1])) > 0;
    };
    if (certified(segment(row.radius), gap)) {
      if (!positive(row.radius))
        throw new Error(
          "Hair free coverage has no positive represented row width.",
        );
      return row;
    }
    if (!certified([row.point], gap))
      throw new Error("Hair free centre lacks whole represented clearance.");
    let low: number = 0,
      high: number = row.radius;
    while (true) {
      const mid: number = low / 2 + high / 2;
      if (mid === low || mid === high) break;
      if (certified(segment(mid), gap)) low = mid;
      else high = mid;
    }
    if (!positive(low))
      throw new Error(
        "Hair free coverage has no positive represented row width.",
      );
    return { ...row, radius: low };
  };
  for (let at: number = 0; at < rows.length; at++) {
    const row: Row = rows[at];
    if (
      row === undefined ||
      row === null ||
      row.point === undefined ||
      row.point === null ||
      row.across === undefined ||
      row.across === null ||
      ![
        row.point.x,
        row.point.y,
        row.point.z,
        row.across.x,
        row.across.y,
        row.across.z,
        row.v,
      ].every(Number.isFinite)
    )
      throw new Error("Hair coverage requires dense finite derived rows.");
    const order: number = ["root", "stem", "free"].indexOf(row.region);
    if (
      order < 0 ||
      (at > 0 &&
        order < ["root", "stem", "free"].indexOf(rows[at - 1].region)) ||
      (rows[at].region === "root" &&
        (at !== 0 ||
          rows[at].radius !== 0 ||
          rows.length < 2 ||
          props.attachment === undefined))
    )
      throw new Error(
        "Hair coverage requires valid derived root/stem/free region and canonical attachment metadata.",
      );
  }
  const output: Row[] = rows.map(
    (row: Row): Row =>
      fit({ ...row, point: { ...row.point }, across: { ...row.across } }),
  );
  const width: (row: Row) => number = (row: Row): number => {
    const pair: IAutoMovieVector3[] = [-1, 1].map(
      (side: number): IAutoMovieVector3 => represented(corner(row, side)),
    );
    return Vector3.length(Vector3.subtract(pair[0], pair[1]));
  };
  // Centres stay in the convex cell. Width changes are rechecked in the actual
  // represented coordinates; mathematical nesting does not excuse F32 rounding.
  const patch: (a: Row, b: Row) => IAutoMovieVector3[] = (
    a: Row,
    b: Row,
  ): IAutoMovieVector3[] => [
    a.point,
    b.point,
    corner(a, -1),
    corner(a, 1),
    corner(b, -1),
    corner(b, 1),
  ];
  let at: number = 1;
  while (at < output.length) {
    const before: Row = output[at - 1],
      after: Row = output[at];
    const rooted: boolean = before.region === "root";
    const clearance: number =
      before.region === "free" && after.region === "free" ? props.clearance : 0;
    const attachment: IAutoMovieMeshSeparationAttachment | undefined = rooted
      ? props.attachment
      : undefined;
    const shape: (a: Row, b: Row) => IAutoMovieVector3[] = (
      a: Row,
      b: Row,
    ): IAutoMovieVector3[] =>
      rooted ? [a.point, corner(b, -1), corner(b, 1)] : patch(a, b);
    if (certified(shape(before, after), clearance, attachment)) {
      at++;
      continue;
    }
    const chord: IAutoMovieVector3[] = rooted
      ? [before.point, after.point, after.point]
      : [before.point, after.point];
    if (!certified(chord, clearance, attachment))
      throw new Error(
        "Hair boundary chord lacks whole represented clearance or root registration.",
      );
    let low: number = 0,
      high: number = 1;
    const scaled: (row: Row, fraction: number) => Row = (
      row: Row,
      fraction: number,
    ): Row => ({
      ...row,
      radius: row.radius * fraction,
    });
    while (true) {
      const mid: number = low / 2 + high / 2;
      if (mid === low || mid === high) break;
      if (
        certified(
          shape(scaled(before, mid), scaled(after, mid)),
          clearance,
          attachment,
        )
      )
        low = mid;
      else high = mid;
    }
    const first: Row = scaled(before, low),
      second: Row = scaled(after, low);
    if (!(Math.min(rooted ? Infinity : width(first), width(second)) > 0))
      throw new Error(
        "Hair boundary span has no positive represented coverage profile.",
      );
    // low was certified while the initial cell was not. On the same resident
    // snapshots and target, both complete corner runs cannot remain identical:
    // deterministic readers would otherwise give those runs the same verdict.
    output[at - 1] = first;
    output[at] = second;
    at = Math.max(1, at - 1);
  }
  return output;
}
