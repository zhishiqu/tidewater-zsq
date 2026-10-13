// Tidewater 国际化模块 (i18n)
// 默认中文 (zh)，支持英文 (en) 切换。语言选择持久化到 localStorage。
// 用法：import { t, getLang, setLang, subscribe } from './i18n.js';
//   t('ocean.windSpeed')            // 返回当前语言对应文本，找不到则返回 key
//   t('ocean.windSpeed', 'Wind speed') // 第二个参数为英文兜底（也作为 en 字典来源）
//   setLang('en'); subscribe(fn)   // 切换语言并通知所有订阅者重新渲染

const STORAGE_KEY = 'tidewater.lang';

// 当前语言：默认中文
let currentLang = 'zh';

// 读取持久化语言（安全：浏览器环境才读 localStorage）
try {

	if ( typeof localStorage !== 'undefined' ) {

		const saved = localStorage.getItem( STORAGE_KEY );
		if ( saved === 'zh' || saved === 'en' ) currentLang = saved;

	}

} catch ( _ ) { /* 忽略隐私模式 */ }

// 订阅者：语言切换时通知重新渲染
const subscribers = new Set();

// ── 翻译字典 ──────────────────────────────────────────────────────────────
// key -> { zh, en }。en 缺省时回退到 key 本身（原英文文本即 key 的语义）。
const DICT = {

	// ── index.html loader ──
	'loader.kicker': { zh: '一座海岛钓鱼游戏', en: 'An island fishing game' },
	'loader.tagline': { zh: '驾船出海，在礁石与深水间劳作，天黑前把渔获卖给乔。', en: 'Take the boat out, work the reef and the deep water, and sell your catch to Joe before dark.' },
	'loader.status.starting': { zh: '启动中…', en: 'Starting…' },
	'loader.note': { zh: '首次启动需要编译着色器，可能需要一两分钟。之后访问会快得多。', en: 'The first launch compiles the shaders and can take a minute or two. Later visits load much faster.' },
	'loader.tipLabel': { zh: '提示', en: 'Tip' },
	'loader.tip1': { zh: '按 <kbd>R</kbd> 拿出鱼竿。按住鼠标左键蓄力，松开抛投：按得越久抛得越远。', en: 'Press <kbd>R</kbd> for the rod. Hold the left mouse button to wind up, release to cast: the longer you hold, the farther it goes.' },
	'loader.tip2': { zh: '留意浮标。几次轻咬之后会被拉下水：那一刻点击鼠标左键刺鱼。', en: 'Watch the bobber. A few nibbles, then it\'s pulled under: click the left mouse button that moment to set the hook.' },
	'loader.tip3': { zh: '搏斗时，按住收线但要让张力保持在绿色区。鱼冲刺时松开，否则线会断。', en: 'In a fight, hold to reel but keep the line tension in the green. Ease off when the fish runs, or the line snaps.' },
	'loader.tip4': { zh: '钓到什么取决于钓点：浅水、礁石、陡坡外的深水，以及时段。', en: 'What bites depends on where you fish: the shallows, the reef, the deep water past the drop-off, and the time of day.' },
	'loader.tip5': { zh: '码头边鱼摊的乔收购你的渔获。鱼按重量计价，把大鱼带回来。', en: 'Joe at the fish stand by the pier buys your catch. Fish are worth more by weight, so bring the big ones in.' },
	'loader.tip6': { zh: '船坞的玛塔出售升级：更强的线、更快的轮、更大的鱼舱、更多燃油和探鱼器。', en: 'Marta at the boathouse sells upgrades: stronger line, a faster reel, a bigger hold, more fuel and a fish finder.' },
	'loader.tip7': { zh: '按 <kbd>E</kbd> 上船，在舵位接管驾驶，再按一次走下甲板漫步。', en: 'Press <kbd>E</kbd> at the boat to board, at the wheel to take the helm, and again to step away and walk the deck.' },
	'loader.tip8': { zh: '按 <kbd>I</kbd> 打开保温箱和鱼类日志。玛塔卖的甲板灯让你能在夜钓。', en: 'Press <kbd>I</kbd> for your cooler and the fish log. Deck lights from Marta let you fish after dark.' },

	// ── 一天时段 PHASES ──
	'phase.Night': { zh: '夜晚', en: 'Night' },
	'phase.Dawn': { zh: '黎明', en: 'Dawn' },
	'phase.Sunrise': { zh: '日出', en: 'Sunrise' },
	'phase.GoldenHour': { zh: '黄金时刻', en: 'Golden hour' },
	'phase.Morning': { zh: '上午', en: 'Morning' },
	'phase.Midday': { zh: '正午', en: 'Midday' },
	'phase.Afternoon': { zh: '下午', en: 'Afternoon' },
	'phase.Sunset': { zh: '日落', en: 'Sunset' },
	'phase.Dusk': { zh: '黄昏', en: 'Dusk' },

	// ── HUD ──
	'hud.depth': { zh: '深度', en: 'Depth' },
	'hud.exitPhoto': { zh: '退出照片模式', en: 'Exit photo mode' },
	'hud.fps': { zh: '帧率', en: 'fps' },

	// ── 面板 ──
	'panel.title': { zh: '设置', en: 'Settings' },
	'panel.photoMode': { zh: '照片模式 (P)', en: 'Photo mode (P)' },
	'panel.controls': { zh: '操作 (F1)', en: 'Controls (F1)' },
	'panel.collapse': { zh: '收起 (H)', en: 'Collapse (H)' },
	'panel.openSettings': { zh: '打开设置', en: 'Open settings' },
	'panel.settingsH': { zh: '设置 (H)', en: 'Settings (H)' },
	'panel.controlsF1': { zh: '操作 (F1)', en: 'Controls (F1)' },
	'panel.footHide': { zh: '隐藏', en: 'Hide' },
	'panel.footControls': { zh: '操作', en: 'Controls' },
	'panel.footPhoto': { zh: '照片模式', en: 'Photo mode' },
	'panel.langToggle': { zh: '切换语言 (中/EN)', en: 'Switch language (中/EN)' },

	// ── 帮助 ──
	'help.title': { zh: '操作', en: 'Controls' },
	'help.intro': { zh: '点击画面以捕获鼠标。Esc 释放。', en: 'Click the view to capture the mouse. Esc releases it.' },
	'help.close': { zh: '关闭', en: 'Close' },
	'help.closeF1': { zh: '关闭 (F1)', en: 'Close (F1)' },
	'help.move': { zh: '移动', en: 'Move' },
	'help.moveLook': { zh: '环顾四周<small>点击捕获</small>', en: 'Look around<small>Click to capture</small>' },
	'help.sprint': { zh: '冲刺、船只加速', en: 'Sprint, boat boost' },
	'help.jump': { zh: '跳跃、上浮', en: 'Jump, swim up' },
	'help.crouch': { zh: '蹲下、下潜', en: 'Crouch, dive' },
	'help.interact': { zh: '互动', en: 'Interact' },
	'help.interactE': { zh: '互动<small>上船、掌舵、登岸、交易</small>', en: 'Interact<small>Board, helm, step ashore, trade</small>' },
	'help.boatCam': { zh: '船只视角<small>第一/第三人称</small>', en: 'Boat camera<small>1st / 3rd person</small>' },
	'help.rod': { zh: '鱼竿<small>拿出 / 收起</small>', en: 'Fishing rod<small>Take out / put away</small>' },
	'help.lmb': { zh: '抛投、刺鱼、收线<small>按住蓄力 / 收线</small>', en: 'Cast, strike, reel<small>Hold to wind up / reel</small>' },
	'help.rmb': { zh: '收空线', en: 'Reel in an empty line' },
	'help.cooler': { zh: '保温箱与鱼类日志', en: 'Cooler and fish log' },
	'help.freeCam': { zh: '自由视角', en: 'Free camera' },
	'help.pauseTime': { zh: '暂停时间', en: 'Pause time' },
	'help.flashlight': { zh: '手电筒', en: 'Flashlight' },
	'help.mute': { zh: '静音', en: 'Mute' },
	'help.interface': { zh: '界面', en: 'Interface' },
	'help.settingsPanel': { zh: '设置面板', en: 'Settings panel' },
	'help.photoModeHide': { zh: '照片模式<small>隐藏全部界面</small>', en: 'Photo mode<small>Hides all interface</small>' },
	'help.thisSheet': { zh: '本表', en: 'This sheet' },
	'help.releaseMouse': { zh: '释放鼠标', en: 'Release the mouse' },
	'help.howTo': { zh: '<b>玩法：</b>钓鱼，到码头边鱼摊卖给乔，再从船坞旁杂货铺的玛塔处购买升级。两人都在右下角地图上。', en: '<b>How to play:</b> catch fish, sell them to Joe at the fish stand by the pier, and buy upgrades from Marta at the chandlery by the boathouse. Both are on the map (lower right).' },
	'help.replay': { zh: '重播指南', en: 'Replay the guide' },

	// ── 开场屏 ──
	'start.clickToExplore': { zh: '点击探索', en: 'Click to explore' },
	'start.move': { zh: '移动', en: 'Move' },
	'start.look': { zh: '环顾', en: 'Look' },
	'start.interact': { zh: '互动', en: 'Interact' },
	'start.settings': { zh: '设置', en: 'Settings' },
	'start.allControls': { zh: '全部操作', en: 'All controls' },

	// ── 模式 ──
	'mode.freeCam': { zh: '自由视角', en: 'Free camera' },
	'mode.walk': { zh: '行走', en: 'Walk' },
	'mode.boat1st': { zh: '船只 · 第一人称', en: 'Boat · 1st person' },
	'mode.boat3rd': { zh: '船只 · 第三人称', en: 'Boat · 3rd person' },
	'mode.onDeck': { zh: '甲板上', en: 'On deck' },
	'mode.diving': { zh: '下潜', en: 'Diving' },
	'mode.swimming': { zh: '游泳', en: 'Swimming' },
	'mode.walking': { zh: '行走', en: 'Walking' },

	// ── AppUI: Tabs ──
	'tab.ocean': { zh: '海洋', en: 'Ocean' },
	'tab.shore': { zh: '海岸', en: 'Shore' },
	'tab.sky': { zh: '天空', en: 'Sky' },
	'tab.camera': { zh: '相机', en: 'Camera' },
	'tab.effects': { zh: '特效', en: 'Effects' },
	'tab.performance': { zh: '性能', en: 'Performance' },

	// ── AppUI: Folders / Sea conditions ──
	'ocean.seaState': { zh: '海况', en: 'Sea state' },
	'ocean.conditions': { zh: '状况', en: 'Conditions' },
	'ocean.water': { zh: '水质', en: 'Water' },
	'ocean.windSpeed': { zh: '风速', en: 'Wind speed' },
	'ocean.windSpeedTip': { zh: '海面以上 10 米的风。驱动局地风浪、白帽浪与浪花。', en: 'Wind 10 m above the sea. Drives the local wind waves, whitecaps and spray.' },
	'ocean.windDir': { zh: '风向', en: 'Wind direction' },
	'ocean.fetch': { zh: '风程', en: 'Fetch' },
	'ocean.fetchTip': { zh: '风在开阔水面上吹过的距离：风程越长，浪越长越高。', en: 'Distance the wind has blown over open water: longer fetch, longer and higher waves.' },
	'ocean.choppiness': { zh: '尖峭度', en: 'Choppiness' },
	'ocean.choppinessTip': { zh: '水平位移：尖锐的波峰、宽阔的波谷。', en: 'Horizontal displacement: sharp crests, wide troughs.' },
	'ocean.swell': { zh: '涌浪', en: 'Ocean swell' },
	'ocean.whitecaps': { zh: '白帽浪', en: 'Whitecaps' },
	'ocean.clarity': { zh: '清澈度', en: 'Clarity' },
	'ocean.clarityTip': { zh: '数值越低，悬浮沉积物和浮游生物越多（更绿、更浑浊）。', en: 'Lower = more suspended sediment and plankton (greener, murkier).' },

	// 海况预设
	'cond.Calm': { zh: '平静', en: 'Calm' },
	'cond.Breezy': { zh: '微风', en: 'Breezy' },
	'cond.Choppy': { zh: '大浪', en: 'Choppy' },
	'cond.Storm': { zh: '风暴', en: 'Storm' },

	// ── Shore ──
	'shore.surf': { zh: '碎浪', en: 'Surf' },
	'shore.waveHeight': { zh: '浪高', en: 'Wave height' },
	'shore.wavePeriod': { zh: '浪周期', en: 'Wave period' },
	'shore.breakingDepth': { zh: '破碎水深比', en: 'Breaking depth ratio' },
	'shore.breakingDepthTip': { zh: '当浪高超过水深的此比例时，浪开始破碎。', en: 'Waves break when height exceeds this fraction of the depth.' },
	'shore.curl': { zh: '卷曲', en: 'Curl' },
	'shore.spray': { zh: '浪花', en: 'Spray' },
	'shore.sprayTip': { zh: '破碎波峰甩出的水滴与水雾。', en: 'Droplets and mist thrown off breaking crests.' },
	'shore.lipSheet': { zh: '唇缘水帘', en: 'Lip sheet' },
	'shore.lipSheetTip': { zh: '卷碎浪向前甩出的薄水帘。', en: 'The thin sheet of water thrown forward by plunging breakers.' },
	'shore.boatWake': { zh: '船尾迹', en: 'Boat wake' },
	'shore.wakeHeight': { zh: '尾迹高度', en: 'Wake height' },
	'shore.wakeFoam': { zh: '尾迹泡沫', en: 'Wake foam' },
	'shore.caustics': { zh: '焦散', en: 'Caustics' },
	'shore.intensity': { zh: '强度', en: 'Intensity' },

	// ── Sky ──
	'sky.sun': { zh: '太阳', en: 'Sun' },
	'sky.azimuth': { zh: '太阳方位角', en: 'Sun azimuth' },
	'sky.azimuthTip': { zh: '围绕海岛转动太阳路径（0 = 真实路径：东升西落）。', en: 'Turns the sun\'s path around the island (0 = the real path: rises in the east, sets in the west).' },
	'sky.advanceTime': { zh: '时间推进', en: 'Advance time' },
	'sky.timeSpeed': { zh: '时间速度', en: 'Time speed' },
	'sky.atmosphere': { zh: '大气', en: 'Atmosphere' },
	'sky.cloudCover': { zh: '云量', en: 'Cloud cover' },
	'sky.cirrus': { zh: '卷云', en: 'Cirrus' },
	'sky.haze': { zh: '霾', en: 'Haze' },
	'sky.hazeTip': { zh: '大气透视与海洋霾密度（1 ≈ 海平面约 20 公里能见度，0 = 清澈）。', en: 'Aerial perspective and marine haze density (1 = about 20 km visibility at sea level, 0 = clear air).' },
	'sky.sunShafts': { zh: '太阳光柱', en: 'Sun shafts' },
	'sky.sunShaftsTip': { zh: '霾中的体积光柱与云隙光（棕榈、码头、山丘和云的阴影）。0 关闭。', en: 'Volumetric light shafts and crepuscular rays in the haze (shadows of palms, the pier, hills and clouds). 0 turns them off.' },
	'sky.airParticles': { zh: '空气颗粒', en: 'Air particles' },
	'sky.airParticlesTip': { zh: '空气中飘浮的尘埃、花粉、盐雾、种子绒与偶尔的蚊蚋：逆光时可见。0 关闭。', en: 'Dust, pollen, salt haze, seed fluff and the odd gnat drifting in the air: they catch the light when backlit by the sun. 0 turns them off.' },
	'sky.exposure': { zh: '曝光', en: 'Exposure' },

	// ── Camera ──
	'camera.view': { zh: '视角', en: 'View' },
	'camera.boatCam': { zh: '船只相机', en: 'Boat camera' },
	'camera.1st': { zh: '第一人称', en: '1st person' },
	'camera.3rd': { zh: '第三人称', en: '3rd person' },
	'camera.fov': { zh: '视场', en: 'Field of view' },
	'camera.freeCam': { zh: '自由相机 (F)', en: 'Free camera (F)' },

	// ── Effects ──
	'fx.post': { zh: '后期处理', en: 'Post-processing' },
	'fx.ao': { zh: '环境光遮蔽', en: 'Ambient occlusion' },
	'fx.bounce': { zh: '反弹光', en: 'Bounce light' },
	'fx.bounceTip': { zh: '地面（亮沙）反射的阳光照亮下方与阴影面：码头、屋檐、船体、树干。0 = 关。', en: 'Sunlight reflected off the ground (bright sand) onto undersides and shaded faces: pier, eaves, hulls, trunks. 0 = off.' },
	'fx.sharpen': { zh: '锐化', en: 'Sharpen' },
	'fx.sharpenTip': { zh: '时域抗锯齿之后的对比自适应锐化。', en: 'Contrast-adaptive sharpening after the temporal anti-aliasing.' },
	'fx.motionBlur': { zh: '运动模糊', en: 'Motion blur' },
	'fx.motionBlurTip': { zh: '相机与物体运动模糊，以快门角度表示（180° = 电影感）。0 关闭。', en: 'Camera and object motion blur, as a shutter angle (180° = film look). 0 turns it off.' },
	'fx.bloom': { zh: '泛光', en: 'Bloom' },
	'fx.flare': { zh: '镜头眩光', en: 'Lens flare' },
	'fx.saturation': { zh: '饱和度', en: 'Saturation' },
	'fx.contrast': { zh: '对比度', en: 'Contrast' },
	'fx.vignette': { zh: '暗角', en: 'Vignette' },
	'fx.grain': { zh: '胶片颗粒', en: 'Film grain' },

	// ── Performance ──
	'perf.live': { zh: '实时', en: 'Live' },
	'perf.frameRate': { zh: '帧率', en: 'Frame rate' },
	'perf.cpuPerFrame': { zh: '每帧 CPU', en: 'CPU per frame' },
	'perf.renderSize': { zh: '渲染分辨率', en: 'Render size' },
	'perf.quality': { zh: '画质', en: 'Quality' },
	'perf.renderScale': { zh: '渲染缩放', en: 'Render scale' },
	'perf.renderScaleTip': { zh: '内部分辨率；时域放大器重建完整输出分辨率。', en: 'Internal resolution; the temporal upscaler reconstructs the full output resolution.' },
	'perf.aa': { zh: '抗锯齿', en: 'Anti-aliasing' },
	'perf.aaTip': { zh: '时域抗锯齿：每个像素在连续多帧上平均这么多亚像素采样位置（也平滑抖动淡入与阴影噪点）。采样数越多每帧成本不变，但需要更多帧才稳定。', en: 'Temporal anti-aliasing: each pixel averages this many sub-pixel sample positions over successive frames (it also smooths dithered fades and shadow noise). More samples cost nothing per frame but take a few more frames to settle.' },
	'perf.aaOff': { zh: '关', en: 'Off' },
	'perf.shadows': { zh: '阴影', en: 'Shadows' },
	'perf.waterRefl': { zh: '水面反射', en: 'Water reflections' },
	'perf.waterReflTip': { zh: '码头、船只与山丘在水面上的屏幕空间反射。', en: 'Screen-space reflections of the pier, boats and hills on the water.' },

	// ── 杂项 UI ──
	'ui.doubleClickReset': { zh: '双击重置', en: 'Double-click to reset' },
	'ui.reset': { zh: '重置', en: 'Reset' },
	'ui.resetToDefault': { zh: '恢复默认', en: 'Reset to default' },
	'ui.clickToType': { zh: '点击输入数值', en: 'Click to type a value' },
	'ui.recommended': { zh: '已应用推荐设置', en: 'Recommended settings applied' },
	'ui.allReset': { zh: '所有设置已重置', en: 'All settings reset' },
	'ui.demoToast': { zh: 'UI 演示：每个控件都填入了示例数据', en: 'UI demo: every control is filled with sample data' },
	'ui.demoToast2': { zh: '按 H 隐藏面板，F1 查看操作', en: 'Press H to hide the panel, F1 for controls' },

	// ── Game.js 提示与 toast ──
	'game.rodOutCast': { zh: '鱼竿已拿出 · 按住鼠标左键抛投', en: 'Rod out · hold left mouse to cast' },
	'game.rodAway': { zh: '鱼竿已收起', en: 'Rod away' },
	'game.takeOutRod': { zh: '拿出鱼竿', en: 'Take out the rod' },
	'game.idlePrompt': { zh: '按住蓄力，松开抛投   ·   R  收起鱼竿', en: 'Hold to wind up, release to cast   ·   R  put the rod away' },
	'game.windupPrompt': { zh: '松开抛投（按住更久抛得更远）', en: 'Release to cast (hold longer to cast farther)' },
	'game.strikeNow': { zh: '现在刺鱼！', en: 'Strike now!' },
	'game.nibblePrompt': { zh: '有鱼在咬 · 等浮标被拉下水', en: 'Something\'s nibbling · wait until the bobber is pulled under' },
	'game.waitingPrompt': { zh: '等鱼上钩 · 右键收线', en: 'Waiting for a bite · right-click to reel the line in' },
	'game.reelingIn': { zh: '收线中', en: 'Reeling in' },
	'game.tooMuchTension': { zh: '张力过大 · 松开！', en: 'Too much tension · let go!' },
	'game.holdToReel': { zh: '按住收线 · 张力变红时松开', en: 'Hold to reel · let go when the tension goes red' },
	'game.leave': { zh: '离开', en: 'Leave' },
	'game.talkTo': { zh: '与{name}对话', en: 'Talk to {name}' },
	'game.outOfFuel': { zh: '燃油耗尽 · 到船坞旁杂货铺购买柴油', en: 'Out of fuel · buy diesel at the chandlery by the boathouse' },
	'game.soldN': { zh: '卖出 {count} 条鱼，收入 ${total}', en: 'Sold {count} fish for ${total}' },
	'game.soldFor': { zh: '售出 ${total}', en: 'Sold for ${total}' },
	'game.landedSand': { zh: '落在沙上', en: 'Landed on the sand' },
	'game.tookBait': { zh: '它咬钩跑了', en: 'It took the bait and ran' },
	'game.notYet': { zh: '还不到时候 · 等它被拉下水', en: 'Not yet · wait for it to pull under' },
	'game.fishOn': { zh: '上钩了！', en: 'Fish on!' },
	'game.newRecord': { zh: '新纪录！', en: 'New record! ' },
	'game.catchInfoHold': { zh: '{name} · {kg} kg · ${value}', en: '{name} · {kg} kg · ${value}' },
	'game.noRoomHold': { zh: '{name} · {kg} kg · 鱼舱已满，放生', en: '{name} · {kg} kg · no room in the hold, let it go' },
	'game.noRoomCooler': { zh: '{name} · {kg} kg · 保温箱已满，放生', en: '{name} · {kg} kg · no room in the cooler, let it go' },
	'game.snap': { zh: '啪！线断了', en: 'Snap! The line broke' },
	'game.threwHook': { zh: '它甩掉了钩', en: 'It threw the hook' },
	'game.lostIt': { zh: '跑了', en: 'Lost it' },
	'game.filledUp': { zh: '已加满 · {l} L', en: 'Filled up · {l} L' },
	'game.upgradeBought': { zh: '{name}: {label}', en: '{name}: {label}' },

	// ── App.js toast ──
	'app.timeRunning': { zh: '时间运行中', en: 'Time running' },
	'app.timePaused': { zh: '时间已暂停', en: 'Time paused' },
	'app.flashOn': { zh: '手电筒开', en: 'Flashlight on' },
	'app.flashOff': { zh: '手电筒关', en: 'Flashlight off' },
	'app.soundOn': { zh: '声音开', en: 'Sound on' },
	'app.soundOff': { zh: '声音关', en: 'Sound off' },

	// ── GameHUD: 战斗 ──
	'fight.reelIn': { zh: '收线', en: 'Reel in' },
	'fight.easeOff': { zh: '松开！', en: 'Ease off!' },
	'fight.running': { zh: '它在冲刺！', en: 'It\'s running!' },
	'fight.slack': { zh: '线松了！', en: 'Slack line!' },
	'fight.goodPressure': { zh: '压力合适', en: 'Good pressure' },
	'fight.fish': { zh: '鱼', en: 'Fish' },
	'fight.fishOn': { zh: '上钩了！', en: 'Fish on!' },

	// ── GameHUD: 钱包/仪表 ──
	'purse.cooler': { zh: '保温箱', en: 'Cooler' },
	'purse.hold': { zh: '鱼舱', en: 'Hold' },
	'purse.fuel': { zh: '燃油', en: 'Fuel' },
	'purse.sonar': { zh: '声呐', en: 'Sonar' },

	// ── GameHUD: 渔获卡片 ──
	'catch.newRecord': { zh: '★ 新纪录', en: '★ New record' },
	'catch.newSpecies': { zh: '新物种', en: 'New species' },
	'catch.catch': { zh: '渔获', en: 'Catch' },
	'catch.length': { zh: '长度', en: 'Length' },
	'catch.weight': { zh: '重量', en: 'Weight' },
	'catch.value': { zh: '价值', en: 'Value' },
	'catch.inCooler': { zh: '已入箱', en: 'in the cooler' },
	'catch.letGo': { zh: '放生', en: 'let go' },
	'catch.noRoomHold': { zh: '鱼舱已满 · 你放生了', en: 'No room in the hold · you let it go' },
	'catch.noRoomCooler': { zh: '保温箱已满 · 你放生了', en: 'No room in the cooler · you let it go' },
	'catch.prevBest': { zh: '此前最佳 <b>{kg} kg</b> · {cm} cm。超出 {diff} kg。', en: 'Previous best <b>{kg} kg</b> · {cm} cm. Beaten by {diff} kg.' },
	'catch.firstLog': { zh: '鱼类日志中的第一条。', en: 'First one in your fish log.' },
	'catch.yourBest': { zh: '你的最佳：{kg} kg · {cm} cm', en: 'Your best: {kg} kg · {cm} cm' },
	'catch.continue': { zh: '<kbd>点击</kbd> 或 <kbd>E</kbd> 继续', en: '<kbd>Click</kbd> or <kbd>E</kbd> to continue' },

	// ── GameHUD: 库存 ──
	'inv.fishHold': { zh: '鱼舱', en: 'Fish hold' },
	'inv.cooler': { zh: '保温箱', en: 'Cooler' },
	'inv.sub': { zh: '{count} 条 · {kg} / {cap} kg · 价值 ${value}', en: '{count} fish · {kg} of {cap} kg · worth ${value}' },
	'inv.empty': { zh: '还没有鱼。从码头、海滩或船上抛投。', en: 'Nothing yet. Cast from the pier, the beach or the boat.' },
	'inv.log': { zh: '鱼类日志', en: 'Fish log' },
	'inv.logLine': { zh: '{name}: 已捕 {count} 条，最佳 {kg} kg · {cm} cm', en: '{name}: {count} caught, best {kg} kg · {cm} cm' },
	'inv.record': { zh: '纪录', en: 'record' },
	'inv.release': { zh: '放生', en: 'Release' },
	'inv.sellAt': { zh: '到码头边鱼摊售卖', en: 'Sell at the fish stand by the pier' },
	'inv.close': { zh: '关闭 (I)', en: 'Close (I)' },

	// ── GameHUD: 鱼摊 ──
	'stand.sell': { zh: '卖出', en: 'Sell' },
	'stand.sellAll': { zh: '全部售出 · ${value}', en: 'Sell all · ${value}' },
	'stand.leave': { zh: '离开 (E)', en: 'Leave (E)' },
	'stand.empty': { zh: '你的保温箱是空的。', en: 'Your cooler is empty.' },
	'stand.fishBuyer': { zh: '鱼贩', en: 'Fish buyer' },
	'stand.greetingDefault': { zh: '看看你钓到了什么。', en: 'Let\'s see what you caught.' },
	'stand.idleDefault': { zh: '钓到鱼了再来。', en: 'Come back when you\'ve got fish.' },

	// ── GameHUD: 杂货铺 ──
	'shop.diesel': { zh: '柴油', en: 'Diesel' },
	'shop.dieselSub': { zh: '油箱：{cur} / {cap} L', en: 'Tank: {cur} of {cap} L' },
	'shop.fill': { zh: '加满 · ${price}', en: 'Fill · ${price}' },
	'shop.full': { zh: '已满', en: 'Full' },
	'shop.topOfLine': { zh: '已是顶级', en: 'Top of the line' },
	'shop.now': { zh: '当前', en: 'Now' },
	'shop.youHave': { zh: '${money}', en: 'You have ${money}' },
	'shop.subGreeting': { zh: '{greeting} · 你有 ${money}', en: '{greeting} · You have ${money}' },
	'shop.upgradesTakeEffect': { zh: '升级立即生效', en: 'Upgrades take effect at once' },

	// ── Gear.js 名称 ──
	'gear.line.name': { zh: '鱼线', en: 'Fishing line' },
	'gear.line.l0': { zh: '8 磅尼龙', en: '8 lb mono' },
	'gear.line.l1': { zh: '15 磅尼龙', en: '15 lb mono' },
	'gear.line.l2': { zh: '30 磅编织', en: '30 lb braid' },
	'gear.line.l3': { zh: '60 磅编织', en: '60 lb braid' },
	'gear.reel.name': { zh: '渔轮', en: 'Reel' },
	'gear.reel.l0': { zh: '旧纺车轮', en: 'Old spinning reel' },
	'gear.reel.l1': { zh: '顺滑纺车轮', en: 'Smooth spinning reel' },
	'gear.reel.l2': { zh: '常规轮', en: 'Conventional reel' },
	'gear.rod.name': { zh: '鱼竿', en: 'Rod' },
	'gear.rod.l0': { zh: '旧传家竿', en: 'Hand-me-down rod' },
	'gear.rod.l1': { zh: '7 英尺石墨竿', en: '7 ft graphite rod' },
	'gear.rod.l2': { zh: '9 英尺冲浪竿', en: '9 ft surf rod' },
	'gear.hold.name': { zh: '鱼舱', en: 'Fish hold' },
	'gear.hold.l0': { zh: '保温箱', en: 'Cooler' },
	'gear.hold.l1': { zh: '冰柜', en: 'Ice chest' },
	'gear.hold.l2': { zh: '保温鱼舱', en: 'Insulated fish hold' },
	'gear.fuel.name': { zh: '油箱', en: 'Fuel tank' },
	'gear.fuel.l0': { zh: '40 L 油箱', en: '40 L tank' },
	'gear.fuel.l1': { zh: '80 L 油箱', en: '80 L tank' },
	'gear.fuel.l2': { zh: '150 L 油箱', en: '150 L tank' },
	'gear.engine.name': { zh: '发动机', en: 'Engine' },
	'gear.engine.l0': { zh: '老旧柴油机', en: 'Tired diesel' },
	'gear.engine.l1': { zh: '重修柴油机', en: 'Rebuilt diesel' },
	'gear.engine.l2': { zh: '涡轮增压柴油机', en: 'Turbo diesel' },
	'gear.finder.name': { zh: '探鱼器', en: 'Fish finder' },
	'gear.finder.l0': { zh: '无', en: 'None' },
	'gear.finder.l1': { zh: '探鱼器（HUD 显示水深与鱼群）', en: 'Fish finder (depth and fish on the HUD)' },
	'gear.lights.name': { zh: '船灯', en: 'Boat lights' },
	'gear.lights.l0': { zh: '仅航行灯', en: 'Nav lights only' },
	'gear.lights.l1': { zh: '甲板泛光灯（夜钓）', en: 'Deck floodlights for night fishing' },

	// ── FishTable 鱼名 ──
	'fish.silverside': { zh: '硬头银汉鱼', en: 'Hardhead silverside' },
	'fish.mullet': { zh: '条纹鲻', en: 'Striped mullet' },
	'fish.needlefish': { zh: '鳄形颚针鱼', en: 'Houndfish' },
	'fish.sergeant': { zh: '豆娘鱼', en: 'Sergeant major' },
	'fish.grunt': { zh: '蓝条纹石鲈', en: 'Bluestriped grunt' },
	'fish.yellowtail': { zh: '黄尾鲷', en: 'Yellowtail snapper' },
	'fish.chromis': { zh: '蓝光鳃雀鲷', en: 'Blue chromis' },
	'fish.tang': { zh: '蓝刺尾鱼', en: 'Blue tang' },
	'fish.wrasse': { zh: '猪隆头鱼', en: 'Hogfish' },
	'fish.parrot': { zh: '鹦嘴鱼', en: 'Stoplight parrotfish' },
	'fish.angel': { zh: '女王天使鱼', en: 'Queen angelfish' },
	'fish.jack': { zh: '马鲹', en: 'Crevalle jack' },
	'fish.barracuda': { zh: '大鳞魣', en: 'Great barracuda' },
	'fish.grouper': { zh: '拿骚石斑', en: 'Nassau grouper' },
	'fish.redSnapper': { zh: '红鲷', en: 'Red snapper' },
	'fish.tuna': { zh: '黑鳍金枪鱼', en: 'Blackfin tuna' },
	'fish.mahi': { zh: '鲯鳅', en: 'Mahi-mahi' },
	'fish.tarpon': { zh: '大海鲢', en: 'Tarpon' },

	// ── 商贩 ──
	'vendor.marta': { zh: '玛塔 · 杂货铺', en: 'Marta · Chandlery' },
	'vendor.joe': { zh: '乔 · 鱼贩', en: 'Joe · Fish buyer' },
	'vendor.marta.greeting': { zh: '鱼线、渔轮、更大的鱼舱、柴油。你需要什么？', en: 'Line, reels, a bigger hold, diesel. What do you need?' },
	'vendor.joe.greeting': { zh: '看看你钓到了什么。公道价，现金。', en: 'Let\'s see what you caught. Fair prices, cash.' },
	'vendor.joe.idle': { zh: '没东西卖？码头边有石鲈在咬钩。', en: 'Nothing to sell? The grunts are biting off the pier.' },

	// ── Guide 指南 ──
	'guide.tip': { zh: '提示', en: 'Tip' },
	'guide.enterSkip': { zh: 'Enter · Esc 跳过', en: 'Enter · Esc to skip' },
	'guide.skip': { zh: '跳过', en: 'Skip' },
	'guide.next': { zh: '下一步', en: 'Next' },
	'guide.letsFish': { zh: '开始钓鱼', en: 'Let\'s fish' },
	'guide.c1.eyebrow': { zh: '欢迎来到 Tidewater', en: 'Welcome to Tidewater' },
	'guide.c1.title': { zh: '钓海岛，卖渔获', en: 'Fish the island, sell your catch' },
	'guide.c1.body': { zh: '<p>从<b>海滩</b>、<b>码头</b>或<b>船</b>上钓鱼。不同的鱼在浅水、码头周围、礁石上方与深水中咬钩，并随时段变化。</p><p>把渔获卖给码头边鱼摊的<b>乔</b>，再用钱到船坞旁杂货铺的<b>玛塔</b>处购买升级：更强的线、更快的轮、更大的鱼舱、探鱼器和夜钓灯。</p>', en: '<p>Catch fish from the <b>beach</b>, the <b>pier</b> or your <b>boat</b>. Different fish bite in the shallows, around the pier, over the reef and out in deep water, and they change with the time of day.</p><p>Sell your catch to <b>Joe</b> at the fish stand by the pier, then spend the money on upgrades from <b>Marta</b> at the chandlery by the boathouse: stronger line, a faster reel, a bigger hold, a fish finder and lights for fishing at night.</p>' },
	'guide.c2.eyebrow': { zh: '钓鱼', en: 'Fishing' },
	'guide.c2.title': { zh: '抛投、刺鱼、收线', en: 'Cast, strike, reel' },
	'guide.c2.body': { zh: '<div class="gm-guide-list">{r1}{r2}{r3}{r4}{r5}{r6}</div>', en: '<div class="gm-guide-list">{r1}{r2}{r3}{r4}{r5}{r6}</div>' },
	'guide.c2.r1': { zh: '拿出鱼竿（水边或船上）', en: 'Take out the rod (by the water or on the boat)' },
	'guide.c2.r2': { zh: '蓄力，松开抛投。按住更久抛得更远', en: 'Wind up, release to cast. Hold longer to cast farther' },
	'guide.c2.r3': { zh: '当浮标被<b>拉下水</b>时刺鱼（轻点只是试探）', en: 'Strike when the bobber is <b>pulled under</b> (dips are only nibbles)' },
	'guide.c2.r4': { zh: '收线。<b>张力变红时松开</b>，否则线会断', en: 'Reel in. <b>Let go when the tension turns red</b>, or the line snaps' },
	'guide.c2.r5': { zh: '收回空线', en: 'Reel an empty line back in' },
	'guide.c2.r6': { zh: '保温箱与鱼类日志', en: 'Your cooler and fish log' },
	'guide.c3.eyebrow': { zh: '出行', en: 'Getting around' },
	'guide.c3.title': { zh: '乔与玛塔', en: 'Joe and Marta' },
	'guide.c3.body': { zh: '<div class="gm-guide-list">{r1}{r2}{r3}</div><div class="gm-guide-where"><div class="is-joe"><i></i><span><b>乔</b> · 码头边鱼摊</span><em data-where="joe"></em></div><div class="is-marta"><i></i><span><b>玛塔</b> · 船坞旁杂货铺</span><em data-where="marta"></em></div></div><p style="margin:0;color:var(--tw-ink-3);font-size:var(--tw-fs-sm)">两人都标在右下角地图上。</p>', en: '<div class="gm-guide-list">{r1}{r2}{r3}</div><div class="gm-guide-where"><div class="is-joe"><i></i><span><b>Joe</b> · fish stand by the pier</span><em data-where="joe"></em></div><div class="is-marta"><i></i><span><b>Marta</b> · chandlery by the boathouse</span><em data-where="marta"></em></div></div><p style="margin:0;color:var(--tw-ink-3);font-size:var(--tw-fs-sm)">Both are marked on the map in the lower right.</p>' },
	'guide.c3.r1': { zh: '移动，鼠标环顾，<kbd>Shift</kbd> 奔跑', en: 'Move, mouse to look, <kbd>Shift</kbd> to run' },
	'guide.c3.r2': { zh: '上船、掌舵、与乔和玛塔对话', en: 'Board the boat, take the helm, talk to Joe and Marta' },
	'guide.c3.r3': { zh: '全部操作，以及再次查看本指南', en: 'All controls, and this guide again' },

	// ── Guide tips ──
	'tip.rodOut': { zh: '按住<b>鼠标左键</b>蓄力，松开抛投。试试更深的水域、码头周围或礁石上方。', en: 'Hold the <b>left mouse button</b> to wind up and release to cast. Try deeper water, around the pier or over the reef.' },
	'tip.nibble': { zh: '浮标在动：有鱼在<b>试探</b>。等它被<b>拉下水</b>，再点击刺鱼。', en: 'The bobber is dipping: something is <b>nibbling</b>. Wait until it is <b>pulled under</b>, then click to strike.' },
	'tip.fishOn': { zh: '<b>按住鼠标左键</b>收线。当张力指针接近<b>红色</b>时松开，等它回落后再收。', en: '<b>Hold the left mouse button</b> to reel. When the tension needle nears the <b>red</b>, let go until it settles, then reel again.' },
	'tip.caught': { zh: '装入保温箱（<kbd>I</kbd>）。到码头边鱼摊把渔获卖给<b>乔</b>：他在地图上。', en: 'Into the cooler (<kbd>I</kbd>). Sell your catch to <b>Joe</b> at the fish stand by the pier: he is on the map.' },
	'tip.full': { zh: '你的保温箱<b>满了</b>。卖给乔，或到杂货铺找玛塔买更大的鱼舱。', en: 'Your cooler is <b>full</b>. Sell to Joe, or buy a bigger hold from Marta at the chandlery.' },
	'tip.boat': { zh: '你的船。<kbd>E</kbd> 上船，在舵位再按 <kbd>E</kbd> 驾驶（<kbd>W</kbd><kbd>S</kbd> 油门，<kbd>A</kbd><kbd>D</kbd> 转向）。柴油由玛塔出售。', en: 'Your boat. <kbd>E</kbd> to board, <kbd>E</kbd> again at the wheel to drive (<kbd>W</kbd><kbd>S</kbd> throttle, <kbd>A</kbd><kbd>D</kbd> steer). Diesel is sold by Marta.' },
	'tip.joe': { zh: '<b>乔</b>收购你的鱼。<kbd>E</kbd> 看他能出多少价。', en: '<b>Joe</b> buys your fish. <kbd>E</kbd> to see what he will pay.' },
	'tip.marta': { zh: '<b>玛塔</b>出售升级和柴油。<kbd>E</kbd> 看她的货。', en: '<b>Marta</b> sells upgrades and diesel. <kbd>E</kbd> to see her stock.' },

	// ── 方向词 ──
	'dir.north': { zh: '北', en: 'north' },
	'dir.northEast': { zh: '东北', en: 'north-east' },
	'dir.east': { zh: '东', en: 'east' },
	'dir.southEast': { zh: '东南', en: 'south-east' },
	'dir.south': { zh: '南', en: 'south' },
	'dir.southWest': { zh: '西南', en: 'south-west' },
	'dir.west': { zh: '西', en: 'west' },
	'dir.northWest': { zh: '西北', en: 'north-west' },

	// ── 单位 ──
	'unit.mps': { zh: '米/秒', en: 'm/s' },
	'unit.km': { zh: '公里', en: 'km' },
	'unit.deg': { zh: '°', en: '°' },
	'unit.m': { zh: '米', en: 'm' },
	'unit.s': { zh: '秒', en: 's' },
	'unit.L': { zh: '升', en: 'L' },
	'unit.kg': { zh: '公斤', en: 'kg' },
	'unit.hps': { zh: '小时/秒', en: 'h/s' },
	'unit.EV': { zh: 'EV', en: 'EV' },
	'unit.fps': { zh: '帧/秒', en: 'fps' },
	'unit.ms': { zh: '毫秒', en: 'ms' },

};

