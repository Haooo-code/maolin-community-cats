export const cats = [
 {id:'xiaohua',name:'小花',color:'狸白',photo:'./assets/tabby.png',description:'白围脖、白手套，额头有清楚的狸花纹。邻居们暂时叫它小花。',character:'喜欢安静地坐着',area:'社区花园一带',sex:'暂未确认',age:'暂未确认',neutered:'尚无核实记录'},
 {id:'xiaohei',name:'小黑',color:'黑白',photo:'./assets/tuxedo.png',description:'黑色背毛、白胸口和白爪子，鼻梁上有一小块白色。',character:'安静观察来往的人',area:'社区绿地一带',sex:'暂未确认',age:'暂未确认',neutered:'尚无核实记录'}
];
export function initialState(){
 const now=Date.now();
 return {version:1,nickname:'一位社区邻居',follows:[],rescueClaims:[],records:[
  {id:'seed-r1',catId:'xiaohua',type:'feeding',detail:'提供了一小份干粮，离开时清理了食具。',amount:'少量干粮',time:now-2*3600000,actor:'示例照护者',mine:false},
  {id:'seed-r2',catId:'xiaohua',type:'feeding',detail:'清洗容器并更换清水。',amount:'补水',time:now-20*3600000,actor:'示例邻居',mine:false},
  {id:'seed-r3',catId:'xiaohei',type:'feeding',detail:'留下了一次日常照护记录，现场已清理。',amount:'少量干粮',time:now-5*3600000,actor:'示例邻居',mine:false}
 ],posts:[
  {id:'seed-p1',author:'示例邻居',avatar:'#d8dfbb',text:'小花又在熟悉的地方晒太阳。路过的时候，拍下了今天的小小相遇。',image:'./assets/tabby.png',catId:'xiaohua',type:'daily',time:now-40*60000,likes:12,liked:false,mine:false,comments:[{id:'seed-c1',author:'示例照护者',text:'谢谢分享近况，看到它很开心。',time:now-20*60000}]},
  {id:'seed-p2',author:'示例照护者',avatar:'#efd8bd',text:'给小黑补了清水，也把周围收拾干净了。照护猫咪，也照顾大家共同的环境。',image:'./assets/tuxedo.png',catId:'xiaohei',type:'feeding',time:now-4*3600000,likes:8,liked:false,mine:false,comments:[]},
  {id:'seed-p3',author:'示例邻居',avatar:'#d6dfdf',text:'今天遇见了小黑，安安静静地看了一会儿。分享一次遇见，给同样牵挂它的邻居。',image:'./assets/tuxedo.png',catId:'xiaohei',type:'daily',time:now-26*3600000,likes:6,liked:false,mine:false,comments:[]}
 ]};
}
export const storageKey='maolin-community-v1';
export function loadState(){
 try{const saved=JSON.parse(localStorage.getItem(storageKey));if(saved&&saved.version===1&&Array.isArray(saved.posts)&&Array.isArray(saved.records)&&Array.isArray(saved.follows)&&typeof saved.nickname==='string'){if(!Array.isArray(saved.rescueClaims))saved.rescueClaims=[];return saved;}}catch{}
 return initialState();
}
export function escape(value=''){return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
export function time(stamp){const ms=Date.now()-Number(stamp);if(!Number.isFinite(ms))return '时间待补充';if(ms<60000)return '刚刚';if(ms<3600000)return `${Math.floor(ms/60000)}分钟前`;if(ms<86400000)return `${Math.floor(ms/3600000)}小时前`;if(ms<7*86400000)return `${Math.floor(ms/86400000)}天前`;return new Date(stamp).toLocaleDateString('zh-CN');}
export function exactTime(stamp){return new Date(stamp).toLocaleString('zh-CN',{month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'});}
export const uid=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function safeImage(src){return typeof src==='string'&&(src.startsWith('./assets/')||/^data:image\/(jpeg|png|webp);base64,/.test(src));}
export async function readPhoto(file){
 if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('请选择 JPG、PNG 或 WebP 图片。');
 if(file.size>10*1024*1024)throw new Error('图片过大，请选择小于 10MB 的照片。');
 const bitmap=await createImageBitmap(file);
 const scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height));
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
 canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();return canvas.toDataURL('image/jpeg',.8);
}
