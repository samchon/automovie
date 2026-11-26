import type { IAutoMovieInspectionLegendEntry } from "@automovie/interface";
import type * as THREE from "three";

import type { IAutoMovieInspectorLive } from "./IAutoMovieInspectorLive.js";
import type { IAutoMovieInspectorScene } from "../IAutoMovieInspectorScene.js";
import { placeAutoMovieInspectorLabels } from "./placeAutoMovieInspectorLabels.js";

/**
 * Report a painted picture's legend and labels: while paused, the inspection's
 * legend with the witness legend and the labels placed on the picture's pixels;
 * while playing, no labels, cleared once when the picture had some.
 */
export function reportAutoMovieInspectorLabels(props: {
  /** The mount's live state, whose `labelled` flag this keeps. */
  now: IAutoMovieInspectorLive;

  /** Where the mount reports. */
  report: IAutoMovieInspectorScene.IReport;

  /** The camera the picture was drawn through. */
  camera: THREE.Camera;

  /** The witness cubes' legend of this picture. */
  diagnosticLegend: readonly IAutoMovieInspectionLegendEntry[];

  /** Whether the playhead is playing. */
  playing: boolean;
}): void {
  const { now, report }: typeof props = props;
  if (!props.playing) {
    report.legend([...now.inspection.legend, ...props.diagnosticLegend]);
    report.labels(
      placeAutoMovieInspectorLabels({
        inspection: now.inspection,
        camera: props.camera,
        raster: now.instance,
        shown: now.size!,
      }),
    );
    now.labelled = true;
  } else if (now.labelled) {
    report.labels({ labels: [], lineHeight: 0, dropped: 0 });
    now.labelled = false;
  }
}
