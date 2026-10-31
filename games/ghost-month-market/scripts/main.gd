class_name Game
extends Node2D
## Run state and the main loop: waves, spawning, collisions, level-ups and the shop.

enum State { MENU, WAVE, LEVELUP, SHOP, PAUSED, GAMEOVER }

var state := State.MENU
var rng := RandomNumberGenerator.new()
var autoplay := false
var god_mode := false

# --- run state ---
var character_id := ""
var stats := {}
var level_stats := {}
var items: Array = []          # item ids, duplicates allowed
var weapon_slots: Array = []   # [{id, tier}]
var coins := 0
var xp := 0
var level := 0
var pending_levels := 0
var wave := 1
var wave_time := 0.0
var spawn_acc := 0.0
var shop_offers: Array = []    # [{type, id, tier, locked, sold}]
var reroll_count := 0
var kills := 0
var coins_earned := 0
var boss_alive := false
var _perf_us := 0
var _perf_frames := 0

# --- world ---
var world: Node2D
var arena: Arena
var player: Player
var camera: Camera2D
var ui: GameUI
var sound: Sfx
var enemies: Array = []
var projectiles: Array = []
var pickups: Array = []
var effects: Array = []
var telegraphs: Array = []     # [{pos, t, kind}]
var shake := 0.0
var grid := {}
const CELL := 96.0


func _ready() -> void:
	rng.randomize()
	autoplay = "--autoplay" in OS.get_cmdline_user_args()
	god_mode = "--god" in OS.get_cmdline_user_args()
	world = Node2D.new()
	add_child(world)
	arena = Arena.new()
	world.add_child(arena)
	camera = Camera2D.new()
	camera.position_smoothing_enabled = true
	camera.position_smoothing_speed = 8.0
	add_child(camera)
	sound = Sfx.new()
	add_child(sound)
	ui = GameUI.new()
	ui.game = self
	add_child(ui)
	ui.show_character_select()
	if autoplay:
		start_run(GameData.CHARACTERS.keys()[rng.randi() % GameData.CHARACTERS.size()])


# ------------------------------------------------------------------ stats

func stat(key: String) -> float:
	return float(stats.get(key, 0))


func recompute_stats() -> void:
	stats = GameData.BASE_STATS.duplicate()
	var c: Dictionary = GameData.CHARACTERS[character_id]["stats"]
	for k in c:
		stats[k] += c[k]
	for id in items:
		var s: Dictionary = GameData.ITEMS[id]["stats"]
		for k in s:
			stats[k] += s[k]
	for k in level_stats:
		stats[k] += level_stats[k]
	stats["max_hp"] = maxi(1, int(stats["max_hp"]))
	if player:
		var old_max := player.max_hp
		player.max_hp = stats["max_hp"]
		if player.max_hp > old_max:
			player.hp += player.max_hp - old_max
		player.hp = minf(player.hp, player.max_hp)


# ------------------------------------------------------------------ run flow

func start_run(char_id: String) -> void:
	character_id = char_id
	level_stats = {}
	items = []
	weapon_slots = [{"id": GameData.CHARACTERS[char_id]["weapon"], "tier": 0}]
	coins = 0
	xp = 0
	level = 0
	pending_levels = 0
	wave = 1
	kills = 0
	coins_earned = 0
	shop_offers = []
	if player:
		player.queue_free()
	player = Player.new()
	player.setup(self, GameData.CHARACTERS[char_id]["color"])
	world.add_child(player)
	recompute_stats()
	player.hp = player.max_hp
	player.rebuild_weapons(weapon_slots)
	start_wave()


func start_wave() -> void:
	_clear_world()
	state = State.WAVE
	wave_time = GameData.wave_duration(wave)
	spawn_acc = 0.0
	boss_alive = false
	reroll_count = 0
	player.position = Vector2.ZERO
	player.hp = player.max_hp
	player.invuln = 1.0
	player.rebuild_weapons(weapon_slots)
	camera.position = Vector2.ZERO
	camera.reset_smoothing()
	if wave == 10 or wave == 15:
		queue_spawn("elite", Vector2(0, -400))
		boss_alive = true
	if wave == GameData.MAX_WAVES:
		queue_spawn("ghost_king", Vector2(0, -450))
		boss_alive = true
	ui.show_hud()
	ui.banner("Wave %d" % wave if wave < GameData.MAX_WAVES else "Final Wave — the Ghost King")


