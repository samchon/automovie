import type { AutoMovieViseme } from "@automovie/interface";

/**
 * The fixed table from IPA phoneme symbols to the MPEG-4 viseme set (ISO/IEC
 * 14496-2 Annex C).
 *
 * Each symbol takes the viseme of its place of articulation as Ladefoged and
 * Johnson (A Course in Phonetics) classify it: bilabials p b m close the lips
 * (`PP`); labiodentals f v put the lower lip to the teeth (`FF`); dentals θ ð
 * (`TH`); alveolar stops and the tap t d ɾ (`DD`); velars k g ɡ ŋ x (`kk`);
 * postalveolar fricatives and affricates ʃ ʒ tʃ dʒ, written with or without a
 * tie bar or as the ligatures ʧ ʤ (`CH`); alveolar fricatives s z (`SS`); the
 * alveolar nasal and laterals n l ɫ (`nn`); rhotics r ɹ ɻ (`RR`). Vowels take
 * the viseme of their height and rounding: open a ɑ ɒ æ ʌ ɐ (`aa`), mid front
 * and central e ɛ ə ɚ ɜ ɝ (`E`), close front i ɪ and the glide j (`I`), mid
 * back rounded o ɔ (`O`), close back rounded u ʊ and the glides w ʍ (`U`). The
 * glottals h ʔ have no oral articulation and take `sil`, so their neighbours
 * shape the mouth through coarticulation. Multi-symbol entries are matched
 * before single symbols.
 */
export const AUTOMOVIE_IPA_VISEMES: Readonly<Record<string, AutoMovieViseme>> = {
    p: "PP",
    b: "PP",
    m: "PP",
    f: "FF",
    v: "FF",
    θ: "TH",
    ð: "TH",
    t: "DD",
    d: "DD",
    ɾ: "DD",
    k: "kk",
    g: "kk",
    ɡ: "kk",
    ŋ: "kk",
    x: "kk",
    ʃ: "CH",
    ʒ: "CH",
    tʃ: "CH",
    dʒ: "CH",
    t͡ʃ: "CH",
    d͡ʒ: "CH",
    ʧ: "CH",
    ʤ: "CH",
    s: "SS",
    z: "SS",
    n: "nn",
    l: "nn",
    ɫ: "nn",
    r: "RR",
    ɹ: "RR",
    ɻ: "RR",
    a: "aa",
    ɑ: "aa",
    ɒ: "aa",
    æ: "aa",
    ʌ: "aa",
    ɐ: "aa",
    e: "E",
    ɛ: "E",
    ə: "E",
    ɚ: "E",
    ɜ: "E",
    ɝ: "E",
    i: "I",
    ɪ: "I",
    j: "I",
    o: "O",
    ɔ: "O",
    u: "U",
    ʊ: "U",
    w: "U",
    ʍ: "U",
    h: "sil",
    ʔ: "sil",
};
