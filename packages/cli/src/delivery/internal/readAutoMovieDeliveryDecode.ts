import type { IAutoMovieDeliveryContentAudit } from "@automovie/interface";

/*
 * Reads native video timing and detector markers from a successful FFmpeg
 * delivery decode. It also identifies the input's first audio stream when one
 * is listed, allowing the host to decide whether the audio pass is required.
 * Parameter log: Complete stderr from a successful video decode.
 * Parameter expected: Commissioned rational frame rate and frame count.
 * Returns: Decoded video evidence and the independently observed audio stream
 * status.
 */
export async function readAutoMovieDeliveryDecode(
  log: string,
  expected: Pick<Audit["expected"], "frameRate" | "frameCount">,
): Promise<IDeliveryDecode> {
  let videoIndex: number | undefined;
  let audioIndex: number | undefined;
  let listingInput = false;
  let inputListed = false;
  let timeBase: Ratio | undefined;
  let carrier: number | undefined;
  let malformed = false;
  const frames: IFrame[] = [];
  const markers: IMarker[] = [];

  for (const line of log.split(/\r?\n/u)) {
    if (/^Input #0,/u.test(line)) listingInput = true;
    if (listingInput) {
      if (line === "Stream mapping:") {
        listingInput = false;
        inputListed = true;
      }
      const match =
        /^\s+Stream #0:(\d+)(?:\[[^\]]*\])?(?:\([^)]*\))?: (Video|Audio):/u.exec(
          line,
        );
      if (match !== null) {
        const index = Number(match[1]);
        if (match[2] === "Video") videoIndex ??= index;
        if (match[2] === "Audio") audioIndex ??= index;
      }
    }

    const video = /^\[Parsed_showinfo_\d+ @ [^\]]+\]\s+(.*)$/u.exec(line)?.[1];
    if (video !== undefined) {
      const clock = /^config in time_base:\s*(\d+)\/(\d+),/u.exec(video);
      if (clock !== null) {
        if (timeBase !== undefined) malformed = true;
        timeBase = [Number(clock[1]), Number(clock[2])];
      }
      if (video.startsWith("n:")) {
        const row =
          /^n:\s*(\d+)\s+pts:\s*(-?\d+)\s+pts_time:(\S+)\s+duration:\s*(\d+)\s/u.exec(
            video,
          );
        const index = Number(row?.[1]);
        const pts = Number(row?.[2]);
        const ptsTime = row?.[3];
        const duration = Number(row?.[4]);
        if (
          ptsTime === undefined ||
          ![index, pts, duration, pts + duration].every(Number.isSafeInteger) ||
          duration < 1
        )
          malformed = true;
        else frames.push({ index, pts, ptsTime, duration });
      }
    }

    const metadata = /^\[Parsed_metadata_\d+ @ [^\]]+\]\s+(.*)$/u.exec(
      line,
    )?.[1];
    if (metadata === undefined) continue;
    if (metadata.startsWith("frame:")) {
      const row = /^frame:\s*\d+\s+pts:\s*(-?\d+)\s+pts_time:/u.exec(metadata);
      carrier = row === null ? undefined : Number(row[1]);
      if (carrier === undefined || !Number.isSafeInteger(carrier))
        malformed = true;
      continue;
    }
    const marker =
      /^lavfi\.(black_|freezedetect\.freeze_)(start|end)=(\S+)$/u.exec(
        metadata,
      );
    if (marker === null) continue;
    if (carrier === undefined || marker[3] === undefined) malformed = true;
    else
      markers.push({
        detector: marker[1] === "black_" ? "black" : "frozen",
        edge: marker[2] === "start" ? "start" : "end",
        carrier,
        ptsTime: marker[3],
      });
  }

  const audio: Stream =
    !inputListed || audioIndex !== undefined
      ? {
          status: "uncovered",
          reason: inputListed
            ? "The listed audio stream has not been decoded"
            : "The delivery input stream listing was incomplete",
        }
      : { status: "missing" };
  const inventory = {
    audio,
    ...(audioIndex === undefined ? {} : { audioIndex }),
  };
  if (inputListed && videoIndex === undefined)
    return { video: { status: "missing" }, ...inventory };

  const { AutoMovieEngineFrameClock } = await import("@automovie/engine");
  const first = frames[0];
  const last = frames.at(-1);
  if (
    malformed ||
    videoIndex === undefined ||
    !Number.isSafeInteger(videoIndex) ||
    !AutoMovieEngineFrameClock.isRatio(timeBase) ||
    first === undefined ||
    last === undefined
  )
    return {
      video: {
        status: "uncovered",
        reason: "Incomplete or invalid decoder frame evidence",
      },
      ...inventory,
    };

  const step: number | null = AutoMovieEngineFrameClock.ticksPerFrame(
    timeBase,
    expected.frameRate,
  );
  const continuous: boolean =
    frames.length === expected.frameCount &&
    step !== null &&
    frames.every(
      (frame: IFrame, index: number): boolean =>
        frame.index === index &&
        frame.pts === AutoMovieEngineFrameClock.boundary(index, step) &&
        frame.duration === step,
    );
  const observations = continuous ? readMarkers(markers, frames, timeBase) : [];
  if (observations === undefined)
    return {
      video: {
        status: "uncovered",
        reason: "Ambiguous or incomplete video detector markers",
      },
      ...inventory,
    };

  return {
    video: {
      status: "decoded",
      index: videoIndex,
      start: { ticks: first.pts, timeBase },
      end: { ticks: last.pts + last.duration, timeBase },
      continuous,
      observations,
    },
    ...inventory,
  };
}

