class_name GameUI
extends CanvasLayer
## All menus and the HUD, built in code.

var game: Game
var theme_res: Theme
var root: Control
var hud: Control
var screen: Control
var hp_bar: ProgressBar
var hp_label: Label
var xp_bar: ProgressBar
var xp_label: Label
var coin_label: Label
var wave_label: Label
var timer_label: Label
var banner_label: Label
var banner_t := 0.0

const BG := Color(0.1, 0.08, 0.14, 0.96)
const PANEL := Color(0.16, 0.13, 0.22)
const ACCENT := Color(1.0, 0.55, 0.25)
const GOOD := Color(0.45, 1.0, 0.55)
const BAD := Color(1.0, 0.4, 0.4)


func _ready() -> void:
	layer = 10
	theme_res = _make_theme()
	root = Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.theme = theme_res
	add_child(root)
	_build_hud()
	screen = Control.new()
	screen.set_anchors_preset(Control.PRESET_FULL_RECT)
	screen.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(screen)


func _process(delta: float) -> void:
	if banner_t > 0.0:
		banner_t -= delta
		banner_label.modulate.a = clampf(banner_t, 0.0, 1.0)
		banner_label.visible = banner_t > 0.0


# ------------------------------------------------------------------ theme helpers

func _box(c: Color, border := Color(0, 0, 0, 0), radius := 10, pad := 12) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = c
	s.set_corner_radius_all(radius)
	s.set_content_margin_all(pad)
	if border.a > 0.0:
		s.border_color = border
		s.set_border_width_all(2)
	return s


func _make_theme() -> Theme:
	var t := Theme.new()
	t.default_font_size = 18
	t.set_stylebox("normal", "Button", _box(Color(0.28, 0.2, 0.32), Color(0.45, 0.32, 0.5), 8, 8))
	t.set_stylebox("hover", "Button", _box(Color(0.4, 0.27, 0.42), ACCENT, 8, 8))
	t.set_stylebox("pressed", "Button", _box(Color(0.55, 0.3, 0.2), ACCENT, 8, 8))
	t.set_stylebox("focus", "Button", _box(Color(0, 0, 0, 0), ACCENT, 8, 8))
	t.set_stylebox("disabled", "Button", _box(Color(0.18, 0.16, 0.2), Color(0.25, 0.22, 0.28), 8, 8))
	t.set_color("font_disabled_color", "Button", Color(0.5, 0.48, 0.55))
	t.set_stylebox("panel", "PanelContainer", _box(PANEL, Color(0.3, 0.24, 0.38)))
	t.set_stylebox("background", "ProgressBar", _box(Color(0.1, 0.08, 0.12), Color(0, 0, 0), 6, 0))
	t.set_stylebox("fill", "ProgressBar", _box(Color(0.85, 0.25, 0.25), Color(0, 0, 0, 0), 6, 0))
	return t


func _label(text: String, size := 18, color := Color.WHITE) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	l.add_theme_constant_override("outline_size", 4)
	l.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.8))
	return l


func _button(text: String, cb: Callable, disabled := false) -> Button:
	var b := Button.new()
	b.text = text
	b.disabled = disabled
	b.pressed.connect(cb)
	b.focus_mode = Control.FOCUS_ALL
	return b


func _clear_screen() -> void:
	for c in screen.get_children():
		c.queue_free()


func _overlay() -> Control:
	_clear_screen()
	var bg := ColorRect.new()
	bg.color = BG
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	screen.add_child(bg)
	var margin := MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	for side in ["left", "right", "top", "bottom"]:
		margin.add_theme_constant_override("margin_" + side, 28)
	screen.add_child(margin)
	return margin


func _focus_first(node: Node) -> void:
	await get_tree().process_frame
	if not is_instance_valid(node):
		return
	for c in node.find_children("*", "Button", true, false):
		if not c.disabled and c.is_visible_in_tree():
			c.grab_focus()
			return


# ------------------------------------------------------------------ HUD

