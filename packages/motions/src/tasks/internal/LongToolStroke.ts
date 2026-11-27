import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanLongTool,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * The world up.
 */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/*
 * Seconds of one stroke of each kind: provisional until a measured swing, dig
 * or rake is read.
 */
const PERIODS: Readonly<Record<IAutoMovieMotionHumanLongTool.Stroke, number>> =
  {
    chop: 1.6,
    side: 1.6,
    swing: 1.8,
    dig: 3,
    rake: 1.6,
  };

/*
 * The share of a swung stroke spent bringing the face down, from the top to the
 * contact: provisional, a fast downswing after a slower raise.
 */
const DOWN: number = 0.35;

/*
 * A dug blade's depth below the ground, metres: provisional, a spade's blade
 * driven to about half its height.
 */
const DEPTH: number = 0.15;

/*
 * A rake's pull either side of its work point, and how high its tines lift on
 * the return, metres: provisional.
 */
const PULL: number = 0.25;
const LIFT: number = 0.1;
/*
 * A swung stroke: the line turned in one plane from the top to the contact and
 * back.
 */
function swing(
  props: LongToolStroke.IProps,
): Omit<LongToolStroke.IStroke, SwingResult> {
  const { at, length, forward: f, leadward: lw, hips, lead } = props;
  const side: boolean = props.stroke === "side";
  // The hands meet the work in front of the hips (a chop or a swing) or
  // of the chest (a side chop); the line runs from there to the work.
  const hand: IAutoMovieVector3 = Vector3.add(
    hips,
    Vector3.add(Vector3.scale(f, side ? 0.4 : 0.35), {
      x: 0,
      y: side ? 0.35 : 0.05,
      z: 0,
    }),
  );
  const toward: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(at, hand),
  );
  const contact: IAutoMovieVector3 = Vector3.subtract(
    at,
    Vector3.scale(toward, length),
  );
  // The top: the hands by the lead shoulder, the tool raised up and back
  // over it (a chop or a swing) or drawn back level beside it (a side chop).
  const top: IAutoMovieVector3 = Vector3.add(lead, {
    x: 0,
    y: side ? -0.1 : 0.15,
    z: 0,
  });
  const raised: IAutoMovieVector3 = Vector3.normalize(
    side
      ? Vector3.add(
          Vector3.add(Vector3.scale(lw, 0.9), Vector3.scale(f, -0.4)),
          Vector3.scale(UP, 0.15),
        )
      : Vector3.add(
          Vector3.add(Vector3.scale(UP, 0.9), Vector3.scale(f, -0.35)),
          Vector3.scale(lw, 0.2),
        ),
  );
  const turn: number = Math.acos(
    Math.max(-1, Math.min(1, Vector3.dot(raised, toward))),
  );
  const normal: IAutoMovieVector3 = Vector3.normalize(
    Vector3.cross(raised, toward),
  );
  const slides: readonly [number, number] =
    props.stroke === "swing" ? [0.55, 0.12] : side ? [0.4, 0.15] : [0.6, 0.1];
  const pose = (share: number): LongToolStroke.IPose => {
    const s: number = ((share % 1) + 1) % 1;
    // Down from the top to the contact, then back up.
    const down: number =
      s < DOWN
        ? AutoMovieEngineMotionSampling.minimumJerkShare(s / DOWN)
        : 1 - AutoMovieEngineMotionSampling.minimumJerkShare((s - DOWN) / (1 - DOWN));
    const line: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.fromAxisAngle(normal, (turn * down * 180) / Math.PI),
      raised,
    );
    return {
      grip: Vector3.lerp(top, contact, down),
      line,
      facing: Vector3.normalize(Vector3.cross(normal, line)),
      slide: length * (slides[0] + (slides[1] - slides[0]) * down),
      reach: down,
    };
  };
  return {
    marks: [{ name: "contact", share: DOWN }],
    contact,
    pose,
  };
}

/*
 * A dig's keys: poised, in, driven, levered, lifted, thrown, poised again.
 */
