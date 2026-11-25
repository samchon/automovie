import type {
  AutoMovieRecoveryCurveData,
  AutoMovieRecoveryCurveFormat,
  IAutoMovieByteDigest,
  IAutoMovieRecoveryInput,
  IAutoMovieRecoveryMeshSections,
  IAutoMovieRecoveryModelCounts,
  IAutoMovieRecoveryOpenContinuation,
  IAutoMovieRecoveryRegistration,
} from "@automovie/interface";
import {
  AutoMovieRecoveryOpenContinuation,
  reconstructRecoveryOpen,
  restoreRecoveryCurveBasis,
} from "@automovie/recovery";

import { publishAutoMovieRecoveryInput } from "../artifact/publishAutoMovieRecoveryInput";
import { writeAutoMovieRecoveryArtifact } from "../artifact/writeAutoMovieRecoveryArtifact";

/**
 * Observe endpoint transport from a registered source or reconstruct from a
 * fixed curve publication and its separate graph. The graph binds the original
 * curve hash and carries no replacement coefficients. Reconstruction consumes
 * no source mesh data.
 */
export function recoveryOpen(
  props: recoveryOpen.IObserve,
): publishAutoMovieRecoveryInput.IArtifact<recoveryOpen.ICurveGraph>;

/** Publish open-surface reconstruction from a matched curve and graph. */
export function recoveryOpen(
  props: recoveryOpen.IReconstruct,
): IAutoMovieByteDigest;

/** Run the selected observation or reconstruction and publish its result. */
export function recoveryOpen(
  props: recoveryOpen.IObserve | recoveryOpen.IReconstruct,
): IAutoMovieByteDigest {
  const { sourceEpoch, output }: typeof props = props;
  if (output.length === 0)
    throw new Error("An open recovery output path is required");
  if (!/^[a-f0-9]{40,64}$/i.test(sourceEpoch))
    throw new Error("A frozen pre-execution source epoch is required");

  const started: number = performance.now();
  if (props.operation === "observe") {
    const { source, meshes, curves }: recoveryOpen.IObserve = props;
    const spec: recoveryOpen.ISource = source.value;
    const registered: recoveryOpen.IRegistration = curves.value.registration;
    if (
      !spec.frame ||
      !spec.pose ||
      spec.meshes.length === 0 ||
      spec.meshes.length !== meshes.length ||
      curves.value.provenance.inputHash !== source.sha256 ||
      registered.units !== spec.units ||
      registered.frame !== spec.frame ||
      (registered.evaluatedPose ?? registered.pose) !== spec.pose
    )
      throw new Error(
        "The saved curve publication must bind these exact fixed source and registration bytes",
      );

    const verticesMm: IAutoMovieRecoveryInput["verticesMm"] = [];
    const triangles: IAutoMovieRecoveryInput["triangles"] = [];
    for (const [index, declared] of spec.meshes.entries()) {
      const mesh: (typeof meshes)[number] | undefined = meshes[index];
      if (mesh === undefined || mesh.sha256 !== declared.sha256)
        throw new Error("Fixed source hash mismatch");
      const offset: number = verticesMm.length;
      for (const point of mesh.value.vertices) verticesMm.push(point);
      for (const triangle of mesh.value.triangles)
        triangles.push([
          triangle[0] + offset,
          triangle[1] + offset,
          triangle[2] + offset,
        ]);
    }
    const bundle: IAutoMovieRecoveryMeshSections = restoreRecoveryCurveBasis(
      curves.value,
    );
    const admittedAt: number = performance.now();
    const graph: IAutoMovieRecoveryOpenContinuation =
      AutoMovieRecoveryOpenContinuation.observe(
        { ...spec.policy, verticesMm, triangles },
        bundle,
        (completed: number, total: number): void => {
          console.error(
            JSON.stringify({
              phase: "open-observation",
              completed,
              total,
              elapsedMs: performance.now() - admittedAt,
            }),
          );
        },
      );
    const artifact: recoveryOpen.ICurveGraph = {
      ...graph,
      provenance: {
        sourceEpoch,
        sourceKind: "public-recovery-package",
        sourceSpecSha256: source.sha256,
        curveBundleSha256: curves.sha256,
        curveProducerEpoch: curves.value.provenance.sourceEpoch,
        sources: spec.meshes,
        registration: registered,
        generatedAt: new Date().toISOString(),
        elapsedMs: {
          sourceAndCurveAdmission: admittedAt - started,
          openObservationWithoutRefitting: performance.now() - admittedAt,
        },
      },
    };
    console.log(
      JSON.stringify({
        intervals: graph.intervals.length,
        pairs: graph.intervals.reduce(
          (
            sum: number,
            interval: IAutoMovieRecoveryOpenContinuation["intervals"][number],
          ): number => sum + interval.pairs.length,
          0,
        ),
        unsupportedGroups: graph.intervals.reduce(
          (
            sum: number,
            interval: IAutoMovieRecoveryOpenContinuation["intervals"][number],
          ): number => sum + interval.unresolved.length,
          0,
        ),
      }),
    );
    const publication: publishAutoMovieRecoveryInput.IArtifact<recoveryOpen.ICurveGraph> =
      publishAutoMovieRecoveryInput(output, artifact);
    console.log(
      JSON.stringify({
        file: output,
        sha256: publication.sha256,
        bytes: publication.bytes,
      }),
    );
    return publication;
  }

  const { continuation, curves }: recoveryOpen.IReconstruct = props;
  if (continuation.value.provenance.curveBundleSha256 !== curves.sha256)
    throw new Error("Open graph does not bind this exact saved cubic authority");
  const bundle: IAutoMovieRecoveryMeshSections = restoreRecoveryCurveBasis(
    curves.value,
  );
  const generated: ReturnType<typeof reconstructRecoveryOpen> =
    reconstructRecoveryOpen(bundle, continuation.value);
  const counts: IAutoMovieRecoveryModelCounts = {
    vertices: 0,
    triangles: 0,
  };
  for (const part of generated.model.parts)
    if (part.geometry.type === "mesh") {
      const indices: number[] | null = part.geometry.mesh.indices;
      if (indices === null)
        throw new Error("Open reconstruction must publish indexed geometry");
      counts.vertices += part.geometry.mesh.positions.length / 3;
      counts.triangles += indices.length / 3;
    }

  const artifact: object = {
    schema: "human-reference-engine-model-v1",
    model: generated.model,
    construction: { units: "m", lines: generated.construction },
    diagnostics: generated.diagnostics,
    unresolved: generated.unresolved,
    unresolvedScope:
      "closed-section operator observations, retained independently of additional open surfaces",
    openReports: generated.openReports,
    counts,
    ...(bundle.coverage ? { coverage: bundle.coverage } : {}),
    provenance: {
      sourceCommit: sourceEpoch,
      sourceKind: "public-recovery-package",
      inputKeys: ["curveBundle", "openContinuation"],
      inputHashes: {
        curveBundle: curves.sha256,
        openContinuation: continuation.sha256,
      },
      engineOperators: [
        "tessellateAutoMovieContourLoft64",
        "tessellateAutoMovieCurveGrid64",
      ],
      generatedAt: new Date().toISOString(),
      elapsedMs: performance.now() - started,
    },
  };
  console.log(
    JSON.stringify({
      counts,
      openRuns: generated.openReports.generatedRuns,
      openPairs: generated.openReports.pairs,
      unsupportedOpenGroups: generated.openReports.unsupportedGroups,
      closedOperatorUnresolved: generated.unresolved.length,
    }),
  );
  const publication: IAutoMovieByteDigest = writeAutoMovieRecoveryArtifact(
    output,
    artifact,
  );
  console.log(JSON.stringify({ file: output, ...publication }));
  return publication;
}

