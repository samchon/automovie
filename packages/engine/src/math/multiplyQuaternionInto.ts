import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/** The three vector-component labels in the Hamilton product's right-handed order. */
const COMPONENTS: readonly ["x", "y", "z"] = ["x", "y", "z"];

/** One Cartesian vector component, distinct from the quaternion scalar component. */
type Component = (typeof COMPONENTS)[number];

/**
 * Write the original Hamilton product a*b into one caller-owned quaternion.
 * Compute X/Y/Z/W before publishing any field, so target may alias an input.
 * No normalization or unit premise changes the raw product's rounding.
 *
 * @param target Mutable output whose previous components are not read.
 * @param a Outer, later quaternion in the engine's glTF component order.
 * @param b Inner, earlier quaternion; all source reads precede target writes.
 * @evidence contracts/development/common.md#meaningful-documentation Defines Hamilton/application order, write-target ownership/alias safety, scalar read's completed X/Y/Z/W plus context and synchronous result ownership, no normalization, and prepared own-data/zero/finite premises with exact fallbacks/lifetime.
 * @evidence contracts/development/implementation.md#principled-implementation Direct writes keep Quaternion.multiply's original four expressions/read order. Distinct Cartesian supports leave one potentially nonzero product per output; a cardinal left factor leaves two in their original relative order/sign. Every omitted term is a signed zero. Adding/subtracting zeros leaves a finite nonzero partial/result unchanged; exact zero results use their original full component expression, preserving zero signs. Unsupported/nonfinite products retain full expressions. All completed outputs precede writes or a visitor.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This internal math owner serves OnBasis's private inner scratch and raw-scalar outer scoring. read completes the original expressions before its visitor; prepared inner/outer readers retain only fixed support labels/sign and exact fallbacks, never numerical inputs or results. Public fresh multiply keeps direct record construction with no new root destination/scalar surface or normalization variant.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Direct writes/scalar reads are unconditional and keep the four original Hamilton expressions/read order. A scalar visitor runs once after all values complete; errors propagate without stored visitor/context. Prepared calls require actual off-axis zeros/finite inputs/products; mismatches use the full product and exact zero outputs retain full components. No unit inference, tolerance, repair, changed association or target/result cache permits omission; ordinary/accessor bases receive no extra classification probes.
 * @evidence contracts/development/implementation.md#efficient-algorithms Direct write/read retains sixteen products/twelve additions without a record. Supported nonzero inner outputs use four products and cardinal-left outer outputs use eight, omitting twelve/eight products respectively with guards/zero fallbacks; nonfinite cases retain direct work. Scalar scoring omits the outer record. One private inner record serves each query and public fresh multiply receives no extra dispatch. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Actual OnBasis operations classify only normalizer-owned immutable axes once and share fixed-support inner/outer readers. Every actual private own-data pair passes its current zero/finite guards and computes current products; only support metadata/storage is reused. Dense/unowned inputs keep direct formulas and no factor, target or product result enters preparation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Direct writes borrow three records; scalar reads borrow two plus visitor/context synchronously and retain none. The visitor owns its result. Prepared inner/outer readers retain at most three labels/sign or one index/three labels until operation release, with no axis/quaternion/target/result. OnBasis owns one private inner target per query and creates required fresh outputs; no global workspace/history, handle or task exists.
 */
export function multiplyQuaternionInto(
  target: IAutoMovieQuaternion,
  a: IAutoMovieQuaternion,
  b: IAutoMovieQuaternion,
): void {
  const x: number = a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y;
  const y: number = a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x;
  const z: number = a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w;
  const w: number = a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z;
  target.x = x;
  target.y = y;
  target.z = z;
  target.w = w;
}

/**
 * Fixed support metadata for actual OnBasis private inner/outer products.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines distinct-support inner and cardinal-left outer patterns, private own-data premises, per-call zero/finite guards, original dense/nonfinite and zero-result fallbacks, completed scalar/target ownership and release.
 * @evidence contracts/development/design.md#principled-representation Cartesian axis-angle factors have one vector support plus scalar W. Distinct supports leave one potentially nonzero product per output; a cardinal left support leaves two in original order/sign. Current support/finite guards establish that every omitted term is a signed zero, with original expressions retained for zero results.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepareCardinal serves actual OnBasis inner scratch and prepareCardinalLeft/read serve actual outer scalar scoring/fresh composition. The caller classifies only genuine normalizer-owned immutable bases; ordinary/copy/accessor bases keep direct formulas. No root barrel, quaternion injection, target cache or different composition order is introduced.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Metadata retains only support labels/index/sign. Every call checks actual off-axis zeros and finite inputs/results; mismatch retains the full product, while exact zero keeps its original component formula. No unit-norm inference, tolerance, angular shortcut or normalization replacement certifies sparse work.
 */
export namespace multiplyQuaternionInto {
  /** Read all four completed raw Hamilton components without an output record. */
  export function read<Result, Context>(
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
    visit: (x: number, y: number, z: number, w: number, context: Context) => Result,
    context: Context,
  ): Result {
    const x: number = a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y;
    const y: number = a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x;
    const z: number = a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w;
    const w: number = a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z;
    return visit(x, y, z, w, context);
  }

