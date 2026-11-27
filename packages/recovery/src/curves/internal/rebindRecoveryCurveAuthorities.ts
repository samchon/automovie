import { AutoMovieEngineCurveMath64 as M } from "@automovie/engine";
import type {
  AutoMovieCubicBezierControls3,
  AutoMovieVector3Tuple,
  IAutoMovieBicubicAtlasGeometry,
  IAutoMovieRecoveryCurveBundle,
  IAutoMovieRecoveryHermiteSpan,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Reissue explicitly bound surface controls from the converted curve authority.
 * The generic converter calls this after copying the record. Original bindings
 * must match exactly before a new basis can supply a control. A Hermite
 * publication owns the Bernstein coefficients obtained from its saved
 * endpoints, derivatives and original phase widths; finite round trips can
 * differ from a previous Bernstein publication. Shared control IDs must agree
 * exactly. The converted geometry receives a fresh control list, so the
 * original record never sees the write.
 *
 * A record is a publication when it carries tensor families or analytic domains
 * together with its curves: a loft and reports, or curve overrides alone (a
 * standalone extension, whose unchanged external curves stay the original
 * bundle's authority).
 * Parameter original: The record as saved.
 * Parameter converted: Its converted copy, whose bound controls are rewritten.
 * When names are not unique, a binding names no saved curve or
 * span, a binding's cardinality differs from its curve, or an original
 * control disagrees with its curve authority.
 */
export function rebindRecoveryCurveAuthorities(
  original: IAutoMovieRecoveryCurveBundle,
  converted: IAutoMovieRecoveryCurveBundle,
): void {
  const bound: boolean =
    original.tensorFamilies !== undefined ||
    original.analyticDomains !== undefined;
  const curved: boolean =
    (original.loft !== undefined && original.reports !== undefined) ||
    original.curveOverrides !== undefined;
  if (!bound || !curved) return;
  const external: boolean =
    original.loft === undefined && original.reports === undefined;

  // Each named curve owner, as saved and as converted, in the same order.
  const before: Map<string, readonly AutoMovieCubicBezierControls3[]> = named(
    original,
    external,
  );
  const after: Map<string, readonly AutoMovieCubicBezierControls3[]> = named(
    converted,
    external,
  );

  // The controls each converted geometry receives, by control id.
  const pending: Map<
    IAutoMovieBicubicAtlasGeometry,
    Map<number, AutoMovieVector3Tuple>
  > = new Map();
  const spans = (
    name: string,
  ): readonly [
    readonly AutoMovieCubicBezierControls3[],
    readonly AutoMovieCubicBezierControls3[],
  ] => {
    const first: readonly AutoMovieCubicBezierControls3[] | undefined =
      before.get(name);
    const second: readonly AutoMovieCubicBezierControls3[] | undefined =
      after.get(name);
    if (first === undefined || second === undefined)
      throw new Error("A surface binding names no unique saved curve");
    return [first, second];
  };
  const bind = (
    source: IAutoMovieBicubicAtlasGeometry,
    target: IAutoMovieBicubicAtlasGeometry,
    id: number,
    was: Readonly<AutoMovieVector3Tuple>,
    now: Readonly<AutoMovieVector3Tuple>,
  ): void => {
    const point: IAutoMovieVector3 | undefined = source.controls[id];
    if (point === undefined || target.controls[id] === undefined || id < 0)
      throw new Error("A curve binding requires an in-range control ID");
    if (
      was[0] * 0.001 !== point.x ||
      was[1] * 0.001 !== point.y ||
      was[2] * 0.001 !== point.z
    )
      throw new Error(
        "Original surface controls do not share their declared curve authority",
      );
    const next: AutoMovieVector3Tuple = [
      now[0] * 0.001,
      now[1] * 0.001,
      now[2] * 0.001,
    ];
    let owners: Map<number, AutoMovieVector3Tuple> | undefined =
      pending.get(target);
    if (owners === undefined) {
      owners = new Map();
      pending.set(target, owners);
    }
    const previous: AutoMovieVector3Tuple | undefined = owners.get(id);
    if (
      previous !== undefined &&
      previous.some((x: number, axis: number): boolean => x !== next[axis])
    )
      throw new Error(
        "Converted curves require conflicting values for one declared control authority",
      );
    owners.set(id, next);
  };

  // Tensor families: each boundary's spans bind four controls each.
  (original.tensorFamilies ?? []).forEach((family, index: number): void => {
    const target: IAutoMovieBicubicAtlasGeometry =
      converted.tensorFamilies![index]!.geometry;
    for (const boundary of family.boundaries) {
      const [was, now] = spans(boundary.curveName);
      if (
        was.length !== boundary.controlIds.length ||
        now.length !== boundary.controlIds.length
      )
        throw new Error(
          "Tensor binding cardinality differs from its curve authority",
        );
      boundary.controlIds.forEach(
        (controls: readonly number[], span: number): void => {
          if (controls.length !== 4)
            throw new Error("A tensor boundary span requires four controls");
          for (let k: number = 0; k < 4; k++)
            bind(
              family.geometry,
              target,
              controls[k]!,
              was[span]![k]!,
              now[span]![k]!,
            );
        },
      );
    }
  });

  // Analytic domains: each binding's span binds its authority's four controls.
  (original.analyticDomains ?? []).forEach((domain, index: number): void => {
    const target: IAutoMovieBicubicAtlasGeometry =
      converted.analyticDomains![index]!.geometry;
    const owners: Map<string, readonly number[]> = new Map();
    for (const owner of domain.geometry.boundaryAuthorities ?? []) {
      if (owners.has(owner.id))
        throw new Error("A native boundary authority must be unique");
      owners.set(owner.id, owner.controlIds);
    }
    for (const binding of domain.curveBindings) {
      // A standalone extension owns only its overrides; its unchanged external
      // curves remain the original bundle's authority, checked on apply.
      if (external && !before.has(binding.curveName)) continue;
      const [was, now] = spans(binding.curveName);
      if (was[binding.span] === undefined || now[binding.span] === undefined)
        throw new Error("A native binding requires a declared curve span");
      const ids: readonly number[] | undefined = owners.get(binding.authority);
      if (ids === undefined)
        throw new Error("A native binding names no boundary authority");
      for (let k: number = 0; k < 4; k++)
        bind(
          domain.geometry,
          target,
          ids[k]!,
          was[binding.span]![k]!,
          now[binding.span]![k]!,
        );
    }
  });

  for (const [geometry, owners] of pending) {
    const controls: IAutoMovieVector3[] = [...geometry.controls];
    for (const [id, value] of owners)
      controls[id] = {
        ...controls[id]!,
        x: value[0],
        y: value[1],
        z: value[2],
      };
    geometry.controls = controls;
  }
}

/*
 * A record's named curves as Bernstein spans: from its curve overrides for an
 * external extension, otherwise from its loft loops and report arcs. Names must
 * be unique.
 */
function named(
  record: IAutoMovieRecoveryCurveBundle,
  external: boolean,
): Map<string, readonly AutoMovieCubicBezierControls3[]> {
  const curves: IAutoMovieRecoveryCurveBundle.Curve[] = external
    ? (record.curveOverrides ?? []).map(
        (override: { curve: IAutoMovieRecoveryCurveBundle.Curve }) =>
          override.curve,
      )
    : [
        ...(record.loft?.sections ?? []).flatMap(
          (section: IAutoMovieRecoveryCurveBundle.ISection) =>
            section.loops.map(
              (loop: { curve: IAutoMovieRecoveryCurveBundle.Curve }) =>
                loop.curve,
            ),
        ),
        ...(record.reports ?? []).flatMap(
          (report: {
            open: readonly { curve: IAutoMovieRecoveryCurveBundle.Curve }[];
          }) =>
            report.open.map(
              (arc: { curve: IAutoMovieRecoveryCurveBundle.Curve }) =>
                arc.curve,
            ),
        ),
      ];
  const map: Map<string, readonly AutoMovieCubicBezierControls3[]> = new Map();
  for (const curve of curves) {
    if (map.has(curve.name))
      throw new Error("A bound publication needs one unique named curve owner");
    map.set(curve.name, bernstein(curve));
  }
  return map;
}

/*
 * A cubic's Bernstein spans, converting saved Hermite jets.
 */
function bernstein(
  curve: IAutoMovieRecoveryCurveBundle.Curve,
): readonly AutoMovieCubicBezierControls3[] {
  return curve.type === "cubicBezier"
    ? curve.spans
    : curve.spans.map(
        (
          span: IAutoMovieRecoveryHermiteSpan,
          index: number,
        ): AutoMovieCubicBezierControls3 =>
          M.hermite(
            M.clone(span.start),
            M.clone(span.end),
            M.clone(span.startDerivative),
            M.clone(span.endDerivative),
            curve.phaseIntervals[index]!,
          ),
      );
}
