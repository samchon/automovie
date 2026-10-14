import { swingConeAngle } from "@automovie/engine";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../../../structures/IAutoMovieHumanBodyBasis";

/**
 * Admit declared one-way clinical joint couplings in basis order.
 *
 * Each curve's first ordinate is zero and its onset is no more than 1e-9 degrees below declared source-rest elevation. It adds only to one mobile output axis and keeps that axis's declared neutral plus every ordinate in range. Chained drivers, cycles and double writes of one output axis are refused. Seth et al. 2016 (doi:10.1371/journal.pone.0141028) model scapulothoracic elevation, abduction, upward rotation and winging as four degrees of freedom; this legacy public-girdle coupling has no such joint. The nanodegree allowance below addresses the numerical error of `2 acos(cos θ)` when reading the same rest cone, not a morphology tolerance. A shaped shoulder rest can exceed this declared onset; metadata admission does not prove zero contribution there. A public shoulder coupling still cannot create the absent scapulothoracic degrees of freedom or skin binding.
 *
 * @evidence contracts/common.md#principled-implementation Declared one-way source/output joints and ordered finite zero-at-rest curves remain within output reach, rejecting cycles/chains and duplicate axis writes under prior joint admission.
 * @evidence contracts/common.md#clear-and-simple-design One coupling stage owns scalar dependency structure and curve validity while clinical FK and independent scapular articulation remain separate responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 1e-9-degree rest-cone allowance addresses a shared trigonometric representation error; it cannot relax anatomical ranges or create missing scapulothoracic degrees of freedom.
 * @evidence contracts/common.md#meaningful-documentation The prose gives one-way order, declared onset and its shaped-rest limitation, duplicate-output refusal and the numerical-versus-morphological tolerance distinction.
 * @evidence contracts/performance.md#efficient-algorithms Source/output/ID sets plus a full scan of C couplings and K curve knots cost O(C+K) expected lookup work and O(C) transient storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller's admitted joint map is reused and one source set covers every chain/cycle test without repeated joint-array searches.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local sets and curve references expire after synchronous checks, acquiring no FK tasks and leaving caller joints/curves unchanged.
 */
export function assertHumanBodyRigCouplings(
  basis: IAutoMovieHumanBodyBasis,
  joints: ReadonlyMap<
    AutoMovieHumanoidBone,
    IAutoMovieHumanBodyBasis["joints"][number]
  >,
): void {
  // A coupling is a declared driver, so everything it names must resolve and
  // everything it can add must already be admissible: declared source and
  // output joints, an open output axis (the unconstrained root has none), at
  // least two finite knots strictly increasing in elevation, the first no more
  // than a nanodegree below declared source rest with a zero ordinate so that
  // fixed rest and lower elevations add nothing, and every
  // rest-plus-ordinate inside the axis's range, so a coupling alone never
  // produces an angle the pose validator refuses. The rest elevation is read
  // through the same cone formula the evaluation uses, whose pure-plane
  // result carries float error (`2 acos(cos 10)` is not exactly 20), so a
  // first knot authored at the rest angle is admitted within a nanodegree
  // and evaluation extends the zero region a nanodegree above the first knot.
  // A shaped shoulder rest can lie beyond that region. An output joint
  // that is any coupling's source (its own included) would chain, and a
  // second coupling into one axis would add twice, so both are refused.
  const sources: Set<AutoMovieHumanoidBone> = new Set(
    (basis.couplings ?? []).map(
      (
        coupling: NonNullable<IAutoMovieHumanBodyBasis["couplings"]>[number],
      ): AutoMovieHumanoidBone => coupling.source.bone,
    ),
  );
  const outputs: Set<string> = new Set<string>();
  const couplingIds: Set<string> = new Set<string>();
  for (const coupling of basis.couplings ?? []) {
    const source: IAutoMovieHumanBodyBasis["joints"][number] | undefined =
      joints.get(coupling.source.bone);
    const output: IAutoMovieHumanBodyBasis["joints"][number] | undefined =
      joints.get(coupling.output.bone);
    const range: { min: number; max: number } | null =
      output?.constraint?.[coupling.output.axis] ?? null;
    const key: string = coupling.output.bone + "." + coupling.output.axis;
    const curve: NonNullable<
      IAutoMovieHumanBodyBasis["couplings"]
    >[number]["curve"] = coupling.curve;
    if (
      coupling.id.trim() === "" ||
      couplingIds.has(coupling.id) ||
      source === undefined ||
      output === undefined ||
      range === null ||
      sources.has(coupling.output.bone) ||
      outputs.has(key) ||
      curve.length < 2 ||
      curve[0][0] <
        (source.shoulder?.neutral.elevation ??
          swingConeAngle(source.neutral.flexion, source.neutral.abduction)) -
          1e-9 ||
      curve[0][1] !== 0 ||
      curve.some(
        ([elevation, degrees]: readonly [number, number], i: number): boolean =>
          !Number.isFinite(elevation) ||
          !Number.isFinite(degrees) ||
          (i > 0 && elevation <= curve[i - 1][0]) ||
          output.neutral[coupling.output.axis] + degrees < range.min ||
          output.neutral[coupling.output.axis] + degrees > range.max,
      )
    )
      throw new Error(
        "A body coupling needs a unique id, declared joints, an open output axis no coupling drives from or twice, and an increasing curve starting at zero from the source's rest elevation inside the axis's range: " +
          coupling.id +
          " " +
          coupling.source.bone +
          " -> " +
          key,
      );
    couplingIds.add(coupling.id);
    outputs.add(key);
  }
}