export namespace recoveryOpen {
  /** Current registration or the pose recorded by the earlier extraction. */
  export type IRegistration =
    | (IAutoMovieRecoveryRegistration & { pose?: undefined })
    | {
        units: string;
        frame: string;
        pose: string;
        evaluatedPose?: undefined;
      };

  /** Reference and exact byte identity declared for a source mesh. */
  export interface ISourceReference {
    path: string;
    sha256: string;
  }

  /** Frozen observation policy and registration of the original source. */
  export interface ISource {
    units: "mm";
    frame: string;
    pose: string;
    meshes: readonly ISourceReference[];
    policy: IAutoMovieRecoveryMeshSections["policy"];
  }

  /** Registered indexed source geometry in millimetres. */
  export interface IMesh {
    vertices: IAutoMovieRecoveryInput["verticesMm"];
    triangles: IAutoMovieRecoveryInput["triangles"];
  }

  /** Saved sections carrying the identity of their registered source. */
  export interface ICurveArtifact extends IAutoMovieRecoveryMeshSections {
    registration: IRegistration;
    provenance: { inputHash: string; sourceEpoch: string };
  }

  /** Continuation graph and the curve identity needed by reconstruction. */
  export interface IContinuation extends IAutoMovieRecoveryOpenContinuation {
    provenance: { curveBundleSha256: string };
  }

  /** Graph publication with its exact generating inputs recorded. */
  export interface ICurveGraph extends IContinuation {
    provenance: IContinuation["provenance"] & {
      sourceEpoch: string;
      sourceKind: "public-recovery-package";
      sourceSpecSha256: string;
      curveProducerEpoch: string;
      sources: readonly ISourceReference[];
      registration: IRegistration;
      generatedAt: string;
      elapsedMs: {
        sourceAndCurveAdmission: number;
        openObservationWithoutRefitting: number;
      };
    };
  }

  /** Derive a graph from the fixed registered source and its saved sections. */
  export interface IObserve {
    operation: "observe";
    source: publishAutoMovieRecoveryInput.IArtifact<ISource>;
    meshes: readonly publishAutoMovieRecoveryInput.IArtifact<IMesh>[];
    curves: publishAutoMovieRecoveryInput.IArtifact<
      AutoMovieRecoveryCurveData<ICurveArtifact, AutoMovieRecoveryCurveFormat>
    >;
    output: string;
    sourceEpoch: string;
  }

  /** Reconstruct from either saved curve basis and its matching graph. */
  export interface IReconstruct {
    operation: "reconstruct";
    curves: publishAutoMovieRecoveryInput.IArtifact<
      AutoMovieRecoveryCurveData<
        IAutoMovieRecoveryMeshSections,
        AutoMovieRecoveryCurveFormat
      >
    >;
    continuation: publishAutoMovieRecoveryInput.IArtifact<IContinuation>;
    output: string;
    sourceEpoch: string;
  }
}
