import type { IAutoMovieContourLoft64 as L } from "@automovie/engine/geometry/curve";
import { realizeAutoMovieBicubicAtlas64 as realize } from "@automovie/engine/geometry/realizeAutoMovieBicubicAtlas64";
import type { IAutoMovieModel } from "@automovie/interface";
import type { RecoveryAnalyticDomainsInput as Input } from "./RecoveryAnalyticDomainsInput";
import type { AutoMovieRecoveryOpenContinuation as O } from "./AutoMovieRecoveryOpenContinuation";

/**
 * Admit source-free analytic ownership and retain every finite native result.
 * Invalid or multiply claimed domains leave the original saved operator owned;
 * valid independent domains remain available. A finite partial atlas owns its
 * declared domain with explicit omissions, rather than overlapping a second mesh.
 *
 * @evidence contracts/common.md#principled-implementation Exact saved graph occurrences, named ports and four-coefficient native bindings precede public atlas realization. Producer observation and geometry completion remain separate.
 * @evidence contracts/common.md#clear-and-simple-design One adapter owns analytic admission, generation and closed/open delegation maps; existing operators retain all other occurrences.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No original source, positional weld, coefficient correction, normal replacement or generated-mesh fallback enters this operation.
 * @evidence contracts/common.md#meaningful-documentation States metre conversion, local refusal, finite partial ownership and independent coverage, source-fit and boundary-conformity limitations.
 * @evidence contracts/performance.md#efficient-algorithms Linear input and claim maps plus fixed-degree coefficient comparisons precede each native realization once; costs and retained geometry scale with the supplied recipes.
 * @evidence contracts/performance.md#reuse-equivalent-work A single saved-curve registry serves all exact bindings and every admitted complex is realized once for its model part and diagnostics.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Call-owned maps expire on return. Model parts, reports and original recipe references transfer to the reconstruction caller; the public recipe's cell and vertex budgets bound each realization.
 */
