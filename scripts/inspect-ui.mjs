import { chromium } from '@playwright/test';
const browser = await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
for (const viewport of [{width:1280,height:950},{width:390,height:844}]) {
 const page = await browser.newPage({viewport});
 await page.goto('http://localhost:5173');
 await page.getByRole('heading',{name:'Your experience. A clearer story.'}).waitFor();
 await page.screenshot({path:`/tmp/story-prep-${viewport.width}.png`,fullPage:true});
 console.log({width:viewport.width,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),emptySubmitDisabled:await page.getByRole('button',{name:'Generate three stories'}).isDisabled()});
 await page.getByLabel('Job description',{exact:true}).fill('Too short');
 await page.getByRole('button',{name:'Generate three stories'}).click();
 console.log({validation:await page.getByRole('alert').innerText()});
 await page.close();
}
await browser.close();
