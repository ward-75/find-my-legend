import { it, expect } from 'vitest';
import baseline from './i18n-baseline.json';
import { createHash } from 'node:crypto';
import { BASE_LEGENDS, QUESTIONS } from '../lib/data';
import { computeProfile } from '../lib/scoring';
import { rankLegends } from '../lib/recommendation';
import { ARCHETYPE_ANSWERS } from './helpers';
// Baseline from deployed 3b200e4, after confirming all data and calculation files are byte-identical.
it('preserves all scores and ordering for 7 answer profiles at all 3 experience levels',()=>{
 const out: Record<string,string>={};
 for(const [key,answers] of Object.entries(ARCHETYPE_ANSWERS))for(const experience of ['new','some','experienced'] as const){
  const profile=computeProfile(QUESTIONS,answers);
  const ranks=rankLegends(profile,BASE_LEGENDS,{experience}).map(m=>({id:m.legend.id,score:m.score,rank:m.rank,breakdown:m.breakdown}));
  out[`${key}/${experience}`]=createHash('sha256').update(JSON.stringify({profile,ranks})).digest('hex');
 }
 expect(out).toEqual(baseline);
});
