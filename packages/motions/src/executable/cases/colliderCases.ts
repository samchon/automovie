import {
  Quaternion,
  Vector3,
  physicalHullFaces,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import type {
  IAutoMoviePhysicalProfile,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  type AutoMovieHumanPolygon,
  buildHumanPolygon,
} from "@automovie/render";
import * as THREE from "three";

import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";

/**
 * Capture cases of the polygon man's colliders against its drawn surface
 * (`colliders-<body>`), one for each body of `MotionBodies.SWEEP`: the body
 * stands at its T-pose rest, where the contact profile's shapes are placed by
 * each segment's neutral transform and the drawing by each joint's rest
 * position, and the two are measured against each other in both directions.
 *
 * A segment whose shapes are all hulls is built from the rings the drawing is
 * lofted through, so its verdicts are those of one surface: every drawn
 * vertex lies on one of the segment's hulls within 10 micrometres (the single
 * precision of the mesh buffer over a two metre body), every drawn edge
 * midpoint and triangle centroid within 3 mm of one, and every sampled point
 * of every hull face within 3 mm of the segment's drawn triangles. The 3 mm
 * is the fidelity the contact laws rely on: a hull of two rings of different
 * proportions may join one ring's corner to the next ring's neighbouring
 * corner where the drawing folds the quad of matching corners.
 *
 * A finger phalanx keeps a capsule, which a curl needs for its closed form
 * contact, so it is an approximation of the drawn eight-sided prism and is
 * held to the same 3 mm in both directions: no drawn vertex more than 3 mm
 * outside the capsule, and no sampled point of the capsule more than 3 mm
 * outside every drawn mesh. A drawn vertex inside the capsule is not counted
 * by itself, as a prism's end cap is buried in the joint it shares with the
 * next phalanx; a capsule fatter than its finger fails the second direction.
 *
 * Only the centre and the left side are measured, the body being built
 * mirrored.
 *
 * @param names The bodies measured.
 * @param only The harness's name filter; every case when absent.
 * @returns The cases, each built as it is read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the pose, both directions, every bound with its reason and the side measured.
 * @evidence contracts/development/implementation.md#principled-implementation Measures the profile's own shapes by the engine's shape distance against the triangles the viewer's own builder draws.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the drawn meshes and one over the collider samples, four maxima.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the built drawing and the built profile, not the ring owner both come from; a shape kind it cannot sample throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms Every sample is tested against the triangles of one side of one body, a few thousand.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Disposes each drawing once its triangles are copied.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 */
export function* colliderCases(
  names: readonly string[] = MotionBodies.SWEEP,
  only?: (name: string) => boolean,
): Iterable<IMotionCaptureCase> {
  for (const name of names) {
    if (only !== undefined && !only(`colliders-${name}`)) continue;
    const body: AutoMovieHumanCanonicalBody.IBody =
      MotionBodies.population(name).body;
    const drawing: AutoMovieHumanPolygon.IDrawing = buildHumanPolygon(
      AutoMovieHumanCanonicalBody.display(body),
    );
    const meshes: IMesh[] = [];
    for (const joint of body.joints) {
      const part: THREE.Mesh | undefined = drawing.parts.get(joint.bone);
      if (part === undefined || joint.bone.startsWith("right")) continue;
      const positions: THREE.BufferAttribute = part.geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      const index: THREE.BufferAttribute = part.geometry.getIndex()!;
      // Human's frame and the canonical frame differ by (x, y, z) -> (z, y, x).
      const corner = (i: number): THREE.Vector3 =>
        new THREE.Vector3(
          positions.getZ(i) + joint.position[0],
          positions.getY(i) + joint.position[1],
          positions.getX(i) + joint.position[2],
        );
      const triangles: THREE.Triangle[] = [];
      for (let i: number = 0; i < index.count; i += 3)
        triangles.push(
          new THREE.Triangle(
            corner(index.getX(i)),
            corner(index.getX(i + 1)),
            corner(index.getX(i + 2)),
          ),
        );
      meshes.push({ joint: joint.bone, carrier: joint.carrier, triangles });
    }
    drawing.dispose();

    const worst: Record<"vertex" | "band" | "face" | "digit", IWorst> = {
      vertex: { value: 0, where: "none" },
      band: { value: 0, where: "none" },
      face: { value: 0, where: "none" },
      digit: { value: 0, where: "none" },
    };
    const note = (slot: IWorst, value: number, where: string): void => {
      if (value > slot.value) {
        slot.value = value;
        slot.where = where;
      }
    };
    const left: IAutoMoviePhysicalProfile.ISegment[] =
      body.profile.segments.filter(
        (segment: IAutoMoviePhysicalProfile.ISegment): boolean =>
          !segment.bone.startsWith("right"),
      );
    const hulled = (segment: IAutoMoviePhysicalProfile.ISegment): boolean =>
      segment.shapes.every(
        (shape: IAutoMoviePhysicalProfile.IShape): boolean =>
          shape.kind === "hull",
      );

    // The drawing against its colliders.
    for (const mesh of meshes) {
      const segment: IAutoMoviePhysicalProfile.ISegment | undefined = left.find(
        (s: IAutoMoviePhysicalProfile.ISegment): boolean =>
          s.bone === mesh.carrier,
      );
      if (segment === undefined)
        throw new Error(`The drawn ${mesh.joint} has no collider segment`);
      const off = (p: THREE.Vector3): number =>
        Math.min(
          ...segment.shapes.map(
            (shape: IAutoMoviePhysicalProfile.IShape): number =>
              Math.abs(
                physicalShapeSegmentDistance(segment.neutral, shape, p, p),
              ),
          ),
        );
      // How far a drawn point stands outside every shape of the segment; a
      // prism's end cap lies inside the rounded end of its capsule, buried in
      // the neighbouring phalanx, and is no surface.
      const proud = (p: THREE.Vector3): number =>
        Math.max(
          0,
          Math.min(
            ...segment.shapes.map(
              (shape: IAutoMoviePhysicalProfile.IShape): number =>
                physicalShapeSegmentDistance(segment.neutral, shape, p, p),
            ),
          ),
        );
      for (const triangle of mesh.triangles) {
        const corners: THREE.Vector3[] = [triangle.a, triangle.b, triangle.c];
        for (const p of corners)
          if (hulled(segment)) note(worst.vertex, off(p), mesh.joint);
          else note(worst.digit, proud(p), mesh.joint);
        if (!hulled(segment)) continue;
        corners.forEach((p: THREE.Vector3, i: number): void => {
          note(
            worst.band,
            off(p.clone().lerp(corners[(i + 1) % 3]!, 0.5)),
            mesh.joint,
          );
        });
        note(
          worst.band,
          off(triangle.getMidpoint(new THREE.Vector3())),
          mesh.joint,
        );
      }
    }

    // The colliders against the drawing.
    const every: THREE.Triangle[] = meshes.flatMap(
      (mesh: IMesh): THREE.Triangle[] => mesh.triangles,
    );
    for (const segment of left) {
      const own: THREE.Triangle[] = meshes
        .filter((mesh: IMesh): boolean => mesh.carrier === segment.bone)
        .flatMap((mesh: IMesh): THREE.Triangle[] => mesh.triangles);
      for (const shape of segment.shapes)
        for (const p of samples(segment.neutral, shape))
          if (shape.kind === "hull")
            note(worst.face, nearest(p, own), shape.id);
          else if (!inside(p, every))
            note(worst.digit, nearest(p, every), segment.bone);
    }

    const verdict = (
      label: string,
      slot: IWorst,
      bound: number,
    ): IMotionCaptureCase.IVerdict => ({
      name: label,
      passed: slot.value <= bound,
      detail: `${(slot.value * 1000).toFixed(3)} mm at ${slot.where}`,
    });
    yield {
      name: `colliders-${name}`,
      times: [{ seconds: 0, label: "rest" }],
      performers: [
        {
          id: "a",
          body,
          pose: (): IAutoMoviePose => ({
            skeleton: body.skeleton.id,
            root: null,
            joints: [],
          }),
        },
      ],
      verdicts: [
        verdict(
          "every drawn vertex of a hull segment lies on its collider within 0.010 mm",
          worst.vertex,
          PRECISION,
        ),
        verdict(
          "every drawn band lies within 3 mm of its hull collider",
          worst.band,
          FIDELITY,
        ),
        verdict(
          "every hull collider face lies within 3 mm of its drawn mesh",
          worst.face,
          FIDELITY,
        ),
        verdict(
          "every phalanx capsule and its drawn finger lie within 3 mm of each other",
          worst.digit,
          FIDELITY,
        ),
      ],
    };
  }
}

/** One drawn module's triangles at the T-pose rest, canonical metres. */
interface IMesh {
  /** The drawn Human joint. */
  joint: string;

  /** The rig bone that carries it. */
  carrier: string;

  /** Its triangles. */
  triangles: THREE.Triangle[];
}

/** A largest measured gap and where it was found. */
interface IWorst {
  /** Metres. */
  value: number;

  /** The joint, bone or shape. */
  where: string;
}

/** The single precision of a mesh buffer over a two metre body, metres. */
const PRECISION: number = 1e-5;

/** How far a collider and the drawn surface may lie apart between shared vertices, metres. */
const FIDELITY: number = 3e-3;

/** A fixed direction no drawn edge or face is parallel to, for the parity test. */
const RAY: THREE.Vector3 = new THREE.Vector3(
  0.5371,
  0.7193,
  0.4402,
).normalize();

/** Distance from a point to the nearest of some triangles, metres. */
function nearest(p: THREE.Vector3, triangles: THREE.Triangle[]): number {
  const at: THREE.Vector3 = new THREE.Vector3();
  let best: number = Infinity;
  for (const triangle of triangles)
    best = Math.min(best, triangle.closestPointToPoint(p, at).distanceTo(p));
  return best;
}

/** Whether a point lies inside the closed drawn modules, by ray parity. */
function inside(p: THREE.Vector3, triangles: THREE.Triangle[]): boolean {
  const ray: THREE.Ray = new THREE.Ray(p, RAY);
  const at: THREE.Vector3 = new THREE.Vector3();
  let hits: number = 0;
  for (const triangle of triangles)
    if (
      ray.intersectTriangle(triangle.a, triangle.b, triangle.c, false, at) !==
      null
    )
      hits++;
  return hits % 2 === 1;
}

/**
 * Points on a shape's surface, canonical metres: a hull's face centres,
 * corners and a four step fan over each face; a capsule's caps by latitude
 * and longitude and its side at eighths of its length.
 */
function samples(
  pose: IAutoMoviePhysicalProfile.ITransform,
  shape: IAutoMoviePhysicalProfile.IShape,
): THREE.Vector3[] {
  const centre: IAutoMovieVector3 = Vector3.add(
    pose.position,
    Quaternion.rotateVector(pose.rotation, shape.transform.position),
  );
  const rotation = Quaternion.multiply(pose.rotation, shape.transform.rotation);
  const out: THREE.Vector3[] = [];
  const push = (local: IAutoMovieVector3): void => {
    const p: IAutoMovieVector3 = Vector3.add(
      centre,
      Quaternion.rotateVector(rotation, local),
    );
    out.push(new THREE.Vector3(p.x, p.y, p.z));
  };
  if (shape.kind === "hull") {
    for (const face of physicalHullFaces(shape.points).faces) {
      let middle: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
      for (const p of face.loop)
        middle = Vector3.add(middle, Vector3.scale(p, 1 / face.loop.length));
      push(middle);
      face.loop.forEach((p: IAutoMovieVector3, i: number): void => {
        const q: IAutoMovieVector3 = face.loop[(i + 1) % face.loop.length]!;
        for (let a: number = 1; a <= 4; a++)
          for (let b: number = 0; b <= a; b++) {
            const wp: number = (a - b) / 4;
            const wq: number = b / 4;
            push(
              Vector3.add(
                Vector3.scale(middle, 1 - wp - wq),
                Vector3.add(Vector3.scale(p, wp), Vector3.scale(q, wq)),
              ),
            );
          }
      });
    }
    return out;
  }
  if (shape.kind !== "capsule")
    throw new Error(`A ${shape.kind} collider is not sampled here`);
  const { radius, halfLength } = shape;
  for (let i: number = 0; i <= 24; i++) {
    const latitude: number = -Math.PI / 2 + (Math.PI * i) / 24;
    for (let k: number = 0; k < 16; k++) {
      const longitude: number = (2 * Math.PI * k) / 16;
      push({
        x: Math.cos(latitude) * Math.cos(longitude) * radius,
        y: Math.sign(latitude) * halfLength + Math.sin(latitude) * radius,
        z: Math.cos(latitude) * Math.sin(longitude) * radius,
      });
    }
  }
  for (let i: number = 1; i < 8; i++)
    for (let k: number = 0; k < 16; k++) {
      const longitude: number = (2 * Math.PI * k) / 16;
      push({
        x: Math.cos(longitude) * radius,
        y: -halfLength + (2 * halfLength * i) / 8,
        z: Math.sin(longitude) * radius,
      });
    }
  return out;
}
