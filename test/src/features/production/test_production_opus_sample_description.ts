import type { IAutoMovieProductionAudioProbe } from "@automovie/interface";
import {
  assertProductionOpusProfile,
  productionOpusDescription,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

function box(): {
  type: string;
  Version: number;
  OutputChannelCount: number;
  PreSkip: number;
  InputSampleRate: number;
  OutputGain: number;
  ChannelMappingFamily: number;
  StreamCount: number;
  CoupledCount: number;
  ChannelMapping: number[];
} {
  return {
    type: "dOps",
    Version: 0,
    OutputChannelCount: 2,
    PreSkip: 312,
    InputSampleRate: 48_000,
    OutputGain: 0,
    ChannelMappingFamily: 0,
    StreamCount: 1,
    CoupledCount: 1,
    ChannelMapping: [],
  };
}

const audio: () => IAutoMovieProductionAudioProbe = (): IAutoMovieProductionAudioProbe => ({
  kind: "audio",
  container: "mp4",
  codec: "opus",
  runtimeSeconds: 1,
  channels: 2,
  sampleRate: 48_000,
  sampleCount: 50,
  primingSamples: 312,
  timebase: {
    movieTimescale: 48_000,
    mediaTimescale: 48_000,
    movieDuration: 48_000,
    mediaDuration: 48_312,
    edits: [
      {
        segmentDuration: 48_000,
        mediaTime: 312,
        mediaRateInteger: 1,
        mediaRateFraction: 0,
      },
    ],
  },
  sampleEntry: productionOpusDescription({
    boxes: [box()],
    codec: "Opus",
    trackChannels: 2,
  }),
});

const refused: (closure: () => unknown, message: string) => boolean = (closure: () => unknown, message: string): boolean => {
  try {
    closure();
    return false;
  } catch (error) {
    return error instanceof Error && error.message.includes(message);
  }
};

/**
 * Validate exact Opus sample-description structure and current profile facts.
 *
 * Scenarios:
 * 1. Family zero normalizes its absent tail and resolves mono/stereo order,
 *    while nonzero families preserve their exact stream and mapping facts.
 * 2. Missing, duplicate, malformed, cross-record-inconsistent, and structurally
 *    impossible `dOps` fields fail before profile comparison.
 * 3. Every current-profile field, including signed gain and presentation clocks,
 *    has a one-field negative twin that cannot pass through codec abbreviation.
 * 4. Relations RFC 7845 permits parse as observed rather than as malformed: an
 *    informational input rate other than 48 kHz, and a family 255 mapping that
 *    outputs fewer channels than the streams decode. Relations it forbids are
 *    refused: a family 1 box above eight channels and more than 255 decoded
 *    channels, each beside its accepted boundary twin.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual Opus sample-description parser and delivery-profile checker over authored records, observing normalized family-zero facts, exact nonzero mappings, structural refusals and each named profile mismatch.
 * @evidence contracts/testing.md#independent-expectations Literal dOps bit-width/family relations, mapping orders and profile substitutions supply expectations independently of the parser. These record cases establish metadata admission and profile comparison without encoded packet parsing, audible sound or decoder interoperability.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts mono/stereo and mapped families, missing/duplicate/malformed descriptions and one-field profile twins; accepted informational rates and 8/9-family-one or 255/256-decoded-channel boundaries prevent conflating structural legality with the narrower delivery profile.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns local records, cloned negative twins and refusal callbacks only; it opens no file, codec process, renderer, browser or GPU and replaces no foreign method or production consumer.
 */
export function test_production_opus_sample_description(): void {
  const current: IAutoMovieProductionAudioProbe = audio();
  assertProductionOpusProfile(current);
  const absentFamilyZeroTail: ReturnType<typeof box> = box();
  delete (absentFamilyZeroTail as Partial<ReturnType<typeof box>>)
    .ChannelMapping;
  const mono: ReturnType<typeof productionOpusDescription> = productionOpusDescription({
    boxes: [{ ...absentFamilyZeroTail, OutputChannelCount: 1 }],
    codec: "opus.0",
    trackChannels: 1,
  });
  const familyOne: ReturnType<typeof productionOpusDescription> = productionOpusDescription({
    boxes: [
      {
        ...box(),
        ChannelMappingFamily: 1,
        StreamCount: 1,
        CoupledCount: 1,
        ChannelMapping: [0, 1],
      },
    ],
    codec: "Opus",
    trackChannels: 2,
  });
  TestValidator.equals(
    "the parser preserves normalized family-zero and ordered nonzero mappings",
    {
      stereo: current.sampleEntry.channelMapping,
      mono: mono.channelMapping,
      familyOne: familyOne.channelMapping,
    },
    {
      stereo: {
        family: 0,
        streamCount: null,
        coupledCount: null,
        mapping: [],
        channelOrder: ["front-left", "front-right"],
      },
      mono: {
        family: 0,
        streamCount: null,
        coupledCount: null,
        mapping: [],
        channelOrder: ["mono"],
      },
      familyOne: {
        family: 1,
        streamCount: 1,
        coupledCount: 1,
        mapping: [0, 1],
        channelOrder: null,
      },
    },
  );
  const malformed: (mutate: (value: ReturnType<typeof box>) => void) => boolean = (mutate: (value: ReturnType<typeof box>) => void): boolean => {
    const value: ReturnType<typeof box> = box();
    mutate(value);
    return refused(
      (): ReturnType<typeof productionOpusDescription> =>
        productionOpusDescription({
          boxes: [value],
          codec: "opus",
          trackChannels: 2,
        }),
      "malformed-dOps",
    );
  };
  TestValidator.equals(
    "invalid sample descriptions fail structurally and by exact relation",
    {
      codec: refused(
        (): ReturnType<typeof productionOpusDescription> =>
          productionOpusDescription({
            boxes: [box()],
            codec: "mp4a",
            trackChannels: 2,
          }),
        "sampleEntry",
      ),
      missing: refused(
        (): ReturnType<typeof productionOpusDescription> =>
          productionOpusDescription({
            boxes: undefined,
            codec: "opus",
            trackChannels: 2,
          }),
        "observed 0",
      ),
      duplicate: refused(
        (): ReturnType<typeof productionOpusDescription> =>
          productionOpusDescription({
            boxes: [box(), box()],
            codec: "opus",
            trackChannels: 2,
          }),
        "observed 2",
      ),
      version: malformed((value: ReturnType<typeof box>): number => (value.Version = 256)),
      channelCount: malformed((value: ReturnType<typeof box>): number => (value.OutputChannelCount = 0)),
      preSkip: malformed((value: ReturnType<typeof box>): number => (value.PreSkip = -1)),
      sampleRate: malformed((value: ReturnType<typeof box>): number => (value.InputSampleRate = 0)),
      gain: malformed((value: ReturnType<typeof box>): number => (value.OutputGain = 32_768)),
      family: malformed((value: ReturnType<typeof box>): number => (value.ChannelMappingFamily = 256)),
      reservedFamily: malformed((value: ReturnType<typeof box>): void => {
        value.ChannelMappingFamily = 2;
      }),
      mappingArray: malformed(
        (value: ReturnType<typeof box>): number[] => (value.ChannelMapping = null as unknown as number[]),
      ),
      mappingValue: malformed((value: ReturnType<typeof box>): number[] => (value.ChannelMapping = [-1])),
      trackMismatch: malformed((value: ReturnType<typeof box>): number => (value.OutputChannelCount = 1)),
      familyZeroCount: refused(
        (): ReturnType<typeof productionOpusDescription> =>
          productionOpusDescription({
            boxes: [{ ...box(), OutputChannelCount: 3 }],
            codec: "opus",
            trackChannels: 3,
          }),
        "family 0 supports mono or stereo",
      ),
      familyZeroMap: malformed((value: ReturnType<typeof box>): number[] => (value.ChannelMapping = [0, 1])),
      streamCount: malformed((value: ReturnType<typeof box>): void => {
        value.ChannelMappingFamily = 1;
        value.StreamCount = 0;
      }),
      coupledCount: malformed((value: ReturnType<typeof box>): void => {
        value.ChannelMappingFamily = 1;
        value.CoupledCount = -1;
      }),
      impossibleCounts: malformed((value: ReturnType<typeof box>): void => {
        value.ChannelMappingFamily = 1;
        value.StreamCount = 1;
        value.CoupledCount = 2;
        value.ChannelMapping = [0, 1];
      }),
      wrongMapLength: malformed((value: ReturnType<typeof box>): void => {
        value.ChannelMappingFamily = 1;
        value.ChannelMapping = [0];
      }),
      outOfRangeMap: malformed((value: ReturnType<typeof box>): void => {
        value.ChannelMappingFamily = 1;
        value.ChannelMapping = [0, 2];
      }),
    },
    {
      codec: true,
      missing: true,
      duplicate: true,
      version: true,
      channelCount: true,
      preSkip: true,
      sampleRate: true,
      gain: true,
      family: true,
      reservedFamily: true,
      mappingArray: true,
      mappingValue: true,
      trackMismatch: true,
      familyZeroCount: true,
      familyZeroMap: true,
      streamCount: true,
      coupledCount: true,
      impossibleCounts: true,
      wrongMapLength: true,
      outOfRangeMap: true,
    },
  );
  const rfcRelations: (patch: Partial<ReturnType<typeof box>>, trackChannels: number) => string = (
    patch: Partial<ReturnType<typeof box>>,
    trackChannels: number,
  ): string => {
    try {
      const parsed: ReturnType<typeof productionOpusDescription> = productionOpusDescription({
        boxes: [{ ...box(), ...patch }],
        codec: "Opus",
        trackChannels,
      });
      return `accepted ${parsed.inputSampleRate} ${parsed.channelMapping.mapping.join(",")}`;
    } catch (error) {
      return error instanceof Error && error.message.includes("malformed-dOps")
        ? "malformed"
        : `unexpected: ${String(error)}`;
    }
  };
  TestValidator.equals(
    "RFC 7845 relations parse or refuse by the specification",
    {
      informationalInputRate: rfcRelations({ InputSampleRate: 44_100 }, 2),
      fewerOutputsThanDecoded: rfcRelations(
        {
          OutputChannelCount: 1,
          ChannelMappingFamily: 255,
          StreamCount: 1,
          CoupledCount: 1,
          ChannelMapping: [1],
        },
        1,
      ),
      familyOneEightChannels: rfcRelations(
        {
          OutputChannelCount: 8,
          ChannelMappingFamily: 1,
          StreamCount: 5,
          CoupledCount: 3,
          ChannelMapping: [0, 6, 1, 2, 3, 4, 5, 7],
        },
        8,
      ),
      familyOneNineChannels: rfcRelations(
        {
          OutputChannelCount: 9,
          ChannelMappingFamily: 1,
          StreamCount: 5,
          CoupledCount: 4,
          ChannelMapping: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        9,
      ),
      decodedChannelBoundary: rfcRelations(
        {
          OutputChannelCount: 1,
          ChannelMappingFamily: 255,
          StreamCount: 200,
          CoupledCount: 55,
          ChannelMapping: [254],
        },
        1,
      ),
      decodedChannelLimit: rfcRelations(
        {
          OutputChannelCount: 1,
          ChannelMappingFamily: 255,
          StreamCount: 200,
          CoupledCount: 56,
          ChannelMapping: [0],
        },
        1,
      ),
    },
    {
      informationalInputRate: "accepted 44100 ",
      fewerOutputsThanDecoded: "accepted 48000 1",
      familyOneEightChannels: "accepted 48000 0,6,1,2,3,4,5,7",
      familyOneNineChannels: "malformed",
      decodedChannelBoundary: "accepted 48000 254",
      decodedChannelLimit: "malformed",
    },
  );
  const substitutions: Array<
    [string, (value: IAutoMovieProductionAudioProbe) => void]
  > = [
    ["codec", (value: IAutoMovieProductionAudioProbe): string => (value.codec = "mp4a")],
    ["channels", (value: IAutoMovieProductionAudioProbe): number => (value.channels = 1)],
    ["sampleRate", (value: IAutoMovieProductionAudioProbe): number => (value.sampleRate = 44_100)],
    ["sampleCount", (value: IAutoMovieProductionAudioProbe): number => (value.sampleCount = 0)],
    ["dOps.version", (value: IAutoMovieProductionAudioProbe): number => (value.sampleEntry.version = 1)],
    [
      "dOps.outputChannelCount",
      (value: IAutoMovieProductionAudioProbe): number => (value.sampleEntry.outputChannelCount = 1),
    ],
    [
      "dOps.inputSampleRate",
      (value: IAutoMovieProductionAudioProbe): number => (value.sampleEntry.inputSampleRate = 44_100),
    ],
    [
      "dOps.outputGainQ7_8",
      (value: IAutoMovieProductionAudioProbe): number => (value.sampleEntry.outputGainQ7_8 = 256),
    ],
    [
      "dOps.channelMappingFamily",
      (value: IAutoMovieProductionAudioProbe): number => (value.sampleEntry.channelMapping.family = 255),
    ],
    [
      "dOps.streamCount",
      (value: IAutoMovieProductionAudioProbe): number => (value.sampleEntry.channelMapping.streamCount = 1),
    ],
    [
      "dOps.coupledCount",
      (value: IAutoMovieProductionAudioProbe): number => (value.sampleEntry.channelMapping.coupledCount = 1),
    ],
    [
      "dOps.mapping",
      (value: IAutoMovieProductionAudioProbe): number[] => (value.sampleEntry.channelMapping.mapping = [0, 1]),
    ],
    [
      "dOps.channelOrder",
      (value: IAutoMovieProductionAudioProbe): NonNullable<IAutoMovieProductionAudioProbe["sampleEntry"]["channelMapping"]["channelOrder"]> =>
        (value.sampleEntry.channelMapping.channelOrder = [
          "front-right",
          "front-left",
        ]),
    ],
    ["dOps.preSkip", (value: IAutoMovieProductionAudioProbe): number => (value.sampleEntry.preSkip = 0)],
    ["timebase.movieTimescale", (value: IAutoMovieProductionAudioProbe): number => (value.timebase.movieTimescale = 0)],
    [
      "timebase.mediaTimescale",
      (value: IAutoMovieProductionAudioProbe): number => (value.timebase.mediaTimescale = 44_100),
    ],
    ["timebase.movieDuration", (value: IAutoMovieProductionAudioProbe): number => (value.timebase.movieDuration = 0)],
    ["timebase.mediaDuration", (value: IAutoMovieProductionAudioProbe): number => (value.timebase.mediaDuration = 0)],
    ["timebase.edits.length", (value: IAutoMovieProductionAudioProbe): IAutoMovieProductionAudioProbe["timebase"]["edits"] => (value.timebase.edits = [])],
    [
      "timebase.edit.segmentDuration",
      (value: IAutoMovieProductionAudioProbe): number => (value.timebase.edits[0]!.segmentDuration -= 1),
    ],
    [
      "timebase.edit.mediaTime",
      (value: IAutoMovieProductionAudioProbe): number => (value.timebase.edits[0]!.mediaTime = 0),
    ],
    [
      "timebase.edit.mediaRateInteger",
      (value: IAutoMovieProductionAudioProbe): number => (value.timebase.edits[0]!.mediaRateInteger = 0),
    ],
    [
      "timebase.edit.mediaRateFraction",
      (value: IAutoMovieProductionAudioProbe): number => (value.timebase.edits[0]!.mediaRateFraction = 1),
    ],
    [
      "timebase.presentationSamples",
      (value: IAutoMovieProductionAudioProbe): number => (value.timebase.movieTimescale = 47_999),
    ],
    [
      "timebase.codedCoverage",
      (value: IAutoMovieProductionAudioProbe): number => (value.timebase.mediaDuration = 48_311),
    ],
    ["runtimeSeconds", (value: IAutoMovieProductionAudioProbe): number => (value.runtimeSeconds = 2)],
  ];
  TestValidator.predicate(
    "every profile field has a one-field refusing twin",
    substitutions.every(([field, mutate]: [string, (value: IAutoMovieProductionAudioProbe) => void]): boolean => {
      const value: IAutoMovieProductionAudioProbe = structuredClone(current);
      mutate(value);
      return refused((): void => assertProductionOpusProfile(value), field);
    }),
  );
}
