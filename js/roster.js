/* KURSI CLASH - roster: 10 fighters + 1 boss. Original parody names, writing and art. */
window.KC = window.KC || {};

KC.ROSTER = [
  {
    id: 'chaiboss', name: 'CHAIBOSS', team: 'Team Mitron',
    skin: 0xf0c8a0, hair: 'none', beard: 'white', glasses: true,
    kurta: 0xf6931e, pants: 0xd8d2c4, chappal: 0x6b4a2a,
    desc: 'Sells chai, serves justice. 56-inch chest, 56-kilo confidence.',
    supers: [
      { name: 'MITRON CHAKRA', dmg: 30, desc: 'Rises into the sky spinning a glowing chakra of promises, hurls it for 30% damage.' },
      { name: 'SHAKTI PRACHAR', dmg: 22, desc: 'A roaring speech shockwave. Opponent is stunned by sheer volume.' },
      { name: 'ALMIGHTY AASHIRWAD', dmg: 38, cine: 'rise', desc: 'Charges a divine blessing, then blasts the opponent across the stage with a spherical wave.' },
      { name: 'CUTTING CHAI CANNON', dmg: 24, desc: 'A piping hot cutting-chai splash. Served in a glass, returned at velocity. 24%.' }
    ],
    intro: ['Mitron... taiyaar ho jao.', 'Chai thandi ho rahi hai, jaldi khatam karte hain.', 'Ek cutting ki keemat samajhte ho? Yeh fight bhi cutting mein khatam.', 'Stall toh maine har chowk pe lagaya hai. Yeh ring bhi mera chowk hai.'],
    win: ['Hard work beats everything. Aur mitron, chai peete raho.', 'Yeh jeet 140 crore mitron ko samarpit hai.']
  },
  {
    id: 'yatrayodha', name: 'YATRA YODHA', team: 'Team Padyatra',
    skin: 0xecc39a, hair: 'sidepart', beard: 'stubble', glasses: false,
    kurta: 0xf2ede2, pants: 0xe8e2d4, chappal: 0x8a6a4a,
    desc: 'Walked 4000 km to this fight. Not tired. Slightly confused.',
    supers: [
      { name: 'ALOO-MAKER 3000', dmg: 30, desc: 'Zaps the opponent into an aloo, feeds it to his machine - out comes pure sona. 30% damage.' },
      { name: 'MOHABBAT WAVE', dmg: 22, desc: 'Opens a mohabbat ki dukaan mid-fight. Love hits harder than expected.' },
      { name: 'GATLING GALEEBI', dmg: 36, cine: 'gatling', desc: 'A stretchy-armed barrage of sixty-six slaps of affection.' },
      { name: 'PADYATRA PILEDRIVER', dmg: 26, desc: 'Ten thousand steps of momentum in one piledriver. Cardio is a weapon. 26%.' }
    ],
    intro: ['Main yahan mohabbat ki dukaan kholne aaya hoon.', 'Nafrat ke bazaar mein... ek thappad ki dukaan.', 'Padyatra se itna stamina hai, tumhari stamina bar chhoti lagegi.', 'Daro mat. Sirf haarne ki taiyari karo.'],
    win: ['Daro mat, daro mat, daro mat.', 'Yeh mohabbat ki jeet hai. Aur meri. Mainly meri.']
  },
  {
    id: 'dididhamaka', name: 'DIDI DHAMAKA', team: 'Team Para',
    skin: 0xecc39a, hair: 'bun', beard: 'none', glasses: false,
    kurta: 0x3f8cff, pants: 0xf2ede2, chappal: 0x444,
    desc: 'Hawai chappal. Cotton saree. Zero chill.',
    supers: [
      { name: 'CHAPPAL CHAMATKAR', dmg: 30, desc: 'One hawai chappal, thrown with parliamentary precision. 30% damage.' },
      { name: 'DHARNA DRIVE', dmg: 22, desc: 'Sits in instant dharna. Opponent trips over democracy.' },
      { name: 'BHADROK BLAST', dmg: 34, cine: 'push', desc: 'A circular wave of pure para energy launches the opponent into next week.' },
      { name: 'JORA JHATKA', dmg: 24, desc: 'Twin flowers, twin slaps, one dhamaka. The para approves. 24%.' }
    ],
    intro: ['Ami tomay khub bhalobashi... but first, fight.', 'Ei para-r rani ke challenge? Bhalo thakben.', 'Khela hobe. Aur khela amar rules e hobe.', 'Dharna se leke dhamaka tak - ami shob jani.'],
    win: ['Maa, mati, manush. Aur ekta chhoto jay.', 'Cholun, bhaat khai.']
  },
  {
    id: 'tariffchacha', name: 'TARIFF CHACHA', team: 'Team MAGA-Lite',
    skin: 0xf5c89a, hair: 'swoop', beard: 'none', glasses: false,
    kurta: 0xc0392b, pants: 0x2c3e50, chappal: 0x111,
    desc: 'Puts a tariff on your punches. They still land. He bills you anyway.',
    supers: [
      { name: 'TARIFF TORNADO', dmg: 30, desc: 'Spins a golden tornado of import duties. 30% damage plus emotional tax.' },
      { name: 'WALL SLAM', dmg: 24, desc: 'Builds a small beautiful wall. Opponent walks into it. Everyone saw it.' },
      { name: 'COVFEFE CATACLYSM', dmg: 36, cine: 'zoomblast', desc: 'Nobody knows what it is. It knows what it is. The best blast. 36%.' },
      { name: 'STAKEHOLDER STOMP', dmg: 24, desc: 'A very firm negotiation, conducted entirely with one boot. 24%.' }
    ],
    intro: ['This will be the greatest fight. Everybody says so.', 'I know fights. I have the best fights.', 'No deal is better than a bad deal. Tumhari health bar? Very bad deal.', 'Tariff laga diya hai tumhare confidence pe. Hundred percent.'],
    win: ['Total victory. Complete. The fake news will not report it.', 'I won so much I am tired of winning.']
  },
  {
    id: 'bulldozerbaba', name: 'BULLDOZER BABA', team: 'Team Shanti',
    skin: 0xeab98e, hair: 'shaved', beard: 'saffron', glasses: false,
    kurta: 0xe67e22, pants: 0xe67e22, chappal: 0x6b4a2a,
    desc: 'Speaks softly. Drives a bulldozer. Not softly.',
    supers: [
      { name: 'BULLDOZER BARAAT', dmg: 30, desc: 'A spectral bulldozer crosses the stage. Encroachment removed. 30% damage.' },
      { name: 'THOKO TALWAR', dmg: 24, desc: 'A swift strike with administrative approval.' },
      { name: 'MAHANT MEGAQUAKE', dmg: 34, cine: 'push', desc: 'Slams the ground; a saffron shockwave evicts the opponent from the arena.' },
      { name: 'RUDRAKSH ROCKET', dmg: 24, desc: 'One blessed bead, launched like a missile. Spiritually certified. 24%.' }
    ],
    intro: ['Shanti se khelunga. Thoda bulldozer bhi chalega.', 'Bulldozer ready hai.', 'Na rahega banter, na rahega tumhara poster.', 'Foundation toh main roz girata hoon. Aaj tumhari guard ki baari.'],
    win: ['Yeh shanti thi. Asli wali.', 'Bulldozer ka kaam ho gaya.']
  },
  {
    id: 'highwayman', name: 'HIGHWAY MAN', team: 'Team NH-44',
    skin: 0xd9a878, hair: 'receding', beard: 'white', glasses: true,
    kurta: 0xf2ede2, pants: 0x7f8c8d, chappal: 0x333,
    desc: 'Built a road to your face. Express route. Toll applies.',
    supers: [
      { name: 'EXPRESSWAY EXPRESS', dmg: 30, desc: 'Paves a highway under the opponent at 100 kmph and drives them out. 30%.' },
      { name: 'TOLL BOOTH TRAP', dmg: 22, desc: 'A toll booth appears. Opponent cannot pass without change. Or dignity.' },
      { name: 'GREENFIELD GRAND SLAM', dmg: 34, cine: 'flurry', desc: 'Six-lane slap expressway, no speed limit, no mercy.' },
      { name: 'POTHOLE PLUNGE', dmg: 24, desc: 'Opens a pothole directly under the opponent. The desi sadak claims another. 24%.' }
    ],
    intro: ['Road banana hoga. Pehle thoda fight.', 'I have built 40 km of road today. This is cardio.', 'Greenfield corridor seedha tumhari health bar tak.', 'Toll free fight hai aaj. Warna tum afford nahi kar sakte.'],
    win: ['Project completed before deadline.', 'Toll collected. Drive safe.']
  },
  {
    id: 'starneta', name: 'STAR NETA', team: 'Team Bhojpur',
    skin: 0xdda070, hair: 'curly', beard: 'mustache', glasses: false,
    kurta: 0x8e44ad, pants: 0xf2ede2, chappal: 0x6b4a2a,
    desc: 'Bhojpuri superstar turned MP. Fights in 4K with background dancers.',
    supers: [
      { name: 'ITEM NUMBER IMPACT', dmg: 30, desc: 'Background dancers appear from nowhere. One choreographed blow. 30%.' },
      { name: 'LAAL LIPSTICK LAATH', dmg: 24, desc: 'A spinning kick that gets its own remix.' },
      { name: 'SUPERSTAR SMASHER', dmg: 36, cine: 'flurry', desc: 'Seventy takes, one shot, all hits. Box office destruction.' },
      { name: 'INTERVAL TWIST', dmg: 24, desc: 'Just when the opponent thinks it is over - PLOT TWIST. 24%.' }
    ],
    intro: ['Camera? Rolling. Action!', 'Ego fight ho jai, superhit style mein.', 'Script mein likha hai: tum haarte ho, interval se pehle.', 'Stunt double ki zaroorat padegi tumhe. Spoiler: nahi milega.'],
    win: ['Superhit! 100 crore club entry.', 'Autograph baad mein, pehle trophy.']
  },
  {
    id: 'railrustom', name: 'RAIL RUSTOM', team: 'Team Platform 9',
    skin: 0xd9a878, hair: 'curly', beard: 'white', glasses: false,
    kurta: 0x3a5a8c, pants: 0x2c3e50, chappal: 0x6b4a2a,
    desc: 'Runs a railway, a state and his mouth. All on time.',
    supers: [
      { name: 'GARIB RATH GAUNTLET', dmg: 30, desc: 'A spectral train of pure jugaad runs the opponent over. 30%.' },
      { name: 'CHARA CHAKRAVYUH', dmg: 22, desc: 'A maze of fodder contracts. Opponent loses way and health.' },
      { name: 'LALU... WAIT, RUSTOM ROCKET', dmg: 34, cine: 'flurry', desc: 'Platform announcement of doom followed by a first-class beating.' },
      { name: 'SHUNTING SLAM', dmg: 24, desc: 'Re-routes the opponent to the wrong platform. Via his spine. 24%.' }
    ],
    intro: ['Are bhains ke aage been bajega kya? Lad le!', 'Humra se takraoge? Ticket kaata?', 'Engine chalu hai. Tumhara guard pehle station pe utrega.', 'Local ho ya express, hum kabhi nahi rukte.'],
    win: ['Signal green ho gaya. Gaadi chali.', 'Samosa khao, jeet manao.']
  },
  {
    id: 'chanakyaboss', name: 'CHANAKYA BOSS', team: 'Team Masterstroke',
    skin: 0xe8c49c, hair: 'none', beard: 'white', glasses: true,
    kurta: 0xf2ede2, pants: 0xd8d2c4, chappal: 0x444,
    desc: 'Already knew your next move. And your PIN code. Allegedly.',
    supers: [
      { name: 'MASTERSTROKE MIRAGE', dmg: 30, desc: 'You thought he was there. He was here. 30% damage, 100% confusion.' },
      { name: 'ED RAID RUSH', dmg: 24, desc: 'Surprise inspection. Opponent surrenders health without notice.' },
      { name: 'ARAKSHIT AAG', dmg: 36, cine: 'push', desc: 'A reserved seat of fire expands outward. Nothing can stop the masterstroke.' },
      { name: 'COALITION CRUNCH', dmg: 26, desc: 'Forms a sudden alliance with the floor. The opponent meets it face-first. 26%.' }
    ],
    intro: ['Yeh fight pehle hi decide ho chuki hai.', 'Masterstroke loading...', 'Tumhari strategy mujhe kal hi leak ho gayi thi.', 'Yeh khel charitra ka nahi, chaturai ka hai. Dono mein tum kamzor ho.'],
    win: ['As planned. Sab planned.', 'Ab agla masterstroke.']
  },
  {
    id: 'mufflerman', name: 'MUFFLER MAN', team: 'Team Aam',
    skin: 0xf0c8a0, hair: 'receding', beard: 'mustache', glasses: true,
    kurta: 0x95a5a6, pants: 0x7f8c8d, chappal: 0x333,
    desc: 'Aam aadmi. Khaas fighting. Muffler gives +10 resistance.',
    supers: [
      { name: 'JHADOO JUMBLE', dmg: 30, desc: 'Sweeps the opponent out of the arena with the party jhadu. 30%.' },
      { name: 'WIFI MUFT MUKKA', dmg: 22, desc: 'A free punch. No password needed. Straight to the jaw.' },
      { name: 'ODD-EVEN OVERDRIVE', dmg: 34, cine: 'push', desc: 'On odd days he fights on the left, even days right. Today both. Shockwave.' },
      { name: 'AAM AADMI ARMLOCK', dmg: 24, desc: 'A completely ordinary armlock. Very common. Very painful. 24%.' }
    ],
    intro: ['Main toh aam aadmi hoon. Aam aadmi bahut maarta hai.', 'Muffler tight, niyat saaf.', 'VIP culture yahan nahi chalega. Yeh aam ring hai.', 'Jhaadu toh hai nahi paas, toh haath hi saaf karna padega.'],
    win: ['Aam aadmi ki jeet! Free wi-fi sabko!', 'Imandari jeet gayi. Aur main bhi.']
  },
  {
    id: 'factbhai', name: 'FACT BHAI', team: 'Team WhatsApp University',
    skin: 0xd9a878, hair: 'sidepart', beard: 'stubble', glasses: false,
    kurta: 0x16a085, pants: 0x2c3e50, chappal: 0x222,
    desc: 'Checks facts. Spreads none. Fights with receipts.',
    supers: [
      { name: 'RECEIPT RAILGUN', dmg: 30, desc: 'Fires actual receipts at the speed of WhatsApp forwards. 30%.' },
      { name: 'FACK-CHECK FLEX', dmg: 22, desc: 'Debunks the opponent\'s last move so hard it hurts retroactively.' },
      { name: 'VIRAL VERIFICATION', dmg: 34, cine: 'flurry', desc: 'A fact-checking frenzy, shared in 47 family groups simultaneously.' },
      { name: 'COMMUNITY NOTE CRUSH', dmg: 24, desc: 'Readers added context: your jaw is broken. 24%.' }
    ],
    intro: ['Source? Main hoon source.', 'Aaj fact check nahi, face check hoga.', 'Tumhari winning probability? Community notes ne already debunk kar di.', 'Breaking: tumne apne hi defeat ko verify kar diya.'],
    win: ['Verified. True. Satya. Forward kar do.', 'Fake news down. Fact bhai up.']
  }
];

