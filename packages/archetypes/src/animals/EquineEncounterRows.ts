import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../core";
import type { AutoMovieArchetypeEquineEncounterCue } from "./AutoMovieArchetypeEquineEncounterCue";
import type { AutoMovieArchetypeEquineStanceCue } from "./AutoMovieArchetypeEquineStanceCue";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { EquineBodyPose } from "./EquineBodyPose";
import type { EquineStanceRows } from "./EquineStanceRows";
import { EquineStanceSupport } from "./EquineStanceSupport";

/** A limb end of the body. */
type End = "Fore" | "Hind";

/** A rearing strike's trunk pitch about the hips, degrees: authored. */
const STRIKE_PITCH: number = 30;

/** A double-barrel kick's trunk pitch down about the shoulders, degrees: authored. */
const KICK_PITCH: number = 15;

/** The folded foreleg's joint turns in a strike, degrees, shoulder first: the stance rows' rear fold. */
const TUCK: readonly [number, number, number, number] = [-40, -10, 100, 20];

/** A moving hoof's path height, metres: authored. */
const LIFT: number = 0.08;

/** The zero vector. */
const ZERO: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/** The kinds of the encounter rows. */
const KINDS: ReadonlySet<string> = new Set<
  AutoMovieArchetypeEquineEncounterCue.Row["kind"]
>(["strike", "kick"]);

/**
 * The encounter's stance rows: a rearing foreleg strike and a double-barrel kick, each bringing hooves onto a point on the other horse.
 *
 * A strike pitches the trunk up about the hips by `STRIKE_PITCH` with both hind hooves planted, folds the other foreleg and carries the striking hoof on a lifted path to the struck point, its terminal bar turning to drive straight into the surface along its inward normal, held there through the hold. A kick pitches the trunk down about the shoulders by `KICK_PITCH` with both fore hooves planted and carries each hind hoof to its own kicked point, their terminal bars driving into the surface along its inward normal. An unreachable point is refused by the stance's admission. The pitches are authored.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both rows, their planted supports and what is authored.
 * @evidence contracts/development/design.md#principled-representation Stance plans.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the stance's extra rows.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No clamp: reach is admitted by the stance.
 */
export namespace EquineEncounterRows {
  /**
   * Whether a stance cue is an encounter row.
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
  export function owns(
    cue: AutoMovieArchetypeEquineStanceCue.Cue,
  ): cue is AutoMovieArchetypeEquineEncounterCue.Row {
    return KINDS.has(cue.kind);
  }

  /**
   * Plan one encounter row from a state.
   *
   * @param body The prepared solver.
   * @param start The state it starts from.
   * @param cue The row.
   * @returns Its plan, returning to the start.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and output.
   * @evidence contracts/development/implementation.md#principled-implementation Pitch the trunk about the planted pair by the share, fold or carry the free limbs to their targets by the same share.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per row.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reach and floor are left to the stance's admission.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per pose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the stance's support rules.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan holds its chains and targets.
   */
  export function plan<Id extends string, D extends string>(
    body: EquineBodyPose.IPrepared<Id, D>,
    start: EquineStanceRows.IState,
    cue: AutoMovieArchetypeEquineEncounterCue.Row,
  ): EquineStanceRows.IPlan {
    const heading: IAutoMovieQuaternion = EquineStanceSupport.heading(
      start.trunk,
    );
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
    const strike: boolean = cue.kind === "strike";
    const pivot: IAutoMovieVector3 = middle(strike ? "Hind" : "Fore");
    const pitch: number = strike ? STRIKE_PITCH : -KICK_PITCH;
    const moving: AutoMovieArchetypeQuadrupedBody.Limb[] = [];
    const targets: Partial<
      Record<
        AutoMovieArchetypeQuadrupedBody.Limb,
        AutoMovieArchetypeEquineEncounterCue.IContact
      >
    > = {};
    let folded: AutoMovieArchetypeQuadrupedBody.Limb | undefined;
    if (cue.kind === "strike") {
      const limb: AutoMovieArchetypeQuadrupedBody.Limb = `${cue.side}Fore`;
      moving.push(limb);
      targets[limb] = cue;
      folded = cue.side === "left" ? "rightFore" : "leftFore";
    } else {
      moving.push("leftHind", "rightHind");
      targets.leftHind = cue.hooves.left;
      targets.rightHind = cue.hooves.right;
    }
    const chain: readonly IAutoMovieVector3[] | undefined =
      folded === undefined
        ? undefined
        : body.chain(folded, start.trunk, {
            kind: "placed",
            anchor: start.anchors[folded],
            fold: 0,
          });
    return {
      cue,
      start,
      end: start,
      keys: [0.5, 1],
      events: [
        ...moving.map(
          (
            limb: AutoMovieArchetypeQuadrupedBody.Limb,
          ): EquineStanceRows.IEvent => ({
            label: `${limb}Off`,
            entry: true,
            time: 0,
          }),
        ),
        { label: `${cue.kind}On`, entry: true, time: 1 },
      ],
      goal: (share: number): EquineBodyPose.IGoal => {
        const s: number = minimumJerk.share(Math.max(0, Math.min(1, share)));
        const limbs: Record<
          AutoMovieArchetypeQuadrupedBody.Limb,
          EquineBodyPose.Limb
        > = EquineStanceSupport.placed(start.anchors);
        for (const limb of moving)
          limbs[limb] = {
            kind: "placed",
            anchor: EquineStanceSupport.arc(
              start.anchors[limb],
              targets[limb]!.point,
              s,
              LIFT,
            ),
            fold: 0,
            direction: Vector3.lerp(
              Vector3.subtract(body.chains[limb][4]!, body.chains[limb][3]!),
              Vector3.scale(
                targets[limb]!.normal,
                -Vector3.distance(body.chains[limb][4]!, body.chains[limb][3]!),
              ),
              s,
            ),
          };
        if (folded !== undefined && chain !== undefined)
          limbs[folded] = EquineStanceSupport.folded(chain, TUCK, s);
        return {
          trunk: AutoMovieArchetypeFrame.chain(
            EquineBodyPose.turn(pitch * s, 0, pivot, ZERO, heading),
            start.trunk,
          ),
          limbs,
        };
      },
    };
  }
}
