import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { evaluateHumanFaceRest } from "../../basis/evaluateHumanFaceRest";
import type { humanFaceBasisWeights } from "../../basis/humanFaceBasisWeights";
import { resolveHumanFaceArticulation } from "../../basis/resolveHumanFaceArticulation";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisChannel } from "../../structures/IAutoMovieHumanFaceBasisChannel";
import type { IAutoMovieHumanFaceEyes } from "../../structures/IAutoMovieHumanFaceEyes";
import type { IAutoMovieHumanFaceOpticalSupport } from "../../structures/IAutoMovieHumanFaceOpticalSupport";
import type { IAutoMovieHumanFaceRigidMotion } from "../../structures/IAutoMovieHumanFaceRigidMotion";
import { buildHumanFaceOpticalGeometry } from "./buildHumanFaceOpticalGeometry";
import { createHumanFaceOcularSurface } from "./createHumanFaceOcularSurface";
import { resolveHumanFaceOpticalFrame } from "./resolveHumanFaceOpticalFrame";
import { resolveHumanFaceOpticalProfile } from "./resolveHumanFaceOpticalProfile";
import type { IHumanFaceOcularSurface } from "./structures/IHumanFaceOcularSurface";
import type { IHumanFaceOpticalAssembly } from "./structures/IHumanFaceOpticalAssembly";

/**
 * Construct both independent eyes on the qualified shared source chart.
 *
 * The identical exterior serves display and rigid contact. Placement reads
 * shape-only source coordinates, while gaze reads the existing articulation
 * owner with the complete current weights. No radius or axis is refitted from
 * an aperture or a performed globe. This is an authored optical construction;
 * it supplies neither measured corneal tissue nor clinical shape intervals.
 * The optional observer reports completed mesh construction and each actual
 * exterior-cell certificate in its rest or performed state. It carries only
 * owner identities; observer exceptions abort instead of returning a partial assembly.
 *
 * @evidence contracts/common.md#principled-implementation Shape-only source support resolves one profile/frame per eye; the same generated hull is rigidly posed and reread for actual-cell deviation.
 * @evidence contracts/common.md#clear-and-simple-design Rest and current exteriors retain their generating profile and frame while native motions own articulation, independently of aperture clipping.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Observers run only after actual phases complete and errors propagate; no estimate, arbitrary progress timer or refitted posed eye is substituted.
 * @evidence contracts/common.md#meaningful-documentation The prose gives source generation/side identity, metres, rest/posed ownership and observer failure behavior.
 * @evidence contracts/performance.md#efficient-algorithms Actual source pose evaluation, fixed optical lattices and all cell certificates dominate, including exact arithmetic delegated to metric owners.
 * @evidence contracts/performance.md#reuse-equivalent-work One generated optical core supplies rest/posed parts and collision hull identity; captured profile coefficients serve both deviation passes with value-keyed reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned assemblies own their geometry and exterior closures; temporary source-reference/motion readings expire, acquiring no background work.
 */
