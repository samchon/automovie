/**
 * A tissue scale applied about a scaling centre: the proposal for the native source law's coordinate scale.
 *
 * The native wall scale multiplies each chart coordinate of the source function by the directional ratio, `a(s) f(s)`, which scales the
 * section about the course point. The course is the line the sections are lofted about, not the skeleton: where it stands off the bone, a
 * ratio of 1.1 moves the bone's place in the section and grows the body to one side. With a scaling centre `c(s)`, the chart coordinate
 * of the skeletal datum in the section plane, the scaled coordinate is
 *
 * `h(s) = c(s) + a(s) (f(s) - c(s))`
 *
 * so the datum stays where it is and the tissue grows round it. With station derivatives written `'`:
 *
 * `h' = c' + a' (f - c) + a (f' - c')` and `h'' = c'' + a'' (f - c) + 2 a' (f' - c') + a (f'' - c'')`.
 *
 * At `c = 0` this is the present law `a f` with its product-rule jet, and at `a = 1` it is `f` itself. It applies to a coordinate field
 * along one chart direction with that direction's ratio and that direction's centre coordinate; shares, turns and shoulders are not
 * scaled, as now.
 */
export namespace AutoMovieHumanNativeScaleCentre {
  /** A scalar function's value and first two station derivatives: `[value, per mm, per mm squared]`. */
  export type IJet = readonly [number, number, number];

  /**
   * The jet of `c + a (f - c)` from the jets of the ratio `a`, the coordinate `f` and the centre `c` at one station.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The product rule on `a (f - c)` plus `c`, to second order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three closed-form lines.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A unit ratio with no slope returns the coordinate's own jet, so an unchanged person reads the stored numbers bit for bit; no finite difference.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure formula coordinates no shared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one triple or the given one.
   */
  export function apply(a: IJet, f: IJet, c: IJet): IJet {
    if (a[0] === 1 && a[1] === 0 && a[2] === 0) return f;
    const d: IJet = [f[0] - c[0], f[1] - c[1], f[2] - c[2]];
    return [c[0] + a[0] * d[0], c[1] + a[1] * d[0] + a[0] * d[1], c[2] + a[2] * d[0] + 2 * a[1] * d[1] + a[0] * d[2]];
  }
}