func end_wave() -> void:
	# Leftover coins are swept into your pocket; harvest pays out.
	for pk in pickups:
		if not pk.dead and pk.kind == "coin":
			_gain_coins(pk.value)
	var h := int(stat("harvest"))
	if h > 0:
		_gain_coins(h)
	_clear_world()
	sound.play("wave")
	if wave >= GameData.MAX_WAVES:
		state = State.GAMEOVER
		ui.show_game_over(true)
		return
	if pending_levels > 0:
		state = State.LEVELUP
		ui.show_level_up(_roll_level_choices())
	else:
		open_shop()


func _clear_world() -> void:
	for arr in [enemies, projectiles, pickups, effects]:
		for n in arr:
			n.queue_free()
		arr.clear()
	telegraphs.clear()


func game_over() -> void:
	state = State.GAMEOVER
	sound.play("die")
	ui.show_game_over(false)


func back_to_menu() -> void:
	_clear_world()
	if player:
		player.queue_free()
		player = null
	state = State.MENU
	ui.show_character_select()


func toggle_pause() -> void:
	if state == State.WAVE:
		state = State.PAUSED
		ui.show_pause()
	elif state == State.PAUSED:
		state = State.WAVE
		ui.show_hud()


# ------------------------------------------------------------------ main loop

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel") or (event is InputEventKey and event.pressed and not event.echo and event.physical_keycode == KEY_P):
		toggle_pause()


func _process(delta: float) -> void:
	delta = minf(delta, 1.0 / 20.0)
	if state == State.WAVE:
		var t0 := Time.get_ticks_usec()
		_tick_wave(delta)
		if autoplay:
			_perf_us += Time.get_ticks_usec() - t0
			_perf_frames += 1
	if autoplay:
		_autoplay_menus()
	shake = maxf(0.0, shake - delta * 30.0)
	if player:
		camera.position = player.position
	camera.offset = Vector2(rng.randf_range(-1, 1), rng.randf_range(-1, 1)) * shake
	ui.update_hud()


func _input_dir() -> Vector2:
	var v := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	if Input.is_physical_key_pressed(KEY_A): v.x -= 1
	if Input.is_physical_key_pressed(KEY_D): v.x += 1
	if Input.is_physical_key_pressed(KEY_W): v.y -= 1
	if Input.is_physical_key_pressed(KEY_S): v.y += 1
	if autoplay:
		v = _autoplay_dir()
	return v.limit_length(1.0)


func _tick_wave(delta: float) -> void:
	wave_time -= delta
	var dur := GameData.wave_duration(wave)
	var progress := 1.0 - wave_time / dur
	spawn_acc += delta * GameData.spawn_rate(wave) * (0.65 + 0.7 * progress)
	while spawn_acc >= 1.0:
		spawn_acc -= 1.0
		_spawn_group()

	for i in range(telegraphs.size() - 1, -1, -1):
		var tg: Dictionary = telegraphs[i]
		tg["t"] -= delta
		if tg["t"] <= 0.0:
			_spawn_enemy(tg["kind"], tg["pos"])
			telegraphs.remove_at(i)

	_build_grid()
	player.tick(delta, _input_dir())
	for e in enemies:
		if not e.dead:
			e.tick(delta)
	_separate_enemies()
	for p in projectiles:
		if not p.dead:
			p.tick(delta)
	for pk in pickups:
		if not pk.dead:
			pk.tick(delta)
	for fx in effects:
		fx.tick(delta)
	_reap()
	queue_redraw()

	if player.hp <= 0.0:
		game_over()
		return
	if wave_time <= 0.0 or (wave == GameData.MAX_WAVES and not boss_alive and wave_time < dur - 2.0):
		end_wave()


func _reap() -> void:
	for arr in [enemies, projectiles, pickups, effects]:
		var i := 0
		while i < arr.size():
			if arr[i].dead:
				arr[i].queue_free()
				arr[i] = arr[arr.size() - 1]
				arr.pop_back()
			else:
				i += 1


func _draw() -> void:
	# spawn telegraphs: red crosses where ghosts are about to appear
	for tg in telegraphs:
		var p: Vector2 = tg["pos"]
		var k: float = clampf(tg["t"] / 0.9, 0.0, 1.0)
		var s := 12.0 + 6.0 * sin(k * 20.0)
		var c := Color(1.0, 0.25, 0.25, 0.9)
		draw_line(p + Vector2(-s, -s), p + Vector2(s, s), c, 4.0)
		draw_line(p + Vector2(-s, s), p + Vector2(s, -s), c, 4.0)


