import { AutoMovieHumanConicLoft as H } from "../conic/AutoMovieHumanConicLoft";
import {
  AutoMovieHumanNativeFamily as Native,
} from "../conic/AutoMovieHumanNativeFamily";
import { AutoMovieHumanNativeFeatureLaw } from "../conic/AutoMovieHumanNativeFeatureLaw";
import { AutoMovieHumanNativeSourceLaw } from "../conic/AutoMovieHumanNativeSourceLaw";
import { AutoMovieHumanSegmentFrame as F } from "../frame/AutoMovieHumanSegmentFrame";
import {
  AutoMovieHumanF1NativeCalibration as Calibration,
} from "./AutoMovieHumanF1NativeCalibration";
import {
  AutoMovieHumanF1NativeCourse as LengthCourse,
} from "./AutoMovieHumanF1NativeCourse";
import { AutoMovieHumanF1NativeRoots } from "./AutoMovieHumanF1NativeRoots";
import type {
  AutoMovieVector2Tuple,
  AutoMovieVector3Tuple,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanF1,
  IAutoMovieHumanF1NativeLaw,
  IAutoMovieHumanNativeProjectionCourse,
  IAutoMovieLoftRelief,
  IAutoMovieLoftSectionFrame,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
  IAutoMovieViewPart,
} from "@automovie/interface";

/** Qualified native field/source construction under one immutable original invocation. */
export namespace AutoMovieHumanF1NativeBuild {
  /** The actual complete-source or two-family tape request, never a padded partial figure. */
  export type Request =
    | {
        scope: "all";
        fields: IAutoMovieHumanF1NativeLaw.IFields;
        nose: AutoMovieHumanF1NativeRoots.NoseCalibration;
      }
    | { scope: "tapes"; fields: IAutoMovieHumanF1NativeLaw.ITapeFields };
  /** Complete assembly or the two exact tape-family definitions from that same builder. */
  export type Result =
    | { scope: "all"; assembly: IAutoMovieHumanF1.IAssembly }
    | { scope: "tapes"; trunk: IAutoMovieHumanConicLoft.IFamily; breast: IAutoMovieHumanConicLoft.IFamily };
  type IFields = IAutoMovieHumanF1NativeLaw.IFields;
  type ISize = IAutoMovieHumanF1NativeLaw.ISize;
  const { ARM, EXTREMITIES, WALL, profile, ratio, same, translated } = Calibration;

