import { CaptureSelection } from "../../../../../packages/human/src/inspection/CaptureSelection";

type Info = CaptureSelection.IPartInfo;
type Output = CaptureSelection.IOutput;

/**
 * The capture's selection expansion turns part globs into every row a
 * question needs: each original curve alone at the original stage only, each
 * part alone and with its neighbours at every requested stage, and the whole
 * figure once; neighbours are symmetric over parent, child and sharer
 * declarations; undrawable names stay as unavailable entries with causes.
 *
 * Scenarios:
 * 1. Red proofs: the checker rejects an expansion that drops a curve row, one that loses the symmetric sharer, one that silently drops an unavailable neighbour, one that gives a curve row a loft stage, and one that draws an unavailable part in the whole figure.
 * 2. A made figure (drawable `arm.left` with two curves, drawable `palm.left` declaring `arm.left` as its sharer, unavailable `trunk` parent and `finger.left` child) expanded for `arm.left` at every scope and stage gives exactly the curve rows, the part row, the neighbours row and the whole row with the expected parts, stages and unavailable names.
 * 3. Glob semantics: `*` spans dots, `?` is one character, dots are literal, case matters, an exact name matches only itself.
 * 4. Boundaries: a pattern matching nothing is unavailable with a cause; a pattern matching only an unavailable part is unavailable with that part's cause; a loft-only request has no curve rows; a neighbours-only request has neither part nor whole rows; empty pattern, scope or stage lists throw.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `CaptureSelection.expand`, `glob` and `neighbours`, the actual seam `node:capture` plans its cells from, and asserts the returned rows.
 * @evidence contracts/development/testing.md#independent-expectations Each expected row is written by hand from the capture contract (curve rows only at the original stage, part and neighbour rows per owner, one whole row, symmetric relations), not read from the implementation; the glob cases follow the documented wildcard meaning.
 * @evidence contracts/development/testing.md#distinguishing-cases Matched, unmatched and unavailable-only patterns; all scopes, one scope; all stages, one stage; a relation declared from either side; empty lists. Red: five tampered expansions.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit reached by `--include human_capture_selection`, with made part records and no person, file, canvas or browser.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Red proofs: the checker rejects an expansion that drops a curve row, one that loses the symmetric sharer, one that silently drops an...).
 */
