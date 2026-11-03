import type { AutoMovieHumanRig } from "../../../../packages/human/src/skeleton/AutoMovieHumanRig";
import type { AutoMovieHumanSkeleton } from "../../../../packages/human/src/skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanPose } from "../../../../packages/human/src/structures/pose/IAutoMovieHumanPose";
import type { HumanAnatomy } from "./HumanAnatomy";
import { HumanPoseMirrorMatch as Match } from "./HumanPoseMirrorMatch";
import { HumanPoseMirrorSubject as Subject } from "./HumanPoseMirrorSubject";

/**
 * Mirror equivariance of posing: a person in a pose and the person's mirror
 * image in the mirrored pose must be mirror images, joint by joint and skin
 * vertex by skin vertex.
 *
 * A person's sides may differ, since every bilateral input is given per side,
 * so the mirror image is rebuilt from the person's own inputs with every
 * left-right pair swapped; a person whose pairs are equal is its own mirror.
 * The mirrored pose swaps every side's values and negates the midline fields
 * that the pose type declares toward the person's left, and the eyes'
 * horizontal gaze, which is declared the same way.
 *
 * Frame: forward +X, up +Y, the body's left +Z, millimetres; the mirror is
 * z to -z, so a rotation (x, y, z, w) mirrors to (-x, -y, z, w).
 */
export namespace HumanPoseMirror {
  /** A point or a direction. */
  export type V3 = HumanAnatomy.V3;

  /** A rigged person with its bind skin and the rig's influences on it. */
  export interface ISubject {
    /** Name in findings. */
    name: string;

    /** Metres per calibration millimetre. */
    scale: number;

    /** The body's rig. */
    rig: AutoMovieHumanRig.IRig;

    /** The body's pose evaluator. */
    evaluate: AutoMovieHumanSkeleton.PoseEvaluator;

    /** The bind skin, mm. */
    skin: HumanAnatomy.ISkin;

    /** The rig's four influences on every bind vertex. */
    binding: { joints: string[]; boneIndices: number[]; weights: number[] };
  }

  /** One part of a pose that breaks the mirror. */
  export interface IFinding {
    /** Person. */
    person: string;

    /** Pose name. */
    pose: string;

    /** Chain of the skin vertices, or the bone, that breaks it. */
    region: string;

    /** Skin vertices, a joint centre or a joint rotation. */
    kind: "skin" | "joint position" | "joint rotation";

    /** Vertices past their allowance; 1 for a joint. */
    count: number;

    /** Largest error, mm or degrees. */
    error: number;

    /** Allowance at that largest error, mm or degrees. */
    allowance: number;

    /** Where on the person, mm. */
    at: V3;
  }

  /**
   * Arithmetic tolerance on a mirrored position: a billionth of the
   * coordinates, far above the double rounding of the rig's closed-form
   * evaluation and the four-bone blend, far below any modelled feature.
   */
  export const POSITION: number = 1e-9;

  /** Arithmetic tolerance on a mirrored rotation, degrees. */
  export const ROTATION: number = 1e-6;

  /** Midline pose fields declared toward the person's left: the mirror negates them. */
  export const NEGATED: readonly string[] = [
    "head.jaw.lateralExcursion",
    "neck.atlantoOccipital.lateralFlexion",
    "neck.atlantoAxial.rotation",
    "neck.cervical.lateralFlexion",
    "neck.cervical.rotation",
    "spine.thoracic.lateralFlexion",
    "spine.thoracic.rotation",
    "spine.lumbar.lateralFlexion",
    "spine.lumbar.rotation",
    "pelvis.obliquity",
    "pelvis.rotation",
  ];

  /** Midline pose fields symmetric about the median plane: the mirror keeps them. */
  export const KEPT: readonly string[] = [
    "head.jaw.opening",
    "head.jaw.protrusion",
    "neck.atlantoOccipital.flexion",
    "neck.cervical.flexion",
    "spine.thoracic.flexion",
    "spine.lumbar.flexion",
    "pelvis.tilt",
  ];

  /**
   * A pose's mirror: each side's values on the other side, the leftward
   * midline fields and the eyes' horizontal gaze negated. Limb fields are
   * anatomical, measured on their own side, so they move unchanged. A midline
   * field neither list names is refused, so a new field cannot be mirrored by
   * accident.
   */
  export function mirror(pose: IAutoMovieHumanPose): IAutoMovieHumanPose {
    return walk(pose, "", false, false) as IAutoMovieHumanPose;
  }

