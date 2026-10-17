import type { AutoMovieCurveParentContext } from "@automovie/engine";

import { HandCurveMath as M } from "./HandCurveMath";
import { IHandCurveMeasurements as P } from "./IHandCurveMeasurements";

/** Resolve measurement charts, deformations and Hand parents before generating cubic courses. */
export namespace HandCurveDecode {
  /** Branch order shared by the four web pairs and knuckle arches. */
  export const digits: readonly P.Digit[] = [
    "thumb",
    "index",
    "middle",
    "ring",
    "pinky",
  ];

  /** Transverse basis for a nonzero normal, built by projecting gauge +X off that normal. */
  export type Frame = {
    /** Unit longitudinal normal. */
    n: M.V;

    /** Unit projection of gauge +X into the normal plane. */
    u: M.V;

    /** Unit cross product n cross u, completing the right-handed basis. */
    v: M.V;
  };

  /** Parent-resolved cardinal section used to generate the wrist collar. */
  export type Section = {
    /** Four world positions in millimetres, ordered breadth+, depth+, breadth-, depth-. */
    q: M.V[];

    /** Resolved transverse u direction used for cubic handles. */
    u: M.V;

    /** Resolved pre-chirality n cross u direction used for cubic handles; a side reflection can reverse world handedness. */
    v: M.V;

    /** Resolved normal, transformed by inverse scale for a deformed palm section. */
    n: M.V;

    /** Smaller undeformed input radius in millimetres, retained as the longitudinal handle scale. */
    radiusMin: number;
  };

  /** Affinely transformed ellipse generator, before four-span cubic approximation. */
  export type Tube = {
    /** Unique station name within its digit. */
    name: string;

    /** World centre in millimetres. */
    center: M.V;

    /** First generating semiaxis vector in millimetres; affine scaling need not preserve orthogonality with b. */
    a: M.V;

    /** Second generating semiaxis vector in millimetres. */
    b: M.V;

    /** Unit world normal transformed by inverse scale. */
    n: M.V;
  };

  /** World-space inputs shared by the branch sections and longitudinal guides. */
  export type Digit = {
    /** Three mechanical root positions in millimetres after trait deformation. */
    joints: M.V[];

    /** Ordered skin-section generators; these centres are distinct from mechanical joints. */
    tubes: Tube[];

    /** Distal skin endpoint in millimetres. */
    tip: M.V;

    /** Dorsal skin support at the declared root-thickness station. */
    dorsal: M.V;

    /** Volar skin support at the same station. */
    volar: M.V;
  };

  /** Resolved unilateral family in world millimetres; all courses use these same generators.
   *
   * @author Samchon
   */
  export interface Decoded {
    /** Undeformed owned wrist section. */
    wrist: Section;

    /** Trait-deformed proximal palm section. */
    proximal: Section;

    /** Four longitudinal Bernstein rows joining wrist and proximal sections. */
    wristTensor: M.Tensor;

    /** Wrist endpoint handle displacement in millimetres, along its normal. */
    h0: M.V;

    /** Proximal endpoint handle displacement in millimetres, along its normal. */
    h1: M.V;

    /** Five parent-resolved digit generators. */
    digits: Record<P.Digit, Digit>;

    /** Named station supports in millimetres; X+/X-/Z+/Z- label dorsal/thenar/radial/ulnar roles in the construction gauge. */
    palm: Record<string, Record<string, M.V>>;

    /** Shared world junction positions for adjacent branches. */
    webs: Record<P.Web, M.V>;

    /** Parent-resolved gauge +Z and +X directions used to align section phase and locate supports. */
    directions: [M.V, M.V];

    /** Registration origin resolved through the actual Hand parent, in millimetres. */
    wristOrigin: M.V;
  }

  /** Build the Rz * Ry * Rx registration matrix from angles in radians; the origin is handled separately. */
  export function rotation(p: P.Detailed["registration"]): [M.V, M.V, M.V] {
    const cx: number = Math.cos(p.rotationXrad),
      sx: number = Math.sin(p.rotationXrad);
    const cy: number = Math.cos(p.rotationYrad),
      sy: number = Math.sin(p.rotationYrad);
    const cz: number = Math.cos(p.rotationZrad),
      sz: number = Math.sin(p.rotationZrad);
    return [
      [cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx],
      [sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx],
      [-sy, cy * sx, cy * cx],
    ];
  }

