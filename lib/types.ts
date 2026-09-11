// ─────────────────────────────────────────────────────────────
// 도메인 모델. UI는 이 타입만 알고, JSON 파일 구조는 lib/data.ts가 흡수한다.
// ─────────────────────────────────────────────────────────────

export const DOMAIN_KEYS = ["body", "fury", "calm", "mind", "chaos", "order"] as const;
export type DomainKey = (typeof DOMAIN_KEYS)[number];

export const STYLE_KEYS = [
  "aggression", "control", "tempo", "combo", "midrange", "ramp", "swarm", "bigUnits",
  "interaction", "disruption", "cardDraw", "resourceManagement", "movement", "gear",
  "hidden", "sacrifice", "directDamage", "combat", "consistency", "riskTaking",
  "complexity", "setup",
] as const;
export type StyleKey = (typeof STYLE_KEYS)[number];

export type DomainVector = Record<DomainKey, number>;
export type StyleVector = Record<StyleKey, number>;

/** "domain.calm" | "style.control" */
export type WeightKey = `domain.${DomainKey}` | `style.${StyleKey}`;
export type Weights = Partial<Record<WeightKey, number>>;

// ── Sets ─────────────────────────────────────────────────────
export interface CardSet {
  id: string;
  name: string;
  koreanName: string;
  code: string;
  /** cutoff 기준 순서. 보조 세트는 부모 세트와 같은 order를 가진다. */
  order: number;
  releaseDate: string | null;
  released: boolean;
  isSupplemental: boolean;
  parentSetId?: string;
}

// ── Legends ──────────────────────────────────────────────────
/** 실제 카드 정보. 검증된 출처에서 온 값만 넣는다. */
export interface LegendOfficialData {
  champion: string;
  title: string;
  setId: string;
  setCode: string;
  collectorNumber: string;
  riftboundId?: string;
  domains: DomainKey[];
  abilityText: string | null;
  imageUrl: string | null;
  artist?: string | null;
  sourceUrls: string[];
  verifiedAt?: string;
  dataNote?: string;
}

/** 서비스 자체 평가값. 카드 사실이 아니다. */
export interface LegendRecommendationData {
  /** false면 전설 목록에는 보이되 성향 테스트 추천 후보에서는 제외 */
  recommendationReady?: boolean;
  difficulty: number; // 1~5
  archetypes: string[];
  scores: StyleVector;
  domainScores: DomainVector;
  playstyleSummary: string;
  strengths: string[];
  weaknesses: string[];
  recommendedFor: StyleKey[];
  notRecommendedFor: StyleKey[];
  needsReview: boolean;
  reviewNote?: string;
}

export interface LegendRecord {
  id: string;
  officialData: LegendOfficialData;
  localization?: { championKo?: string | null; titleKo?: string | null };
  recommendationData: LegendRecommendationData;
}

// ── Questions ────────────────────────────────────────────────
export interface ChoiceOption {
  id: string;
  label: string;
  /** 완전 입문자에게 보여 줄 쉬운 표현. 없으면 label 사용 */
  beginnerLabel?: string;
  weights: Weights;
}
export interface ChoiceQuestion {
  id: string;
  type: "choice";
  prompt: string;
  beginnerPrompt?: string;
  options: ChoiceOption[];
}
export interface ScaleQuestion {
  id: string;
  type: "scale";
  prompt: string;
  beginnerPrompt?: string;
  leftLabel: string;
  rightLabel: string;
  beginnerLeftLabel?: string;
  beginnerRightLabel?: string;
  left: Weights;
  right: Weights;
}
export type Question = ChoiceQuestion | ScaleQuestion;

/** choice → 옵션 index(0부터), scale → 1~5 */
export type Answer = number;
export type Answers = (Answer | null)[];

// ── Profile / Result ─────────────────────────────────────────
export interface UserProfile {
  domains: DomainVector;
  styles: StyleVector;
}

export interface Persona {
  id: string;
  name: string;
  domain: DomainKey;
  description: string;
  signature: Weights;
}

export type ExperienceLevel = "new" | "some" | "experienced";

export type CutoffMode = "cumulative" | "only";

export interface PoolOptions {
  /** 세트 id 또는 "latest" */
  cutoff: string;
  mode: CutoffMode;
  includeSupplemental: boolean;
}

export interface MatchBreakdown {
  style: number;
  domain: number;
  difficulty: number;
  proactive: number;
  risk: number;
}

export interface LegendMatch {
  legend: LegendRecord;
  /** 0~1 가중합 */
  raw: number;
  /** 난이도 보정 전 취향 적합도 */
  baseRaw: number;
  /** 경험 수준에 따른 난이도 소프트 패널티 */
  experiencePenalty: number;
  /** 화면 표시용 1~99 추천 점수. 확률(%)이 아니다. */
  score: number;
  rank: number;
  breakdown: MatchBreakdown;
}
