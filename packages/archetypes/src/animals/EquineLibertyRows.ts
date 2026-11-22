import {
  Quaternion,
  Vector3,
  minimumJerk,
  rotationBetween,
} from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type Archetype, ArchetypeFrame } from "../core";
import { EquineBodyPose } from "./EquineBodyPose";
import type { EquineLibertyCue } from "./EquineLibertyCue";
import type { EquineStanceCue } from "./EquineStanceCue";
import { EquineStanceRows } from "./EquineStanceRows";
import { EquineStanceSupport } from "./EquineStanceSupport";
import { QuadrupedBody } from "./QuadrupedBody";

/** A limb end of the body. */
type End = "Fore" | "Hind";

/** The humerus's slope below horizontal in a kneel or bow, as a share of its length dropped: authored. */
const HUMERUS_DROP: number = 0.6;

/** A stretched foreleg's reach, as a share of its four bars' summed length: authored. */
const STRETCH: number = 0.9;

/** The relative carpal fold of a knelt foreleg, degrees: the forearm upright over the cannon lying on the floor. */
const KNEEL_FOLD: number = 90;

/** The kinds of the liberty rows. */
const KINDS: ReadonlySet<string> = new Set<EquineLibertyCue.Row["kind"]>([
  "bow",
  "kneel",
  "sit",
]);

/** Closed-form passes settling a sitting hock's height against its tibia's slope: authored. */
const SETTLE: number = 6;

/** The zero vector. */
const ZERO: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/** The trunk's motion at a share of a pose. */
type Trunk = (share: number) => ArchetypeFrame.IMotion;

/** A fore limb. */
type Fore = Extract<QuadrupedBody.Limb, `${string}Fore`>;

/**
 * The liberty cue poses as stance rows: the bow, the kneel and the sit.
 *
 * A knelt foreleg rests its carpus on the floor with the forearm upright and the cannon and pastern lying back along the floor; the trunk pitches down about the hips, in closed form, until the shoulder stands one forearm plus `HUMERUS_DROP` of a humerus above the floor, so each humerus reaches its elbow above the carpus. The bow kneels one foreleg and stretches the other forward on its hoof to `STRETCH` of its length. The sit pitches the trunk up about the shoulders, in closed form, until the hindquarters' rear rests on the floor, the forelegs straight on their hooves the tail turned at its dock to lie on the floor, and each hind leg tucked under it: the hock on the floor under the hip, the stifle where the femur and tibia meet ahead of them, the cannon and pastern lying forward along the floor. Every pose returns through its exit; the hind hooves stay planted in the bow and kneel and the fore hooves in the sit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each pose's construction, its closed-form pitch and what is authored.
 * @evidence contracts/development/design.md#principled-representation Stance plans.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `EquineStanceRows.plan` for the liberty rows.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No search: each pitch is closed form; reach and floor are admitted by the stance.
 */
