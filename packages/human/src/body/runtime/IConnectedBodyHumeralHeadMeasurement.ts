import type { IAutoMovieHumanBodyHumeralHead } from "../anatomy/shoulder/IAutoMovieHumanBodyHumeralHead";

/**
 * One humeral-head sphere's fit against the posed skin in the shared body metre frame. The sphere producer places its centre from the shoulder rig; it does not register the person's anatomical joint centre. Radius source and acquisition provenance accompany this record through ConnectedBodyHumeralHeadReading.
 *
 * @evidence contracts/common.md#principled-implementation Bone identity associates radius and capped-skin containment, nearest distance and signed clearance from their numerical producers.
 * @evidence contracts/common.md#clear-and-simple-design Scalar fit geometry is separate from the reading union that records radius provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rig-centred sphere clearance remains a geometric fit observation rather than an anatomical registration or clinical admission.
 * @evidence contracts/common.md#meaningful-documentation Members state metre units and clearance sign, while the prose explains posed-skin scope and rig-centre limitations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This measurement record performs no nearest-triangle or containment calculation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The erased record does not cache shared skin queries.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalar reading fields own no mesh buffers or query handles.
 *
 * @author Samchon
 */
export interface IConnectedBodyHumeralHeadMeasurement {
  /** Humerus whose head was measured. */
  bone: IAutoMovieHumanBodyHumeralHead["bone"];

  /** Head sphere radius, in metres. */
  radiusMetres: number;

  /** Whether the sphere centre lies inside the skin. */
  centerInside: boolean;

  /** Distance from the centre to the nearest skin point, in metres. */
  nearestMetres: number;

  /** Nearest distance less the radius with the centre inside, else the negated nearest distance less the radius, in metres. */
  clearanceMetres: number;
}
