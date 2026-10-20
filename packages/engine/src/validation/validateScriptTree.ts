import {
  IAutoMovieBeat,
  IAutoMovieScriptNode,
  IAutoMovieValidation,
} from "@automovie/interface";

import { ViolationCollector } from "./ViolationCollector";

/**
 * The first declaration of a node id, preserving its authored diagnostic location during one tree validation.
 */
interface IIndexedNode {
  /** Borrowed node kept by the first-declaration id index. */
  node: IAutoMovieScriptNode;

  /** Its original tree-array position for field-located findings. */
  index: number;
}

/**
 * Which parent kinds each node kind may refine. The refinement tree is deliberately permissive where the design is silent (a tiny film may go straight `intent → beat`), but never inverted: an act cannot hang under a scene, a beat is always a leaf. `intent` is absent here because it is the root and may have no parent at all.
 */
const ALLOWED_PARENTS: Record<
  Exclude<IAutoMovieScriptNode["kind"], "intent">,
  ReadonlyArray<IAutoMovieScriptNode["kind"]>
> = {
  act: ["intent", "group"],
  scene: ["intent", "act", "group"],
  group: ["intent", "act", "scene"],
  beat: ["intent", "act", "scene", "group"],
};

/**
 * Validate the screenplay refinement tree against its script's flat beats, the structural gate a script with a `tree` must pass before commit.
 *
 * Checks, all `error` severity:
 *
 * - Node ids are non-empty and unique.
 * - Exactly one root (`parent: null`) exists and it is the `intent`: the tree refines one film-level thought; a rootless forest or a second root is two films in one script.
 * - Every `parent` resolves, the refinement axis is acyclic, and each child's kind may refine its parent's kind ({@link ALLOWED_PARENTS}); a beat is always a leaf.
 * - `temporal` and every `interactsWith` entry resolve to an existing node and never to the node itself.
 * - Beat-kind nodes join the flat `beats` 1:1: every beat node names a real beat id, no two nodes claim one beat, and every beat is claimed: a tree that forgets a beat silently drops authored structure.
 * - Dialogue anchors are finite and `>= 0` when non-null.
 * - Intent logline and theme are nonblank and exactly match the flat script header, so screenplay rendering cannot silently replace authored metadata.
 * - Group rationales are nonblank prose, rather than empty bracketed headings.
 *
 * The cross-edge semantics (feedback propagation up the refinement chain) are consumed later; this validator only guarantees the graph is well-formed.
 *
 * @evidence contracts/common.md#principled-implementation Indexes the first declaration of each node id, admits parent-kind pairs through the closed refinement table and joins beat ids one to one. Parent edges form a functional graph; iterative path coloring detects cycles and memoizes their first repeated node for each ancestor, preserving one diagnostic per cyclic chain without repeated walks. Intent metadata compares exact strings because renderScreenplay prints them verbatim.
 * @evidence contracts/common.md#clear-and-simple-design Owns graph and payload consistency at the script commit seam; the private cycle pass shares the same id index and collector. Flat logline and theme are explicit inputs rather than inferred from the tree being checked, so the duplicate representation has an independent authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Duplicate nodes keep their first diagnostic location, every beat must join exactly one node, and dangling or cyclic references are reported rather than repaired. No payload is trimmed or rewritten; trim only decides whether text is blank, while differing nonblank headers still fail.
 * @evidence contracts/common.md#meaningful-documentation Lists graph, beat, anchor and editorial payload gates, states the flat-header authority and the later ownership of cross-edge feedback. Inputs identify their source and all refusals are accumulated in the returned validation.
 * @evidence contracts/performance.md#efficient-algorithms For N nodes, B beats, X cross edges and D dialogue lines, indexing, graph traversal and joins take O(N+B+X+D) operations plus inspected text lengths, with O(N+B) index space. Cycle paths are iterative and completed once, avoiding quadratic ancestor walks and a depth-dependent call stack.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares one first-declaration node index across roots, parent edges, cross references and cycles, and memoizes completed parent chains only during this synchronous validation; no result is reused after mutable script inputs can change.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns indexes, cycle paths and collector until return; transient state is bounded by node and beat counts, with violations growing by the failing authored fields. Only the validation and its violations transfer to the caller, with no retained cache or handles.
 */
