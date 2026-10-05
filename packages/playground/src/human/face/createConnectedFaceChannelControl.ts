import { connectedFaceArticulationDegrees } from "./anatomy/connectedFaceArticulationDegrees";
import { connectedFaceJawExcursionMillimetres } from "./anatomy/connectedFaceJawExcursionMillimetres";
import type { IConnectedFaceControlEntry } from "./IConnectedFaceControlEntry";
import type { IConnectedFaceControlMetric } from "./IConnectedFaceControlMetric";
import type { ICreateConnectedFaceChannelControlProps } from "./ICreateConnectedFaceChannelControlProps";
import { describeConnectedFaceControlScale } from "./describeConnectedFaceControlScale";

/**
 * Build the control row of one fine face channel. Jaw opening and gaze show
 * source endpoint degrees and forward/lateral jaw excursions millimetres; the
 * displayed value and limits are the flat weight times that unit, and an
 * entered value is divided back into the same flat weight. Only owned
 * document coordinates are authored values; omission displays zero. The
 * description names the channel's own note and each endpoint's displacement.
 *
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Shows current values, effective domains and endpoint displacement in the channel's display unit.
 */
export function createConnectedFaceChannelControl(props: ICreateConnectedFaceChannelControlProps): IConnectedFaceControlEntry {
  const { channel, scale, document } = props;
  const angle = connectedFaceArticulationDegrees(props.basis, channel.id);
  const distance = connectedFaceJawExcursionMillimetres(props.basis, channel.id);
  const metric: IConnectedFaceControlMetric | null = angle !== null
    ? { perWeight: angle, unit: "°", label: "°" }
    : distance !== null
      ? { perWeight: distance, unit: " mm", label: "mm" }
      : null;
  const unit = metric?.perWeight ?? 1;
  return {
    ...channel,
    label: channel.id.replace(/([a-z])([A-Z])/g, "$1 $2") + (metric === null ? "" : ` (${metric.label})`),
    group: props.group,
    minimum: Math.min(channel.minimum * unit, channel.maximum * unit),
    maximum: Math.max(channel.minimum * unit, channel.maximum * unit),
    value: Object.hasOwn(document[channel.kind], channel.id) ? document[channel.kind][channel.id] * unit : 0,
    description: [
      ...(channel.description === undefined ? [] : [channel.description]),
      describeConnectedFaceControlScale("+", scale.positive, metric),
      ...(scale.negative === null ? [] : [describeConnectedFaceControlScale("-", scale.negative, metric)]),
    ].join(" · "),
    edit: (value) => {
      const next = structuredClone(props.latest());
      next[channel.kind] = { ...next[channel.kind], [channel.id]: value / unit };
      return next;
    },
  };
}
