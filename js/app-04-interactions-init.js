// ── DAILY REFLECTION ──────────────────────────────────────────────────────────
const REFLECTIONS=[
  // SHORT — quotes with prompt (type:'short')
  {type:'short',text:'The secret of getting ahead is getting started.',source:'Mark Twain',prompt:'What is one thing you\'ve been putting off that you can start today?'},
  {type:'short',text:'You do not rise to the level of your goals. You fall to the level of your systems.',source:'James Clear, Atomic Habits',prompt:'What system could you build this week that makes your goals automatic?'},
  {type:'short',text:'Almost everything will work again if you unplug it for a few minutes — including you.',source:'Anne Lamott',prompt:'When did you last truly rest, without guilt?'},
  {type:'short',text:'Be yourself; everyone else is already taken.',source:'Oscar Wilde',prompt:'What part of yourself have you been hiding to fit in?'},
  {type:'short',text:'The only way to do great work is to love what you do.',source:'Steve Jobs',prompt:'What small part of your work today can you approach with genuine curiosity?'},
  {type:'short',text:'It is not the mountain we conquer, but ourselves.',source:'Edmund Hillary',prompt:'What inner resistance is your real challenge today — not the task itself?'},
  {type:'short',text:'In the middle of every difficulty lies opportunity.',source:'Albert Einstein',prompt:'What problem in front of you is hiding a lesson you actually need?'},
  {type:'short',text:'The mind is everything. What you think, you become.',source:'Buddha',prompt:'What thought have you been repeating today — and is it serving you?'},
  {type:'short',text:'Do what you can, with what you have, where you are.',source:'Theodore Roosevelt',prompt:'What can you accomplish right now with exactly what is in front of you?'},
  {type:'short',text:'Simplicity is the ultimate sophistication.',source:'Leonardo da Vinci',prompt:'What could you simplify in your work or life today?'},
  {type:'short',text:'The best time to plant a tree was 20 years ago. The second best time is now.',source:'Chinese Proverb',prompt:'What have you delayed starting because you wished you had begun earlier?'},
  {type:'short',text:'We accept the love we think we deserve.',source:'Stephen Chbosky',prompt:'In what areas are you settling for less than you deserve — at work or in life?'},
  {type:'short',text:'Comparison is the thief of joy.',source:'Theodore Roosevelt',prompt:'Whose life or progress have you been comparing yourself to — and why?'},
  {type:'short',text:'If you are not willing to risk the unusual, you will have to settle for the ordinary.',source:'Jim Rohn',prompt:'What unusual step are you avoiding because it feels risky?'},
  {type:'short',text:'Happiness is not something ready-made. It comes from your own actions.',source:'Dalai Lama',prompt:'What action today — however small — would genuinely make you feel better?'},
  {type:'short',text:'The only limit to our realization of tomorrow will be our doubts of today.',source:'Franklin D. Roosevelt',prompt:'What doubt is currently limiting how far you can see ahead?'},
  {type:'short',text:'Energy flows where attention goes.',source:'Tony Robbins',prompt:'Where has most of your attention been going lately — and is it where you want it?'},
  {type:'short',text:'You are never too old to set another goal or to dream a new dream.',source:'C.S. Lewis',prompt:'What goal have you quietly given up on — and is it truly gone, or just waiting?'},
  {type:'short',text:'Act as if what you do makes a difference. It does.',source:'William James',prompt:'How would you work differently today if you truly believed your effort mattered?'},
  {type:'short',text:'The two most important days in your life are the day you are born and the day you find out why.',source:'Mark Twain',prompt:'Have you found your "why" yet — or are you still searching?'},
  {type:'short',text:'Perfection is the enemy of progress.',source:'Winston Churchill',prompt:'Where is your need for perfection holding you back from shipping something good enough?'},
  {type:'short',text:'Do not go where the path may lead; go instead where there is no path and leave a trail.',source:'Ralph Waldo Emerson',prompt:'Where in your life are you following a path someone else laid out for you?'},
  {type:'short',text:'The present moment is the only moment available to us, and it is the door to all moments.',source:'Thich Nhat Hanh',prompt:'What are you mentally living in right now — the past, future, or here?'},
  {type:'short',text:'It always seems impossible until it\'s done.',source:'Nelson Mandela',prompt:'What is one thing you once thought impossible that you\'ve already proven wrong?'},
  {type:'short',text:'Growth is uncomfortable; that\'s how you know it\'s working.',source:'Unknown',prompt:'What discomfort are you experiencing right now that might actually be growth?'},
  {type:'short',text:'You can\'t go back and change the beginning, but you can start where you are and change the ending.',source:'C.S. Lewis',prompt:'What story about yourself are you ready to start rewriting today?'},
  {type:'short',text:'The quality of your life is determined by the quality of your questions.',source:'Tony Robbins',prompt:'What better question could you be asking yourself right now?'},
  {type:'short',text:'Discipline is choosing between what you want now and what you want most.',source:'Abraham Lincoln',prompt:'What are you choosing right now — the immediate want or the deeper one?'},
  {type:'short',text:'What lies behind us and what lies before us are tiny matters compared to what lies within us.',source:'Ralph Waldo Emerson',prompt:'What strength inside you are you currently underusing?'},
  {type:'short',text:'Your life does not get better by chance. It gets better by change.',source:'Jim Rohn',prompt:'What one change — however small — would improve your day most right now?'},
  {type:'short',text:'The cave you fear to enter holds the treasure you seek.',source:'Joseph Campbell',prompt:'What uncomfortable thing are you avoiding that probably holds something valuable for you?'},
  {type:'short',text:'Everything you\'ve ever wanted is on the other side of fear.',source:'George Addair',prompt:'What fear is standing between you and something you genuinely want?'},
  {type:'short',text:'Small daily improvements are the key to staggering long-term results.',source:'Unknown',prompt:'What tiny 1% improvement could you make to your work routine this week?'},
  {type:'short',text:'We suffer more in imagination than in reality.',source:'Seneca',prompt:'What are you imagining as worse than it probably is?'},
  {type:'short',text:'A ship in harbor is safe, but that is not what ships are for.',source:'John A. Shedd',prompt:'Where are you playing it too safe right now?'},
  {type:'short',text:'What you think, you become. What you feel, you attract. What you imagine, you create.',source:'Buddha',prompt:'What are you imagining for your future today — and is it worth imagining more of?'},
  {type:'short',text:'Patience is not the ability to wait, but the ability to keep a good attitude while waiting.',source:'Joyce Meyer',prompt:'What are you currently waiting for — and how is your attitude while you wait?'},
  {type:'short',text:'The people who are crazy enough to think they can change the world are the ones who do.',source:'Steve Jobs',prompt:'What part of your world — however small — are you crazy enough to try changing?'},
  {type:'short',text:'Vulnerability is not weakness. It is our greatest measure of courage.',source:'Brené Brown',prompt:'Where have you been hiding vulnerability that might actually connect you to others?'},
  {type:'short',text:'Start where you are. Use what you have. Do what you can.',source:'Arthur Ashe',prompt:'What excuse about not being ready can you let go of today?'},
  // MEDIUM — paragraphs (~80 words, type:'medium')
  {type:'medium',text:'Most people confuse being busy with being productive. You can fill an entire day responding to messages, attending meetings, and ticking off small tasks — and feel completely drained while having moved nothing important forward. Productivity is not about volume. It is about choosing, deliberately and with full attention, the few things that actually matter and protecting the time to do them well. Busyness is often a way of avoiding that choice.',source:'Inspired by Cal Newport',prompt:'What important thing have you been avoiding by staying busy?'},
  {type:'medium',text:'Kindness at work is underrated. Not the performative kind — the quiet, consistent kind. Remembering someone\'s name. Acknowledging a job well done without being asked to. Asking how someone is actually doing, and then listening. These things cost nothing and compound over time into the kind of workplace — and the kind of person — that everyone wants to be around. You get to decide every day what kind of presence you bring.',source:'',prompt:'Who in your team could use a small acknowledgment today?'},
  {type:'medium',text:'There is a version of you that you imagine you will become once the conditions are right — once you have more time, more money, more confidence, the right job, the right city. But that version never arrives, because conditions are never perfect. The person you want to become is built incrementally, in imperfect conditions, with the resources you currently have. Not later. Gradually, starting now.',source:'',prompt:'What are you waiting for that you could start without?'},
  {type:'medium',text:'One of the quietest forms of courage is choosing not to react. When someone is rude, when a task goes wrong, when you feel overlooked or undervalued — the impulse is immediate and understandable. But the pause between stimulus and response is where character lives. It is not passive. It is the hardest kind of active choice. And it is available to you more often than you realize.',source:'Inspired by Viktor Frankl',prompt:'Where today might you need that pause more than a reaction?'},
  {type:'medium',text:'The people who stay calm under pressure are not people who feel no pressure. They are people who have practiced, over and over, returning to their breath, their feet on the floor, the next small task. Calm is not a personality trait. It is a skill — one built through repetition, not inspiration. The moment you need it most is almost never the right time to start learning it.',source:'',prompt:'What is one practice you could build now so calm is available when you need it?'},
  {type:'medium',text:'There is something quietly powerful about showing up consistently. Not brilliantly every day — just reliably. The colleague who is always there, always honest, always trying. Over months and years, that consistency builds a reputation that no single impressive performance can create. Excellence gets noticed once. Reliability gets trusted forever.',source:'',prompt:'What would it look like to simply show up more consistently in one area of your life?'},
  {type:'medium',text:'Gratitude is not just a feeling — it is a practice of attention. The brain is wired to scan for threats and problems. Left to itself, it will always find something wrong. Gratitude is the deliberate act of redirecting that attention: noticing what is working, who helped you, what went better than expected. It does not require everything to be good. It requires you to find what is.',source:'',prompt:'What three things in your day today are worth noticing with gratitude?'},
  {type:'medium',text:'You do not need to figure out your entire future to make a good decision today. Most paralysis comes from trying to trace every possible path forward before taking one step. The path reveals itself through motion, not planning. Pick the direction that feels most aligned with what you value, take one clear step, and let the next step become visible. Movement creates clarity. Waiting rarely does.',source:'',prompt:'What decision have you been delaying because you want more certainty first?'},
  {type:'medium',text:'The relationships you invest in most become the world you inhabit. Not just romantic or family ones — colleagues, mentors, friends made in passing. The people around you shape your language, your standards, your sense of what is normal and what is possible. Choosing your relationships with some intentionality is not cold. It is how you take responsibility for the environment your future self will grow in.',source:'',prompt:'Who is one person in your life worth investing more time in?'},
  {type:'medium',text:'Rest is not a reward for completing your work. It is a condition for doing it well. Creativity, patience, judgment, and empathy all deteriorate under sustained depletion. The most productive people are not those who work the most hours — they are those who have learned to alternate deeply focused effort with genuine recovery. Protecting rest is not laziness. It is strategy.',source:'',prompt:'What would genuine rest look like for you this week?'},
  {type:'medium',text:'Failure is a data point, not a verdict. When something does not work, you have learned something true about the world that you did not know before. Most people treat failure as evidence that they should stop. The most resilient people treat it as navigation — it tells them where not to go, and sometimes exactly what to try next. The only unrecoverable failure is the one you refuse to examine.',source:'',prompt:'What recent setback, examined honestly, has something to teach you?'},
  {type:'medium',text:'It is easy to be kind when things are going well. The real test is how you treat people when you are tired, frustrated, under pressure, or when they cannot give you anything in return. That is where character shows up — not in the moments of ease, but in the moments of friction. Every difficult interaction is a small exam you did not ask to take.',source:'',prompt:'How have you been doing on that exam lately?'},
  {type:'medium',text:'Your attention is the most valuable thing you have. Money can be made again. Time can be partially recovered through rest. But the quality of your attention — what you choose to focus on, for how long, with what depth — shapes the quality of everything you produce and experience. Guard it. Spend it deliberately. What gets your attention gets your life.',source:'',prompt:'What has been getting your attention lately that probably does not deserve it?'},
  {type:'medium',text:'Confidence is not the absence of self-doubt. It is the decision to act despite it. Almost everyone who does something hard and worthwhile feels uncertain before they start. The difference between people who do things and people who don\'t is rarely about who feels more certain — it is about who learned to move forward without needing certainty first.',source:'',prompt:'What would you do today if you did not need to feel confident before starting?'},
  {type:'medium',text:'The habit of comparing yourself to others will always make you feel either superior or inferior — neither of which is useful. The only comparison that matters is between who you are today and who you were yesterday. Progress measured against your own baseline is honest, motivating, and entirely within your control. Everyone else is running a different race on a different track with different shoes.',source:'',prompt:'In what way are you genuinely better than you were six months ago?'},
  {type:'medium',text:'Listening — real listening, not waiting to speak — is one of the rarest and most valuable things you can offer another person. Most conversations are two people performing their own inner monologue at each other. When someone feels truly heard, something shifts. They think more clearly. They feel less alone. And you almost always learn something you would not have gotten to by talking.',source:'',prompt:'Who in your life could use to be truly heard right now?'},
  {type:'medium',text:'The stories you tell yourself about yourself are more powerful than almost anything anyone else says to you. "I\'m bad at this." "I always do that." "That\'s just who I am." These are not truths — they are conclusions you drew from evidence, and like all conclusions, they can be revised when you encounter new evidence. You are not a fixed object. You are an ongoing experiment.',source:'',prompt:'What story about yourself might be worth questioning today?'},
  {type:'medium',text:'Progress almost never looks the way we imagine it will. We expect a straight line upward. What actually happens is: flat periods, small breakthroughs, setbacks, confusion, and then a quiet shift where things start clicking. The flat periods are not wasted time — they are where the foundation is being laid. Staying through them is one of the most important skills anyone can develop.',source:'',prompt:'What flat period in your life right now might actually be foundation-building?'},
  {type:'medium',text:'Saying no is a form of self-respect. Every yes to something you do not want or believe in is a small withdrawal from your own sense of integrity. Over time, the accumulation of reluctant yeses creates a life that does not feel like yours. Learning to say no — kindly, clearly, without excessive apology — is one of the most important things you can practice.',source:'',prompt:'What have you said yes to recently that you wish you\'d said no to?'},
  {type:'medium',text:'Most of the things we worry about never happen. And the things that do happen — the actual hard events, the real losses — are survived in ways we could not have predicted. The human capacity for adaptation is extraordinary and consistently underestimated. You have gotten through everything that has come for you so far. That is not a small thing.',source:'',prompt:'What are you worrying about today that you might look back on as smaller than it feels right now?'},
  // LONG — reads for slow mornings (~200 words, type:'long')
  {type:'long',text:`There is a Japanese concept called "ikigai" — roughly translated as "reason for being." It sits at the intersection of four questions: What do you love? What are you good at? What does the world need? What can you be paid for? Most people settle for one or two of these. A job that pays well but drains them. A passion that fulfills them but doesn't sustain them. Ikigai suggests that the richest version of a working life lives somewhere in the center — where all four circles overlap.

The interesting thing about ikigai is that it is rarely discovered through thinking. It is discovered through doing, noticing, and gradually paying more attention to what lights you up and what quietly deadens you. It does not have to be grand. A person whose ikigai is making excellent coffee for people who need it in the morning has found something real. A person who is technically successful but spends Sunday nights dreading Monday has not yet found it — or has drifted from it.

The search is worth taking seriously. Not with urgency, but with honest, ongoing attention to what makes you feel most alive.`,source:'Inspired by the Japanese concept of Ikigai',prompt:'Which of the four ikigai circles feels most underdeveloped in your life right now?'},
  {type:'long',text:`There is a well-documented psychological phenomenon called the "arrival fallacy" — the mistaken belief that achieving a goal will bring lasting happiness. You tell yourself: when I get the promotion, when I finish this project, when I reach that number, I will finally feel okay. Then the thing arrives. There is a brief feeling of relief or satisfaction. And then — often within days — the baseline returns, and a new target appears on the horizon.

This is not a flaw in you. It is the way human motivation works. The brain is designed to keep moving, not to arrive. The arrival fallacy becomes harmful only when we postpone living well until the thing happens. When we defer rest, relationships, joy, presence — all waiting for a future state that will feel, once reached, surprisingly ordinary.

The alternative is not to stop having goals. It is to find meaning in the process itself. To enjoy the building as much as the having. To ask not only "what do I want to achieve?" but "what kind of daily life do I want to be living while I'm getting there?" The journey is not the thing you endure to get to the destination. For most of us, the journey is most of our life.`,source:'',prompt:'What are you deferring until some future milestone that you could actually start enjoying now?'},
  {type:'long',text:`The Stoic philosophers had a practice called "memento mori" — remembering that you will die. It sounds morbid. In practice, it is clarifying. Marcus Aurelius, who ruled the Roman Empire and wrote privately in a journal never meant for publication, returned to this theme again and again. Not out of despair, but out of a desire to keep his attention on what genuinely mattered.

When you hold your mortality lightly in mind — not obsessively, just occasionally — it has a curious effect. Small irritations shrink. The things you've been putting off feel more urgent. The people you love become more vivid. The grudges you've been carrying seem suddenly not worth the weight.

You do not need to walk around thinking about death to benefit from this practice. You need only to occasionally ask: if this were one of my last ordinary days, what would I regret not saying? Not doing? Not letting go of? Most of the time, the answer points clearly at something you already know but have been avoiding. The Stoics were not pessimists. They were people trying to live fully, and they found that facing the end made the present more real.`,source:'Inspired by Marcus Aurelius, Meditations',prompt:'What would you regret not doing if this week were your last ordinary one?'},
  {type:'long',text:`Cal Newport writes about a concept he calls "deep work" — the ability to focus without distraction on cognitively demanding tasks. He argues that this ability is becoming increasingly rare at exactly the moment it is becoming increasingly valuable. The modern workplace, with its open offices, constant notifications, and culture of visible busyness, is almost perfectly designed to prevent it.

The people who can still do deep work — who can sit with a hard problem for two or three hours without checking their phone, without switching tabs, without the itch to do something easier — produce work of a fundamentally different quality than those who cannot. Not because they are smarter, but because hard thinking requires sustained, uninterrupted time to develop. Insight is not instant. It builds slowly, in blocks of protected attention.

The good news is that deep work is a skill, not a talent. It atrophies in people who stop practicing it and strengthens in people who deliberately train it. Starting small helps: one 45-minute block a day, phone face-down, one task, nothing else. The discomfort at the beginning is the friction of a muscle that has not been used. It passes. And what you can produce on the other side of it is remarkable.`,source:'Inspired by Cal Newport, Deep Work',prompt:'When did you last do something that required — and got — two full hours of your uninterrupted attention?'},
  {type:'long',text:`Viktor Frankl survived four concentration camps, including Auschwitz, and emerged to write "Man's Search for Meaning" — one of the most important books of the 20th century. His central insight was this: the one freedom that can never be taken from a human being is the freedom to choose one's attitude toward any given set of circumstances.

He observed in the camps that survival was not simply a matter of physical strength. The people who endured longest were often not the strongest. They were the people who had found — or held onto — a sense of meaning. A reason to persist. A person to return to, a work to finish, a truth to carry forward. When the "why" remained, the "how" could be endured.

This does not mean suffering is good, or that we should minimize hardship. It means that even in situations of genuine helplessness, something remains: your response. The story you tell about what is happening to you. The posture you take toward it. Frankl called this "the last of human freedoms." It sounds small. It is enormous. And unlike most things in life, it requires no resources, no permission, and no ideal conditions. It is available right now, wherever you are.`,source:'Inspired by Viktor Frankl, Man\'s Search for Meaning',prompt:'What is a current difficulty in your life that you could approach with a different attitude — not denial, but choice?'},
  {type:'long',text:`In her research on resilience, Brené Brown found something unexpected. She went in looking for people who had managed to avoid shame and vulnerability — people who seemed to have it all together. What she found instead was that the people with the strongest sense of belonging and connection were the ones who had leaned into vulnerability, not away from it.

She called these people "wholehearted" — people who engaged with life from a place of worthiness rather than from a place of constantly trying to prove it. They told their stories. They let themselves be seen. They asked for help. They admitted uncertainty. And paradoxically, this made them more resilient, not less. Because they were not spending energy maintaining a performance of competence. They were free to actually be competent — and to fail, and to try again.

The armor we wear to protect ourselves from being seen is often the very thing that prevents us from being known. And being known — imperfectly, honestly, in full — is the root of every meaningful human connection. The risk is real. So is the reward. And the only way to know whether it is worth it is to try it with someone you trust, in a moment when it matters.`,source:'Inspired by Brené Brown, The Gifts of Imperfection',prompt:'Where in your life are you wearing armor that might be costing you more than it is protecting you?'},
  {type:'long',text:`There is a famous concept in psychology called the "hedonic treadmill" — the observation that humans rapidly adapt to both positive and negative changes in their circumstances and return to a relatively stable baseline of happiness. Win the lottery: initial euphoria, then a return to your prior emotional set point. Suffer an injury: initial despair, then, in most cases, a gradual return. This adaptation happens faster and more completely than most people expect.

What this tells us is both humbling and liberating. Humbling, because it suggests that the big external changes we pin our happiness to — the salary, the apartment, the relationship status — will probably matter less and for shorter than we imagine. Liberating, because it means that what we build into our daily lives — small rituals, quality relationships, meaningful work, the ability to be present — matters more than we tend to give it credit for.

Happiness that comes from within — from engagement, meaning, autonomy, and genuine connection — does not adapt away as quickly. It is built, tended, and renewed. It is slower to acquire than a windfall and more durable than one. The treadmill is real, but so is the alternative: a life designed around what actually sustains rather than what temporarily elevates.`,source:'Inspired by positive psychology research',prompt:'What daily practice or ritual — however small — genuinely sustains your sense of wellbeing?'},
  {type:'long',text:`The philosopher Epictetus was born a slave and lived the early part of his life with no control over where he was, what he did, or how he was treated. From this position, he developed a philosophy that has outlasted empires: the dichotomy of control. Some things are in our power — our judgments, our intentions, our responses, our values. Most things are not — the weather, what others think of us, outcomes we cannot guarantee.

The Stoics did not teach passivity. Epictetus worked hard. He pursued education. He eventually won his freedom. But he did not base his sense of wellbeing on any of those outcomes, because he knew they could be taken away. What could not be taken away was his relationship to them — the dignity of his effort, the clarity of his intentions, the choice of how to meet whatever came.

This is not resignation. It is a radical form of freedom. When you stop trying to control what cannot be controlled and invest that energy into what genuinely is within your power, you stop being at the mercy of events and become, in a real sense, the author of your own experience. Most anxiety is the gap between what we wish we could control and what we actually can. Closing that gap begins with honesty about which is which.`,source:'Inspired by Epictetus, Enchiridion',prompt:'What are you currently trying to control that is not actually within your power?'},
  {type:'long',text:`Adam Grant, the organizational psychologist, distinguishes between givers, takers, and matchers. Takers try to get as much as possible from others. Matchers give and take in equal measure. Givers contribute without keeping score. The surprising finding from his research: givers end up at both extremes of success — they are disproportionately represented among both the least successful and the most successful people.

The difference between the two groups of givers is boundary-setting. Givers who burn out are giving indiscriminately, to everyone, at the cost of their own time and wellbeing. The most successful givers have learned to give strategically — focusing their generosity on areas where it matters most, protecting their own capacity to continue, and occasionally saying no to requests that drain without creating real value for anyone.

The insight is not "give less." It is "give sustainably." People who approach their work and relationships with genuine generosity — who mentor without expecting recognition, who help without counting — consistently create environments where others want to help them back. Not through calculation. Through the culture they model. Generosity is not naive. When practiced well, it is one of the most effective long-term strategies for building a career and a life worth having.`,source:'Inspired by Adam Grant, Give and Take',prompt:'How sustainable is your generosity right now — and where might you need a boundary to protect it?'},
  {type:'long',text:`There is a phrase in Japanese: "shokunin kishitsu" — the spirit of the craftsman. It describes a devotion to one's craft that goes beyond professional obligation. A sushi chef who has been making the same style of rice for thirty years and still thinks about how to improve it. A carpenter who sands surfaces no one will ever see. A support agent who crafts every response as if the person on the other end of the message is the only customer in the world.

Shokunin is not about perfectionism in the anxious sense — the fear of getting it wrong. It is about genuine care. It is about taking seriously the thing in front of you, for its own sake, regardless of whether anyone will notice. It is the opposite of "good enough to pass." It is "as good as I know how to make it, right now, with what I have."

In an era of scale and speed, this quality is genuinely rare. It is also recognizable — people can feel the difference between something made with care and something produced quickly. And the craftsman relationship with their work tends to produce something that market-oriented work often misses: a quiet, durable satisfaction. Not excitement. Not validation. Just the steady sense of having done something well.`,source:'Inspired by the Japanese concept of Shokunin',prompt:'What aspect of your work today could you approach with genuine craftsman attention — treating it as if it mattered more than it needs to?'},
  {type:'long',text:`Susan Cain's research into introversion challenged the cultural assumption that extroversion is the ideal. Western culture in particular tends to reward those who speak first, speak loudly, and take up space in a room. The quiet, the thoughtful, the ones who listen before they speak — they are often overlooked, underestimated, and pushed to perform a version of themselves that does not come naturally.

What Cain found is that many of the most significant contributions in history — in science, art, literature, philosophy — came from people who did much of their best work alone. Who needed solitude not as escape but as fuel. Who processed deeply before speaking and preferred one real conversation to ten superficial ones.

This is not an argument for isolation. It is an argument for knowing yourself well enough to design a life that works with your nature rather than against it. An introvert who forces themselves into constant social performance will produce a fraction of what they are capable of. An extrovert kept in isolation will shrink. The most effective people are not those who have overcome their nature — they are those who have understood it well enough to stop fighting it, and started working with it instead.`,source:'Inspired by Susan Cain, Quiet',prompt:'In what ways might you be working against your own nature rather than with it?'},
  {type:'long',text:`Angela Duckworth spent years studying the question of who succeeds and why. She looked at West Point cadets, spelling bee champions, rookie teachers in the toughest schools, and salespeople grinding through rejection. The pattern she found was not what most people expected. It was not IQ, social intelligence, physical health, or family income that most reliably predicted whether someone would stick it out and eventually excel. It was grit — a combination of passion and perseverance for long-term goals.

Grit, as Duckworth defines it, is not stubbornness. It is not refusing to change course when the evidence demands it. It is something quieter and more durable: a sustained commitment to a direction that continues even when the work gets tedious, when progress stalls, when others seem to be pulling ahead. It is the capacity to stay interested in something past the initial excitement — past the point where most people drift on to something shinier.

She points to what she calls the "valley of despair" in any long-term pursuit — the stretch in the middle where the novelty has worn off, the end is not yet in sight, and the only thing available is the work itself. This is where most people quit. And it is exactly here, Duckworth argues, that the people who ultimately make something of themselves learn to find meaning not in the outcome but in the doing — in the daily practice, the incremental problem, the small refinement.

This has implications for how we think about effort. Talent sets the ceiling on what you can do. Effort determines how close you get to it — and effort counts twice: once in building skill, and again in deploying it. A person with moderate talent who shows up every day and works with genuine attention will, over years, consistently outproduce someone with high talent who relies on it. Grit is not a consolation prize for those without talent. It is the multiplier that decides how far talent actually travels.`,source:'Inspired by Angela Duckworth, Grit',prompt:'Where in your life are you currently in the middle — past the excitement, before the payoff — and what keeps you going?'},
];