export function validateScriptTree(props: {
  /** The refinement tree to validate. */
  tree: IAutoMovieScriptNode[];

  /** The script's flat beats the beat-kind nodes must join. */
  beats: IAutoMovieBeat[];

  /** Flat script logline the intent root must preserve verbatim. */
  logline: string;

  /** Flat script theme the intent root must preserve verbatim. */
  theme: string;
}): IAutoMovieValidation {
  const path: string = "$input.tree";
  const out: ViolationCollector = new ViolationCollector();
  const { tree, beats }: typeof props = props;

  const byId: Map<string, IIndexedNode> = new Map();
  tree.forEach((node: IAutoMovieScriptNode, i: number): void => {
    const np: string = `${path}[${i}]`;
    if (node.id.trim().length === 0)
      out.push("type", `${np}.id`, "node id must be non-empty", node.id);
    const existing: IIndexedNode | undefined = byId.get(node.id);
    if (existing !== undefined) {
      out.push(
        "type",
        `${np}.id`,
        `node id "${node.id}" is duplicated; first declared at ${path}[${existing.index}].id`,
        node.id,
      );
      return;
    }
    byId.set(node.id, { node, index: i });
  });

  const roots: IIndexedNode[] = tree.flatMap(
    (node: IAutoMovieScriptNode, index: number): IIndexedNode[] =>
      node.parent === null ? [{ node, index }] : [],
  );
  if (roots.length !== 1)
    out.push(
      "type",
      path,
      `the refinement tree needs exactly one root (parent: null), but found ${roots.length}`,
      roots.map((entry: IIndexedNode): string => entry.node.id),
    );
  for (const { node: root, index } of roots)
    if (root.kind !== "intent")
      out.push(
        "type",
        `${path}[${index}].kind`,
        `the root must be the "intent" the tree refines, but "${root.id}" is a "${root.kind}"`,
        root.kind,
      );

  tree.forEach((node: IAutoMovieScriptNode, i: number): void => {
    const np: string = `${path}[${i}]`;
    if (node.kind === "intent") {
      for (const field of ["logline", "theme"] as const) {
        out.nonEmpty(
          `${np}.payload.${field}`,
          node.payload[field],
          `intent ${field}`,
        );
        if (node.payload[field] !== props[field])
          out.push(
            "type",
            `${np}.payload.${field}`,
            `intent ${field} must exactly match the script's flat ${field}`,
            node.payload[field],
          );
      }
    } else if (node.kind === "group")
      out.nonEmpty(
        `${np}.payload.rationale`,
        node.payload.rationale,
        "group rationale",
      );
    if (node.parent !== null) {
      const parent: IIndexedNode | undefined = byId.get(node.parent);
      if (parent === undefined) {
        out.push(
          "type",
          `${np}.parent`,
          `parent "${node.parent}" is not a node of this tree`,
          node.parent,
        );
      } else if (node.kind === "intent") {
        out.push(
          "type",
          `${np}.parent`,
          `an "intent" is the root thought and cannot refine another node`,
          node.parent,
        );
      } else if (!ALLOWED_PARENTS[node.kind].includes(parent.node.kind)) {
        out.push(
          "type",
          `${np}.parent`,
          `a "${node.kind}" cannot refine a "${parent.node.kind}" (allowed: ${ALLOWED_PARENTS[node.kind].join(", ")})`,
          node.parent,
        );
      }
    }

    if (node.temporal !== null) {
      if (node.temporal === node.id)
        out.push(
          "type",
          `${np}.temporal`,
          "a node cannot temporally follow itself",
          node.temporal,
        );
      else if (!byId.has(node.temporal))
        out.push(
          "type",
          `${np}.temporal`,
          `temporal predecessor "${node.temporal}" is not a node of this tree`,
          node.temporal,
        );
    }
    node.interactsWith.forEach((other: string, j: number): void => {
      if (other === node.id)
        out.push(
          "type",
          `${np}.interactsWith[${j}]`,
          "a node cannot interact with itself",
          other,
        );
      else if (!byId.has(other))
        out.push(
          "type",
          `${np}.interactsWith[${j}]`,
          `interaction target "${other}" is not a node of this tree`,
          other,
        );
    });
  });

  validateRefinementCycles(byId, out, path);

  const beatIds: Set<string> = new Set(
    beats.map((beat: IAutoMovieBeat): string => beat.id),
  );
  const claimed: Map<string, number> = new Map();
  tree.forEach((node: IAutoMovieScriptNode, i: number): void => {
    if (node.kind !== "beat") return;
    const np: string = `${path}[${i}].payload`;
    if (!beatIds.has(node.payload.beat)) {
      out.push(
        "type",
        `${np}.beat`,
        `beat node "${node.id}" refines beat "${node.payload.beat}", which is not in the script's beats`,
        node.payload.beat,
      );
    } else {
      const first: number | undefined = claimed.get(node.payload.beat);
      if (first !== undefined)
        out.push(
          "type",
          `${np}.beat`,
          `beat "${node.payload.beat}" is already refined by ${path}[${first}]; each beat joins exactly one node`,
          node.payload.beat,
        );
      else claimed.set(node.payload.beat, i);
    }
    node.payload.dialogue.forEach(
      (line: (typeof node.payload.dialogue)[number], j: number): void => {
        if (
          line.anchor !== null &&
          (!Number.isFinite(line.anchor) || line.anchor < 0)
        )
          out.push(
            "range",
            `${np}.dialogue[${j}].anchor`,
            `dialogue anchor must be a finite number >= 0 or null, but was ${line.anchor}`,
            line.anchor,
          );
      },
    );
  });
  beats.forEach((beat: IAutoMovieBeat, i: number): void => {
    if (!claimed.has(beat.id))
      out.push(
        "type",
        path,
        `beat "${beat.id}" ($input.beats[${i}]) has no beat node; a tree must refine every beat`,
        beat.id,
      );
  });

  return out.toValidation();
}

