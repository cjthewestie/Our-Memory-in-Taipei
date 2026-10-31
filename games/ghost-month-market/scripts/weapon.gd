class_name Weapon
extends Node2D
## A weapon held by the player. Auto-aims at the nearest enemy in range and
## either fires a projectile (ranged) or swings through an arc (melee).

var game: Game
var id := ""
var tier := 0
var data: Dictionary
var home := Vector2.ZERO
var cooldown := 0.0
var aim := 0.0
var swing_t := 0.0
var recoil := 0.0
const SWING_TIME := 0.18


func setup(g: Game, weapon_id: String, weapon_tier: int) -> void:
	game = g
	id = weapon_id
	tier = weapon_tier
	data = GameData.WEAPONS[id]
	cooldown = randf_range(0.1, 0.5)


static func compute_damage(g: Game, d: Dictionary, t: int) -> float:
	var dmg: float = d["damage"][t]
	var scaling: Dictionary = d["scaling"]
	for s in scaling:
		dmg += g.stat(s) * float(scaling[s])
	dmg *= 1.0 + g.stat("damage") / 100.0
	return maxf(1.0, dmg)


static func compute_cooldown(g: Game, d: Dictionary, t: int) -> float:
	var atk := maxf(-60.0, g.stat("attack_speed"))
	return maxf(0.08, float(d["cooldown"][t]) / (1.0 + atk / 100.0))


static func compute_range(g: Game, d: Dictionary) -> float:
	var r: float = d["range"]
	if d["kind"] == "melee":
		return maxf(60.0, r + g.stat("range") * 0.5)
	return maxf(100.0, r + g.stat("range"))


func tick(delta: float) -> void:
	cooldown -= delta
	swing_t = maxf(0.0, swing_t - delta)
	recoil = maxf(0.0, recoil - delta * 6.0)
	var rng_dist := compute_range(game, data)
	var target: Enemy = game.nearest_enemy(global_position, rng_dist)
	if target:
		var want := (target.global_position - global_position).angle()
		aim = lerp_angle(aim, want, minf(1.0, delta * 18.0))
		if cooldown <= 0.0 and absf(angle_difference(aim, want)) < 0.5:
			cooldown = compute_cooldown(game, data, tier)
			if data["kind"] == "melee":
				_swing(rng_dist)
			else:
				_shoot(target, rng_dist)
	elif game.player.move_dir.length_squared() > 0.01:
		aim = lerp_angle(aim, game.player.move_dir.angle(), minf(1.0, delta * 8.0))

	var thrust := Vector2.ZERO
	if swing_t > 0.0:
		var k := swing_t / SWING_TIME
		thrust = Vector2.from_angle(aim) * sin(k * PI) * 26.0
	position = home + thrust - Vector2.from_angle(aim) * recoil * 6.0
	queue_redraw()


func _roll_hit() -> Array:
	var dmg := compute_damage(game, data, tier)
	var crit := game.rng.randf() * 100.0 < game.stat("crit")
	if crit:
		dmg *= float(data["crit_mult"])
	return [roundf(dmg), crit]


func _shoot(target: Enemy, rng_dist: float) -> void:
	recoil = 1.0
	var spread := 0.0
	var count := 1
	if id == "chopsticks":
		count = 2
		spread = 0.09
	for i in count:
		var hit := _roll_hit()
		var p := Projectile.new()
		var ang := aim + (float(i) - (count - 1) / 2.0) * spread
		p.setup_player(game, id, global_position + Vector2.from_angle(ang) * 14.0, Vector2.from_angle(ang) * float(data["speed"]),
			hit[0], hit[1], rng_dist * 1.15)
		p.pierce = data.get("pierce", [0, 0, 0, 0])[tier]
		p.bounce = data.get("bounce", [0, 0, 0, 0])[tier]
		p.explode = data.get("explode", [0, 0, 0, 0])[tier] * (1.0 + game.stat("elemental") * 0.01)
		p.burn = data.get("burn", [0, 0, 0, 0])[tier] + game.stat("elemental") * 0.5 if data.has("burn") else 0.0
		p.color = data["color"]
		game.add_projectile(p)
	game.sfx("shoot")


