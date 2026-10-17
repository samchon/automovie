import {
  type AutoMovieCurveParentContext,
  type IAutoMovieCurve64 as C,
  AutoMovieCurveMath64 as M,
} from "@automovie/engine";

import type { IAutoMovieCurveRegion64 as R } from "../../IAutoMovieCurveRegion64";
import type { PelvisMeasurements as P } from "./PelvisMeasurements";
import { generatePelvisOwnedFamily } from "./generatePelvisOwnedFamily";
import { generatePelvisR6bRoof } from "./generatePelvisR6bRoof";

type Actual = R.Result & {
  /** Actual native-root-chart support/handle fields, including resolved side placement, that generate the output curves and full longitudinal operators.
   */
  nativeFamily: ReturnType<typeof generatePelvisOwnedFamily>;

  /** Upstream waist recovered through the generated family in world coordinates, retaining all twelve spans, turn widths and full physical-mm jet.
   */
  evaluatedWaist: C.Boundary;

  /** Explicit unresolved topology, parent and visual limitations; the string does not alter or authorize geometry.
   */
  qualification: string;
};

/** Capture named station inputs and native bone origins, then generate and place the selected pelvis family using the actual upstream twelve-span waist and full jet. The construction root may move rigidly; independent side rotations and vertical leg placement reject. R6b includes the old sparse roof with an open internal seam, while V17 here exposes only base fields. This adapter does not certify native-A to neutral-T calibration. Each construction owns fresh arrays and publishes complete physical-mm thigh operators; auxiliary engineering closures have a separate display group.
 *
 * @author Samchon
 */
