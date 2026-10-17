import {
  type AutoMovieCurveParentContext,
  type IAutoMovieCurve64 as C,
} from "@automovie/engine";

import type { IAutoMovieCurveRegion64 as R } from "../../IAutoMovieCurveRegion64";
import { HandCurveDecode as D } from "./HandCurveDecode";
import { HandCurveMath as M } from "./HandCurveMath";
import { HandPalmFamily } from "./HandPalmFamily";
import { IHandCurveMeasurements as P } from "./IHandCurveMeasurements";

/** Construct both hands from one wrist collar and five branched digit families per side.
 *
 * Sections and longitudinal guides share cubic tensors before publication. Dimensions resolve through leftHand/rightHand before any course is built; the owner publishes the actual wrist controls and longitudinal field for arms to consume. These are base construction curves, not a lofted or articulated skin surface.
 */
export class HandCurveFactory implements R.Factory {
  /** Region identifier for both side groups and assembly ownership. */
  public readonly region: string = "hands";

  /** Independent clone of both side recipes, retained across construct calls. */
  private readonly measurements: P.Bilateral;

  /** Check finite dimensions, positive radii/lengths, station ranges and unique station names, then clone the recipes. nativeA preserves supplied directions; neutralT projects and straightens the chains in the palm plane. */
  public constructor(
    measurements: P.Bilateral,
    private readonly pose: "nativeA" | "neutralT" = "neutralT",
  ) {
    const check: (value: unknown) => void = (value: unknown): void => {
      if (typeof value === "number" && !Number.isFinite(value))
        throw new Error("Hand dimensions must be finite");
      if (value !== null && typeof value === "object")
        for (const child of Object.values(value)) check(child);
    };
    check(measurements);
    for (const side of ["left", "right"] as const) {
      const p: P.Detailed = measurements[side];
      if (p.region !== "hands")
        throw new Error("A hand measurement record is required");
      if (
        !(
          p.palmLengthMm > 0 &&
          p.traits.handBreadthScale > 0 &&
          p.traits.handDepthScale > 0
        )
      )
        throw new Error("Positive independent palm dimensions required");
      for (const section of [p.wristSection, p.proximalPalmSection])
        if (!(section.majorRadiusMm > 0 && section.minorRadiusMm > 0))
          throw new Error("Positive wrist/palm jet radius scales required");
      for (const d of D.digits) {
        const finger: P.Finger = p.digits[d];
        if (
          finger.segments.length !== 2 ||
          finger.segments.some(
            (v: P.Angles & { lengthMm: number }): boolean => !(v.lengthMm > 0),
          ) ||
          !(p.traits.digitLengthScale[d] > 0) ||
          !(finger.skinTip.reachMm > 0)
        )
          throw new Error("Positive measured phalange lengths required");
        if (
          finger.tubeSections.filter(
            (s: P.TubeSection): boolean => s.name !== "middle_0.00",
          ).length < 2 ||
          finger.tubeSections.some(
            (s: P.TubeSection): boolean =>
              !(
                s.ellipseMajorRadiusMm > 0 &&
                s.ellipseMinorRadiusMm > 0 &&
                s.fraction >= 0 &&
                s.fraction <= 1
              ),
          )
        )
          throw new Error(
            "Ordered physical tube sections with positive radii required",
          );
        if (
          finger.tubeSections.some(
            (s: P.TubeSection): boolean => ![0, 1, 2].includes(s.segment),
          ) ||
          ![0, 1].includes(finger.rootThickness.segment) ||
          !(
            finger.rootThickness.fraction >= 0 &&
            finger.rootThickness.fraction <= 1 &&
            finger.rootThickness.dorsalReachMm > 0 &&
            finger.rootThickness.volarReachMm > 0
          )
        )
          throw new Error(
            "Resolved segment fractions and positive root skin reaches required",
          );
        if (
          new Set(finger.tubeSections.map((s: P.TubeSection): string => s.name))
            .size !== finger.tubeSections.length
        )
          throw new Error(
            "A tube section name must identify one physical station",
          );
      }
    }
    this.measurements = structuredClone(measurements);
  }

