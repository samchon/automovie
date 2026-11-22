import { Quaternion, Vector3, computeModelRestExtent } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieClip,
  IAutoMovieComputeModelRestExtent,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { createDoor } from "../../architecture/createDoor";
import type { AutoMovieArchetype } from "../../core/AutoMovieArchetype";
import { AutoMovieArchetypeFrame } from "../../core/AutoMovieArchetypeFrame";
import type { createBuilding } from "./createBuilding";

/**
 * Divide the standard door into a fixed frame and a portable hinge-root leaf.
 *
 * The wall cut uses the fixed frame's measured extent. The moving leaf's
 * geometry and handle points share the same hinge-relative coordinates; a
 * normal staged node rotation carries both. Shot time comes from the caller.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines what stays static, the source of aperture dimensions, the hinge frame and the shot clock.
 * @evidence contracts/development/implementation.md#principled-implementation Recursively carried door parts are selected by authored affordance relationships; subtracting the hinge pivot gives the rigid leaf pose expected by portal geometry and staged object clips.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The ordinary door producer owns sizes and range. This adapter owns only division and re-expression around the root of the actual moving node.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A chord greater than 180 degrees cannot retain its authored direction through ordinary shortest-arc quaternion samples, so such a timed swing is refused. The leaf model is kinematic and makes no aggregate mass claim.
 * @evidence contracts/development/implementation.md#efficient-algorithms Operates on one door's bounded part and contact population, and constructs at most two keys.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A reusable plan makes one distinct interactive node per occurrence; this adapter never shares a live model identifier across placements.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The output holds two finite model records and the optional caller-owned rotation clip. The part filter and source door are released after preparation.
 */
export function buildingDoor(
  id: string,
  opening: Extract<createBuilding.Opening, { kind: "door" }>,
  seed: string | undefined,
): buildingDoor.IDoor {
  const door: AutoMovieArchetype<createDoor.Affordance, createDoor.Dimension> =
    createDoor({ ...opening.door, kind: "hinged", id }, seed);
  const hinge: IAutoMovieAffordance = door.affordance("hinge");
  const pivot: IAutoMovieVector3 = hinge.frame.translation;
  const axis: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
    hinge.frame,
    "y",
  );
  const moving: Set<string> = new Set(hinge.parts);
  const parents: Map<string, string | undefined> = new Map(
    door.affordances.map(
      (affordance: IAutoMovieAffordance): [string, string | undefined] => [
        affordance.id,
        affordance.rides,
      ],
    ),
  );
  const mobileAffordances: IAutoMovieAffordance[] = door.affordances.filter(
    (affordance: IAutoMovieAffordance): boolean => {
      // The door producer already supplies an acyclic carrier chain.
      let carrier: string | undefined = affordance.rides;
      while (carrier !== undefined && carrier !== hinge.id)
        carrier = parents.get(carrier);
      return carrier === hinge.id;
    },
  );
  for (const affordance of mobileAffordances)
    for (const part of affordance.parts ?? []) moving.add(part);
  const fixed: IAutoMovieModel = {
    id: `${id}/frame`,
    name: "door frame",
    origin: "generated",
    parts: door.parts.filter(
      (part: IAutoMovieModelPart): boolean => !moving.has(part.id),
    ),
    skeleton: null,
    body: null,
    materials: door.materials,
    asset: null,
  };
  const leaf: IAutoMovieModel = {
    id,
    name: "door leaf",
    origin: "generated",
    parts: door.parts
      .filter((part: IAutoMovieModelPart): boolean => moving.has(part.id))
      .map(
        (part: IAutoMovieModelPart): IAutoMovieModelPart => ({
          ...part,
          transform: relativeToPivot(
            part.transform ??
              AutoMovieArchetypeFrame.upright(Vector3.create(0, 0, 0)),
            pivot,
          ),
        }),
      ),
    skeleton: null,
    body: null,
    affordances: mobileAffordances.flatMap(
      (affordance: IAutoMovieAffordance): IAutoMovieAffordance[] => {
        if (affordance.kind !== "handle" && affordance.kind !== "surface")
          return [];
        const { rides, ...rest } = affordance;
        return [{ ...rest, frame: relativeToPivot(rest.frame, pivot) }];
      },
    ),
    materials: door.materials,
    asset: null,
  };
  const bounds: IAutoMovieComputeModelRestExtent.IResult =
    computeModelRestExtent(fixed);
  if (bounds === null) throw new Error(`door "${id}" has no fixed frame`);
  const aperture: IAutoMovieAffordance = door.affordance("aperture");

  return {
    fixed,
    leaf,
    pivot,
    width: bounds.max.x - bounds.min.x,
    height: bounds.max.y,
    clearWidth: aperture.width!,
    clearHeight: aperture.height!,
    clearCenter: aperture.frame.translation.x,
    clip: (rotation: IAutoMovieQuaternion): IAutoMovieClip | null => {
      const swing: Extract<createBuilding.Opening, { kind: "door" }>["swing"] =
        opening.swing;
      if (swing === undefined) return null;
      const { from, to, degrees } = swing;
      if (
        !Number.isFinite(from) ||
        !Number.isFinite(to) ||
        from < 0 ||
        to <= from ||
        !Number.isFinite(degrees) ||
        degrees <= 0 ||
        degrees >= 180 ||
        degrees > hinge.travel!
      )
        throw new Error(
          `door "${id}" needs increasing nonnegative shot seconds and a swing within hinge travel below 180 degrees`,
        );
      const last: IAutoMovieQuaternion = Quaternion.multiply(
        rotation,
        Quaternion.fromAxisAngle(axis, degrees),
      );
      return {
        id: `${id}/swing`,
        name: "door swing",
        duration: to,
        loop: false,
        tracks: [
          {
            channel: { kind: "node", node: id, path: "rotation" },
            times: [from, to],
            values: [
              rotation.x,
              rotation.y,
              rotation.z,
              rotation.w,
              last.x,
              last.y,
              last.z,
              last.w,
            ],
            interpolation: "linear",
          },
        ],
      };
    },
  };
}

