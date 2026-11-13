import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingBody } from "../striking/StrikingBody";

/**
 * The supported phase of a gymnastic turn (#3377): the body, a shape that
 * changes with the angle of its turn, rolls over its spokes (a foot, both
 * feet, a hand, both hands) as a wheel rolls without slipping, the lowest
 * spoke bearing at every angle.
 *
 * The table is built once per plan, a row every few degrees: the shape at
 * that angle is posed at the origin, the spoke whose joints reach lowest
 * above their bearing height bears, the root's height sets that spoke at
 * its height and the root's place keeps it where it came down. When the
 * bearing spoke changes, both are down, and the new one takes its place
 * from where the old one holds the root, so the root is continuous. A spoke
 * of two joints (both feet, both hands) bears at their middle.
 *
 * This is the cartwheel's table (`cartwheel`) for any shape, axis and set of
 * spokes; the cartwheel keeps its own copy, a first pass this kernel can
 * replace. Nothing is integrated: how fast the angle grows is the law's.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rolling rule, the hand-over of the place, the pair rule and the relation to the cartwheel.
 * @evidence contracts/development/design.md#principled-representation A table of root and bearing spoke by angle, built from the body's own joints, so every body rolls by its own spokes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The spoke and row records, the table, its reading, its contact windows and the laid wrist's height the laws bear hands at.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No length in metres: every place follows from the spokes.
 */
export namespace GymnasticsWheel {
  /** A part of the body that may bear. */
  export interface ISpoke {
    /** Its joints: one, or two that bear together at their middle. */
    bones: readonly (AutoMovieHumanoidBone & IHumanContactWindow["part"])[];

    /** The height of its joints' middle when it bears, world metres. */
    height: number;

    /** What it bears on. */
    support: IHumanContactWindow.Support;
  }

  /** One row of the table. */
  export interface IRow {
    /** The turn's angle, degrees. */
    angle: number;

    /** The root, world metres. */
    root: IAutoMovieVector3;

    /** The bearing spoke's index in the spokes. */
    bears: number;
  }

  /** A rolled table. */
  export interface IWheel {
    /** The rows, by growing angle, the first at 0 and the last at the turn's end. */
    rows: readonly IRow[];

    /**
     * The root at an angle, between the rows.
     *
     * @param angle Degrees, clamped into the table.
     * @returns World metres.
     */
    root(angle: number): IAutoMovieVector3;
  }

  /** How much lower a later spoke must reach to take the weight from an earlier one, metres: two spokes level within it keep the earlier. */
  const LEVEL: number = 1e-3;

