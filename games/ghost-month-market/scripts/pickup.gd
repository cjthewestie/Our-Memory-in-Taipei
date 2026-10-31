class_name Pickup
extends Node2D
## A dropped coin or a healing dumpling. Drifts to the player once in range.

var game: Game
var kind := "coin"   # "coin" or "dumpling"
var value := 1
var dead := false
var magnet := false
var vel := Vector2.ZERO
var t := 0.0


func setup(g: Game, pickup_kind: String, pos: Vector2, amount := 1) -> void:
	game = g
	kind = pickup_kind
	value = amount
	position = pos
	vel = Vector2.from_angle(randf() * TAU) * randf_range(40.0, 140.0)
	t = randf() * 5.0


func tick(delta: float) -> void:
	t += delta
	var p := game.player
	var to := p.global_position - global_position
	var d := to.length()
	var reach := 90.0 + game.stat("pickup")
	if d < reach:
		magnet = true
	if magnet:
		vel = vel.lerp(to.normalized() * maxf(420.0, p.move_speed() * 1.6), minf(1.0, delta * 8.0))
	else:
		vel = vel.move_toward(Vector2.ZERO, 300.0 * delta)
	position += vel * delta
	if d < 22.0:
		dead = true
		game.collect(self)


func _draw() -> void:
	var bob := sin(t * 4.0) * 2.0
	if kind == "coin":
		draw_circle(Vector2(0, bob), 7.0, Color(0.85, 0.6, 0.1))
		draw_circle(Vector2(0, bob), 5.0, Color(1.0, 0.85, 0.3))
		draw_rect(Rect2(-1.5, bob - 1.5, 3, 3), Color(0.85, 0.6, 0.1))
	else:
		# a little steamed dumpling
		draw_circle(Vector2(0, bob + 2), 11.0, Color(0.95, 0.92, 0.85))
		draw_circle(Vector2(0, bob - 4), 6.0, Color(1, 1, 0.97))
		for i in 3:
			draw_line(Vector2(-6 + i * 6, bob - 8), Vector2(-3 + i * 3, bob - 2), Color(0.8, 0.75, 0.65), 1.5)