function getDailyReflection(){
  const now=new Date();
  const dayOfYear=Math.floor((now-(new Date(now.getFullYear(),0,0)))/86400000);
  return REFLECTIONS[dayOfYear%REFLECTIONS.length];
}

function renderReflection(){
  const panelEl=document.getElementById('reflection-panel');
  if(panelEl)panelEl.style.display=(typeof _showReflectionPanel==='undefined'||_showReflectionPanel)?'':'none';
  if(typeof _showReflectionPanel!=='undefined'&&!_showReflectionPanel)return;
  const r=getDailyReflection();
  if(!r)return;
  const bodyEl=document.getElementById('reflection-body');
  const sourceEl=document.getElementById('reflection-source');
  const expandBtn=document.getElementById('reflection-expand-btn');
  const dateBadge=document.getElementById('reflection-date-badge');
  if(!bodyEl)return;
  // Date badge
  if(dateBadge){
    const now=new Date();
    dateBadge.textContent=now.toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'});
  }
  // Build body content
  let html='';
  if(r.type==='long'){
    // Show first sentence as teaser — full read opens in modal on click
    const firstPara=r.text.split('\n\n')[0]||r.text;
    const firstSentenceMatch=firstPara.match(/^[^.!?]+[.!?]/);
    const teaser=firstSentenceMatch?firstSentenceMatch[0]:firstPara.slice(0,130)+'…';
    html=`<p style="margin-bottom:0;color:var(--text-muted);font-style:italic;font-size:12.5px">${teaser}</p>`;
    html+=`<p style="margin-top:8px;font-size:11px;color:var(--accent)">📖 Click to read full reflection →</p>`;
    bodyEl.classList.remove('long-read');
    bodyEl.innerHTML=html;
    if(expandBtn)expandBtn.style.display='none';
  } else {
    // Short or medium — show inline
    html=`<p style="margin-bottom:${r.prompt?'8px':'0'};font-style:${r.type==='short'?'italic':''}">\u201c${r.text}\u201d</p>`;
    if(r.prompt)html+=`<p style="color:var(--accent);font-size:12px">💭 ${r.prompt}</p>`;
    bodyEl.classList.remove('long-read');
    bodyEl.innerHTML=html;
    if(expandBtn)expandBtn.style.display='none';
  }
  if(sourceEl)sourceEl.textContent=r.source?`— ${r.source}`:'';
}

