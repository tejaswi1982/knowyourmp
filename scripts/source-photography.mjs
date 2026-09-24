// One-time, explicit acquisition of rights-reviewed photographs. No image search
// scraping and no runtime remote image requests. Original bytes remain intact.
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const images=[
  {id:'andheri-flyover',page:'https://commons.wikimedia.org/wiki/File:Andheri-Flyover.jpg',creator:'Rsrikanth05',date:'2010-01-15',license:'CC BY-SA 3.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/'},
  {id:'andheri-west',page:'https://commons.wikimedia.org/wiki/File:Andheri_(West)_metro_station.jpg',creator:'Rupturestriker',date:'2023-06-23',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/'},
  {id:'lok-sabha',page:'https://commons.wikimedia.org/wiki/File:View_of_Lok_Sabha_chamber_in_the_New_Parliament_building,_New_Delhi.jpg',creator:'Ministry of Parliamentary Affairs, Government of India',date:'2023-05-27',license:'GODL-India',licenseUrl:'https://data.gov.in/sites/default/files/Gazette_Notification_OGDL.pdf'},
  {id:'andheri-sports',page:'https://commons.wikimedia.org/wiki/File:Andheri_sports_complex_stadium.jpg',creator:'Trinidade',date:'2012-03-09',license:'CC BY-SA 3.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/'},
];
await mkdir('public/story',{recursive:true});
await mkdir('data/photography',{recursive:true});
for(const item of images){
  if(process.argv[2] && process.argv[2]!==item.id)continue;
  const response=await fetch(item.page,{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error(`${response.status}: ${item.page}`);
  const html=await response.text();
  await writeFile(`data/photography/${item.id}.source.html`,html);
  const section=html.match(/<div class="fullImageLink"[\s\S]*?<a href="([^"]+)"/);
  if(!section)throw new Error('Original-image link missing; inspect the source page');
  const url=section[1].replaceAll('&amp;','&');
  if(new URL(url).hostname!=='upload.wikimedia.org')throw new Error('Unexpected media host');
  const image=await fetch(url,{signal:AbortSignal.timeout(30000)});
  if(!image.ok||!image.headers.get('content-type')?.includes('image/jpeg'))throw new Error('Unexpected image response');
  const bytes=Buffer.from(await image.arrayBuffer());
  const file=`public/story/${item.id}.jpg`;
  await writeFile(file,bytes);
  const manifest={...item,url,file,retrievedAt:new Date().toISOString(),sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,changes:item.id==='andheri-flyover'?'Original JPEG unchanged. Homepage presentation uses CSS grayscale, a graduated dark overlay and responsive cropping. Photographic adaptations use CC BY-SA 3.0; credit and license are accessible on the homepage.':'Original JPEG unchanged. Presentation uses CSS grayscale and responsive cropping; credit and license remain with each image.'};
  await writeFile(`data/photography/${item.id}.json`,JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify(manifest));
}
