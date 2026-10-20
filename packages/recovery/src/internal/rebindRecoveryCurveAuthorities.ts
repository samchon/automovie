import type { IRecoveryAuthorityRecord } from "./IRecoveryAuthorityRecord";
import {
  type IAutoMovieCurve64 as C,
  AutoMovieCurveMath64 as M,
} from "@automovie/engine/geometry/curve";

import type { IAutoMovieRecoveryHermiteCurve } from "../structures/curve/IAutoMovieRecoveryHermiteCurve";
import type { IAutoMovieRecoveryHermiteSpan } from "../structures/curve/IAutoMovieRecoveryHermiteSpan";
import type { AutoMovieRecoveryCurveFormat } from "../typings/AutoMovieRecoveryCurveFormat";

/**
 * Reissue explicitly bound surface controls from the converted curve authority.
 * The generic converter calls this only after admitting and copying plain data.
 * Original bindings must match exactly before a new basis can supply a control.
 * A Hermite publication owns the Bernstein coefficients obtained from its saved
 * endpoints, derivatives and original phase widths; finite round trips can differ
 * from a previous Bernstein publication. Shared control IDs must agree exactly. Reissued bound point records and per-geometry control lists prevent unrelated metadata aliases from propagating coordinate writes.
 *
 * @evidence contracts/common.md#principled-implementation Original forward millimetre-to-metre bindings are checked before the selected curve basis determines every explicitly bound target control.
 * @evidence contracts/common.md#clear-and-simple-design One conversion-scoped authority pass owns bundle and standalone override bindings; realizers retain strict coefficient equality checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No tolerance, weld, averaging, source mesh or fallback coefficient table resolves a conflicting authority.
 * @evidence contracts/common.md#meaningful-documentation States pre-admitted plain input, immutable source, target-only writes, physical conversion and binary64 basis ownership.
 * @evidence contracts/performance.md#efficient-algorithms A paired metadata traversal and named-curve scans cost O(N+S+B) time and storage for N records, S cubic spans and B bound controls.
 * @evidence contracts/performance.md#reuse-equivalent-work Weak sets visit aliased source records once and call-local curve maps reuse each declared coefficient owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Conversion-scoped registries expire on return or throw; only the already copied target receives updates.
 */
