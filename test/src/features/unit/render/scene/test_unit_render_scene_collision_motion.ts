import { preparePhysicalGeometry } from "@automovie/engine";
import type {
  IAutoMovieInspectionDiagnostics as Diagnostic,
  IAutoMoviePreparePhysicalGeometry as Geometry,
  IAutoMovieRenderSoftPropFrame,
} from "@automovie/interface";
import {
  type IAutoMovieSceneSoftProps,
  buildSceneSoftProps,
  observeAutoMovieCollisionMotion,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * Find a thin cord crossing a small solid between two placed frames.
 *
 * A cord along Z sweeps two metres along X during one 30 Hz frame, so it lies
 * a metre to either side of a 5 cm sphere at both drawn frames and crosses it
 * near 65% of the way. A second sphere lies 14 cm beyond the cord's end.
 *
 * 1. Subdivision at placed instants confirms the crossing with a sub-frame
 *    time strictly between the drawn frames, inside its reported span.
 * 2. The sphere beyond the cord's end stays clear.
 * 3. The same span across a cut is not examined and reports nothing.
 * 4. The drawn instant is placed again before the call returns.
 */
export async function test_unit_render_scene_collision_motion(): Promise<void> {
  const geometry: Geometry.IQueries = await preparePhysicalGeometry();
  const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  const scene: THREE.Scene = new THREE.Scene();
  for (const [name, z] of [
    ["target", 0],
    ["beyond", 1.2],
  ] as const) {
    const ball: THREE.Mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 16, 12),
      material,
    );
    ball.name = name;
    ball.position.set(0.3, 1, z);
    scene.add(ball);
  }
  const soft: IAutoMovieSceneSoftProps = buildSceneSoftProps(scene);
  const frame: number = 1 / 30;
  const rope = (seconds: number): IAutoMovieRenderSoftPropFrame => {
    const x: number = -1 + 2 * (seconds / frame);
    const positions: number[] = [];
    for (let i: number = 0; i <= 8; ++i) positions.push(x, 1, -1 + i * 0.25);
    return {
      subject: "rope",
      status: "solved",
      cordRadius: 0.01,
      surface: {
        domain: "rope",
        step: 0,
        bounds: null,
        mesh: {
          positions,
          normals: null,
          uvs: null,
          indices: null,
          skin: null,
        },
      },
    };
  };
  const placed: number[] = [];
  const place = (seconds: number): void => {
    placed.push(seconds);
    soft.update([rope(seconds)]);
    scene.updateMatrixWorld(true);
  };
  place(frame);
  const observe = (
    continuous: boolean,
  ): Pick<Diagnostic, "findings" | "coverage"> =>
    observeAutoMovieCollisionMotion({
      time: { filmSeconds: frame, outputFrame: 1 },
      fromSeconds: 0,
      continuous,
      place,
      layers: (seconds: number) => [
        { id: "main", root: scene, localSeconds: seconds },
      ],
      geometry,
      limits: {
        placements: Number.MAX_SAFE_INTEGER,
        depth: 30,
        comparisons: Number.MAX_SAFE_INTEGER,
        posedVertices: Number.MAX_SAFE_INTEGER,
        surfaceTriangles: Number.MAX_SAFE_INTEGER,
      },
    });

  const crossed = observe(true);
  const hit: Diagnostic.IFinding | undefined = crossed.findings[0];
  const seconds: number | undefined = hit?.witness.time?.filmSeconds;
  TestValidator.predicate(
    "the crossing between drawn frames is confirmed at a sub-frame time",
    crossed.findings.length !== 0 &&
      crossed.findings.every(
        ({ code, confidence, paths }: Diagnostic.IFinding): boolean =>
          code === "swept-penetration" &&
          confidence === "confirmed" &&
          paths[0]!.startsWith("soft:rope/segment/") &&
          paths[1] === "target",
      ) &&
      seconds !== undefined &&
      seconds > 0.55 * frame &&
      seconds < 0.75 * frame &&
      hit!.witness.interval !== undefined &&
      hit!.witness.interval.from <= seconds &&
      seconds <= hit!.witness.interval.to,
  );
  TestValidator.predicate(
    "the sphere beyond the cord's end stays clear and the drawn instant is placed last",
    !crossed.findings.some(({ paths }: Diagnostic.IFinding): boolean =>
      paths.includes("beyond"),
    ) &&
      crossed.coverage.some(
        ({ key, status }: Diagnostic.ICoverage): boolean =>
          key === JSON.stringify(["main", "motion"]) && status === "checked",
      ) &&
      placed[placed.length - 1] === frame,
  );
  TestValidator.equals("a cut has no path to examine", observe(false), {
    findings: [],
    coverage: [
      {
        check: "collision",
        key: JSON.stringify(["main", "motion"]),
        required: false,
        status: "excluded",
        reason: "cut",
      },
    ],
  });

  soft.dispose();
  for (const child of scene.children)
    if (child instanceof THREE.Mesh) child.geometry.dispose();
  material.dispose();
}
