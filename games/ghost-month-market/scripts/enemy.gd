class_name Enemy
extends Node2D
## A hungry ghost. Behaviours: chase, dash (telegraphed charge), shoot (keeps
## distance and spits), boss (big, bullet rings and summons).

var game: Game
var kind := ""
var data: Dictionary
var hp := 1.0
var max_hp := 1.0
var damage := 1.0
var speed := 100.0
var radius := 16.0
var color := Color.WHITE
var behavior := "chase"
var dead := false
var knockback := Vector2.ZERO
var flash := 0.0
var t := 0.0
var spawn_t := 0.0
var burn_dps := 0.0
var burn_time := 0.0
var burn_acc := 0.0
var is_boss := false

# behaviour state
var state := 0
var state_t := 0.0
var dash_dir := Vector2.ZERO
var shoot_t := 0.0
var ring_t := 0.0
var summon_t := 0.0
var strafe := 1.0


func setup(g: Game, enemy_kind: String, wave: int) -> void:
	game = g
	kind = enemy_kind
	data = GameData.ENEMIES[kind]
	var late := 1.0 + maxf(0.0, wave - 10.0) * 0.09
	max_hp = roundf((float(data["hp"]) + float(data["hp_wave"]) * (wave - 1)) * late)
	hp = max_hp
	damage = roundf(float(data["dmg"]) + float(data["dmg_wave"]) * (wave - 1))
	speed = float(data["speed"]) * randf_range(0.9, 1.1) * (1.0 + minf(wave, 20) * 0.01)
	radius = data["radius"]
	color = data["color"]
	behavior = data["behavior"]
	is_boss = behavior == "boss"
	t = randf() * 10.0
	spawn_t = 0.25
	state_t = randf_range(1.0, 2.5)
	shoot_t = randf_range(1.0, 2.5)
	ring_t = 2.5
	summon_t = 5.0
	strafe = 1.0 if randf() < 0.5 else -1.0


func tick(delta: float) -> void:
	t += delta
	spawn_t = maxf(0.0, spawn_t - delta)
	flash = maxf(0.0, flash - delta)
	var p := game.player
	var to_p := p.global_position - global_position
	var dist := to_p.length()
	var dir := to_p / maxf(dist, 0.001)
	var vel := Vector2.ZERO

	match behavior:
		"chase":
			vel = dir * speed
		"dash":
			state_t -= delta
			if state == 0:
				vel = dir * speed
				if state_t <= 0.0 and dist < 520.0:
					state = 1
					state_t = 0.6
			elif state == 1:
				dash_dir = dir
				if state_t <= 0.0:
					state = 2
					state_t = 0.45
			else:
				vel = dash_dir * speed * 5.5
				if state_t <= 0.0:
					state = 0
					state_t = randf_range(1.8, 3.0)
		"shoot":
			if dist > 340.0:
				vel = dir * speed
			elif dist < 240.0:
				vel = -dir * speed
			else:
				vel = dir.orthogonal() * strafe * speed * 0.6
			shoot_t -= delta
			if shoot_t <= 0.0 and dist < 560.0:
				shoot_t = randf_range(2.0, 2.8)
				var b := Projectile.new()
				b.setup_hostile(game, global_position + dir * radius, dir * 270.0, damage)
				game.add_projectile(b)
		"boss":
			vel = dir * speed
			ring_t -= delta
			if ring_t <= 0.0:
				var n := 14 if kind == "elite" else 20
				ring_t = 3.2 if kind == "elite" else 2.4
				var off := randf() * TAU
				for i in n:
					var a := off + TAU * i / n
					var b := Projectile.new()
					b.setup_hostile(game, global_position, Vector2.from_angle(a) * 210.0, roundf(damage * 0.7))
					game.add_projectile(b)
				game.sfx("boom")
			if kind == "ghost_king":
				summon_t -= delta
				if summon_t <= 0.0:
					summon_t = 6.0
					for i in 6:
						game.queue_spawn("wisp" if i % 2 == 0 else "dasher",
							global_position + Vector2.from_angle(TAU * i / 6.0) * 110.0)

	position += (vel + knockback) * delta
	knockback = knockback.move_toward(Vector2.ZERO, 1400.0 * delta)
	var half := GameData.ARENA_SIZE / 2.0 - Vector2(radius, radius)
	position = position.clamp(-half, half)

	if burn_time > 0.0:
		burn_time -= delta
		burn_acc += burn_dps * delta
		if burn_acc >= 1.0:
			var d := floorf(burn_acc)
			burn_acc -= d
			take_damage(d, false, Color(1.0, 0.6, 0.2))

	if not dead and spawn_t <= 0.0 and dist < radius + Player.RADIUS - 4.0:
		p.take_hit(damage)
	queue_redraw()


