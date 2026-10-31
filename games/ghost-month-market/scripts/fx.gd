class_name Fx
extends Node2D
## Short-lived visual: explosion rings, death puffs, spawn markers.

var kind := "puff"
var radius := 30.0
var color := Color.WHITE
var life := 0.35
var max_life := 0.35
var dead := false


func setup(pos: Vector2, r: float, c: Color, fx_kind: String) -> void:
	position = pos
	radius = r
	color = c
	kind = fx_kind
	max_life = 0.3 if kind == "boom" else 0.35
	life = max_life


func tick(delta: float) -> void:
	life -= delta
	if life <= 0.0:
		dead = true
	queue_redraw()


func _draw() -> void:
	var k := 1.0 - life / max_life
	match kind:
		"boom":
			draw_circle(Vector2.ZERO, radius * (0.4 + 0.6 * k), Color(color, 0.45 * (1.0 - k)))
			draw_arc(Vector2.ZERO, radius * (0.5 + 0.5 * k), 0, TAU, 32, Color(1, 0.95, 0.6, 1.0 - k), 4.0)
		"puff":
			for i in 6:
				var a := TAU * i / 6.0
				draw_circle(Vector2.from_angle(a) * radius * k, radius * 0.35 * (1.0 - k), Color(color, 0.8 * (1.0 - k)))