export function test_human_capture_selection(): void {
  const failures: string[] = [];
  const parts: Info[] = [
    {
      name: "arm.left",
      unavailable: null,
      parent: "trunk",
      children: ["finger.left"],
      shares: [],
      curves: ["c.lateral", "c.axis"],
    },
    {
      name: "palm.left",
      unavailable: null,
      parent: null,
      children: [],
      shares: ["arm.left"],
      curves: ["p.edge"],
    },
    {
      name: "trunk",
      unavailable: "no provider",
      parent: null,
      children: [],
      shares: [],
      curves: [],
    },
    {
      name: "finger.left",
      unavailable: "no specs",
      parent: "arm.left",
      children: [],
      shares: [],
      curves: [],
    },
  ];
  const all: Output = CaptureSelection.expand(
    parts,
    ["arm.left"],
    CaptureSelection.SCOPES,
    CaptureSelection.STAGES,
  );

  // 1. Red proofs on tampered expansions.
  if (check(all).length !== 0)
    failures.push(
      `green: the correct expansion read as wrong: ${check(all).join("; ")}`,
    );
  const tampered: [string, Output][] = [
    [
      "a dropped curve row",
      {
        ...all,
        selections: all.selections.filter(
          (s: CaptureSelection.ISelection): boolean => s.curve !== "c.axis",
        ),
      },
    ],
    [
      "a lost symmetric sharer",
      mapRow(
        all,
        "arm.left/neighbours",
        (s: CaptureSelection.ISelection): CaptureSelection.ISelection => ({
          ...s,
          parts: ["arm.left"],
        }),
      ),
    ],
    [
      "a silently dropped unavailable neighbour",
      mapRow(
        all,
        "arm.left/neighbours",
        (s: CaptureSelection.ISelection): CaptureSelection.ISelection => ({
          ...s,
          unavailable: s.unavailable.slice(1),
        }),
      ),
    ],
    [
      "a curve row with a loft stage",
      mapRow(
        all,
        "arm.left/curve/c.lateral",
        (s: CaptureSelection.ISelection): CaptureSelection.ISelection => ({
          ...s,
          stages: ["original", "loft"],
        }),
      ),
    ],
    [
      "an unavailable part drawn in the whole",
      mapRow(
        all,
        "whole",
        (s: CaptureSelection.ISelection): CaptureSelection.ISelection => ({
          ...s,
          parts: [...s.parts, "trunk"],
        }),
      ),
    ],
  ];
  for (const [name, output] of tampered)
    if (check(output).length === 0)
      failures.push(`proof: ${name} read as correct`);

  // 2. The made figure, every scope and stage.
  failures.push(...check(all));

  // 3. Glob semantics.
  const globs: [string, string, boolean][] = [
    ["arm.*", "arm.left", true],
    ["*", "finger.left.1", true],
    ["arm.?eft", "arm.left", true],
    ["arm.left", "armXleft", false],
    ["Arm.left", "arm.left", false],
    ["arm.left", "arm.left.1", false],
    ["finger.left.*", "finger.left", false],
  ];
  for (const [pattern, name, expected] of globs)
    if (CaptureSelection.glob(pattern).test(name) !== expected)
      failures.push(`glob ${pattern} on ${name} gave ${!expected}`);

  // 4. Boundaries.
  const none: Output = CaptureSelection.expand(
    parts,
    ["head.*"],
    CaptureSelection.SCOPES,
  );
  if (
    !(
      none.selections.length === 0 &&
      none.unavailable.length === 1 &&
      none.unavailable[0]!.name === "head.*" &&
      none.unavailable[0]!.cause.length > 0
    )
  )
    failures.push(`unmatched pattern: ${JSON.stringify(none)}`);
  const onlyUnavailable: Output = CaptureSelection.expand(
    parts,
    ["trunk"],
    CaptureSelection.SCOPES,
  );
  if (
    !(
      onlyUnavailable.matched.length === 0 &&
      onlyUnavailable.unavailable.length === 1 &&
      onlyUnavailable.unavailable[0]!.cause === "no provider" &&
      onlyUnavailable.selections.length === 0
    )
  )
    failures.push(
      `unavailable-only pattern: ${JSON.stringify(onlyUnavailable)}`,
    );
  const loftOnly: Output = CaptureSelection.expand(
    parts,
    ["arm.left"],
    ["individual"],
    ["loft"],
  );
  if (
    !(
      loftOnly.selections.length === 1 &&
      loftOnly.selections[0]!.id === "arm.left/part" &&
      JSON.stringify(loftOnly.selections[0]!.stages) ===
        JSON.stringify(["loft"])
    )
  )
    failures.push(
      `loft-only request: ${loftOnly.selections.map((s: CaptureSelection.ISelection): string => `${s.id}:${s.stages.join("+")}`).join(", ")}`,
    );
  const neighboursOnly: Output = CaptureSelection.expand(
    parts,
    ["arm.left"],
    ["neighbours"],
  );
  if (
    !(
      neighboursOnly.selections.length === 1 &&
      neighboursOnly.selections[0]!.id === "arm.left/neighbours"
    )
  )
    failures.push(
      `neighbours-only request: ${neighboursOnly.selections.map((s: CaptureSelection.ISelection): string => s.id).join(", ")}`,
    );
  for (const [name, call] of [
    [
      "patterns",
      (): Output => CaptureSelection.expand(parts, [], CaptureSelection.SCOPES),
    ],
    ["scopes", (): Output => CaptureSelection.expand(parts, ["arm.left"], [])],
    [
      "stages",
      (): Output =>
        CaptureSelection.expand(
          parts,
          ["arm.left"],
          CaptureSelection.SCOPES,
          [],
        ),
    ],
  ] as const) {
    let threw: boolean = false;
    try {
      call();
    } catch {
      threw = true;
    }
    if (!threw) failures.push(`an empty ${name} list did not throw`);
  }

  if (failures.length !== 0)
    throw new Error(
      `${failures.length} capture selection findings:\n${failures.join("\n")}`,
    );
}