/**
 * Measured aperture and linked stage models of an existing door instance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the measured aperture, hinge pivot and shot-time clip. The fixed frame stays in sill coordinates and the moving leaf uses hinge coordinates.
 * @evidence contracts/development/design.md#principled-representation Width, height and offset are in metres of the door opening. A nullable clip means the door remains at its closed pose.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Wall and visible door share actual measured aperture and hardware geometry, with the existing authored clip for motion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The moving prop carries the original hardware and hand contacts. The wall and fixed doorway do not share parts with that moving prop.
 */
export namespace buildingDoor {
  /**
   * One source door expressed as an aperture plus fixed and moving geometry.
   */
  export interface IDoor {
    /** Fixed frame in the aperture's original sill-centered coordinates. */
    readonly fixed: IAutoMovieModel;

    /** Articulated leaf drawn as one model under the stage node at the hinge. */
    readonly leaf: IAutoMovieModel;

    /** Hinge pivot relative to the aperture's center, metres. */
    readonly pivot: IAutoMovieVector3;

    /** Wall cut width and height measured from the fixed frame, metres. */
    readonly width: number;
    readonly height: number;

    /** Clear passage width and crosswise center after the leaf swings, metres. */
    readonly clearWidth: number;

    /** Clear aperture height below the frame's head, metres. */
    readonly clearHeight: number;
    readonly clearCenter: number;

    /** Make the optional authored swing using the closed world orientation and shot seconds. */
    readonly clip: (rotation: IAutoMovieQuaternion) => IAutoMovieClip | null;
  }
}

/** Offset a model-local transform to the independent hinge-root model frame. */
function relativeToPivot(
  frame: IAutoMovieTransform,
  pivot: IAutoMovieVector3,
): IAutoMovieTransform {
  return { ...frame, translation: Vector3.subtract(frame.translation, pivot) };
}
