import type { IAutoMovieCurve64 as C } from "@automovie/engine";

import { FaceMath as F } from "./FaceMath";
import type { IAutoMovieFaceMeasurements as M } from "./IAutoMovieFaceMeasurements";

/** Emit auricular helix, cartilage, concha/lobule and insertion courses. Native X is subject-left. Each side maps posterior/superior/outward millimetres through mirrored yaw axes. Signed phase widths preserve traversal orientation; closed conventional insertion is separate from the observed open blend. The sinusoidal source is Hermite-approximated over its declared phases; these cubics are not exact ellipses or a closed ear mesh.
 *
 * @param spec Bilateral dimensions, bowed feature supports and additional parent translation; phase intervals must be nonzero and concha arcs need their own depth scale.
 * @returns Native Bernstein courses; cartilage branches and the lobule edge share their owning attachment endpoints. Lobule endpoint joins are C0/G1 across distinct course parameters, not a surface continuity certificate.
 * @author Samchon
 */
export function generateFaceEars(spec: M.Ears): F.Curve[] {
  const curves: F.Curve[] = [];
  const depth: (values: number[], t: number) => [number, number] = (
    values: number[],
    t: number,
  ): [number, number] => {
    // Cubic Lagrange interpolation uses four equally spaced whole-course
    // fractions. The derivative is with respect to that fraction; callers divide
    // by signed phase duration to obtain d(depth)/d(theta).
    const nodes: readonly number[] = [0, 1 / 3, 2 / 3, 1];
    let value: number = 0;
    let derivative: number = 0;
    nodes.forEach((node: number, i: number): void => {
      const others: number[] = nodes.filter(
        (_: number, j: number): boolean => j !== i,
      );
      const denom: number = others.reduce(
        (p: number, q: number): number => p * (node - q),
        1,
      );
      value +=
        (values[i]! *
          others.reduce((p: number, q: number): number => p * (t - q), 1)) /
        denom;
      derivative +=
        (values[i]! *
          others.reduce(
            (sum: number, _: number, j: number): number =>
              sum +
              others.reduce(
                (p: number, q: number, k: number): number =>
                  k === j ? p : p * (t - q),
                1,
              ),
            0,
          )) /
        denom;
    });
    return [value, derivative];
  };
  for (const side of ["left", "right"] as const) {
    const p: M.Ear = spec.ears[side];
    const sign: number = side === "left" ? 1 : -1;
    const yaw: number = (p.rotationDeg * Math.PI) / 180;
    const across: C.Vector = [sign * Math.sin(yaw), 0, -Math.cos(yaw)];
    const outward: C.Vector = [sign * Math.cos(yaw), 0, Math.sin(yaw)];
    const h: number = p.helixHeightMm;
    const w: number = p.breadthMm;
    const protrusion: number = p.protrusionMm;
    const world: (q: C.Vector) => F.V = (q: C.Vector): F.V =>
      [0, 1, 2].map(
        (i: number): number =>
          spec.parentFrame.originMm[i]! +
          p.originLocalMm[i]! +
          across[i]! * q[0] +
          (i === 1 ? q[1] : 0) +
          outward[i]! * q[2],
      ) as F.V;
    const emit: (name: string, spans: F.S[], radians?: number[]) => F.Curve = (
      name: string,
      spans: F.S[],
      radians?: number[],
    ): F.Curve => {
      const c: F.Curve = {
        name: "ear." + side + "." + name,
        closed: false,
        spans: spans.map((s: F.S): F.S => s.map(world) as F.S),
        ...(radians ? { signedRadians: radians } : {}),
      };
      curves.push(c);
      return c;
    };
    // pi/2, 0.15 and -0.85 rad are shared helix support locations. They are
    // authored shape choices, not independent anatomical measurements.
    const phases: number[] = [
      p.helixStartPhase,
      Math.PI / 2,
      0.15,
      -0.85,
      p.helixTailPhase,
    ];
    const helix: (theta: number) => [F.V, F.V] = (
      theta: number,
    ): [F.V, F.V] => {
      const s: number = Math.sin(theta);
      const c: number = Math.cos(theta);
      const duration: number = phases.at(-1)! - phases[0]!;
      const [n, dn]: [number, number] = depth(
        (["anterior", "superior", "posterior", "tail"] as const).map(
          (key: keyof M.Ear["helixDepthRatios"]): number =>
            p.helixDepthRatios[key] * protrusion,
        ),
        (theta - phases[0]!) / duration,
      );
      return [
        [
          w * 0.5 * c * (1 + p.inferiorTaperRatio * s) +
            p.crownLeanRatio * w * s,
          h * 0.5 * s,
          n,
        ],
        [
          w * 0.5 * (-s + p.inferiorTaperRatio * (c * c - s * s)) +
            p.crownLeanRatio * w * c,
          h * 0.5 * c,
          dn / duration,
        ],
      ];
    };
    const hermite: (
      a: number,
      b: number,
      at: (theta: number) => [F.V, F.V],
    ) => F.S = (
      a: number,
      b: number,
      at: (theta: number) => [F.V, F.V],
    ): F.S => {
      const [start, ds]: [F.V, F.V] = at(a);
      const [end, de]: [F.V, F.V] = at(b);
      return [
        start,
        F.add(start, ds, (b - a) / 3),
        F.add(end, de, -(b - a) / 3),
        end,
      ];
    };
    const helixCourse: F.Curve = emit(
      "helix.crest",
      phases
        .slice(1)
        .map((b: number, i: number): F.S => hermite(phases[i]!, b, helix)),
      phases.slice(1).map((b: number, i: number): number => b - phases[i]!),
    );
    const emitted: Partial<Record<M.EarFeature, F.Curve>> = {};
    for (const [name, feature] of Object.entries(p.features) as [
      M.EarFeature,
      M.Ear["features"][M.EarFeature],
    ][]) {
      const concha: boolean = name.startsWith("concha.");
      const scales: C.Vector = concha
        ? [p.concha.breadthMm, p.concha.lengthMm, p.concha.depthMm!]
        : [w, h, protrusion];
      const local: F.S[] = feature.arcs.map((arc: M.EarArc): F.S => {
        const vector: (v: M.EarRatio) => F.V = (v: M.EarRatio): F.V => [
          v.posteriorRatio * scales[0],
          v.heightRatio * scales[1],
          v.depthRatio * scales[2],
        ];
        const start: F.V = vector(arc.start);
        const end: F.V = vector(arc.end);
        const bow: F.V = vector(arc.bow);
        // A cubic with 4/3*bow on both interior controls has displacement
        // exactly bow from the straight endpoint chord at t=1/2.
        const s: F.S = [
          start,
          F.add(F.add(start, F.add(end, start, -1), 1 / 3), bow, 4 / 3),
          F.add(F.add(start, F.add(end, start, -1), 2 / 3), bow, 4 / 3),
          end,
        ];
        if (concha)
          s.forEach((q: F.V): void => {
            q[0] += p.concha.centerPosteriorRatio * w;
            q[1] += p.concha.centerHeightRatio * h;
          });
        return s;
      });
      // Average the two adjacent handle offsets around each shared knot.
      // Both local unit-span endpoint derivatives then equal 3*tangent.
      for (let i: number = 0; i < local.length - 1; i++) {
        const waist: F.V = local[i]![3];
        local[i + 1]![0] = waist;
        const tangent: F.V = F.mul(
          F.add(local[i + 1]![1], local[i]![2], -1),
          0.5,
        );
        local[i]![2] = F.add(waist, tangent, -1);
        local[i + 1]![1] = F.add(waist, tangent);
      }
      emitted[name] = emit(name, local);
    }
    const reanchor: (curve: F.Curve, point: F.V) => void = (
      curve: F.Curve,
      point: F.V,
    ): void => {
      const span: F.S = curve.spans[0]!;
      const delta: F.V = F.add(point, span[0], -1);
      span[0] = point;
      span[1] = F.add(span[1], delta);
    };
    const branch: F.V = emitted["antihelix.stem"]!.spans.at(-1)![3];
    for (const name of [
      "antihelix.superiorCrus",
      "antihelix.inferiorCrus",
    ] as const)
      reanchor(emitted[name]!, branch);
    for (const [before, after] of [
      ["tragus.visibleFold", "notch.visibleValley"],
      ["notch.visibleValley", "antitragus.crest"],
    ] as const)
      reanchor(emitted[after]!, emitted[before]!.spans.at(-1)![3]);
    const oval: (name: string, dims: M.EarOval, cy?: number) => F.Curve = (
      name: string,
      dims: M.EarOval,
      cy?: number,
    ): F.Curve => {
      const tilt: number = (dims.inclinationDeg * Math.PI) / 180;
      const ct: number = Math.cos(tilt);
      const st: number = Math.sin(tilt);
      const a: number = dims.startPhase;
      const b: number = dims.endPhase;
      const depths: number[] = (
        ["superior", "posterior", "inferior", "anterior"] as const
      ).map(
        (key: keyof M.EarOval["depthRatios"]): number =>
          dims.depthRatios[key] * (dims.depthMm ?? protrusion),
      );
      const at: (theta: number) => [F.V, F.V] = (theta: number): [F.V, F.V] => {
        const u: number = dims.breadthMm * 0.5 * Math.cos(theta);
        const y: number = dims.lengthMm * 0.5 * Math.sin(theta);
        const du: number = -dims.breadthMm * 0.5 * Math.sin(theta);
        const dy: number = dims.lengthMm * 0.5 * Math.cos(theta);
        const [n, dn]: [number, number] = depth(depths, (theta - a) / (b - a));
        return [
          [
            dims.centerPosteriorRatio * w + u * ct - y * st,
            (cy ?? dims.centerHeightRatio * h) + u * st + y * ct,
            n,
          ],
          [du * ct - dy * st, du * st + dy * ct, dn / (b - a)],
        ];
      };
      return emit(
        name,
        [0, 1, 2, 3].map(
          (i: number): F.S =>
            hermite(a + ((b - a) * i) / 4, a + ((b - a) * (i + 1)) / 4, at),
        ),
        [(b - a) / 4, (b - a) / 4, (b - a) / 4, (b - a) / 4],
      );
    };
    oval("concha.visibleRim", p.concha);
    // Construct the entire free edge in the same auricular chart as its
    // owning helix and lower attachment. An ellipse with relocated endpoints
    // left a thin pendant stalk; rounded shoulders must move with both joins.
    const tail: F.S = helixCourse.spans.at(-1)!;
    const attachment: F.S =
      emitted["attachment.visiblePosteriorBlend"]!.spans.at(-1)!;
    const zero: F.V = world([0, 0, 0]);
    const localPoint: (q: F.V) => F.V = (q: F.V): F.V => {
      const delta: F.V = F.add(q, zero, -1);
      return [
        delta.reduce(
          (sum: number, v: number, i: number): number => sum + v * across[i]!,
          0,
        ),
        delta[1],
        delta.reduce(
          (sum: number, v: number, i: number): number => sum + v * outward[i]!,
          0,
        ),
      ];
    };
    const start: F.V = localPoint(tail[3]);
    const end: F.V = localPoint(attachment[3]);
    const bottom: number = h * 0.5 - p.earLengthMm;
    const center: number = (start[0] + end[0]) / 2;
    const shoulderY: number = bottom + p.lobule.lengthMm / 4;
    if (!(bottom < shoulderY && shoulderY < Math.min(start[1], end[1])))
      throw new Error(
        "Lobule dimensions require inferior shoulders below both attachment endpoints",
      );
    const n: number = p.lobule.depthRatio * protrusion;
    const localLobule: F.Curve = F.curve("lobule", [
      start,
      [center + p.lobule.breadthMm / 2, shoulderY, n],
      [center, bottom, n],
      [center - p.lobule.breadthMm / 2, shoulderY, n],
      end,
    ]);
    const lobule: F.Curve = emit("lobule.freeEdge", localLobule.spans);
    lobule.normalizedWidths = [1 / 4, 1 / 4, 1 / 4, 1 / 4];
    // The attachment traverses downward, opposite to the returning lobule.
    // Endpoint tangent directions therefore follow helix-out and attachment-
    // reverse. Interior controls already share the common knot derivatives.
    // Cross-course parameter units differ, so these joins assert C0/G1 only.
    const first: F.S = lobule.spans[0]!;
    const last: F.S = lobule.spans.at(-1)!;
    const startMagnitude: number = F.norm(F.add(first[1], first[0], -1));
    const endMagnitude: number = F.norm(F.add(last[3], last[2], -1));
    const startDirection: F.V = F.add(tail[3], tail[2], -1);
    const endDirection: F.V = F.add(attachment[2], attachment[3], -1);
    if (!(F.norm(startDirection) > 0) || !(F.norm(endDirection) > 0))
      throw new Error(
        "Lobule joins require regular helix and attachment endpoint tangents",
      );
    first[0] = F.vec(tail[3]);
    first[1] = F.add(
      first[0],
      startDirection,
      startMagnitude / F.norm(startDirection),
    );
    last[3] = F.vec(attachment[3]);
    last[2] = F.add(
      last[3],
      endDirection,
      -endMagnitude / F.norm(endDirection),
    );
    const ih: number = p.insertionLengthMm;
    const iw: number = p.insertionBreadthMm;
    const k: number = F.K;
    const local: F.S[] = [
      [
        [0, ih / 2, 0],
        [0, ih / 2, (iw * k) / 2],
        [0, (ih * k) / 2, iw / 2],
        [0, 0, iw / 2],
      ],
      [
        [0, 0, iw / 2],
        [0, (-ih * k) / 2, iw / 2],
        [0, -ih / 2, (iw * k) / 2],
        [0, -ih / 2, 0],
      ],
      [
        [0, -ih / 2, 0],
        [0, -ih / 2, (-iw * k) / 2],
        [0, (-ih * k) / 2, -iw / 2],
        [0, 0, -iw / 2],
      ],
      [
        [0, 0, -iw / 2],
        [0, (ih * k) / 2, -iw / 2],
        [0, ih / 2, (-iw * k) / 2],
        [0, ih / 2, 0],
      ],
    ];
    curves.push({
      name: "ear." + side + ".attachment.conventionalInsertion",
      closed: true,
      spans: local.map(
        (s: F.S): F.S =>
          s.map(
            (q: F.V): F.V =>
              F.add(
                F.add(spec.parentFrame.originMm, p.insertionCenterLocalMm),
                q,
              ),
          ) as F.S,
      ),
    });
  }
  return curves;
}
