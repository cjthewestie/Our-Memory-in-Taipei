class_name FloatText
extends Node2D
## Damage / heal numbers that rise and fade.

var text := ""
var color := Color.WHITE
var size := 1.0
var life := 0.7
var dead := false
var vel := Vector2(0, -70)


func setup(pos: Vector2, s: String, c: Color, scale_mult := 1.0) -> void:
	position = pos
	text = s
	color = c
	size = scale_mult
	vel.x = randf_range(-20, 20)
	z_index = 50


func tick(delta: float) -> void:
	life -= delta
	position += vel * delta
	vel.y += 120.0 * delta
	if life <= 0.0:
		dead = true
	queue_redraw()


func _draw() -> void:
	var font := ThemeDB.fallback_font
	var fs := int(18 * size)
	var a := clampf(life / 0.3, 0.0, 1.0)
	var w := font.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x
	draw_string_outline(font, Vector2(-w / 2, 0), text, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, 4, Color(0, 0, 0, a))
	draw_string(font, Vector2(-w / 2, 0), text, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, Color(color, a))
