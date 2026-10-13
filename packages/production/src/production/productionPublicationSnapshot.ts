import type { IAutoMovieProductionEvidence } from "@automovie/evidence";
import {
  AutoMovieContentDigest,
  IAutoMovieBuildProjectOutput,
} from "@automovie/interface";

import { AutoMovieProductionBuilder } from "./AutoMovieProductionBuilder";
import { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import {
  canonicalAutoMovieJsonBytes,
  digestAutoMovieBytes,
} from "./contentIdentity";

/**
 * Fingerprint every current input to one terminal production publication.
 *
 * The builder pass binds source, design, declared content, generated ownership
 * and unowned-output diagnostics. The explicit state fields close the remaining
 * adapter boundary: cached manifest semantics, exact manifest and incarnation
 * bytes, and builder-owned bytes.
 *
 * A publication asks this more than once: when its snapshot is taken and again
 * on each side of the commit lock. A caller that supplies the project's
 * retained source status answers every one of those with a fresh read of the
 * gate's inputs and runs the gate only when they moved. Without one, each call
 * runs a new builder with freshly read evidence.
 */
export const productionPublicationInputFingerprint = (
  project: AutoMovieProductionProject,
  /** Supply the live reader whenever the generated compile used authoring evidence. */
  currentAuthoringEvidence?: () => IAutoMovieProductionEvidence,
  /** Retained read-only source gate status of this project, when the caller holds one. */
  sourceStatus?: () => IAutoMovieBuildProjectOutput,
): AutoMovieContentDigest => {
  const generated = project.generatedManifest();
  if (generated === null)
    throw new Error(
      "Terminal publication snapshot requires current builder-owned output.",
    );
  const projectState = project.projectStateRecords();
  const graph = project.graph();
  const snapshot = {
    protocol: "automovie.terminal-publication-snapshot.v1",
    revision: project.revision(),
    incarnationDigest: digestAutoMovieBytes(projectState.incarnation),
    manifest: {
      value: project.manifest(),
      digest: digestAutoMovieBytes(
        Buffer.from(JSON.stringify(project.manifest()), "utf8"),
      ),
    },
    design: {
      production: graph.production,
      world: graph.world,
      models: [...graph.models],
      formations: [...graph.formations],
      shots: [...graph.shots],
      acceptance: [...graph.acceptance],
    },
    generated: {
      manifest: generated,
      files: generated.files.map((file) => ({
        path: file.path,
        digest: digestAutoMovieBytes(project.readGeneratedFile(file.path)),
      })),
    },
  };
  return readProductionPublicationInputFingerprint({
    snapshot,
    currentAuthoringEvidence,
    compile:
      sourceStatus ??
      ((authoring, current) =>
        new AutoMovieProductionBuilder(project, authoring, current).lint({
          scope: "source",
        })),
  });
};

/**
 * Bind terminal publication to a successful source check using live authoring.
 *
 * The injected compile boundary preserves the timed builder's optional reader
 * contract while allowing a host to reopen the target graph on every call.
 */
export const readProductionPublicationInputFingerprint = <Authoring>(props: {
  snapshot: Readonly<Record<string, unknown>>;
  currentAuthoringEvidence?: () => Authoring;
  compile: (
    authoring: Authoring | undefined,
    current: (() => Authoring) | undefined,
  ) => Pick<
    IAutoMovieBuildProjectOutput,
    "success" | "builder" | "diagnostics"
  >;
}): AutoMovieContentDigest => {
  const builder = props.compile(
    props.currentAuthoringEvidence?.(),
    props.currentAuthoringEvidence,
  );
  if (builder.success === false)
    throw new Error(
      `Terminal publication requires a successful current source compile: ${JSON.stringify(builder.diagnostics)}`,
    );
  return digestAutoMovieBytes(
    canonicalAutoMovieJsonBytes({
      ...props.snapshot,
      builder: {
        success: builder.success,
        inputFingerprint: builder.builder.inputFingerprint,
      },
    }),
  );
};
