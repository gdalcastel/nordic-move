PORT ?= 8080
HOST ?= 127.0.0.1

.PHONY: run git

run:
	@printf 'Nordic Move → \e]8;;http://%s:%s/\e\\http://%s:%s/\e]8;;\e\\\n' "$(HOST)" "$(PORT)" "$(HOST)" "$(PORT)"
	@python3 -m http.server $(PORT) --bind $(HOST) --directory front

# Envia o que mudou: stage, commit e push.
# Mensagem opcional: make git MSG="Ajusta o hero no celular."
git:
	@set -e; \
	git add -A -- . ':(exclude,glob)**/.env' ':(exclude,glob)**/.env.*' ':(exclude,glob)**/credentials.json'; \
	if git status --porcelain | grep -Eq '(^|[[:space:]/])\.env($$|[[:space:].])|(^|[[:space:]/])credentials\.json($$|[[:space:]])'; then \
		echo "Arquivos sensíveis ficaram de fora do commit."; \
	fi; \
	if ! git diff --cached --quiet; then \
		if [ -n "$(MSG)" ]; then \
			msg="$(MSG)"; \
		else \
			files=$$(git diff --cached --name-only | awk -F/ '{print $$NF}' | paste -sd ', ' -); \
			msg="Atualiza $$files."; \
		fi; \
		git commit -m "$$msg"; \
	else \
		echo "Nada de novo para commitar."; \
	fi; \
	branch=$$(git rev-parse --abbrev-ref HEAD); \
	if git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then \
		git push; \
	else \
		git push -u origin "$$branch"; \
	fi