func _build_hud() -> void:
	hud = Control.new()
	hud.set_anchors_preset(Control.PRESET_FULL_RECT)
	hud.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(hud)

	var box := VBoxContainer.new()
	box.position = Vector2(16, 14)
	box.add_theme_constant_override("separation", 6)
	hud.add_child(box)

	hp_bar = ProgressBar.new()
	hp_bar.custom_minimum_size = Vector2(260, 26)
	hp_bar.show_percentage = false
	box.add_child(hp_bar)
	hp_label = _label("", 16)
	hp_label.set_anchors_preset(Control.PRESET_FULL_RECT)
	hp_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hp_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	hp_bar.add_child(hp_label)

	xp_bar = ProgressBar.new()
	xp_bar.custom_minimum_size = Vector2(260, 18)
	xp_bar.show_percentage = false
	xp_bar.add_theme_stylebox_override("fill", _box(Color(0.35, 0.8, 0.45), Color(0, 0, 0, 0), 6, 0))
	box.add_child(xp_bar)
	xp_label = _label("", 13)
	xp_label.set_anchors_preset(Control.PRESET_FULL_RECT)
	xp_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	xp_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	xp_bar.add_child(xp_label)

	coin_label = _label("", 22, Color(1.0, 0.85, 0.3))
	box.add_child(coin_label)

	var top := VBoxContainer.new()
	top.set_anchors_preset(Control.PRESET_CENTER_TOP)
	top.position.y = 10
	top.grow_horizontal = Control.GROW_DIRECTION_BOTH
	top.alignment = BoxContainer.ALIGNMENT_BEGIN
	hud.add_child(top)
	wave_label = _label("", 20)
	wave_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	top.add_child(wave_label)
	timer_label = _label("", 40)
	timer_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	top.add_child(timer_label)

	banner_label = _label("", 44, ACCENT)
	banner_label.set_anchors_preset(Control.PRESET_CENTER)
	banner_label.grow_horizontal = Control.GROW_DIRECTION_BOTH
	banner_label.grow_vertical = Control.GROW_DIRECTION_BOTH
	banner_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	banner_label.position.y -= 140
	banner_label.visible = false
	hud.add_child(banner_label)

	var hint := _label("WASD / arrows to move  ·  weapons fire on their own  ·  Esc to pause", 14, Color(1, 1, 1, 0.45))
	hint.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	hint.grow_horizontal = Control.GROW_DIRECTION_BOTH
	hint.grow_vertical = Control.GROW_DIRECTION_BEGIN
	hint.position.y -= 8
	hud.add_child(hint)
	hud.visible = false


func show_hud() -> void:
	_clear_screen()
	hud.visible = true


func banner(text: String) -> void:
	banner_label.text = text
	banner_t = 2.0
	banner_label.visible = true


func update_hud() -> void:
	if not hud.visible or game.player == null:
		return
	var p := game.player
	hp_bar.max_value = p.max_hp
	hp_bar.value = maxf(0.0, p.hp)
	hp_label.text = "%d / %d" % [maxi(0, ceili(p.hp)), int(p.max_hp)]
	var need := GameData.xp_to_level(game.level)
	xp_bar.max_value = need
	xp_bar.value = game.xp
	xp_label.text = "LV %d" % game.level
	coin_label.text = "● %d" % game.coins
	wave_label.text = "WAVE %d / %d" % [game.wave, GameData.MAX_WAVES]
	timer_label.text = str(maxi(0, ceili(game.wave_time)))
	timer_label.add_theme_color_override("font_color", BAD if game.wave_time < 5.0 else Color.WHITE)


# ------------------------------------------------------------------ character select

