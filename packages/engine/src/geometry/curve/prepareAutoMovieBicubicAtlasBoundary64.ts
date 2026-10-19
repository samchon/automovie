import { AutoMovieBernsteinAlgebra64 as B } from "./AutoMovieBernsteinAlgebra64";
import { AutoMovieBernsteinSubdivision64 as S } from "./AutoMovieBernsteinSubdivision64";
import { AutoMovieCanonicalBoundary64 as Q } from "./AutoMovieCanonicalBoundary64";
import { AutoMovieCurveMath64 as V } from "./AutoMovieCurveMath64";
import type { tessellateAutoMovieBicubicAtlas64 as T } from "./tessellateAutoMovieBicubicAtlas64";

type Binding = NonNullable<T.Input["boundaryBindings"]>[number] & {
  legacy?: string;
};
type Use = {
  patch: string;
  side: 0 | 1 | 2 | 3;
  ids: number[];
  reverse: boolean;
};

/**
 * Prepare declared canonical curves, coefficient identities and complete edge uses.
 * Matching four-ID tuples transport one explicit oriented interval to unbound
 * incident sides. Their legacy render-normal owner remains separate from explicit
 * normal fans. Every constructed coefficient is shared by its declared ID before
 * tessellation; independently evaluated conflicting assignments omit only incident
 * patches. Exact positions validate existing relations and never create identities.
 * Equal restricted nets with different named intervals retain their finite fields;
 * inter-authority tessellation sharing remains an explicit unqualified relation.
 * Inputs must remain immutable until the returned closures are released.
 *
 * @evidence contracts/common.md#principled-implementation Directed four-ID tuples establish complete-edge incidence; exact normalized phases establish declared endpoint aliases. Independent Bernstein restrictions check all constructed coefficient assignments before one consistent registry supplies each patch field.
 * @evidence contracts/common.md#clear-and-simple-design One boundary preparation owns admission, explicit-to-legacy interval transport, coefficient consistency and position identities; the caller owns adaptive planning and emission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate weld, source mesh, epsilon, coefficient averaging or first-owner conflict suppression is used. Different names alone never reject geometry; proven coefficient disagreement is local and unimplemented inter-authority sample transport remains explicit.
 * @evidence contracts/common.md#meaningful-documentation States mm positions, complete-edge direction, separate normal fans, immutable lifetime, local failure and unqualified sample transport between different named intervals.
 * @evidence contracts/performance.md#efficient-algorithms Fixed-degree restrictions and map passes scale with patches and bindings; sorting D declarations per complete edge adds O(D log D). Atlases without bindings skip edge-use allocation. Symbolic aliases use path compression, endpoint dyadics have bounded binary64 size, and no all-patch search is performed for each binding.
 * @evidence contracts/performance.md#reuse-equivalent-work One tuple registry transports equivalent edge declarations and one consistent coefficient registry serves every incident chart. Canonical sample positions are cached within this input lifetime after independent endpoint consistency checks.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Maps and closures retain only this caller-owned atlas and its O(P+B) incidence/constraint records plus requested canonical samples. The generator releases them on completion or cancellation; no cross-request state or external handles exist.
 */
