import type { IAutoMovieVector3 } from "@automovie/interface";
import { LongToolStroke } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** A point. */
const P = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });

/** A unit along a direction. */
const unit = (v: IAutoMovieVector3): IAutoMovieVector3 => {
  const n: number = Math.hypot(v.x, v.y, v.z);
  return P(v.x / n, v.y / n, v.z / n);
};

/** A performer facing +Z, the lead side +X, working a 1.5 m tool at (0, 0, 1). */
const PROPS: LongToolStroke.IProps = {
  stroke: "rake",
  at: P(0, 0, 1),
  length: 1.5,
  forward: P(0, 0, 1),
  leadward: P(1, 0, 0),
  chest: P(0, 1.3, 0),
  hips: P(0, 1, 0),
  trail: P(-0.2, 1.4, 0),
  lead: P(0.2, 1.4, 0),
};

/**
 * `LongToolStroke` is a long tool's path through one stroke: a rake pulls its
 * tines along the ground and lifts them back, a dig drives, levers and throws
 * its blade, and a chop turns the tool's line in one plane from its top to the
 * contact and back.
 *
 * Scenarios:
 *
 * 1. A rake's tines touch the ground 0.25 m beyond the work at a tenth of the
 *    stroke and are pulled to 0.25 m short of it by six tenths, half way at
 *    0.35; its line is `0.85 f − 0.53 up`, its grip the line's length back from
 *    the face, and the stroke closes on itself.
 * 2. A dig's marks fall at its keys, and its contact is the grip with the blade
 *    0.15 m in the ground.
 * 3. A chop starts at its top, the tool over the lead shoulder raised 0.15 m,
 *    reaching nothing; at its contact, 0.35 of the stroke, the line runs from
 *    the hands in front of the hips to the work, the lead hand slid to a tenth
 *    of the tool.
 */
export function test_unit_motions_tasks_long_tool_stroke(): void {
  const rake: LongToolStroke.IStroke = LongToolStroke(PROPS);
  const line: IAutoMovieVector3 = unit(P(0, -0.53, 0.85));
  const back = (face: IAutoMovieVector3): IAutoMovieVector3 =>
    P(face.x - 1.5 * line.x, face.y - 1.5 * line.y, face.z - 1.5 * line.z);
  TestValidator.predicate(
    "the rake",
    rake.period === 1.6 &&
      rake.marks.length === 2 &&
      rake.marks[0]!.share === 0.1 &&
      rake.marks[1]!.share === 0.6 &&
      vclose(rake.contact, back(P(0, 0, 0.75)), 1e-12) &&
      vclose(rake.pose(0.1).grip, back(P(0, 0, 1.25)), 1e-12) &&
      vclose(rake.pose(0.35).grip, back(P(0, 0, 1)), 1e-12) &&
      vclose(rake.pose(0.35).line, line, 1e-12) &&
      vclose(rake.pose(1).grip, rake.pose(0).grip, 1e-12),
  );

  const dig: LongToolStroke.IStroke = LongToolStroke({
    ...PROPS,
    stroke: "dig",
  });
  const steep: IAutoMovieVector3 = unit(P(0, -0.85, 0.45));
  TestValidator.predicate(
    "the dig",
    dig.period === 3 &&
      dig.marks.map((m: LongToolStroke.IMark): number => m.share).join() ===
        "0.15,0.25,0.4,0.75" &&
      vclose(
        dig.contact,
        P(-1.5 * steep.x, -0.15 - 1.5 * steep.y, 1 - 1.5 * steep.z),
        1e-12,
      ),
  );

  const chop: LongToolStroke.IStroke = LongToolStroke({
    ...PROPS,
    stroke: "chop",
  });
  const toward: IAutoMovieVector3 = unit(P(0, -1.05, 0.65));
  const contact: IAutoMovieVector3 = P(
    -1.5 * toward.x,
    -1.5 * toward.y,
    1 - 1.5 * toward.z,
  );
  const top: LongToolStroke.IPose = chop.pose(0);
  const hit: LongToolStroke.IPose = chop.pose(0.35);
  TestValidator.predicate(
    "the chop",
    chop.period === 1.6 &&
      chop.marks[0]!.share === 0.35 &&
      vclose(chop.contact, contact, 1e-12) &&
      vclose(top.grip, P(0.2, 1.55, 0), 1e-12) &&
      top.reach === 0 &&
      nclose(top.slide, 0.9, 1e-12) &&
      vclose(hit.grip, contact, 1e-12) &&
      vclose(hit.line, toward, 1e-9) &&
      hit.reach === 1 &&
      nclose(hit.slide, 0.15, 1e-12),
  );
}
