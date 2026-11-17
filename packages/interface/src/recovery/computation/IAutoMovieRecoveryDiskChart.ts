import type { AutoMovieVector3Tuple } from "../../index";



/**
 * Divide one coherent private triangle disk into four physical-arclength sides. A maximum boundary turn meeting cornerDegrees anchors the chart, with stable physical-key ties followed by the complete coherent cyclic key-word context; indistinguishable contexts fail. Without a feature the smallest key anchors it. Repeated physical keys require exactly equal coordinates; private occurrences retain distinct ordinals, including paired cut edges and their observations. Quarter observations subdivide only the unique incident boundary triangles. Coordinates remain millimetres in the input frame, and input arrays are immutable. Sides are bottom/right/top/left, with top and left reversed for increasing UV. Invalid incidence, links, orientation or unrepresentable subdivision throws an explicit unsupported error. PL geometry is preserved in real arithmetic; binary64 interpolation and global source embedding are not certified. Keys, triangles and corner diagnostics remain private fitting observations. Partial boundary-arc authority and all field/consumer publication belong elsewhere.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Private immutable chart positions in physical millimetres. Private oriented triangle incidence of the admitted disk.
 * @evidence contracts/development/design.md#principled-representation Private immutable chart positions in physical millimetres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryAtlasObservationChart, RecoveryDiskChart, RecoveryFeatureChartPreparation share IAutoMovieRecoveryDiskChart's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Actual stable-key anchor choice, turn threshold and physical quarter lengths.
 */

export namespace IAutoMovieRecoveryDiskChart {
/**
 * Input observations and explicit numerical policy for RecoveryDiskChart. Private immutable chart positions in physical millimetres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Private immutable chart positions in physical millimetres. Private oriented triangle incidence of the admitted disk.
 * @evidence contracts/development/design.md#principled-representation Private immutable chart positions in physical millimetres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryAtlasObservationChart, RecoveryDiskChart, RecoveryFeatureChartPreparation share IAutoMovieRecoveryDiskChart's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export type Input = {
 
   /** Private immutable chart positions in physical millimetres. */
    verticesMm: readonly Readonly<AutoMovieVector3Tuple>[];

 
   /** Private oriented triangle incidence of the admitted disk. */
    triangles: readonly (readonly [number, number, number])[];

 
   /** Physical observation identities aligned with vertices, distinct from coordinate equality. */
    vertexKeys: readonly string[];

 
   /** Coherently oriented complete disk boundary in vertex addresses. */
    boundaryCycle: readonly number[];

 
   /** Minimum physical turn angle in degrees eligible for anchor selection. */
    cornerDegrees: number;
  };

/**
 * Returned coefficient or observation state from RecoveryDiskChart. Physical position in the registered millimetre frame; no coordinate matching or source repair is implied.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Private immutable chart positions in physical millimetres. Private oriented triangle incidence of the admitted disk.
 * @evidence contracts/development/design.md#principled-representation Private immutable chart positions in physical millimetres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryAtlasObservationChart, RecoveryDiskChart, RecoveryFeatureChartPreparation share IAutoMovieRecoveryDiskChart's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Actual stable-key anchor choice, turn threshold and physical quarter lengths.
 */

export type Result = {
 
   /** Private immutable chart positions in physical millimetres. */
    verticesMm: Readonly<AutoMovieVector3Tuple>[];

 
   /** Private oriented triangle incidence of the admitted disk. */
    triangles: [number, number, number][];

 
   /** Physical observation identities aligned with vertices, distinct from coordinate equality. */
    vertexKeys: string[];

 
   /** Four oriented chart-side observation chains after exact quarter insertions. */
    sides: [number[], number[], number[], number[]];

 
   /** Actual stable-key anchor choice, turn threshold and physical quarter lengths. */
    cornerRule: {
 
     /** Stable physical identity selected as the boundary parameterization origin. */
anchorKey: string;
 
     /** Observed turning angle at the selected boundary anchor, in degrees. */
anchorTurningDegrees: number;
 
     /** Declared degree threshold used to qualify a turning-angle feature. */
featureThresholdDegrees: number;
 
     /** Deterministic anchor policy actually used, distinguishing qualified turning features from the key-only fallback. */
selection:
        | "maximum-qualified-turn-then-key"
        | "minimum-key-without-qualified-turn";
 
     /** Four successive boundary-side lengths in millimetres under the chosen quarter partition. */
quarterLengthsMm: [number, number, number, number];
 
     /** Measured closed physical boundary length in millimetres. */
perimeterMm: number;
    };

 
   /** Private quarter-cut ancestry and measured millimetre insertion positions. */
    insertedBoundaryVertices: {
 
     /** Zero-based ordinal in this record's owning cell, component or control registry; it is not a source coordinate. */
id: number;
 
     /** Stable incidence identity used for deterministic registry lookup; matching text does not imply coordinate equality. */
key: string;
 
     /** Ordered physical endpoint identities used to orient the interpolation fraction. */
edgeKeys: [string, string];
 
     /** Dimensionless interior fraction along the declared ordered edgeKeys pair. */
fractionFromFirst: number;
 
     /** Physical position in the registered millimetre frame; no coordinate matching or source repair is implied. */
pointMm: Readonly<AutoMovieVector3Tuple>;
    }[];
  };

/**
 * Divide one coherent private triangle disk into four physical-arclength sides. A maximum boundary turn meeting cornerDegrees anchors the chart, with stable physical-key ties followed by the complete coherent cyclic key-word context; indistinguishable contexts fail. Without a feature the smallest key anchors it. Repeated physical keys require exactly equal coordinates; private occurrences retain distinct ordinals, including paired cut edges and their observations. Quarter observations subdivide only the unique incident boundary triangles. Coordinates remain millimetres in the input frame, and input arrays are immutable. Sides are bottom/right/top/left, with top and left reversed for increasing UV. Invalid incidence, links, orientation or unrepresentable subdivision throws an explicit unsupported error. PL geometry is preserved in real arithmetic; binary64 interpolation and global source embedding are not certified. Keys, triangles and corner diagnostics remain private fitting observations. Partial boundary-arc authority and all field/consumer publication belong elsewhere.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Divide one coherent private triangle disk into four physical-arclength sides. A maximum boundary turn meeting cornerDegrees anchors the chart, with stable
 * @evidence contracts/development/design.md#principled-representation Divide one coherent private triangle disk into four physical-arclength sides. A maximum boundary turn meeting cornerDegrees anchors the chart, with stable
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryAtlasObservationChart, RecoveryDiskChart, RecoveryFeatureChartPreparation share IAutoMovieRecoveryDiskChart's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export type Operation = (input: IAutoMovieRecoveryDiskChart.Input) => IAutoMovieRecoveryDiskChart.Result;
}

