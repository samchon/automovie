/**
 * How far a derived document's priors may go before its skin passes through
 * itself.
 *
 * Every control's envelope is valid alone, and their combinations are not
 * checked by any envelope: on round j13 the built skin of 11 of the 17
 * documents crossed itself at rest (up to 276 pairs of triangles), the
 * nasal base passing through the upper lip where the nose was lengthened to
 * the photograph's index, the columella turned to the septum's end by the
 * nasolabial norm and the mouth set back by the E-line norm; any one of the
 * three alone left the skin whole. Tissue does not pass through tissue, so
 * a document is valid only if its skin at rest has no fault its neutral
 * lacks (`faceSupportFaults`). What the photograph measured stands; the
 * priors for what it cannot show (`FACE_UNSEEN_INDICES`) yield: their
 * departure from the start is scaled by the largest factor in [0, 1] at
 * which they add no fault to those of the measured controls alone (the
 * factor 0), found by bisection over `steps` halvings; the faults the
 * measured controls make themselves are reported. Pure.
 */
export function faceValidScale(props: {
  /** The document's faults with the priors' departure scaled by a factor. */
  faults: (scale: number) => number;
  steps: number;
}): { scale: number; faults: number } {
  if (!(Number.isInteger(props.steps) && props.steps >= 1))
    throw new Error("A bisection needs one step or more.");
  const whole = props.faults(1);
  if (whole === 0) return { scale: 1, faults: 0 };
  const measured = props.faults(0);
  if (whole <= measured) return { scale: 1, faults: whole };
  let [low, high] = [0, 1];
  let faults = measured;
  for (let k = 0; k < props.steps; ++k) {
    const middle = (low + high) / 2;
    const count = props.faults(middle);
    if (count <= measured) [low, faults] = [middle, count];
    else high = middle;
  }
  return { scale: low, faults };
}

/**
 * The expression a document may show without passing tissue through
 * tissue.
 *
 * A document's shape is made whole at rest (`faceValidScale` over its
 * controls); its expression then moves the skin again, and nothing checked
 * that motion: on round j17 the expressions derived from three photographs
 * crossed the skin through itself (Miriam Margolyes's laugh, 219 triangles
 * at the lids and the lips; Lee Tae-ri's smile, 30 at the lower lip; a
 * smile with the upper lip raised, 13 at the lips). The expression's faults
 * are counted against the document's own face at rest (`faults`, zero with
 * no expression) and gathered into folds, the faulting triangles that share
 * vertices (`clusters`, each a fold's vertices): one at the lids and one at
 * the lips are two. For each fold in turn, the units that move its
 * vertices (`contribution`, how far a unit at its weight moves them, over
 * zero) yield: those a norm set rather than the photograph read (`priors`)
 * first, together, then the photographed ones together, each group keeping
 * the largest share of its weights, of `steps` halvings, at which the skin
 * has no more faults than with that group at rest (`faceValidScale`). A
 * unit that does not move the fold keeps its weight, and a fold several
 * units make costs each the same share: yielded one at a time, the unit
 * moving the fold most went to rest (three smiles of round j19 lost their
 * smile to a fold the lip raiser and depressor made with it). A yield can
 * move a fold elsewhere, which the next round gathers, over at
 * most `rounds` rounds. A unit and its partner on the other side
 * (`partner`: a smile's two corners, a gaze's two eyes) move and yield as
 * one, by the sum of what they move, so a fold at the midline does not
 * leave one side of the face moving and the other at rest. A unit yielded
 * to nothing is dropped; `shares` holds what each yielded unit kept of its
 * weight. Pure.
 */
