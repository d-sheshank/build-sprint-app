import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { assertSafeStories, type Story } from '../src/storyRules';

test('paste a real job description and receive exactly three drafts with blank numbers', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Generate three stories' });
  await expect(button).toBeDisabled();
  await expect(page.getByLabel('Profile or notes (optional)', { exact: true })).toBeVisible();
  const profile = page.getByLabel('Profile or notes (optional)', { exact: true });
  await profile.fill('   ');
  const input = page.getByLabel('Job description', { exact: true });
  await input.fill('Too short');
  await button.click();
  await expect(page.getByRole('alert')).toContainText('Paste more');
  await input.fill(await readFile('tests/real-jd.txt', 'utf8'));
  await button.click();
  await expect(page.getByRole('status').filter({ hasText: 'Your three drafts are ready.' }).or(page.getByRole('alert'))).toBeVisible({ timeout: 75000 });
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('Your three drafts are ready.', { timeout: 75000 });
  await expect(page.getByRole('article')).toHaveCount(3);
  const stories = await page.getByRole('article').evaluateAll(articles => articles.map(article => {
    const fields = Object.fromEntries(Array.from(article.querySelectorAll('dl > div')).map(row => [row.querySelector('dt')!.textContent!.toLowerCase(), row.querySelector('dd')!.textContent!]));
    return { title: article.querySelector('h3')!.textContent!, requirement: article.querySelector('.requirement')!.textContent!.replace('For this role: ', ''), ...fields };
  })) as Story[];
  assertSafeStories(stories);
  // Capture actual page output without rewriting, for the milestone review.
  await writeFile('tests/generated-stories.json', JSON.stringify(stories, null, 2) + '\n');
  await writeFile('tests/generated-stories.txt', await page.locator('.stories').innerText());
  await page.screenshot({path:'/tmp/story-prep-generated.png',fullPage:true});
  await expect(page.getByRole('button', { name: 'Generate new stories' })).toBeEnabled();
  const notes = 'Led checkout redesign at Acme, conversion up 12%. Managed team of 6. Cut infra cost from 40k to 28k per month.';
  await page.getByLabel('Profile or notes (optional)', { exact: true }).fill(notes);
  await page.getByRole('button', { name: 'Update stories from my notes' }).click();
  await expect(page.getByRole('button', { name: 'Update stories from my notes' })).toBeEnabled({timeout:75000});
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('article')).toHaveCount(3);
  const updated = await page.getByRole('article').evaluateAll(articles => articles.map(article => {
    const fields = Object.fromEntries(Array.from(article.querySelectorAll('dl > div')).map(row => [row.querySelector('dt')!.textContent!.toLowerCase(), row.querySelector('dd')!.getAttribute('data-story-text')!]));
    return { title: article.querySelector('h3')!.getAttribute('data-story-text')!, requirement: article.querySelector('.requirement')!.getAttribute('data-story-text')!, ...fields, evidence: JSON.parse(article.getAttribute('data-evidence')!) };
  })) as Story[];
  const evidence = updated.flatMap(story => story.evidence ?? []);
  expect(evidence.length).toBeGreaterThan(0);
  expect(evidence.some(item => item.label === 'calculated' && item.value === '12k')).toBe(true);
  for (const story of updated) {
    for (const field of ['title','requirement','situation','task','action','result'] as const) {
      let text = story[field];
      for (const item of (story.evidence ?? []).filter(e=>e.field===field).reverse()) {
        expect(story[field].slice(item.start,item.end)).toBe(item.value);
        expect(item.quote).toBe(notes);
        expect(['from your notes','calculated']).toContain(item.label);
        text = text.slice(0,item.start) + 'xx' + text.slice(item.end);
      }
      assertSafeStories(Array(3).fill({title:'Draft',requirement:'Role',situation:'Context',task:'Task',action:'Action',result:'xx', [field]:text + (field === 'result' ? ' xx' : '')}));
    }
  }
  expect(JSON.stringify(updated)).toContain('xx');
  const sourceButtons = page.locator('.stories button.number-source');
  await expect(sourceButtons).toHaveCount(evidence.length);
  for (let i = 0; i < evidence.length; i++) {
    await sourceButtons.nth(i).click();
    const popup = page.getByRole('dialog', {name:'Number source'});
    await expect(popup).toBeVisible();
    await expect(popup.locator('blockquote')).toHaveText(notes);
    if (evidence[i].calculation) await expect(popup).toContainText(evidence[i].calculation!);
    await page.getByRole('button', {name:'Close source'}).click();
    await expect(popup).toHaveCount(0);
  }
  await writeFile('tests/generated-notes-stories.json', JSON.stringify(updated,null,2)+'\n');
  await writeFile('tests/generated-notes-stories.txt', updated.map(story => `${story.title}\n\nFor this role: ${story.requirement}\n\nSituation\n${story.situation}\nTask\n${story.task}\nAction\n${story.action}\nResult\n${story.result}`).join('\n\n'));
  await page.screenshot({path:'/tmp/story-prep-notes-desktop.png',fullPage:true});
  await sourceButtons.first().click();
  await page.screenshot({path:'/tmp/story-prep-source-desktop.png',fullPage:true});
  await page.keyboard.press('Escape');
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'/tmp/story-prep-notes-mobile.png',fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await sourceButtons.first().click();
  await expect(page.getByRole('dialog',{name:'Number source'})).toBeVisible();
  await page.screenshot({path:'/tmp/story-prep-source-mobile.png',fullPage:true});
  await page.keyboard.press('Escape');
  // A new visitor can provide their profile before generating any stories.
  await page.goto('/');
  await page.getByLabel('Profile or notes (optional)', {exact:true}).fill(notes);
  await expect(page.getByRole('button',{name:'Generate three stories'})).toBeDisabled();
  await page.getByLabel('Job description',{exact:true}).fill(await readFile('tests/real-jd.txt','utf8'));
  await page.getByRole('button',{name:'Generate three stories'}).click();
  await expect(page.getByRole('status').filter({hasText:'Your three drafts are ready.'}).or(page.getByRole('alert'))).toBeVisible({timeout:75000});
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('article')).toHaveCount(3);
  await expect(page.getByLabel('Profile or notes (optional)',{exact:true})).toHaveValue(notes);
  expect(await page.locator('.number-source').count()).toBeGreaterThan(0);
  await page.locator('.number-source').first().click();
  await expect(page.getByRole('dialog',{name:'Number source'}).locator('blockquote')).toHaveText(notes);
  await page.keyboard.press('Escape');
  await page.screenshot({path:'/tmp/story-prep-optional-profile-mobile.png',fullPage:true});
});
