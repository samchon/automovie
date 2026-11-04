import type { IAutoMovieHumanBodyCalibration } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import type { HumanCurveFinding } from "./HumanCurveFinding";
import { HumanCurveChain } from "./HumanCurveChain";
import { HumanCurveEar } from "./HumanCurveEar";
import { HumanCurveJoin } from "./HumanCurveJoin";
import { HumanCurveFoot } from "./HumanCurveFoot";
import { HumanCurveNose } from "./HumanCurveNose";
import { HumanCurveJaw } from "./HumanCurveJaw";
import { HumanCurveSides } from "./HumanCurveSides";

type V3 = [number, number, number];
type IHumanCurveFinding = HumanCurveFinding.IHumanCurveFinding;
const { auditChain }: typeof HumanCurveChain = HumanCurveChain;
const { auditEar }: typeof HumanCurveEar = HumanCurveEar;
const { auditHip, auditJoins, auditLegRoot }: typeof HumanCurveJoin = HumanCurveJoin;
const { auditBall, auditTips }: typeof HumanCurveFoot = HumanCurveFoot;
const { auditNoseBase, auditNoseFlank }: typeof HumanCurveNose = HumanCurveNose;
const { auditHeadMesh, auditJaw }: typeof HumanCurveJaw = HumanCurveJaw;
const { auditSides }: typeof HumanCurveSides = HumanCurveSides;

/** The curve audit of a body's chains. */
export namespace HumanCurveBody {
  /**
   * Every place a body's curves are mathematically unsound.
   *
   * Each rule is a property of curves and surfaces, in units that do not depend
   * on a person: nothing names a coordinate. Findings are gathered rather than
   * thrown one at a time, so a run fixes them together by cause.
   *
   * - `finite`, `stations`, `winding`: values, station order, ring orientation.
   * - `crossing`: a ring runs over itself.
   * - `slope`: a control point's station slope, against what the ring's width can
   *   need.
   * - `slide`: rings slip along themselves between layers, which shears skin.
   * - `overshoot`: a span swings past both of its layers.
   * - `crease`: tangent breaks along a longitudinal curve (G1).
   * - `band`: curvature flips within less than a radius, the ripple that reads
   *   as a horizontal stripe under light.
   * - `ridge`: the whole ring bends the same way at one height.
   * - `ripple`: a section's curvature flips more often than its anatomy needs.
   * - `alias`: a face's section turns by most of a corner within one control.
   * - `ledge`: the skin beside the nose steps with height, a ridge off the lip.
   * - `base`: the nose's base turns at a shelf's edge instead of a radius.
   * - `jaw`: the lower face rolls into the neck with no border to turn under.
   * - `facet`: the jaw's border shades as facets, its skin turning by a large
   *   angle across one cell of the mesh.
   * - `pit`: a nostril's closure shades as streaks, its walls turning by a large
   *   angle across one cell of the mesh.
   * - `rib`: a foot's or toe's longitudinal curve turns sharply for its ring's
   *   size, the line a section prints across the skin.
   * - `ball`: a web runs a groove back into the padded ball of the foot.
   * - `dome`: a toe or digit closes by a dome that leaves its tube at an angle,
   *   the rim round a flat pad.
   * - `gap`, `seam`: a join is open (G0) or kinks across its seam (G1).
   * - `fold`: a limb's or the trunk's join turns within a few millimetres of its
   *   ring, though the tangent planes agree on the ring itself.
   * - `midline`, `mirror`: a limb crosses the plane of symmetry, or the sides
   *   differ by more than their own inputs say.
   * - `rim-slide`, `ear-fold`, `ear-crossing`: an ear's rim leaves its phase, its
   *   cells reverse along the chain, or a section runs over itself round more
   *   than a pinch's corner.
   *
   * @param person Name in the findings.
   * @param body The generated body.
   * @param generated Chains audited.
   * @param mandible Half the person's mandibular width input, in the body's
   *   millimetres: the jaw is read at shares of its own width. Without it the
   *   jaw is read at shares of the lower head's.
   * @param rebuild Where a reflected point of a chain lands when rebuilt to the
   *   other side's own inputs (`HumanAnatomyMirror.limbs`), so the sides are
   *   compared under their own inputs; without it, the plain reflection.
   */
  export function auditHumanCurves(
    person: string,
    body: IAutoMovieHumanBodyCalibration,
    generated: RegExp,
    mandible?: number,
    rebuild?: (chain: string, q: V3) => V3,
  ): IHumanCurveFinding[] {
    const groups: Map<string, IHumanCurveFinding> = new Map();

    // A finding joins the group of its region, rule and place, keeping the worst.
    const report: (region: string, rule: string, where: string, value: number, limit: number, point?: readonly number[]) => void = (
      region: string,
      rule: string,
      where: string,
      value: number,
      limit: number,
      point: readonly number[] = [],
    ): void => {
      const key: string = [region, rule, where].join("|");
      const found: IHumanCurveFinding | undefined = groups.get(key);
      if (found === undefined)
        groups.set(key, {
          person,
          region,
          rule,
          where,
          value,
          limit,
          count: 1,
          point: [...point],
        });
      else {
        found.count++;
        if (value > found.value) {
          found.value = value;
          found.point = [...point];
        }
      }
    };
    const chains: IAutoMovieHumanLoftChain[] = body.chains.filter(
      (c: IAutoMovieHumanLoftChain): boolean => generated.test(c.name),
    );
    for (const chain of chains) {
      auditChain(chain, report);
      if (/^ear\./.test(chain.name)) auditEar(chain, report);
    }
    auditJoins(body, generated, report);
    auditTips(body, chains, report);
    auditBall(body, generated, report);
    auditSides(body, report, rebuild);
    auditHip(body, generated, report);
    auditLegRoot(body, generated, report);
    if (generated.test("head.middle")) {
      auditNoseFlank(body, report);
      auditNoseBase(body, report);
      auditJaw(body, report, mandible);
      auditHeadMesh(body, report, mandible);
    }
    return [...groups.values()];
  }
}
