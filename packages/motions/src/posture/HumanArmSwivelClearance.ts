import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  swivelArcs,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanColliders } from "./HumanColliders";

/**
 * An elbow kept clear of the body by its swivel, in closed form. The elbow
 * of a two-bone arm whose wrist is placed lies on a circle about the
 * shoulder-to-wrist line (Tolani, Goswami and Badler 2000, sec. 3.2.2,
 * `e(φ) = c + R(cos φ û + sin φ v̂)`), and every point of the upper arm and
 * the forearm is affine in the elbow, so its squared distance to a sphere is
 * one sinusoid of the swivel, refused on the arc between its roots
 * (`swivelArcs`). The body is read as spheres covering its colliders; the
 * refused arcs' union lets a caller keep the clear swivel nearest the one it
 * prefers, Kallmann's closest-valid-to-preferred rule (Kallmann 2008,
 * "Automatic Swivel Angle Determination") without his stepped search.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the circle, why each clearance is a sinusoid, the cover of the body and the use of the union, with their sources.
 * @evidence contracts/development/design.md#principled-representation A sphere is a centre and a radius; the circle is the caller's swivel frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record and two functions, read by the arm course (`AutoMovieMotionHumanArmCourse`).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The spheres cover the body's own colliders and the arcs are exact roots; no sampling of the swivel.
 */
export namespace HumanArmSwivelClearance {
  /**
   * A sphere the arm keeps out of.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and frame.
   * @evidence contracts/development/design.md#principled-representation A centre and a radius.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None optional.
   */
  export interface ISphere {
    /** The centre, world metres. */
    centre: IAutoMovieVector3;

    /** The radius, metres. */
    radius: number;
  }

  /**
   * Spheres covering a posed body's colliders, those of the bones a filter
   * spares: a sphere as it is; a capsule as spheres along its axis at most its
   * radius apart, each grown to reach the cylinder between two of them
   * (`sqrt(r² + (d/2)²)`); a box or a hull as its bounding sphere.
   *
   * @param body The body.
   * @param bones Its posed bones, world frame.
   * @param spared Whether a bone's colliders are left out (the moving arms).
   * @returns The spheres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each shape's cover and the filter.
   * @evidence contracts/development/implementation.md#principled-implementation Every cover contains its shape, so a point clear of the spheres is clear of the colliders; the cover is conservative, never short.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One placement, one cover per shape kind.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The colliders are the body's own placed ones (`HumanColliders.placed`); no shape is invented.
   * @evidence contracts/development/implementation.md#efficient-algorithms One placement and constant work per shape; a capsule adds one sphere per radius of its length.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the one collider placement owner.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh list and retains nothing.
   */
  export function spheres(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    spared: (bone: AutoMovieHumanoidBone) => boolean,
  ): ISphere[] {
    const out: ISphere[] = [];
    for (const segment of HumanColliders.placed(body, bones)) {
      if (spared(segment.bone)) continue;
      for (const shape of segment.shapes) {
        const turn: IAutoMovieQuaternion = Quaternion.multiply(
          segment.pose.rotation,
          shape.transform.rotation,
        );
        const at: IAutoMovieVector3 = Vector3.add(
          segment.pose.position,
          Quaternion.rotateVector(segment.pose.rotation, shape.transform.position),
        );
        if (shape.kind === "sphere") out.push({ centre: at, radius: shape.radius });
        else if (shape.kind === "capsule") {
          const axis: IAutoMovieVector3 = Quaternion.rotateVector(turn, { x: 0, y: 1, z: 0 });
          const pieces: number = Math.max(1, Math.ceil((2 * shape.halfLength) / shape.radius));
          const gap: number = (2 * shape.halfLength) / pieces;
          const radius: number = Math.hypot(shape.radius, gap / 2);
          for (let i: number = 0; i <= pieces; ++i)
            out.push({
              centre: Vector3.add(at, Vector3.scale(axis, -shape.halfLength + i * gap)),
              radius,
            });
        } else if (shape.kind === "box")
          out.push({ centre: at, radius: Vector3.length(shape.halfExtents) });
        else {
          const mean: IAutoMovieVector3 = Vector3.scale(
            shape.points.reduce(
              (sum: IAutoMovieVector3, p: IAutoMovieVector3): IAutoMovieVector3 => Vector3.add(sum, p),
              { x: 0, y: 0, z: 0 },
            ),
            1 / shape.points.length,
          );
          out.push({
            centre: Vector3.add(at, Quaternion.rotateVector(turn, mean)),
            radius: Math.max(...shape.points.map(
              (p: IAutoMovieVector3): number => Vector3.length(Vector3.subtract(p, mean)))),
          });
        }
      }
    }
    return out;
  }