// ── 核心函数 ─────────────────────────────────────────────────────────────

// t(key, fallback?) → 当前语言文本
// 支持 {name} 占位符替换：t('game.soldN', 'Sold {count}...', { count: 3, total: 50 })
export function t( key, fallback, params ) {

	const entry = DICT[ key ];
	let text;
	if ( entry ) {

		text = entry[ currentLang ] || entry.en || fallback || key;

	} else {

		// 未登记的 key：优先用兜底英文，中文环境下原样返回（英文即 key 语义）
		text = fallback || key;

	}
	if ( params && typeof text === 'string' ) {

		text = text.replace( /\{(\w+)\}/g, ( _, k ) => ( params[ k ] != null ? String( params[ k ] ) : `{${ k }}` ) );

	}
	return text;

}

export function getLang() {

	return currentLang;

}

export function setLang( lang ) {

	if ( lang !== 'zh' && lang !== 'en' ) return;
	if ( lang === currentLang ) return;
	currentLang = lang;
	try {

		if ( typeof localStorage !== 'undefined' ) localStorage.setItem( STORAGE_KEY, lang );

	} catch ( _ ) { /* 忽略 */ }
	// 通知所有订阅者
	for ( const fn of subscribers ) {

		try { fn( lang ); } catch ( e ) { console.error( '[i18n] subscriber failed', e ); }

	}

}

export function toggleLang() {

	setLang( currentLang === 'zh' ? 'en' : 'zh' );

}

export function subscribe( fn ) {

	subscribers.add( fn );
	return () => subscribers.delete( fn );

}

// 当前语言是否中文
export const isZh = () => currentLang === 'zh';

// 把 PHASES 之类的数组按当前语言映射
export function tr( key, enFallback ) {

	return t( key, enFallback );

}