KC.BOSS = {
  id: 'mahabapu', name: 'MAHABAPU', team: 'FINAL BOSS',
  skin: 0xcda070, hair: 'none', beard: 'white', glasses: true,
  kurta: 0xffffff, pants: 0xffffff, chappal: 0x6b4a2a, boss: true,
  desc: 'The original speedster of satyagraha. Runs like a winger, hits like history.',
  supers: [
    { name: 'DANDI DRIVE', dmg: 30, desc: 'Marches forward slowly. You cannot stop the march. 30%.' },
    { name: 'AHIMSA?? NO-MA', dmg: 26, desc: 'Non-violence takes a lunch break. One historic spinning kick.' },
    { name: 'CHARKHA CYCLONE', dmg: 38, cine: 'push', desc: 'The charkha spins at 9000 rpm. The nation has never seen such a blast.' },
      { name: 'SATYAGRAHA SLAM', dmg: 26, desc: 'Insistence on truth, delivered at terminal velocity. 26%.' }
  ],
  intro: ['Be the change... after I beat you.', 'My followers are watching. Do not embarrass yourself.', 'The march does not stop. Aaj march tumhare upar se guzregi.', 'Charkha ghoom raha hai. Kismat ka charkha.'],
  win: ['An eye for an eye makes the whole world blind. A kick for a kick makes you fall.', 'First they ignore you. Then they fight you. Then you win. Classic.']
};

