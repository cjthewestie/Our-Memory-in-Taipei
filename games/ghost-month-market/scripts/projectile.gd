class_name Projectile
extends Node2D
## A bullet. Player projectiles hit enemies; hostile ones hit the player.

var game: Game
var kind := ""
var hostile := false
var velocity := Vector2.ZERO
var damage := 1.0
var crit := false
var travel_left := 400.0
var radius := 6.0
var pierce := 0
var bounce := 0
var explode := 0.0
var burn := 0.0
var color := Color.WHITE
var dead := false
var hit_ids := {}
var age := 0.0


func setup_player(g: Game, weapon_id: String, pos: Vector2, vel: Vector2, dmg: float, is_crit: bool, max_dist: float) -> void:
	game = g
	kind = weapon_id
	position = pos
	velocity = vel
	damage = dmg
	crit = is_crit
	travel_left = max_dist
	rotation = vel.angle()
	match kind:
		"chopsticks": radius = 6.0
		"slingshot": radius = 7.0
		"firecracker": radius = 8.0
		"lantern": radius = 9.0


func setup_hostile(g: Game, pos: Vector2, vel: Vector2, dmg: float) -> void:
	game = g
	kind = "spit"
	hostile = true
	position = pos
	velocity = vel
	damage = dmg
	travel_left = 1400.0
	radius = 9.0
	color = Color(0.8, 0.45, 1.0)


func tick(delta: float) -> void:
	age += delta
	queue_redraw()
	var step := velocity * delta
	position += step
	travel_left -= step.length()
	var half := GameData.ARENA_SIZE / 2.0
	if travel_left <= 0.0 or absf(position.x) > half.x + 40.0 or absf(position.y) > half.y + 40.0:
		if explode > 0.0 and not hostile:
			_explode()
		dead = true
		return

	if hostile:
		var p := game.player
		if position.distance_to(p.global_position) < radius + Player.RADIUS - 4.0:
			p.take_hit(damage)
			dead = true
		return

	for e in game.enemies_near(position, radius + 70.0):
		if e.dead or hit_ids.has(e.get_instance_id()):
			continue
		if position.distance_to(e.global_position) < radius + e.radius:
			_hit(e)
			if dead:
				return


func _hit(e: Enemy) -> void:
	hit_ids[e.get_instance_id()] = true
	if explode > 0.0:
		_explode()
		dead = true
		return
	e.take_damage(damage, crit)
	e.knock(velocity.normalized() * 40.0)
	if burn > 0.0:
		e.ignite(burn)
	game.player.try_lifesteal(0.0)
	if bounce > 0:
		var next: Enemy = game.nearest_enemy(position, 320.0, hit_ids)
		if next:
			bounce -= 1
			velocity = (next.global_position - position).normalized() * velocity.length()
			rotation = velocity.angle()
			travel_left = maxf(travel_left, 360.0)
			damage = roundf(damage * 0.8)
			return
	if pierce > 0:
		pierce -= 1
		damage = roundf(damage * 0.85)
		return
	dead = true


func _explode() -> void:
	game.spawn_fx(position, explode, Color(1.0, 0.6, 0.2), "boom")
	game.add_shake(2.5)
	for e in game.enemies_near(position, explode + 60.0):
		if e.dead:
			continue
		if position.distance_to(e.global_position) < explode + e.radius:
			e.take_damage(damage, crit)
			e.knock((e.global_position - position).normalized() * 120.0)
	game.player.try_lifesteal(0.0)
	game.sfx("boom")


func _draw() -> void:
	match kind:
		"chopsticks":
			draw_line(Vector2(-12, 0), Vector2(10, 0), color, 3.0)
		"slingshot":
			draw_circle(Vector2.ZERO, radius, color.darkened(0.3))
			draw_circle(Vector2(-2, -2), radius * 0.45, Color(1, 1, 1, 0.7))
		"firecracker":
			draw_rect(Rect2(-8, -4, 16, 8), color)
			var flick := 3.0 + sin(age * 40.0) * 2.0
			draw_circle(Vector2(-10, 0), flick, Color(1, 0.9, 0.4))
		"lantern":
			draw_circle(Vector2.ZERO, radius + 4.0, Color(1, 0.5, 0.1, 0.25))
			draw_circle(Vector2.ZERO, radius, color)
			draw_circle(Vector2.ZERO, radius * 0.5, Color(1, 0.95, 0.6))
		"spit":
			draw_circle(Vector2.ZERO, radius + 3.0, Color(color, 0.3))
			draw_circle(Vector2.ZERO, radius, color)
			draw_circle(Vector2.ZERO, radius * 0.45, Color(1, 0.9, 1))
		_:
			draw_circle(Vector2.ZERO, radius, color)