  /** Build the shared original source definitions and dependent complete assembly without lofting. */
  export function create(
    request: Request,
    original: IAutoMovieHumanF1.IAssembly,
    bone: IAutoMovieHumanF1.IAssembly,
    originals: ReadonlyMap<string, IAutoMovieViewPart>,
    zero: IFields,
    projectionOwner: IAutoMovieHumanNativeProjectionCourse.IProjectionOwner,
  ): Result {
    const fields: Request["fields"] = request.fields;
    const groups: Record<string, Record<string, ISize>> = request.scope ===
    "all"
      ? {
          wall: request.fields.wall,
          roots: request.fields.roots,
          arm: request.fields.arm,
          leg: request.fields.leg,
          extremities: request.fields.extremities,
        }
      : { wall: fields.wall, roots: fields.roots };
    for (const [group, entries] of Object.entries(groups))
      for (const [name, value] of Object.entries(entries))
        if (
          !(
            Number.isFinite(value.depth) &&
            Number.isFinite(value.breadth) &&
            value.depth > 0 &&
            value.breadth > 0
          )
        )
          throw new Error(
            "positive finite native calipers required at " + group + "." + name,
          );
    if (
      !(Number.isFinite(fields.breastProjection) && fields.breastProjection > 0)
    )
      throw new Error("breastProjection must be finite and positive");
    // Lengths enter through each family's course in material stations (NativeCourse); a trunk length is refused there.
    if (request.scope === "all") LengthCourse.admit(request.fields.lengths, zero.lengths);
    const course: typeof LengthCourse.create = LengthCourse.create;
    const wall: (station: number) => AutoMovieVector2Tuple = profile(
      WALL.map(
        ([name, station]: readonly [keyof IFields["wall"], number]): readonly [
          number,
          AutoMovieVector2Tuple,
        ] => [station, ratio(fields.wall[name], zero.wall[name])],
      ),
    );
    const trunkAxis: IAutoMovieViewAxis.IAxis = H.axis(original.body.trunk);
    const trunkFrame: IAutoMovieLoftSectionFrame = trunkAxis.at(0);
    const tangent: AutoMovieVector3Tuple = F.unit(F.cross(trunkFrame.v, trunkFrame.u));
    const stationOf: (point: AutoMovieVector3Tuple) => number = (point: AutoMovieVector3Tuple): number =>
      F.dot(F.sub(point, trunkFrame.origin), tangent);
    /** Retained wall-only datum prior for the leg, head appendages and original fill datums. */
    function skinPoint(point: AutoMovieVector3Tuple): AutoMovieVector3Tuple {
      const station: number = stationOf(point);
      const frame: IAutoMovieLoftSectionFrame = trunkAxis.at(station);
      const [a, b]: AutoMovieVector2Tuple = wall(station);
      const local: AutoMovieVector3Tuple = F.sub(point, frame.origin);
      return F.add(
        point,
        F.add(
          F.scale(frame.u, (a - 1) * F.dot(local, frame.u)),
          F.scale(frame.v, (b - 1) * F.dot(local, frame.v)),
        ),
      );
    }
    const maps: Map<string, { forward: (s: number) => number }> = new Map();
    const identity: (s: number) => number = (s: number): number => s;
    const generated: Map<keyof typeof bone.body, IAutoMovieHumanConicLoft.IFamily> = new Map();
    const family: (name: keyof typeof bone.body) => IAutoMovieHumanConicLoft.IFamily = (
      name: keyof typeof bone.body,
    ): IAutoMovieHumanConicLoft.IFamily => {
      const result: IAutoMovieHumanConicLoft.IFamily | undefined = generated.get(name);
      if (result === undefined)
        throw new Error("native requested source absent: " + name);
      return result;
    };
    /** The declared bilateral chart map carries source axes and physical2 together. */
    function reflectedAxis(
      axis: IAutoMovieViewAxis.IAxis,
    ): IAutoMovieViewAxis.IAxis {
      const flip: (p: AutoMovieVector3Tuple, sign: number) => AutoMovieVector3Tuple = (
        p: AutoMovieVector3Tuple,
        sign: number,
      ): AutoMovieVector3Tuple => [sign * p[0], sign * p[1], -sign * p[2]];
      const frame: (
        p: IAutoMovieLoftSectionFrame,
      ) => IAutoMovieLoftSectionFrame = (
        p: IAutoMovieLoftSectionFrame,
      ): IAutoMovieLoftSectionFrame => ({
        origin: flip(p.origin, 1),
        u: flip(p.u, 1),
        v: flip(p.v, -1),
      });
      return {
        at: (s: number): IAutoMovieLoftSectionFrame => frame(axis.at(s)),
        jet: (
          s: number,
          p: Parameters<NonNullable<IAutoMovieViewAxis.IAxis["jet"]>>[1],
        ): IAutoMovieViewAxisJet.IJet | null => {
          const j: IAutoMovieViewAxisJet.IJet | null = axis.jet?.(s, p) ?? null;
          return j === null
            ? null
            : {
                value: frame(j.value),
                first: frame(j.first),
                second: frame(j.second),
              };
        },
      };
    }
    /** Generate one family and register its original physical station map in this invocation. */
    function make(
      prior: IAutoMovieHumanConicLoft.IFamily,
      placed: IAutoMovieHumanConicLoft.IFamily,
      scales: (s: number) => AutoMovieVector2Tuple,
      axis: IAutoMovieViewAxis.IAxis,
      protection: Native.ISpec["protection"] = [],
      forward: (s: number) => number = identity,
      featureScale: (net: IAutoMovieLoftRelief) => AutoMovieVector2Tuple = (
        net: IAutoMovieLoftRelief,
      ): AutoMovieVector2Tuple => scales((net.stations[0] + net.stations[1]) / 2),
      resolvedFeatures?: IAutoMovieLoftRelief[],
    ): IAutoMovieHumanConicLoft.IFamily {
      maps.set(prior.name, { forward });
      const features: IAutoMovieLoftRelief[] =
        resolvedFeatures ??
        AutoMovieHumanNativeFeatureLaw(
          prior.reliefs ?? [],
          placed.reliefs ?? [],
          featureScale,
          forward,
        );
      const result: IAutoMovieHumanConicLoft.IFamily = Native.create({
        original: prior,
        bone: placed,
        originals,
        axis,
        scale: scales,
        station: forward,
        features,
        protection,
      });
      return result;
    }
    /** Resolve actual complete original root targets with the same fixed feature scope. */
    function targets(
      prior: IAutoMovieHumanConicLoft.IFamily,
      axis: IAutoMovieViewAxis.IAxis,
      scale: AutoMovieVector2Tuple,
      features: IAutoMovieLoftRelief[],
      measuredAt?: number,
    ): ReadonlyMap<string, IAutoMovieViewPart> {
      const source: IAutoMovieViewPart | undefined = originals.get(prior.name);
      if (source === undefined)
        throw new Error("actual native target source absent: " + prior.name);
      const sources: Map<string, IAutoMovieViewPart> = new Map([
        [
          prior.name,
          AutoMovieHumanNativeSourceLaw(source, axis, scale, features, undefined, measuredAt),
        ],
      ]);
      // Section symmetry is not tree replication: the central nose/trunk
      // have one source, while a symmetric limb can still own a figure twin.
      const mirror: IAutoMovieViewPart | undefined = originals.get(
        prior.name + ".mirror",
      );
      if (mirror !== undefined)
        sources.set(
          prior.name + ".mirror",
          AutoMovieHumanNativeSourceLaw(
            mirror,
            reflectedAxis(axis),
            scale,
            H.mirror({ ...prior, reliefs: features }, prior.name + ".mirror")
              .reliefs ?? [],
            undefined,
            measuredAt,
          ),
        );
      return sources;
    }
    const measured: (
      prior: IAutoMovieHumanConicLoft.IFamily,
      axis: IAutoMovieViewAxis.IAxis,
      features: IAutoMovieLoftRelief[],
      sites: readonly (readonly [number, AutoMovieVector2Tuple])[],
    ) => Native.ISpec["protection"] = (
      prior: IAutoMovieHumanConicLoft.IFamily,
      axis: IAutoMovieViewAxis.IAxis,
      features: IAutoMovieLoftRelief[],
      sites: readonly (readonly [number, AutoMovieVector2Tuple])[],
    ): Native.ISpec["protection"] =>
      sites.map(([station, scale]) => ({
        sources: targets(prior, axis, scale, features, station),
        requirement: { type: "junction", station },
      }));
    const crown: IAutoMovieHumanConicLoft.ITip | null | undefined = original.body.trunk.tips?.[1];
    const crownStation: number =
      crown === undefined || crown === null
        ? original.body.trunk.knots[original.body.trunk.knots.length - 1]!
        : crown.tip;
    const headNets: readonly string[] = [
      "trunk.head",
      "trunk.head.back",
      "trunk.crown",
      "trunk.face",
      "trunk.mouth",
      "trunk.eyes",
      "trunk.chin",
    ];
    /** Each named trunk feature keeps its declared anatomical field owner. */
    function trunkFeature(net: IAutoMovieLoftRelief): AutoMovieVector2Tuple {
      if (headNets.includes(net.name))
        return ratio(fields.wall.headSkin, zero.wall.headSkin);
      if (net.name.startsWith("trunk.crotch") || net.name === "trunk.low")
        return ratio(fields.wall.hipSkin, zero.wall.hipSkin);
      if (net.name === "trunk.collar")
        return ratio(fields.wall.neckSkin, zero.wall.neckSkin);
      if (net.name.startsWith("trunk.fold"))
        return ratio(fields.wall.underbustWall, zero.wall.underbustWall);
      if (net.name.startsWith("trunk.chest"))
        return ratio(fields.wall.bustWall, zero.wall.bustWall);
      if (net.name.startsWith("trunk.shoulder"))
        return ratio(fields.roots.arm, zero.roots.arm);
      if (net.name === "trunk.navel")
        return ratio(fields.wall.omphalionWall, zero.wall.omphalionWall);
      throw new Error(
        "native trunk feature has no anatomical field owner: " + net.name,
      );
    }
    // A breast projection other than F1's is unresolved: the mound is split between the trunk's tape hull, two
    // reliefs and a rigid cap, so no law moves its base, poles and apex as one form until it is one family.
    if (fields.breastProjection !== zero.breastProjection)
      throw new Error(
        "breast projection change is unresolved: the breast mound has no single representation yet (trunk tape hull, reliefs and cap); only F1's own projection " +
          zero.breastProjection + " mm is generated, requested " + fields.breastProjection,
      );
    const trunkFeatures: IAutoMovieLoftRelief[] = AutoMovieHumanNativeFeatureLaw(
      original.body.trunk.reliefs ?? [], bone.body.trunk.reliefs ?? [], trunkFeature, identity,
    );
    const trunkProtection: Native.ISpec["protection"] = [
      ...measured(
        original.body.trunk,
        H.axis(bone.body.trunk),
        trunkFeatures,
        WALL.map(
          ([name, s]: readonly [keyof IFields["wall"], number]): readonly [
            number,
            AutoMovieVector2Tuple,
          ] => [s, ratio(fields.wall[name], zero.wall[name])],
        ),
      ),
      ...(same(fields.wall.headSkin, zero.wall.headSkin)
        ? [
            {
              sources: originals,
              requirement: {
                type: "interval" as const,
                domain: [WALL.at(-1)![1], crownStation] as const,
              },
            },
          ]
        : []),
    ];
    generated.set(
      "trunk",
      make(
        original.body.trunk,
        bone.body.trunk,
        wall,
        H.axis(bone.body.trunk),
        trunkProtection,
        identity,
        trunkFeature,
        trunkFeatures,
      ),
    );
    const {
      rootPorts,
      rootPrepared,
      rootLoop,
      nativeSeed,
      seedControls,
    }: ReturnType<typeof AutoMovieHumanF1NativeRoots> =
      AutoMovieHumanF1NativeRoots({
        request,
        original,
        bone,
        originals,
        zero,
        projectionOwner,
        family,
        maps,
        generated,
        skinPoint,
        targets,
        measured,
      });
    if (request.scope === "tapes")
      return {
        scope: "tapes",
        trunk: family("trunk"),
        breast: family("breast"),
      };
    const fullFields: IFields = request.fields;
    const handScale: AutoMovieVector2Tuple = ratio(
      fullFields.extremities.hand,
      zero.extremities.hand,
    );
    const handProfile: (station: number) => AutoMovieVector2Tuple = profile([
      [ARM.at(-1)![1], ratio(fullFields.arm.wrist, zero.arm.wrist)],
      [EXTREMITIES.hand, handScale],
    ]);
    const handFeatures: IAutoMovieLoftRelief[] = AutoMovieHumanNativeFeatureLaw(
      original.body.hand.reliefs ?? [],
      bone.body.hand.reliefs ?? [],
      (net: IAutoMovieLoftRelief): AutoMovieVector2Tuple =>
        handProfile((net.stations[0] + net.stations[1]) / 2),
      identity,
    );
    const handCourse: IAutoMovieViewAxis.IAxis = course(original.body.hand, bone.body.hand);
    generated.set(
      "hand",
      make(
        original.body.hand,
        bone.body.hand,
        handProfile,
        handCourse,
        measured(original.body.hand, handCourse, handFeatures, [
          [ARM.at(-1)![1], ratio(fullFields.arm.wrist, zero.arm.wrist)],
          [EXTREMITIES.hand, handScale],
        ]),
        identity,
        (net: IAutoMovieLoftRelief): AutoMovieVector2Tuple =>
          handProfile((net.stations[0] + net.stations[1]) / 2),
        handFeatures,
      ),
    );
    const headScale: AutoMovieVector2Tuple = ratio(fields.wall.headSkin, zero.wall.headSkin);
    const earTranslation: AutoMovieVector3Tuple = F.sub(
      skinPoint(original.body.ear.centres[0]!),
      original.body.ear.centres[0]!,
    );
    const headGroup: (prior: IAutoMovieHumanConicLoft.IFamily, placed: IAutoMovieHumanConicLoft.IFamily) => IAutoMovieHumanConicLoft.IFamily = (
      prior: IAutoMovieHumanConicLoft.IFamily,
      placed: IAutoMovieHumanConicLoft.IFamily,
    ): IAutoMovieHumanConicLoft.IFamily =>
      make(
        prior,
        placed,
        (): AutoMovieVector2Tuple => headScale,
        translated(H.axis(placed), earTranslation),
      );
    generated.set("ear", headGroup(original.body.ear, bone.body.ear));
    const helix: IAutoMovieHumanConicLoft.IFamily = headGroup(original.helix, bone.helix);
    const antihelix: IAutoMovieHumanConicLoft.IFamily = headGroup(original.antihelix, bone.antihelix);
    const concha: IAutoMovieHumanConicLoft.IFamily = headGroup(original.concha, bone.concha);

    const nostril: IAutoMovieHumanConicLoft.IFamily = make(
      original.nostril,
      bone.nostril,
      (): AutoMovieVector2Tuple => ratio(fullFields.roots.nose, zero.roots.nose),
      rootPrepared
        .get(original.body.nose.name)!
        .cutterAxis(H.axis(original.nostril)),
    );
    const digits: IAutoMovieHumanF1.IDigit[] = bone.digits.map(
      (digit: IAutoMovieHumanF1.IDigit, k: number): IAutoMovieHumanF1.IDigit => {
        const scale: AutoMovieVector2Tuple =
          digit.limb === "arm"
            ? ratio(fullFields.extremities.finger, zero.extremities.finger)
            : ratio(fullFields.extremities.toe, zero.extremities.toe);
        const prior = original.digits[k]!.family;
        const { axis, physicalStation } = LengthCourse.prepare(prior, digit.family);
        return {
          ...digit,
          family: make(prior, digit.family, (): AutoMovieVector2Tuple => scale, axis),
          physicalStation,
        };
      },
    );
    const body: typeof bone.body = {
      trunk: family("trunk"),
      arm: family("arm"),
      hand: family("hand"),
      leg: family("leg"),
      ear: family("ear"),
      nose: family("nose"),
      breast: family("breast"),
    };
    const roots: IAutoMovieHumanF1.IAssembly["roots"] = {
      get arm() { return bone.roots.arm; },
      get breast() { return bone.roots.breast; },
      nose: rootLoop("nose", 1),
    };
    return {
      scope: "all",
      assembly: {
        frames: bone.frames,
        reference: bone.reference,
        direction: bone.direction,
        body,
        digits,
        earAxis: { family: bone.body.ear, translation: earTranslation },
        helix,
        antihelix,
        get axilla() { return bone.axilla; },
        concha,
        nostril,
        roots,
        nativePorts: rootPorts,
        nativeSeed,
        nativeSeedControls: seedControls,
        families: [
          ...Object.values(body),
          helix,
          antihelix,
          ...digits.map((digit: IAutoMovieHumanF1.IDigit): IAutoMovieHumanConicLoft.IFamily => digit.family),
          concha,
          nostril,
        ],
        station: (name: string, from: number, length?: number): number => {
          const map: { forward: (s: number) => number } | undefined =
            maps.get(name);
          if (map === undefined)
            throw new Error("native material map absent for " + name);
          return length === undefined
            ? map.forward(from)
            : map.forward(from + length) - map.forward(from);
        },
        point: (name: string): AutoMovieVector3Tuple => {
          const point: AutoMovieVector3Tuple = bone.point(name);
          return name === "armpit" || name === "breastFan" ? skinPoint(point) : point;
        },
      },
    };
  }
}