export function createPelvisCurveFactory(props: {
  /** Named physical measurement input resolved before generation; no generated curve or reference control table is an input.
   */
  measurements: P.Input;

  /** Explicit support/roof topology selection: fourteen-lane external R6b or sixteen-lane interior V17.
   */
  epoch: P.Epoch;

  /** Internal V17 endpoint convention; omission preserves the legacy vertical policy. The public pants owner explicitly retains crown-derived station directions. This never replaces an external waist or midpoint jet. */
  interiorEndpointPolicy?: "vertical" | "crown-direction";

  /** Exact upstream canonical waist ID; ID, section name and turn phase must agree before generation.
   */
  waistId: string;

  /** IDs assigned to the two pelvis-owned lower thigh ports consumed by the leg owner.
   */
  thighIds: Record<P.Side, string>;

  /** Construction and bilateral placement bone IDs resolved by the shared parent context.
   */
  bones: {
    /** Shared parent-context bone ID for the hips construction frame.
     */
    construction: string;

    /** Shared parent-context bone ID for left upper-leg placement.
     */
    left: string;

    /** Shared parent-context bone ID for right upper-leg placement.
     */
    right: string;
  };

  /** Construction and bilateral upper-leg origins in the same native millimetre chart as the generated family.
   */
  nativeBoneOriginsMm: {
    /** Native hips origin in millimetres, subtracted before placement by the construction parent.
     */
    construction: M.V;

    /** Native left upper-leg origin in millimetres, subtracted before placement by the left parent.
     */
    left: M.V;

    /** Native right upper-leg origin in millimetres, subtracted before placement by the right parent.
     */
    right: M.V;
  };
}): {
  /** Regional dispatch identifier; this factory publishes pelvis curves.
   */
  region: string;

  /** Generate the current family from the actual parent context and upstream waist; unsupported parent rotation or vertical side placement rejects.
   */
  construct: (
    context: AutoMovieCurveParentContext,
    upstream: ReadonlyMap<string, C.Boundary>,
  ) => Actual;
} {
  props = structuredClone(props);
  const measurements: P.Input = structuredClone(props.measurements);
  return {
    region: "pelvis",
    construct: (
      context: AutoMovieCurveParentContext,
      upstream: ReadonlyMap<string, C.Boundary>,
    ): Actual => {
      const incoming: C.Boundary | undefined = upstream.get(props.waistId);
      if (
        incoming === undefined ||
        incoming.id !== props.waistId ||
        incoming.section.name !== props.waistId ||
        incoming.section.phaseUnit !== "turn"
      )
        throw new Error("The actual upstream canonical waist is required");
      const root: string = props.bones.construction;
      const rootOrigin: C.Vector = context.point(root, [0, 0, 0]);
      const axes: C.Vector[] = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ].map((v: number[]): C.Vector => context.direction(root, v as M.V));
      const local: (world: C.Vector, vector?: boolean) => M.V = (
        world: C.Vector,
        vector: boolean = false,
      ): M.V => {
        const delta: M.V = vector ? M.clone(world) : M.sub(world, rootOrigin);
        const coordinates: M.V = axes.map((axis: C.Vector): number =>
          axis.reduce(
            (s: number, x: number, k: number): number => s + x * delta[k]!,
            0,
          ),
        ) as M.V;
        return vector
          ? coordinates
          : M.add(coordinates, props.nativeBoneOriginsMm.construction);
      };
      const world: (native: C.Vector, vector?: boolean) => M.V = (
        native: C.Vector,
        vector: boolean = false,
      ): M.V =>
        M.clone(
          vector
            ? context.direction(root, native)
            : context.point(
                root,
                M.sub(native, props.nativeBoneOriginsMm.construction),
              ),
        );
      const localWaist: C.Boundary = {
        ...incoming,
        section: {
          ...incoming.section,
          spans: incoming.section.spans.map(
            (s: C.Span): M.Span =>
              s.map((p: C.Vector): M.V => local(p)) as M.Span,
          ),
        },
        fullJ: incoming.fullJ.map(
          (s: C.Span): M.Span =>
            s.map((p: C.Vector): M.V => local(p, true)) as M.Span,
        ),
        longitudinalAxis: local(incoming.longitudinalAxis, true),
      };
      const sidePoint: (native: M.V, side: P.Side) => M.V = (
        native: M.V,
        side: P.Side,
      ): M.V =>
        local(
          context.point(
            props.bones[side],
            M.sub(native, props.nativeBoneOriginsMm[side]),
          ),
        );
      for (const side of ["left", "right"] as const) {
        for (let k: number = 0; k < 3; k++) {
          const v: M.V = [0, 0, 0];
          v[k] = 1;
          if (
            context
              .direction(props.bones[side], v)
              .some((x: number, j: number): boolean => x !== axes[k]![j])
          )
            throw new Error(
              "Independent leg chart rotation is not yet supported by this TS port",
            );
        }
        const mappedOrigin: M.V = sidePoint(
          props.nativeBoneOriginsMm.construction,
          side,
        );
        if (mappedOrigin[1] !== props.nativeBoneOriginsMm.construction[1])
          throw new Error(
            "This staged TS adapter requires an exactly level stored relative leg origin; general compound-horizontal composition and native Human bone calibration remain unqualified. Independent vertical leg placement rejects.",
          );
      }
      const generated: ReturnType<typeof generatePelvisOwnedFamily> =
        generatePelvisOwnedFamily({
          measurements,
          epoch: props.epoch,
          interiorEndpointPolicy: props.interiorEndpointPolicy,
          waist: localWaist,
          sidePoint,
        });
      const spanWorld: (
        spans: readonly M.Span[],
        vector?: boolean,
      ) => M.Span[] = (
        spans: readonly M.Span[],
        vector: boolean = false,
      ): M.Span[] =>
        spans.map(
          (s: M.Span): M.Span =>
            s.map((v: M.V): M.V => world(v, vector)) as M.Span,
        );
      const turns: (widths: readonly number[]) => number[] = (
        widths: readonly number[],
      ): number[] => {
        const total: number = widths.reduce(
          (s: number, w: number): number => s + w,
          0,
        );
        const ws: number[] = widths.map((w: number): number => w / total);
        ws[ws.length - 1] =
          1 -
          ws.slice(0, -1).reduce((s: number, w: number): number => s + w, 0);
        return ws;
      };
      const boundary: (
        id: string,
        spans: M.Span[],
        jet: M.Span[],
        widths: number[],
      ) => C.Boundary = (
        id: string,
        spans: M.Span[],
        jet: M.Span[],
        widths: number[],
      ): C.Boundary => ({
        id,
        section: {
          type: "cubicBezier",
          name: id,
          closed: true,
          unit: "mm",
          phaseUnit: "turn",
          phaseIntervals: widths,
          spans: spanWorld(spans),
        },
        fullJ: spanWorld(jet, true),
        longitudinalUnit: "mm",
        longitudinalAxis: world([0, 1, 0], true),
      });
      const owned: R.Result["boundaries"][number][] = (
        ["left", "right"] as const
      ).map((side: P.Side): R.Result["boundaries"][number] => {
        const f: typeof generated.paired.left = generated.paired[side];
        return {
          bone: props.bones[side],
          value: boundary(
            props.thighIds[side],
            f.controls(f.ys[0]!),
            f.controls(f.ys[0]!, true),
            turns(f.widths),
          ),
        };
      });
      const curves: {
        /** Semantic course identifier used in emitted curve names and inspection; it does not select a calibration identity.
         */
        name: string;

        /** Whether the last span returns to the first; an open guide is not implicitly capped.
         */
        closed: boolean;

        /** Ordered cubic Bernstein coefficients; positions use millimetres and derivative fields use their enclosing declared units.
         */
        spans: M.Span[];

        /** Positive span widths in the declared phase unit; closed published courses normalize these widths to one turn.
         */
        phaseIntervals: number[];

        /** Inspection role separating ordinary sections/guides from auxiliary engineering closures.
         */
        role: string;

        /** Open-guide chart unit: physical millimetres or normalized engineering-closure parameter.
         */
        phaseUnit?: "normalized" | "mm";
      }[] = [...generated.curves];
      if (props.epoch === "external-r6b")
        curves.push(...generatePelvisR6bRoof(measurements, generated).curves);
      const convert: (curve: (typeof curves)[number]) => C.Cubic = (
        curve: (typeof curves)[number],
      ): C.Cubic => ({
        type: "cubicBezier",
        name: curve.name,
        closed: curve.closed,
        unit: "mm",
        phaseUnit: curve.closed ? "turn" : (curve.phaseUnit ?? "mm"),
        phaseIntervals: curve.closed
          ? turns(curve.phaseIntervals)
          : curve.phaseIntervals,
        spans: spanWorld(curve.spans),
      });
      const primitives: C.Cubic[] = curves
        .filter(
          (curve: (typeof curves)[number]): boolean =>
            curve.role !== "engineeringClosure",
        )
        .map(convert);
      const engineering: C.Cubic[] = curves
        .filter(
          (curve: (typeof curves)[number]): boolean =>
            curve.role === "engineeringClosure",
        )
        .map(convert);
      const groups: R.Result["groups"][number][] = [
        { part: "pelvis", side: null, primitives },
      ];
      if (engineering.length)
        groups.push({
          part: "pelvis-engineeringClosure",
          side: null,
          primitives: engineering,
        });
      return {
        groups,
        boundaries: owned,
        nativeFamily: generated,
        evaluatedWaist: boundary(
          props.waistId,
          generated.waistControls,
          generated.waistFullJ,
          generated.waistPhaseTurns,
        ),
        qualification:
          "Staged actual TS merged/paired/base-guide family and full external port generation. R6b is the external whole-body epoch, with its old sparse roof and OPEN continuous internal seam; V17 common rational roof and V24 parent contract are separate. Native-to-current-Human/T mapping, V17 rational roof, real torso/leg DAG and final visual approval are not supplied by this port. Engineering closures have a distinct display group and are not anatomical skin features.",
      };
    },
  };
}