  /** Convert measurement-chart azimuth and elevation in radians to a unit direction. */
  export function vector(p: P.Angles): M.V {
    return [
      Math.cos(p.elevationRad) * Math.cos(p.azimuthRad),
      Math.cos(p.elevationRad) * Math.sin(p.azimuthRad),
      Math.sin(p.elevationRad),
    ];
  }

  /** For a nonzero input normal, project gauge +X into its transverse plane; reject a singular transverse projection. Callers supply the nonzero-normal precondition. */
  export function plane(n0: M.V): Frame {
    const n: M.V = M.unit(n0),
      u: M.V = M.unit(M.sub([1, 0, 0], M.mul(n, n[0])));
    if (M.norm(u) < 0.5)
      throw new Error(
        "Source plane convention is singular at the global X axis",
      );
    return { n, u, v: M.cross(n, u) };
  }

  /** Clone the recipe and straighten each digit along its proximal direction projected into the palm plane; this construction convention does not solve joint motion or skin deformation. */
  export function neutral(source: P.Detailed): P.Detailed {
    const p: P.Detailed = structuredClone(source);
    const r: [M.V, M.V, M.V] = rotation(p.registration);
    const mid: P.Finger = p.digits.middle;
    const dorsal: M.V = plane(
      M.matrix(r, [
        mid.rootLongitudinalRatio,
        mid.rootBreadthRatio,
        mid.rootDepthRatio,
      ]),
    ).u;
    const localDorsal: M.V = M.matrix(M.transpose(r), dorsal);
    for (const d of digits) {
      const digit: P.Finger = p.digits[d];
      const first: P.Angles = digit.segments[0]!;
      const sourceDirection: M.V = vector(first);
      const direction: M.V = M.unit(
        M.sub(
          sourceDirection,
          M.mul(localDorsal, M.dot(sourceDirection, localDorsal)),
        ),
      );
      if (M.norm(direction) < 0.5)
        throw new Error(
          "A proximal digit cannot project to zero in the palm plane",
        );
      const angles: P.Angles = {
        azimuthRad: Math.atan2(direction[1], direction[0]),
        elevationRad: Math.asin(Math.max(-1, Math.min(1, direction[2]))),
      };
      for (const segment of digit.segments) Object.assign(segment, angles);
      Object.assign(digit.skinTip.distalAxisAngles, angles);
    }
    return p;
  }