  /**
   * Roll a body's shape over its spokes.
   *
   * @param props The body, the shape at an angle (its root at the origin), the spokes in order of preference, the root's floor place at angle 0, the last angle and the angle between rows.
   * @returns The table.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Rolling without slipping: within a spoke's run the root is the spoke's place less its offset from the root, and at a change the place is handed over while both are down.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One forward kinematics per row, one choice of spoke, one root.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A spoke takes the weight only when lower by `LEVEL`, so a pair level with its single feet keeps bearing as the pair and the choice does not flicker on rounding.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward kinematics per row: the angle over the step.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per plan.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The table holds one record per row and is released with the plan.
   */
  export function roll(props: {
    body: IHumanBody;
    shaped: (angle: number) => IHumanPosture;
    spokes: readonly ISpoke[];
    start: IAutoMovieVector3;
    until: number;
    step: number;
  }): IWheel {
    const count: number = Math.max(1, Math.ceil(props.until / props.step));
    const rows: IRow[] = [];
    let place: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (let i: number = 0; i <= count; i++) {
      const angle: number = (props.until * i) / count;
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        StrikingBody.trunk(props.body, props.shaped(angle));
      const middle = (spoke: ISpoke): IAutoMovieVector3 => {
        let sum: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
        for (const bone of spoke.bones) {
          const p: IAutoMovieVector3 = bones.get(bone)!.worldPosition;
          sum = { x: sum.x + p.x, y: sum.y + p.y, z: sum.z + p.z };
        }
        const n: number = spoke.bones.length;
        return { x: sum.x / n, y: sum.y / n, z: sum.z / n };
      };
      const reach = (index: number): number =>
        middle(props.spokes[index]!).y - props.spokes[index]!.height;
      let bears: number = 0;
      for (let s: number = 1; s < props.spokes.length; s++)
        if (reach(s) < reach(bears) - LEVEL) bears = s;
      const at: IAutoMovieVector3 = middle(props.spokes[bears]!);
      const before: IRow | undefined = rows.at(-1);
      if (before === undefined)
        place = { x: props.start.x + at.x, y: 0, z: props.start.z + at.z };
      else if (before.bears !== bears) {
        // Both spokes are down: the new one takes its place from where the
        // old one holds the root.
        const old: IAutoMovieVector3 = middle(props.spokes[before.bears]!);
        place = {
          x: place.x - old.x + at.x,
          y: 0,
          z: place.z - old.z + at.z,
        };
      }
      rows.push({
        angle,
        root: {
          x: place.x - at.x,
          y: props.spokes[bears]!.height - at.y,
          z: place.z - at.z,
        },
        bears,
      });
    }
    return {
      rows,
      root: (angle: number): IAutoMovieVector3 => {
        const u: number =
          (Math.min(props.until, Math.max(0, angle)) / props.until) * count;
        const index: number = Math.min(count - 1, Math.floor(u));
        const a: IAutoMovieVector3 = rows[index]!.root;
        const b: IAutoMovieVector3 = rows[index + 1]!.root;
        const f: number = u - index;
        return {
          x: a.x + (b.x - a.x) * f,
          y: a.y + (b.y - a.y) * f,
          z: a.z + (b.z - a.z) * f,
        };
      },
    };
  }

  /**
   * The contact windows of a rolled table: one per joint of each run of a
   * bearing spoke, a joint's windows joined when it bears on through a
   * change of spoke (a foot bearing alone, then with the other).
   *
   * @param wheel The table.
   * @param spokes Its spokes.
   * @param share The share of the action at which the turn reaches an angle.
   * @returns The windows, in order of their start.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the joining and the order.
   * @evidence contracts/development/implementation.md#principled-implementation A window runs from the first row its spoke bears to the last, each read at its angle's share.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the rows.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in rows.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function contacts(
    wheel: IWheel,
    spokes: readonly ISpoke[],
    share: (angle: number) => number,
  ): IHumanContactWindow[] {
    const windows: IHumanContactWindow[] = [];

    // Each joint's running window and the last row it bore at.
    const open: Map<string, { window: IHumanContactWindow; row: number }> =
      new Map();
    wheel.rows.forEach((row: IRow, index: number): void => {
      const at: number = share(row.angle);
      const spoke: ISpoke = spokes[row.bears]!;
      for (const bone of spoke.bones) {
        const running: { window: IHumanContactWindow; row: number } | undefined =
          open.get(bone);
        if (running !== undefined && running.row === index - 1) {
          running.window.to = at;
          running.row = index;
        } else {
          const window: IHumanContactWindow = {
            part: bone,
            kind: "plant",
            from: at,
            to: at,
            support: spoke.support,
          };
          windows.push(window);
          open.set(bone, { window, row: index });
        }
      }
    });
    return windows;
  }

  /**
   * The height of a wrist over a palm laid flat on the floor, the height a
   * hand's spoke bears at above its surface.
   *
   * @param body The body.
   * @returns Metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the meaning and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation The hand owner's laid wrist, as the cartwheel and the workout bear hands.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `AutoMovieMotionHumanPlaced.wrist`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function laid(body: IHumanBody): number {
    return AutoMovieMotionHumanPlaced.wrist(body, "left", {
      point: { x: 0, y: 0, z: 0 },
      facing: { x: 0, y: -1, z: 0 },
      forward: { x: 0, y: 0, z: 1 },
    }).y;
  }
}
