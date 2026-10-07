import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { assertSafeStories, type Story } from '../src/storyRules';

test('paste a real job description and receive exactly three drafts with blank numbers', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Generate three stories' });
  await expect(button).toBeDisabled();
  const input = page.getByLabel('Job description', { exact: true });
  await input.fill('Too short');
  await button.click();
  await expect(page.getByRole('alert')).toContainText('Paste more');
  await input.fill(await readFile('tests/real-jd.txt', 'utf8'));
  await button.click();
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
});
