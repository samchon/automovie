import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Write the original Hamilton product a*b into one caller-owned quaternion.
 * Compute X/Y/Z/W before publishing any field, so target may alias an input. No
 * normalization or unit premise changes the raw product's rounding.
 * Parameter target: Mutable output whose previous components are not read.
 * Parameter a: Outer, later quaternion in the engine's glTF component order.
 * Parameter b: Inner, earlier quaternion; all source reads precede target writes.
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

/*
 * Fixed support metadata for actual OnBasis private inner/outer products.
 */
export namespace multiplyQuaternionInto {
  /*
   * Read all four completed raw Hamilton components without an output record.
   */
  export function read<Result, Context>(
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
    visit: (
      x: number,
      y: number,
      z: number,
      w: number,
      context: Context,
    ) => Result,
    context: Context,
  ): Result {
    const x: number = a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y;
    const y: number = a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x;
    const z: number = a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w;
    const w: number = a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z;
    return visit(x, y, z, w, context);
  }

  /*
   * Read a cardinal-left product on private own-data records. Exactly two
   * products remain per component, in their original relative order/sign. A
   * nonzero finite result is unchanged by omitted signed zeros; zero results
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
      visit: (
        x: number,
        y: number,
        z: number,
        w: number,
        context: Context,
      ) => Result,
      context: Context,
    ): Result => {
      const av: number = a[active];
      const aw: number = a.w;
      if (a[second] !== 0 || a[third] !== 0) return read(a, b, visit, context);
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
      const rx: number = x !== 0 ? x : vectorComponent("x", a, b);
      const ry: number = y !== 0 ? y : vectorComponent("y", a, b);
      const rz: number = z !== 0 ? z : vectorComponent("z", a, b);
      const rw: number =
        w !== 0 ? w : a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z;
      return visit(rx, ry, rz, rw, context);
    };
  }

  /*
   * Classify two unchanged cardinal axes for private own-data factor records. A
   * dense, degenerate, nonfinite or same-axis pair returns the direct writer.
   * For supported actual factors, nonzero sole products equal the full formula;
   * zero results retain that component's original formula and signed-zero
   * terms.
   */
  export function prepareCardinal(
    aAxis: IAutoMovieVector3,
    bAxis: IAutoMovieVector3,
  ): (
    target: IAutoMovieQuaternion,
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
  ) => void {
    const ai: number | undefined = cardinal(aAxis);
    const bi: number | undefined = cardinal(bAxis);
    if (ai === undefined || bi === undefined || ai === bi)
      return multiplyQuaternionInto;
    const ak: Component = COMPONENTS[ai]!;
    const bk: Component = COMPONENTS[bi]!;
    const ck: Component = COMPONENTS[3 - ai - bi]!;
    const positive: boolean = (ai + 1) % 3 === bi;
    return (
      target: IAutoMovieQuaternion,
      a: IAutoMovieQuaternion,
      b: IAutoMovieQuaternion,
    ): void => {
      const av: number = a[ak];
      const aw: number = a.w;
      const bv: number = b[bk];
      const bw: number = b.w;
      if (a[bk] !== 0 || a[ck] !== 0 || b[ak] !== 0 || b[ck] !== 0) {
        multiplyQuaternionInto(target, a, b);
        return;
      }
      const pa: number = av * bw;
      const pb: number = aw * bv;
      const cross: number = av * bv;
      const pc: number = positive ? cross : -cross;
      const pw: number = aw * bw;

      const ra: number = pa !== 0 ? pa : vectorComponent(ak, a, b);
      const rb: number = pb !== 0 ? pb : vectorComponent(bk, a, b);
      const rc: number = pc !== 0 ? pc : vectorComponent(ck, a, b);
      const rw: number =
        pw !== 0 ? pw : a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z;
      target[ak] = ra;
      target[bk] = rb;
      target[ck] = rc;
      target.w = rw;
    };
  }
}

/*
 * The three vector-component labels in the Hamilton product's right-handed
 * order.
 */
const COMPONENTS: readonly ["x", "y", "z"] = ["x", "y", "z"];

/*
 * Exact finite single-component support; no magnitude normalization or axis
 * tolerance.
 */
function cardinal(axis: IAutoMovieVector3): number | undefined {
  const x: number = axis.x;
  const y: number = axis.y;
  const z: number = axis.z;
  if (x !== 0 && y === 0 && z === 0) return 0;
  if (x === 0 && y !== 0 && z === 0) return 1;
  return x === 0 && y === 0 && z !== 0 ? 2 : undefined;
}

/*
 * The original complete vector expression, used whenever its sole product is
 * zero.
 */
function vectorComponent(
  axis: Component,
  a: IAutoMovieQuaternion,
  b: IAutoMovieQuaternion,
): number {
  if (axis === "x") return a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y;
  if (axis === "y") return a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x;
  return a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w;
}

/*
 * One Cartesian vector component, distinct from the quaternion scalar
 * component.
 */
type Component = (typeof COMPONENTS)[number];