export function prepareAutoMovieBicubicAtlasBoundary64(
  input: T.Input,
  sides: readonly (readonly number[])[],
): {
  authorities: Map<string, readonly number[]>;
  bindings: Map<string, Binding>;
  root: (key: string) => string;
  canonicalPoint: (
    authority: string,
    phase: ReturnType<typeof Q.phase>,
  ) => B.Vec;
  positions: Map<string, B.Vec>;
  conflicts: Set<string>;
  diagnostics: Map<string, string[]>;
} {
  const authorities: Map<string, readonly number[]> = new Map();
  for (const authority of input.boundaryAuthorities ?? []) {
    if (
      !authority ||
      typeof authority.id !== "string" ||
      !authority.id.trim() ||
      authorities.has(authority.id) ||
      !Array.isArray(authority.controlIds) ||
      authority.controlIds.length !== 4 ||
      Array.from(
        { length: 4 },
        (_: unknown, k: number): number => authority.controlIds[k]!,
      ).some(
        (id: number): boolean =>
          !Number.isSafeInteger(id) || id < 0 || id >= input.controlsMm.length,
      )
    )
      throw new Error(
        "A canonical cubic requires one name and four valid controls",
      );
    authorities.set(authority.id, authority.controlIds);
  }
  const explicit: Map<string, Binding> = new Map(),
    groups: Map<string, Use[]> = new Map(),
    uses: Map<string, Use> = new Map();
  for (const patch of input.boundaryBindings?.length ? input.patches : [])
    for (let side: number = 0; side < 4; side++) {
      const ids: number[] = sides[side]!.map(
        (slot: number): number => patch.controlIds[slot]!,
      );
      let reverse: boolean = false;
      for (let k: number = 0; k < 4; k++)
        if (ids[k] !== ids[3 - k]) {
          reverse = ids[k]! > ids[3 - k]!;
          break;
        }
      const key: string = (reverse ? [...ids].reverse() : ids).join(","),
        use: Use = {
          patch: patch.id,
          side: side as 0 | 1 | 2 | 3,
          ids,
          reverse,
        };
      const group: Use[] = groups.get(key) ?? [];
      group.push(use);
      groups.set(key, group);
      uses.set(`${patch.id}:${side}`, use);
    }
  const aliases: Map<string, string> = new Map();
  const root: (key: string) => string = (key: string): string => {
    let current: string = key;
    while (aliases.has(current)) current = aliases.get(current)!;
    while (aliases.has(key)) {
      const next: string = aliases.get(key)!;
      aliases.set(key, current);
      key = next;
    }
    return current;
  };
  const unite: (a: string, b: string) => void = (
    a: string,
    b: string,
  ): void => {
    a = root(a);
    b = root(b);
    if (a !== b) aliases.set(a < b ? b : a, a < b ? a : b);
  };
  const constraints: { id: number; point: B.Vec }[] = [];
  for (const binding of input.boundaryBindings ?? []) {
    if (!binding)
      throw new Error("A patch side requires a complete canonical binding");
    const key: string = `${binding.patch}:${binding.side}`,
      use: Use | undefined = uses.get(key);
    if (
      !use ||
      ![0, 1, 2, 3].includes(binding.side) ||
      !authorities.has(binding.authority) ||
      typeof binding.normalFan !== "string" ||
      !binding.normalFan.trim() ||
      explicit.has(key)
    )
      throw new Error(
        "A patch side requires one valid oriented canonical binding",
      );
    const first: ReturnType<typeof Q.phase> = Q.phase(
        binding.start,
        binding.end,
        0,
      ),
      last: ReturnType<typeof Q.phase> = Q.phase(binding.start, binding.end, 1);
    explicit.set(key, binding);
    const controls: B.Poly = authorities
      .get(binding.authority)!
      .map((id: number): B.Vec => V.clone(input.controlsMm[id]!));
    const net: B.Poly = S.restrict(
      controls,
      Math.min(binding.start, binding.end),
      Math.max(binding.start, binding.end),
    );
    if (binding.start > binding.end) net.reverse();
    net[0] = B.value(controls, first.value);
    net[3] = B.value(controls, last.value);
    unite(
      `control:${use.ids[0]}`,
      `authority:${binding.authority}:${first.key}`,
    );
    unite(
      `control:${use.ids[3]}`,
      `authority:${binding.authority}:${last.key}`,
    );
    for (let k: number = 0; k < 4; k++)
      constraints.push({ id: use.ids[k]!, point: net[k]! });
  }
  const bindings: Map<string, Binding> = new Map(),
    diagnostics: Map<string, string[]> = new Map();
  for (const [tuple, group] of groups) {
    const declared: { binding: Binding; start: number; end: number }[] =
      group.flatMap(
        (use: Use): { binding: Binding; start: number; end: number }[] => {
          const binding: Binding | undefined = explicit.get(
            `${use.patch}:${use.side}`,
          );
          return binding
            ? [
                {
                  binding,
                  start: use.reverse ? binding.end : binding.start,
                  end: use.reverse ? binding.start : binding.end,
                },
              ]
            : [];
        },
      );
    if (!declared.length) continue;
    declared.sort(
      (a: (typeof declared)[number], b: (typeof declared)[number]): number =>
        a.binding.authority < b.binding.authority
          ? -1
          : a.binding.authority > b.binding.authority
            ? 1
            : a.start - b.start || a.end - b.end,
    );
    const owner: (typeof declared)[number] = declared[0]!;
    const distinct: boolean = declared.some(
      (candidate: (typeof declared)[number]): boolean =>
        candidate.binding.authority !== owner.binding.authority ||
        candidate.start !== owner.start ||
        candidate.end !== owner.end,
    );
    for (const use of group) {
      const key: string = `${use.patch}:${use.side}`,
        original: Binding | undefined = explicit.get(key);
      bindings.set(
        key,
        original ?? {
          patch: use.patch,
          side: use.side,
          authority: owner.binding.authority,
          start: use.reverse ? owner.end : owner.start,
          end: use.reverse ? owner.start : owner.end,
          normalFan: tuple,
          legacy: tuple,
        },
      );
      if (distinct) {
        const messages: string[] = diagnostics.get(use.patch) ?? [];
        messages.push(
          "canonical-relation-unqualified: shared complete-edge coefficients have different authoritative intervals; finite consistent fields remain available, but inter-authority polygonal conformity is unverified",
        );
        diagnostics.set(use.patch, messages);
      }
      for (const endpoint of [0, 1]) {
        const phase: ReturnType<typeof Q.phase> = Q.phase(
          owner.start,
          owner.end,
          use.reverse ? 1 - endpoint : endpoint,
        );
        unite(
          `control:${use.ids[endpoint === 0 ? 0 : 3]}`,
          `authority:${owner.binding.authority}:${phase.key}`,
        );
      }
    }
  }
  const positions: Map<string, B.Vec> = new Map(),
    conflicts: Set<string> = new Set();
  for (const constraint of constraints) {
    const key: string = root(`control:${constraint.id}`),
      previous: B.Vec | undefined = positions.get(key);
    if (
      !constraint.point.every(Number.isFinite) ||
      (previous &&
        constraint.point.some(
          (value: number, axis: number): boolean => value !== previous[axis],
        ))
    )
      conflicts.add(key);
    else positions.set(key, constraint.point);
  }
  const canonicalPoint: (
    authority: string,
    phase: ReturnType<typeof Q.phase>,
  ) => B.Vec = (
    authority: string,
    phase: ReturnType<typeof Q.phase>,
  ): B.Vec => {
    const key: string = root(`authority:${authority}:${phase.key}`),
      previous: B.Vec | undefined = positions.get(key);
    if (previous) return previous;
    const point: B.Vec = B.value(
      authorities
        .get(authority)!
        .map((id: number): B.Vec => V.clone(input.controlsMm[id]!)),
      phase.value,
    );
    positions.set(key, point);
    return point;
  };
  return {
    authorities,
    bindings,
    root,
    canonicalPoint,
    positions,
    conflicts,
    diagnostics,
  };
}