# ------------------------------------------------------------------ spawning

func queue_spawn(kind: String, pos: Vector2) -> void:
	var half := GameData.ARENA_SIZE / 2.0 - Vector2(40, 40)
	telegraphs.append({"pos": pos.clamp(-half, half), "t": 0.9, "kind": kind})


func _spawn_group() -> void:
	var table := GameData.wave_spawn_table(wave)
	var kind := _weighted_pick(table)
	var half := GameData.ARENA_SIZE / 2.0 - Vector2(60, 60)
	var center := Vector2.ZERO
	for attempt in 12:
		center = Vector2(rng.randf_range(-half.x, half.x), rng.randf_range(-half.y, half.y))
		if center.distance_to(player.position) > 330.0:
			break
	var count := 1
	if kind == "wisp":
		count = rng.randi_range(1, 2 + wave / 5)
	for i in count:
		queue_spawn(kind, center + Vector2(rng.randf_range(-50, 50), rng.randf_range(-50, 50)))


func _spawn_enemy(kind: String, pos: Vector2) -> void:
	if enemies.size() > 260 and kind == "wisp":
		return
	var e := Enemy.new()
	e.setup(self, kind, wave)
	e.position = pos
	world.add_child(e)
	enemies.append(e)


func _weighted_pick(table: Dictionary) -> String:
	var total := 0.0
	for k in table:
		total += table[k]
	var r := rng.randf() * total
	for k in table:
		r -= table[k]
		if r <= 0.0:
			return k
	return table.keys()[0]


func on_enemy_killed(e: Enemy) -> void:
	kills += 1
	spawn_fx(e.position, e.radius, e.color, "puff")
	sound.play("kill")
	if e.is_boss:
		add_shake(14.0)
		boss_alive = false
		for other in enemies:
			if other.is_boss and not other.dead:
				boss_alive = true
	var n: int = e.data["coins"]
	for i in n:
		var amt := 1
		if rng.randf() * 100.0 < stat("luck") * 0.5:
			amt = 2
		var pk := Pickup.new()
		pk.setup(self, "coin", e.position, amt)
		world.add_child(pk)
		pickups.append(pk)
	if rng.randf() * 100.0 < 1.5 + stat("luck") * 0.08:
		var pk := Pickup.new()
		pk.setup(self, "dumpling", e.position)
		world.add_child(pk)
		pickups.append(pk)


func collect(pk: Pickup) -> void:
	if pk.kind == "coin":
		_gain_coins(pk.value)
		sound.play("coin")
	else:
		player.heal(3.0 + float(wave) * 0.15)
		sound.play("heal")


func _gain_coins(n: int) -> void:
	coins += n
	coins_earned += n
	xp += n
	while xp >= GameData.xp_to_level(level):
		xp -= GameData.xp_to_level(level)
		level += 1
		pending_levels += 1
		level_stats["max_hp"] = level_stats.get("max_hp", 0) + 1
		recompute_stats()
		if state == State.WAVE:
			float_text(player.position + Vector2(0, -50), "LEVEL UP!", Color(0.6, 1.0, 0.6), 1.4)
			sound.play("level")


# ------------------------------------------------------------------ queries

func _build_grid() -> void:
	grid.clear()
	for e in enemies:
		if e.dead:
			continue
		var key := Vector2i(floori(e.position.x / CELL), floori(e.position.y / CELL))
		if grid.has(key):
			grid[key].append(e)
		else:
			grid[key] = [e]


func enemies_near(pos: Vector2, r: float) -> Array:
	var out: Array = []
	var x0 := floori((pos.x - r) / CELL)
	var x1 := floori((pos.x + r) / CELL)
	var y0 := floori((pos.y - r) / CELL)
	var y1 := floori((pos.y + r) / CELL)
	for gx in range(x0, x1 + 1):
		for gy in range(y0, y1 + 1):
			var cell = grid.get(Vector2i(gx, gy))
			if cell:
				out.append_array(cell)
	return out


func nearest_enemy(pos: Vector2, max_dist: float, exclude := {}) -> Enemy:
	var best: Enemy = null
	var best_d := max_dist * max_dist
	var pool: Array = enemies if max_dist > CELL * 4.0 else enemies_near(pos, max_dist)
	for e in pool:
		if e.dead or e.spawn_t > 0.0 or exclude.has(e.get_instance_id()):
			continue
		var d := pos.distance_squared_to(e.position)
		if d < best_d:
			best_d = d
			best = e
	return best


