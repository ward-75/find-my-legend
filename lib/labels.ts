import type { DomainKey, StyleKey } from "./types";

export interface DomainMeta {
  label: string;
  /** 도메인 성향 한 줄 설명 (서비스 해석) */
  gist: string;
  color: string;
  /** 어두운 배경 위 옅은 면 색 */
  tint: string;
}

export const DOMAIN_META: Record<DomainKey, DomainMeta> = {
  body: { label: "Body", gist: "램프, 버프, 큰 유닛으로 정면 승부", color: "#F28A3A", tint: "rgba(242,138,58,0.14)" },
  fury: { label: "Fury", gist: "빠른 압박, 정복, 직접 피해", color: "#E8474F", tint: "rgba(232,71,79,0.14)" },
  calm: { label: "Calm", gist: "대응, 이동, 트릭으로 흐름 조율", color: "#3DB57E", tint: "rgba(61,181,126,0.14)" },
  mind: { label: "Mind", gist: "드로우, 장비, 계획적인 선택지", color: "#4C8DF6", tint: "rgba(76,141,246,0.14)" },
  chaos: { label: "Chaos", gist: "방해, Hidden, 변칙과 리스크", color: "#A064E8", tint: "rgba(160,100,232,0.14)" },
  order: { label: "Order", gist: "토큰, 제거, Deathknell, 시스템", color: "#E3BF45", tint: "rgba(227,191,69,0.14)" },
};

export interface StyleMeta {
  label: string;
  en: string;
  /** "✓" 목록에 쓰는 짧은 명사구 */
  trait: string;
  /** 전설 수치가 사용자보다 크게 높을 때 주의 문구 */
  legendHigher: string;
  /** 사용자 수치가 전설보다 크게 높을 때 주의 문구 */
  userHigher: string;
}

