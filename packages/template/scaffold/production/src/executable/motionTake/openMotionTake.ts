import { AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieCut,
  IAutoMovieMotionTake,
  IAutoMovieMotionTakeAnchor,
} from "@automovie/interface";
import { realpath } from "node:fs/promises";

import type { IMotionTakeSource } from "./IMotionTakeSource";
import { readMotionTakeArtifact } from "./readMotionTakeArtifact";
import { readMotionTakeSource } from "./readMotionTakeSource";
import { replayMotionTake } from "./replayMotionTake";
import { resolveMotionTakePath } from "./resolveMotionTakePath";
import { verifyMotionTakeEditPrefix } from "./verifyMotionTakeEditPrefix";
import { writeMotionTakeArtifact } from "./writeMotionTakeArtifact";

/**
 * Save, reopen or branch one installed production's supported Human take.
 * Omit `create` to reopen and sample the same runtime at any source second.
 * Only explicitly selected trusted source modules may supply owner inputs.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the three operations and explains the runtime and source trust boundary.
 * @evidence contracts/development/implementation.md#principled-implementation Independently admits the authoring inputs, checks current identities and cut placement, builds a Human runtime and publishes only an admitted artifact. Imports no executable path taken from JSON and never replaces the parent or another take.
 * @evidence contracts/development/implementation.md#efficient-algorithms Selects and verifies the artifact and parent, derives the current anchor and then delegates replay and publication. Prepares only the selected current cut and any branch parent, then opens only the selected Human shot. Returns the prepared owner for any number of exact source-time reads without reopening the artifact. Owner performance lifetime transfers to the caller; no filesystem handles remain open.
 */
export async function openMotionTake(props: {
  root: string;
  source: string;
  artifact: string;
  create?:
    | ({ mode: "save" } & Parameters<typeof AutoMovieEngineFilm.resolveMotionTakeAnchor>[2])
    | { mode: "branch" };
}): Promise<{
  take: IAutoMovieMotionTake;
  replay: ReturnType<typeof replayMotionTake>;
}> {
  const root: string = await realpath(props.root);
  const saved: IAutoMovieMotionTake | undefined =
    props.create === undefined
      ? (await readMotionTakeArtifact(root, props.artifact)).take
      : undefined;
  const { recipe, provenance } = await readMotionTakeSource(
    root,
    props.source,
    saved,
  );
  if (
    props.create &&
    (props.create.mode === "branch") !== (recipe.branch !== undefined)
  )
    throw new Error(
      "take-provenance: select the matching original or branch source module",
    );

  let parent: IMotionTakeSource | undefined;
  let parentCut: ReturnType<typeof resolveAnchor> | undefined;
  let lineage: IAutoMovieMotionTake["parent"];
  if (recipe.branch) {
    const original: Awaited<ReturnType<typeof readMotionTakeArtifact>> =
      await readMotionTakeArtifact(root, recipe.branch.artifact);
    if (original.take.parent !== undefined)
      throw new Error("take-provenance: branch the saved original take");
    lineage = { path: recipe.branch.artifact, sha256: original.sha256 };
    if (
      saved &&
      (saved.parent?.path !== lineage.path ||
        saved.parent.sha256 !== lineage.sha256)
    )
      throw new Error(
        "take-provenance: saved branch parent differs from the original artifact",
      );
    const originalInputs: Awaited<ReturnType<typeof readMotionTakeSource>> =
      await readMotionTakeSource(root, recipe.branch.source, original.take);
    parent = originalInputs.recipe;
    if (
      parent.branch ||
      parent.production !== recipe.production ||
      parent.take === recipe.take
    )
      throw new Error(
        "take-provenance: branch requires a distinct take in the original production",
      );
    parentCut = resolveAnchor(parent, original.take.anchor);
    AutoMovieEngineFilm.verifyMotionTake(original.take, {
      production: parent.production,
      take: parent.take,
      anchor: parentCut.anchor,
      source: {
        module: recipe.branch.source,
        export: "createMotionTakeSource",
      },
      provenance: originalInputs.provenance,
    });
  }

  const parentAnchor: IAutoMovieMotionTakeAnchor | undefined =
    parentCut?.anchor;
  const selection: Parameters<typeof AutoMovieEngineFilm.resolveMotionTakeAnchor>[2] | undefined =
    parentAnchor ??
    saved?.anchor ??
    (props.create?.mode === "save" ? props.create : undefined);
  if (selection === undefined)
    throw new Error("take-anchor: missing selected output time");
  const cut: ReturnType<typeof resolveAnchor> = resolveAnchor(
    recipe,
    selection,
  );
  const { anchor } = cut;
  if (
    parentAnchor &&
    (anchor.sequence !== parentAnchor.sequence ||
      anchor.shot !== parentAnchor.shot ||
      anchor.sourceSeconds !== parentAnchor.sourceSeconds)
  )
    throw new Error("take-anchor: branch changes the original saved placement");
  const current: IAutoMovieMotionTake = AutoMovieEngineFilm.admitMotionTake({
    version: 1,
    production: recipe.production,
    take: recipe.take,
    source: { module: props.source, export: "createMotionTakeSource" },
    replay: "authored",
    anchor,
    provenance,
    ...(lineage === undefined ? {} : { parent: lineage }),
  });
  if (saved) AutoMovieEngineFilm.verifyMotionTake(saved, current);

  const replay: ReturnType<typeof replayMotionTake> = replayMotionTake(
    recipe,
    anchor,
    parent,
  );
  if (parentCut && replay.branchStart !== undefined)
    verifyMotionTakeEditPrefix(
      parentCut,
      cut,
      anchor.entry,
      replay.branchStart,
    );
  if (props.create)
    await writeMotionTakeArtifact(
      await resolveMotionTakePath(root, props.artifact, "create"),
      current,
    );
  return { take: current, replay };
}

/** Admit the registered edit and resolve one exact occurrence through the editorial owner. */
function resolveAnchor(
  { edit, shots }: IMotionTakeSource,
  selection: Parameters<typeof AutoMovieEngineFilm.resolveMotionTakeAnchor>[2],
): Parameters<typeof verifyMotionTakeEditPrefix>[0] & {
  anchor: IAutoMovieMotionTakeAnchor;
} {
  const cut: IAutoMovieCut = AutoMovieEngineFilm.cutSequence(edit, [...shots]);
  if (!cut.success)
    throw new Error(
      `take-anchor: edit was refused ${JSON.stringify(cut.violations)}`,
    );
  const prepared: ReturnType<typeof AutoMovieEngineFilm.preparePlaybackTimeline> =
    AutoMovieEngineFilm.preparePlaybackTimeline(cut.sequence, shots);
  return {
    sequence: cut.sequence,
    shots,
    prepared,
    anchor: AutoMovieEngineFilm.resolveMotionTakeAnchor(cut.sequence, prepared, selection),
  };
}