func take_damage(amount: float, crit: bool, col := Color.WHITE) -> void:
	if dead:
		return
	hp -= amount
	flash = 0.08
	var c := Color(1.0, 0.85, 0.2) if crit else col
	game.float_text(global_position + Vector2(randf_range(-10, 10), -radius - 8), str(int(amount)), c, 1.3 if crit else 1.0)
	if hp <= 0.0:
		dead = true
		game.on_enemy_killed(self)


func knock(v: Vector2) -> void:
	if is_boss:
		v *= 0.1
	elif kind == "glutton":
		v *= 0.4
	knockback += v


func ignite(dps_total: float) -> void:
	# burn deals dps_total damage spread over 3 seconds, refreshing on reapply
	burn_dps = maxf(burn_dps if burn_time > 0.0 else 0.0, dps_total / 3.0)
	burn_time = 3.0


func _draw() -> void:
	var s := 1.0 - spawn_t / 0.25 * 0.6
	var r := radius * s
	var bob := sin(t * 5.0) * 2.0
	# shadow
	draw_set_transform(Vector2(0, r * 0.9), 0.0, Vector2(1.0, 0.3))
	draw_circle(Vector2.ZERO, r * 0.8, Color(0, 0, 0, 0.3))
	draw_set_transform(Vector2(0, bob))

	var c := color
	if flash > 0.0:
		c = Color.WHITE
	elif behavior == "dash" and state == 1:
		c = c.lerp(Color(1, 0.1, 0.1), 0.5 + 0.5 * sin(t * 40.0))
	if burn_time > 0.0:
		draw_circle(Vector2(0, -r * 0.4), r * 1.15, Color(1.0, 0.45, 0.1, 0.25))

	# ghost body: a dome with a wavy hem
	var pts := PackedVector2Array()
	var seg := 14
	for i in seg + 1:
		var a := PI + PI * i / seg
		pts.append(Vector2(cos(a), sin(a)) * r + Vector2(0, -r * 0.1))
	var waves := 4
	for i in waves * 2 + 1:
		var x := r - (2.0 * r) * i / (waves * 2)
		var y := r * 0.75 + (sin(t * 8.0 + i) * 3.0 if i % 2 == 0 else -r * 0.2)
		pts.append(Vector2(x, y))
	draw_colored_polygon(pts, Color(c, 0.92))
	var outline := pts.duplicate()
	outline.append(pts[0])
	draw_polyline(outline, c.darkened(0.45), 2.0)

	# face looks at player
	var look := (game.player.global_position - global_position).normalized() * r * 0.12
	var eye_r := r * 0.2
	var mad := behavior != "chase" or is_boss
	for sx in [-1.0, 1.0]:
		var e := Vector2(sx * r * 0.33, -r * 0.3) + look
		draw_circle(e, eye_r, Color(0.08, 0.05, 0.12))
		draw_circle(e + Vector2(-eye_r * 0.3, -eye_r * 0.3), eye_r * 0.35, Color(1, 1, 1, 0.8))
		if mad:
			draw_line(e + Vector2(-sx * eye_r * 1.2, -eye_r * 1.6), e + Vector2(sx * eye_r * 1.2, -eye_r * 0.9), c.darkened(0.6), 2.5)
	draw_arc(Vector2(0, r * 0.15) + look, r * 0.22, 0.2, PI - 0.2, 8, Color(0.08, 0.05, 0.12), 2.0)

	if kind == "glutton":
		draw_circle(Vector2(0, r * 0.3), r * 0.15, Color(0.08, 0.05, 0.12))
	if is_boss:
		# crown of joss-paper flames
		for i in 5:
			var x := lerpf(-r * 0.6, r * 0.6, i / 4.0)
			var h := r * (0.35 + 0.1 * sin(t * 6.0 + i))
			draw_colored_polygon(PackedVector2Array([Vector2(x - 7, -r * 1.05), Vector2(x + 7, -r * 1.05), Vector2(x, -r * 1.05 - h)]), Color(1.0, 0.85, 0.3))
		# health bar
		draw_set_transform(Vector2.ZERO)
		var w := r * 2.2
		draw_rect(Rect2(-w / 2, -r * 1.7, w, 6), Color(0, 0, 0, 0.6))
		draw_rect(Rect2(-w / 2, -r * 1.7, w * clampf(hp / max_hp, 0, 1), 6), Color(1, 0.3, 0.3))
	draw_set_transform(Vector2.ZERO)
