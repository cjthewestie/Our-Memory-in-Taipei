class_name Player
extends Node2D
## The player character. Movement, health, regen, dodge and armor live here.
## Weapons are child nodes arranged in a ring around the body.

const BASE_SPEED := 290.0
const RADIUS := 20.0
const WEAPON_RING := 44.0

var game: Game
var color := Color.WHITE
var hp := 10.0
var max_hp := 10.0
var invuln := 0.0
var hurt_flash := 0.0
var regen_acc := 0.0
var lifesteal_cd := 0.0
var move_dir := Vector2.ZERO
var look_dir := Vector2.RIGHT
var walk_t := 0.0
var weapons: Array[Weapon] = []


func setup(g: Game, body_color: Color) -> void:
	game = g
	color = body_color


func rebuild_weapons(slots: Array) -> void:
	for w in weapons:
		w.queue_free()
	weapons.clear()
	for i in slots.size():
		var w := Weapon.new()
		w.setup(game, slots[i]["id"], slots[i]["tier"])
		add_child(w)
		weapons.append(w)
	_layout_weapons()


func _layout_weapons() -> void:
	var n := weapons.size()
	for i in n:
		var a := TAU * float(i) / float(maxi(n, 1)) - PI / 2.0
		if n == 1:
			a = 0.0
		weapons[i].home = Vector2(cos(a), sin(a)) * WEAPON_RING


func move_speed() -> float:
	return BASE_SPEED * maxf(0.35, 1.0 + game.stat("speed") / 100.0)


func tick(delta: float, input_dir: Vector2) -> void:
	move_dir = input_dir.limit_length(1.0)
	position += move_dir * move_speed() * delta
	var half := GameData.ARENA_SIZE / 2.0 - Vector2(RADIUS, RADIUS)
	position = position.clamp(-half, half)
	if move_dir.length_squared() > 0.01:
		look_dir = move_dir.normalized()
		walk_t += delta * 12.0
	else:
		walk_t = lerpf(walk_t, roundf(walk_t / PI) * PI, delta * 10.0)

	invuln = maxf(0.0, invuln - delta)
	hurt_flash = maxf(0.0, hurt_flash - delta)
	lifesteal_cd = maxf(0.0, lifesteal_cd - delta)

	var regen := game.stat("regen")
	if regen > 0.0 and hp < max_hp:
		# Regen N heals N/5 HP per second.
		regen_acc += regen / 5.0 * delta
		if regen_acc >= 1.0:
			var amt := floorf(regen_acc)
			regen_acc -= amt
			heal(amt)

	for w in weapons:
		w.tick(delta)
	queue_redraw()


func heal(amount: float) -> void:
	if amount <= 0.0 or hp >= max_hp:
		return
	var before := hp
	hp = minf(max_hp, hp + amount)
	if hp - before >= 1.0:
		game.float_text(global_position + Vector2(0, -30), "+%d" % int(hp - before), Color(0.4, 1.0, 0.5))


func try_lifesteal(bonus: float) -> void:
	var chance := game.stat("lifesteal") + bonus
	if chance <= 0.0 or lifesteal_cd > 0.0:
		return
	if game.rng.randf() * 100.0 < chance:
		lifesteal_cd = 0.12
		heal(1.0)


## Returns true if the hit landed.
func take_hit(raw: float) -> bool:
	if invuln > 0.0 or hp <= 0.0 or game.god_mode:
		return false
	var dodge := minf(game.stat("dodge"), 60.0)
	if dodge > 0.0 and game.rng.randf() * 100.0 < dodge:
		invuln = 0.15
		game.float_text(global_position + Vector2(0, -30), "dodge", Color(0.7, 0.9, 1.0))
		return false
	var armor := game.stat("armor")
	var mult := 1.0
	if armor >= 0.0:
		mult = 1.0 / (1.0 + armor / 15.0)
	else:
		mult = 2.0 - 1.0 / (1.0 - armor / 15.0)
	var dmg := maxf(1.0, roundf(raw * mult))
	hp -= dmg
	invuln = 0.4
	hurt_flash = 0.25
	game.add_shake(7.0)
	game.float_text(global_position + Vector2(0, -30), "-%d" % int(dmg), Color(1.0, 0.35, 0.35))
	return true


func _draw() -> void:
	var bob := absf(sin(walk_t)) * 3.0
	var body := Vector2(0, -bob)
	# shadow
	draw_set_transform(Vector2(0, RADIUS - 2), 0.0, Vector2(1.0, 0.35))
	draw_circle(Vector2.ZERO, RADIUS * 0.9, Color(0, 0, 0, 0.35))
	draw_set_transform(Vector2.ZERO)

	var c := color
	if hurt_flash > 0.0:
		c = c.lerp(Color(1, 0.2, 0.2), 0.7)
	if invuln > 0.0 and int(invuln * 20.0) % 2 == 0:
		c.a = 0.55
	# feet
	var step := sin(walk_t) * 5.0
	draw_circle(body + Vector2(-8, RADIUS - 4 + step * 0.3), 5.0, c.darkened(0.4))
	draw_circle(body + Vector2(8, RADIUS - 4 - step * 0.3), 5.0, c.darkened(0.4))
	# body
	draw_circle(body, RADIUS, c.darkened(0.25))
	draw_circle(body + Vector2(0, -2), RADIUS - 3, c)
	# eyes look where we're heading
	var eye_off := look_dir * 4.0
	for sx in [-7.0, 7.0]:
		var e := body + Vector2(sx, -5) + eye_off
		draw_circle(e, 4.5, Color.WHITE)
		draw_circle(e + look_dir * 1.5, 2.3, Color(0.1, 0.1, 0.15))
	# cheeks
	draw_circle(body + Vector2(-11, 3) + eye_off * 0.5, 3.0, Color(1, 0.5, 0.5, 0.5))
	draw_circle(body + Vector2(11, 3) + eye_off * 0.5, 3.0, Color(1, 0.5, 0.5, 0.5))