func show_character_select() -> void:
	hud.visible = false
	var m := _overlay()
	var v := VBoxContainer.new()
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	v.add_theme_constant_override("separation", 18)
	m.add_child(v)
	var title := _label("GHOST MONTH MARKET", 54, ACCENT)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(title)
	var sub := _label("The gates of the underworld are open and the ghosts are hungry.\nHold the night market for %d waves." % GameData.MAX_WAVES, 18, Color(1, 1, 1, 0.75))
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(sub)
	var row := HBoxContainer.new()
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.add_theme_constant_override("separation", 16)
	v.add_child(row)
	for id in GameData.CHARACTERS:
		var c: Dictionary = GameData.CHARACTERS[id]
		var card := PanelContainer.new()
		card.custom_minimum_size = Vector2(270, 250)
		row.add_child(card)
		var cv := VBoxContainer.new()
		cv.add_theme_constant_override("separation", 10)
		card.add_child(cv)
		var swatch := ColorRect.new()
		swatch.color = c["color"]
		swatch.custom_minimum_size = Vector2(0, 8)
		cv.add_child(swatch)
		cv.add_child(_label(c["name"], 24, c["color"]))
		var d := _label(c["desc"], 15, Color(1, 1, 1, 0.85))
		d.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		d.size_flags_vertical = Control.SIZE_EXPAND_FILL
		cv.add_child(d)
		cv.add_child(_button("Play", game.start_run.bind(id)))
	_focus_first(row)


# ------------------------------------------------------------------ level up

func show_level_up(choices: Array) -> void:
	hud.visible = false
	var m := _overlay()
	var v := VBoxContainer.new()
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	v.add_theme_constant_override("separation", 20)
	m.add_child(v)
	var t := _label("LEVEL UP!  (%d to choose)" % game.pending_levels, 40, GOOD)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(t)
	var row := HBoxContainer.new()
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.add_theme_constant_override("separation", 16)
	v.add_child(row)
	for ch in choices:
		var card := PanelContainer.new()
		card.custom_minimum_size = Vector2(220, 180)
		var tc: Color = GameData.TIER_COLORS[ch["tier"]]
		card.add_theme_stylebox_override("panel", _box(PANEL, tc))
		row.add_child(card)
		var cv := VBoxContainer.new()
		cv.add_theme_constant_override("separation", 10)
		card.add_child(cv)
		cv.add_child(_label("Tier " + GameData.TIER_NAMES[ch["tier"]], 14, tc))
		cv.add_child(_label(GameData.STAT_NAMES[ch["stat"]], 24))
		var amt := _label("+%d" % ch["amount"], 34, GOOD)
		amt.size_flags_vertical = Control.SIZE_EXPAND_FILL
		cv.add_child(amt)
		cv.add_child(_button("Choose", game.choose_level_up.bind(ch)))
	v.add_child(_stats_panel(3))
	_focus_first(row)


# ------------------------------------------------------------------ shop

func _stat_lines(s: Dictionary) -> String:
	var parts: Array = []
	for k in s:
		var v: int = s[k]
		var col := "#73ff8c" if v > 0 else "#ff6666"
		parts.append("[color=%s]%+d[/color] %s" % [col, v, GameData.STAT_NAMES[k]])
	return "\n".join(parts)


func _weapon_text(id: String, tier: int) -> String:
	var d: Dictionary = GameData.WEAPONS[id]
	var dmg := Weapon.compute_damage(game, d, tier)
	var scal: Array = []
	for s in d["scaling"]:
		scal.append("%d%% %s" % [int(d["scaling"][s] * 100), GameData.STAT_NAMES[s].replace(" Dmg", "")])
	var lines := [
		"[color=#bbbbbb]%s[/color]" % d["desc"],
		"Damage [color=#ffd25a]%d[/color] [color=#999999](%s)[/color]" % [int(dmg), ", ".join(scal)],
		"Cooldown %.2fs · Range %d" % [Weapon.compute_cooldown(game, d, tier), int(Weapon.compute_range(game, d))],
	]
	if d.has("pierce") and d["pierce"][tier] > 0:
		lines.append("Pierce %d" % d["pierce"][tier])
	if d.has("bounce"):
		lines.append("Bounces %d" % d["bounce"][tier])
	if d.has("explode"):
		lines.append("Blast radius %d" % d["explode"][tier])
	if d.has("burn"):
		lines.append("Burn %d over 3s" % d["burn"][tier])
	return "\n".join(lines)