function dig(props: LongToolStroke.IProps): IKey[] {
  const { at, forward: f, leadward: lw, hips } = props;
  const steep: IAutoMovieVector3 = Vector3.normalize(
    Vector3.add(Vector3.scale(UP, -0.85), Vector3.scale(f, 0.45)),
  );
  const levered: IAutoMovieVector3 = Vector3.normalize(
    Vector3.add(Vector3.scale(UP, -0.45), Vector3.scale(f, 0.85)),
  );
  const flat: IAutoMovieVector3 = Vector3.normalize(
    Vector3.add(Vector3.scale(f, 0.95), Vector3.scale(UP, -0.15)),
  );
  const away: IAutoMovieVector3 =
    props.to === undefined
      ? lw
      : Vector3.normalize({
          x: props.to.x - hips.x,
          y: 0,
          z: props.to.z - hips.z,
        });
  const slide: number = props.length * 0.55;
  const poised: IKey = {
    share: 0,
    face: Vector3.add(at, Vector3.scale(UP, 0.08)),
    line: steep,
    slide,
    reach: 0.8,
  };
  return [
    poised,
    { share: 0.15, face: at, line: steep, slide, reach: 1 },
    {
      share: 0.25,
      face: Vector3.add(at, Vector3.scale(UP, -DEPTH)),
      line: steep,
      slide,
      reach: 1,
    },
    {
      share: 0.4,
      face: Vector3.add(at, Vector3.scale(UP, -0.8 * DEPTH)),
      line: levered,
      slide,
      reach: 1,
    },
    {
      share: 0.6,
      face: Vector3.add(
        hips,
        Vector3.add(Vector3.scale(f, 0.55), Vector3.scale(UP, -0.15)),
      ),
      line: flat,
      slide,
      reach: 0.4,
    },
    {
      share: 0.75,
      face: Vector3.add(
        hips,
        Vector3.add(Vector3.scale(away, 0.7), Vector3.scale(UP, 0.05)),
      ),
      line: Vector3.normalize(
        Vector3.add(Vector3.scale(away, 0.9), Vector3.scale(UP, 0.1)),
      ),
      slide,
      reach: 0,
    },
    { ...poised, share: 1 },
  ];
}

/*
 * A rake's keys: the tines lowered ahead, pulled along the ground, lifted,
 * carried back.
 */
function rake(props: LongToolStroke.IProps): IKey[] {
  const { at, forward: f } = props;
  const line: IAutoMovieVector3 = Vector3.normalize(
    Vector3.add(Vector3.scale(f, 0.85), Vector3.scale(UP, -0.53)),
  );
  const far: IAutoMovieVector3 = Vector3.add(at, Vector3.scale(f, PULL));
  const near: IAutoMovieVector3 = Vector3.add(at, Vector3.scale(f, -PULL));
  const slide: number = props.length * 0.5;
  const up = (p: IAutoMovieVector3): IAutoMovieVector3 =>
    Vector3.add(p, Vector3.scale(UP, LIFT));
  return [
    { share: 0, face: up(far), line, slide, reach: 1 },
    { share: 0.1, face: far, line, slide, reach: 1 },
    { share: 0.6, face: near, line, slide, reach: 1 },
    { share: 0.75, face: up(near), line, slide, reach: 1 },
    { share: 1, face: up(far), line, slide, reach: 1 },
  ];
}

/*
 * The trailing grip of a key.
 */
function grip(key: IKey, length: number): IAutoMovieVector3 {
  return Vector3.subtract(key.face, Vector3.scale(key.line, length));
}

/*
 * A keyed stroke's pose: eased between its keys, the face facing `ref` square
 * to the line.
 */
function keyed(
  keys: readonly IKey[],
  length: number,
  ref: IAutoMovieVector3,
): (share: number) => LongToolStroke.IPose {
  return (share: number): LongToolStroke.IPose => {
    const s: number = ((share % 1) + 1) % 1;
    const k: number = Math.max(
      0,
      keys.findIndex((key: IKey): boolean => key.share > s) - 1,
    );
    const a: IKey = keys[k]!;
    const b: IKey = keys[Math.min(keys.length - 1, k + 1)]!;
    const u: number =
      b.share > a.share
        ? AutoMovieEngineMotionSampling.minimumJerkShare((s - a.share) / (b.share - a.share))
        : 0;
    const line: IAutoMovieVector3 = Vector3.normalize(
      Vector3.lerp(a.line, b.line, u),
    );
    const face: IAutoMovieVector3 = Vector3.lerp(a.face, b.face, u);
    const facing: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(ref, Vector3.scale(line, Vector3.dot(ref, line))),
    );
    return {
      grip: Vector3.subtract(face, Vector3.scale(line, length)),
      line,
      facing,
      slide: a.slide + (b.slide - a.slide) * u,
      reach: a.reach + (b.reach - a.reach) * u,
    };
  };
}

/*
 * Build a stroke.
 */
export function LongToolStroke(
  props: LongToolStroke.IProps,
): LongToolStroke.IStroke {
  const period: number = PERIODS[props.stroke];
  const base: Pick<LongToolStroke.IStroke, OfBase> = {
    period,
    leadward: props.leadward,
    chest: props.chest,
  };
  switch (props.stroke) {
    case "chop":
    case "swing":
    case "side": {
      const swung: Omit<LongToolStroke.IStroke, OfSwung> = swing(props);
      return { ...base, ...swung };
    }
    case "dig": {
      const keys: IKey[] = dig(props);
      return {
        ...base,
        marks: [
          { name: "contact", share: keys[1]!.share },
          { name: "drive", share: keys[2]!.share },
          { name: "lever", share: keys[3]!.share },
          { name: "throw", share: keys[5]!.share },
        ],
        contact: grip(keys[2]!, props.length),
        pose: keyed(keys, props.length, props.forward),
      };
    }
    case "rake": {
      const keys: IKey[] = rake(props);
      return {
        ...base,
        marks: [
          { name: "contact", share: keys[1]!.share },
          { name: "pull", share: keys[2]!.share },
        ],
        contact: grip(keys[2]!, props.length),
        pose: keyed(keys, props.length, Vector3.scale(UP, -1)),
      };
    }
  }
  // Every stroke is a case above; a stroke outside the union reaches here.
  const unknown: never = props.stroke;
  throw new Error(`no long-tool stroke ${String(unknown)}`);
}