  /** Emit world-millimetre cubic courses and owned wrist boundaries; reject incoming sections because hands are upstream wrist owners.
   *
   * Wrist fullJ is dP/ds for the common longitudinal millimetre chart, obtained by dividing dP/dt by its mean projection onto the distal wrist axis. The four angular intervals sum to one turn; this physical chart is not a claim of skin arc length.
   */
  public construct(
    context: AutoMovieCurveParentContext,
    upstream: ReadonlyMap<string, C.Boundary>,
  ): R.Result {
    if (upstream.size !== 0)
      throw new Error(
        "Hands own the wrist and have no incoming anatomical section",
      );
    const groups: { part: string; side: P.Side; primitives: C.Primitive[] }[] =
      [];
    const boundaries: { bone: string; value: C.Boundary }[] = [];
    for (const side of ["left", "right"] as const) {
      const decoded: D.Decoded = D.decode(
        this.measurements[side],
        context,
        side,
        this.pose,
      );
      const curves: M.Curve[] = this.generate(decoded, side);
      // Reflection changes angular indexing, never the already resolved points.
      const winding: (spans: M.S[]) => M.S[] = (spans: M.S[]): M.S[] =>
        side === "right"
          ? [...spans].reverse().map((s: M.S): M.S => [...s].reverse() as M.S)
          : spans;
      const primitives: C.Cubic[] = curves.map(
        (c: M.Curve): C.Cubic =>
          M.primitive({
            ...c,
            name: c.name + (side === "right" ? "Right" : ""),
            spans: c.closed ? winding(c.spans) : c.spans,
          }),
      );
      if (
        primitives.some(
          (c: C.Cubic): boolean => !c.spans.flat(2).every(Number.isFinite),
        )
      )
        throw new Error("Hand construction arithmetic is unresolved");
      const tensor: M.Tensor = decoded.wristTensor;
      const section: M.S[] = winding(tensor[0]);
      const rawJ: M.S[] = winding(
        tensor[0].map(
          (s: M.S, i: number): M.S =>
            s.map(
              (p: M.V, j: number): M.V => M.mul(M.sub(tensor[1][i]![j]!, p), 3),
            ) as M.S,
        ),
      );
      const axis: M.V = M.unit(decoded.wrist.n);
      // Convert the normalized collar derivative to the common longitudinal
      // millimetre chart; the arms consumer must retain this same parameter.
      const jacobian: number =
        rawJ
          .flat()
          .reduce((sum: number, p: M.V): number => sum + M.dot(p, axis), 0) /
        16;
      if (!(jacobian > 0 && Number.isFinite(jacobian)))
        throw new Error("The actual wrist continuation must increase distally");
      const id: string = side + ".wrist.midTube";
      const value: C.Boundary = {
        id,
        section: {
          type: "cubicBezier",
          name: id,
          closed: true,
          unit: "mm",
          phaseUnit: "turn",
          phaseIntervals: [0.25, 0.25, 0.25, 0.25],
          spans: section,
        },
        fullJ: rawJ.map(
          (s: M.S): M.S =>
            s.map((p: M.V): M.V => M.mul(p, 1 / jacobian)) as M.S,
        ),
        longitudinalUnit: "mm",
        longitudinalAxis: axis,
      };
      groups.push({ part: "hands", side, primitives });
      boundaries.push({ bone: side + "Hand", value });
    }
    return { groups, boundaries };
  }