func _rich(text: String, width := 0.0) -> RichTextLabel:
	var r := RichTextLabel.new()
	r.bbcode_enabled = true
	r.fit_content = true
	r.scroll_active = false
	r.text = text
	r.add_theme_font_size_override("normal_font_size", 15)
	if width > 0.0:
		r.custom_minimum_size.x = width
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return r


func _stats_panel(pairs_per_row := 1) -> Control:
	var p := PanelContainer.new()
	p.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 2)
	p.add_child(v)
	v.add_child(_label("Stats", 20, ACCENT))
	var grid := GridContainer.new()
	grid.columns = 2 * pairs_per_row
	grid.add_theme_constant_override("h_separation", 18)
	v.add_child(grid)
	for k in GameData.STAT_ORDER:
		var val := game.stat(k)
		var col := Color.WHITE
		if val > 0 and k != "max_hp":
			col = GOOD
		elif val < 0:
			col = BAD
		grid.add_child(_label(GameData.STAT_NAMES[k], 14, Color(1, 1, 1, 0.7)))
		var vl := _label(str(int(val)), 14, col)
		vl.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		grid.add_child(vl)
	return p


func show_shop() -> void:
	hud.visible = false
	var m := _overlay()
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 20)
	m.add_child(h)

	var left := VBoxContainer.new()
	left.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	left.add_theme_constant_override("separation", 14)
	h.add_child(left)

	var head := HBoxContainer.new()
	left.add_child(head)
	var title := _label("NIGHT MARKET  ·  wave %d cleared" % game.wave, 30, ACCENT)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	head.add_child(title)
	head.add_child(_label("● %d" % game.coins, 30, Color(1.0, 0.85, 0.3)))

	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 12)
	left.add_child(row)
	for i in game.shop_offers.size():
		row.add_child(_offer_card(i))

	var actions := HBoxContainer.new()
	actions.add_theme_constant_override("separation", 12)
	left.add_child(actions)
	var rp := game.reroll_price()
	actions.add_child(_button("Reroll  ● %d" % rp, game.reroll, game.coins < rp))
	var spacer := Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	actions.add_child(spacer)
	var go := _button("Start wave %d  ▶" % (game.wave + 1), game.next_wave)
	go.custom_minimum_size = Vector2(240, 48)
	go.add_theme_font_size_override("font_size", 22)
	actions.add_child(go)

	# owned weapons
	left.add_child(_label("Weapons (%d/%d)" % [game.weapon_slots.size(), GameData.MAX_WEAPONS], 20))
	var wrow := HBoxContainer.new()
	wrow.add_theme_constant_override("separation", 8)
	left.add_child(wrow)
	for s in game.weapon_slots.size():
		var w: Dictionary = game.weapon_slots[s]
		var tc: Color = GameData.TIER_COLORS[w["tier"]]
		var wp := PanelContainer.new()
		wp.add_theme_stylebox_override("panel", _box(PANEL, tc, 8, 8))
		wp.custom_minimum_size = Vector2(136, 0)
		wrow.add_child(wp)
		var wv := VBoxContainer.new()
		wp.add_child(wv)
		wv.add_child(_label(GameData.WEAPONS[w["id"]]["name"], 15, tc))
		wv.add_child(_label("Tier " + GameData.TIER_NAMES[w["tier"]], 12, Color(1, 1, 1, 0.6)))
		if game.combinable(s) >= 0:
			wv.add_child(_button("Combine", game.combine_weapon.bind(s)))
		wv.add_child(_button("Sell ● %d" % game.sell_price(s), game.sell_weapon.bind(s), game.weapon_slots.size() <= 1))

	# owned items
	var counts := {}
	for id in game.items:
		counts[id] = counts.get(id, 0) + 1
	var parts: Array = []
	for id in counts:
		var it: Dictionary = GameData.ITEMS[id]
		parts.append("[color=#%s]%s[/color]%s" % [GameData.item_color(it["rarity"]).to_html(false), it["name"], " ×%d" % counts[id] if counts[id] > 1 else ""])
	left.add_child(_label("Items", 20))
	left.add_child(_rich("  ·  ".join(parts) if parts.size() > 0 else "[color=#888888]none yet[/color]"))

	h.add_child(_stats_panel())
	_focus_first(actions)


