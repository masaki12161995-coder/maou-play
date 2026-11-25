import {
  adventureEpisodeReady, adventurePairs, adventurePersonal, adventureRecruits, recruitmentReady
} from './adventure-companions.js';

function progressOf(table, key) {
  const record = table[key];
  if(record && Number.isInteger(record.step) && record.choices && typeof record.choices === 'object') return record;
  return { step:0, choices:{} };
}

function episodeKey(episode) {
  return episode.id ?? episode.members[0];
}

function anchorFor(site) {
  return site.startsWith('T') ? `${site}-D` : `${site}-mark-1`;
}

export function createCompanionUI({state,map,place,person,save,notify,conversation,closeStory,openMenu,closeMenu,
    button,el,row,panelFrame,join,lost}) {
  let campTab = 'personal';
  let campScroll = 0;
  const where = id => place?.(id)?.name ?? (map().id === id ? map().name : '旅の途中');
  const back = { label:'あとにする',action:closeStory };

  function pending(p) {
    const { flags, ending } = state().adventure;
    const need = p.need;
    if(state().lost[p.id]) return 'この人は旅の隊へ戻らない。';
    if(need.blocked && flags[need.blocked] || need.endingBlocked && ending === need.endingBlocked) return 'これまでの選択を知り、この旅への誘いを断った。';
    if(need.postEna) return '今は声をかけず、ここを離れる。';
    if(need.chapter && !flags[need.chapter]) return '町の様子が落ち着いたら、もう一度会いに来よう。';
    if(need.mark&&!state().adventure.seen[need.mark]&&!(need.alternativeWin&&state().adventure.cleared[need.alternativeWin])) return `${where(need.site)}で頼まれた場所を調べてから、また話そう。`;
    const nextVisit=need.visited?.find(id=>!state().discovered[id]);
    if(nextVisit) return `${where(nextVisit)}まで帰り道を確かめてから、もう一度会いに来よう。`;
    if(need.site) return `${where(need.site)}で足場を確かめてから、また話そう。`;
    return 'もう少し支度が整ってから話そう。';
  }

  function recruit(p) {
    if(!p?.need || p.need.kind !== 'adventure' || !state().adventure || state().members.includes(p.id)) return;
    const a = state().adventure;
    if(!recruitmentReady(p.id,state())){
      if(!state().lost[p.id] && p.need.mark){
        a.seen[`request-${p.id}`] = true;
        save();
      }
      conversation([[0,p.need.label],[0,pending(p)]],[],undefined,'field');
      return;
    }
    const { scenes } = p.need;
    function present(index) {
      if(index === scenes.length){
        conversation([[p.id,p.reply]],[
          {label:'旅へ誘う',primary:true,action:()=>{
            if(!recruitmentReady(p.id,state())) {closeStory();return;}
            closeStory();join(p);
          }}, back
        ],undefined,'field');
        return;
      }
      const scene = scenes[index];
      conversation([[p.id,scene.prompt]], [...scene.choices.map((label,choice) => ({label,action:()=>{
        if(choice===scene.succeeds){present(index+1);return;}
        conversation([[0,'いったん手を止める。もう一度、別のやり方で試せる。']],[],undefined,'field');
      }})),back],undefined,'field');
    }
    present(0);
  }

  function entries() {
    const record = state();
    if(!record.adventure) return [];
    return [...Object.values(adventurePersonal), ...adventurePairs].filter(episode => adventureEpisodeReady(episode,record))
      .map(episode => {
        const table = episode.id ? record.adventure.pairs : record.adventure.personal;
        const key = episodeKey(episode);
        const progress = progressOf(table,key);
        return { episode, table, key, progress, scene:episode.scenes[progress.step] };
      });
  }

  function finishEpisode(entry, option) {
    const current = progressOf(entry.table,entry.key);
    if(current.step !== entry.progress.step || !adventureEpisodeReady(entry.episode,state())) return;
    const next = { step:current.step+1, choices:{...current.choices} };
    if(option) next.choices[current.step] = option.key;
    entry.table[entry.key] = next;
    const replies = [...(option?.reply ?? [])];
    if(option?.departure){
      next.step=entry.episode.scenes.length;
      if(/銀|対価|謝礼|賞金|報酬|代金/.test(option.detail ?? '')) {
        const silver=35+8*state().adventure.chapter;
        state().coins += silver;
        replies.push([0,`${silver}銀を受け取った。`]);
      }
      closeStory();
      lost(entry.episode.members[0],option.departure);
      save();
      conversation(replies);
      return;
    }
    const scene = entry.episode.scenes[next.step];
    if(!scene) {
      state().history.unshift('「'+entry.episode.title+'」を見届けた。');
      notify('仲間の記録を更新した','success');
    }
    save();
    const advance = scene && (scene.site===map().id)
      ? () => play({...entry,progress:next,scene},false)
      : undefined;
    if(scene && scene.site!==map().id) replies.push([0,`続きは ${where(scene.site)}。仲間と現地へ向かおう。`]);
    conversation(replies,[],advance);
  }

  function play(entry, closePanel) {
    if(!entry.scene || entry.scene.site!==map().id || !adventureEpisodeReady(entry.episode,state())) return;
    if(closePanel) closeMenu();
    const choiceBefore = entry.progress.choices[entry.progress.step-1];
    const lines = [...entry.scene.lines,...(entry.scene.followup?.[choiceBefore]??[])];
    const choices=(entry.scene.choices??[]).map(option=>({
      label:option.label, detail:option.detail, action:()=>{
        if(!option.departure){finishEpisode(entry,option);return;}
        conversation([[0,option.detail]], [
          {label:'この選択で進む',detail:'別れは取り消せない',action:()=>finishEpisode(entry,option)},
          {label:'選び直す',action:()=>play(entry,false)}
        ]);
      }
    }));
    conversation(lines,choices,choices.length?undefined:()=>finishEpisode(entry));
  }

  function inspect(target) {
    const a = state().adventure;
    if(!a || target.kind!=='adventure-inspect') return false;
    const local = entries().filter(entry=>entry.scene?.site===map().id && anchorFor(entry.scene.site)===target.id);
    const work = adventureRecruits.filter(p=>p.need.mark===target.id && !state().members.includes(p.id) && !state().lost[p.id]);
    if(!local.length && !work.length) return false;
    if(work.length){
      a.seen[target.id]=true;
      save();
    }
    const options = local.slice(0,2).map(entry=>({label:entry.episode.title,action:()=>play(entry,false)}));
    if(local.length>2) options.push({label:'ほかの話を見る',action:()=>openMenu('adventure-camp')});
    options.push(back);
    const lines = [[0,target.text??target.label]];
    if(work.some(p=>a.seen[`request-${p.id}`])) lines.push([0,'頼まれた場所を確かめた。町へ戻って話そう。']);
    conversation(lines,local.length?options:[]);
    return true;
  }

  function targets(scene) {
    const anchors = new Set(entries().filter(entry=>entry.scene?.site===scene.id).map(entry=>anchorFor(entry.scene.site)));
    const a=state().adventure;
    for(const p of adventureRecruits) {
      if(p.need.site===scene.id && a?.seen[`request-${p.id}`] && !a.seen[p.need.mark]) anchors.add(p.need.mark);
    }
    return (scene.objects??[]).filter(target=>anchors.has(target.id));
  }

  function camp() {
    const panel=panelFrame('仲間との話',()=>openMenu('party'));
    const switches=el('div','panel-actions');
    for(const [tab,title] of [['personal','一人ずつの話'],['pair','二人の話']]){
      const tabButton=button(title,()=>{campTab=tab;campScroll=0;camp();},'game-button');
      tabButton.setAttribute('aria-pressed',String(campTab===tab));
      switches.append(tabButton);
    }
    panel.append(switches);
    const listing=el('div','menu-list');
    listing.style.maxHeight='min(58svh, 440px)';
    listing.style.overflowY='auto';
    listing.style.overscrollBehavior='contain';
    const rows=entries().filter(entry=>campTab==='pair'?!!entry.episode.id:!entry.episode.id);
    const unfinished=rows.filter(entry=>entry.scene);
    const completed=rows.filter(entry=>!entry.scene);
    for(const entry of [...unfinished,...completed]) {
      const {episode,scene,progress}=entry;
      const names=episode.members.map(id=>person(id).name).join('・');
      const selected=episode.scenes.findIndex(part=>part.choices);
      const chosen=episode.scenes[selected]?.choices?.find(option=>option.key===progress.choices[selected]);
      const location=scene?where(scene.site):chosen?.label??'記録済み';
      const display=scene ? (progress.step?'続きへ':'話す') : '見届けた';
      listing.append(row('◇',episode.title,`${names}　${location}`,display,scene?()=>{
        campScroll=listing.scrollTop;
        if(scene.site===map().id) {play(entry,true);return;}
        notify(`続きは ${where(scene.site)}`);
      }:null));
    }
    if(!rows.length) listing.append(el('p','empty','一緒に旅をすると、その人と話せることが増えていく。'));
    panel.append(listing);
    listing.scrollTop=campScroll;
  }

  return {recruit,camp,inspect,targets};
}