KC.STAGES = [
  { id: 'sansad', name: 'SANSAD', desc: 'The great dome of democracy, decorated for the season.' },
  { id: 'jantar', name: 'JANTAR MANTAR', desc: 'The official protest ground. Placards included, permission pending.' },
  { id: 'sadak', name: 'DESI SADAK', desc: 'A fine Indian street. Potholes are a gameplay mechanic.' }
];

KC.TICKER_LINES = [
  'BREAKING: Chai bhaiya in stands demands compensation for broken cups',
  'Exit polls predict both fighters winning; analysts confused as usual',
  'Stray cow walks into arena, refuses to leave, now has voting rights',
  'FAKE POLL: 103% of viewers say this fight is fixed',
  'Netas agree on one thing: the other one started it',
  'Crowd chants BADLAV; nobody specifies what kind',
  'Commentators seen arguing about arguing',
  'Stadium Wi-Fi password leaked: it was "democracy123"',
  'BREAKING: Placard union goes on strike, more placards at 6',
  'Sources say the referee is also confused about the rules',
  'Weather update: 100% chance of flying chappals',
  'Camerman zooms into wrong neta; nation forgives'
];

KC.BANTER_1 = { name: 'SHOR SHARMA', style: 'anchor', lines: [
  'The nation wants to know - who approved this fight?!',
  'Desh jaanna chahta hai: yeh kaisa combat hai?',
  'EXCLUSIVE: my sources say this fight is HISTORIC.',
  'Never in the history of fighting has such a fight been fought!',
  'BREAKING: I am breaking the news that news is breaking.'
]};
KC.BANTER_2 = { name: 'TWEETY TROLLWALA', style: 'troll', lines: [
  'Chat, are we live?? SMASH that like button.',
  'Ratio + L + the other guy fell down.',
  'This fight is mid, said no one ever, ok maybe one guy.',
  'Bro really said "strategy" 😭',
  'Clip it. CLIP IT NOW.'
]};