export namespace EquineLibertyRows {
  /**
   * Whether a stance cue is a liberty row.
   *
   * @param cue The cue.
   * @returns Whether `plan` owns it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result.
   * @evidence contracts/development/implementation.md#principled-implementation A set of the rows' kinds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The kinds are built once.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function owns(cue: EquineStanceCue.Cue): cue is EquineLibertyCue.Row {
    return KINDS.has(cue.kind);
  }

  /**
   * Plan one liberty row from a state.
   *
   * @param body The prepared solver.
   * @param start The state it starts from.
   * @param cue The row.
   * @returns Its plan, returning to the start.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and output.
   * @evidence contracts/development/implementation.md#principled-implementation Read the standing pose's actual radii once, then build the kneel, bow or sit as the namespace documents, blending from the start on a minimum-jerk share.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One standing read, one branch per pose.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reach and floor are left to the stance's admission.
   * @evidence contracts/development/implementation.md#efficient-algorithms One solve to read radii; constant work per pose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the stance's support rules.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan holds its targets.
   */
  export function plan<Id extends string, D extends string>(
    body: EquineBodyPose.IPrepared<Id, D>,
    start: EquineStanceRows.IState,
    cue: EquineLibertyCue.Row,
  ): EquineStanceRows.IPlan {
    const standing: Archetype<Id, D> = body.solve(
      EquineStanceRows.still(start),
      ArchetypeFrame.upright(ZERO),
    );
    const heading: IAutoMovieQuaternion = EquineStanceSupport.heading(
      start.trunk,
    );
    const forward: IAutoMovieVector3 = EquineStanceSupport.along(start.trunk, {
      x: 0,
      y: 0,
      z: 1,
    });
    const flat = (limb: QuadrupedBody.Limb): IAutoMovieVector3 =>
      Vector3.subtract(body.chains[limb][4]!, body.chains[limb][3]!);
    const floor: number =
      start.anchors.leftFore.y - body.sole("leftFore", flat("leftFore"));
    const middle = (end: End): IAutoMovieVector3 =>
      EquineBodyPose.point(
        start.trunk,
        Vector3.scale(
          Vector3.add(
            body.chains[`left${end}`][0]!,
            body.chains[`right${end}`][0]!,
          ),
          0.5,
        ),
      );
    const pitched = (
      degrees: number,
      pivot: IAutoMovieVector3,
    ): ArchetypeFrame.IMotion =>
      ArchetypeFrame.chain(
        EquineBodyPose.turn(degrees, 0, pivot, ZERO, heading),
        start.trunk,
      );
    const target: Record<QuadrupedBody.Limb, EquineBodyPose.Limb> =
      EquineStanceSupport.placed(start.anchors);
    let trunk: Trunk;
    let tail: number = 0;
    if (cue.kind === "sit") {
      const shoulders: IAutoMovieVector3 = middle("Fore");
      const quarters: IAutoMovieModelPart = part(standing, "hindquarters");
      const ends: readonly IAutoMovieVector3[] = bar(quarters);
      const rear: IAutoMovieVector3 =
        Vector3.dot(ends[0]!, forward) < Vector3.dot(ends[1]!, forward)
          ? ends[0]!
          : ends[1]!;
      const pitch: number = solvePitch(
        Vector3.subtract(rear, shoulders),
        forward,
        floor + radius(quarters) - shoulders.y,
        true,
      );
      trunk = (share: number): ArchetypeFrame.IMotion =>
        pitched(pitch * share, shoulders);
      tail = lifted(standing, start.trunk, trunk(1), forward, floor);
      for (const limb of ["leftHind", "rightHind"] as const)
        target[limb] = tucked(
          body,
          standing,
          start,
          trunk(1),
          limb,
          forward,
          floor,
        );
    } else {
      const hips: IAutoMovieVector3 = middle("Hind");
      const shoulders: IAutoMovieVector3 = middle("Fore");
      const lengths: readonly number[] = segments(body.chains.leftFore);
      const lying: number = Math.max(
        radius(part(standing, QuadrupedBody.BONES.leftFore[2])),
        radius(part(standing, QuadrupedBody.BONES.leftFore[3])),
      );
      const pitch: number = solvePitch(
        Vector3.subtract(shoulders, hips),
        forward,
        floor + lying + lengths[1]! + HUMERUS_DROP * lengths[0]! - hips.y,
        false,
      );
      trunk = (share: number): ArchetypeFrame.IMotion =>
        pitched(pitch * share, hips);
      const kneeling: readonly Fore[] =
        cue.kind === "kneel"
          ? ["leftFore", "rightFore"]
          : [cue.side === "left" ? "rightFore" : "leftFore"];
      for (const limb of kneeling)
        target[limb] = kneel(body, trunk(1), limb, forward, floor + lying, -1);
      if (cue.kind === "bow") {
        const limb: Fore = `${cue.side}Fore`;
        const shoulder: IAutoMovieVector3 = EquineBodyPose.point(
          trunk(1),
          body.chains[limb][0]!,
        );
        const reach: number =
          STRETCH *
          segments(body.chains[limb]).reduce(
            (sum: number, length: number): number => sum + length,
            0,
          );
        const ground: number = start.anchors[limb].y;
        const ahead: number = Math.sqrt(
          Math.max(0, reach * reach - (shoulder.y - ground) ** 2),
        );
        target[limb] = {
          kind: "placed",
          anchor: {
            ...Vector3.addScaled(shoulder, forward, ahead),
            y: ground,
          },
          fold: 0,
        };
      }
    }
    return {
      cue,
      start,
      end: start,
      keys: [0.5, 1],
      events: [{ label: `${cue.kind}On`, entry: true, time: 1 }],
      goal: (share: number): EquineBodyPose.IGoal =>
        blend(body, start, trunk, target, share, tail),
    };
  }

