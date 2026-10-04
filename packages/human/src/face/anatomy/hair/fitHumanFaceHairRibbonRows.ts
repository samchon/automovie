import {
  Vector3,
  type IAutoMovieMeshQueryBudget,
  type createAutoMovieMeshSeparationQuery,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

interface Row {
  point: IAutoMovieVector3;
  across: IAutoMovieVector3;
  radius: number;
  nominal: number;
  v: number;
  region: "root" | "stem" | "free";
}

/**
 * Fit complete transverse rows and the actual swept free coverage profile.
 * Root/stem/free regions and the original sampler attachment are required
 * derived producer metadata, never saved hairstyle controls.
 * Radius is a density-coverage proxy bounded by the original taper's nominal
 * radius, not an authored shaft diameter. All source centres, frames and UV
 * stations survive. A failed span fits both row radii together by a common
 * geometric fraction, changing the actual surface vertices while preserving
 * centreline metric and nominal taper. The fraction is the supported lower end
 * of a representable bisection bracket, not a fixed style factor or a global
 * maximum-coverage optimization claim.
 *
 * Both source and Float32-candidate/current-Float32-host separation must prove
 * each complete free row and emitted triangle's requested gap. Binary64 witnesses
 * or outside corners never substitute for that proof. Width fitting bisects the
 * contiguous centred segment until the midpoint is no longer representable;
 * no subject-specific multiplier, fixed iteration tolerance or silent gap cut
 * exists. A centre without supported gap, nonpositive represented width, missing
 * transverse direction or exhausted shared budget refuses by name.
 *
 * A cell's convex hull includes both complete rows and their centres, hence
 * every emitted triangle. If its centre chord itself cannot be certified, the
 * owner refuses rather than changing that metric path. Shrinking a row changes
 * its neighbouring cell, which is rechecked in both actual coordinate frames;
 * real-arithmetic hull nesting never bypasses Float32 revalidation. Registered
 * root contact is bounded separately, stem cells stay strictly separated, and
 * free cells keep requested clearance.
 * The mutable returned array, records and vectors are owned copies. The shared
 * work budget alone is intentionally caller-owned mutable state.
 * Nothing here establishes hair-to-hair intersection freedom.
 *
 * @evidence contracts/common.md#principled-implementation Whole convex row and triangle separation, rather than endpoint samples, determines the fitted coverage and the complete supported coverage profile.
 * @evidence contracts/common.md#clear-and-simple-design One owner carries row widths, swept-span fitting and the shared geometry budget; engine owns every separation formula.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No person, root ordinal or style selects a correction, and an unsupported centreline refuses without reducing the requested gap.
 * @evidence contracts/common.md#meaningful-documentation States the coverage meaning, represented coordinate proofs, preserved metric and unresolved root-contact boundary.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The enclosing mesh builder names the layer and its material.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author field and consumes derived row geometry.
 * @evidence contracts/modeling.md#emitted-geometry Retains every original centre/frame/UV row and fits actual transverse radii until the whole swept convex cell supplies a separation certificate.
 * @evidence contracts/modeling.md#spatial-conventions Rows and host queries share head-local metres; UV v remains the original cumulative metric fraction, without resampling the curve.
 * @evidence contracts/modeling.md#shared-boundaries Both source and represented host queries must certify complete free rows and triangles; no permitted root contact is widened into a free-span exception.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Coverage fitting supplies no anatomical quantity or biological follicle model.
 * @evidenceExclude contracts/anatomy.md#permitted-range Consumes admitted coverage/clearance geometry without defining an anatomical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Introduces no saved author input or personal shape authority.
 * @author Samchon
 */
export function fitHumanFaceHairRibbonRows(
  rows: readonly Row[],
  props: {
    clearance: number;
    source: ReturnType<typeof createAutoMovieMeshSeparationQuery>;
    represented: ReturnType<typeof createAutoMovieMeshSeparationQuery>;
    budget: IAutoMovieMeshQueryBudget;
    attachment:
      | {
          triangle: number;
          weights: readonly number[];
          supports: readonly number[];
        }
      | undefined;
  },
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
  const corner = (row: Row, side: number): IAutoMovieVector3 =>
    Vector3.add(row.point, Vector3.scale(row.across, side * row.radius));
  const represented = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
    x: Math.fround(p.x),
    y: Math.fround(p.y),
    z: Math.fround(p.z),
  });
  const certified = (
    vertices: readonly IAutoMovieVector3[],
    clearance: number,
    attachment?: NonNullable<typeof props.attachment>,
  ): boolean => {
    const options = { clearance, budget: props.budget, attachment };
    return (
      props.source(vertices, options).certified &&
      props.represented(vertices.map(represented), options).certified
    );
  };
  const fit = (row: Row): Row => {
    if (row.region === "root") return row;
    const gap = row.region === "free" ? props.clearance : 0;
    if (
      !(row.radius > 0) ||
      !(row.nominal > 0) ||
      !Number.isFinite(row.radius) ||
      !Number.isFinite(row.nominal) ||
      row.radius > row.nominal
    )
      throw new Error("Hair free row needs positive coverage radii.");
    const segment = (radius: number): IAutoMovieVector3[] =>
      [-1, 1].map((side) => corner({ ...row, radius }, side));
    const positive = (radius: number): boolean => {
      const pair = segment(radius).map(represented);
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
    let low = 0,
      high = row.radius;
    while (true) {
      const mid = low / 2 + high / 2;
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
  for (let at = 0; at < rows.length; at++) {
    const row = rows[at];
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
    const order = ["root", "stem", "free"].indexOf(row.region);
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
  const output = rows.map((row) =>
    fit({ ...row, point: { ...row.point }, across: { ...row.across } }),
  );
  const width = (row: Row): number => {
    const pair = [-1, 1].map((side) => represented(corner(row, side)));
    return Vector3.length(Vector3.subtract(pair[0], pair[1]));
  };
  // Centres stay in the convex cell. Width changes are rechecked in the actual
  // represented coordinates; mathematical nesting does not excuse F32 rounding.
  const patch = (a: Row, b: Row): IAutoMovieVector3[] => [
    a.point,
    b.point,
    corner(a, -1),
    corner(a, 1),
    corner(b, -1),
    corner(b, 1),
  ];
  let at = 1;
  while (at < output.length) {
    const before = output[at - 1],
      after = output[at];
    const rooted = before.region === "root";
    const clearance =
      before.region === "free" && after.region === "free" ? props.clearance : 0;
    const attachment = rooted ? props.attachment : undefined;
    const shape = (a: Row, b: Row): IAutoMovieVector3[] =>
      rooted ? [a.point, corner(b, -1), corner(b, 1)] : patch(a, b);
    if (certified(shape(before, after), clearance, attachment)) {
      at++;
      continue;
    }
    const chord = rooted
      ? [before.point, after.point, after.point]
      : [before.point, after.point];
    if (!certified(chord, clearance, attachment))
      throw new Error(
        "Hair boundary chord lacks whole represented clearance or root registration.",
      );
    let low = 0,
      high = 1;
    const scaled = (row: Row, fraction: number): Row => ({
      ...row,
      radius: row.radius * fraction,
    });
    while (true) {
      const mid = low / 2 + high / 2;
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
    const first = scaled(before, low),
      second = scaled(after, low);
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