  /** Inputs with every left-right pair swapped: the person's mirror image. */
  export function swap<T>(value: T): T {
    return Subject.swap(value);
  }

  /** The bone on the other side. */
  export function side(bone: string): string {
    return Match.side(bone);
  }

  /** A generated person as a subject. */
  export function original(name: string): ISubject {
    return Subject.original(name);
  }

  /** The person's mirror image as a subject; the person itself when its pairs are equal. */
  export function mirrored(name: string): ISubject {
    return Subject.mirrored(name);
  }

  /** A subject's skin and bones under a pose. */
  export function pose(subject: ISubject, value: IAutoMovieHumanPose): Subject.IPosed {
    return Subject.pose(subject, value);
  }

  /**
   * Every finding of one person over the named poses: each pose against its
   * mirror on the mirror image, skin vertex by vertex and joint by joint.
   *
   * A skin vertex corresponds to the mirror image's bind vertex nearest its
   * reflection, and may miss its mirror by that bind distance plus the
   * tolerance. A joint centre may miss by the sum of its own and its
   * ancestors' rest offset mismatches plus the tolerance; a joint rotation by
   * the tolerance, the bind frames being unrotated.
   *
   * @param defect A change to every pose before it is evaluated, on both
   *   subjects: a made rig defect.
   */
  export function audit(
    name: string,
    poses: Record<string, IAutoMovieHumanPose>,
    defect: (pose: IAutoMovieHumanPose) => IAutoMovieHumanPose = (p: IAutoMovieHumanPose): IAutoMovieHumanPose => p,
  ): IFinding[] {
    const a: ISubject = original(name);
    const b: ISubject = mirrored(name);
    const match: Match.IMatch = Match.correspondence(a.skin.P, b.skin.P, Match.normals(a.skin), Match.normals(b.skin));
    const reach: Map<string, number> = Match.allowance(a, b);
    const owner: Int32Array = Match.chains(a.skin);
    const out: IFinding[] = [];

    for (const [label, value] of Object.entries(poses)) {
      // The person in the pose, and the mirror image in the pose's mirror.
      const posedA: Subject.IPosed = pose(a, defect(value));
      const posedB: Subject.IPosed = pose(b, defect(mirror(value)));

      out.push(...skin(name, label, a, match, owner, posedA, posedB), ...joints(name, label, reach, posedA, posedB));
    }

    return out.sort(
      (x: IFinding, y: IFinding): number =>
        x.person.localeCompare(y.person) ||
        x.pose.localeCompare(y.pose) ||
        x.region.localeCompare(y.region) ||
        x.kind.localeCompare(y.kind),
    );
  }

  /** One line per finding. */
  export function format(f: IFinding): string {
    const unit: string = f.kind === "joint rotation" ? "deg" : "mm";
    const count: string = f.kind === "skin" ? `${f.count} vertices, ` : "";

    return `${f.person} | ${f.pose} | ${f.region} | ${f.kind}: ${count}error ${f.error.toFixed(6)} ${unit} over ${f.allowance.toExponential(2)} ${unit}, at (${f.at.map((c: number): string => c.toFixed(1)).join(", ")}) mm`;
  }

  /** Mirrors a value of the pose at a dotted path; `limb` and `eye` mark the branches whose fields are anatomical or gaze. */
  function walk(value: unknown, path: string, limb: boolean, eye: boolean): unknown {
    // A number is mirrored by what the pose type declares of its field.
    if (typeof value === "number") {
      if (limb) return value;

      if (eye) {
        if (path.endsWith(".horizontal")) return -value;

        if (path.endsWith(".vertical")) return value;
      } else {
        if (NEGATED.includes(path)) return -value;

        if (KEPT.includes(path)) return value;
      }

      throw new Error(`pose field ${path} has no declared mirror`);
    }

    if (value === null || typeof value !== "object") return value;

    // A pair of sides swaps its keys; the path names the side generically so one rule covers both.
    const out: Record<string, unknown> = {};
    const record: Record<string, unknown> = value as Record<string, unknown>;
    const paired: boolean = path === "arms" || path === "legs" || path === "head.eyes";

    for (const [k, v] of Object.entries(record)) {
      const key: string = paired ? (k === "left" ? "right" : k === "right" ? "left" : k) : k;
      const next: string = path === "" ? k : `${path}.${paired ? "side" : k}`;

      out[key] = walk(v, next, limb || path === "arms" || path === "legs", eye || path === "head.eyes");
    }

    return out;
  }

