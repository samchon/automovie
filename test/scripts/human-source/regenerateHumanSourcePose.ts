import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

import { createBodyCorrectiveSession } from "../body-basis/createBodyCorrectiveSession";
import { mergeBodyCorrectives } from "../body-basis/mergeBodyCorrectives";
import { HUMAN_SOURCE_POSE_PRODUCER as P } from "./HUMAN_SOURCE_POSE_PRODUCER.ts";
import type { IHumanSourceCut } from "./structures/IHumanSourceCut.ts";
import type { IHumanSourceGeneration } from "./structures/IHumanSourceGeneration.ts";
import type { IHumanSourcePoseRegeneration } from "./structures/IHumanSourcePoseRegeneration.ts";

/**
 * Re-solve, on the assembled body view, the pose correctives whose published
 * fields reached the new neck support, with the repository's contact solver.
 * The dropped correctives leave the working basis first; the solver visits
 * the producer's states and the merge appends what it accepted with exact
 * mirrors at 10 µm. The body view and the generation then carry the new
 * correctives in place of the dropped ones (generation rows on the body view's
 * samples), and the dropped ids leave both unavailable lists. The receipt
 * keeps every solver record (crossing pairs, onsets, verification).
 */
export function regenerateHumanSourcePose(body: IAutoMovieHumanBodyBasis, generation: IHumanSourceGeneration, cut: IHumanSourceCut): IHumanSourcePoseRegeneration {
  const dropped = new Set(P.dropped);
  const declared = (body.unavailableTargets ?? []).filter((t) => !dropped.has(t));
  const surface = body.surfaces[0];
  const working: IAutoMovieHumanBodyBasis = {
    ...body,
    ...(declared.length === 0 ? { unavailableTargets: undefined } : { unavailableTargets: declared }),
    correctives: (body.correctives ?? []).filter((c) => !dropped.has(c.id)),
    surfaces: [{ ...surface, targets: Object.fromEntries(Object.entries(surface.targets).filter(([name]) => !dropped.has(name))) }, ...body.surfaces.slice(1)],
  };
  const session = createBodyCorrectiveSession(working);
  for (const state of P.states) session.solve(state);
  const solved = session.published();
  const merge = mergeBodyCorrectives({ ...body, ...(declared.length === 0 ? { unavailableTargets: undefined } : { unavailableTargets: declared }) }, { dropped: [...dropped], correctives: solved.correctives, rows: solved.rows }, body.id);
  const merged = merge.basis;
  const created = [...merge.added, ...merge.mirrored];
  const targets = { ...generation.targets };
  for (const id of dropped) delete targets[id];
  for (const id of created) {
    const rows = merged.surfaces[0].targets[id];
    const g1: [number, number, number, number][] = [];
    for (let i = 0; i < rows.length; i += 4) g1.push([cut.p1BodyToG1[rows[i]], rows[i + 1], rows[i + 2], rows[i + 3]]);
    g1.sort((a, b) => a[0] - b[0]);
    targets[id] = g1.flat();
  }
  const correctives = generation.correctives.filter((c) => !dropped.has(c.id));
  for (const id of created) {
    const corrective = merged.correctives!.find((c) => c.id === id)!;
    correctives.push({ ...corrective, origin: "body" });
  }
  const unavailable = Object.fromEntries(Object.entries(generation.unavailable).filter(([name]) => !dropped.has(name)));
  return {
    body: merged,
    generation: {
      ...generation,
      targets,
      correctives,
      unavailable,
      stamps: [
        ...generation.stamps,
        { derivative: `body pose correctives re-solved (${P.revision})`, authoredOn: generation.id, status: "regenerated", note: `${[...dropped].join(", ")} replaced by ${created.join(", ")}; new solve, not the published values` },
      ],
    },
    receipt: {
      revision: P.revision,
      method: "repository contact solver (createBodyCorrectiveSession) on the body view without the dropped correctives, merged with exact mirrors at 10 micrometres (mergeBodyCorrectives)",
      solverChange:
        "the published round-9 correctives came from an earlier solver; the current one bisects the onset over the whole shape, prices pushes by per-pair tissue budgets and queues a still-crossing ramp midpoint as its own state, so the same state yields its own correctives",
      dropped: [...dropped],
      created,
      states: P.states.map((s) => `${s.set}:${s.name}`),
      // Solver records without their wall-clock durations, which belong to the run, not the content.
      records: solved.records.map(({ ms: _ms, ...record }) => record),
    },
  };
}
