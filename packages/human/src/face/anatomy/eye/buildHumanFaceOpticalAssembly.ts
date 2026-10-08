import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import { evaluateHumanFaceRest } from "../../basis/evaluateHumanFaceRest";
import type { humanFaceBasisWeights } from "../../basis/humanFaceBasisWeights";
import { resolveHumanFaceArticulation } from "../../basis/resolveHumanFaceArticulation";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceEyes } from "../../structures/IAutoMovieHumanFaceEyes";
import { buildHumanFaceOpticalGeometry } from "./buildHumanFaceOpticalGeometry";
import { createHumanFaceOcularSurface } from "./createHumanFaceOcularSurface";
import { resolveHumanFaceOpticalFrame } from "./resolveHumanFaceOpticalFrame";
import { resolveHumanFaceOpticalProfile } from "./resolveHumanFaceOpticalProfile";
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
 * @evidence contracts/common.md#principled-implementation The profile supplies exact interface geometry, the source chart supplies placement, and one existing rigid motion acts on positions and directions without scaling.
 * @evidence contracts/common.md#clear-and-simple-design One assembly connects the existing profile, frame, geometry and articulation owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No aperture fitting, source-name fallback, separate collision sphere or invented default dimensions.
 * @evidence contracts/common.md#meaningful-documentation States state separation, shared exterior and scientific limits.
 * @evidence contracts/modeling.md#part-identity-and-grouping Each eye composes sclera, cornea, iris and an interior rendering backing; the backing is not retinal tissue.
 * @evidence contracts/modeling.md#shared-boundaries The generated limbus and complete exterior are reused by drawing and both collider states.
 * @evidence contracts/modeling.md#spatial-conventions Frame and meshes remain head-frame metres; gaze uses the source owner's quaternion and metre translation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical dimensions remain authored inputs rather than a fitted clinical eye.
 * @evidenceExclude contracts/anatomy.md#permitted-range The profile admits geometric containment; contact owns existing tissue budgets.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Consumes the document's seven dimensions without adding controls.
 */
export function buildHumanFaceOpticalAssembly(
  basis: IAutoMovieHumanFaceBasis,
  state: ReturnType<typeof humanFaceBasisWeights>,
  eyes: IAutoMovieHumanFaceEyes,
  progress?: (owner: string) => void,
): IHumanFaceOpticalAssembly[] {
  if (basis.articulation === undefined)
    throw new Error("Independent optics need their source articulation owner.");
  const shapeIds = new Set(
    basis.channels.filter((c) => c.kind === "shape").map((c) => c.id),
  );
  const shapedState = {
    weights: new Map([...state.weights].filter(([id]) => shapeIds.has(id))),
    activations: state.activations.filter((one) => one.shapeOnly),
  };
  const rest = evaluateHumanFaceRest(basis, shapedState);
  const motions = resolveHumanFaceArticulation(
    basis.articulation,
    state.weights,
    rest.landmarks,
  ).motions;
  return (["left", "right"] as const).map((side) => {
    const owner = side === "left" ? "leftEye" : "rightEye";
    const supports = (basis.opticalSupport ?? []).filter(
      (one) => one.owner === owner,
    );
    if (supports.length !== 1)
      throw new Error(
        "Independent optics need one qualified source support for " +
          owner +
          ".",
      );
    const support = supports[0];
    const profile = resolveHumanFaceOpticalProfile(eyes[side]);
    const frame = resolveHumanFaceOpticalFrame(
      basis,
      support,
      rest,
      shapedState,
      profile.apex,
    );
    const geometry = buildHumanFaceOpticalGeometry(profile, frame);
    progress?.("optics:" + side + ":geometry");
    const restDeviation = geometry.readDeviation(
      frame,
      progress === undefined ? undefined : (branch, cell) =>
        progress("optics:" + side + ":rest:" + branch + ":cell:" + cell),
    );
    progress?.("optics:" + side + ":rest-certified");
    const restHull = structuredClone(geometry.hull.mesh);
    const motion = motions.get(owner)!;
    const pose = (mesh: IAutoMovieMesh): void => {
      for (let at = 0; at < mesh.positions.length; at += 3) {
        const point = Vector3.create(...mesh.positions.slice(at, at + 3));
        const placed = Vector3.add(
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
      for (let at = 0; at < (mesh.normals?.length ?? 0); at += 3) {
        const normal = Quaternion.rotateVector(
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
    const posedFrame = {
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
    const posedDeviation = geometry.readDeviation(
      posedFrame,
      progress === undefined ? undefined : (branch, cell) =>
        progress("optics:" + side + ":performed:" + branch + ":cell:" + cell),
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
  });
}
