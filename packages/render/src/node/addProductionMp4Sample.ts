import type { BoxParser, Sample, createFile } from "mp4box";

import { residentMp4Box } from "./residentMp4Box";

/**
 * Append one coded sample preserving its parsed dependency flags and subsamples.
 *
 * The target track must already exist. mp4box's public addSample operation creates a one-sample fragment, but its fragment builder derives dependency defaults from sync state and omits other parsed flag fields. Options come from a parsed source sample. This adapter fills the public sample_flags field using the ISO/IEC 14496-12 sample-flags layout. It also emits an optional version-1 subsample-information box and adjusts the fragment-relative data offset. Payload bytes, duration and composition offset remain addSample's inputs. The four reserved bits and padding field are not exposed by mp4box's Sample record and remain zero; this preserves available parsed fields, not an opaque original 32-bit flag word.
 *
 * The field layouts are ISO/IEC 14496-12:2015 sections 8.8.3.1 and 8.7.7.2:
 * https://b.goeswhere.com/ISO_IEC_14496-12_2015a.pdf#page=69
 * https://b.goeswhere.com/ISO_IEC_14496-12_2015a.pdf#page=65
 *
 * A negative composition offset selects trun version 1, whose field is signed under section 8.8.8.2; version 0 otherwise retains the unsigned representation. mp4box creates version-0 runs even for negative input offsets, so leaving its default would wrap the written presentation clock. Offsets must fit the chosen 32-bit field; this adapter does not add a separate range-admission policy.
 * https://hezhaojiang.github.io/slave/MP4/ISO-IEC-14496-12-Base-Format-2015.pdf#page=73
 *
 * Throws if the track does not exist or addSample does not produce its declared one-sample fragment. File construction is caller-owned and must be discarded after a failure; no serialized output has been published here. H.264 normalization, lossless clip appending and feature mux track copying call this adapter before their written outputs are independently probed.
 *
 * @evidence contracts/common.md#principled-implementation ISO sample flags assign leading, dependency, depended-on and redundancy fields to bits 26, 24, 22 and 20, the non-sync bit to 16 and degradation priority to the low sixteen bits; writing the parsed integer fields into that layout preserves unknown values as well as positive declarations. A negative composition offset requires signed trun version 1, while other offsets keep unsigned version 0, under the stated representability premise. The optional subs payload uses version-1 unsigned 32-bit sizes and one sample delta because addSample creates one fragment per sample.
 * @evidence contracts/common.md#clear-and-simple-design The adapter owns the public fragment layout used by H.264 normalization, lossless clip appending and feature mux track copying; each writer supplies the source bytes and parsed fields without replacing a library method.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only published box fields are populated before serialization, and no source, codec or sample ordinal is special-cased. Unknown dependency zero is preserved instead of rewritten to hide the writer's prior information loss.
 * @evidence contracts/common.md#meaningful-documentation The comment states the track prerequisite, exact preserved sample facts, the external fragment builder's flag and signed-offset limitations, the 32-bit offset premise, optional subsample representation and caller-owned failure disposal.
 * @evidence contracts/performance.md#efficient-algorithms For B payload bytes and U subsamples, addSample copies B bytes once, flag assignment is constant and optional subs serialization is O(U); the newest fragment is addressed directly rather than scanning prior fragments.
 * @evidence contracts/performance.md#reuse-equivalent-work The already-created fragment and parsed sample fields are reused to finish one append; this mutating operation cannot be shared across target files or sample positions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller-owned output file retains the sample payload copy, source view and fragment boxes until discarded or serialized; optional subs payload storage is proportional to its entries, and this adapter opens no process or file handle.
 */
export function addProductionMp4Sample(
  file: ReturnType<typeof createFile>,
  track: number,
  bytes: Uint8Array<ArrayBuffer>,
  options: NonNullable<Parameters<ReturnType<typeof createFile>["addSample"]>[2]>,
): void {
  const sample: Sample | undefined = file.addSample(track, bytes, options);
  const fragment: InstanceType<typeof BoxParser.box.moof> | undefined =
    file.moofs.at(-1);
  const run: InstanceType<typeof BoxParser.box.trun> | undefined =
    fragment?.trafs[0]?.truns[0];
  if (
    sample === undefined ||
    fragment === undefined ||
    fragment.trafs.length !== 1 ||
    fragment.trafs[0]!.tfhd.track_id !== track ||
    run === undefined ||
    run.sample_count !== 1 ||
    run.sample_flags.length !== 1
  )
    throw new Error("MP4 sample append requires one existing track and one sample fragment.");
  run.version = sample.cts < sample.dts ? 1 : 0;
  run.sample_flags[0] =
    ((sample.is_leading << 26) |
      (sample.depends_on << 24) |
      (sample.is_depended_on << 22) |
      (sample.has_redundancy << 20) |
      (Number(!sample.is_sync) << 16) |
      sample.degradation_priority) >>> 0;
  if (sample.subsamples === undefined || sample.subsamples.length === 0) return;
  if (sample.subsamples.length > 65_535)
    throw new Error("MP4 sample subsample count exceeds its unsigned 16-bit field.");
  const payload: Uint8Array = new Uint8Array(10 + sample.subsamples.length * 10);
  const fields: DataView = new DataView(payload.buffer);
  fields.setUint32(0, 1);
  fields.setUint32(4, 1);
  fields.setUint16(8, sample.subsamples.length);
  for (let index: number = 0; index < sample.subsamples.length; ++index) {
    const part: NonNullable<Sample["subsamples"]>[number] = sample.subsamples[index]!;
    const offset: number = 10 + index * 10;
    fields.setUint32(offset, part.size);
    fields.setUint8(offset + 4, part.priority);
    fields.setUint8(offset + 5, part.discardable);
    fields.setUint32(offset + 6, part.codec_specific_parameters);
  }
  const subs: InstanceType<typeof BoxParser.box.subs> =
    new (residentMp4Box().BoxParser.box.subs)();
  subs.version = 1;
  subs.data = payload;
  fragment.trafs[0]!.addBox(subs);
  fragment.computeSize();
  run.data_offset = fragment.size + 8;
}