export function faceExpressionYield(props: {
  expression: Readonly<Record<string, number>>;
  faults: (expression: Record<string, number>) => number;
  clusters: (expression: Record<string, number>) => ReadonlySet<number>[];
  contribution: (
    unit: string,
    expression: Record<string, number>,
    fold: ReadonlySet<number>,
  ) => number;
  priors?: ReadonlySet<string>;
  partner?: (unit: string) => string | null;
  steps: number;
  rounds: number;
}): {
  expression: Record<string, number>;
  shares: Record<string, number>;
  faults: number;
} {
  if (!(Number.isInteger(props.rounds) && props.rounds >= 1))
    throw new Error("An expression yields over one round or more.");
  const given = { ...props.expression };
  const priors = props.priors ?? new Set<string>();
  let expression = { ...given };
  let faults = props.faults(expression);
  for (let round = 0; faults > 0 && round < props.rounds; ++round)
    for (const fold of props.clusters(expression)) {
      const groups = new Map<string, string[]>();
      for (const unit of Object.keys(expression)) {
        const other = props.partner?.(unit) ?? null;
        const key = [unit, other ?? ""]
          .sort((a, b) => a.localeCompare(b))
          .join("|");
        const group = groups.get(key) ?? [];
        group.push(unit);
        groups.set(key, group);
      }
      const moved = [...groups.values()]
        .map((units) => ({
          units,
          prior: units.some((unit) => priors.has(unit)),
          by: units.reduce(
            (sum, unit) => sum + props.contribution(unit, expression, fold),
            0,
          ),
        }))
        .filter((one) => one.by > 0)
        .sort((a, b) => Number(b.prior) - Number(a.prior) || b.by - a.by);
      const yieldTogether = (units: readonly string[]) => {
        const current = expression;
        const scaled = (scale: number) => ({
          ...current,
          ...Object.fromEntries(
            units.map((unit) => [unit, scale * current[unit]!]),
          ),
        });
        const kept = faceValidScale({
          faults: (scale) => props.faults(scaled(scale)),
          steps: props.steps,
        });
        expression = scaled(kept.scale);
      };
      // A norm's units yield first; what they leave, the photographed units
      // moving the fold yield together by one share: a fold several make is
      // no single unit's to pay for.
      const priorUnits = moved
        .filter((one) => one.prior)
        .flatMap(({ units }) => units);
      if (priorUnits.length !== 0) yieldTogether(priorUnits);
      const read = moved
        .filter((one) => !one.prior)
        .flatMap(({ units }) => units);
      if (read.length !== 0) yieldTogether(read);
      faults = props.faults(expression);
    }
  const shares = Object.fromEntries(
    Object.keys(given)
      .filter((unit) => expression[unit] !== given[unit])
      .map((unit) => [unit, (expression[unit] ?? 0) / given[unit]!]),
  );
  return {
    expression: Object.fromEntries(
      Object.entries(expression).filter(([, weight]) => weight !== 0),
    ),
    shares,
    faults,
  };
}

/**
 * The faulting triangles' clusters: each the vertices of triangles joined
 * through shared vertices, in the order of their lowest triangle. Pure.
 */
export function faceFaultClusters(
  indices: readonly number[],
  triangles: Iterable<number>,
): Set<number>[] {
  const parent = new Map<number, number>();
  const find = (v: number): number => {
    while (parent.get(v) !== v) {
      parent.set(v, parent.get(parent.get(v)!)!);
      v = parent.get(v)!;
    }
    return v;
  };
  const order = [...triangles].sort((a, b) => a - b);
  for (const t of order)
    for (let e = 0; e < 3; ++e)
      if (!parent.has(indices[t + e]!))
        parent.set(indices[t + e]!, indices[t + e]!);
  for (const t of order)
    for (let e = 1; e < 3; ++e) {
      const [a, b] = [find(indices[t]!), find(indices[t + e]!)];
      if (a !== b) parent.set(b, a);
    }
  const clusters = new Map<number, Set<number>>();
  for (const t of order) {
    const root = find(indices[t]!);
    if (!clusters.has(root)) clusters.set(root, new Set());
    for (let e = 0; e < 3; ++e) clusters.get(root)!.add(indices[t + e]!);
  }
  return [...clusters.values()];
}
