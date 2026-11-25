PORT ?= 8080
HOST ?= 127.0.0.1

.PHONY: run

run:
	@printf 'Nordic Move → \e]8;;http://%s:%s/\e\\http://%s:%s/\e]8;;\e\\\n' "$(HOST)" "$(PORT)" "$(HOST)" "$(PORT)"
	@python3 -m http.server $(PORT) --bind $(HOST) --directory front