function toggleReflectionExpand(){
  const body=document.getElementById('reflection-body');
  const btn=document.getElementById('reflection-expand-btn');
  if(!body||!btn)return;
  const expanded=body.classList.toggle('expanded');
  btn.textContent=expanded?'Read less ↑':'Read more ↓';
}

function openReflectionModal(){
  const r=getDailyReflection();
  if(!r)return;
  const overlay=document.getElementById('reflection-modal');
  if(!overlay)return;
  // Date + reading time
  const dateEl=document.getElementById('reflection-modal-date');
  if(dateEl){
    const now=new Date();
    const wordCount=r.text.trim().split(/\s+/).length;
    const mins=Math.max(1,Math.round(wordCount/200));
    const dateStr=now.toLocaleDateString('en-PH',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
    dateEl.textContent=`${dateStr}  ·  ${wordCount} words  ·  ${mins} min read`;
  }
  // Source
  const sourceEl=document.getElementById('reflection-modal-source');
  if(sourceEl)sourceEl.textContent=r.source?`— ${r.source}`:'';
  // Body
  const bodyEl=document.getElementById('reflection-modal-body');
  if(bodyEl){
    const paras=(r.type==='long'?r.text.split('\n\n').filter(Boolean):[r.text]);
    const isQuote=(r.type==='short'||r.type==='medium');
    bodyEl.innerHTML=paras.map((p,i)=>{
      const text=isQuote&&i===0?`\u201c${p}\u201d`:p;
      return`<p>${text}</p>`;
    }).join('');
  }
  // Prompt
  const promptEl=document.getElementById('reflection-modal-prompt');
  if(promptEl){
    if(r.prompt){promptEl.innerHTML=`💭 <strong>Reflect:</strong> ${r.prompt}`;promptEl.classList.add('visible');}
    else{promptEl.classList.remove('visible');}
  }
  overlay.classList.add('open');
  document.body.style.overflow='hidden';
}

function closeReflectionModal(){
  const overlay=document.getElementById('reflection-modal');
  if(!overlay)return;
  overlay.classList.remove('open');
  document.body.style.overflow='';
}

// ── 4. KEYBOARD SHORTCUTS ─────────────────────────────────────
// Ctrl+F / Cmd+F: find-in-page, like a browser's native find bar, but
// scoped to whichever dashboard page is currently visible (since this is
// a new-tab page, not a normal site, the browser's own find bar can't be
// relied on to work consistently here).
let _pfMatches=[];
let _pfIndex=-1;
let _pfLastQuery='';
function _pfCurrentPage(){
  return Array.from(document.querySelectorAll('.main > div[id^="page-"]'))
    .find(el=>el.style.display!=='none')||document.querySelector('.main');
}
function _pfBar(){
  let bar=document.getElementById('pagefind-bar');
  if(bar)return bar;
  bar=document.createElement('div');
  bar.id='pagefind-bar';
  bar.className='pagefind-bar';
  bar.innerHTML=`
    <input type="text" id="pagefind-input" placeholder="Find on page" autocomplete="off" spellcheck="false">
    <span class="pagefind-count" id="pagefind-count"></span>
    <button type="button" id="pagefind-prev" title="Previous match (Shift+Enter)"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg></button>
    <button type="button" id="pagefind-next" title="Next match (Enter)"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></button>
    <button type="button" id="pagefind-close" title="Close (Esc)"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
  document.body.appendChild(bar);
  const input=bar.querySelector('#pagefind-input');
  input.addEventListener('input',()=>_pfSearch(input.value));
  input.addEventListener('keydown',e=>{
    if(e.key==='Enter'){e.preventDefault();_pfStep(e.shiftKey?-1:1);}
    else if(e.key==='Escape'){e.preventDefault();closeFindBar();}
  });
  bar.querySelector('#pagefind-next').addEventListener('click',()=>_pfStep(1));
  bar.querySelector('#pagefind-prev').addEventListener('click',()=>_pfStep(-1));
  bar.querySelector('#pagefind-close').addEventListener('click',closeFindBar);
  return bar;
}
function _pfClearHighlights(){
  document.querySelectorAll('mark.pagefind-match').forEach(m=>{
    const parent=m.parentNode;
    if(!parent)return;
    parent.replaceChild(document.createTextNode(m.textContent),m);
    parent.normalize();
  });
  _pfMatches=[];
  _pfIndex=-1;
}
function _pfSearch(query){
  _pfClearHighlights();
  _pfLastQuery=query;
  const countEl=document.getElementById('pagefind-count');
  const q=query.trim();
  if(!q){if(countEl)countEl.textContent='';return;}
  const root=_pfCurrentPage();
  if(!root){if(countEl)countEl.textContent='';return;}
  const skipTags=new Set(['SCRIPT','STYLE','INPUT','TEXTAREA','SELECT','MARK']);
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
    acceptNode(node){
      if(!node.nodeValue||!node.nodeValue.trim())return NodeFilter.FILTER_REJECT;
      let el=node.parentElement;
      if(!el||skipTags.has(el.tagName))return NodeFilter.FILTER_REJECT;
      if(el.closest('#pagefind-bar'))return NodeFilter.FILTER_REJECT;
      // Skip text inside elements that are themselves hidden.
      if(el.offsetParent===null&&getComputedStyle(el).position!=='fixed')return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes=[];
  let n;while(n=walker.nextNode())nodes.push(n);
  const qLower=q.toLowerCase();
  nodes.forEach(node=>{
    const text=node.nodeValue;
    const lower=text.toLowerCase();
    if(lower.indexOf(qLower)===-1)return;
    const frag=document.createDocumentFragment();
    let last=0,idx;
    while((idx=lower.indexOf(qLower,last))!==-1){
      if(idx>last)frag.appendChild(document.createTextNode(text.slice(last,idx)));
      const mark=document.createElement('mark');
      mark.className='pagefind-match';
      mark.textContent=text.slice(idx,idx+q.length);
      frag.appendChild(mark);
      _pfMatches.push(mark);
      last=idx+q.length;
    }
    if(last<text.length)frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag,node);
  });
  if(_pfMatches.length){_pfIndex=0;_pfHighlightCurrent();}
  if(countEl)countEl.textContent=_pfMatches.length?`${_pfIndex+1}/${_pfMatches.length}`:'0/0';
}
function _pfHighlightCurrent(){
  _pfMatches.forEach(m=>m.classList.remove('current'));
  const cur=_pfMatches[_pfIndex];
  if(!cur)return;
  cur.classList.add('current');
  cur.scrollIntoView({block:'center',behavior:'smooth'});
  const countEl=document.getElementById('pagefind-count');
  if(countEl)countEl.textContent=`${_pfIndex+1}/${_pfMatches.length}`;
}
function _pfStep(dir){
  if(!_pfMatches.length)return;
  _pfIndex=(_pfIndex+dir+_pfMatches.length)%_pfMatches.length;
  _pfHighlightCurrent();
}
function openFindBar(){
  const bar=_pfBar();
  bar.classList.add('open');
  const input=document.getElementById('pagefind-input');
  if(input){input.focus();input.select();}
}
function closeFindBar(){
  const bar=document.getElementById('pagefind-bar');
  if(bar)bar.classList.remove('open');
  _pfClearHighlights();
  const countEl=document.getElementById('pagefind-count');
  if(countEl)countEl.textContent='';
}
document.addEventListener('keydown',function(e){
  if((e.ctrlKey||e.metaKey)&&e.key==='f'){
    e.preventDefault();
    openFindBar();
    return;
  }
  if(e.key==='Escape'){
    const bar=document.getElementById('pagefind-bar');
    if(bar&&bar.classList.contains('open')){closeFindBar();return;}
  }
});
// Click anywhere outside the find bar closes it.
document.addEventListener('mousedown',function(e){
  const bar=document.getElementById('pagefind-bar');
  if(bar&&bar.classList.contains('open')&&!bar.contains(e.target)){closeFindBar();}
});
// Re-run the active search when switching pages, since matches live only
// in the currently visible page's DOM.
const _pfOrigShowPage=typeof showPage==='function'?showPage:null;
if(_pfOrigShowPage){
  showPage=function(name){
    _pfOrigShowPage(name);
    const bar=document.getElementById('pagefind-bar');
    if(bar&&bar.classList.contains('open')&&_pfLastQuery)_pfSearch(_pfLastQuery);
  };
}

// ── Arrow keys: Day detail modal navigation ────────────────────
document.addEventListener('keydown',function(e){
  // Close calendar heatmap modal on Escape
  if(e.key==='Escape'){
    const expModal=document.getElementById('export-month-modal');
    if(expModal&&expModal.classList.contains('open')){closeExportMonthModal();return;}
    const reflModal=document.getElementById('reflection-modal');
    if(reflModal&&reflModal.classList.contains('open')){closeReflectionModal();return;}
    const calModal=document.getElementById('cal-heatmap-overlay');
    if(calModal&&calModal.classList.contains('open')){closeCalHeatmapModal();return;}
    const dlcalModal=document.getElementById('dlcal-overlay');
    if(dlcalModal&&dlcalModal.classList.contains('open')){closeDayLookupCalModal();return;}
    const cfPopup=document.getElementById('col-filter-popup');
    if(cfPopup&&cfPopup.style.display!=='none'){closeColFilter();return;}
    // Team view: close a member's tile popup and drop back to the team grid
    // Popups opened FROM the member dashboard (sparkline chart / day detail / score list / card detail) sit on top of it,
    // so Escape must close those first — otherwise only the dashboard behind them closes.
    const _topOver=['avatar-picker-modal','spark-chart-modal','tile-survey-modal','member-detail-modal'].map(id=>document.getElementById(id)).find(el=>el&&el.classList.contains('open'));
    if(_topOver){_topOver.classList.remove('open');return;}
    const memberModal=document.getElementById('member-dashboard-modal');
    if(memberModal&&memberModal.classList.contains('open')){memberModal.classList.remove('open');return;}
  }
  const dayModal=document.getElementById('day-detail-modal');
  if(!dayModal||!dayModal.classList.contains('open'))return;
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT')return;
  if(e.key==='ArrowLeft'){e.preventDefault();navDay(-1);}
  else if(e.key==='ArrowRight'){e.preventDefault();navDay(1);}
});

// ── Delete key: bulk-delete selected survey rows ───────────────
document.addEventListener('keydown',function(e){
  if(e.key!=='Delete')return;
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT')return;
  const surveyPage=document.getElementById('page-survey');
  if(!surveyPage||surveyPage.style.display==='none')return;
  const dayModal=document.getElementById('day-detail-modal');
  if(dayModal&&dayModal.classList.contains('open'))return;
  const bulkBtn=document.getElementById('bulk-delete-btn');
  if(bulkBtn&&bulkBtn.style.display!=='none'){e.preventDefault();bulkDelete();}
});

// ── Arrow keys: month navigation (Dashboard, Survey data, Weekly view, Month summary) ──
// Pressing ← / → shifts the active period, the same as clicking the Prev/Next
// buttons — capped by shiftPeriod() so → never moves past the real current month.
let ytdStripHovered=false;
const ARROW_NAV_PAGE_IDS=['page-dashboard','page-survey','page-weekly','page-monthsummary'];
function _isBlockingUIOpen(){
  if(document.querySelector('.modal-overlay.open,.theme-picker-overlay.open,.cal-heatmap-overlay.open,.dlcal-overlay.open,.ann-overlay.open'))return true;
  const cf=document.getElementById('col-filter-popup');
  if(cf&&cf.style.display!=='none')return true;
  return false;
}
document.addEventListener('keydown',function(e){
  if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT'||e.target.isContentEditable)return;
  if(_isBlockingUIOpen())return;
  const onNavPage=ARROW_NAV_PAGE_IDS.some(id=>{
    const el=document.getElementById(id);
    return el&&el.style.display!=='none';
  });
  if(!onNavPage)return;
  e.preventDefault();
  shiftPeriod(e.key==='ArrowLeft'?-1:1);
});

// ── 5. TABLE FILTER (Excel-style column dropdowns) ─────────────
let tableFilterActive={lowCsat:false};
// columnFilters[field] is null (no filter / all shown) or a Set of allowed keys
let columnFilters={agent:null,csat:null,ar:null,date:null};
let _colFilterField=null,_colFilterOptions=[],_colFilterPending=new Set();

function toggleLowCSATFilter(){
  tableFilterActive.lowCsat=!tableFilterActive.lowCsat;
  const btn=document.getElementById('low-csat-btn');
  if(btn){
    btn.style.background=tableFilterActive.lowCsat?'rgba(239,68,68,0.15)':'';
    btn.style.color=tableFilterActive.lowCsat?'#f87171':'';
    btn.style.borderColor=tableFilterActive.lowCsat?'rgba(239,68,68,0.3)':'';
  }
  renderSurveyTableFiltered();
}

function clearTableFilter(){
  columnFilters={agent:null,csat:null,ar:null,date:null};
  tableFilterActive.lowCsat=false;
  const btn=document.getElementById('low-csat-btn');
  if(btn){btn.style.background='';btn.style.color='';btn.style.borderColor='';}
  updateColFilterTriggerStates();
  renderSurveyTableFiltered();
  renderAgentPillRow();
}

// ── Agent pill row (Survey records page) ─────────────────────────────────
// Mirrors the dashboard's Total-surveys tile: one pill per agent name with
// their survey count for the active period, sorted busiest-first. Clicking
// a pill filters the Survey records table to that agent (same mechanism as
// the Agent column header filter); clicking the active pill again clears it.
function renderAgentPillRow(){
  const wrap=document.getElementById('agent-pill-row');
  if(!wrap)return;
  const surveys=getPeriod(activePeriodKey).surveys||[];
  const counts=new Map();
  surveys.forEach(sv=>{
    const name=(sv.agent||'').trim();
    if(!name)return;
    counts.set(name,(counts.get(name)||0)+1);
  });
  if(!counts.size){wrap.style.display='none';wrap.innerHTML='';return;}
  wrap.style.display='flex';
  const active=columnFilters.agent;
  const activeName=(active&&active.size===1)?[...active][0]:null;
  const entries=[...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
  wrap.innerHTML=entries.map(([name,cnt])=>{
    const isActive=activeName===name;
    const label=prettifyAgentName(name);
    return `<button type="button" class="agent-pill-btn" data-agent="${escHtml(name)}" data-ph-click="filterByAgentPill(this.dataset.agent)" title="Click to filter Survey records to ${escHtml(label)}" style="display:inline-flex;align-items:center;gap:6px;background:${isActive?'var(--accent)':'var(--surface2)'};border:1px solid ${isActive?'var(--accent)':'var(--border)'};color:${isActive?'#fff':'var(--text)'};border-radius:20px;padding:4px 12px;font-size:12px;cursor:pointer;white-space:nowrap">
      <span style="font-weight:600">${escHtml(label)}</span>
      <span style="font-family:var(--mono);color:${isActive?'rgba(255,255,255,0.85)':'var(--text-muted)'}">${cnt}</span>
    </button>`;
  }).join('');
}
function filterByAgentPill(name){
  if(!name)return;
  const cur=columnFilters.agent;
  if(cur&&cur.size===1&&cur.has(name)){
    columnFilters.agent=null; // clicking the active pill again clears the filter
  } else {
    columnFilters.agent=new Set([name]);
  }
  updateColFilterTriggerStates();
  renderSurveyTableFiltered();
  renderAgentPillRow();
}

// Survey dates can carry a time-of-day (e.g. "6/18/26 1:52 AM" from block-format
// paste) — the date filter should group purely by calendar date and ignore it.
function dateOnly(dateStr){
  if(!dateStr)return '';
  const m=String(dateStr).trim().match(/^(\d{1,2}\/\d{1,2}\/\d{2,4})/);
  return m?m[1]:String(dateStr).trim();
}

// Per-row key used both to build the unique checklist and to test a row against it
function colFilterKey(field,sv){
  if(field==='agent'){const v=(sv.agent||'').trim();return v?v:'__blank__';}
  if(field==='ar')return sv.ar||'none';
  if(field==='csat')return(sv.csat!==null&&sv.csat!==undefined&&!isNaN(sv.csat))?sv.csat.toFixed(2):'__blank__';
  if(field==='date')return dateOnly(sv.date)||'__blank__';
  return '';
}

// Unique values present in the current period's data for a given column,
// in the order/format they should appear in the filter checklist
function getUniqueColumnValues(field){
  const surveys=getPeriod(activePeriodKey).surveys;
  if(field==='agent'){
    const map=new Map();
    surveys.forEach(sv=>{
      const key=colFilterKey('agent',sv);
      map.set(key,key==='__blank__'?'(Blank)':key);
    });
    return[...map.entries()].sort((a,b)=>a[1]==='(Blank)'?1:b[1]==='(Blank)'?-1:a[1].localeCompare(b[1])).map(([key,label])=>({key,label}));
  }
  if(field==='ar'){
    const present=new Set(surveys.map(sv=>colFilterKey('ar',sv)));
    const order=[['yes','YES'],['no','NO'],['none','(Blank)']];
    return order.filter(([k])=>present.has(k)).map(([key,label])=>({key,label}));
  }
  if(field==='csat'){
    const map=new Map();
    surveys.forEach(sv=>{
      const key=colFilterKey('csat',sv);
      map.set(key,key==='__blank__'?'(Blank)':key);
    });
    return[...map.entries()].sort((a,b)=>{
      if(a[1]==='(Blank)')return 1;
      if(b[1]==='(Blank)')return-1;
      return parseFloat(a[1])-parseFloat(b[1]);
    }).map(([key,label])=>({key,label}));
  }
  if(field==='date'){
    const set=new Set(surveys.map(sv=>colFilterKey('date',sv)));
    return[...set].sort((a,b)=>{
      if(a==='__blank__')return 1;
      if(b==='__blank__')return-1;
      return(parseDateKey(a)||a).localeCompare(parseDateKey(b)||b);
    }).map(key=>({key,label:key==='__blank__'?'(Blank)':key}));
  }
  return[];
}

function updateColFilterTriggerStates(){
  ['agent','csat','ar','date'].forEach(f=>{
    const btn=document.getElementById('cf-trig-'+f);
    if(btn)btn.classList.toggle('active',!!columnFilters[f]);
  });
}

function openColFilter(field,btnEl){
  _colFilterField=field;
  _colFilterOptions=getUniqueColumnValues(field);
  _colFilterPending=columnFilters[field]?new Set(columnFilters[field]):new Set(_colFilterOptions.map(o=>o.key));
  const search=document.getElementById('col-filter-search');
  if(search)search.value='';
  renderColFilterList();
  const popup=document.getElementById('col-filter-popup');
  const overlay=document.getElementById('col-filter-overlay');
  const rect=btnEl.getBoundingClientRect();
  const popupW=220;
  let left=rect.left-popupW+22;
  if(left<8)left=8;
  if(left+popupW>window.innerWidth-8)left=window.innerWidth-popupW-8;
  let top=rect.bottom+6;
  if(top+300>window.innerHeight)top=Math.max(8,rect.top-300);
  popup.style.left=left+'px';
  popup.style.top=top+'px';
  overlay.style.display='block';
  popup.style.display='block';
}

function closeColFilter(){
  const overlay=document.getElementById('col-filter-overlay');
  const popup=document.getElementById('col-filter-popup');
  if(overlay)overlay.style.display='none';
  if(popup)popup.style.display='none';
  _colFilterField=null;
}

function renderColFilterList(){
  const listEl=document.getElementById('col-filter-list');
  if(!listEl)return;
  const search=(document.getElementById('col-filter-search').value||'').toLowerCase();
  const visible=_colFilterOptions.filter(o=>!search||o.label.toLowerCase().includes(search));
  if(!visible.length){
    listEl.innerHTML='<div class="col-filter-empty">'+(_colFilterOptions.length?'No matches':'No data yet')+'</div>';
    return;
  }
  listEl.innerHTML=visible.map(o=>{
    const checked=_colFilterPending.has(o.key)?'checked':'';
    return'<label class="col-filter-item"><input type="checkbox" data-key="'+encodeURIComponent(o.key)+'" '+checked+' data-change="colFilterToggleItem(this.dataset.key,this.checked)"><span>'+o.label+'</span></label>';
  }).join('');
}

function colFilterToggleItem(encodedKey,checked){
  const key=decodeURIComponent(encodedKey);
  if(checked)_colFilterPending.add(key);else _colFilterPending.delete(key);
}

function colFilterSelectAll(){
  const search=(document.getElementById('col-filter-search').value||'').toLowerCase();
  _colFilterOptions.filter(o=>!search||o.label.toLowerCase().includes(search)).forEach(o=>_colFilterPending.add(o.key));
  renderColFilterList();
}

function colFilterClearAll(){
  const search=(document.getElementById('col-filter-search').value||'').toLowerCase();
  _colFilterOptions.filter(o=>!search||o.label.toLowerCase().includes(search)).forEach(o=>_colFilterPending.delete(o.key));
  renderColFilterList();
}

function applyColFilter(){
  if(!_colFilterField)return;
  const field=_colFilterField;
  const total=_colFilterOptions.length;
  columnFilters[field]=(_colFilterPending.size>=total)?null:new Set(_colFilterPending);
  updateColFilterTriggerStates();
  closeColFilter();
  renderSurveyTableFiltered();
  renderAgentPillRow();
}

function renderSurveyTableFiltered(){
  lastCheckedIdx=null;
  _selectedSurveyIdx=null;
  const surveys=getPeriod(activePeriodKey).surveys;
  const tbody=document.getElementById('survey-tbody');
  tbody.innerHTML='';
  const dupIdxs=findDuplicates(surveys);
  const{lowCsat}=tableFilterActive;
  let shown=0,total=surveys.length;
  surveys.forEach((sv,i)=>{
    const agentMatch=!columnFilters.agent||columnFilters.agent.has(colFilterKey('agent',sv));
    const dateMatch=!columnFilters.date||columnFilters.date.has(colFilterKey('date',sv));
    const arMatch=!columnFilters.ar||columnFilters.ar.has(colFilterKey('ar',sv));
    const hasCsat=sv.csat!==null&&!isNaN(sv.csat);
    const csatColMatch=!columnFilters.csat||columnFilters.csat.has(colFilterKey('csat',sv));
    const csatMatch=(!lowCsat||(hasCsat&&sv.csat<=4))&&csatColMatch;
    if(!agentMatch||!dateMatch||!arMatch||!csatMatch)return;
    shown++;
    const arCls=sv.ar==='yes'?'ar-yes':sv.ar==='no'?'ar-no':'ar-none';
    const arTxt=sv.ar==='yes'?'YES':sv.ar==='no'?'NO':'—';
    const fmtScore=(v)=>{if(v===null||v===undefined||isNaN(v))return '<span style="color:var(--text-muted)">—</span>';const s=v.toFixed(2);const red=v<5?'color:#ef4444;font-weight:600':'';return '<span style="'+red+'">'+s+'</span>';};
    const tr=document.createElement('tr');
    if(dupIdxs.has(i))tr.className='dup-row';
    tr.dataset.idx=i;
    tr.style.cursor='pointer';
    let _trDragging=false;
    tr.addEventListener('mousedown',()=>{_trDragging=false;});
    tr.addEventListener('mousemove',()=>{_trDragging=true;});
    tr.onclick=(e)=>{if(_trDragging)return;if(e.target.closest('button,input'))return;surveySelectRow(i,tr,e.shiftKey);};
    tr.innerHTML=`<td class="check-col"><input type="checkbox" class="row-cb" data-idx="${i}" data-action="handleRowCb(this,${i},event)" title="Click · Shift+click to select range"></td>
      <td>${i+1}</td><td>${escHtml(sv.agent)}</td><td>${escHtml(sv.id)}</td><td>${escHtml(sv.channel)}</td>
      <td>${fmtScore(sv.q1)}</td><td>${fmtScore(sv.q2)}</td><td>${fmtScore(sv.csat)}</td>
      <td class="${arCls}">${arTxt}</td><td>${escHtml(sv.date)}</td>
      <td style="display:flex;gap:4px;align-items:center">
        <button class="icon-btn" title="Edit" data-action="openEditRow(${i})"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="icon-btn danger" title="Delete" data-action="deleteRow(${i})"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg></button>
      </td>`;
    tbody.appendChild(tr);
  });
  const fc=document.getElementById('filter-count');
  if(fc){
    const isFiltered=columnFilters.agent||columnFilters.date||columnFilters.ar||columnFilters.csat||lowCsat;
    fc.textContent=isFiltered?(shown+' of '+total+' shown'):'';
  }
  updateBulkBar();
}

// ── 6. DUPLICATE CLEANER ──────────────────────────────────────
function cleanAllDuplicates(){
  const p=getPeriod(activePeriodKey);
  const dupIdxs=findDuplicates(p.surveys);
  if(dupIdxs.size===0){showToast('No duplicates found');return;}
  const backup=[...p.surveys];
  // Keep only the FIRST occurrence of each dup key
  const seen={};
  const toRemove=new Set();
  p.surveys.forEach((sv,i)=>{
    if(!sv.id||sv.id.trim().toUpperCase()==='NOT_SET')return;
    const key=sv.id+'|'+sv.date;
    if(seen[key]!==undefined)toRemove.add(i);
    else seen[key]=i;
  });
  p.surveys=p.surveys.filter((_,i)=>!toRemove.has(i));
  saveState();renderDashboard();renderSurveyTable();
  undoState.surveys=backup;undoState.key=activePeriodKey;
  showUndoToast(toRemove.size);
  showToast(toRemove.size+' duplicate'+(toRemove.size!==1?'s':'')+' removed');
}

// ── Hook renderSurveyTable to use filtered render and check badges ──────────
const _origRenderSurveyTable=renderSurveyTable;
renderSurveyTable=function(){
  _origRenderSurveyTable();
  // After original renders, re-apply filter
  const isFiltered=columnFilters.agent||columnFilters.date||columnFilters.ar||columnFilters.csat||tableFilterActive.lowCsat;
  if(isFiltered)renderSurveyTableFiltered();
  // Restore lowCsat button visual state
  const btn=document.getElementById('low-csat-btn');
  if(btn&&tableFilterActive.lowCsat){
    btn.style.background='rgba(239,68,68,0.15)';
    btn.style.color='#f87171';
    btn.style.borderColor='rgba(239,68,68,0.3)';
  }
  // Show/hide dup cleaner button
  const surveys=getPeriod(activePeriodKey).surveys;
  const dupIdxs=findDuplicates(surveys);
  const dupBtn=document.getElementById('dup-clean-btn');
  if(dupBtn)dupBtn.style.display=dupIdxs.size>0?'inline-flex':'none';
};

// ── Hook renderDashboard to add forecast + kpi sparkline ───────────
const _origRenderDashboard=renderDashboard;
renderDashboard=function(){
  _origRenderDashboard();
  const surveys=getPeriod(activePeriodKey).surveys;
  const ahtSec=getPeriod(activePeriodKey).aht||0;
  renderForecast(surveys);
  renderKPISparkline();
  renderYTDStrip();
  renderEOMProjections(surveys);
  renderDailyAHTList();
  renderAHTImportedTable();
  renderDayLookup();
};

// ── Active period widget (sidebar) — collapsible, collapsed by default ──────
let _activePeriodCollapsed=(function(){try{const v=localStorage.getItem('kpi_apcollapsed');return v===null?true:v==='1';}catch(e){return true;}})();
function applyActivePeriodCollapse(){
  const body=document.getElementById('active-period-body');
  const chevron=document.getElementById('active-period-chevron');
  const btn=document.getElementById('active-period-toggle');
  if(body)body.style.display=_activePeriodCollapsed?'none':'block';
  if(chevron)chevron.style.transform=_activePeriodCollapsed?'rotate(-90deg)':'rotate(0deg)';
  if(btn)btn.title=_activePeriodCollapsed?'Expand':'Collapse';
}
function toggleActivePeriodCollapsed(){
  _activePeriodCollapsed=!_activePeriodCollapsed;
  try{localStorage.setItem('kpi_apcollapsed',_activePeriodCollapsed?'1':'0');}catch(e){}
  applyActivePeriodCollapse();
}

// ── Dashboard strip visibility (Settings → General) ─────────────────────────
// Lets Jon hide the Daily Avg strip and/or the Month Forecast strip from the
// dashboard entirely. Persisted, and the render functions in app-01/app-03
// check these flags on every render so the setting sticks across period
// changes and re-renders.
let _showDailyAvgStrip=(function(){try{const v=localStorage.getItem('kpi_show_dailyavg');return v===null?false:v==='1';}catch(e){return false;}})();
let _showForecastStrip=(function(){try{const v=localStorage.getItem('kpi_show_forecast');return v===null?false:v==='1';}catch(e){return false;}})();
let _showYTDStrip=(function(){try{const v=localStorage.getItem('kpi_show_ytd');return v===null?false:v==='1';}catch(e){return false;}})();
let _showReflectionPanel=(function(){try{const v=localStorage.getItem('kpi_show_reflection');return v===null?false:v==='1';}catch(e){return false;}})();
function toggleDailyAvgStrip(){
  _showDailyAvgStrip=!_showDailyAvgStrip;
  try{localStorage.setItem('kpi_show_dailyavg',_showDailyAvgStrip?'1':'0');}catch(e){}
  const el=document.getElementById('daily-avg-strip');
  if(el)el.style.display=_showDailyAvgStrip?'':'none';
}
function toggleForecastStrip(){
  _showForecastStrip=!_showForecastStrip;
  try{localStorage.setItem('kpi_show_forecast',_showForecastStrip?'1':'0');}catch(e){}
  const el=document.getElementById('forecast-strip');
  if(el)el.style.display=_showForecastStrip?'flex':'none';
}
function toggleYTDStrip(){
  _showYTDStrip=!_showYTDStrip;
  try{localStorage.setItem('kpi_show_ytd',_showYTDStrip?'1':'0');}catch(e){}
  if(_showYTDStrip)renderYTDStrip();
  else{const el=document.getElementById('ytd-strip');if(el)el.style.display='none';}
}
function toggleReflectionPanel(){
  _showReflectionPanel=!_showReflectionPanel;
  try{localStorage.setItem('kpi_show_reflection',_showReflectionPanel?'1':'0');}catch(e){}
  const el=document.getElementById('reflection-panel');
  if(el)el.style.display=_showReflectionPanel?'':'none';
  // Fill the panel the moment it's switched on. Before, it was only filled once at
  // startup (while the panel was still hidden), so turning it on in Settings
  // showed an empty box — just the title — until the app was reopened.
  if(_showReflectionPanel){try{renderReflection();}catch(e){}}
}
function renderSettingsPage(){
  const davgCb=document.getElementById('settings-toggle-dailyavg');
  if(davgCb)davgCb.checked=_showDailyAvgStrip;
  const fcCb=document.getElementById('settings-toggle-forecast');
  if(fcCb)fcCb.checked=_showForecastStrip;
  const ytdCb=document.getElementById('settings-toggle-ytd');
  if(ytdCb)ytdCb.checked=_showYTDStrip;
  const reflCb=document.getElementById('settings-toggle-reflection');
  if(reflCb)reflCb.checked=_showReflectionPanel;
  try{_secRefreshUI();}catch(e){}
  try{renderCustomMetricsSettings();}catch(e){}
}

// ── Day Lookup widget (sidebar) ──────────────────────────────────────────────
// Lets Jon jump to any day of any month (including past periods) and see the
// running month-to-date score through that day — AHT / CSAT / Survey count /
// AR / KPI — without scrolling the daily grid or switching the whole dashboard.
const DAY_LOOKUP_WEEKDAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
let _dayLookupPeriodKey=null;
let _dayLookupSelectedDk=null;
// Collapsed by default. Once the user has explicitly expanded/collapsed it,
// their choice (stored in kpi_dlcollapsed) is remembered from then on.
let _dayLookupCollapsed=(function(){try{const v=localStorage.getItem('kpi_dlcollapsed');return v===null?true:v==='1';}catch(e){return true;}})();
function toggleDayLookupCollapsed(){
  _dayLookupCollapsed=!_dayLookupCollapsed;
  try{localStorage.setItem('kpi_dlcollapsed',_dayLookupCollapsed?'1':'0');}catch(e){}
  renderDayLookup();
}

function dayLookupAllDayKeys(periodKey){
  const [y,m]=periodKey.split('-').map(Number);
  const count=new Date(y,m,0).getDate();
  const keys=[];
  for(let d=1;d<=count;d++)keys.push(y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0'));
  return keys;
}
function dayLookupDaysWithData(periodKey){
  const p=getPeriod(periodKey);
  const days={};
  (p.surveys||[]).forEach(sv=>{const dk=parseDateKey(sv.date);if(dk)days[dk]=true;});
  const dailyAHTMap=getTileDailyAHTMap(p);
  Object.keys(dailyAHTMap).forEach(dk=>{
    const sec=dailyAHTMap[dk]?normAHTEntry(dailyAHTMap[dk]).aht||0:0;
    if(sec>0)days[dk]=true;
  });
  return Object.keys(days).sort();
}
function dayLookupLabel(dk){
  const parts=dk.split('-');
  const d=new Date(dk+'T00:00:00');
  return DAY_LOOKUP_WEEKDAYS[d.getDay()]+' '+parseInt(parts[2],10);
}
function dayLookupDefaultDk(periodKey){
  const allDays=dayLookupAllDayKeys(periodKey);
  const [py,pm]=periodKey.split('-').map(Number);
  const now=new Date();
  const isCurrentMonth=now.getFullYear()===py&&(now.getMonth()+1)===pm;
  if(isCurrentMonth)return periodKey+'-'+String(now.getDate()).padStart(2,'0');
  const withData=dayLookupDaysWithData(periodKey);
  return withData.length?withData[withData.length-1]:allDays[0];
}
function dayLookupStats(periodKey,dk){
  // Running (month-to-date) score: everything from day 1 of the selected
  // period through the selected day, inclusive — not just that single day.
  const p=getPeriod(periodKey);
  const runSurveys=(p.surveys||[]).filter(s=>{const k=parseDateKey(s.date);return k&&k<=dk;});
  const csatS=runSurveys.filter(s=>s.csat!==null&&!isNaN(s.csat));
  const arAll=runSurveys.filter(s=>s.ar==='yes'||s.ar==='no');
  const arYes=runSurveys.filter(s=>s.ar==='yes').length;
  const csatAvg=csatS.length?calcCSAT(csatS):null;
  const arPct=arAll.length?arYes/arAll.length*100:null;
  // AHT: weighted average across each day's dailyAHT entry, day 1 through dk
  const dailyAHTMap=getTileDailyAHTMap(p);
  const runEntries=Object.keys(dailyAHTMap).filter(k=>k<=dk).map(k=>normAHTEntry(dailyAHTMap[k])).filter(e=>e.aht>0);
  let ahtSec=null;
  if(runEntries.length){
    const hasW=runEntries.some(e=>e.count>0);
    ahtSec=hasW
      ?Math.round(runEntries.reduce((a,e)=>a+e.aht*(e.count||1),0)/runEntries.reduce((a,e)=>a+(e.count||1),0))
      :Math.round(runEntries.reduce((a,e)=>a+e.aht,0)/runEntries.length);
  }
  // Grade against the thresholds that actually applied to THAT period (an
  // older month may have its own custom threshold overrides), not whatever
  // period the main dashboard currently has active.
  const th=getThresholdsForPeriod(periodKey);
  const csatG=csatAvg!==null?gradeCSATWith(csatAvg,th.csat):null;
  const arG=arPct!==null?gradeARWith(arPct,th.ar):null;
  const ahtG=ahtSec!==null?gradeAHTWith(ahtSec,th.aht):null;
  const wc=csatG?(th.weights.csat[csatG.grade]||0):0;
  const wa=arG?(th.weights.ar[arG.grade]||0):0;
  const wh=ahtG?(th.weights.aht[ahtG.grade]||0):0;
  const runCustomPts=customMetricsPointsThrough(periodKey,dk);
  const kpiRaw=(csatAvg!==null||arPct!==null||ahtSec!==null||runCustomPts>0)?wc+wa+wh+runCustomPts:null;
  const kpiG=kpiRaw!==null?kpiScoreGrade(kpiRaw):null;
  return{csatAvg,arPct,ahtSec,surveyCount:runSurveys.length,csatG,arG,ahtG,kpiRaw,kpiG};
}
function dayLookupPeriods(){
  return Object.keys(state).sort().reverse();
}
function dayLookupPeriodSelect(pk){
  _dayLookupPeriodKey=pk;
  _dayLookupSelectedDk=dayLookupDefaultDk(pk);
  renderDayLookup();
}
function dayLookupNav(dir){
  const allDays=dayLookupAllDayKeys(_dayLookupPeriodKey);
  const idx=allDays.indexOf(_dayLookupSelectedDk);
  let newIdx=(idx<0?0:idx)+dir;
  newIdx=Math.max(0,Math.min(allDays.length-1,newIdx));
  _dayLookupSelectedDk=allDays[newIdx];
  renderDayLookup();
}
function dayLookupSelect(dk){
  _dayLookupSelectedDk=dk;
  renderDayLookup();
}
function _dayLookupTodayKey(){
  const n=new Date();
  return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');
}
// ── Day Lookup: "running score" calendar popup ──────────────────────────────
// Instead of squeezing a mini-calendar into the sidebar, the calendar icon
// opens a popup showing every day of the month with that day's running
// (month-to-date) KPI score, so Jon can see the whole month's trajectory at
// a glance and click any day to jump the sidebar widget to it.
let _dlcalOpen=false;
function openDayLookupCalModal(){
  if(_dayLookupPeriodKey===null||!state[_dayLookupPeriodKey]){
    _dayLookupPeriodKey=activePeriodKey;
    _dayLookupSelectedDk=dayLookupDefaultDk(_dayLookupPeriodKey);
  }
  _dlcalOpen=true;
  const overlay=document.getElementById('dlcal-overlay');
  if(overlay)overlay.classList.add('open');
  renderDayLookupCalModal();
}
function closeDayLookupCalModal(){
  _dlcalOpen=false;
  const overlay=document.getElementById('dlcal-overlay');
  if(overlay)overlay.classList.remove('open');
}
function dlcalShiftMonth(dir){
  const periodsAsc=dayLookupPeriods().slice().reverse();
  const idx=periodsAsc.indexOf(_dayLookupPeriodKey);
  const newIdx=Math.max(0,Math.min(periodsAsc.length-1,(idx<0?0:idx)+dir));
  const newPk=periodsAsc[newIdx];
  if(!newPk||newPk===_dayLookupPeriodKey)return;
  _dayLookupPeriodKey=newPk;
  if(!_dayLookupSelectedDk||_dayLookupSelectedDk.slice(0,7)!==newPk){
    _dayLookupSelectedDk=dayLookupDefaultDk(newPk);
  }
  renderDayLookupCalModal();
}
function dayLookupSelectFromModal(dk){
  _dayLookupSelectedDk=dk;
  closeDayLookupCalModal();
  renderDayLookup();
}
function renderDayLookupCalModal(){
  const pk=_dayLookupPeriodKey;
  const dk=_dayLookupSelectedDk;
  const [y,m]=pk.split('-').map(Number);
  const titleEl=document.getElementById('dlcal-modal-title');
  if(titleEl)titleEl.textContent='Running score (MTD)';
  const periodLblEl=document.getElementById('dlcal-period-label');
  if(periodLblEl)periodLblEl.textContent=periodLabel(m,y);
  const periodsAsc=dayLookupPeriods().slice().reverse();
  const idx=periodsAsc.indexOf(pk);
  const prevBtn=document.getElementById('dlcal-prev-btn');
  const nextBtn=document.getElementById('dlcal-next-btn');
  if(prevBtn)prevBtn.disabled=idx<=0;
  if(nextBtn)nextBtn.disabled=idx<0||idx>=periodsAsc.length-1;

  const gridEl=document.getElementById('dlcal-grid');
  if(!gridEl)return;
  const daysInMonth=new Date(y,m,0).getDate();
  const firstDay=new Date(y,m-1,1).getDay();
  const todayKey=_dayLookupTodayKey();
  let html='';
  DAY_LOOKUP_WEEKDAYS.forEach(d=>html+=`<div class="dlcal-dow">${d[0]}</div>`);
  const totalCells=firstDay+daysInMonth;
  const numWeeks=Math.ceil(totalCells/7);
  for(let i=0;i<numWeeks*7;i++){
    const dayNum=i-firstDay+1;
    if(dayNum<1||dayNum>daysInMonth){html+='<div class="dlcal-daycell dlcal-empty"></div>';continue;}
    const cellDk=y+'-'+String(m).padStart(2,'0')+'-'+String(dayNum).padStart(2,'0');
    const isSelected=cellDk===dk;
    const isToday=cellDk===todayKey;
    const isFuture=cellDk>todayKey;
    // Days that haven't happened yet have no running score to show — a
    // "running total" carried forward past today would just be reprinting
    // today's number under a date that hasn't occurred, which is misleading.
    if(isFuture){
      const tip=(dayLookupLabel(cellDk)+': upcoming — no data yet').replace(/"/g,'&quot;');
      html+=`<div class="dlcal-daycell dlcal-nodata dlcal-future${isSelected?' dlcal-selected':''}" title="${tip}">
        <span class="dlcal-daynum">${dayNum}</span>
        <span class="dlcal-dayscore">—</span>
      </div>`;
      continue;
    }
    const stats=dayLookupStats(pk,cellDk);
    const gradeCls=stats.kpiG?stats.kpiG.cls:'';
    const scoreText=stats.kpiG?stats.kpiRaw.toFixed(1)+'%':'—';
    const tipParts=[dayLookupLabel(cellDk)+':'];
    tipParts.push(stats.kpiG?`KPI ${stats.kpiRaw.toFixed(2)}% (${stats.kpiG.grade})`:'no running data yet');
    tipParts.push(`Surveys ${stats.surveyCount}`);
    if(stats.csatG)tipParts.push(`CSAT ${fmtCsat(stats.csatAvg)}`);
    if(stats.arG)tipParts.push(`AR ${stats.arPct.toFixed(1)}%`);
    if(stats.ahtG)tipParts.push(`AHT ${fmtSec(stats.ahtSec)}`);
    const tip=tipParts.join(' · ').replace(/"/g,'&quot;');
    html+=`<div class="dlcal-daycell ${gradeCls||'dlcal-nodata'}${isSelected?' dlcal-selected':''}${isToday?' dlcal-today':''}" data-ph-click="dayLookupSelectFromModal('${cellDk}')" title="${tip}">
      <span class="dlcal-daynum">${dayNum}</span>
      <span class="dlcal-dayscore">${scoreText}</span>
    </div>`;
  }
  gridEl.innerHTML=html;
}
function renderDayLookup(){
  const container=document.getElementById('day-lookup-widget');
  if(!container||!activePeriodKey)return;
  // Initialize once to the dashboard's active period; after that the widget's
  // period is independent so Jon can browse previous months without changing
  // the main dashboard filter.
  if(_dayLookupPeriodKey===null||!state[_dayLookupPeriodKey]){
    _dayLookupPeriodKey=activePeriodKey;
    _dayLookupSelectedDk=dayLookupDefaultDk(_dayLookupPeriodKey);
  }
  const pk=_dayLookupPeriodKey;
  const allDays=dayLookupAllDayKeys(pk);
  if(!_dayLookupSelectedDk||!allDays.includes(_dayLookupSelectedDk))_dayLookupSelectedDk=allDays[allDays.length-1];
  const dk=_dayLookupSelectedDk;
  const stats=dayLookupStats(pk,dk);
  const idx=allDays.indexOf(dk);
  const hasPrev=idx>0,hasNext=idx<allDays.length-1;

  const ahtHTML=stats.ahtG
    ?`<span class="day-score-val ${stats.ahtG.gcls}">${fmtSec(stats.ahtSec)}</span>`
    :`<span class="day-score-val" style="color:var(--text-muted)">—</span>`;
  const csatHTML=stats.csatG
    ?`<span class="day-score-val ${stats.csatG.gcls}">${fmtCsat(stats.csatAvg)}</span>`
    :`<span class="day-score-val" style="color:var(--text-muted)">—</span>`;
  const surveyHTML=`<span class="day-score-val" style="color:var(--text)">${stats.surveyCount}</span>`;
  const arHTML=stats.arG
    ?`<span class="day-score-val ${stats.arG.gcls}">${stats.arPct.toFixed(2)}%</span>`
    :`<span class="day-score-val" style="color:var(--text-muted)">—</span>`;
  const kpiHTML=stats.kpiG
    ?`<span class="day-score-val ${stats.kpiG.gcls}">${stats.kpiRaw.toFixed(2)}%</span>`
    :`<span class="day-score-val" style="color:var(--text-muted)">—</span>`;

  const [pkY,pkM]=pk.split('-').map(Number);
  const curPeriodLabel=periodLabel(pkM,pkY);
  const rangeLabel=fmtDayLabel(allDays[0])+' – '+fmtDayLabel(dk);
  const reelIconSvg='<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';

  const pickerHTML=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
      <button class="period-nav-btn" style="padding:5px 8px" data-ph-click="dayLookupNav(-1)" title="Previous day"${hasPrev?'':' disabled'}>
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <button type="button" class="active-period-trigger" style="flex:1;padding:6px 8px" data-ph-click="openDayPickerCal(this)" title="Click to pick a day"><span>${dayLookupLabel(dk)}</span>${reelIconSvg}</button>
      <button class="period-nav-btn" style="padding:5px 8px" data-ph-click="dayLookupNav(1)" title="Next day"${hasNext?'':' disabled'}>
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>`;

  const collapsed=_dayLookupCollapsed;
  const bodyHTML=`
    <button type="button" class="active-period-trigger" style="margin-bottom:6px" data-ph-click="openDayLookupPeriodPicker(this)" title="Click to spin to a month"><span>${curPeriodLabel}</span>${reelIconSvg}</button>
    ${pickerHTML}
    <div style="font-size:10px;color:var(--text-muted);margin-bottom:8px;font-family:var(--mono)">${rangeLabel}</div>
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:8px 10px;display:flex;flex-direction:column;gap:5px">
      <div class="day-score-row"><span class="day-score-key">Survey</span>${surveyHTML}</div>
      <div class="day-score-row"><span class="day-score-key">CSAT</span>${csatHTML}</div>
      <div class="day-score-row"><span class="day-score-key">AR</span>${arHTML}</div>
      <div class="day-score-row"><span class="day-score-key">AHT</span>${ahtHTML}</div>
      <div class="day-score-row" style="border-top:1px solid var(--border);padding-top:5px;margin-top:1px"><span class="day-score-key">KPI</span>${kpiHTML}</div>
    </div>
    <button class="new-period-btn" style="margin-top:8px" data-ph-click="switchToPeriod('${pk}');openDayDetail('${dk}')">View ${dayLookupLabel(dk)} day details</button>
  `;

  container.innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${collapsed?'0':'6px'}">
      <button class="period-nav-btn" style="padding:3px 6px;display:flex;align-items:center;gap:5px" data-ph-click="toggleDayLookupCollapsed()" title="${collapsed?'Expand':'Collapse'}">
        <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="transform:rotate(${collapsed?'-90deg':'0deg'});transition:transform .15s"><polyline points="6 9 12 15 18 9"/></svg>
        <span class="period-label" style="margin-bottom:0">Running score (MTD)</span>
      </button>
      <button class="period-nav-btn" style="padding:3px 6px" data-ph-click="openDayLookupCalModal()" title="Open calendar view">
        <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </button>
    </div>
    ${collapsed?'':bodyHTML}
  `;
}

// Keyboard hint in survey page import panel
(function addKeyboardHints(){
  window.addEventListener('DOMContentLoaded',()=>{});
  // Hint in survey input area added via console once rendered
})();



// ── Period prev/next navigation ──────────────────────────────
function shiftPeriod(delta){
  const [y,m]=activePeriodKey.split('-').map(Number);
  let nm=m+delta,ny=y;
  if(nm<1){nm=12;ny--;}
  if(nm>12){nm=1;ny++;}
  // Moving forward never goes past the real current month — there's no data
  // beyond "now", so the latest month is as far as the next arrow (or the
  // YTD strip's right-arrow key) will go. Backward navigation is unaffected.
  if(delta>0){
    const now=new Date();
    const curY=now.getFullYear(),curM=now.getMonth()+1;
    if(ny>curY||(ny===curY&&nm>curM))return;
  }
  // Clamp to what year-sel actually offers so we never land on a year with
  // no option (which would otherwise leave the <select> blank).
  const ySel=document.getElementById('year-sel');
  if(ySel&&ySel.options.length){
    const minY=Math.min(...Array.from(ySel.options).map(o=>parseInt(o.value)));
    const maxY=Math.max(...Array.from(ySel.options).map(o=>parseInt(o.value)));
    if(ny<minY||ny>maxY)return;
  }
  setActivePeriod(nm,ny);
}

(function init(){
  // Wait for chrome.storage.local shim to hydrate before initialising the app.
  // Falls back to immediate init if __storageReady is not present (plain HTML mode).
  function _doInit(){
    loadState();loadThresholds();loadTeamThresholds();loadCustomMetricDefs();initYearSelect();
    // Fold any duplicate agent-name variants (e.g. "jonathan.juarez" vs
    // "Jonathan Juarez") together automatically, so team tracking is never
    // split across two tiles for the same person.
    if(autoMergeDuplicateAgentNames().length)saveState();
    // Backfill the legacy personal AHT log into the "Jonathan Juarez" team
    // tracking entry, so old imported data shows up in Team View too.
    autoMigratePersonalAHTLog();
    // Note: applyActivePeriodThresholds() is called inside setActivePeriod which runs below
    // Restore theme
    const savedTheme=localStorage.getItem('kpi_theme')||'dark';
    const _t0=(typeof _resolveAutoTheme==='function')?_resolveAutoTheme(savedTheme):savedTheme;
    _applyTheme(_t0);
    updateThemeLabel(_t0);
    // Restore persisted forecast window (must happen after storage-shim hydration;
    // reading this at module scope in app-03 would race chrome.storage.local.get).
    try{
      const v=parseInt(localStorage.getItem('kpi_fcwindow')||'7');
      fcWindow=[3,5,7].includes(v)?v:7;
    }catch(e){}
    // Restore fcWindow button active state
    [3,5,7].forEach(v=>{
      const btn=document.getElementById('fcw-'+v);
      if(btn) btn.classList.toggle('active',v===fcWindow);
    });
    // Re-sync sidebar/strip visibility prefs read at module scope (which can
    // race chrome.storage.local hydration) now that hydration is done.
    try{const v=localStorage.getItem('kpi_apcollapsed');_activePeriodCollapsed=v===null?true:v==='1';}catch(e){}
    applyActivePeriodCollapse();
    try{const v=localStorage.getItem('kpi_show_dailyavg');_showDailyAvgStrip=v===null?false:v==='1';}catch(e){}
    try{const v=localStorage.getItem('kpi_show_forecast');_showForecastStrip=v===null?false:v==='1';}catch(e){}
    try{const v=localStorage.getItem('kpi_show_ytd');_showYTDStrip=v===null?false:v==='1';}catch(e){}
    try{const v=localStorage.getItem('kpi_show_reflection');_showReflectionPanel=v===null?false:v==='1';}catch(e){}
    const davgEl=document.getElementById('daily-avg-strip');
    if(davgEl)davgEl.style.display=_showDailyAvgStrip?'':'none';
    const now=new Date();
    setActivePeriod(now.getMonth()+1,now.getFullYear());
    try{renderReflection();}catch(e){}
    renderAHTThresh(computeAHTSec());
    try{renderReflection();}catch(e){}
  }
  if(window.__storageReady){
    window.__storageReady.then(_doInit);
  } else {
    _doInit();
  }
})();
function openAboutModal(){
  try{const v='v'+chrome.runtime.getManifest().version;['about-ver','about-ver2'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=v;});}catch(e){}
  document.getElementById('about-modal').classList.add('open');
}
document.getElementById('about-modal').addEventListener('click',function(e){
  if(e.target===this)this.classList.remove('open');
});

// ── Security settings modal ─────────────────────────────────────────────────
// Password protection is fully optional: the slider turns it on/off, and
// turning it on requires setting a password on the spot. Nothing is ever
// stored except the SHA-256 hash of whatever password the user chooses.
function _secRefreshUI(){
  const on=window.kpiSecurityIsEnabled&&window.kpiSecurityIsEnabled();
  const toggle=document.getElementById('sec-toggle');
  const status=document.getElementById('sec-status-text');
  const settingsStatus=document.getElementById('settings-sec-status-text');
  const fields=document.getElementById('sec-password-fields');
  const saveBtn=document.getElementById('sec-save-btn');
  if(toggle)toggle.checked=on;
  if(status)status.textContent=on
    ?'On — a password is required to open Progress Hub.'
    :'Off — anyone can open Progress Hub.';
  if(settingsStatus)settingsStatus.textContent=on
    ?'On — a password is required to open Progress Hub.'
    :'Off — anyone can open Progress Hub.';
  // Fields only show while actively setting/changing a password.
  if(fields)fields.style.display='none';
  if(saveBtn)saveBtn.style.display='none';
  const err=document.getElementById('sec-error');
  if(err)err.textContent='';
  const pw1=document.getElementById('sec-pw1'),pw2=document.getElementById('sec-pw2');
  if(pw1)pw1.value='';
  if(pw2)pw2.value='';
  // If already protected, offer a "change password" link instead of forcing entry.
  const changeBtn=document.getElementById('sec-change-btn');
  if(changeBtn)changeBtn.style.display=on?'':'none';
  // Opt-in: include the password hash in "Export JSON (all periods)" (only meaningful while protection is on)
  const bRow=document.getElementById('sec-backup-row'),bTog=document.getElementById('sec-backup-toggle');
  if(bRow)bRow.style.display=on?'':'none';
  if(bTog){try{bTog.checked=localStorage.getItem('kpi_sec_in_backup')==='1';}catch(e){bTog.checked=false;}}
}
function securityBackupToggle(on){
  if(on&&!confirm('Include your password hash in full backups?\n\nAnyone who gets the backup file could try to guess a weak password offline. Only turn this on if you keep your backup files private.')){
    _secRefreshUI();return;
  }
  try{if(on)localStorage.setItem('kpi_sec_in_backup','1');else localStorage.removeItem('kpi_sec_in_backup');}catch(e){}
  _secRefreshUI();
  showToast&&showToast(on?'Full backups will include your password':'Full backups will not include your password');
}
function openSecurityModal(){
  _secRefreshUI();
  document.getElementById('security-modal').classList.add('open');
}
function closeSecurityModal(){
  document.getElementById('security-modal').classList.remove('open');
}
document.getElementById('security-modal').addEventListener('click',function(e){
  if(e.target===this)closeSecurityModal();
});
function securityShowPasswordFields(){
  const fields=document.getElementById('sec-password-fields');
  const saveBtn=document.getElementById('sec-save-btn');
  if(fields)fields.style.display='';
  if(saveBtn)saveBtn.style.display='';
  const pw1=document.getElementById('sec-pw1');
  if(pw1)setTimeout(()=>pw1.focus(),50);
}
function securityToggleChange(checked){
  const wasOn=window.kpiSecurityIsEnabled&&window.kpiSecurityIsEnabled();
  if(checked){
    // Turning on: reveal the password fields, but don't actually enable
    // protection until a password is set and saved below.
    if(!wasOn)securityShowPasswordFields();
  } else {
    if(wasOn){
      if(!confirm('Turn off password protection? Anyone will be able to open Progress Hub without a password.')){
        _secRefreshUI();
        return;
      }
      window.kpiSecurityDisable&&window.kpiSecurityDisable();
      try{localStorage.removeItem('kpi_sec_in_backup');}catch(e){}
      showToast&&showToast('Password protection turned off');
    }
    _secRefreshUI();
  }
}
async function securitySavePassword(){
  const pw1=document.getElementById('sec-pw1'),pw2=document.getElementById('sec-pw2');
  const err=document.getElementById('sec-error');
  const v1=pw1?pw1.value:'',v2=pw2?pw2.value:'';
  if(!v1||v1.length<4){if(err)err.textContent='Password must be at least 4 characters.';return;}
  if(v1!==v2){if(err)err.textContent='Passwords don\'t match.';return;}
  const hash=await window.kpiSecuritySha256(v1);
  window.kpiSecuritySetPassword&&window.kpiSecuritySetPassword(hash);
  _secRefreshUI();
  showToast&&showToast('Password protection turned on');
}

// ── v16: Animated number counter ────────────────────────────────────────────
function animateCount(el,targetStr,duration=600){
  // Only animate if el contains a number-like value
  const match=targetStr.match(/^([\d.]+)(%?)(\w*)$/);
  if(!match){el.textContent=targetStr;return;}
  const [,numStr,suffix1,suffix2]=match;
  const target=parseFloat(numStr);
  const decimals=(numStr.includes('.'))?numStr.split('.')[1].length:0;
  const start=performance.now();
  const easeOut=t=>1-Math.pow(1-t,3);
  function step(now){
    const progress=Math.min((now-start)/duration,1);
    const current=target*easeOut(progress);
    el.textContent=current.toFixed(decimals)+suffix1+suffix2;
    if(progress<1)requestAnimationFrame(step);
    else el.textContent=targetStr;
  }
  requestAnimationFrame(step);
}

// ── v16: Apply counter animation on KPI value updates ───────────────────────
// Intercept DOM text updates on KPI values for smooth animation
const _origSetText=function(id,val){
  const el=document.getElementById(id);
  if(!el)return;
  // Only animate numbers, not placeholders
  if(val&&val!=='—'&&/[\d.]/.test(val)){
    animateCount(el,val,450);
  } else {
    el.textContent=val;
  }
};

// ── v16: Keyboard shortcut for new period ────────────────────────────────────
document.addEventListener('keydown',function(e){
  // Ctrl+N opens new period modal
  if(e.ctrlKey&&e.key==='n'&&!e.shiftKey&&!e.altKey){
    if(document.activeElement.tagName==='INPUT'||document.activeElement.tagName==='TEXTAREA')return;
    e.preventDefault();
    openNewPeriodModal();
  }
  // Number keys 1-6 for page navigation (when not in input)
  if(!e.ctrlKey&&!e.metaKey&&!e.altKey){
    const tag=document.activeElement.tagName;
    if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return;
    const pageMap={'1':'dashboard','2':'survey','3':'history','4':'weekly','5':'monthsummary'};
    if(pageMap[e.key]){e.preventDefault();showPage(pageMap[e.key]);}
  }
  // Ctrl+I focus import textarea
  if(e.ctrlKey&&e.key==='i'){
    const ta=document.getElementById('survey-input');
    if(ta){e.preventDefault();showPage('survey');setTimeout(()=>{ta.focus();},50);}
  }
});

// ── v16: Smooth page transitions ─────────────────────────────────────────────
const _v16OrigShowPage=showPage;
showPage=function(name){
  // Add fade class to main on page change
  const main=document.querySelector('.main');
  if(main){
    main.style.opacity='0.7';
    main.style.transform='translateY(2px)';
    main.style.transition='opacity .15s,transform .15s';
    setTimeout(()=>{
      main.style.opacity='';
      main.style.transform='';
      setTimeout(()=>{main.style.transition='';},160);
    },50);
  }
  _v16OrigShowPage(name);
};

// ── v16: Tooltip for nav items ────────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(btn=>{
  const label=btn.textContent.trim();
  if(label)btn.setAttribute('title',label);
});

console.log('%c Progress Hub %c Loaded ','background:#3b82f6;color:#fff;font-weight:700;border-radius:4px 0 0 4px;padding:2px 6px','background:#22c55e;color:#fff;font-weight:700;border-radius:0 4px 4px 0;padding:2px 6px');

// ── PASTE PREVIEW VALIDATOR ────────────────────────────────────────────────────
// Renders a live preview table beneath the import textarea so the user can
// catch parsing problems (missing IDs, bad dates, duplicate IDs) BEFORE import.

let _ppDebounce=null;

function renderPastePreview(){
  clearTimeout(_ppDebounce);
  _ppDebounce=setTimeout(_doPastePreview,120);
}

function _doPastePreview(){
  const raw=(document.getElementById('survey-input')||{}).value||'';
  const container=document.getElementById('paste-preview-container');
  if(!container)return;

  if(!raw.trim()){container.style.display='none';container.innerHTML='';return;}

  const format=surveyDetectFormat(raw);
  const rows=[];

  if(format==='block'){
    const parsed=surveyParseBlockFormat(raw);
    const blocks=surveyBlockSplitRecords(raw);
    // Add parsed rows
    parsed.forEach(r=>rows.push({...r,_parseOk:true}));
    // Add failed blocks as error rows
    const parsedCount=parsed.length;
    const failedCount=Math.max(0,blocks.length-parsedCount);
    for(let i=0;i<failedCount;i++){
      rows.push({agent:'—',queue:'—',id:'—',channel:'—',q1:null,q2:null,csat:null,ar:'none',date:'—',_parseOk:false,_blockFail:true});
    }
  } else {
    const lines=raw.split('\n').filter(l=>l.trim());
    lines.forEach(line=>{
      const cols=line.split('\t');
      if(cols.length<3){rows.push({agent:(cols[0]||'').trim(),queue:'',id:'',channel:'',q1:null,q2:null,csat:null,ar:'none',date:'',_parseOk:false,_tooFewCols:true});return;}
      const q1Raw=(cols[4]||'').trim();
      const q2Raw=(cols[5]||'').trim();
      const q1=q1Raw!==''?parseFloat(q1Raw):null;
      const q2=q2Raw!==''?parseFloat(q2Raw):null;
      const date=normalizeSurveyDate((cols[9]||cols[8]||'').trim());
      const csat=computeCSAT(q1,q2,date);
      const comment=(cols[6]||'').trim();
      let ar='none';
      if(comment.toLowerCase().startsWith('yes'))ar='yes';
      else if(comment.toLowerCase().startsWith('no'))ar='no';
      const id=(cols[2]||'').trim();
      rows.push({agent:(cols[0]||'').trim(),queue:(cols[1]||'').trim(),id,channel:(cols[3]||'').trim(),q1,q2,comment,csat,ar,date,_parseOk:true});
    });
  }

  if(!rows.length){container.style.display='none';container.innerHTML='';return;}

  // ── Flag issues per row ──────────────────────────────────────────────────────
  const existingById=new Map();
  (getPeriod(activePeriodKey).surveys||[]).forEach(sv=>{
    if(sv.id&&sv.id.trim().toUpperCase()!=='NOT_SET'&&!existingById.has(sv.id))existingById.set(sv.id,sv);
  });
  const existingIds={has:k=>existingById.has(k)};
  const seenInPaste=new Set();
  let okCount=0,warnCount=0,errCount=0;

  const annotatedRows=rows.map(row=>{
    const flags=[];
    let severity='ok'; // 'ok'|'warn'|'err'

    if(row._blockFail){
      flags.push({label:'parse failed',type:'err'});
      severity='err';errCount++;
      return{...row,flags,severity};
    }
    if(row._tooFewCols){
      flags.push({label:'too few columns',type:'err'});
      severity='err';errCount++;
      return{...row,flags,severity};
    }

    // Missing / suspicious interaction ID
    const isNoId=!row.id||row.id.trim().toUpperCase()==='NOT_SET'||row.id.trim()==='';
    if(isNoId){
      flags.push({label:'no interaction ID',type:'warn'});
      if(severity==='ok')severity='warn';
    }

    // Duplicate ID within paste
    if(!isNoId){
      if(seenInPaste.has(row.id)){
        flags.push({label:'dup in paste',type:'err'});
        severity='err';
      }
      seenInPaste.add(row.id);
    }

    // Already exists in current period
    if(!isNoId&&existingIds.has(row.id)){
      // Would this row fill in blanks (e.g. a Yes/No that arrived later)?
      const wouldFill=mergeSurveyGaps(JSON.parse(JSON.stringify(existingById.get(row.id))),row);
      flags.push(wouldFill?{label:'will update existing',type:'ok'}:{label:'already imported',type:'warn'});
      if(!wouldFill&&severity==='ok')severity='warn';
    }

    // Bad/missing date
    if(!row.date||!row.date.trim()){
      flags.push({label:'no date',type:'err'});
      severity='err';
    } else {
      const dk=parseDateKey(row.date);
      if(!dk){
        flags.push({label:'bad date format',type:'err'});
        severity='err';
      } else {
        // Check if date falls in the active or detected period
        const pk=dk.slice(0,7);
        if(pk!==activePeriodKey){
          flags.push({label:'diff period',type:'warn'});
          if(severity==='ok')severity='warn';
        }
      }
    }

    // Single-answer responses are valid now — label them, don't warn.
    const _hasQ1=row.q1!==null&&row.q1!==undefined&&!isNaN(row.q1);
    const _hasQ2=row.q2!==null&&row.q2!==undefined&&!isNaN(row.q2);
    if(_hasQ1!==_hasQ2&&row.csat!==null&&!isNaN(row.csat)){
      flags.push({label:_hasQ1?'Q1 only':'Q2 only',type:'ok'});
    }
    const _preAugSingle=_hasQ1!==_hasQ2&&(row.csat===null||isNaN(row.csat));
    if(_preAugSingle){
      flags.push({label:'1 rating — pre-Aug rule',type:'warn'});
      if(severity==='ok')severity='warn';
    }

    // Missing CSAT scores
    if(!_preAugSingle&&(row.csat===null||isNaN(row.csat))){
      flags.push({label:'no CSAT',type:'warn'});
      if(severity==='ok')severity='warn';
    } else if(row.csat<1||row.csat>5){
      flags.push({label:'CSAT out of range',type:'err'});
      severity='err';
    }

    if(severity==='ok')okCount++;
    else if(severity==='warn')warnCount++;
    else errCount++;

    return{...row,flags,severity};
  });

  // ── Build HTML ──────────────────────────────────────────────────────────────
  const totalCount=annotatedRows.length;
  const summaryBadges=[];
  if(okCount>0)summaryBadges.push(`<span class="paste-preview-badge ppb-ok">✓ ${okCount} OK</span>`);
  if(warnCount>0)summaryBadges.push(`<span class="paste-preview-badge ppb-warn">⚠ ${warnCount} warn</span>`);
  if(errCount>0)summaryBadges.push(`<span class="paste-preview-badge ppb-err">✕ ${errCount} error${errCount!==1?'s':''}</span>`);

  const truncated=annotatedRows.length>50;
  const displayRows=truncated?annotatedRows.slice(0,50):annotatedRows;

  const rowsHTML=displayRows.map(row=>{
    const rowCls=row.severity==='err'?'pp-row-err':row.severity==='warn'?'pp-row-warn':'pp-row-ok';
    const flagsHTML=row.flags.length
      ?row.flags.map(f=>`<span class="pp-flag pp-flag-${f.type}">${f.label}</span>`).join(' ')
      :'<span class="pp-flag pp-flag-ok">✓</span>';
    const csatStr=row.csat!==null&&!isNaN(row.csat)?fmtCsat(row.csat):'—';
    const arStr=row.ar==='yes'?'YES':row.ar==='no'?'NO':'—';
    const idDisplay=row.id&&row.id!=='—'?row.id:'<span style="color:var(--text-muted);font-style:italic">—</span>';
    const dateDisplay=row.date&&row.date!=='—'?row.date:'<span style="color:var(--text-muted);font-style:italic">—</span>';
    const agentDisplay=row.agent||'<span style="color:var(--text-muted);font-style:italic">—</span>';
    return`<tr class="${rowCls}">
      <td style="color:var(--text-dim)">${agentDisplay}</td>
      <td>${idDisplay}</td>
      <td style="color:var(--text-muted)">${dateDisplay}</td>
      <td>${csatStr!=='—'?`<span style="color:${parseFloat(csatStr)<4?'var(--red)':parseFloat(csatStr)<4.5?'var(--amber)':'var(--green)'};font-weight:600">${csatStr}</span>`:'<span style="color:var(--text-muted)">—</span>'}</td>
      <td style="color:${row.ar==='yes'?'var(--green)':row.ar==='no'?'var(--red)':'var(--text-muted)'}">${arStr}</td>
      <td>${flagsHTML}</td>
    </tr>`;
  }).join('');

  const footerMsg=truncated
    ?`Showing first 50 of ${totalCount} rows — fix errors above before importing`
    :`${totalCount} row${totalCount!==1?'s':''} parsed`;

  const importBtnLabel=errCount>0
    ?`<span style="color:var(--red)">${errCount} error${errCount!==1?'s':''} detected — check before importing</span>`
    :warnCount>0
      ?`<span style="color:var(--amber)">${warnCount} warning${warnCount!==1?'s':''} — review highlighted rows</span>`
      :`<span style="color:var(--green)">All rows look good</span>`;

  container.style.display='block';
  container.innerHTML=`<div class="paste-preview-wrap">
    <div class="paste-preview-header">
      <div class="paste-preview-header-left">
        <span>Preview</span>
        ${summaryBadges.join('')}
      </div>
      <span style="font-size:10px;opacity:.7;font-family:var(--mono)">${format==='block'?'block format':'tab-separated'}</span>
    </div>
    <div class="paste-preview-table-wrap">
      <table class="paste-preview-table">
        <thead>
          <tr>
            <th>Agent</th><th>Interaction ID</th><th>Date</th>
            <th>CSAT</th><th>AR</th><th>Flags</th>
          </tr>
        </thead>
        <tbody>${rowsHTML}</tbody>
      </table>
    </div>
    <div class="paste-preview-footer">
      <span>${importBtnLabel}</span>
      <span style="font-family:var(--mono)">${footerMsg}</span>
    </div>
  </div>`;
}

// Clear preview when input is cleared
const _origClearSurveyInput=clearSurveyInput;
clearSurveyInput=function(){
  _origClearSurveyInput();
  const c=document.getElementById('paste-preview-container');
  if(c){c.style.display='none';c.innerHTML='';}
};

// Also clear preview after successful import
const _origParseSurvey=parseSurvey;
parseSurvey=function(){
  _origParseSurvey();
  const c=document.getElementById('paste-preview-container');
  if(c){c.style.display='none';c.innerHTML='';}
};

// ── BACKUP NUDGE / AUTO-EXPORT REMINDER ────────────────────────────────────────
// Tracks when the user last exported JSON and nudges them if it's been too long.
// Threshold: nudge after 7 days without a backup (if there's meaningful data).
// Dismissed nudges snooze for 2 days.

const BACKUP_NUDGE_THRESHOLD_DAYS=7;   // show nudge after this many days
const BACKUP_NUDGE_SNOOZE_DAYS=2;      // snooze duration when dismissed

function getLastBackupTs(){
  try{return parseInt(localStorage.getItem('kpi_last_backup_ts')||'0');}catch(e){return 0;}
}
function setLastBackupTs(){
  try{localStorage.setItem('kpi_last_backup_ts',Date.now().toString());}catch(e){}
}
function getNudgeSnoozedUntil(){
  try{return parseInt(localStorage.getItem('kpi_nudge_snoozed_until')||'0');}catch(e){return 0;}
}
function setNudgeSnoozedUntil(ts){
  try{localStorage.setItem('kpi_nudge_snoozed_until',ts.toString());}catch(e){}
}

function hasMeaningfulData(){
  // Only nudge if there's at least one period with real surveys
  return Object.values(state).some(p=>(p.surveys||[]).length>0);
}

function checkBackupNudge(){
  const nudgeEl=document.getElementById('backup-nudge');
  if(!nudgeEl)return;

  if(!hasMeaningfulData()){nudgeEl.classList.remove('show');return;}

  const now=Date.now();
  const snoozedUntil=getNudgeSnoozedUntil();
  if(snoozedUntil&&now<snoozedUntil){nudgeEl.classList.remove('show');return;}

  const lastBackup=getLastBackupTs();
  if(!lastBackup){
    // Never backed up — show nudge after 3 days of having data
    // (give them a grace period to discover the feature)
    nudgeEl.classList.remove('show');
    return;
  }

  const daysSince=Math.floor((now-lastBackup)/(1000*60*60*24));
  if(daysSince>=BACKUP_NUDGE_THRESHOLD_DAYS){
    const msgEl=document.getElementById('backup-nudge-msg');
    if(msgEl){
      if(daysSince>=30)msgEl.textContent=`Last backup was over a month ago!`;
      else if(daysSince>=14)msgEl.textContent=`Last backup was ${daysSince} days ago.`;
      else msgEl.textContent=`Last backup was ${daysSince} day${daysSince!==1?'s':''} ago.`;
    }
    nudgeEl.classList.add('show');
  } else {
    nudgeEl.classList.remove('show');
  }
}

function dismissBackupNudge(){
  const nudgeEl=document.getElementById('backup-nudge');
  if(nudgeEl)nudgeEl.classList.remove('show');
  // Snooze for 2 days
  setNudgeSnoozedUntil(Date.now()+(BACKUP_NUDGE_SNOOZE_DAYS*24*60*60*1000));
}

function exportJSONAndAcknowledge(){
  exportJSON();
  setLastBackupTs();
  // Clear snooze since we just backed up
  try{localStorage.removeItem('kpi_nudge_snoozed_until');}catch(e){}
  const nudgeEl=document.getElementById('backup-nudge');
  if(nudgeEl)nudgeEl.classList.remove('show');
  showToast('✓ Backup exported — you\'re covered!');
}

// Hook the existing exportJSON to also record the timestamp
const _origExportJSON=exportJSON;
exportJSON=function(){
  _origExportJSON();
  setLastBackupTs();
  try{localStorage.removeItem('kpi_nudge_snoozed_until');}catch(e){}
};

// Show nudge when the survey page is visible
const _backupOrigShowPage=showPage;
showPage=function(name){
  _backupOrigShowPage(name);
  if(name==='survey')checkBackupNudge();
};

// Also check on init after a short delay (user may have landed on survey page)
setTimeout(()=>{
  if(document.getElementById('page-survey')&&document.getElementById('page-survey').style.display!=='none'){
    checkBackupNudge();
  }
},800);


// ── Live Clock ────────────────────────────────────────────────────────────────
(function initClock(){
  const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];

  function getWeekNumber(d){
    const date=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
    const dayNum=date.getUTCDay()||7;
    date.setUTCDate(date.getUTCDate()+4-dayNum);
    const yearStart=new Date(Date.UTC(date.getUTCFullYear(),0,1));
    return Math.ceil((((date-yearStart)/86400000)+1)/7);
  }

  function getGreeting(h){
    if(h>=5&&h<12) return{text:'Good morning!',emoji:'☀️'};
    if(h>=12&&h<17) return{text:'Good afternoon!',emoji:'🌤️'};
    if(h>=17&&h<21) return{text:'Good evening!',emoji:'🌆'};
    return{text:'Burning the midnight oil?',emoji:'🌙'};
  }

  function pad(n){return String(n).padStart(2,'0');}

  let prevS=-1;
  function tick(){
    const now=new Date();
    const h=now.getHours(),m=now.getMinutes(),s=now.getSeconds();
    const h12=h%12||12;
    const ampm=h<12?'AM':'PM';
    const week=getWeekNumber(now);
    const dayName=DAYS[now.getDay()];
    const month=MONTHS[now.getMonth()];
    const date=now.getDate();
    const year=now.getFullYear();

    const eH=document.getElementById('clock-h');
    const eM=document.getElementById('clock-m');
    const eS=document.getElementById('clock-s');
    const eAmpm=document.getElementById('clock-ampm');
    const eDayName=document.getElementById('clock-dayname');
    const eDateFull=document.getElementById('clock-datefull');
    const eWeek=document.getElementById('clock-weekinfo');
    const eGreeting=document.getElementById('clock-greeting');
    const eEmoji=document.getElementById('clock-emoji');

    if(eH) eH.textContent=pad(h12);
    if(eM) eM.textContent=pad(m);
    if(eAmpm) eAmpm.textContent=ampm;

    // Seconds with small pop animation
    if(eS && s!==prevS){
      eS.textContent=pad(s);
      eS.style.transform='scale(1.25)';
      eS.style.color='var(--accent)';
      setTimeout(()=>{if(eS){eS.style.transform='scale(1)';eS.style.color='var(--text-muted)';}},120);
      prevS=s;
    }

    if(eDayName) eDayName.textContent=dayName;
    if(eDateFull) eDateFull.textContent=`${month} ${date}, ${year}`;
    if(eWeek) eWeek.textContent=`Week ${week} of ${year}`;

    const g=getGreeting(h);
    if(eGreeting) eGreeting.textContent=g.text;
    if(eEmoji) eEmoji.textContent=g.emoji;
  }

  tick();
  setInterval(tick,1000);
})();

// ── Lock screen ──────────────────────────────────────────────────────────────
// Password protection is opt-in and user-configured (see Security settings,
// nav-security). No password ships by default — nothing locks until the
// user turns protection on and sets one themselves.
(function(){
  const ENABLED_KEY='kpi_sec_enabled';
  const HASH_KEY='kpi_sec_hash';
  const SESSION_KEY='kpi_unlocked_session';
  const ATTEMPTS_KEY='kpi_lock_attempts';
  const LOCKOUT_KEY='kpi_lockout_until';
  const MAX_ATTEMPTS=5;
  const LOCKOUT_MS=5*60*1000; // 5 minutes

  async function sha256(str){
    const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  window.kpiSecuritySha256=sha256;

  function getHash(){try{return localStorage.getItem(HASH_KEY)||'';}catch(e){return '';}}
  function isEnabled(){try{return localStorage.getItem(ENABLED_KEY)==='1'&&!!getHash();}catch(e){return false;}}
  window.kpiSecurityIsEnabled=isEnabled;

  // Called from the Security settings panel once a new password is hashed.
  window.kpiSecuritySetPassword=function(hash){
    try{
      localStorage.setItem(HASH_KEY,hash);
      localStorage.setItem(ENABLED_KEY,'1');
      setAttempts(0);setLockout(0);
      sessionStorage.setItem(SESSION_KEY,'1'); // don't immediately lock the user out of their own session
    }catch(e){}
  };
  // Called from the Security settings panel when protection is turned off.
  window.kpiSecurityDisable=function(){
    try{
      localStorage.setItem(ENABLED_KEY,'0');
      localStorage.removeItem(HASH_KEY);
      setAttempts(0);setLockout(0);
      hideLock();
    }catch(e){}
  };

  function getAttempts(){try{return parseInt(localStorage.getItem(ATTEMPTS_KEY)||'0');}catch(e){return 0;}}
  function setAttempts(n){try{localStorage.setItem(ATTEMPTS_KEY,String(n));}catch(e){}}
  function getLockout(){try{return parseInt(localStorage.getItem(LOCKOUT_KEY)||'0');}catch(e){return 0;}}
  function setLockout(ts){try{localStorage.setItem(LOCKOUT_KEY,String(ts));}catch(e){}}

  function showLock(){
    const el=document.getElementById('lock-screen');
    if(el)el.classList.remove('unlocked');
    document.body.style.overflow='hidden';
  }
  function hideLock(){
    const el=document.getElementById('lock-screen');
    if(el)el.classList.add('unlocked');
    document.body.style.overflow='';
    try{sessionStorage.setItem(SESSION_KEY,'1');}catch(e){}
  }

  function updateAttemptsUI(){
    const n=getAttempts();
    const el=document.getElementById('lock-attempts');
    if(!el)return;
    if(n>0&&n<MAX_ATTEMPTS) el.textContent=`${MAX_ATTEMPTS-n} attempt${MAX_ATTEMPTS-n!==1?'s':''} remaining`;
    else el.textContent='';
  }

  function checkLockout(){
    const until=getLockout();
    if(!until||Date.now()>until)return false;
    const mins=Math.ceil((until-Date.now())/60000);
    const err=document.getElementById('lock-err');
    if(err)err.textContent=`Too many attempts. Try again in ${mins} min${mins!==1?'s':''}.`;
    const inp=document.getElementById('lock-pw');
    if(inp)inp.disabled=true;
    const btn=document.querySelector('.lock-btn');
    if(btn)btn.disabled=true;
    return true;
  }

  window.lockSubmit=async function(){
    if(checkLockout())return;
    const inp=document.getElementById('lock-pw');
    const err=document.getElementById('lock-err');
    if(!inp)return;
    const val=inp.value;
    if(!val){err.textContent='Please enter the password.';return;}
    const hash=await sha256(val);
    if(hash===getHash()){
      setAttempts(0);
      setLockout(0);
      hideLock();
    } else {
      const attempts=getAttempts()+1;
      setAttempts(attempts);
      if(attempts>=MAX_ATTEMPTS){
        setLockout(Date.now()+LOCKOUT_MS);
        err.textContent='Too many attempts. Locked for 5 minutes.';
        inp.disabled=true;
        const btn=document.querySelector('.lock-btn');
        if(btn)btn.disabled=true;
      } else {
        err.textContent='Incorrect password. Please try again.';
        updateAttemptsUI();
      }
      inp.value='';
      inp.classList.add('shake');
      setTimeout(()=>inp.classList.remove('shake'),400);
      inp.focus();
    }
  };

  window.lockToggleEye=function(){
    const inp=document.getElementById('lock-pw');
    const icon=document.getElementById('lock-eye-icon');
    if(!inp)return;
    const show=inp.type==='password';
    inp.type=show?'text':'password';
    icon.innerHTML=show
      ?'<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'
      :'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  };

  // Check on load — wait for chrome.storage.local shim to hydrate first
  document.addEventListener('DOMContentLoaded',function(){
    function _initLock(){
      // Protection is off, or never set up — nothing to unlock.
      if(!isEnabled()){hideLock();return;}
      // Already unlocked this session?
      try{if(sessionStorage.getItem(SESSION_KEY)==='1'){hideLock();return;}}catch(e){}
      if(checkLockout()){showLock();return;}
      showLock();
      updateAttemptsUI();
      setTimeout(()=>{const inp=document.getElementById('lock-pw');if(inp)inp.focus();},100);
    }
    if(window.__storageReady){
      window.__storageReady.then(_initLock);
    } else {
      _initLock();
    }
  });
})();

