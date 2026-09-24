import test from 'node:test';
import assert from 'node:assert/strict';
import { groupLabels, questionMinistries, previewWorks, questionsForMinistry } from '../lib/mp-story';
import { getProfile } from '../lib/repository';

test('ministry distribution preserves all records and does not infer or merge subjects', async()=>{
  const profile=await getProfile('mumbai-north-west'); assert.ok(profile);
  const groups=questionMinistries(profile.parliamentaryRecords.questions);
  assert.equal(groups.reduce((sum,g)=>sum+g.count,0),profile.parliamentaryRecords.questions.length);
  assert.equal(groups.find(g=>g.label==='RAILWAYS')?.count,22);
  assert.equal(questionsForMinistry(profile.parliamentaryRecords.questions,'RAILWAYS').length,22);
  for(const group of groups) assert.equal(questionsForMinistry(profile.parliamentaryRecords.questions,group.label).length,group.count);
  assert.equal(questionsForMinistry(profile.parliamentaryRecords.questions,'Invented topic').length,0);
  assert.deepEqual(groupLabels(['COMMUNICATION','COMMUNICATIONS','COMMUNICATIONS ',undefined]),[
    {label:'COMMUNICATIONS',count:2},{label:'COMMUNICATION',count:1},{label:'Not supplied',count:1},
  ]);
  assert.deepEqual(groupLabels([]),[]);
});

test('work preview is chronological, deterministic and preserves untouched source records',async()=>{
  const profile=await getProfile('mumbai-north-west'); assert.ok(profile);
  const original=JSON.stringify(profile.projects), preview=previewWorks(profile.projects);
  assert.equal(preview.length,4);
  assert.deepEqual(preview,previewWorks([...profile.projects].reverse()));
  assert.equal(JSON.stringify(profile.projects),original);
  for(const work of preview) assert.equal(work,profile.projects.find(p=>p.id===work.id));
  assert.deepEqual(previewWorks([]),[]);
  const groups=groupLabels(profile.projects.map(p=>p.category));
  assert.equal(groups.reduce((sum,g)=>sum+g.count,0),profile.projects.length);
});