  /** Skin vertices past their allowance in one pose, grouped by chain. */
  function skin(
    person: string,
    label: string,
    a: ISubject,
    match: Match.IMatch,
    owner: Int32Array,
    posedA: Subject.IPosed,
    posedB: Subject.IPosed,
  ): IFinding[] {
    const byChain: Map<string, { count: number; error: number; allowance: number; at: V3 }> = new Map();

    for (let v: number = 0; v < a.skin.P.length / 3; v++) {
      const u: number = match.index[v]!;

      if (u < 0) continue;

      // The posed vertex against its counterpart's reflection, with the bind's own miss allowed.
      const x: number = posedA.P[3 * v]!;
      const y: number = posedA.P[3 * v + 1]!;
      const z: number = posedA.P[3 * v + 2]!;
      const error: number = Math.hypot(x - posedB.P[3 * u]!, y - posedB.P[3 * u + 1]!, -z - posedB.P[3 * u + 2]!);
      const allowance: number = match.distance[v]! + POSITION * (1 + Math.max(Math.abs(x), Math.abs(y), Math.abs(z)));

      if (error <= allowance) continue;

      const chain: string = owner[v]! >= 0 ? a.skin.chains[owner[v]!]! : "unused positions";
      const found: { count: number; error: number; allowance: number; at: V3 } = byChain.get(chain) ?? {
        count: 0,
        error: -1,
        allowance: 0,
        at: [x, y, z],
      };

      found.count++;

      if (error > found.error) {
        found.error = error;
        found.allowance = allowance;
        found.at = [x, y, z];
      }

      byChain.set(chain, found);
    }

    return [...byChain].map(
      ([chain, found]: [string, { count: number; error: number; allowance: number; at: V3 }]): IFinding => ({
        person,
        pose: label,
        region: chain,
        kind: "skin",
        count: found.count,
        error: found.error,
        allowance: found.allowance,
        at: found.at,
      }),
    );
  }

  /** Joint centres and rotations past their allowance in one pose. */
  function joints(
    person: string,
    label: string,
    reach: Map<string, number>,
    posedA: Subject.IPosed,
    posedB: Subject.IPosed,
  ): IFinding[] {
    const out: IFinding[] = [];

    for (const [bone, p] of posedA.bones) {
      const q: { position: V3; rotation: number[] } | undefined = posedB.bones.get(side(bone));

      // A bone with no counterpart cannot mirror.
      if (q === undefined) {
        out.push({ person, pose: label, region: bone, kind: "joint position", count: 1, error: NaN, allowance: 0, at: p.position });
        continue;
      }

      // The centre against its counterpart's reflection, with the bind's own rest-offset miss allowed.
      const miss: number = Math.hypot(p.position[0] - q.position[0], p.position[1] - q.position[1], p.position[2] + q.position[2]);
      const allowed: number = (reach.get(bone) ?? 0) + POSITION * (1 + Math.max(...p.position.map(Math.abs)));

      if (!(miss <= allowed))
        out.push({ person, pose: label, region: bone, kind: "joint position", count: 1, error: miss, allowance: allowed, at: p.position });

      // The rotation against its counterpart's reflection (-x, -y, z, w), up to the quaternion's sign.
      const m: number[] = [-p.rotation[0]!, -p.rotation[1]!, p.rotation[2]!, p.rotation[3]!];
      const c: number = Math.abs(m[0]! * q.rotation[0]! + m[1]! * q.rotation[1]! + m[2]! * q.rotation[2]! + m[3]! * q.rotation[3]!);
      const angle: number = (2 * Math.acos(Math.min(1, c)) * 180) / Math.PI;

      if (!(angle <= ROTATION))
        out.push({ person, pose: label, region: bone, kind: "joint rotation", count: 1, error: angle, allowance: ROTATION, at: p.position });
    }

    return out;
  }
}