/** Every departure of an `arm.left` all-scope expansion of the made figure from the hand-written rows. */
function check(output: Output): string[] {
  const out: string[] = [];
  const four: string = JSON.stringify([
    "original",
    "loft",
    "loft-clay",
    "clay",
    "reference",
  ]);
  const expected: {
    id: string;
    kind: string;
    parts: string[];
    curve: string | null;
    stages: string;
    unavailable: string[];
  }[] = [
    {
      id: "arm.left/curve/c.lateral",
      kind: "curve",
      parts: ["arm.left"],
      curve: "c.lateral",
      stages: JSON.stringify(["original"]),
      unavailable: [],
    },
    {
      id: "arm.left/curve/c.axis",
      kind: "curve",
      parts: ["arm.left"],
      curve: "c.axis",
      stages: JSON.stringify(["original"]),
      unavailable: [],
    },
    {
      id: "arm.left/part",
      kind: "part",
      parts: ["arm.left"],
      curve: null,
      stages: four,
      unavailable: [],
    },
    {
      id: "arm.left/neighbours",
      kind: "neighbours",
      parts: ["arm.left", "palm.left"],
      curve: null,
      stages: four,
      unavailable: ["trunk:no provider", "finger.left:no specs"],
    },
    {
      id: "whole",
      kind: "whole",
      parts: ["arm.left", "palm.left"],
      curve: null,
      stages: four,
      unavailable: ["trunk:no provider", "finger.left:no specs"],
    },
  ];
  if (JSON.stringify(output.matched) !== JSON.stringify(["arm.left"]))
    out.push(`matched ${output.matched.join(", ")}`);
  if (output.selections.length !== expected.length)
    out.push(
      `${output.selections.length} rows instead of ${expected.length}: ${output.selections.map((s: CaptureSelection.ISelection): string => s.id).join(", ")}`,
    );
  for (const e of expected) {
    const s: CaptureSelection.ISelection | undefined = output.selections.find(
      (x: CaptureSelection.ISelection): boolean => x.id === e.id,
    );
    if (s === undefined) {
      out.push(`missing row ${e.id}`);
      continue;
    }
    if (s.kind !== e.kind) out.push(`${e.id} kind ${s.kind}`);
    if (
      JSON.stringify([...s.parts].sort(byText)) !==
      JSON.stringify([...e.parts].sort(byText))
    )
      out.push(`${e.id} parts ${s.parts.join(", ")}`);
    if (s.curve !== e.curve) out.push(`${e.id} curve ${s.curve}`);
    if (JSON.stringify(s.stages) !== e.stages)
      out.push(`${e.id} stages ${s.stages.join(", ")}`);
    const u: string[] = s.unavailable
      .map(
        (x: { name: string; cause: string }): string => `${x.name}:${x.cause}`,
      )
      .sort(byText);
    if (JSON.stringify(u) !== JSON.stringify([...e.unavailable].sort(byText)))
      out.push(`${e.id} unavailable ${u.join(", ")}`);
  }
  return out;
}

/** Code-unit order of two names. */
function byText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** The output with one row replaced. */
function mapRow(
  output: Output,
  id: string,
  f: (s: CaptureSelection.ISelection) => CaptureSelection.ISelection,
): Output {
  return {
    ...output,
    selections: output.selections.map(
      (s: CaptureSelection.ISelection): CaptureSelection.ISelection =>
        s.id === id ? f(s) : s,
    ),
  };
}
