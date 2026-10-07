import { writeFile } from 'node:fs/promises';
const res = await fetch('https://api.ashbyhq.com/posting-api/job-board/linear');
if (!res.ok) throw new Error(`Job board returned ${res.status}`);
const {jobs} = await res.json();
const job = jobs.find(j=>j.title === 'Product Engineer');
if (!job) throw new Error('Product Engineer posting not found');
await writeFile('tests/real-jd.txt', `${job.title}\n\n${job.descriptionPlain}`);
await writeFile('tests/real-jd-source.json',JSON.stringify({title:job.title,url:job.jobUrl,retrieved:new Date().toISOString()},null,2));
console.log({title:job.title,url:job.jobUrl,characters:job.descriptionPlain.length});