export function realizeAutoMovieRecoveryAnalyticDomains(
  bundle: Input & {
    tensorFamilies?: readonly {
      replacedGroups: readonly { interval: number; group: number }[];
    }[];
  },
  graph?: O.Continuation,
): {
  parts: IAutoMovieModel["parts"];
  construction: {
    id: string;
    closed: boolean;
    points: [number, number, number][];
  }[];
  closedGroups: Map<string, string>;
  openPairs: Map<string, string>;
  openUnresolved: Map<string, string>;
  reports: {
    id: string;
    admitted: boolean;
    complete: boolean;
    approximationQualified: boolean;
    observationComplete: boolean;
    unrepresentedDomains: readonly string[];
    diagnostics: string[];
    primitiveRanges: ReturnType<typeof realize>["primitiveRanges"];
  }[];
} {
  const result: ReturnType<typeof realizeAutoMovieRecoveryAnalyticDomains> = {
    parts: [],
    construction: [],
    closedGroups: new Map(),
    openPairs: new Map(),
    openUnresolved: new Map(),
    reports: [],
  };
  if (!bundle.analyticDomains?.length) return result;
  const curves: Map<string, L.ISection["loops"][number]["curve"]> = new Map(),
    ambiguous: Set<string> = new Set();
  const register: (curve: L.ISection["loops"][number]["curve"]) => void = (
    curve: L.ISection["loops"][number]["curve"],
  ): void => {
    if (curves.has(curve.name)) ambiguous.add(curve.name);
    else curves.set(curve.name, curve);
  };
  for (const section of bundle.loft.sections)
    for (const loop of section.loops) register(loop.curve);
  for (const row of bundle.reports)
    for (const arc of row.open) register(arc.curve);
  const occupied: Set<string> = new Set(
    (bundle.tensorFamilies ?? []).flatMap(
      (family: NonNullable<typeof bundle.tensorFamilies>[number]): string[] =>
        family.replacedGroups.map(
          (address: (typeof family.replacedGroups)[number]): string =>
            `c:${address.interval}:${address.group}`,
        ),
    ),
  );
  const claims: Map<string, number[]> = new Map(),
    invalid: Map<number, string[]> = new Map(),
    names: Map<string, number[]> = new Map();
  const refuse: (index: number, message: string) => void = (
    index: number,
    message: string,
  ): void => {
    const rows: string[] = invalid.get(index) ?? [];
    rows.push(message);
    invalid.set(index, rows);
  };
  const claim: (index: number, key: string) => void = (
    index: number,
    key: string,
  ): void => {
    const rows: number[] = claims.get(key) ?? [];
    rows.push(index);
    claims.set(key, rows);
    if (occupied.has(key))
      refuse(index, `Occurrence already belongs to a tensor family: ${key}`);
  };
  for (const [index, domain] of bundle.analyticDomains.entries()) {
    try {
      if (
        !domain.id ||
        domain.geometry.topologyDomain !== domain.id ||
        !Array.isArray(domain.closedGroups) ||
        !Array.isArray(domain.openPairs) ||
        !Array.isArray(domain.openUnresolved) ||
        !Array.isArray(domain.ports) ||
        !Array.isArray(domain.curveBindings) ||
        typeof domain.observationComplete !== "boolean" ||
        !Array.isArray(domain.unrepresentedDomains)
      )
        throw new Error(
          "A named analytic domain requires complete ownership and qualification records",
        );
      const named: number[] = names.get(domain.id) ?? [];
      named.push(index);
      names.set(domain.id, named);
      const ports: Set<string> = new Set(
        domain.ports.map((port: (typeof domain.ports)[number]): string => {
          if (
            !curves.has(port.curveName) ||
            ambiguous.has(port.curveName) ||
            (port.side !== "lower" && port.side !== "upper")
          )
            throw new Error("A port must name a saved lower or upper curve");
          return `${port.side}:${port.curveName}`;
        }),
      );
      const need: (
        name: string | undefined,
        side: "lower" | "upper",
      ) => void = (name: string | undefined, side: "lower" | "upper"): void => {
        if (!name || !ports.has(`${side}:${name}`))
          throw new Error(
            "A delegated occurrence lacks a complete named port inventory",
          );
      };
      for (const address of domain.closedGroups) {
        const group: L.IInterval["groups"][number] | undefined =
          bundle.loft.intervals?.[address.interval]?.groups[address.group];
        if (
          !Number.isSafeInteger(address.interval) ||
          address.interval < 0 ||
          !Number.isSafeInteger(address.group) ||
          address.group < 0 ||
          !group
        )
          throw new Error("Closed analytic ownership addresses no saved group");
        for (const id of group.before)
          need(
            bundle.loft.sections[address.interval]?.loops[id]?.curve.name,
            "lower",
          );
        for (const id of group.after)
          need(
            bundle.loft.sections[address.interval + 1]?.loops[id]?.curve.name,
            "upper",
          );
        claim(index, `c:${address.interval}:${address.group}`);
      }
      for (const address of domain.openPairs) {
        const pair:
          | O.Continuation["intervals"][number]["pairs"][number]
          | undefined = graph?.intervals[address.interval]?.pairs[address.pair];
        if (
          !Number.isSafeInteger(address.interval) ||
          address.interval < 0 ||
          !Number.isSafeInteger(address.pair) ||
          address.pair < 0 ||
          !pair
        )
          throw new Error(
            "Open analytic ownership requires its saved continuation pair",
          );
        need(
          bundle.reports[address.interval]?.open[pair.before]?.curve.name,
          "lower",
        );
        need(
          bundle.reports[address.interval + 1]?.open[pair.after]?.curve.name,
          "upper",
        );
        claim(index, `p:${address.interval}:${address.pair}`);
      }
      for (const address of domain.openUnresolved) {
        const group:
          | O.Continuation["intervals"][number]["unresolved"][number]
          | undefined =
          graph?.intervals[address.interval]?.unresolved[address.group];
        if (
          !Number.isSafeInteger(address.interval) ||
          address.interval < 0 ||
          !Number.isSafeInteger(address.group) ||
          address.group < 0 ||
          !group
        )
          throw new Error(
            "Event ownership requires its entire saved unresolved projection group",
          );
        for (const id of group.before)
          need(bundle.reports[address.interval]?.open[id]?.curve.name, "lower");
        for (const id of group.after)
          need(
            bundle.reports[address.interval + 1]?.open[id]?.curve.name,
            "upper",
          );
        claim(index, `u:${address.interval}:${address.group}`);
      }
      const authorities: Map<
        string,
        NonNullable<typeof domain.geometry.boundaryAuthorities>[number]
      > = new Map(
        (domain.geometry.boundaryAuthorities ?? []).map(
          (
            owner: NonNullable<
              typeof domain.geometry.boundaryAuthorities
            >[number],
          ): [
            string,
            NonNullable<typeof domain.geometry.boundaryAuthorities>[number],
          ] => [owner.id, owner],
        ),
      );
      if (
        authorities.size !== (domain.geometry.boundaryAuthorities?.length ?? 0)
      )
        throw new Error("Native authority identity is not unique");
      const bound: Set<string> = new Set();
      for (const binding of domain.curveBindings) {
        const curve: L.ISection["loops"][number]["curve"] | undefined =
          curves.get(binding.curveName);
        const key: string = `${binding.curveName}:${binding.span}`;
        if (
          !curve ||
          curve.unit !== "mm" ||
          !Number.isSafeInteger(binding.span) ||
          binding.span < 0 ||
          bound.has(key) ||
          !domain.ports.some(
            (port: (typeof domain.ports)[number]): boolean =>
              port.curveName === binding.curveName,
          )
        )
          throw new Error(
            "A binding requires one saved millimetre curve span and named port",
          );
        bound.add(key);
        const saved: readonly (readonly number[])[] | undefined = curves.get(
            binding.curveName,
          )?.spans[binding.span],
          owner:
            | NonNullable<typeof domain.geometry.boundaryAuthorities>[number]
            | undefined = authorities.get(binding.authority);
        if (!saved || !owner || owner.controlIds.length !== 4)
          throw new Error("A native named curve binding is absent");
        for (let k: number = 0; k < 4; k++) {
          const point: (typeof domain.geometry.controls)[number] | undefined =
            domain.geometry.controls[owner.controlIds[k]!];
          if (
            !Number.isSafeInteger(owner.controlIds[k]) ||
            owner.controlIds[k]! < 0 ||
            !point ||
            saved[k]![0]! * 0.001 !== point.x ||
            saved[k]![1]! * 0.001 !== point.y ||
            saved[k]![2]! * 0.001 !== point.z
          )
            throw new Error(
              "Native analytic coefficients differ from their saved curve's forward unit authority",
            );
        }
      }
      for (const port of domain.ports)
        for (
          let span: number = 0;
          span < curves.get(port.curveName)!.spans.length;
          span++
        )
          if (!bound.has(`${port.curveName}:${span}`))
            throw new Error(
              "Every saved port span requires its native coefficient binding",
            );
    } catch (error: unknown) {
      refuse(index, error instanceof Error ? error.message : String(error));
    }
  }
  for (const [key, indices] of claims)
    if (indices.length > 1)
      for (const index of indices)
        refuse(index, `Multiple analytic owners claim ${key}`);
  for (const [name, indices] of names)
    if (indices.length > 1)
      for (const index of indices)
        refuse(index, `Analytic identity is not unique: ${name}`);
  for (const [index, domain] of bundle.analyticDomains.entries()) {
    const diagnostics: string[] = invalid.get(index) ?? [];
    if (diagnostics.length) {
      result.reports.push({
        id: domain?.id ?? `invalid-analytic-${index}`,
        admitted: false,
        complete: false,
        approximationQualified: false,
        observationComplete: domain?.observationComplete === true,
        unrepresentedDomains: Array.isArray(domain?.unrepresentedDomains)
          ? domain.unrepresentedDomains
          : ["Invalid domain qualification record"],
        diagnostics,
        primitiveRanges: [],
      });
      continue;
    }
    try {
      const generated: ReturnType<typeof realize> = realize(domain.geometry);
      if (generated.mesh.indices!.length)
        result.parts.push({
          id: domain.id,
          name: null,
          material: null,
          attachedBone: null,
          transform: null,
          geometry: { type: "mesh", mesh: generated.mesh },
        });
      for (const address of domain.closedGroups)
        result.closedGroups.set(
          `${address.interval}:${address.group}`,
          domain.id,
        );
      for (const address of domain.openPairs)
        result.openPairs.set(`${address.interval}:${address.pair}`, domain.id);
      for (const address of domain.openUnresolved)
        result.openUnresolved.set(
          `${address.interval}:${address.group}`,
          domain.id,
        );
      result.reports.push({
        id: domain.id,
        admitted: true,
        complete: generated.complete,
        approximationQualified: generated.approximationQualified,
        observationComplete: domain?.observationComplete === true,
        unrepresentedDomains: Array.isArray(domain?.unrepresentedDomains)
          ? domain.unrepresentedDomains
          : ["Invalid domain qualification record"],
        diagnostics: generated.diagnostics,
        primitiveRanges: generated.primitiveRanges,
      });
      for (const owner of domain.geometry.boundaryAuthorities ?? []) {
        const points: [number, number, number][] = [];
        for (const id of owner.controlIds) {
          const point: (typeof domain.geometry.controls)[number] | undefined =
            domain.geometry.controls[id];
          if (point && [point.x, point.y, point.z].every(Number.isFinite))
            points.push([point.x, point.y, point.z]);
        }
        if (points.length === 4)
          result.construction.push({
            id: `${domain.id}.native.${owner.id}`,
            closed: false,
            points,
          });
        else
          result.reports
            .at(-1)!
            .diagnostics.push(
              `Invalid native control polygon omitted from construction: ${owner.id}`,
            );
      }
    } catch (error: unknown) {
      result.reports.push({
        id: domain?.id ?? `invalid-analytic-${index}`,
        admitted: false,
        complete: false,
        approximationQualified: false,
        observationComplete: domain?.observationComplete === true,
        unrepresentedDomains: Array.isArray(domain?.unrepresentedDomains)
          ? domain.unrepresentedDomains
          : ["Invalid domain qualification record"],
        diagnostics: [error instanceof Error ? error.message : String(error)],
        primitiveRanges: [],
      });
    }
  }
  return result;
}