  /**
   * The swivels at which an arm meets the body, on the circle its elbow
   * keeps about the shoulder-to-wrist line, in a frame the caller gives:
   * the elbow at swivel `ψ` degrees is `centre + radius(u cos ψ + v sin ψ)`
   * (a solver's own swivel frame, read off two of its poses). The points
   * read are a third, two thirds and the whole way along the upper arm and a
   * third of the way down the forearm (the part nearer the wrist is the
   * hand's approach to its own place, left to the trajectory's reading).
   *
   * @param shoulder The shoulder, world metres.
   * @param wrist The wrist, world metres.
   * @param centre The circle's centre, world metres.
   * @param circle The circle's radius, metres.
   * @param u The swivel's zero direction from the centre, unit, world.
   * @param v The swivel's quarter-turn direction from the centre, unit, world.
   * @param spheres The body to keep out of (`spheres`).
   * @param radius The arm's own radius, metres.
   * @returns The refused swivels' union (`swivelArcs.union`), degrees in that frame; every swivel when one point lies in a sphere at every swivel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, the points read and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Each point is affine in the elbow, so its squared distance to a sphere is one sinusoid of the swivel (reference brief, sec. B.2, from Tolani et al. 2000), refused on one exact arc (`swivelArcs.above`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One sinusoid per point and sphere, one union.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Exact roots, no sampling of the swivel; the frame is the caller's, so the arcs are in the swivel the caller poses by.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four points per sphere, one arc each, one sort.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The engine's arcs and union (`swivelArcs`).
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh union and retains nothing.
   */
  export function refused(
    shoulder: IAutoMovieVector3,
    wrist: IAutoMovieVector3,
    centre: IAutoMovieVector3,
    circle: number,
    u: IAutoMovieVector3,
    v: IAutoMovieVector3,
    spheres: readonly ISphere[],
    radius: number,
  ): swivelArcs.IArc[] | "all" {
    const points: [IAutoMovieVector3, number][] = [
      ...[1 / 3, 2 / 3, 1].map((share: number): [IAutoMovieVector3, number] => [
        Vector3.add(Vector3.scale(shoulder, 1 - share), Vector3.scale(centre, share)),
        share * circle,
      ]),
      [Vector3.add(Vector3.scale(centre, 2 / 3), Vector3.scale(wrist, 1 / 3)), (2 / 3) * circle],
    ];
    const arcs: swivelArcs.IArc[] = [];
    for (const sphere of spheres)
      for (const [at, far] of points) {
        const off: IAutoMovieVector3 = Vector3.subtract(at, sphere.centre);
        const keep: number = sphere.radius + radius;
        const arc: swivelArcs.IArc | "all" | null = swivelArcs.above(
          {
            a: keep * keep - Vector3.dot(off, off) - far * far,
            b: -2 * far * Vector3.dot(off, u),
            c: -2 * far * Vector3.dot(off, v),
          },
          0,
        );
        if (arc === "all") return "all";
        if (arc !== null) arcs.push(arc);
      }
    return swivelArcs.union(arcs);
  }
}