func _swing(rng_dist: float) -> void:
	swing_t = SWING_TIME
	var half_arc := deg_to_rad(float(data["arc"]) / 2.0)
	var origin := game.player.global_position
	var hits := 0
	for e in game.enemies_near(origin, rng_dist + 60.0):
		if e.dead:
			continue
		var to: Vector2 = e.global_position - origin
		if to.length() > rng_dist + e.radius:
			continue
		if absf(angle_difference(aim, to.angle())) > half_arc and to.length() > e.radius + 24.0:
			continue
		var hit := _roll_hit()
		e.take_damage(hit[0], hit[1])
		e.knock(to.normalized() * float(data["knockback"]))
		game.player.try_lifesteal(float(data.get("lifesteal_bonus", 0)))
		hits += 1
	if hits > 0:
		game.add_shake(1.5)
	game.sfx("swing")


func _draw() -> void:
	var col: Color = data["color"]
	var flip := 1.0 if absf(angle_difference(aim, 0.0)) < PI / 2.0 else -1.0
	# swing trail drawn in world-aligned space before rotating
	if swing_t > 0.0:
		var k := swing_t / SWING_TIME
		var half_arc := deg_to_rad(float(data["arc"]) / 2.0)
		var r := compute_range(game, data) * 0.75
		var trail := Color(1, 1, 1, 0.35 * k)
		draw_arc(-position, r, aim - half_arc, aim + half_arc, 24, trail, 10.0 * k + 2.0)
	draw_set_transform(Vector2.ZERO, aim, Vector2(1, flip))
	var tc: Color = GameData.TIER_COLORS[tier]
	match id:
		"chopsticks":
			draw_line(Vector2(-6, -3), Vector2(22, -1), col, 3.0)
			draw_line(Vector2(-6, 3), Vector2(22, 1), col, 3.0)
			draw_line(Vector2(-6, -3), Vector2(0, -3), tc, 4.0)
			draw_line(Vector2(-6, 3), Vector2(0, 3), tc, 4.0)
		"slingshot":
			draw_line(Vector2(-8, 0), Vector2(6, 0), col.darkened(0.3), 4.0)
			draw_line(Vector2(6, 0), Vector2(16, -9), col.darkened(0.3), 4.0)
			draw_line(Vector2(6, 0), Vector2(16, 9), col.darkened(0.3), 4.0)
			draw_line(Vector2(16, -9), Vector2(10 - recoil * 6.0, 0), tc, 2.0)
			draw_line(Vector2(16, 9), Vector2(10 - recoil * 6.0, 0), tc, 2.0)
		"firecracker":
			draw_rect(Rect2(-6, -5, 22, 10), col)
			draw_rect(Rect2(-6, -5, 22, 10), tc, false, 2.0)
			draw_line(Vector2(16, 0), Vector2(22, -4), Color(0.9, 0.8, 0.5), 2.0)
		"lantern":
			draw_line(Vector2(-6, 0), Vector2(6, 0), Color(0.4, 0.25, 0.15), 3.0)
			draw_circle(Vector2(14, 0), 10.0, col)
			draw_circle(Vector2(14, 0), 5.0, Color(1, 0.95, 0.6))
			draw_arc(Vector2(14, 0), 10.0, 0, TAU, 16, tc, 2.0)
		"wok":
			draw_line(Vector2(-10, 0), Vector2(6, 0), Color(0.35, 0.2, 0.1), 5.0)
			draw_circle(Vector2(18, 0), 14.0, col.darkened(0.4))
			draw_circle(Vector2(18, 0), 10.0, col)
			draw_arc(Vector2(18, 0), 14.0, 0, TAU, 20, tc, 2.0)
		"cleaver":
			draw_line(Vector2(-8, 0), Vector2(4, 0), Color(0.35, 0.2, 0.1), 5.0)
			draw_rect(Rect2(4, -10, 22, 16), col)
			draw_line(Vector2(4, 6), Vector2(26, 6), tc, 3.0)
		"fan":
			draw_line(Vector2(-6, 0), Vector2(4, 0), Color(0.35, 0.2, 0.1), 4.0)
			var pts := PackedVector2Array([Vector2(4, 0)])
			for i in 9:
				var a := lerpf(-0.9, 0.9, i / 8.0)
				pts.append(Vector2(4, 0) + Vector2.from_angle(a) * 24.0)
			draw_colored_polygon(pts, col)
			draw_polyline(pts.slice(1), tc, 2.0)
	draw_set_transform(Vector2.ZERO)