type Audit = IAutoMovieDeliveryContentAudit.IProps;
type Detector = Extract<
  IAutoMovieDeliveryContentAudit.Detector,
  "black" | "frozen"
>;
type Ratio = IAutoMovieDeliveryContentAudit.Ratio;
type Stream = IAutoMovieDeliveryContentAudit.Stream;
type Observation = IAutoMovieDeliveryContentAudit.IObservation;

interface IFrame {
  index: number;
  pts: number;
  ptsTime: string;
  duration: number;
}

interface IMarker {
  detector: Detector;
  edge: "start" | "end";
  carrier: number;
  ptsTime: string;
}

/*
 * Decoded streams and the listed primary audio stream when present.
 */
interface IDeliveryDecode {
  /*
   * Native video presentation and observations.
   */
  video: Stream;
  /*
   * Audio availability before the host's separate decode.
   */
  audio: Stream;
  /*
   * The listed primary audio stream for the second decoder pass.
   */
  audioIndex?: number;
}

/*
 * Resolves paired transitions to exact decoded frame starts, allowing an open
 * range at verified EOF.
 */
function readMarkers(
  markers: IMarker[],
  frames: IFrame[],
  timeBase: Ratio,
): Observation[] | undefined {
  if (markers.length === 0) return [];
  const byTick = new Map<number, IFrame>();
  const byPrintedTime = new Map<string, IFrame | null>();
  for (const frame of frames) {
    byTick.set(frame.pts, frame);
    byPrintedTime.set(
      frame.ptsTime,
      byPrintedTime.has(frame.ptsTime) ? null : frame,
    );
  }
  const open: Partial<Record<Detector, IFrame>> = {};
  const observations: Observation[] = [];
  for (const marker of markers) {
    const carrier = byTick.get(marker.carrier);
    const start = open[marker.detector];
    if (carrier === undefined) return undefined;
    if (marker.edge === "start") {
      const origin =
        marker.detector === "frozen"
          ? byPrintedTime.get(marker.ptsTime)
          : carrier;
      if (
        start !== undefined ||
        origin === undefined ||
        origin === null ||
        origin.index > carrier.index ||
        origin.ptsTime !== marker.ptsTime
      )
        return undefined;
      open[marker.detector] = origin;
      continue;
    }
    if (
      start === undefined ||
      carrier.ptsTime !== marker.ptsTime ||
      start.index >= carrier.index
    )
      return undefined;
    delete open[marker.detector];
    if (marker.detector === "frozen" && carrier.index - start.index < 2)
      continue;
    observations.push({
      detector: marker.detector,
      start: { ticks: start.pts, timeBase },
      end: { ticks: carrier.pts, timeBase },
    });
  }

  for (const detector of ["black", "frozen"] as const) {
    const start = open[detector];
    if (start !== undefined)
      observations.push({
        detector,
        start: { ticks: start.pts, timeBase },
        end: null,
      });
  }
  return observations;
}
