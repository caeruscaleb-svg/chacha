(function(){
  // Auto-find/create form, input, response area
  function findLetItOutElements() {
    // Try to find an obvious form/button by text
    const forms = Array.from(document.querySelectorAll('form'));
    for (const f of forms) {
      const text = (f.innerText || '').toLowerCase();
      if (text.includes('let it out') || text.includes('let it out.') || text.includes('let it out!')) {
        const input = f.querySelector('textarea, input[type="text"], input[type="search"], [contenteditable="true"]');
        return { form: f, input: input, responseEl: findOrCreateResponseEl(f) };
      }
      // also inspect forms with a submit button labeled similarly
      const btn = f.querySelector('button, input[type="submit"]');
      if (btn && (btn.innerText || btn.value || '').toLowerCase().includes('let it out')) {
        const input = f.querySelector('textarea, input[type="text"], input[type="search"], [contenteditable="true"]');
        return { form: f, input: input, responseEl: findOrCreateResponseEl(f) };
      }
    }

    // If not found, try generic single textarea on page
    const singleTextarea = document.querySelectorAll('textarea');
    if (singleTextarea.length === 1) {
      const f = singleTextarea[0].closest('form') || document.createElement('div');
      return { form: f, input: singleTextarea[0], responseEl: findOrCreateResponseEl(singleTextarea[0]) };
    }

    // Fallback: create a floating "let it out" widget at bottom-right
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.right = '20px';
    wrapper.style.bottom = '20px';
    wrapper.style.zIndex = 12000;
    wrapper.style.width = '320px';
    wrapper.style.maxWidth = 'calc(100% - 40px)';
    wrapper.style.background = 'rgba(255,255,255,0.98)';
    wrapper.style.borderRadius = '12px';
    wrapper.style.boxShadow = '0 10px 40px rgba(0,0,0,0.15)';
    wrapper.style.padding = '12px';
    wrapper.style.fontFamily = 'inherit';
    wrapper.innerHTML = '<div style="font-weight:600;color:#9e2f50;margin-bottom:6px">Let it out</div>';
    const ta = document.createElement('textarea');
    ta.placeholder = 'Say what you feel...';
    ta.style.width = '100%';
    ta.style.height = '80px';
    ta.style.padding = '8px';
    ta.style.borderRadius = '8px';
    ta.style.border = '1px solid rgba(0,0,0,0.08)';
    wrapper.appendChild(ta);
    const btn = document.createElement('button');
    btn.innerText = 'Send';
    btn.style.marginTop = '8px';
    btn.style.background = 'linear-gradient(135deg,#d94f70 0%,#9e2f50 100%)';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.padding = '8px 12px';
    btn.style.borderRadius = '8px';
    btn.style.cursor = 'pointer';
    wrapper.appendChild(btn);
    document.body.appendChild(wrapper);
    const resp = document.createElement('div');
    resp.style.marginTop = '10px';
    resp.style.fontSize = '14px';
    resp.style.color = '#333';
    wrapper.appendChild(resp);
    // wrap pseudo-form
    btn.addEventListener('click', e => {
      e.preventDefault();
      handleSubmit(ta.value, resp);
    });
    return { form: wrapper, input: ta, responseEl: resp };
  }

  function findOrCreateResponseEl(referenceNode) {
    // find an element with class/id that looks like a response area near the reference node
    let wrapper = referenceNode.closest ? referenceNode.closest('section, .container, form, div') : document.body;
    if (!wrapper) wrapper = document.body;
    let resp = wrapper.querySelector('.letitout-response, #letItOutResponse, .response-area');
    if (!resp) {
      resp = document.createElement('div');
      resp.className = 'letitout-response';
      resp.style.marginTop = '12px';
      resp.style.fontSize = '15px';
      resp.style.color = '#333';
      wrapper.appendChild(resp);
    }
    return resp;
  }

  // Themes with multiple template replies for variety
  const THEMES = [
    {
      name: 'exhaustion_hiding',
      keywords: ['tired','family','hiding','hide','hiding feelings','exhaust'],
      templates: [
        "It sounds like you're really worn out from keeping everything inside. Hiding feelings around family takes a lot — you're allowed to feel exhausted.",
        "That kind of quiet struggle is heavy. Carrying things alone with family can be draining — it's okay to want rest and to care for yourself.",
        "I hear you — having to hide how you feel can be so tiring. You don't have to push past your own needs to keep others comfortable."
      ]
    },
    {
      name: 'school_failed_effort',
      keywords: ['school','failed','studied','study','exam','grade','test'],
      templates: [
        "It hurts when hard work doesn't give the result you expected. The effort still shows your commitment — that matters even if the outcome didn't go your way.",
        "I'm sorry — putting in the work and still failing is really frustrating. That doesn't erase what you did; it's okay to be upset about it.",
        "You studied hard, and that effort counts. Failing doesn't define your ability — it's an outcome that stings right now."
      ]
    },
    {
      name: 'friend_ignored',
      keywords: ['friend','ignored','left','silent','ghosted','no reply','don't know why'],
      templates: [
        "Not hearing from a friend and not knowing why is confusing and painful. It's natural to wonder if you did something wrong — but sometimes their silence is about them, not you.",
        "Being ignored by someone you care about can leave you feeling small and uncertain. Your feelings are valid — wanting clarity makes sense.",
        "That uncertainty is hard. If you want, telling me what happened might help sort through what you need next."
      ]
    },
    {
      name: 'relationship_miss_distance',
      keywords: ['relationship','miss','distance','long distance','miss you','miss him','miss her'],
      templates: [
        "Missing someone far away can feel empty and constant. That longing shows how important they are to you — be gentle with yourself while you cope.",
        "Long-distance missing is tough — the small daily things you miss build up. It's okay to miss them and to struggle with the distance.",
        "That ache of missing someone is real. Holding onto little rituals or messages sometimes helps even a bit."
      ]
    },
    {
      name: 'money_family_pressure',
      keywords: ['money','financial','family','pressure','bills','pay','support','responsible'],
      templates: [
        "Carrying financial or family pressure is heavy, and it can feel like there's no room to breathe. You're not alone for feeling burdened by it.",
        "Money worries tied to family expectations are a lot to carry. It's okay to ask for time, help, or a small plan to make things feel less overwhelming.",
        "Feeling pushed by family finances is really stressful. You don't have to solve everything at once — small steps can help ease the weight."
      ]
    },
    {
      name: 'overthinking_regret',
      keywords: ['overthinking','past','mistake','regret','replay','should have'],
      templates: [
        "Replay and regret are exhausting — it's like your mind won't let go. You tried then; maybe there's something to learn, but you deserve patience too.",
        "Overthinking a past mistake can feel consuming. You're allowed to be kind to yourself while you figure out what comes next.",
        "That loop of 'what if' is painful. Taking a breath and naming one small thing you've learned can sometimes ease the replay a little."
      ]
    },
    {
      name: 'lonely_among_people',
      keywords: ['lonely','alone','surrounded','unseen','invisible','not seen','crowd'],
      templates: [
        "Feeling lonely while around people is a special kind of hurt. It's okay to want to be seen; your feelings matter even if others don't notice.",
        "You can be surrounded and still feel invisible — that ache is valid. It's alright to reach for someone who will really listen.",
        "Being around others doesn't always mean being understood. Wanting connection doesn't make you needy — it makes you human."
      ]
    }
  ];

  // small helpers
  function pickRandom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function normalizeText(s){ return (s||'').toLowerCase(); }
  function extractShortEcho(text) {
    if (!text) return '';
    const trimmed = text.trim();
    if (trimmed.length <= 80) return trimmed;
    const firstSentence = trimmed.split(/[.!?]\s/)[0];
    return firstSentence.length <= 80 ? firstSentence : trimmed.slice(0,77) + '...';
  }

  function scoreThemeForText(theme, text) {
    const t = normalizeText(text);
    let score = 0;
    for (const kw of theme.keywords) {
      const re = new RegExp('\\b' + kw.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&') + '\\b','i');
      if (re.test(t)) score += 2;
      else if (t.includes(kw)) score += 1;
    }
    return score;
  }

  function detectThemes(text) {
    const scores = THEMES.map(theme => ({ theme: theme, score: scoreThemeForText(theme, text) }));
    scores.sort((a,b)=>b.score-a.score);
    const best = scores[0];
    const matches = scores.filter(s => s.score >= Math.max(2, best.score));
    return matches.filter(m => m.score > 0).map(m => m.theme);
  }

  function generateHumanReply(originalText) {
    const echo = extractShortEcho(originalText);
    const themes = detectThemes(originalText);
    if (themes.length === 0) {
      const fallbacks = [
        "I hear you — that sounds difficult. Could you tell me which part felt the heaviest?",
        "That sounds tough. Would you like to say more about what’s been hardest lately?",
        "Thank you for sharing that. Want to tell me a little more about how you've been feeling?"
      ];
      return pickRandom(fallbacks);
    }

    if (themes.length >= 2) {
      const lines = themes.slice(0,2).map(th => pickRandom(th.templates));
      const combined = lines.join(' ');
      const followups = [
        "Do you want to talk more about one of these parts?",
        "Which of these feels most urgent for you right now?",
        "Would you like to say a bit more about how that part is affecting you?"
      ];
      return (echo ? '"' + echo + '" — ' : '') + combined + ' ' + pickRandom(followups);
    }

    const theme = themes[0];
    const tmpl = pickRandom(theme.templates);
    const followUps = [
      "Do you want to tell me more about that?",
      "Would you like to say what you'd want to change about this, even a small thing?",
      "That makes sense — do you want to go into a little more detail?",
      "If you'd like, share what's been the hardest today."
    ];
    const withEcho = echo ? ('"' + echo + '" — ') : '';
    const toneExtras = [
      '',
      ' I’m here with you.',
      ' You’re not alone in this.',
      ' I’m listening.'
    ];

    return withEcho + tmpl + ' ' + pickRandom(toneExtras).trim() + ' ' + pickRandom(followUps);
  }

  function handleSubmit(text, responseEl) {
    if (!responseEl) {
      console.warn('No response element to show reply.');
      return;
    }
    const reply = generateHumanReply(text || '');
    responseEl.style.opacity = 0;
    responseEl.style.transition = 'opacity .28s ease';
    responseEl.innerText = reply;
    requestAnimationFrame(()=> responseEl.style.opacity = 1 );
  }

  const els = findLetItOutElements();
  if (els.form && els.input && els.responseEl) {
    const form = els.form;
    const input = els.input;
    const responseEl = els.responseEl;

    if (form.tagName && form.tagName.toLowerCase() === 'form') {
      form.addEventListener('submit', function(e){
        e.preventDefault();
        const val = (input.value !== undefined) ? input.value : (input.innerText || '');
        handleSubmit(val, responseEl);
      });
    } else {
      const sendBtn = form.querySelector('button, input[type="submit"]');
      if (sendBtn) {
        sendBtn.addEventListener('click', function(e){
          e.preventDefault();
          const val = (input.value !== undefined) ? input.value : (input.innerText || '');
          handleSubmit(val, responseEl);
        });
      } else {
        input.addEventListener('keydown', function(e){
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const val = (input.value !== undefined) ? input.value : (input.innerText || '');
            handleSubmit(val, responseEl);
          }
        });
      }
    }
  } else {
    console.warn('Let-it-out elements not found or created; the script created a floating widget instead.');
  }

  window.__letItOut_generate = generateHumanReply;

})();
