/**
 * Search vocabulary for the models reverse handoff audit. This is authored
 * review input, not a production registry. The consumer is handoffs() in
 * model-contract-audit.cjs. Add a term when a parent or sibling uses a new
 * word for a model handoff, then reread every candidate it newly selects.
 */
module.exports = {
  korean: [
    "모델", "원형", "후속 부재", "후속 저작", "가구", "물체", "형상", "실내", "인테리어", "반복", "결정", "제작",
    "샤워", "욕조", "세면대", "변기", "수건", "세탁", "싱크", "레인지", "후드", "냉장고", "오븐", "쿡탑",
    "그릇", "쟁반", "액자", "화분", "러그", "쿠션", "펜던트", "벽등", "매입등", "스탠드", "거울", "커튼",
    "블라인드", "셰이드", "카펫", "난간", "수납", "벽장", "문짝", "조리대", "옷걸이", "콘센트", "바구니",
    "린넨", "세탁기", "건조기", "설비", "장비", "환기", "전기변색", "루버", "배수구", "방석", "이불", "매트리스", "손잡이", "장식", "패널", "판", "화구", "선반", "홈통", "후레싱", "플래싱", "창틀", "트림", "조명", "식료품", "식물", "식재", "수목", "책장", "책(?!임)", "걸레받이", "줄눈", "타일", "문틀", "문선", "문턱", "모서리", "밀폐", "정원문", "현관문"
  ],
  english: [
    "models?", "modelSources", "fit-out", "screen", "display", "TV", "monitor", "mirror", "curtain", "blind", "shade", "roller", "carpet", "handrail", "balustrade", "baluster", "storage", "closet", "leaf", "countertop", "worktop", "counter", "hook", "rail", "outlet", "socket", "basket", "linen", "dryer", "mechanical", "equipment", "heat.?pump", "ventilat(?:ion|or|e)?", "electrochromic", "louv(?:re|er)", "trim", "cord", "tap", "spout", "drain", "oven", "hob", "cushion", "duvet", "mattress", "keyboard", "decor", "handle", "riser", "panel", "cabinet", "bed", "table", "mat", "flashing", "gutter", "siding", "shingle", "baseboard", "grout", "tile", "jamb", "casing", "threshold", "corner", "seal"
  ],
};