export const STYLE_META: Record<StyleKey, StyleMeta> = {
  aggression: { label: "공격성", en: "Aggression", trait: "먼저 몰아붙이는 공격성",
    legendHigher: "공격 성향이 강한 전설이라 느긋한 운영을 원하면 조급하게 느껴질 수 있음",
    userHigher: "당신이 원하는 만큼 빠르게 몰아붙이는 전설은 아님" },
  control: { label: "컨트롤", en: "Control", trait: "상대를 억제하는 컨트롤",
    legendHigher: "상대를 막고 버티는 시간이 길어 답답하게 느껴질 수 있음",
    userHigher: "상대를 완전히 틀어막는 컨트롤 덱을 원한다면 조금 다를 수 있음" },
  tempo: { label: "템포", en: "Tempo", trait: "한 박자 빠른 템포",
    legendHigher: "매 턴 빠른 판단을 요구해 호흡이 가쁘게 느껴질 수 있음",
    userHigher: "템포 싸움보다 묵직한 운영에 가까움" },
  combo: { label: "콤보", en: "Combo", trait: "카드끼리 맞물리는 콤보",
    legendHigher: "카드 조합이 맞아야 힘을 내서 조각이 안 모이면 약해짐",
    userHigher: "콤보를 완성하는 쾌감은 덜한 편" },
  midrange: { label: "미드레인지", en: "Midrange", trait: "중반 보드 싸움",
    legendHigher: "중반 보드 싸움 중심이라 극단적인 전략을 원하면 밋밋할 수 있음",
    userHigher: "무난한 중반 운영보다 한쪽으로 치우친 전설" },
  ramp: { label: "램프", en: "Ramp", trait: "자원을 불리는 램프",
    legendHigher: "자원을 늘리는 초반 몇 턴이 느리게 느껴질 수 있음",
    userHigher: "자원 가속으로 큰 카드를 먼저 쓰는 플레이는 드묾" },
  swarm: { label: "물량전", en: "Swarm", trait: "유닛을 넓게 까는 물량전",
    legendHigher: "유닛 수로 승부해서 광역 제거에 약할 수 있음",
    userHigher: "보드를 유닛으로 가득 채우는 전설은 아님" },
  bigUnits: { label: "대형 유닛", en: "Big Units", trait: "강력한 유닛 중심",
    legendHigher: "소수 정예 유닛에 의존해 제거기에 흔들릴 수 있음",
    userHigher: "거대한 유닛 한 장으로 판을 뒤집는 맛은 적음" },
  interaction: { label: "상호작용", en: "Interaction", trait: "상대와 주고받는 대응 플레이",
    legendHigher: "상대 행동에 계속 반응해야 해서 내 계획만 밀고 싶다면 번거로움",
    userHigher: "상대 카드와 치열하게 주고받는 장면은 적은 편" },
  disruption: { label: "방해", en: "Disruption", trait: "상대 계획을 흔드는 방해",
    legendHigher: "상대를 흔드는 데 자원을 쓰느라 내 전개가 늦어질 수 있음",
    userHigher: "상대 계획을 직접 무너뜨리는 수단은 많지 않음" },
  cardDraw: { label: "카드 드로우", en: "Card Draw", trait: "손패를 채우는 드로우",
    legendHigher: "드로우로 이득을 쌓는 만큼 즉각적인 압박은 약할 수 있음",
    userHigher: "손패를 넉넉히 채우는 능력은 약한 편" },
  resourceManagement: { label: "자원 관리", en: "Resource", trait: "빈틈없는 자원 계산",
    legendHigher: "룬과 에너지를 세밀하게 계산해야 해서 피로할 수 있음",
    userHigher: "자원을 극한까지 짜내는 재미는 덜함" },
  movement: { label: "이동", en: "Movement", trait: "전장을 오가는 이동",
    legendHigher: "유닛 위치를 계속 신경 써야 해서 판단이 늘어남",
    userHigher: "유닛을 자유롭게 옮기는 플레이는 적음" },
  gear: { label: "장비", en: "Gear", trait: "장비(Gear) 활용",
    legendHigher: "장비 카드 비중이 높아 덱 구성이 장비 쪽으로 묶임",
    userHigher: "장비를 활용하는 전설은 아님" },
  hidden: { label: "Hidden", en: "Hidden", trait: "숨겨 둔 카드로 기습",
    legendHigher: "Hidden 카드를 꺼낼 타이밍 판단이 까다로움",
    userHigher: "Hidden 카드로 기습하는 플레이는 적음" },
  sacrifice: { label: "희생", en: "Sacrifice", trait: "쓰러짐을 이득으로 바꾸는 희생",
    legendHigher: "유닛을 소모하는 운영이라 아끼는 유닛을 잃는 느낌이 들 수 있음",
    userHigher: "Deathknell·희생 시너지는 거의 없음" },
  directDamage: { label: "직접 피해", en: "Damage", trait: "곧바로 꽂히는 직접 피해",
    legendHigher: "직접 피해 주문 비중이 높아 유닛전을 원하면 어색할 수 있음",
    userHigher: "직접 피해로 끝내는 전설은 아님" },
  combat: { label: "유닛 전투", en: "Combat", trait: "정면 유닛 전투",
    legendHigher: "전투 결과에 크게 좌우돼 전투를 피하고 싶다면 맞지 않음",
    userHigher: "유닛끼리 치고받는 전투는 주력 무기가 아님" },
  consistency: { label: "안정성", en: "Consistency", trait: "매 게임 고른 안정성",
    legendHigher: "안정적인 대신 극적인 역전의 짜릿함은 덜함",
    userHigher: "게임마다 결과 편차가 있는 편" },
  riskTaking: { label: "고점 추구", en: "High Roll", trait: "크게 터지는 고점",
    legendHigher: "편차가 커서 잘 안 풀리는 게임도 감수해야 함",
    userHigher: "크게 터지는 한 방은 적고 무난한 편" },
  complexity: { label: "운영 난도", en: "Complexity", trait: "선택지가 많은 깊은 운영",
    legendHigher: "운영 난도가 높아 익숙해지기까지 시간이 걸릴 수 있음",
    userHigher: "선택지가 적은 편이라 깊은 운영을 원하면 단조로울 수 있음" },
  setup: { label: "빌드업", en: "Setup", trait: "여러 턴 준비하는 빌드업",
    legendHigher: "준비 기간이 길어 초반 압박에 취약할 수 있음",
    userHigher: "여러 턴 준비해서 크게 터뜨리는 구조는 아님" },
};

export const ARCHETYPE_LABELS: Record<string, string> = {
  aggro: "어그로",
  tempo: "템포",
  midrange: "미드레인지",
  control: "컨트롤",
  combo: "콤보",
  ramp: "램프",
  tokens: "토큰",
  bigUnits: "빅 유닛",
  spells: "주문",
  gear: "장비",
  hidden: "Hidden",
  movement: "이동",
  buff: "버프",
  hold: "홀드",
  xp: "XP",
  empower: "Empower",
  tribal: "종족",
};

export const archetypeLabel = (key: string) => ARCHETYPE_LABELS[key] ?? key;

export const DIFFICULTY_LABELS = ["", "입문", "쉬움", "보통", "어려움", "숙련"] as const;
