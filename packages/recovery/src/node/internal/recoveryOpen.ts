import type { IAutoMovieRecoveryRegistration } from "@automovie/interface/recovery";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { AutoMovieRecoveryMeshSections as R } from "../../internal/AutoMovieRecoveryMeshSections";
import { AutoMovieRecoveryOpenContinuation as O } from "../../internal/AutoMovieRecoveryOpenContinuation";
import { reconstructRecoveryOpen } from "../../internal/reconstructRecoveryOpen";
import { writeAutoMovieRecoveryArtifact } from "./writeAutoMovieRecoveryArtifact";

/**
 * Observe endpoint transport into a separate graph, then reconstruct from saved curves and graph.
 * Usage: observe spec.json curves.json graph.json, or reconstruct curves.json graph.json model.json.
 * Source mesh admission occurs only in observe. The graph references the complete curve byte hash;
 * original coefficients are neither duplicated nor refitted. source epoch argument is required.
 *
 * @evidence contracts/common.md#principled-implementation Complete-byte hashes bind source registration, saved cubic authority and source-independent endpoint transport. Reconstruction opens only the two generating publications.
 * @evidence contracts/common.md#clear-and-simple-design Separate observation and reconstruction commands make source consumption explicit; the sidecar avoids copying hundreds of thousands of open coefficients.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No original vertices, source indices or source normals enter reconstruction, no aperture is closed, and existing artifacts cannot be overwritten.
 * @evidence contracts/common.md#meaningful-documentation Documents commands, immutable byte authority, source-only observation, fitting reuse and source-epoch provenance.
 * @evidence contracts/performance.md#efficient-algorithms Files are read and hashed once per command; assembly and serialization are linear in admitted or generated data. Numerical work remains with existing observation and engine operators.
 * @evidence contracts/performance.md#reuse-equivalent-work The original curve publication is reused without fitting, and one engine result supplies model and actual construction.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Synchronous reads and writes close handles. One command owns temporary source arrays or generated buffers, with no global cache or external process.
 */
export function recoveryOpen(args: string[], sourceEpoch: string): void {
  const [command, first, second, output]: string[] = args;
  if (
    !first ||
    !second ||
    !output ||
    (command !== "observe" && command !== "reconstruct")
  )
    throw new Error(
      "Usage: recoveryOpen observe spec curves graph | reconstruct curves graph model",
    );
  if (!sourceEpoch || !/^[a-f0-9]{40,64}$/i.test(sourceEpoch))
    throw new Error("A frozen pre-execution source epoch is required");
  const started: number = performance.now();
  const read: (name: string) => { value: unknown; sha256: string } = (
    name: string,
  ): { value: unknown; sha256: string } => {
    const bytes: Buffer = fs.readFileSync(name);
    return {
      value: JSON.parse(bytes.toString("utf8")) as unknown,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
  };
  let artifact: object;
  if (command === "observe") {
    const registered: ReturnType<typeof read> = read(first),
      saved: ReturnType<typeof read> = read(second);
    const spec: {
      units: string;
      frame: string;
      pose: string;
      meshes: { path: string; sha256: string }[];
      policy: R.Bundle["policy"];
    } = registered.value as {
      units: string;
      frame: string;
      pose: string;
      meshes: { path: string; sha256: string }[];
      policy: R.Bundle["policy"];
    };
    const bundle: R.Bundle & {
      provenance: { inputHash: string; sourceEpoch: string };
      registration:
        | IAutoMovieRecoveryRegistration
        | { units: string; frame: string; pose: string };
    } = saved.value as R.Bundle & {
      provenance: { inputHash: string; sourceEpoch: string };
      registration:
        | IAutoMovieRecoveryRegistration
        | { units: string; frame: string; pose: string };
    };
    if (
      spec.units !== "mm" ||
      !spec.frame ||
      !spec.pose ||
      !spec.meshes?.length ||
      bundle.provenance.inputHash !== registered.sha256 ||
      bundle.registration.units !== spec.units ||
      bundle.registration.frame !== spec.frame ||
      ("evaluatedPose" in bundle.registration
        ? bundle.registration.evaluatedPose
        : bundle.registration.pose) !== spec.pose
    )
      throw new Error(
        "The saved curve publication must bind these exact fixed source and registration bytes",
      );
    const verticesMm: R.Input["verticesMm"] = [],
      triangles: R.Input["triangles"] = [];
    for (const source of spec.meshes) {
      const admitted: ReturnType<typeof read> = read(
        path.resolve(path.dirname(first), source.path),
      );
      if (admitted.sha256 !== source.sha256)
        throw new Error("Fixed source hash mismatch");
      const mesh: {
        vertices: R.Input["verticesMm"];
        triangles: R.Input["triangles"];
      } = admitted.value as {
        vertices: R.Input["verticesMm"];
        triangles: R.Input["triangles"];
      };
      const offset: number = verticesMm.length;
      for (const p of mesh.vertices) verticesMm.push(p);
      for (const t of mesh.triangles)
        triangles.push([t[0] + offset, t[1] + offset, t[2] + offset]);
    }
    const admittedAt: number = performance.now();
    const graph: O.Continuation = O.observe(
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
    artifact = {
      ...graph,
      provenance: {
        sourceEpoch,
        sourceKind: "public-recovery-package",
        sourceSpecSha256: registered.sha256,
        curveBundleSha256: saved.sha256,
        curveProducerEpoch: bundle.provenance.sourceEpoch,
        sources: spec.meshes,
        registration: bundle.registration,
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
          (sum: number, x: O.Continuation["intervals"][number]): number =>
            sum + x.pairs.length,
          0,
        ),
        unsupportedGroups: graph.intervals.reduce(
          (sum: number, x: O.Continuation["intervals"][number]): number =>
            sum + x.unresolved.length,
          0,
        ),
      }),
    );
  } else {
    const saved: ReturnType<typeof read> = read(first),
      topology: ReturnType<typeof read> = read(second);
    const bundle: R.Bundle = saved.value as R.Bundle;
    const graph: O.Continuation & {
      provenance: { curveBundleSha256: string };
    } = topology.value as O.Continuation & {
      provenance: { curveBundleSha256: string };
    };
    if (graph.provenance.curveBundleSha256 !== saved.sha256)
      throw new Error(
        "Open graph does not bind this exact saved cubic authority",
      );
    const generated: ReturnType<typeof reconstructRecoveryOpen> =
      reconstructRecoveryOpen(bundle, graph);
    const counts: { vertices: number; triangles: number } = {
      vertices: 0,
      triangles: 0,
    };
    for (const part of generated.model.parts)
      if (part.geometry.type === "mesh") {
        counts.vertices += part.geometry.mesh.positions.length / 3;
        counts.triangles += part.geometry.mesh.indices!.length / 3;
      }
    artifact = {
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
          curveBundle: saved.sha256,
          openContinuation: topology.sha256,
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
  }
  const publication: ReturnType<typeof writeAutoMovieRecoveryArtifact> =
    writeAutoMovieRecoveryArtifact(output, artifact);
  console.log(JSON.stringify({ file: output, ...publication }));
}