/** Memoize each parent chain's first repeated node, then report in authored id order. */
function validateRefinementCycles(
  byId: ReadonlyMap<string, IIndexedNode>,
  out: ViolationCollector,
  path: string,
): void {
  const completed: Set<string> = new Set();
  const cycleAt: Map<string, string> = new Map();
  for (const id of byId.keys()) {
    if (completed.has(id)) continue;
    const trail: string[] = [];
    const active: Map<string, number> = new Map();
    let cursor: string | null = id;
    while (
      cursor !== null &&
      byId.has(cursor) &&
      !completed.has(cursor) &&
      !active.has(cursor)
    ) {
      active.set(cursor, trail.length);
      trail.push(cursor);
      cursor = byId.get(cursor)!.node.parent;
    }
    const cycleStart: number | undefined =
      cursor === null ? undefined : active.get(cursor);
    const repeated: string | undefined =
      cursor === null
        ? undefined
        : cycleStart === undefined
          ? cycleAt.get(cursor)
          : cursor;
    trail.forEach((node: string, index: number): void => {
      if (repeated !== undefined)
        cycleAt.set(
          node,
          cycleStart !== undefined && index >= cycleStart ? node : repeated,
        );
      completed.add(node);
    });
  }
  for (const [id, entry] of byId) {
    const repeated: string | undefined = cycleAt.get(id);
    if (repeated !== undefined)
      out.push(
        "type",
        `${path}[${entry.index}].parent`,
        `refinement chain of "${id}" is cyclic at "${repeated}"`,
        repeated,
      );
  }
}