export function buildHumanFaceOpticalAssembly(
  basis: IAutoMovieHumanFaceBasis,
  state: ReturnType<typeof humanFaceBasisWeights>,
  eyes: IAutoMovieHumanFaceEyes,
  progress?: (owner: string) => void,
): IHumanFaceOpticalAssembly[] {
  if (basis.articulation === undefined)
    throw new Error("Independent optics need their source articulation owner.");
  const shapeIds: Set<string> = new Set(
    basis.channels
      .filter(
        (c: IAutoMovieHumanFaceBasisChannel): boolean => c.kind === "shape",
      )
      .map((c: IAutoMovieHumanFaceBasisChannel): string => c.id),
  );
  const shapedState: {
    weights: Map<string, number>;
    activations: { target: string; activation: number; shapeOnly: boolean }[];
  } = {
    weights: new Map(
      [...state.weights].filter(([id]: [string, number]): boolean =>
        shapeIds.has(id),
      ),
    ),
    activations: state.activations.filter(
      (one: {
        target: string;
        activation: number;
        shapeOnly: boolean;
      }): boolean => one.shapeOnly,
    ),
  };
  const rest: {
    surfaces: number[][];
    landmarks: Record<string, IAutoMovieVector3>;
  } = evaluateHumanFaceRest(basis, shapedState);
  const motions: Map<string, IAutoMovieHumanFaceRigidMotion> =
    resolveHumanFaceArticulation(
      basis.articulation,
      state.weights,
      rest.landmarks,
    ).motions;
  return (["left", "right"] as const).map(
    (
      side: "left" | "right",
    ): {
      side: "left" | "right";
      surface: string;
      vertices: Set<number>;
      generation: string;
      collider: { id: string; rest: IAutoMovieMesh; posed: IAutoMovieMesh };
      geometry: {
        hull: { mesh: IAutoMovieMesh; physicalPoints: number[] };
        parts: {
          sclera: { mesh: IAutoMovieMesh; physicalPoints: number[] };
          cornea: { mesh: IAutoMovieMesh; physicalPoints: number[] };
          iris: { mesh: IAutoMovieMesh; physicalPoints: number[] };
          apertureBacking: { mesh: IAutoMovieMesh; physicalPoints: number[] };
        };
        readDeviation: (
          currentFrame: ReturnType<typeof resolveHumanFaceOpticalFrame>,
          progress?: (branch: "cap" | "sphere", cell: number) => void,
        ) => number;
      };
      deviation: { rest: number; posed: number };
      center: IAutoMovieVector3;
      exterior: {
        rest: IHumanFaceOcularSurface;
        posed: IHumanFaceOcularSurface;
      };
    } => {
      const owner: "leftEye" | "rightEye" =
        side === "left" ? "leftEye" : "rightEye";
      const supports: IAutoMovieHumanFaceOpticalSupport[] = (
        basis.opticalSupport ?? []
      ).filter(
        (one: IAutoMovieHumanFaceOpticalSupport): boolean =>
          one.owner === owner,
      );
      if (supports.length !== 1)
        throw new Error(
          "Independent optics need one qualified source support for " +
            owner +
            ".",
        );
      const support: IAutoMovieHumanFaceOpticalSupport = supports[0];
      const profile: {
        radius: number;
        limbus: number;
        curvature: number;
        thickness: number;
        iris: number;
        aperture: number;
        depth: number;
        rim: number;
        apex: number;
        irisZ: number;
        height: (r: number) => number;
        slope: (r: number) => number;
      } = resolveHumanFaceOpticalProfile(eyes[side]);
      const frame: {
        origin: IAutoMovieVector3;
        center: IAutoMovieVector3;
        axis: IAutoMovieVector3;
        up: IAutoMovieVector3;
        lateral: IAutoMovieVector3;
        owner: "leftEye" | "rightEye";
        surface: string;
        vertices: Set<number>;
      } = resolveHumanFaceOpticalFrame(
        basis,
        support,
        rest,
        shapedState,
        profile.apex,
      );
      const geometry: {
        hull: { mesh: IAutoMovieMesh; physicalPoints: number[] };
        parts: {
          sclera: { mesh: IAutoMovieMesh; physicalPoints: number[] };
          cornea: { mesh: IAutoMovieMesh; physicalPoints: number[] };
          iris: { mesh: IAutoMovieMesh; physicalPoints: number[] };
          apertureBacking: { mesh: IAutoMovieMesh; physicalPoints: number[] };
        };
        readDeviation: (
          currentFrame: ReturnType<typeof resolveHumanFaceOpticalFrame>,
          progress?: (branch: "cap" | "sphere", cell: number) => void,
        ) => number;
      } = buildHumanFaceOpticalGeometry(profile, frame);
      progress?.("optics:" + side + ":geometry");
      const restDeviation: number = geometry.readDeviation(
        frame,
        progress === undefined
          ? undefined
          : (branch: "cap" | "sphere", cell: number): void =>
              progress("optics:" + side + ":rest:" + branch + ":cell:" + cell),
      );
      progress?.("optics:" + side + ":rest-certified");
      const restHull: IAutoMovieMesh = structuredClone(geometry.hull.mesh);
      const motion: IAutoMovieHumanFaceRigidMotion = motions.get(owner)!;
      const pose: (mesh: IAutoMovieMesh) => void = (
        mesh: IAutoMovieMesh,
      ): void => {
        for (let at: number = 0; at < mesh.positions.length; at += 3) {
          const point: IAutoMovieVector3 = Vector3.create(
            ...mesh.positions.slice(at, at + 3),
          );
          const placed: IAutoMovieVector3 = Vector3.add(
            Vector3.add(
              motion.pivot,
              Quaternion.rotateVector(
                motion.rotation,
                Vector3.subtract(point, motion.pivot),
              ),
            ),
            motion.translation,
          );
          mesh.positions.splice(at, 3, placed.x, placed.y, placed.z);
        }
        for (let at: number = 0; at < (mesh.normals?.length ?? 0); at += 3) {
          const normal: IAutoMovieVector3 = Quaternion.rotateVector(
            motion.rotation,
            Vector3.create(...mesh.normals!.slice(at, at + 3)),
          );
          mesh.normals!.splice(at, 3, normal.x, normal.y, normal.z);
        }
        if (
          !mesh.positions.every(Number.isFinite) ||
          !mesh.normals?.every(Number.isFinite)
        )
          throw new Error(
            "Independent optical motion exceeds finite source coordinates.",
          );
      };
      pose(geometry.hull.mesh);
      for (const part of Object.values(geometry.parts)) pose(part.mesh);
      const posedFrame: {
        center: IAutoMovieVector3;
        axis: IAutoMovieVector3;
        lateral: IAutoMovieVector3;
        up: IAutoMovieVector3;
        origin: IAutoMovieVector3;
        owner: "leftEye" | "rightEye";
        surface: string;
        vertices: Set<number>;
      } = {
        ...frame,
        center: Vector3.add(
          Vector3.add(
            motion.pivot,
            Quaternion.rotateVector(
              motion.rotation,
              Vector3.subtract(frame.center, motion.pivot),
            ),
          ),
          motion.translation,
        ),
        axis: Quaternion.rotateVector(motion.rotation, frame.axis),
        lateral: Quaternion.rotateVector(motion.rotation, frame.lateral),
        up: Quaternion.rotateVector(motion.rotation, frame.up),
      };
      progress?.("optics:" + side + ":posed-mesh");
      const posedDeviation: number = geometry.readDeviation(
        posedFrame,
        progress === undefined
          ? undefined
          : (branch: "cap" | "sphere", cell: number): void =>
              progress(
                "optics:" + side + ":performed:" + branch + ":cell:" + cell,
              ),
      );
      progress?.("optics:" + side + ":performed-certified");
      return {
        side,
        surface: support.surface,
        vertices: frame.vertices,
        generation: support.generation,
        collider: {
          id: "optics:" + side,
          rest: restHull,
          posed: geometry.hull.mesh,
        },
        geometry,
        deviation: { rest: restDeviation, posed: posedDeviation },
        center: Vector3.add(
          Vector3.add(
            motion.pivot,
            Quaternion.rotateVector(
              motion.rotation,
              Vector3.subtract(frame.center, motion.pivot),
            ),
          ),
          motion.translation,
        ),
        exterior: {
          rest: createHumanFaceOcularSurface(
            profile,
            frame.center,
            frame.axis,
            frame.lateral,
            restDeviation,
          ),
          posed: createHumanFaceOcularSurface(
            profile,
            Vector3.add(
              Vector3.add(
                motion.pivot,
                Quaternion.rotateVector(
                  motion.rotation,
                  Vector3.subtract(frame.center, motion.pivot),
                ),
              ),
              motion.translation,
            ),
            Quaternion.rotateVector(motion.rotation, frame.axis),
            Quaternion.rotateVector(motion.rotation, frame.lateral),
            posedDeviation,
          ),
        },
      };
    },
  );
}
