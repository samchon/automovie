import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanGymnasticsWheel,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import { poseBones } from "../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/internal/resolveHumanPosture";

/**
 * The supported phase of a gymnastic turn: the body, a shape that changes with
 * the angle of its turn, rolls over its spokes (a foot, both feet, a hand, both
 * hands) as a wheel rolls without slipping, the lowest spoke bearing at every
 * angle.
 *
 * The table is built once per plan, a row every few degrees: the shape at that
 * angle is posed at the origin, the spoke whose joints reach lowest above their
 * bearing height bears, the root's height sets that spoke at its height and the
 * root's place keeps it where it came down. When the bearing spoke changes,
 * both are down, and the new one takes its place from where the old one holds
 * the root, so the root is continuous. A spoke of two joints (both feet, both
 * hands) bears at their middle.
 *
 * This is the cartwheel's rolling rule for any shape, axis and set of spokes,
 * and the cartwheel, the round-off and the handspring all roll on it. Nothing
 * is integrated: how fast the angle grows is the law's.
 */
export namespace GymnasticsWheel {
  /**
   * How much lower a later spoke must reach to take the weight from an earlier
   * one, metres: two spokes level within it keep the earlier.
   */
  const LEVEL: number = 1e-3;

  /**
   * Roll a body's shape over its spokes.
   *
   * @param props The body, the shape at an angle (its root at the origin), the
   *   spokes in order of preference, the root's floor place at angle 0, the
   *   last angle and the angle between rows.
   * @returns The table.
   */
  export function roll(
    props: IAutoMovieMotionHumanGymnasticsWheel.IRollProps,
  ): IAutoMovieMotionHumanGymnasticsWheel.IWheel {
    const count: number = Math.max(1, Math.ceil(props.until / props.step));
    const rows: IAutoMovieMotionHumanGymnasticsWheel.IRow[] = [];
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const projection: ReturnType<typeof prepareHumanPostureProjection> =
      prepareHumanPostureProjection(props.body);
    const requested: Set<AutoMovieHumanoidBone> = new Set();
    for (const spoke of props.spokes)
      for (const bone of spoke.bones) requested.add(bone);
    const readBones: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
      props.body,
      requested,
    );
    let place: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (let i: number = 0; i <= count; i++) {
      const angle: number = (props.until * i) / count;
      const shaped: IAutoMovieMotionHumanPosture = props.shaped(angle);
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        readBones(
          resolveHumanPosture.seeded(
            props.body,
            { ...shaped, limbs: {} },
            undefined,
            undefined,
            resolution,
            undefined,
            projection,
          ).pose,
          resolution(),
        );
      const middles: IAutoMovieVector3[] = props.spokes.map(
        (
          spoke: IAutoMovieMotionHumanGymnasticsWheel.ISpoke,
        ): IAutoMovieVector3 => {
          let x: number = 0;
          let y: number = 0;
          let z: number = 0;
          for (const bone of spoke.bones) {
            const p: IAutoMovieVector3 = bones.get(bone)!.worldPosition;
            x += p.x;
            y += p.y;
            z += p.z;
          }
          const n: number = spoke.bones.length;
          return { x: x / n, y: y / n, z: z / n };
        },
      );
      const reach: (index: number) => number = (index: number): number =>
        middles[index]!.y - props.spokes[index]!.height;
      let bears: number = 0;
      for (let s: number = 1; s < props.spokes.length; s++)
        if (reach(s) < reach(bears) - LEVEL) bears = s;
      const at: IAutoMovieVector3 = middles[bears]!;
      const before: IAutoMovieMotionHumanGymnasticsWheel.IRow | undefined =
        rows.at(-1);
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
   * bearing spoke, a joint's windows joined when it bears on through a change
   * of spoke (a foot bearing alone, then with the other).
   *
   * @param wheel The table.
   * @param spokes Its spokes.
   * @param share Pure, total angle-to-time conversion for this fixed turn,
   *   returning its action share; the law's analytic or inverse minimum-jerk
   *   clock.
   * @returns The windows, in order of their start.
   */
  export function contacts(
    wheel: IAutoMovieMotionHumanGymnasticsWheel.IWheel,
    spokes: readonly IAutoMovieMotionHumanGymnasticsWheel.ISpoke[],
    share: (angle: number) => number,
  ): IAutoMovieMotionHumanContactWindow[] {
    const runs: IContactRun[] = [];

    // Each joint's running window and the last row it bore at.
    const open: Map<string, IContactRun> = new Map();
    wheel.rows.forEach(
      (row: IAutoMovieMotionHumanGymnasticsWheel.IRow, index: number): void => {
        const spoke: IAutoMovieMotionHumanGymnasticsWheel.ISpoke =
          spokes[row.bears]!;
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
      },
    );
    const times: Map<ContactsTimesEntry, number> = new Map();
    const at: (angle: number) => number = (angle: number): number => {
      const key: ContactsAtKey = Object.is(angle, -0) ? "-0" : angle;
      const kept: number | undefined = times.get(key);
      if (kept !== undefined) return kept;
      const value: number = share(angle);
      times.set(key, value);
      return value;
    };
    return runs.map(
      (run: IContactRun): IAutoMovieMotionHumanContactWindow => ({
        part: run.part,
        kind: "plant",
        from: at(run.from),
        to: at(run.to),
        support: run.support,
      }),
    );
  }

  /**
   * The seconds at which a wheel turned through `until` degrees on one
   * minimum-jerk progress over `duration` reaches an angle: the inverse of the
   * progress, by bisection.
   *
   * @param angle The angle, degrees.
   * @param until The whole turn, degrees.
   * @param duration The turn's seconds.
   * @returns Seconds since the turn's start.
   */
  export function when(angle: number, until: number, duration: number): number {
    // The ends are exact: minimum-jerk progress is flat at both, so a
    // bisection lands short of them, and a window that ends with the roll
    // must end at the action's own last instant for what follows to read it.
    if (angle <= 0) return 0;
    if (angle >= until) return duration;
    let low: number = 0;
    let high: number = 1;
    for (let i: number = 0; i < 30; i++) {
      const middle: number = (low + high) / 2;
      if (until * AutoMovieEngineMotionSampling.minimumJerkShare(middle) < angle) low = middle;
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
   */
  export function laid(body: IAutoMovieMotionHumanBody): number {
    return AutoMovieMotionHumanPlaced.wrist(body, "left", {
      point: { x: 0, y: 0, z: 0 },
      facing: { x: 0, y: -1, z: 0 },
      forward: { x: 0, y: 0, z: 1 },
    }).y;
  }
}

/** The alternatives of `ContactsAtKey`'s site. */
type ContactsAtKey = number | "-0";

/** The alternatives of `ContactsTimesEntry`'s site. */
type ContactsTimesEntry = number | "-0";

/**
 * One ordered contact run before its fixed geometric endpoint angles become
 * times.
 */
interface IContactRun {
  /** The bone that bears throughout this contiguous run. */
  part: IAutoMovieMotionHumanContactWindow["part"];

  /** The first bearing row's angle, degrees. */
  from: number;

  /** The last bearing row's angle, degrees. */
  to: number;

  /** The last bearing row's index, used only to join contiguous rows. */
  row: number;

  /**
   * The support retained from the run's first row, as in the original contact
   * rule.
   */
  support: IAutoMovieMotionHumanContactWindow.Support;
}