  /** Generate branch loops, intermediate sections, digit meridians, knuckle arches and palm courses from the same resolved generators. */
  private generate(data: D.Decoded, side: P.Side): M.Curve[] {
    const net: M.Curve[] = [];
    const sections: Record<string, M.Curve[]> = {},
      roots: Record<string, M.Curve> = {};
    const rootNodes: Record<string, M.V[]> = {},
      handles: Record<string, M.V[]> = {};
    const fields: Record<string, M.S[]> = {};
    for (let i: number = 0; i < D.digits.length; i++) {
      const d: P.Digit = D.digits[i]!;
      const digit: D.Digit = data.digits[d];
      const ss: M.Curve[] = digit.tubes.map(
        (s: D.Tube): M.Curve =>
          M.ellipse(
            `hand_${d}_${s.name}`,
            s.center,
            s.a,
            s.b,
            s.n,
            data.directions,
            side === "right" ? -1 : 1,
          ),
      );
      sections[d] = ss;
      // The thumb's outer root belongs to its proximal-joint plane, not the
      // distal palm's radial support. Reuse the first shaft's actual phase-zero
      // transverse offset at that joint; this is a section-width inference,
      // not a measured thenar contour. Mixing the distant palm support into
      // this root pulled the collar back across its shaft continuation.
      const q0: M.V = i
        ? data.webs[`${D.digits[i - 1]}-${d}` as P.Web]
        : M.add(
            digit.joints[1]!,
            M.sub(M.phase(ss[0]!, 0), digit.tubes[0]!.center),
          );
      const q2: M.V =
        i < 4
          ? data.webs[`${d}-${D.digits[i + 1]}` as P.Web]
          : data.palm["0.65"]!["Z-"]!;
      const nodes: M.V[] = [q0, digit.dorsal, q2, digit.volar];
      rootNodes[d] = nodes;
      roots[d] = M.curve(`hand_${d}_branchJunction`, nodes, new Map(), true);
      // Shared 0.22-distance handles bound branch continuation by local spacing;
      // the factor is a construction convention, not a population measurement.
      handles[d] = nodes.map(
        (p: M.V, k: number): M.V =>
          M.mul(
            M.unit(digit.tubes[0]!.n),
            0.22 * M.norm(M.sub(M.phase(ss[0]!, k), p)),
          ),
      );
    }
    for (let i: number = 0; i < 4; i++) {
      const one: P.Digit = D.digits[i]!,
        two: P.Digit = D.digits[i + 1]!;
      const q: M.V = rootNodes[one]![2]!;
      const a: number = M.norm(M.sub(M.phase(sections[one]![0]!, 2), q));
      const b: number = M.norm(M.sub(M.phase(sections[two]![0]!, 0), q));
      const ja: M.V = data.digits[one].joints[one === "thumb" ? 1 : 0]!,
        jb: M.V = data.digits[two].joints[0]!;
      const h: M.V = M.mul(M.unit(M.sub(jb, ja)), 0.22 * Math.min(a, b));
      handles[one]![2] = M.mul(h, -1);
      handles[two]![0] = h;
    }
    for (const [d, k, key] of [
      ["middle", 1, "X+"],
      ["thumb", 3, "X-"],
      ["pinky", 2, "Z-"],
    ] as const) {
      const node: M.V = rootNodes[d]![k]!;
      let previous: M.V = data.palm["0.65"]![key]!;
      if (M.norm(M.sub(node, previous)) < 1e-8)
        previous = data.palm["0.45"]![key]!;
      const cap: number = 0.22 * M.norm(M.sub(node, previous));
      handles[d]![k] = M.mul(
        M.unit(handles[d]![k]!),
        Math.min(M.norm(handles[d]![k]!), cap),
      );
    }
    for (const d of D.digits) {
      const root: M.Curve = roots[d]!,
        ss: M.Curve[] = sections[d]!;
      // This is a periodic vector field, not a geometric contour. Centered
      // differences retain rigid covariance even when opposite jets coincide;
      // normalizing their near-zero difference would amplify roundoff.
      const vectors: M.V[] = handles[d]!;
      const angularHandles: Map<number, M.V> = new Map(
        vectors.map((_: M.V, i: number): [number, M.V] => [
          i,
          M.mul(M.sub(vectors[(i + 1) % 4]!, vectors[(i + 3) % 4]!), 1 / 6),
        ]),
      );
      const field: M.S[] = M.curve(
        "branchRootJetField",
        vectors,
        angularHandles,
        true,
      ).spans;
      const distance: number = Math.min(
        ...Array.from({ length: 8 }, (_: unknown, i: number): number =>
          M.norm(M.sub(M.phase(ss[1]!, i / 2), M.phase(ss[0]!, i / 2))),
        ),
      );
      const endH: M.V = M.mul(
        M.unit(data.digits[d].tubes[0]!.n),
        0.22 * distance,
      );
      const tensor: M.Tensor = M.tensor(root, ss[0]!, field, endH);
      fields[d] = field;
      net.push(root, M.section(tensor, 0.5, `hand_${d}_branchMid`), ...ss);
      const tip: M.V = data.digits[d].tip;
      for (let k: number = 0; k < 4; k++) {
        const p: number = k / 2;
        const a: M.V[] = ss.map((s: M.Curve): M.V => M.phase(s, p)),
          b: M.V[] = ss.map((s: M.Curve): M.V => M.phase(s, p + 2));
        // A shared 0.45-distance tip handle rounds the two opposing meridians.
        const tipH: M.V = M.mul(
          M.unit(M.sub(b.at(-1)!, a.at(-1)!)),
          0.45 *
            Math.min(
              M.norm(M.sub(a.at(-1)!, tip)),
              M.norm(M.sub(b.at(-1)!, tip)),
            ),
        );
        const core: M.Curve = M.curve(
          "core",
          [...a, tip, ...[...b].reverse()],
          new Map([
            [0, endH],
            [a.length, tipH],
            [a.length + b.length, M.mul(endH, -1)],
          ]),
        );
        net.push({
          name: `hand_${d}_meridian${k}`,
          closed: false,
          spans: [
            M.longitudinal(tensor, p),
            ...core.spans,
            [...M.longitudinal(tensor, p + 2)].reverse() as M.S,
          ],
        });
      }
    }
    for (let i: number = 0; i < 8; i++)
      net.push(
        M.curve(
          "hand_knuckleArch_" + (i / 2).toFixed(1),
          D.digits.slice(1).map((d: P.Digit): M.V => M.phase(roots[d]!, i / 2)),
        ),
      );
    net.push(...HandPalmFamily.construct(data, roots, fields));
    return net;
  }
}