func _separate_enemies() -> void:
	for e in enemies:
		if e.dead:
			continue
		for o in enemies_near(e.position, e.radius * 2.0):
			if o == e or o.dead:
				continue
			var d: Vector2 = e.position - o.position
			var min_d: float = e.radius + o.radius
			var l2 := d.length_squared()
			if l2 < min_d * min_d and l2 > 0.0001:
				var l := sqrt(l2)
				var push := d / l * (min_d - l) * 0.25
				if not e.is_boss:
					e.position += push
				if not o.is_boss:
					o.position -= push


# ------------------------------------------------------------------ fx / sound helpers

func add_projectile(p: Projectile) -> void:
	world.add_child(p)
	projectiles.append(p)


func spawn_fx(pos: Vector2, r: float, c: Color, kind: String) -> void:
	var fx := Fx.new()
	fx.setup(pos, r, c, kind)
	world.add_child(fx)
	effects.append(fx)


func float_text(pos: Vector2, s: String, c: Color, size := 1.0) -> void:
	if effects.size() > 220:
		return
	var ft := FloatText.new()
	ft.setup(pos, s, c, size)
	world.add_child(ft)
	effects.append(ft)


func add_shake(amount: float) -> void:
	shake = minf(18.0, shake + amount)


func sfx(name: String) -> void:
	sound.play(name)


# ------------------------------------------------------------------ level up

func _roll_tier() -> int:
	var luck := 1.0 + maxf(-50.0, stat("luck")) / 100.0
	var r := rng.randf() * 100.0
	var t4 := maxf(0.0, (wave - 11) * 1.6) * luck
	var t3 := maxf(0.0, (wave - 5) * 3.0) * luck
	var t2 := maxf(0.0, (wave - 1) * 6.0) * luck
	if r < t4:
		return 3
	if r < t4 + t3:
		return 2
	if r < t4 + t3 + t2:
		return 1
	return 0


func _roll_level_choices() -> Array:
	var keys: Array = GameData.LEVEL_UPGRADES.keys()
	keys.shuffle()
	var out: Array = []
	for i in 4:
		var tier := _roll_tier()
		out.append({"stat": keys[i], "tier": tier, "amount": GameData.LEVEL_UPGRADES[keys[i]][tier]})
	return out


func choose_level_up(choice: Dictionary) -> void:
	var k: String = choice["stat"]
	level_stats[k] = level_stats.get(k, 0) + choice["amount"]
	recompute_stats()
	pending_levels -= 1
	sound.play("buy")
	if pending_levels > 0:
		ui.show_level_up(_roll_level_choices())
	else:
		open_shop()


# ------------------------------------------------------------------ shop

func open_shop() -> void:
	state = State.SHOP
	_roll_shop(true)
	ui.show_shop()


func _roll_shop(keep_locked: bool) -> void:
	var fresh: Array = []
	for i in 4:
		if keep_locked and i < shop_offers.size() and shop_offers[i]["locked"] and not shop_offers[i]["sold"]:
			fresh.append(shop_offers[i])
		else:
			fresh.append(_random_offer())
	shop_offers = fresh


func _random_offer() -> Dictionary:
	var tier := _roll_tier()
	if rng.randf() < 0.35:
		var ids: Array = GameData.WEAPONS.keys()
		# Favour weapons the player already owns so combining is possible.
		if weapon_slots.size() > 0 and rng.randf() < 0.35:
			var owned: Dictionary = weapon_slots[rng.randi() % weapon_slots.size()]
			return {"type": "weapon", "id": owned["id"], "tier": mini(tier, 3), "locked": false, "sold": false}
		return {"type": "weapon", "id": ids[rng.randi() % ids.size()], "tier": mini(tier, 3), "locked": false, "sold": false}
	var pool: Array = []
	while pool.is_empty():
		for id in GameData.ITEMS:
			if GameData.ITEMS[id]["rarity"] == tier:
				pool.append(id)
		tier -= 1
	var pick: String = pool[rng.randi() % pool.size()]
	return {"type": "item", "id": pick, "tier": GameData.ITEMS[pick]["rarity"], "locked": false, "sold": false}


func offer_price(o: Dictionary) -> int:
	if o["type"] == "weapon":
		return GameData.weapon_price(o["id"], o["tier"], wave)
	return GameData.price_for(GameData.ITEMS[o["id"]]["price"], wave)