  /** A knelt limb under a trunk: its middle joint (carpus or hock) on the floor under an upright second bar, the cannon and pastern lying along the floor back (`along` -1, a foreleg) or forward (`along` 1, a hind leg under a sit). */
  function kneel<Id extends string, D extends string>(
    body: EquineBodyPose.IPrepared<Id, D>,
    trunk: ArchetypeFrame.IMotion,
    limb: QuadrupedBody.Limb,
    forward: IAutoMovieVector3,
    height: number,
    along: number,
  ): EquineBodyPose.IPlaced {
    const lengths: readonly number[] = segments(body.chains[limb]);
    const shoulder: IAutoMovieVector3 = EquineBodyPose.point(
      trunk,
      body.chains[limb][0]!,
    );
    const elbow: number = height + lengths[1]!;
    const back: number = Math.sqrt(
      Math.max(0, lengths[0]! ** 2 - (shoulder.y - elbow) ** 2),
    );
    const carpus: IAutoMovieVector3 = {
      ...Vector3.addScaled(shoulder, forward, along * back),
      y: height,
    };
    return {
      kind: "placed",
      anchor: Vector3.addScaled(
        carpus,
        forward,
        along * (lengths[2]! + lengths[3]!),
      ),
      fold: KNEEL_FOLD,
      direction: Vector3.scale(forward, along),
    };
  }

  /** The least turn of the tail about its dock, degrees, that rests its tip on the floor once the trunk has moved from one motion to another: the tip circles the dock in the heading's sagittal plane, so its height is a cosine of the turn, solved in closed form. */
  function lifted<Id extends string, D extends string>(
    standing: Archetype<Id, D>,
    from: ArchetypeFrame.IMotion,
    to: ArchetypeFrame.IMotion,
    forward: IAutoMovieVector3,
    floor: number,
  ): number {
    const tail: IAutoMovieModelPart = part(standing, "tail");
    const [root, tip] = bar(tail).map(
      (point: IAutoMovieVector3): IAutoMovieVector3 =>
        EquineBodyPose.point(
          to,
          Quaternion.rotateVector(
            Quaternion.inverse(from.rotation),
            Vector3.subtract(point, from.translation),
          ),
        ),
    ) as [IAutoMovieVector3, IAutoMovieVector3];
    const offset: IAutoMovieVector3 = Vector3.subtract(tip, root);
    const z: number = Vector3.dot(offset, forward);
    const length: number = Math.hypot(z, offset.y);
    const height: number = floor + radius(tail) - root.y;
    if (tip.y - radius(tail) >= floor) return 0;
    const alpha: number = Math.atan2(z, offset.y);
    const spread: number = Math.acos(
      Math.max(-1, Math.min(1, height / length)),
    );
    const turns: readonly number[] = [spread - alpha, -spread - alpha];
    const least: number = turns.reduce((best: number, each: number): number =>
      Math.abs(each) < Math.abs(best) ? each : best,
    );
    return (least * 180) / Math.PI;
  }

