import type { IAutoMovieLoudnessIntent } from "@automovie/interface";

/**
 * The loudness targets a production gets when it declares none: EBU R 128
 * (2020), a programme loudness of −23.0 LUFS, a permitted deviation of ±0.5 LU
 * and a maximum true peak of −1 dBTP. Dialogue is levelled to the same −23
 * LUFS.
 */
export const AUTOMOVIE_EBU_R128_LOUDNESS: Readonly<IAutoMovieLoudnessIntent> = {
    integratedLufs: -23,
    toleranceLu: 0.5,
    maximumTruePeakDbtp: -1,
};
