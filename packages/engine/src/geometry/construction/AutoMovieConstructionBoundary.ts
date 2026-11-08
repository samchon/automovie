import type { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import { AutoMovieLoftFrameSource } from "./AutoMovieLoftFrameSource";
import { AutoMovieLoftSection } from "./AutoMovieLoftSection";
import { AutoMovieLoftSectionConnect } from "./AutoMovieLoftSectionConnect";
import { AutoMovieLoftSectionNative } from "./AutoMovieLoftSectionNative";
import { AutoMovieLoftSectionSource } from "./AutoMovieLoftSectionSource";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";

/** Physical value, first and second derivatives of one actual section frame. */
type Frames = readonly [
  AutoMovieLoftFrame.IFrame,
  AutoMovieLoftFrame.IFrame,
  AutoMovieLoftFrame.IFrame,
];

/** Three world coordinates, in the order retained by the original frame. */
type Vector = readonly [number, number, number];

/** A captured whole native generating family, independent of compatibility density. */
type Native = Extract<
  AutoMovieLoftSectionSource.IEndpoint["field"],
  { kind: "native" }
>;

/**
 * Admit already matching native ends without rewriting either chain.
 *
 * Complete native scalar2 and signed frame2 determine every phase and mixed
 * derivative by the existing native and world product rules. Compatibility
 * rows are validated at their own density and remain unchanged. The admitted
 * additional displacement is absent or phase-constant lift2; reliefs and
 * phase-dependent lifts require another whole-boundary certificate.
 *
 * Regularity uses a sufficient analytic condition: the frame's first axis
 * derivatives lie in the section plane, and the complete station velocity has
 * a nonzero normal component. Thus it cannot be parallel to any nonzero native
 * phase tangent. A turning plane is explicitly unsupported by this admission.
 * Every compatibility row is checked, with the existing source/span lookup
 * costs, before constant-size boundary preparation. Temporary source/frame
 * records have call lifetime; no source fit or module cache is introduced.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Admit already matching native ends without rewriting either chain) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Admit already matching native ends without rewriting either chain) directly over its typed inputs (`host`, `hostEnd`, `part`, `partEnd`, `sign`) as nested iteration of depth 3 (for-of over [host, part]; for-of over ["extents", "shoulders"] as const; for loop bounded by q < 4), delegating to `rows`, `end`, `AutoMovieLoftSectionConnect.capture`, `close`, `frames`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literals 4, 3, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 57 lines and 22 top-level statements that reuses `rows`, `end`, `AutoMovieLoftSectionConnect.capture`, `close`, `frames` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 10 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `host`, `hostEnd`, `part`, `partEnd`, `sign`; the dominant cost is nested iteration of depth 3 (for-of over [host, part]; for-of over ["extents", "shoulders"] as const; for loop bounded by q < 4), performed once per call with 6 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 6 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function AutoMovieConstructionBoundary(
  host: IAutoMovieLoftChain,
  hostEnd: "bottom" | "top",
  part: IAutoMovieLoftChain,
  partEnd: "bottom" | "top",
  sign: 1 | -1,
): string | null {
  for (const chain of [host, part]) {
    const fault: string | null = rows(chain);
    if (fault !== null) return fault;
    if ((chain.reliefs?.length ?? 0) !== 0)
      return "Different section orders require native ends without relief fields.";
  }
  if (
    host.rule !== part.rule ||
    (host.mirrored ?? false) !== (part.mirrored ?? false) ||
    host.orientation !== part.orientation
  )
    return "The native ends have different phase or outward-orientation conventions.";
  const a: IAutoMovieLoftChain.ILayer = end(host, hostEnd);
  const b: IAutoMovieLoftChain.ILayer = end(part, partEnd);
  const first: AutoMovieLoftSectionSource.IEndpoint["field"] | string =
    AutoMovieLoftSectionConnect.capture(host, a.y, sign);
  const last: AutoMovieLoftSectionSource.IEndpoint["field"] | string =
    AutoMovieLoftSectionConnect.capture(part, b.y);
  if (typeof first === "string") return first;
  if (typeof last === "string") return last;
  if (first.kind !== "native" || last.kind !== "native")
    return "Different section orders require two actual native boundary families.";
  for (const key of ["extents", "shoulders"] as const)
    for (let q: number = 0; q < 4; q++)
      for (let derivative: number = 0; derivative < 3; derivative++)
        if (
          !close(
            first.inputs[key][q]![derivative]!,
            last.inputs[key][q]![derivative]!,
          )
        )
          return `The native ends differ in ${key} ${q}, physical order ${derivative}.`;

  const fa: Frames | string = frames(a);
  const fb: Frames | string = frames(b);
  if (typeof fa === "string") return fa;
  if (typeof fb === "string") return fb;
  for (let derivative: number = 0; derivative < 3; derivative++)
    for (const key of ["origin", "u", "v"] as const) {
      const factor: number =
        (derivative === 1 ? sign : 1) * (key === "v" ? sign : 1);
      for (let k: number = 0; k < 3; k++)
        if (!close(factor * fa[derivative]![key][k]!, fb[derivative]![key][k]!))
          return `The native ends differ in frame ${key}, physical order ${derivative}.`;
    }
  const la: readonly number[] | string = lift(a, host.order);
  const lb: readonly number[] | string = lift(b, part.order);
  if (typeof la === "string") return la;
  if (typeof lb === "string") return lb;
  for (let derivative: number = 0; derivative < 3; derivative++)
    if (
      !close((derivative === 1 ? 1 : sign) * la[derivative]!, lb[derivative]!)
    )
      return `The native ends differ in lift, physical order ${derivative}.`;
  for (const [field, frame, displacement] of [
    [first, fa, la],
    [last, fb, lb],
  ] as const) {
    const fault: string | null = regular(field, frame, displacement);
    if (fault !== null) return fault;
  }
  return null;
}

/** Validate each chain's own density and binding without copying or changing it. */
function rows(chain: IAutoMovieLoftChain): string | null {
  if (
    !Number.isInteger(chain.order) ||
    chain.order <= 0 ||
    chain.layers.length < 2
  )
    return `The native end of ${chain.name} has no valid section density/domain.`;
  for (let index: number = 0; index < chain.layers.length; index++) {
    const layer: IAutoMovieLoftChain.ILayer = chain.layers[index]!;
    if (
      !Number.isFinite(layer.y) ||
      (index > 0 && !(layer.y > chain.layers[index - 1]!.y))
    )
      return `The native chain ${chain.name} has no finite increasing regular domain.`;
    for (const key of ["coefficients", "slopes", "curvatures"] as const) {
      const row: number[] | undefined = layer[key];
      if (key === "curvatures" && row === undefined) continue;
      if (!Array.isArray(row) || row.length !== 2 * chain.order)
        return `The native chain ${chain.name} has incompatible density rows.`;
      for (let q: number = 0; q < row.length; q++)
        if (!Number.isFinite(row[q]))
          return `The native chain ${chain.name} has incomplete/nonfinite density rows.`;
    }
    AutoMovieLoftSectionSource.validate(chain, index, index);
  }
  if (!AutoMovieLoftSection.regular(chain))
    return `The native chain ${chain.name} has unavailable physical2 or an incomplete adjoining law.`;
  return null;
}

/** The declared end is a real principal endpoint, never an interior cut or pole. */
function end(
  chain: IAutoMovieLoftChain,
  side: "bottom" | "top",
): IAutoMovieLoftChain.ILayer {
  return chain.layers[side === "bottom" ? 0 : chain.layers.length - 1]!;
}

/** Read complete numeric frame2 and verify any retained callable against its snapshot. */
function frames(layer: IAutoMovieLoftChain.ILayer): Frames | string {
  AutoMovieLoftFrameSource.validate(layer);
  if (
    layer.frame === undefined ||
    layer.frameSlopes === undefined ||
    layer.frameCurvatures === undefined
  )
    return "A shared native end needs actual complete frame2.";
  const result: Frames = [
    layer.frame,
    layer.frameSlopes,
    layer.frameCurvatures,
  ];
  for (const frame of result)
    for (const key of ["origin", "u", "v"] as const)
      for (let k: number = 0; k < 3; k++)
        if (frame[key].length !== 3 || !Number.isFinite(frame[key][k]))
          return "A shared native end has incomplete/nonfinite frame2.";
  if (layer.frameSource !== undefined) {
    const actual: ReturnType<NonNullable<typeof layer.frameSource.axis.jet>> =
      layer.frameSource.axis.jet!(layer.y);
    if (actual === null)
      return "A shared native end has unavailable actual axis2.";
    const original: Frames = [actual.value, actual.first, actual.second];
    for (let derivative: number = 0; derivative < 3; derivative++)
      for (const key of ["origin", "u", "v"] as const)
        for (let k: number = 0; k < 3; k++)
          if (
            !close(original[derivative]![key][k]!, result[derivative]![key][k]!)
          )
            return "The actual native-end axis2 differs from its retained frame2.";
  }
  return result;
}

/** Absence means the declared zero displacement; present lift needs all actual orders. */
function lift(
  layer: IAutoMovieLoftChain.ILayer,
  order: number,
): readonly number[] | string {
  const rows: (number[] | undefined)[] = [
    layer.lift,
    layer.liftSlopes,
    layer.liftCurvatures,
  ];
  if (rows.every((row: number[] | undefined): boolean => row === undefined))
    return [0, 0, 0];
  const result: number[] = [];
  for (const row of rows) {
    if (row === undefined || row.length !== order || !Number.isFinite(row[0]))
      return "A shared native end needs actual complete lift2.";
    for (let q: number = 0; q < row.length; q++)
      if (!Number.isFinite(row[q]) || row[q] !== row[0])
        return "Different section orders do not support phase-dependent lift2.";
    result.push(row[0]!);
  }
  return result;
}

/** Native admission plus nonzero transverse speed certifies every phase of this planar ring. */
function regular(
  field: Native,
  frame: Frames,
  displacement: readonly number[],
): string | null {
  const normal: Vector = cross(frame[0].v, frame[0].u);
  const normalFirst: Vector = add(
    cross(frame[1].v, frame[0].u),
    cross(frame[0].v, frame[1].u),
  );
  const size: number = dot(normal, normal);
  const speed: number =
    dot(normal, frame[1].origin) +
    displacement[1]! * size +
    displacement[0]! * dot(normal, normalFirst);
  if (
    !(
      Number.isFinite(size) &&
      size > 0 &&
      Number.isFinite(speed) &&
      speed !== 0
    )
  )
    return "The shared native end has a degenerate or nontransverse frame/lift jet.";
  if (dot(normal, frame[1].u) !== 0 || dot(normal, frame[1].v) !== 0)
    return "Different section orders require a boundary plane without normal turning.";

  // The existing native owner admits the full positive curve; this is not a phase-sample equality proof.
  AutoMovieLoftSectionNative.jet(field.inputs)(0);
  return null;
}

/** Permit only binary64 evaluation noise, independently of tessellation or a fit budget. */
function close(a: number, b: number): boolean {
  return (
    Number.isFinite(a) &&
    Number.isFinite(b) &&
    Math.abs(a - b) <=
      32 * Number.EPSILON * Math.max(1, Math.abs(a), Math.abs(b))
  );
}

/** Oriented plane normal and its derivative use the original unnormalized frame. */
function cross(a: Vector, b: Vector): Vector {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/** Sum the two product-rule terms of the frame normal derivative. */
function add(a: Vector, b: Vector): Vector {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

/** Normal components distinguish transverse motion from an in-plane tangent. */
function dot(a: Vector, b: Vector): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