  /**
   * Read a cardinal-left product on private own-data records. Exactly two
   * products remain per component, in their original relative order/sign.
   * A nonzero finite result is unchanged by omitted signed zeros; zero results
   * retain the complete original expression. Dense/nonfinite cases use read.
   */
  export function prepareCardinalLeft(axis: IAutoMovieVector3): typeof read {
    const index: number | undefined = cardinal(axis);
    if (index === undefined) return read;
    const active: Component = COMPONENTS[index]!;
    const second: Component = COMPONENTS[(index + 1) % 3]!;
    const third: Component = COMPONENTS[(index + 2) % 3]!;
    return <Result, Context>(
      a: IAutoMovieQuaternion,
      b: IAutoMovieQuaternion,
      visit: (x: number, y: number, z: number, w: number, context: Context) => Result,
      context: Context,
    ): Result => {
      const av: number = a[active];
      const aw: number = a.w;
      if (a[second] !== 0 || a[third] !== 0 ||
        !Number.isFinite(av + aw + b.x + b.y + b.z + b.w))
        return read(a, b, visit, context);
      const wx: number = aw * b.x;
      const wy: number = aw * b.y;
      const wz: number = aw * b.z;
      const ww: number = aw * b.w;
      const sx: number = av * b.x;
      const sy: number = av * b.y;
      const sz: number = av * b.z;
      const sw: number = av * b.w;
      const x: number = index === 0 ? wx + sw : index === 1 ? wx + sz : wx - sy;
      const y: number = index === 0 ? wy - sz : index === 1 ? wy + sw : wy + sx;
      const z: number = index === 0 ? wz + sy : index === 1 ? wz - sx : wz + sw;
      const w: number = ww - (index === 0 ? sx : index === 1 ? sy : sz);
      if (!Number.isFinite(x + y + z + w)) return read(a, b, visit, context);
      const rx: number = x !== 0 ? x : vectorComponent("x", a, b);
      const ry: number = y !== 0 ? y : vectorComponent("y", a, b);
      const rz: number = z !== 0 ? z : vectorComponent("z", a, b);
      const rw: number = w !== 0 ? w
        : a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z;
      return visit(rx, ry, rz, rw, context);
    };
  }

  /**
   * Classify two unchanged cardinal axes for private own-data factor records.
   * A dense, degenerate, nonfinite or same-axis pair returns the direct writer.
   * For supported actual factors, nonzero sole products equal the full formula;
   * zero results retain that component's original formula and signed-zero terms.
   */
  export function prepareCardinal(
    aAxis: IAutoMovieVector3,
    bAxis: IAutoMovieVector3,
  ): (target: IAutoMovieQuaternion, a: IAutoMovieQuaternion, b: IAutoMovieQuaternion) => void {
    const ai: number | undefined = cardinal(aAxis);
    const bi: number | undefined = cardinal(bAxis);
    if (ai === undefined || bi === undefined || ai === bi) return multiplyQuaternionInto;
    const ak: Component = COMPONENTS[ai]!;
    const bk: Component = COMPONENTS[bi]!;
    const ck: Component = COMPONENTS[3 - ai - bi]!;
    const positive: boolean = (ai + 1) % 3 === bi;
    return (target: IAutoMovieQuaternion, a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): void => {
      const av: number = a[ak];
      const aw: number = a.w;
      const bv: number = b[bk];
      const bw: number = b.w;
      if (a[bk] !== 0 || a[ck] !== 0 || b[ak] !== 0 || b[ck] !== 0 ||
        !Number.isFinite(av + aw + bv + bw)) {
        multiplyQuaternionInto(target, a, b);
        return;
      }
      const pa: number = av * bw;
      const pb: number = aw * bv;
      const cross: number = av * bv;
      const pc: number = positive ? cross : -cross;
      const pw: number = aw * bw;
      if (!Number.isFinite(pa + pb + pc + pw)) {
        multiplyQuaternionInto(target, a, b);
        return;
      }
      const ra: number = pa !== 0 ? pa : vectorComponent(ak, a, b);
      const rb: number = pb !== 0 ? pb : vectorComponent(bk, a, b);
      const rc: number = pc !== 0 ? pc : vectorComponent(ck, a, b);
      const rw: number = pw !== 0 ? pw
        : a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z;
      target[ak] = ra;
      target[bk] = rb;
      target[ck] = rc;
      target.w = rw;
    };
  }
}

/** Exact finite single-component support; no magnitude normalization or axis tolerance. */
function cardinal(axis: IAutoMovieVector3): number | undefined {
  const x: number = axis.x;
  const y: number = axis.y;
  const z: number = axis.z;
  if (!Number.isFinite(x + y + z)) return undefined;
  if (x !== 0 && y === 0 && z === 0) return 0;
  if (x === 0 && y !== 0 && z === 0) return 1;
  return x === 0 && y === 0 && z !== 0 ? 2 : undefined;
}

/** The original complete vector expression, used whenever its sole product is zero. */
function vectorComponent(
  axis: Component,
  a: IAutoMovieQuaternion,
  b: IAutoMovieQuaternion,
): number {
  if (axis === "x") return a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y;
  if (axis === "y") return a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x;
  return a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w;
}
