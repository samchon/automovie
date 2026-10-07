import { measureAutoMovieGeometry } from "@automovie/engine";
import { IAutoMovieProductionDesign } from "@automovie/interface";

import { GEOMETRY_FORMATION_TEST_WORLD as WORLD } from "./GEOMETRY_FORMATION_TEST_WORLD";
import type { IGeometryFormationTestMeasureProps } from "./IGeometryFormationTestMeasureProps";
import { geometryFormationTestContract as contract } from "./geometryFormationTestContract";
import { geometryFormationTestUnit as unit } from "./geometryFormationTestUnit";

const PRODUCTION: Pick<IAutoMovieProductionDesign, "frameFormat"> = {
  frameFormat: { width: 200, height: 100, fps: 24, colorSpace: "srgb" },
};

/** Measure the requested formation from the existing design and compiled shot records. */
export const geometryFormationTestMeasure = (
  props: IGeometryFormationTestMeasureProps,
): Record<string, number | string | boolean> => {
  const result = measureAutoMovieGeometry({
    request: {
      query: "formation",
      formation: props.formation ?? "unit",
      ...(props.shot === undefined ? {} : { shot: props.shot }),
      ...(props.time === undefined ? {} : { time: props.time }),
    },
    design: {
      production:
        props.production === undefined ? PRODUCTION : props.production,
      world: props.world === undefined ? WORLD : props.world,
      formations: new Map([["unit", props.design ?? unit()]]),
      shots:
        props.contracts ??
        new Map([
          ["march", contract(true)],
          ["elsewhere", contract(false)],
        ]),
    },
    compiled: props.compiled,
    timeline: null,
  });
  if (result.kind !== "measurement")
    throw new Error("a measurement was expected");
  return result.values;
};