  /**
   * A hind leg tucked under a sit, folded from its chain at the start: the hock on the floor under the hip, the stifle where the femur from the hip meets the tibia from the hock ahead of them (two circles, closed form), the cannon and pastern lying forward along the floor. Each bar's wanted direction in the trunk's frame becomes the turns that carry the start chain's bars onto it, so the joints land where the geometry puts them.
   */
  function tucked<Id extends string, D extends string>(
    body: EquineBodyPose.IPrepared<Id, D>,
    standing: Archetype<Id, D>,
    start: EquineStanceRows.IState,
    trunk: ArchetypeFrame.IMotion,
    limb: QuadrupedBody.Limb,
    forward: IAutoMovieVector3,
    floor: number,
  ): EquineBodyPose.IFolded {
    const lengths: readonly number[] = segments(body.chains[limb]);
    const hip: IAutoMovieVector3 = EquineBodyPose.point(
      trunk,
      body.chains[limb][0]!,
    );
    const bars: readonly IAutoMovieModelPart[] = QuadrupedBody.BONES[limb].map(
      (id: QuadrupedBody.Bone): IAutoMovieModelPart => part(standing, id),
    );

    // The stifle over a hock at a height: the upper intersection of the femur's circle about the hip and the tibia's about the hock.
    const stifleAt = (height: number): IAutoMovieVector3 => {
      const rise: number = hip.y - height;
      const up: number =
        (lengths[1]! ** 2 - lengths[0]! ** 2 + rise * rise) / (2 * rise);
      const ahead: number = Math.sqrt(Math.max(0, lengths[1]! ** 2 - up * up));
      return Vector3.add(
        Vector3.addScaled({ ...hip, y: height }, forward, ahead),
        { x: 0, y: up, z: 0 },
      );
    };

    // The hock rests where the lowest of the bars meeting there touches the floor: the level cannon and pastern by their radii, the sloping tibia by its own drop; `SETTLE` closed-form corrections settle the tibia's slope, each moving the hock by the change of its drop.
    const level: number = floor + Math.max(radius(bars[2]!), radius(bars[3]!));
    let height: number = level;
    for (let pass: number = 0; pass < SETTLE; pass++) {
      const slope: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract({ ...hip, y: height }, stifleAt(height)),
      );
      height = Math.max(level, floor + drop(bars[1]!, slope));
    }
    const hock: IAutoMovieVector3 = { ...hip, y: height };
    const stifle: IAutoMovieVector3 = stifleAt(height);
    const wanted: readonly IAutoMovieVector3[] = [
      Vector3.subtract(stifle, hip),
      Vector3.subtract(hock, stifle),
      forward,
      forward,
    ];