export function rebindRecoveryCurveAuthorities(
  source: unknown,
  copy: unknown,
  format: AutoMovieRecoveryCurveFormat,
): void {
  if (format !== "bezier" && format !== "hermite")
    throw new Error("Curve authority conversion requires a declared basis");
  const visited: WeakSet<object> = new WeakSet();
  const pending: Map<
    IRecoveryAuthorityRecord,
    Map<number, C.Vector>
  > = new Map();
  const curveCache: WeakMap<object, readonly C.Span[]> = new WeakMap();
  const record: (value: unknown) => IRecoveryAuthorityRecord | undefined = (
    value: unknown,
  ): IRecoveryAuthorityRecord | undefined =>
    value !== null && typeof value === "object" && !Array.isArray(value)
      ? (value as IRecoveryAuthorityRecord)
      : undefined;
  const required: (value: unknown) => IRecoveryAuthorityRecord = (
    value: unknown,
  ): IRecoveryAuthorityRecord => {
    const row: IRecoveryAuthorityRecord | undefined = record(value);
    if (!row)
      throw new Error("A bound curve publication requires plain records");
    return row;
  };
  const array: (value: unknown) => readonly unknown[] = (
    value: unknown,
  ): readonly unknown[] => {
    if (!Array.isArray(value))
      throw new Error("A bound curve publication requires explicit arrays");
    return value;
  };
  const canonical: (value: unknown) => readonly C.Span[] = (
    value: unknown,
  ): readonly C.Span[] => {
    const row: IRecoveryAuthorityRecord = required(value);
    const previous: readonly C.Span[] | undefined = curveCache.get(row);
    if (previous) return previous;
    if (row.type === "cubicBezier") {
      const spans: readonly C.Span[] = array(row.spans) as readonly C.Span[];
      curveCache.set(row, spans);
      return spans;
    }
    if (row.type !== "cubicHermite")
      throw new Error(
        "A bound surface requires an explicit cubic curve authority",
      );
    const curve: IAutoMovieRecoveryHermiteCurve =
      value as IAutoMovieRecoveryHermiteCurve;
    const spans: readonly C.Span[] = curve.spans.map(
      (span: IAutoMovieRecoveryHermiteSpan, index: number): C.Span =>
        M.hermite(
          M.clone(span.start),
          M.clone(span.end),
          M.clone(span.startDerivative),
          M.clone(span.endDerivative),
          curve.phaseIntervals[index]!,
        ),
    );
    curveCache.set(row, spans);
    return spans;
  };
  const bind: (
    originalGeometry: unknown,
    convertedGeometry: unknown,
    id: unknown,
    original: C.Vector,
    converted: C.Vector,
  ) => void = (
    originalGeometry: unknown,
    convertedGeometry: unknown,
    id: unknown,
    original: C.Vector,
    converted: C.Vector,
  ): void => {
    const geometry: IRecoveryAuthorityRecord = required(originalGeometry);
    const target: IRecoveryAuthorityRecord = required(convertedGeometry);
    if (typeof id !== "number" || !Number.isSafeInteger(id) || id < 0)
      throw new Error(
        "A curve binding requires an in-range integer control ID",
      );
    const point: IRecoveryAuthorityRecord = required(
      array(geometry.controls)[id],
    );
    const targetPoint: IRecoveryAuthorityRecord = required(
      array(target.controls)[id],
    );
    if (
      original[0] * 0.001 !== point.x ||
      original[1] * 0.001 !== point.y ||
      original[2] * 0.001 !== point.z
    )
      throw new Error(
        "Original surface controls do not share their declared curve authority",
      );
    const next: C.Vector = [
      converted[0] * 0.001,
      converted[1] * 0.001,
      converted[2] * 0.001,
    ];
    if (!next.every(Number.isFinite))
      throw new Error("Converted boundary coefficients must remain finite");
    let owners: Map<number, C.Vector> | undefined = pending.get(target);
    if (!owners) {
      owners = new Map();
      pending.set(target, owners);
    }
    const previous: C.Vector | undefined = owners.get(id);
    if (
      previous &&
      previous.some((x: number, axis: number): boolean => x !== next[axis])
    )
      throw new Error(
        "Converted curves require conflicting values for one declared control authority",
      );
    if (
      ![targetPoint.x, targetPoint.y, targetPoint.z].every(
        (x: unknown): boolean => typeof x === "number" && Number.isFinite(x),
      )
    )
      throw new Error("A converted surface control must be a finite position");
    owners.set(id, next);
  };
  const publication: (
    original: IRecoveryAuthorityRecord,
    converted: IRecoveryAuthorityRecord,
  ) => void = (
    original: IRecoveryAuthorityRecord,
    converted: IRecoveryAuthorityRecord,
  ): void => {
    const originals: Map<string, unknown> = new Map();
    const targets: Map<string, unknown> = new Map();
    const register: (a: unknown, b: unknown) => void = (
      a: unknown,
      b: unknown,
    ): void => {
      const curve: IRecoveryAuthorityRecord = required(a);
      const target: IRecoveryAuthorityRecord = required(b);
      if (
        typeof curve.name !== "string" ||
        !curve.name ||
        target.name !== curve.name ||
        originals.has(curve.name)
      )
        throw new Error(
          "A bound publication needs one unique named curve owner",
        );
      originals.set(curve.name, a);
      targets.set(curve.name, b);
    };
    const externalCurves: boolean =
      original.loft === undefined && original.reports === undefined;
    if (externalCurves) {
      const overrides: readonly unknown[] = array(original.curveOverrides);
      const targetOverrides: readonly unknown[] = array(
        converted.curveOverrides,
      );
      for (let i: number = 0; i < overrides.length; i++)
        register(
          required(overrides[i]).curve,
          required(targetOverrides[i]).curve,
        );
    } else {
      const sections: readonly unknown[] = array(
        required(original.loft).sections,
      );
      const convertedSections: readonly unknown[] = array(
        required(converted.loft).sections,
      );
      for (let i: number = 0; i < sections.length; i++) {
        const loops: readonly unknown[] = array(required(sections[i]).loops);
        const targetLoops: readonly unknown[] = array(
          required(convertedSections[i]).loops,
        );
        for (let j: number = 0; j < loops.length; j++)
          register(required(loops[j]).curve, required(targetLoops[j]).curve);
      }
      const reports: readonly unknown[] = array(original.reports);
      const convertedReports: readonly unknown[] = array(converted.reports);
      for (let i: number = 0; i < reports.length; i++) {
        const arcs: readonly unknown[] = array(required(reports[i]).open);
        const targetArcs: readonly unknown[] = array(
          required(convertedReports[i]).open,
        );
        for (let j: number = 0; j < arcs.length; j++)
          register(required(arcs[j]).curve, required(targetArcs[j]).curve);
      }
    }
    const spans: (
      name: unknown,
    ) => readonly [readonly C.Span[], readonly C.Span[]] = (
      name: unknown,
    ): readonly [readonly C.Span[], readonly C.Span[]] => {
      if (
        typeof name !== "string" ||
        !originals.has(name) ||
        !targets.has(name)
      )
        throw new Error("A surface binding names no unique saved curve");
      return [canonical(originals.get(name)), canonical(targets.get(name))];
    };
    if (original.tensorFamilies !== undefined) {
      const families: readonly unknown[] = array(original.tensorFamilies);
      const targetFamilies: readonly unknown[] = array(
        converted.tensorFamilies,
      );
      for (let i: number = 0; i < families.length; i++) {
        const family: IRecoveryAuthorityRecord = required(families[i]);
        const targetFamily: IRecoveryAuthorityRecord = required(
          targetFamilies[i],
        );
        for (const value of array(family.boundaries)) {
          const boundary: IRecoveryAuthorityRecord = required(value);
          const [before, after]: readonly [
            readonly C.Span[],
            readonly C.Span[],
          ] = spans(boundary.curveName);
          const ids: readonly unknown[] = array(boundary.controlIds);
          if (before.length !== ids.length || after.length !== ids.length)
            throw new Error(
              "Tensor binding cardinality differs from its curve authority",
            );
          for (let span: number = 0; span < ids.length; span++) {
            const controls: readonly unknown[] = array(ids[span]);
            if (controls.length !== 4)
              throw new Error("A tensor boundary span requires four controls");
            for (let k: number = 0; k < 4; k++)
              bind(
                family.geometry,
                targetFamily.geometry,
                controls[k],
                before[span]![k]!,
                after[span]![k]!,
              );
          }
        }
      }
    }
    if (original.analyticDomains !== undefined) {
      const domains: readonly unknown[] = array(original.analyticDomains);
      const targetDomains: readonly unknown[] = array(
        converted.analyticDomains,
      );
      for (let i: number = 0; i < domains.length; i++) {
        const domain: IRecoveryAuthorityRecord = required(domains[i]);
        const targetDomain: IRecoveryAuthorityRecord = required(
          targetDomains[i],
        );
        const owners: Map<unknown, IRecoveryAuthorityRecord> = new Map();
        for (const value of array(
          required(domain.geometry).boundaryAuthorities,
        )) {
          const owner: IRecoveryAuthorityRecord = required(value);
          if (owners.has(owner.id))
            throw new Error("A native boundary authority must be unique");
          owners.set(owner.id, owner);
        }
        for (const value of array(domain.curveBindings)) {
          const binding: IRecoveryAuthorityRecord = required(value);
          // A standalone extension owns only its overrides. Unchanged external
          // curves remain the original bundle's authority and are checked on apply.
          if (
            externalCurves &&
            typeof binding.curveName === "string" &&
            !originals.has(binding.curveName)
          )
            continue;
          const [before, after]: readonly [
            readonly C.Span[],
            readonly C.Span[],
          ] = spans(binding.curveName);
          if (
            typeof binding.span !== "number" ||
            !Number.isSafeInteger(binding.span) ||
            binding.span < 0 ||
            !before[binding.span] ||
            !after[binding.span]
          )
            throw new Error("A native binding requires a declared curve span");
          const owner: IRecoveryAuthorityRecord = required(
            owners.get(binding.authority),
          );
          const ids: readonly unknown[] = array(owner.controlIds);
          if (ids.length !== 4)
            throw new Error("A native authority requires four controls");
          for (let k: number = 0; k < 4; k++)
            bind(
              domain.geometry,
              targetDomain.geometry,
              ids[k],
              before[binding.span]![k]!,
              after[binding.span]![k]!,
            );
        }
      }
    }
  };
  const visit: (original: unknown, converted: unknown) => void = (
    original: unknown,
    converted: unknown,
  ): void => {
    if (
      original === null ||
      typeof original !== "object" ||
      visited.has(original)
    )
      return;
    visited.add(original);
    if (Array.isArray(original)) {
      const target: readonly unknown[] = array(converted);
      for (let i: number = 0; i < original.length; i++)
        visit(original[i], target[i]);
      return;
    }
    const row: IRecoveryAuthorityRecord = required(original);
    const target: IRecoveryAuthorityRecord = required(converted);
    if (
      (row.tensorFamilies !== undefined || row.analyticDomains !== undefined) &&
      ((row.loft !== undefined && row.reports !== undefined) ||
        row.curveOverrides !== undefined)
    )
      publication(row, target);
    for (const key of Object.keys(row)) {
      if (
        key === "spans" &&
        (row.type === "cubicBezier" || row.type === "cubicHermite")
      )
        continue;
      visit(row[key], target[key]);
    }
  };
  visit(source, copy);
  for (const [geometry, owners] of pending) {
    const controls: unknown[] = [...array(geometry.controls)];
    for (const [id, value] of owners) {
      const point: IRecoveryAuthorityRecord = required(controls[id]);
      controls[id] = { ...point, x: value[0], y: value[1], z: value[2] };
    }
    geometry.controls = controls;
  }
}
