import {
  AutoMovieLoftChain,
  type AutoMovieLoftFrame,
  AutoMovieLoftFrameSource,
  AutoMovieLoftJet,
  AutoMovieSolidBlendChain,
  AutoMovieSolidChain,
  type AutoMovieSolidJoin,
  AutoMovieSolidMerge,
  AutoMovieSplineCurve,
  AutoMovieViewLoft,
  type IAutoMovieLoftChain,
  type IAutoMovieSolidSurface,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import { HumanSolidShapes } from "../../internal/HumanSolidShapes";
import { ConstructionSourceIngress } from "../../internal/construction/ConstructionSourceIngress";

/** World vector, in the fixture's millimetres or a dimensionless direction. */
type Vec3 = [number, number, number];

/**
 * An explicit chart orientation belongs to the producing surface, including annuli without an interior tube axis.
 *
 * Scenarios:
 * 1. Regular flat annuli have normal +Y or -Y at three scales. Tube-centre inference has zero facing there, while explicit orientation admits the surface. Reversing station, phase or world handedness transforms its sign and preserves the declared outward side.
 * 2. Actual cylinder/plane merges publish host outward normals and their blend's orientation at translated/mirrored sources. Both rail normals agree with the independent plane/cylinder normals at every published column.
 * 3. Collapsed/nonfinite jets, invalid explicit signs, unsupported column counts and zero/nonfinite supplied outward normals cannot publish a usable oriented surface.
 * 4. Unavailable returned anchor jets and numeric local/world/lift failures refuse a surface while direct Jet queries still throw. Finite Point0 survives missing physical2; stale bindings and actual callback errors retain their identity.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads SolidChain.surface on admitted annular layer data and exercises the actual SolidMerge to SolidJoin.column to SolidBlendChain producer path. It catches a sign inferred from an irrelevant storage origin or lost across a reflection and refuses malformed/degenerate source data.
 * @evidence contracts/development/testing.md#independent-expectations A flat annulus has normal parallel to Y and zero dot product with its in-plane radial direction. Reversing one chart coordinate or reflecting world X reverses the raw chart cross product, requiring the declared sign to change. The real merge's host normal is +Z and its cylinder normal is the translated radial XY direction, derived directly from the closed-form solids.
 * @evidence contracts/development/testing.md#distinguishing-cases Uses both outward sides, three length scales, station/phase/world reversals, actual merges, both rails, invalid signs/counts, collapsed/nonfinite geometry, numeric lift failure, stale source data and exact callback-error identity. It does not claim final tessellation or the separate part-only winding defect is repaired.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable synchronous synthetic CPU unit through --include construction_orientation; no Human, viewer, server, process or fixture is generated.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Regular flat annuli have normal +Y or -Y at three scales. Tube-centre inference has zero facing there, while explicit orientation admits...).
 */
export function test_construction_orientation(): void {
  const failures: string[] = [];
  for (const scale of [0.001, 1, 1000])
    for (const outward of [-1, 1] as const)
      for (const transform of [
        "identity",
        "station",
        "phase",
        "mirror",
      ] as const) {
        const flip: number = transform === "identity" ? 1 : -1;
        const chain: IAutoMovieLoftChain = annulus(
          scale,
          (outward * flip) as 1 | -1,
          transform,
        );
        const surface: IAutoMovieSolidSurface | null =
          AutoMovieSolidChain.surface(chain);
        if (surface === null) {
          failures.push(`annulus ${scale}/${outward}/${transform} was refused`);
          continue;
        }
        for (const station of [0, 0.3 * scale, scale])
          for (const phase of [0, 0.3, 1.7, 3.8, 5.9]) {
            const jet: IAutoMovieSolidSurface.IJet = surface.jet(
              station,
              phase,
            );
            direction(
              failures,
              `annulus ${scale}/${outward}/${transform}/${station}/${phase}`,
              cross(jet.u, jet.v).map(
                (value: number): number => value * surface.orientation,
              ) as Vec3,
              [0, outward, 0],
            );
          }
        const explicitHole: IAutoMovieSolidSurface | null =
          AutoMovieSolidChain.surface({ ...chain, mirrored: true });
        if (
          explicitHole === null ||
          explicitHole.orientation !== surface.orientation
        )
          failures.push(
            "the explicit sign was turned again by the mirrored flag",
          );
        const inferred: IAutoMovieLoftChain = { ...chain };
        delete inferred.orientation;
        if (AutoMovieSolidChain.surface(inferred) !== null)
          failures.push(
            `flat annulus ${scale}/${transform} invented a tube-centre facing`,
          );
      }
  const collapsed: IAutoMovieLoftChain = annulus(1, 1, "identity");
  collapsed.layers[1]!.coefficients = [...collapsed.layers[0]!.coefficients];
  for (const layer of collapsed.layers) layer.slopes.fill(0);
  refusal(
    failures,
    "collapsed annular chart",
    (): IAutoMovieSolidSurface | null => AutoMovieSolidChain.surface(collapsed),
  );
  const nonfinite: IAutoMovieLoftChain = annulus(1, 1, "identity");
  nonfinite.layers[0]!.frame = {
    origin: [NaN, 0, 0],
    u: [1, 0, 0],
    v: [0, 0, 1],
  };
  refusal(
    failures,
    "nonfinite surface point",
    (): IAutoMovieSolidSurface | null => AutoMovieSolidChain.surface(nonfinite),
  );
  admission(failures);
  const invalidSign: IAutoMovieLoftChain = annulus(1, 1, "identity");
  invalidSign.orientation = 0 as 1;
  refusal(
    failures,
    "invalid explicit orientation",
    (): IAutoMovieSolidSurface | null =>
      AutoMovieSolidChain.surface(invalidSign),
  );

  for (const scale of [0.001, 1, 1000])
    for (const mirror of [false, true]) {
      const sign: number = mirror ? -1 : 1;
      const origin: Vec3 = [3 * scale, -5 * scale, 7 * scale];
      const part: IAutoMovieSolidSurface = HumanSolidShapes.cylinder(
        "column",
        origin,
        [0, 0, 1],
        [sign, 0, 0],
        [0, 1, 0],
        20 * scale,
      );
      const host: IAutoMovieSolidSurface = HumanSolidShapes.plane(
        "floor",
        origin,
        [sign, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      );
      const result: AutoMovieSolidJoin.IResult = AutoMovieSolidMerge.create({
        part,
        host,
        seed: { phi: 0, s: 0, y: 20 * scale, theta: 0 },
        count: 48,
        tolerance: 1e-12 * scale,
        grazing: 0.05,
        width: { part: (): number => 8 * scale, host: (): number => 8 * scale },
      });
      if (result.join === null || result.diagnostics.length !== 0) {
        failures.push(
          `merge ${scale}/${mirror}: ${result.diagnostics.map((d: AutoMovieSolidJoin.IResult["diagnostics"][number]): string => d.detail).join("; ")}`,
        );
        continue;
      }
      const join: AutoMovieSolidJoin.IJoin = result.join;
      const blend: AutoMovieSolidBlendChain.IBlend | null =
        AutoMovieSolidBlendChain.of("annular blend", join, 48);
      if (blend === null) {
        failures.push(`published blend ${scale}/${mirror} is absent`);
        continue;
      }
      const surface: IAutoMovieSolidSurface | null =
        AutoMovieSolidChain.surface(blend.chain);
      if (surface === null || blend.chain.orientation === undefined) {
        failures.push(
          `published blend ${scale}/${mirror} lost its oriented source`,
        );
        continue;
      }
      for (let k: number = 0; k < 48; k++) {
        const phase: number = (2 * Math.PI * k) / 48;
        const column: AutoMovieSolidJoin.IColumn | null = join.column(
          blend.seed + phase,
        );
        if (column === null) {
          failures.push(`missing original column ${k}`);
          continue;
        }
        direction(failures, "analytic host outward", column.outward, [0, 0, 1]);
        const start: IAutoMovieSolidSurface.IJet = surface.jet(0, phase);
        const end: IAutoMovieSolidSurface.IJet = surface.jet(
          blend.length,
          phase,
        );
        direction(
          failures,
          `host rail ${scale}/${mirror}/${k}`,
          cross(start.u, start.v).map(
            (value: number): number => value * surface.orientation,
          ) as Vec3,
          [0, 0, 1],
        );
        direction(
          failures,
          `part rail ${scale}/${mirror}/${k}`,
          cross(end.u, end.v).map(
            (value: number): number => value * surface.orientation,
          ) as Vec3,
          [end.p[0] - origin[0], end.p[1] - origin[1], 0],
        );
      }
      if (scale === 1 && !mirror) {
        for (const count of [0, 4, 9, 8.5])
          refusal(
            failures,
            `unsupported column count ${count}`,
            (): AutoMovieSolidBlendChain.IBlend | null =>
              AutoMovieSolidBlendChain.of("invalid count", join, count),
          );
        for (const outward of [
          [0, 0, 0],
          [0, 0, Infinity],
        ] as Vec3[]) {
          const broken: AutoMovieSolidJoin.IJoin = {
            ...join,
            column(t: number): AutoMovieSolidJoin.IColumn | null {
              const column: AutoMovieSolidJoin.IColumn | null = join.column(t);
              return column === null ? null : { ...column, outward };
            },
          };
          refusal(
            failures,
            `invalid outward normal ${outward}`,
            (): AutoMovieSolidBlendChain.IBlend | null =>
              AutoMovieSolidBlendChain.of("invalid outward", broken, 48),
          );
        }
      }
    }
  if (failures.length !== 0)
    throw new Error(
      `${failures.length} orientation findings:\n${failures.join("\n")}`,
    );
}

/** Numeric admission is nullable; malformed ownership and foreign callback errors are not. */
function admission(failures: string[]): void {
  for (const kind of ["coefficient", "lift"] as const) {
    const chain: IAutoMovieLoftChain = annulus(1, 1, "identity");
    for (const layer of chain.layers)
      if (kind === "coefficient") layer.coefficients[0] = NaN;
      else {
        layer.lift = new Array<number>(chain.order).fill(NaN);
        layer.liftSlopes = new Array<number>(chain.order).fill(0);
      }
    refusal(
      failures,
      `nonfinite ${kind} surface`,
      (): IAutoMovieSolidSurface | null => AutoMovieSolidChain.surface(chain),
    );
    try {
      AutoMovieLoftJet.at(chain, 0.5, 0);
      failures.push(`direct nonfinite ${kind} Jet was accepted`);
    } catch {
      // A direct required-total2 query remains an explicit failure.
    }
  }

  // The two authored endpoint boxes are valid; their actual quintic crosses its axis inside.
  const family: ReturnType<typeof ConstructionSourceIngress.family> =
    ConstructionSourceIngress.family(1, false);
  const invalid: IAutoMovieViewPart = {
    ...family.child,
    stations: [0, 40],
    front: {
      ...family.child.front,
      positive: {
        knots: [
          {
            site: "first",
            station: 0,
            value: 2,
            jet: { first: -40, second: 0 },
          },
          {
            site: "last",
            station: 40,
            value: 3,
            jet: { first: 40, second: 0 },
          },
        ],
      },
    },
  };
  const refused: ReturnType<typeof AutoMovieViewLoft.create> =
    AutoMovieViewLoft.create(invalid);
  if (
    refused.surface !== null ||
    !refused.diagnostics.some(
      (fault: (typeof refused.diagnostics)[number]): boolean =>
        fault.contract === "solid surface",
    )
  )
    failures.push("An invalid native anchor escaped named surface admission.");

  const original: ReturnType<typeof AutoMovieViewLoft.create> =
    AutoMovieViewLoft.create(ConstructionSourceIngress.family(1, false).child);
  if (original.chain === null)
    throw new Error("The native orientation admission fixture has no chain.");
  const stale: IAutoMovieLoftChain = {
    ...original.chain,
    layers: original.chain.layers.map(
      (layer: IAutoMovieLoftChain.ILayer): IAutoMovieLoftChain.ILayer => ({
        ...layer,
        coefficients: layer.coefficients.map(
          (value: number): number => value + 1,
        ),
      }),
    ),
  };
  try {
    AutoMovieSolidChain.surface(stale);
    failures.push(
      "A stale native binding became a nullable numeric admission.",
    );
  } catch (error: unknown) {
    if (!(error instanceof Error))
      failures.push("A stale native binding lost its explicit error.");
  }

  const base: IAutoMovieLoftChain = annulus(1, 1, "identity");
  const frame: AutoMovieLoftFrame.IFrame = base.layers[0]!.frame!;
  const still: AutoMovieLoftFrame.IFrame = {
    origin: [0, 0, 0],
    u: [0, 0, 0],
    v: [0, 0, 0],
  };
  const marker: Error = new Error("actual axis callback identity");
  const axis: IAutoMovieViewPart["axis"] = {
    at: (): AutoMovieLoftFrame.IFrame => frame,
    jet: (
      station: number,
    ): ReturnType<NonNullable<IAutoMovieViewPart["axis"]["jet"]>> => {
      if (station === 0.5) throw marker;
      return { value: frame, first: still, second: still };
    },
  };
  const retained: IAutoMovieLoftChain | string =
    AutoMovieLoftFrameSource.retain(base, axis);
  if (typeof retained === "string") throw new Error(retained);
  try {
    AutoMovieSolidChain.surface(retained);
    failures.push(
      "An actual axis callback failure became a nullable admission.",
    );
  } catch (error: unknown) {
    if (error !== marker)
      failures.push("The actual axis callback error identity changed.");
  }

  // Values remain available when only the interior physical jet is absent.
  for (const unavailable of ["null", "nonfinite"] as const) {
    const valueAxis: IAutoMovieViewPart["axis"] = {
      at: (): AutoMovieLoftFrame.IFrame => frame,
      jet: (
        station: number,
      ): ReturnType<NonNullable<IAutoMovieViewPart["axis"]["jet"]>> => {
        if (station !== 0.5)
          return { value: frame, first: still, second: still };
        return unavailable === "null"
          ? null
          : {
              value: frame,
              first: still,
              second: { ...still, origin: [NaN, 0, 0] },
            };
      },
    };
    const source: IAutoMovieLoftChain | string =
      AutoMovieLoftFrameSource.retain(base, valueAxis);
    if (typeof source === "string") throw new Error(source);
    if (!AutoMovieLoftChain.point(source, 0.5, 0).every(Number.isFinite))
      failures.push(`Unavailable ${unavailable} axis2 erased finite Point0.`);
    refusal(
      failures,
      `unavailable ${unavailable} anchor axis2`,
      (): IAutoMovieSolidSurface | null => AutoMovieSolidChain.surface(source),
    );
    try {
      AutoMovieLoftJet.at(source, 0.5, 0);
      failures.push(`Unavailable ${unavailable} direct axis2 was accepted.`);
    } catch {
      // A direct physical2 request cannot manufacture the missing derivative.
    }
  }
}

/** A publication failure is null; exceptions remain findings while later independent cases still run. */
function refusal(
  failures: string[],
  label: string,
  create: () => unknown,
): void {
  try {
    if (create() !== null) failures.push(`${label} was published`);
  } catch (error: unknown) {
    failures.push(`${label} threw ${String(error)}`);
  }
}

/** A regular flat annulus stored as two explicit framed rings; its chart span does not imply axial displacement. */
function annulus(
  scale: number,
  orientation: 1 | -1,
  transform: "identity" | "station" | "phase" | "mirror",
): IAutoMovieLoftChain {
  const count: number = 32;
  const radii: number[] =
    transform === "station" ? [scale, 2 * scale] : [2 * scale, scale];
  const coefficients: number[][] = radii.map((radius: number): number[] =>
    AutoMovieSplineCurve.interpolate(
      Array.from(
        { length: count },
        (_: unknown, k: number): [number, number] => {
          const phase: number =
            ((transform === "phase" ? -1 : 1) * 2 * Math.PI * k) / count;
          return [radius * Math.cos(phase), radius * Math.sin(phase)];
        },
      ),
    ),
  );
  const frame: AutoMovieLoftFrame.IFrame = {
    origin: [17 * scale, -11 * scale, 5 * scale],
    u: [transform === "mirror" ? -1 : 1, 0, 0],
    v: [0, 0, 1],
  };
  const still: AutoMovieLoftFrame.IFrame = {
    origin: [0, 0, 0],
    u: [0, 0, 0],
    v: [0, 0, 0],
  };
  const slope: number[] = coefficients[0]!.map(
    (value: number, k: number): number =>
      (coefficients[1]![k]! - value) / scale,
  );
  return {
    name: "flat annulus",
    basis: "spline",
    order: count,
    rule: "polar",
    samples: count,
    orientation,
    layers: coefficients.map(
      (values: number[], index: number): IAutoMovieLoftChain.ILayer => ({
        y: index * scale,
        frame,
        frameSlopes: still,
        frameCurvatures: still,
        coefficients: values,
        slopes: [...slope],
        curvatures: new Array<number>(2 * count).fill(0),
      }),
    ),
  };
}

/** Both normals must be finite nonzero directions before their independently known alignment is compared. */
function direction(
  failures: string[],
  label: string,
  actual: Vec3,
  expected: Vec3,
): void {
  const a: number = Math.hypot(...actual);
  const b: number = Math.hypot(...expected);
  if (
    actual.length !== 3 ||
    expected.length !== 3 ||
    ![...actual, ...expected, a, b].every(Number.isFinite) ||
    !(a > 0 && b > 0) ||
    actual.reduce(
      (sum: number, value: number, k: number): number =>
        sum + ((value / a) * expected[k]!) / b,
      0,
    ) <
      1 - 1e-8
  )
    failures.push(`${label}: ${actual}, expected direction ${expected}`);
}

/** Independent world cross product for the chart's oriented normal. */
function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
