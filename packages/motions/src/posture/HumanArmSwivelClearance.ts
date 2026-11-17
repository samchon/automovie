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
 * swivel kept is the clear one nearest the preferred, Kallmann's "closest
 * valid to preferred" rule (Kallmann 2008, "Automatic Swivel Angle
 * Determination") without his stepped search.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the circle, why each clearance is a sinusoid, the cover of the body and the choice, with their sources.
 * @evidence contracts/development/design.md#principled-representation A sphere is a centre and a radius; the arm is its shoulder, its wrist and its two lengths.
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
   * The elbow hint moved to the clear swivel nearest it: on the circle the
   * wrist leaves the elbow, the swivels at which a point of the upper arm (a
   * third, two thirds and the whole way to the elbow) or of the forearm (at
   * the elbow and a third of the way to the wrist) lies within a sphere and
   * the arm's radius are refused, each one exact arc of a sinusoid; the
   * swivel nearest the hint's outside their union is kept. The forearm's
   * part nearer the wrist is the hand's approach to its own place, which may
   * lie on the body, and is left to the fit. The hint is kept when it is
   * clear, when every swivel is refused, or when the wrist leaves no circle.
   *
   * @param shoulder The shoulder, world metres.
   * @param wrist The wrist's place, world metres.
   * @param upper The upper arm's length, metres.
   * @param lower The forearm's length to the wrist, metres.
   * @param hint The elbow's hint, world metres.
   * @param spheres The body to keep out of (`spheres`).
   * @param radius The arm's own radius, metres.
   * @returns The hint, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the circle, the points, the refusal, the choice and the cases that keep the hint.
   * @evidence contracts/development/implementation.md#principled-implementation `|p(ψ) − S|² = |c′ − S|² + R′² + 2R′[(c′ − S)·û cos ψ + (c′ − S)·v̂ sin ψ]` for a point `p = c′ + R′(û cos ψ + v̂ sin ψ)` affine in the elbow (reference brief, sec. B.2, derived from Tolani et al. 2000), so each clearance is one sinusoid kept above the squared reach.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The circle, one sinusoid per point and sphere, their union and its nearest swivel.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Exact roots; a fully refused circle keeps the hint for the fit and the trajectory model to judge, never a clamped guess.
   * @evidence contracts/development/implementation.md#efficient-algorithms Five points per sphere, one arc each, one sort of the union: constant work per sphere, no swivel search.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The engine's arcs, union and nearest swivel (`swivelArcs`).
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function hint(
    shoulder: IAutoMovieVector3,
    wrist: IAutoMovieVector3,
    upper: number,
    lower: number,
    hint: IAutoMovieVector3,
    spheres: readonly ISphere[],
    radius: number,
  ): IAutoMovieVector3 {
    const reach: IAutoMovieVector3 = Vector3.subtract(wrist, shoulder);
    const distance: number = Vector3.length(reach);
    if (!(distance > 1e-9) || distance >= upper + lower || distance <= Math.abs(upper - lower))
      return hint;
    const line: IAutoMovieVector3 = Vector3.scale(reach, 1 / distance);
    const foot: number = (upper * upper - lower * lower + distance * distance) / (2 * distance);
    const circle: number = Math.sqrt(Math.max(0, upper * upper - foot * foot));
    const radial: IAutoMovieVector3 = Vector3.subtract(
      Vector3.subtract(hint, shoulder),
      Vector3.scale(line, Vector3.dot(Vector3.subtract(hint, shoulder), line)),
    );
    if (!(Vector3.length(radial) > 1e-9)) return hint;
    const u: IAutoMovieVector3 = Vector3.normalize(radial);
    const v: IAutoMovieVector3 = Vector3.cross(line, u);
    const centre: IAutoMovieVector3 = Vector3.add(shoulder, Vector3.scale(line, foot));

    // Each point `p = c′ + R′(û cos ψ + v̂ sin ψ)`: on the upper arm a share
    // λ of the way to the elbow, on the forearm a share μ from it.
    const points: [IAutoMovieVector3, number][] = [
      ...[1 / 3, 2 / 3, 1].map((share: number): [IAutoMovieVector3, number] => [
        Vector3.add(Vector3.scale(shoulder, 1 - share), Vector3.scale(centre, share)),
        share * circle,
      ]),
      ...[1 / 3].map((share: number): [IAutoMovieVector3, number] => [
        Vector3.add(Vector3.scale(centre, 1 - share), Vector3.scale(wrist, share)),
        (1 - share) * circle,
      ]),
    ];
    const refused: swivelArcs.IArc[] = [];
    for (const sphere of spheres)
      for (const [at, far] of points) {
        const off: IAutoMovieVector3 = Vector3.subtract(at, sphere.centre);
        const keep: number = sphere.radius + radius;

        // The squared distance less the squared reach, refused where
        // negative: its negation exceeds 0 on the refused arc.
        const arc: swivelArcs.IArc | "all" | null = swivelArcs.above(
          {
            a: keep * keep - Vector3.dot(off, off) - far * far,
            b: -2 * far * Vector3.dot(off, u),
            c: -2 * far * Vector3.dot(off, v),
          },
          0,
        );
        if (arc === "all") return hint;
        if (arc !== null) refused.push(arc);
      }
    const swivel: number | null = swivelArcs.nearest(swivelArcs.union(refused), 0);
    if (swivel === null || swivel === 0) return hint;
    const r: number = (swivel * Math.PI) / 180;
    return Vector3.add(
      centre,
      Vector3.scale(Vector3.add(Vector3.scale(u, Math.cos(r)), Vector3.scale(v, Math.sin(r))), circle),
    );
  }
}