    // In the trunk's frame each bar's sagittal angle from straight down, positive forward; a turn swings the distal end back.
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(trunk.rotation);
    const angle = (v: IAutoMovieVector3): number => Math.atan2(v.z, -v.y);
    const chain: readonly IAutoMovieVector3[] = body.chain(limb, start.trunk, {
      kind: "placed",
      anchor: start.anchors[limb],
      fold: 0,
    });
    const turns: number[] = [];
    let applied: number = 0;
    for (let k: number = 0; k < 4; k++) {
      const from: number = angle(Vector3.subtract(chain[k + 1]!, chain[k]!));
      const to: number = angle(Quaternion.rotateVector(inverse, wanted[k]!));
      const turn: number = ((from - to) * 180) / Math.PI - applied;
      turns.push(turn);
      applied += turn;
    }
    return {
      kind: "folded",
      chain,
      turns: [turns[0]!, turns[1]!, turns[2]!, turns[3]!],
    };
  }

  /** The pose at a share between the start and the target: the trunk turned and moved by the share, each placed hoof on a lifted path with its fold and direction blended, folded limbs tucked by twice the share. */
  function blend<Id extends string, D extends string>(
    body: EquineBodyPose.IPrepared<Id, D>,
    start: EquineStanceRows.IState,
    trunk: Trunk,
    target: Readonly<Record<QuadrupedBody.Limb, EquineBodyPose.Limb>>,
    share: number,
    tail: number,
  ): EquineBodyPose.IGoal {
    const s: number = minimumJerk.share(Math.max(0, Math.min(1, share)));
    const limbs: Record<QuadrupedBody.Limb, EquineBodyPose.Limb> =
      EquineStanceSupport.placed(start.anchors);
    for (const limb of QuadrupedBody.LIMBS) {
      const goal: EquineBodyPose.Limb = target[limb];
      // A folded limb tucks over the first half, before the body comes down onto it.
      if (goal.kind === "folded")
        limbs[limb] = EquineStanceSupport.folded(
          goal.chain,
          goal.turns,
          minimumJerk.share(Math.max(0, Math.min(1, 2 * share))),
        );
      else if (Vector3.distance(goal.anchor, start.anchors[limb]) > 0) {
        const flat: IAutoMovieVector3 = Vector3.subtract(
          body.chains[limb][4]!,
          body.chains[limb][3]!,
        );
        limbs[limb] = {
          kind: "placed",
          anchor: EquineStanceSupport.arc(
            start.anchors[limb],
            goal.anchor,
            s,
            0.05,
          ),
          fold: goal.fold * s,
          direction: Quaternion.rotateVector(
            Quaternion.slerp(
              { x: 0, y: 0, z: 0, w: 1 },
              rotationBetween(flat, goal.direction ?? flat),
              s,
            ),
            flat,
          ),
        };
      }
    }
    return { trunk: trunk(s), limbs, tail: tail * s };
  }

  /** The pitch, degrees, that brings a point at an offset from its pivot to a height above the pivot: nose-up when `up`, else nose-down. */
  function solvePitch(
    offset: IAutoMovieVector3,
    forward: IAutoMovieVector3,
    height: number,
    up: boolean,
  ): number {
    const z: number = Vector3.dot(offset, forward);
    const y: number = offset.y;
    const length: number = Math.hypot(z, y);
    const alpha: number = Math.atan2(z, y);
    const spread: number = Math.acos(
      Math.max(-1, Math.min(1, height / length)),
    );
    return ((up ? alpha + spread : alpha - spread) * 180) / Math.PI;
  }

  /** A model's part by id. */
  function part<Id extends string, D extends string>(
    model: Archetype<Id, D>,
    id: string,
  ): IAutoMovieModelPart {
    return model.parts.find(
      (each: IAutoMovieModelPart): boolean => each.id === id,
    )!;
  }

  /** How far a bar part reaches below its end along a direction: a capsule's radius, a cylinder's rim. */
  function drop(
    part: IAutoMovieModelPart,
    direction: IAutoMovieVector3,
  ): number {
    return part.geometry.type === "primitive" &&
      part.geometry.shape.type === "cylinder"
      ? part.geometry.shape.radius * Math.hypot(direction.x, direction.z)
      : radius(part);
  }

  /** A bar part's radius. */
  function radius(part: IAutoMovieModelPart): number {
    return part.geometry.type === "primitive" &&
      (part.geometry.shape.type === "capsule" ||
        part.geometry.shape.type === "cylinder")
      ? part.geometry.shape.radius
      : 0;
  }

  /** A bar part's two ends. */
  function bar(part: IAutoMovieModelPart): readonly IAutoMovieVector3[] {
    const height: number =
      part.geometry.type === "primitive" &&
      (part.geometry.shape.type === "capsule" ||
        part.geometry.shape.type === "cylinder")
        ? part.geometry.shape.height
        : 0;
    const half: IAutoMovieVector3 = Quaternion.rotateVector(
      part.transform!.rotation,
      { x: 0, y: height / 2, z: 0 },
    );
    return [
      Vector3.subtract(part.transform!.translation, half),
      Vector3.add(part.transform!.translation, half),
    ];
  }

  /** A chain's four bar lengths. */
  function segments(chain: readonly IAutoMovieVector3[]): readonly number[] {
    return [0, 1, 2, 3].map((k: number): number =>
      Vector3.distance(chain[k]!, chain[k + 1]!),
    );
  }
}