func reroll_price() -> int:
	return maxi(1, int(wave * 0.75)) + reroll_count * maxi(1, wave / 2)


func can_take_weapon(id: String, tier: int) -> bool:
	if weapon_slots.size() < GameData.MAX_WEAPONS:
		return true
	if tier >= 3:
		return false
	for w in weapon_slots:
		if w["id"] == id and w["tier"] == tier:
			return true
	return false


func buy_offer(i: int) -> void:
	var o: Dictionary = shop_offers[i]
	if o["sold"]:
		return
	var price := offer_price(o)
	if coins < price:
		return
	if o["type"] == "weapon":
		if not can_take_weapon(o["id"], o["tier"]):
			return
		if weapon_slots.size() < GameData.MAX_WEAPONS:
			weapon_slots.append({"id": o["id"], "tier": o["tier"]})
		else:
			for w in weapon_slots:
				if w["id"] == o["id"] and w["tier"] == o["tier"]:
					w["tier"] += 1
					break
	else:
		items.append(o["id"])
		recompute_stats()
	coins -= price
	o["sold"] = true
	o["locked"] = false
	sound.play("buy")
	ui.show_shop()


func toggle_lock(i: int) -> void:
	shop_offers[i]["locked"] = not shop_offers[i]["locked"]
	ui.show_shop()


func reroll() -> void:
	var p := reroll_price()
	if coins < p:
		return
	coins -= p
	reroll_count += 1
	_roll_shop(true)
	sound.play("buy")
	ui.show_shop()


func combinable(slot: int) -> int:
	## Returns index of another weapon this one can merge with, or -1.
	var w: Dictionary = weapon_slots[slot]
	if w["tier"] >= 3:
		return -1
	for j in weapon_slots.size():
		if j != slot and weapon_slots[j]["id"] == w["id"] and weapon_slots[j]["tier"] == w["tier"]:
			return j
	return -1


func combine_weapon(slot: int) -> void:
	var j := combinable(slot)
	if j < 0:
		return
	weapon_slots[slot]["tier"] += 1
	weapon_slots.remove_at(j)
	sound.play("level")
	ui.show_shop()


func sell_price(slot: int) -> int:
	var w: Dictionary = weapon_slots[slot]
	return maxi(1, GameData.weapon_price(w["id"], w["tier"], wave) / 3)


func sell_weapon(slot: int) -> void:
	if weapon_slots.size() <= 1:
		return
	coins += sell_price(slot)
	weapon_slots.remove_at(slot)
	sound.play("coin")
	ui.show_shop()


func next_wave() -> void:
	wave += 1
	start_wave()


# ------------------------------------------------------------------ autoplay (headless smoke test)

func _autoplay_dir() -> Vector2:
	var away := Vector2.ZERO
	var melee: bool = GameData.WEAPONS[weapon_slots[0]["id"]]["kind"] == "melee"
	for e in enemies_near(player.position, 110.0 if melee else 260.0):
		var d: Vector2 = player.position - e.position
		away += d.normalized() / maxf(d.length(), 20.0) * 100.0
	for p in projectiles:
		if p.hostile and p.position.distance_to(player.position) < 120.0:
			away += (player.position - p.position).normalized()
	var to_center := -player.position / (GameData.ARENA_SIZE.x / 2.0)
	return (away + to_center * 0.6)


func _autoplay_menus() -> void:
	match state:
		State.LEVELUP:
			choose_level_up(_roll_level_choices()[0])
		State.SHOP:
			for i in 4:
				if not shop_offers[i]["sold"] and coins >= offer_price(shop_offers[i]):
					buy_offer(i)
			for s in weapon_slots.size():
				if s < weapon_slots.size() and combinable(s) >= 0:
					combine_weapon(s)
			print("wave %d done  lvl %d  coins %d  weapons %s  hp %d/%d  kills %d  tick %.2fms  enemies-left %d" % [wave, level, coins, str(weapon_slots), player.hp, player.max_hp, kills, _perf_us / 1000.0 / maxi(1, _perf_frames), enemies.size()])
			_perf_us = 0
			_perf_frames = 0
			next_wave()
		State.GAMEOVER:
			print("summary: level %d, items %d" % [level, items.size()])
			print("RUN OVER at wave %d (kills %d)" % [wave, kills])
			get_tree().quit()
