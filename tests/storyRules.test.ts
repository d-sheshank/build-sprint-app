import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertSafeStories, type Story } from '../src/storyRules.ts';
const story: Story = { title: 'Improving a workflow', requirement: 'Deliver useful software', situation: 'At [company], [workflow] needed improvement.', task: 'I needed to address [user problem].', action: 'I [describe the actions you actually took].', result: '[Metric] changed from xx to xx over xx weeks.' };
test('accepts exactly three complete drafts with xx blanks', () => {
  assert.equal(assertSafeStories([story, story, story]).length, 3);
});
test('rejects digits, written numbers, ordinals, fractions and multipliers anywhere in a story', () => {
  for (const value of ['25%', '2026', '$500k', '3.5', 'three teams', 'twenty-five', 'a hundred', 'first', 'half', 'doubled', 'twice', '⅓', '５０', '٣']) {
    for (const key of Object.keys(story)) {
      assert.throws(() => assertSafeStories([{ ...story, [key]: value }, story, story]), undefined, `${key}: ${value}`);
    }
  }
});
test('rejects the wrong count, missing sections, and results without blanks', () => {
  assert.throws(() => assertSafeStories([story]));
  assert.throws(() => assertSafeStories([{...story, action:''}, story, story]));
  assert.throws(() => assertSafeStories([{...story, result:'Revenue grew significantly.'}, story, story]));
});
