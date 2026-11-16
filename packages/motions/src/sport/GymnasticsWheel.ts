import { type IAutoMovieResolvedBone, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

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
 * This is the cartwheel's rolling rule for any shape, axis and set of
 * spokes, and the cartwheel, the round-off and the handspring all roll on
 * it. Nothing is integrated: how fast the angle grows is the law's.
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Collect demanded spoke bones once, then resolve the original trunk, read every spoke's mean once and choose the bearing/root for each row.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A spoke takes the weight only when lower by `LEVEL`, so a pair level with its single feet keeps bearing as the pair and the choice does not flicker on rounding.
   * @evidence contracts/development/implementation.md#efficient-algorithms R rows retain ordinary canonical joint admission; demanded FK visits the ancestor closure of the spokes instead of unrelated descendants. Each row reduces each spoke once, O(P) in total named spoke bones, instead of repeating means during bearing comparisons. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each row's spoke means supply every comparison and support handover. One explicitly scoped exact FK reader shares unchanged joint/ancestor arithmetic across real rows, while changed shapes and root headings still compute normally; no shape or time is rounded into a key.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains one record per row. The spoke set, operation-scoped lazy FK reader and row maps/means release at construction return or throw; no reader or temporal cache enters the table.
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
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
    const requested: Set<AutoMovieHumanoidBone> = new Set();
    for (const spoke of props.spokes)
      for (const bone of spoke.bones) requested.add(bone);
    let place: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (let i: number = 0; i <= count; i++) {
      const angle: number = (props.until * i) / count;
      const shaped: IHumanPosture = props.shaped(angle);
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(props.body, resolveHumanPosture.seeded(props.body, { ...shaped, limbs: {} }, undefined, undefined, resolution).pose, resolution(), requested);
      const middles: IAutoMovieVector3[] = props.spokes.map((spoke: ISpoke): IAutoMovieVector3 => {
        let sum: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
        for (const bone of spoke.bones) {
          const p: IAutoMovieVector3 = bones.get(bone)!.worldPosition;
          sum = { x: sum.x + p.x, y: sum.y + p.y, z: sum.z + p.z };
        }
        const n: number = spoke.bones.length;
        return { x: sum.x / n, y: sum.y / n, z: sum.z / n };
      });
      const reach: (index: number) => number = (index: number): number =>
        middles[index]!.y - props.spokes[index]!.height;
      let bears: number = 0;
      for (let s: number = 1; s < props.spokes.length; s++)
        if (reach(s) < reach(bears) - LEVEL) bears = s;
      const at: IAutoMovieVector3 = middles[bears]!;
      const before: IRow | undefined = rows.at(-1);
      if (before === undefined)
        place = { x: props.start.x + at.x, y: 0, z: props.start.z + at.z };
      else if (before.bears !== bears) {
        // Both spokes are down: the new one takes its place from where the
        // old one holds the root.
        const old: IAutoMovieVector3 = middles[before.bears]!;
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
   * @param share Pure, total angle-to-time conversion for this fixed turn, returning its action share; the law's analytic or inverse minimum-jerk clock.
   * @returns The windows, in order of their start.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the joining and the order.
   * @evidence contracts/development/implementation.md#principled-implementation A window runs from the first row its spoke bears to the last, each endpoint converted at its exact angle's share. The time conversion is pure and total over all rows, as the fixed-law clocks supplied by the callers are.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Scan every geometric row into ordered contiguous contact runs, then convert only emitted endpoints through the one time reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms The full R-row/P-spoke incidence scan remains; W emitted windows demand K distinct endpoint conversions, K at most 2W, instead of converting every overwritten interior endpoint. This avoids unused inverse-clock bisections without dropping a geometry station or contact, with speedup unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Equal demanded endpoint angles share one exact conversion within this call because the supplied law clock is fixed, pure and total; no physical callback, shape evaluation or effectful work is skipped or memoized.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources O(W) run records, O(P) running-bone entries and O(K) converted angles release at return or throw; only fresh final windows escape, with their existing borrowed support records.
   */
  export function contacts(
    wheel: IWheel,
    spokes: readonly ISpoke[],
    share: (angle: number) => number,
  ): IHumanContactWindow[] {
    const runs: IContactRun[] = [];

    // Each joint's running window and the last row it bore at.
    const open: Map<string, IContactRun> = new Map();
    wheel.rows.forEach((row: IRow, index: number): void => {
      const spoke: ISpoke = spokes[row.bears]!;
      for (const bone of spoke.bones) {
        const running: IContactRun | undefined = open.get(bone);
        if (running !== undefined && running.row === index - 1) {
          running.to = row.angle;
          running.row = index;
        } else {
          const run: IContactRun = {
            part: bone,
            from: row.angle,
            to: row.angle,
            row: index,
            support: spoke.support,
          };
          runs.push(run);
          open.set(bone, run);
        }
      }
    });
    const times: Map<number, number> = new Map();
    const at: (angle: number) => number = (angle: number): number => {
      const kept: number | undefined = times.get(angle);
      if (kept !== undefined) return kept;
      const value: number = share(angle);
      times.set(angle, value);
      return value;
    };
    return runs.map((run: IContactRun): IHumanContactWindow => ({
      part: run.part, kind: "plant", from: at(run.from), to: at(run.to), support: run.support,
    }));
  }

  /**
   * The seconds at which a wheel turned through `until` degrees on one
   * minimum-jerk progress over `duration` reaches an angle: the inverse of
   * the progress, by bisection.
   *
   * @param angle The angle, degrees.
   * @param until The whole turn, degrees.
   * @param duration The turn's seconds.
   * @returns Seconds since the turn's start.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the unit and the method.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's minimum-jerk share is monotone on [0, 1], so its inverse is found by bisection.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bisection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts 30 halvings: a share within 1e-9 of the root.
   * @evidence contracts/development/implementation.md#efficient-algorithms 30 evaluations.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine's `minimumJerk`, the progress the wheels turn on.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function when(angle: number, until: number, duration: number): number {
    let low: number = 0;
    let high: number = 1;
    for (let i: number = 0; i < 30; i++) {
      const middle: number = (low + high) / 2;
      if (until * minimumJerk(middle).s < angle) low = middle;
      else high = middle;
    }
    return ((low + high) / 2) * duration;
  }

  /**
   * The height of a wrist over a palm laid flat on the floor, the height a
   * hand's spoke bears at above its surface.
   *
   * @param body The body.
   * @returns Metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the meaning and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation The hand owner's laid wrist, the one reading of it the cartwheel, the round-off and the workout's hands share.
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

/** One ordered contact run before its fixed geometric endpoint angles become times. */
interface IContactRun {
  /** The bone that bears throughout this contiguous run. */
  part: IHumanContactWindow["part"];

  /** The first bearing row's angle, degrees. */
  from: number;

  /** The last bearing row's angle, degrees. */
  to: number;

  /** The last bearing row's index, used only to join contiguous rows. */
  row: number;

  /** The support retained from the run's first row, as in the original contact rule. */
  support: IHumanContactWindow.Support;
}