  /** Clone the selected pose recipe, apply dimension traits in its registered chart, then resolve every point and direction through the actual side Hand parent. The nativeA selector preserves supplied chain directions; the neutralT selector first applies the planar straightening convention. */
  export function decode(
    source: P.Detailed,
    context: AutoMovieCurveParentContext,
    side: P.Side,
    pose: "nativeA" | "neutralT",
  ): Decoded {
    const p: P.Detailed =
      pose === "neutralT" ? neutral(source) : structuredClone(source);
    const r: [M.V, M.V, M.V] = rotation(p.registration),
      rt: [M.V, M.V, M.V] = M.transpose(r);
    const origin: M.V = [
      p.registration.wristWorldXmm,
      p.registration.wristWorldYmm,
      p.registration.wristWorldZmm,
    ];
    const mid: P.Finger = p.digits.middle;
    const long: M.V = M.unit(
      M.matrix(r, [
        mid.rootLongitudinalRatio,
        mid.rootBreadthRatio,
        mid.rootDepthRatio,
      ]),
    );
    const dorsal: M.V = plane(long).u;
    const sourceAxes: [M.V, M.V, M.V] = [long, dorsal, M.cross(long, dorsal)];
    const bone: string = side + "Hand",
      sign: number = side === "left" ? 1 : -1;
    // The shared Context has actual model-axis bone frames. Explicitly convert
    // source gauge to the neutral palm frame, then resolve this Hand parent once.
    const localDirection: (v: M.V) => M.V = (v: M.V): M.V => {
      const a: M.V = pose === "neutralT" ? M.matrix(sourceAxes, v) : [...v];
      return [sign * a[0], a[1], a[2]];
    };
    const direction: (v: M.V) => M.V = (v: M.V): M.V => [
      ...context.direction(bone, localDirection(v)),
    ];
    const point: (q: M.V) => M.V = (q: M.V): M.V => [
      ...context.point(bone, localDirection(M.sub(q, origin))),
    ];
    const scaleVector: (v: M.V) => M.V = (v: M.V): M.V =>
      M.matrix(
        r,
        M.matrix(rt, v).map(
          (x: number, i: number): number =>
            x * [1, p.traits.handBreadthScale, p.traits.handDepthScale][i]!,
        ) as M.V,
      );
    const normalVector: (v: M.V) => M.V = (v: M.V): M.V =>
      M.unit(
        M.matrix(
          r,
          M.matrix(rt, v).map(
            (x: number, i: number): number =>
              x / [1, p.traits.handBreadthScale, p.traits.handDepthScale][i]!,
          ) as M.V,
        ),
      );
    const affine: (v: M.V) => M.V = (v: M.V): M.V =>
      M.add(origin, scaleVector(M.sub(v, origin)));
    const section: (d: P.Section, deform: boolean) => Section = (
      d: P.Section,
      deform: boolean,
    ): Section => {
      const o: M.V = M.add(
        origin,
        M.matrix(r, [
          d.origin.longitudinalMm,
          d.origin.breadthMm,
          d.origin.thicknessMm,
        ]),
      );
      const f: Frame = plane(M.matrix(r, vector(d.normalAngles)));
      const labels: readonly (
        | "breadthPositive"
        | "depthPositive"
        | "breadthNegative"
        | "depthNegative"
      )[] = [
        "breadthPositive",
        "depthPositive",
        "breadthNegative",
        "depthNegative",
      ];
      const q: M.V[] = labels.map((label: (typeof labels)[number]): M.V => {
        const v: M.V = M.add(
          o,
          M.add(
            M.mul(f.u, d.cardinalDimensions[`${label}BreadthMm`]),
            M.mul(f.v, d.cardinalDimensions[`${label}DepthMm`]),
          ),
        );
        return point(deform ? affine(v) : v);
      });
      const n: M.V = deform ? normalVector(f.n) : f.n;
      const u: M.V = deform ? M.unit(scaleVector(f.u)) : f.u;
      return {
        q,
        n: direction(n),
        u: direction(u),
        v: direction(M.unit(M.cross(n, u))),
        radiusMin: Math.min(d.majorRadiusMm, d.minorRadiusMm),
      };
    };
    const wrist: Section = section(p.wristSection, false),
      proximal: Section = section(p.proximalPalmSection, true);
    const base: Record<P.Digit, M.V[]> = {} as Record<P.Digit, M.V[]>;
    const decoded: Record<P.Digit, Digit> = {} as Record<P.Digit, Digit>;
    for (const d of digits) {
      const def: P.Finger = p.digits[d];
      const joints: M.V[] = [
        M.add(
          origin,
          M.matrix(
            r,
            M.mul(
              [
                def.rootLongitudinalRatio,
                def.rootBreadthRatio,
                def.rootDepthRatio,
              ],
              p.palmLengthMm,
            ),
          ),
        ),
      ];
      for (const segment of def.segments)
        joints.push(
          M.add(
            joints.at(-1)!,
            M.mul(M.matrix(r, vector(segment)), segment.lengthMm),
          ),
        );
      base[d] = joints;
      const root: M.V = joints[d === "thumb" ? 1 : 0]!;
      const elong: (q: M.V) => M.V = (q: M.V): M.V =>
        M.add(root, M.mul(M.sub(q, root), p.traits.digitLengthScale[d]));
      const distal: M.V = M.matrix(r, vector(def.skinTip.distalAxisAngles)),
        tipFrame: Frame = plane(distal);
      const tip: M.V = M.add(
        M.add(joints[2]!, M.mul(distal, def.skinTip.reachMm)),
        M.add(
          M.mul(tipFrame.u, def.skinTip.offsetAcrossMm),
          M.mul(tipFrame.v, def.skinTip.offsetDepthMm),
        ),
      );
      const tubes: Tube[] = def.tubeSections
        .filter((s: P.TubeSection): boolean => s.name !== "middle_0.00")
        .map((s: P.TubeSection): Tube => {
          const n: M.V =
            s.segment < 2
              ? M.unit(M.sub(joints[s.segment + 1]!, joints[s.segment]!))
              : distal;
          const f: Frame = plane(n);
          const o: M.V = M.add(
            joints[s.segment]!,
            s.segment < 2
              ? M.mul(
                  M.sub(joints[s.segment + 1]!, joints[s.segment]!),
                  s.fraction,
                )
              : M.mul(distal, def.skinTip.reachMm * s.fraction),
          );
          const center: M.V = M.add(
            o,
            M.add(
              M.add(M.mul(f.u, s.centerAcrossMm), M.mul(f.v, s.centerDepthMm)),
              M.mul(n, s.centerAxialMm),
            ),
          );
          const a: M.V = M.mul(
            M.add(
              M.mul(f.u, Math.cos(s.ellipseRollRad)),
              M.mul(f.v, Math.sin(s.ellipseRollRad)),
            ),
            s.ellipseMajorRadiusMm,
          );
          const b: M.V = M.mul(
            M.add(
              M.mul(f.u, -Math.sin(s.ellipseRollRad)),
              M.mul(f.v, Math.cos(s.ellipseRollRad)),
            ),
            s.ellipseMinorRadiusMm,
          );
          return {
            name: s.name,
            center: point(affine(elong(center))),
            a: direction(scaleVector(a)),
            b: direction(scaleVector(b)),
            n: direction(normalVector(n)),
          };
        });
      const thickness: P.Finger["rootThickness"] = def.rootThickness,
        f: Frame = plane(
          M.sub(joints[thickness.segment + 1]!, joints[thickness.segment]!),
        );
      const o: M.V = M.add(
        joints[thickness.segment]!,
        M.mul(
          M.sub(joints[thickness.segment + 1]!, joints[thickness.segment]!),
          thickness.fraction,
        ),
      );
      decoded[d] = {
        joints: joints.map(
          (j: M.V, i: number): M.V =>
            point(affine(i >= (d === "thumb" ? 1 : 0) ? elong(j) : j)),
        ),
        tubes,
        tip: point(affine(elong(tip))),
        dorsal: point(
          affine(elong(M.add(o, M.mul(f.u, thickness.dorsalReachMm)))),
        ),
        volar: point(
          affine(elong(M.sub(o, M.mul(f.u, thickness.volarReachMm)))),
        ),
      };
    }
    const palm: Record<string, Record<string, M.V>> = {};
    const f: Frame = plane(M.sub(base.middle[0]!, origin));
    for (const [key, station] of Object.entries(p.palmSteering)) {
      const o: M.V = M.add(
        origin,
        M.mul(M.sub(base.middle[0]!, origin), station.fraction),
      );
      const q: Record<string, M.V> = {};
      for (const [axis, label] of [
        ["X+", "dorsal"],
        ["X-", "thenar"],
        ["Z+", "radialThumb"],
        ["Z-", "ulnar"],
      ] as const)
        q[axis] = point(
          affine(
            M.add(
              o,
              M.add(
                M.mul(f.u, station.measures[`${label}BreadthMm`]),
                M.mul(f.v, station.measures[`${label}DepthMm`]),
              ),
            ),
          ),
        );
      palm[key] = q;
    }
    const webs: Record<P.Web, M.V> = {} as Record<P.Web, M.V>;
    for (const pair of Object.keys(p.webs) as P.Web[]) {
      const [a, b]: P.Digit[] = pair.split("-") as P.Digit[];
      const ja: M.V[] = base[a!]!,
        jb: M.V[] = base[b!]!,
        i: number = a === "thumb" ? 1 : 0;
      const mid: M.V = M.mul(M.add(ja[i]!, jb[0]!), 0.5),
        scale: number =
          (M.norm(M.sub(ja[i + 1]!, ja[i]!)) + M.norm(M.sub(jb[1]!, jb[0]!))) /
          2;
      const w: P.Detailed["webs"][P.Web] = p.webs[pair];
      webs[pair] = point(
        affine(
          M.add(
            M.add(
              mid,
              M.matrix(
                r,
                M.mul(
                  [w.longitudinalRatio, w.breadthRatio, w.thicknessRatio],
                  scale,
                ),
              ),
            ),
            M.mul(M.transpose(r)[0], p.traits.webHeightOffsetMm[pair]),
          ),
        ),
      );
    }
    // A normalized collar parameter has endpoint derivatives 3*h0 and 3*h1.
    // These handle lengths are the shared 0.30-radius construction convention.
    const h0: M.V = M.mul(M.unit(wrist.n), 0.3 * wrist.radiusMin),
      h1: M.V = M.mul(M.unit(proximal.n), 0.3 * proximal.radiusMin);
    return {
      wrist,
      proximal,
      wristTensor: M.tensor(
        M.sourceSection("hand_sharedWrist", wrist.q, wrist.u, wrist.v),
        M.sourceSection(
          "hand_proximalPalm",
          proximal.q,
          proximal.u,
          proximal.v,
        ),
        h0,
        h1,
      ),
      h0,
      h1,
      digits: decoded,
      palm,
      webs,
      directions: [direction([0, 0, 1]), direction([1, 0, 0])],
      wristOrigin: point(origin),
    };
  }
}