/*
 * The path of a long tool through one stroke, as a function of the stroke's
 * share: the trailing grip, the tool's line from that grip toward its face, the
 * face's facing, the lead hand's slide along the line from the trailing grip,
 * and how far the stroke reaches toward the work (for the trunk's bow). A swung
 * stroke (`chop`, `side`, `swing`) turns the line in the one plane holding its
 * top and its contact, about that plane's normal, the face facing the way the
 * head travels, so it arrives at the work from the stroke's direction; the lead
 * hand slides down to the trailing hand on the downswing (Freivalds 1986 for a
 * shovel's and an axe's two-hand holds). A dig drives the blade below the
 * ground, levers it, lifts it and swings it toward where the load goes; a rake
 * pulls the tines along the ground toward the performer and lifts them back.
 * Keys between are eased with minimum jerk.
 */
export namespace LongToolStroke {
  /*
   * What a stroke is built from.
   */
  export interface IProps {
    /*
     * The stroke.
     */
    stroke: IAutoMovieMotionHumanLongTool.Stroke;

    /*
     * The work point, world metres.
     */
    at: IAutoMovieVector3;

    /*
     * Where a dug load goes, world metres.
     */
    to?: IAutoMovieVector3;

    /*
     * The tool's length from the trailing grip to its face, metres.
     */
    length: number;

    /*
     * The performer's horizontal facing.
     */
    forward: IAutoMovieVector3;

    /*
     * The horizontal direction toward the lead hand's side.
     */
    leadward: IAutoMovieVector3;

    /*
     * The upper chest, world metres.
     */
    chest: IAutoMovieVector3;

    /*
     * The pelvis, world metres.
     */
    hips: IAutoMovieVector3;

    /*
     * The trailing shoulder, world metres.
     */
    trail: IAutoMovieVector3;

    /*
     * The lead shoulder, world metres.
     */
    lead: IAutoMovieVector3;
  }

  /*
   * The tool at one share of a stroke.
   */
  export interface IPose {
    /*
     * The trailing grip, world metres.
     */
    grip: IAutoMovieVector3;

    /*
     * The unit line from the trailing grip toward the face.
     */
    line: IAutoMovieVector3;

    /*
     * The unit way the face faces, square to the line.
     */
    facing: IAutoMovieVector3;

    /*
     * The lead hand along the line from the trailing grip, metres.
     */
    slide: number;

    /*
     * How far toward the work the stroke has come, 0 to 1.
     */
    reach: number;
  }

  /*
   * A named instant of a stroke.
   */
  export interface IMark {
    /*
     * The event's name, numbered by the stroke.
     */
    name: string;

    /*
     * Its share of the stroke.
     */
    share: number;
  }

  /*
   * A stroke built from its props.
   */
  export interface IStroke {
    /*
     * Seconds of one stroke.
     */
    period: number;

    /*
     * The stroke's named instants.
     */
    marks: readonly IMark[];

    /*
     * The trailing grip where the face meets the work.
     */
    contact: IAutoMovieVector3;

    /*
     * The horizontal direction toward the lead hand's side.
     */
    leadward: IAutoMovieVector3;

    /*
     * The upper chest, world metres.
     */
    chest: IAutoMovieVector3;

    /*
     * The tool at a share of the stroke, from 0 to 1; 0 and 1 are the same
     * pose.
     */
    pose(share: number): IPose;
  }
}

/*
 * The alternatives of `SwingResult`'s site.
 */
type SwingResult = "period" | "leadward" | "chest";

/*
 * The alternatives of `OfSwung`'s site.
 */
type OfSwung = "period" | "leadward" | "chest";

/*
 * The alternatives of `OfBase`'s site.
 */
type OfBase = "period" | "leadward" | "chest";

/*
 * One key of a keyed stroke: the face, the line, the slide and the reach at a
 * share.
 */
interface IKey {
  /*
   * Its share.
   */
  share: number;

  /*
   * The face, world metres.
   */
  face: IAutoMovieVector3;

  /*
   * The line from the grip toward the face.
   */
  line: IAutoMovieVector3;

  /*
   * The lead hand's slide, metres.
   */
  slide: number;

  /*
   * The reach toward the work.
   */
  reach: number;
}
