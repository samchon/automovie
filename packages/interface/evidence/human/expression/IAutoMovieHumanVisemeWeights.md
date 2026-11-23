# src/human/expression/IAutoMovieHumanVisemeWeights.ts#IAutoMovieHumanVisemeWeights

## @evidence contracts/development/common.md#meaningful-documentation

Blend weights of the 15 standard visemes, each from 0 (absent) to 1 (full mouth shape), named as in the Meta (Oculus) Lipsync viseme reference, which follows the MPEG-4 viseme set.

## @evidence contracts/development/design.md#principled-representation `sil`: Silence, the closed resting mouth. `PP`: p, b, m: lips pressed together ("put", "bat", "mat"). `FF`: f, v: lower lip against the upper teeth ("fat", "vat").

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanVisemeWeights is the canonical exchange used by IAutoMovieHumanVisemeWeightsSchema, IAutoMovieHumanMouthExpression.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `sil`: Silence, the closed resting mouth. `PP`: p, b, m: lips pressed together ("put", "bat", "mat"). `FF`: f, v: lower lip against the upper teeth ("fat", "vat"). `TH`: th: tongue tip between the teeth ("think", "that"). `DD`: t, d: tongue tip on the alveolar ridge ("tip", "doll"). `kk`: k, g: tongue dorsum against the soft palate ("call", "gas"). `CH`: ch, j, sh: rounded, protruded lips ("chair", "join", "she"). `SS`: s, z: teeth nearly closed ("sir", "zeal"). `nn`: n, l: tongue tip up, mouth slightly open ("lot", "not"). `RR`: r ("red"). `aa`: Open vowel as in "car". `E`: Vowel as in "bed". `I`: Vowel as in "tip". `O`: Rounded vowel as in "toe". `U`: Close rounded vowel as in "book".