func _offer_card(i: int) -> Control:
	var o: Dictionary = game.shop_offers[i]
	var tc: Color = GameData.TIER_COLORS[o["tier"]]
	var card := PanelContainer.new()
	card.custom_minimum_size = Vector2(205, 300)
	card.add_theme_stylebox_override("panel", _box(PANEL, Color(1, 1, 1, 0.9) if o["locked"] else tc))
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 6)
	card.add_child(v)
	if o["sold"]:
		var sold := _label("SOLD", 28, Color(1, 1, 1, 0.3))
		sold.size_flags_vertical = Control.SIZE_EXPAND_FILL
		sold.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		sold.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		v.add_child(sold)
		return card
	var name_text := ""
	var body := ""
	var kind_text := ""
	if o["type"] == "weapon":
		name_text = GameData.WEAPONS[o["id"]]["name"]
		kind_text = "Weapon · Tier %s · %s" % [GameData.TIER_NAMES[o["tier"]], GameData.WEAPONS[o["id"]]["kind"].capitalize()]
		body = _weapon_text(o["id"], o["tier"])
	else:
		var it: Dictionary = GameData.ITEMS[o["id"]]
		name_text = it["name"]
		kind_text = "Item · Tier %s" % GameData.TIER_NAMES[o["tier"]]
		body = _stat_lines(it["stats"])
	var nl := _label(name_text, 20, tc)
	nl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(nl)
	v.add_child(_label(kind_text, 12, Color(1, 1, 1, 0.55)))
	var b := _rich(body, 180)
	b.size_flags_vertical = Control.SIZE_EXPAND_FILL
	v.add_child(b)
	var price := game.offer_price(o)
	var blocked: bool = o["type"] == "weapon" and not game.can_take_weapon(o["id"], o["tier"])
	var buy := _button("Buy  ● %d" % price if not blocked else "No free slot", game.buy_offer.bind(i), game.coins < price or blocked)
	v.add_child(buy)
	v.add_child(_button("Unlock" if o["locked"] else "Lock", game.toggle_lock.bind(i)))
	return card


# ------------------------------------------------------------------ pause / game over

func show_pause() -> void:
	var m := _overlay()
	var h := HBoxContainer.new()
	h.alignment = BoxContainer.ALIGNMENT_CENTER
	h.add_theme_constant_override("separation", 30)
	m.add_child(h)
	var v := VBoxContainer.new()
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	v.add_theme_constant_override("separation", 14)
	h.add_child(v)
	v.add_child(_label("PAUSED", 48, ACCENT))
	v.add_child(_button("Resume", game.toggle_pause))
	v.add_child(_button("Abandon run", game.back_to_menu))
	h.add_child(_stats_panel())
	_focus_first(v)


func show_game_over(won: bool) -> void:
	hud.visible = false
	var m := _overlay()
	var v := VBoxContainer.new()
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	v.add_theme_constant_override("separation", 16)
	m.add_child(v)
	var t := _label("THE MARKET STANDS!" if won else "THE GHOSTS FEAST", 52, GOOD if won else BAD)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(t)
	var msg := "You held the night market through all %d waves of Ghost Month." % GameData.MAX_WAVES if won \
		else "You fell on wave %d." % game.wave
	var l := _label(msg, 20)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(l)
	var s := _label("Character: %s   ·   Level %d   ·   Ghosts sent home: %d   ·   Coins earned: %d" % [
		GameData.CHARACTERS[game.character_id]["name"], game.level, game.kills, game.coins_earned], 16, Color(1, 1, 1, 0.75))
	s.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(s)
	var b := _button("Play again", game.back_to_menu)
	b.custom_minimum_size = Vector2(220, 50)
	b.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	v.add_child(b)
	_focus_first(v)
