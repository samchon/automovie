import type { IConnectedFaceControlEntry } from "./IConnectedFaceControlEntry";
import type { IConnectedFaceControlMetric } from "./IConnectedFaceControlMetric";
import type { ICreateConnectedFaceChannelControlProps } from "./ICreateConnectedFaceChannelControlProps";
import { connectedFaceArticulationDegrees } from "./anatomy/connectedFaceArticulationDegrees";
import { connectedFaceJawExcursionMillimetres } from "./anatomy/connectedFaceJawExcursionMillimetres";
import { describeConnectedFaceControlScale } from "./describeConnectedFaceControlScale";
import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";

/**
 * Build the control row of one fine face channel. Jaw opening and gaze show source endpoint degrees and forward/lateral jaw excursions millimetres; the displayed value and limits are the flat weight times that unit, and an entered value is divided back into the same flat weight. Only owned document coordinates are authored values; omission displays zero. The description names the channel's own note and each endpoint's displacement.
 *
 * @evidence contracts/common.md#principled-implementation One nonzero source factor scales both value and bounds, signed factors reorder endpoints with min/max, and input divides by that same factor before replacing an own canonical coordinate over the latest draft.
 * @evidence contracts/common.md#clear-and-simple-design Shared source-unit readers and scale formatter supply metadata while this producer composes one row and leaves DOM and complete admission to their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted coordinates display source neutral zero through own-property checks, source endpoints are not clinical ranges, and candidate construction is not treated as published or accepted geometry.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies canonical/display conversion, source degree and excursion units, owned value semantics and endpoint response descriptions.
 * @evidence contracts/performance.md#efficient-algorithms Row metadata reads a small articulation list and formats two endpoints; each edit clones d document values and copies k coordinates in its channel map in O(d+k) time/storage to preserve unrelated authored state.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The mount reuses supplied endpoint scales, but this row producer coordinates no numerical cache and each edit reads the latest draft before assembly.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned row metadata and edit closure remain with mounted controls until redraw or close; candidate clones are ordinary caller data and no worker or GPU resource is acquired here.
 */
export function createConnectedFaceChannelControl(
  props: ICreateConnectedFaceChannelControlProps,
): IConnectedFaceControlEntry {
  const channel: ICreateConnectedFaceChannelControlProps["channel"] = props.channel;
  const scale: ICreateConnectedFaceChannelControlProps["scale"] = props.scale;
  const document: IAutoMovieHumanFaceBasisDocument = props.document;
  const angle: number | null = connectedFaceArticulationDegrees(props.basis, channel.id);
  const distance: number | null = connectedFaceJawExcursionMillimetres(
    props.basis,
    channel.id,
  );
  const metric: IConnectedFaceControlMetric | null =
    angle !== null
      ? { perWeight: angle, unit: "°", label: "°" }
      : distance !== null
        ? { perWeight: distance, unit: " mm", label: "mm" }
        : null;
  const unit: number = metric?.perWeight ?? 1;
  return {
    ...channel,
    label:
      channel.id.replace(/([a-z])([A-Z])/g, "$1 $2") +
      (metric === null ? "" : ` (${metric.label})`),
    group: props.group,
    minimum: Math.min(channel.minimum * unit, channel.maximum * unit),
    maximum: Math.max(channel.minimum * unit, channel.maximum * unit),
    value: Object.hasOwn(document[channel.kind], channel.id)
      ? document[channel.kind][channel.id] * unit
      : 0,
    description: [
      ...(channel.description === undefined ? [] : [channel.description]),
      describeConnectedFaceControlScale("+", scale.positive, metric),
      ...(scale.negative === null
        ? []
        : [describeConnectedFaceControlScale("-", scale.negative, metric)]),
    ].join(" · "),
    edit: (value: number): IAutoMovieHumanFaceBasisDocument => {
      const next: IAutoMovieHumanFaceBasisDocument = structuredClone(props.latest());
      next[channel.kind] = {
        ...next[channel.kind],
        [channel.id]: value / unit,
      };
      return next;
    },
  };
}
