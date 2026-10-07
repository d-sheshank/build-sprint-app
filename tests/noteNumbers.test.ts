import { test } from 'node:test';
import assert from 'node:assert/strict';
import { numbersFromNotes, resolveNoteStories } from '../src/noteNumbers.ts';
import type { Story } from '../src/storyRules.ts';
const notes = 'Led checkout redesign at Acme, conversion up 12%. Managed team of 6. Cut infra cost from 40k to 28k per month.';
const story: Story = {title:'Checkout redesign',requirement:'Build useful features',situation:'At Acme, [problem].',task:'I led the redesign.',action:'I managed a team of [[n1]].',result:'Conversion increased [[n0]]. [Time taken: xx].'};
test('quotes the exact input line and attaches evidence to every numerical occurrence', () => {
  const catalog = numbersFromNotes(notes);
  assert.deepEqual(catalog.map(n => n.value), ['12%', '6', '40k', '28k']);
  const stories = resolveNoteStories([story,story,story], notes);
  assert.equal(stories[0].result, 'Conversion increased 12%. [Time taken: xx].');
  assert.equal(stories[0].evidence?.[0].quote, notes);
  assert.equal(stories[0].evidence?.[0].label, 'from your notes');
});
test('calculates sums and differences from referenced notes without trusting model arithmetic', () => {
  for (const [token, expected, equation] of [['[[sum:n2,n3]]','68k','40k + 28k = 68k'],['[[difference:n2,n3]]','12k','40k - 28k = 12k']]) {
    const resolved = resolveNoteStories([{...story,result:`Saved ${token} per month. [Time taken: xx].`},story,story],notes)[0];
    assert.equal(resolved.result, `Saved ${expected} per month. [Time taken: xx].`);
    const evidence = resolved.evidence!.find(e => e.field === 'result')!;
    assert.equal(evidence.label,'calculated');
    assert.equal(evidence.calculation,equation + ', both from your notes');
    assert.equal(evidence.quote,notes);
  }
});
test('rejects invented figures, JD figures, written numbers, fake sources, and mixed units', () => {
  for (const result of ['Improved by 25%.','Reached 40000 companies.','Managed three teams.','Saved [[n99]].','Saved [[sum:n0,n2]].','Saved [[difference:n3,n2]].','Saved [[sum:n2,100]].','Saved [[bogus]].']) {
    assert.throws(() => resolveNoteStories([{...story,result:result+' [Time taken: xx].'},story,story], notes),undefined,result);
  }
});
test('rejects drafts that drop explicit missing-number blanks', () => {
  assert.throws(() => resolveNoteStories(Array(3).fill({...story,result:'Conversion increased [[n0]]. [Time period].'}), notes));
});
test('preserves source lines, repeated values, and leaves unsupported amounts blank', () => {
  const multiline = 'Managed 6 engineers.\r\nSaved 6 hours.';
  const resolved = resolveNoteStories([{...story,action:'I managed [[n0]] engineers and saved [[n1]] hours.',result:'[Other result: xx].'},story,story].map(s => ({...s,result:'[Other result: xx].'})),multiline);
  assert.deepEqual(resolved[0].evidence?.map(e=>e.quote),['Managed 6 engineers.','Saved 6 hours.']);
  assert.match(resolved[0].result,/xx/);
});
test('adds decimal amounts exactly and keeps repeated amounts tied to distinct lines', () => {
  const decimalNotes = 'Saved $0.10 on hosting.\nSaved $0.20 on storage.';
  const draft = {...story,action:'I [describe actions].',result:'Saved [[sum:n0,n1]]. [Time taken: xx].'};
  const resolved = resolveNoteStories([draft,draft,draft],decimalNotes)[0];
  assert.equal(resolved.result,'Saved $0.3. [Time taken: xx].');
  assert.equal(resolved.evidence![0].calculation,'$0.10 + $0.20 = $0.3, both from your notes');
  assert.equal(resolved.evidence![0].quote,decimalNotes);
});
